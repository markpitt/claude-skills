/**
 * Evaluator-Optimizer Pattern Implementation for C#
 * Iterative refinement with generator and evaluator loop
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;

namespace AgentPatterns
{
    /// <summary>
    /// Evaluation criteria with weight
    /// </summary>
    public class EvaluationCriterion
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double Weight { get; set; } = 1.0;
    }

    /// <summary>
    /// Result of an evaluation
    /// </summary>
    public class EvaluationResult
    {
        public double OverallScore { get; set; }
        public Dictionary<string, double> CriteriaScores { get; set; } = new();
        public string Feedback { get; set; } = string.Empty;
        public List<string> Suggestions { get; set; } = new();
        public bool MeetsThreshold { get; set; }
    }

    /// <summary>
    /// Iteration record for tracking progress
    /// </summary>
    public class IterationRecord
    {
        public int Iteration { get; set; }
        public string Output { get; set; } = string.Empty;
        public EvaluationResult Evaluation { get; set; } = new();
    }

    /// <summary>
    /// Evaluator-Optimizer that iteratively refines output.
    /// 
    /// Example:
    /// <code>
    /// var optimizer = new EvaluatorOptimizer(client);
    /// optimizer.AddCriterion(new EvaluationCriterion 
    ///     { Name = "clarity", Description = "Clear and understandable", Weight = 1.5 });
    /// var result = await optimizer.OptimizeAsync("Write a blog post about AI");
    /// </code>
    /// </summary>
    public class EvaluatorOptimizer
    {
        private readonly AnthropicClient _client;
        private readonly string _generatorModel;
        private readonly string _evaluatorModel;
        private readonly List<EvaluationCriterion> _criteria = new();
        private readonly List<IterationRecord> _history = new();

        public IReadOnlyList<IterationRecord> History => _history.AsReadOnly();

        public EvaluatorOptimizer(
            AnthropicClient client,
            string generatorModel = "claude-sonnet-4-20250514",
            string evaluatorModel = "claude-sonnet-4-20250514")
        {
            _client = client;
            _generatorModel = generatorModel;
            _evaluatorModel = evaluatorModel;
        }

        /// <summary>
        /// Add an evaluation criterion
        /// </summary>
        public EvaluatorOptimizer AddCriterion(EvaluationCriterion criterion)
        {
            _criteria.Add(criterion);
            return this;
        }

        /// <summary>
        /// Optimize output through iterative refinement
        /// </summary>
        public async Task<OptimizationResult> OptimizeAsync(
            string task,
            int maxIterations = 3,
            double scoreThreshold = 0.8)
        {
            _history.Clear();
            string currentOutput = "";
            EvaluationResult? lastEvaluation = null;

            for (int i = 0; i < maxIterations; i++)
            {
                // Generate (or refine) output
                currentOutput = await GenerateAsync(task, currentOutput, lastEvaluation);

                // Evaluate output
                var evaluation = await EvaluateAsync(currentOutput);

                // Record iteration
                _history.Add(new IterationRecord
                {
                    Iteration = i + 1,
                    Output = currentOutput,
                    Evaluation = evaluation
                });

                // Check if we've met the threshold
                if (evaluation.OverallScore >= scoreThreshold)
                {
                    return new OptimizationResult
                    {
                        FinalOutput = currentOutput,
                        FinalScore = evaluation.OverallScore,
                        Iterations = i + 1,
                        MetThreshold = true,
                        History = _history.ToList()
                    };
                }

                lastEvaluation = evaluation;
            }

            // Return best result after max iterations
            var bestIteration = _history.OrderByDescending(h => h.Evaluation.OverallScore).First();
            return new OptimizationResult
            {
                FinalOutput = bestIteration.Output,
                FinalScore = bestIteration.Evaluation.OverallScore,
                Iterations = maxIterations,
                MetThreshold = false,
                History = _history.ToList()
            };
        }

        /// <summary>
        /// Generate or refine output
        /// </summary>
        private async Task<string> GenerateAsync(
            string task,
            string previousOutput,
            EvaluationResult? previousEvaluation)
        {
            string prompt;

            if (string.IsNullOrEmpty(previousOutput))
            {
                prompt = $@"Complete this task:

{task}

Provide your best output:";
            }
            else
            {
                var feedbackText = previousEvaluation != null
                    ? $@"Previous evaluation feedback:
{previousEvaluation.Feedback}

Specific suggestions:
{string.Join("\n", previousEvaluation.Suggestions.Select(s => $"- {s}"))}"
                    : "";

                prompt = $@"Improve this output based on the feedback:

Original task: {task}

Previous output:
{previousOutput}

{feedbackText}

Provide an improved version:";
            }

            var messages = new List<Message>
            {
                new Message(RoleType.User, prompt)
            };

            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = _generatorModel,
                MaxTokens = 4096
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            return response.Content.First().Text;
        }

        /// <summary>
        /// Evaluate output against criteria
        /// </summary>
        private async Task<EvaluationResult> EvaluateAsync(string output)
        {
            var criteriaList = _criteria.Count > 0
                ? string.Join("\n", _criteria.Select(c => $"- {c.Name} (weight: {c.Weight}): {c.Description}"))
                : "- quality: Overall quality and correctness\n- clarity: Clear and understandable\n- completeness: Addresses all aspects";

            var prompt = $@"Evaluate this output against the following criteria:

{criteriaList}

Output to evaluate:
{output}

Respond with JSON in this exact format:
{{
    ""overall_score"": 0.0-1.0,
    ""criteria_scores"": {{
        ""criterion_name"": 0.0-1.0
    }},
    ""feedback"": ""Overall assessment"",
    ""suggestions"": [""specific improvement 1"", ""specific improvement 2""]
}}";

            var messages = new List<Message>
            {
                new Message(RoleType.User, prompt)
            };

            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = _evaluatorModel,
                MaxTokens = 1024
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var json = response.Content.First().Text;

            return ParseEvaluationJson(json);
        }

        private EvaluationResult ParseEvaluationJson(string json)
        {
            var result = new EvaluationResult();

            // Extract overall score
            var scoreMatch = System.Text.RegularExpressions.Regex.Match(
                json, @"""overall_score""\s*:\s*([0-9.]+)");
            if (scoreMatch.Success && double.TryParse(scoreMatch.Groups[1].Value, out var score))
            {
                result.OverallScore = score;
            }

            // Extract feedback
            var feedbackMatch = System.Text.RegularExpressions.Regex.Match(
                json, @"""feedback""\s*:\s*""([^""]+)""");
            if (feedbackMatch.Success)
            {
                result.Feedback = feedbackMatch.Groups[1].Value;
            }

            // Extract suggestions
            var suggestionsMatch = System.Text.RegularExpressions.Regex.Match(
                json, @"""suggestions""\s*:\s*\[(.*?)\]", System.Text.RegularExpressions.RegexOptions.Singleline);
            if (suggestionsMatch.Success)
            {
                var suggestionsJson = suggestionsMatch.Groups[1].Value;
                var suggestionMatches = System.Text.RegularExpressions.Regex.Matches(
                    suggestionsJson, @"""([^""]+)""");
                result.Suggestions = suggestionMatches
                    .Select(m => m.Groups[1].Value)
                    .ToList();
            }

            return result;
        }
    }

    public class OptimizationResult
    {
        public string FinalOutput { get; set; } = string.Empty;
        public double FinalScore { get; set; }
        public int Iterations { get; set; }
        public bool MetThreshold { get; set; }
        public List<IterationRecord> History { get; set; } = new();
    }

    /// <summary>
    /// Confidence-based optimizer that refines until confident
    /// </summary>
    public class ConfidenceBasedOptimizer
    {
        private readonly AnthropicClient _client;
        private readonly string _model;

        public ConfidenceBasedOptimizer(
            AnthropicClient client,
            string model = "claude-sonnet-4-20250514")
        {
            _client = client;
            _model = model;
        }

        /// <summary>
        /// Generate with confidence self-assessment
        /// </summary>
        public async Task<ConfidenceResult> GenerateWithConfidenceAsync(
            string task,
            double confidenceThreshold = 0.85,
            int maxAttempts = 3)
        {
            var attempts = new List<AttemptRecord>();
            string bestOutput = "";
            double bestConfidence = 0;

            for (int i = 0; i < maxAttempts; i++)
            {
                var prompt = $@"Complete this task and assess your confidence:

{task}

After your response, on a new line, provide your confidence level (0.0-1.0) that your answer is correct and complete.

Format:
[Your response here]

CONFIDENCE: [0.0-1.0]";

                var messages = new List<Message>
                {
                    new Message(RoleType.User, prompt)
                };

                var parameters = new MessageParameters
                {
                    Messages = messages,
                    Model = _model,
                    MaxTokens = 4096,
                    Temperature = i == 0 ? 0 : 0.3 // Increase temperature for retries
                };

                var response = await _client.Messages.GetClaudeMessageAsync(parameters);
                var text = response.Content.First().Text;

                // Parse output and confidence
                var (output, confidence) = ParseConfidenceResponse(text);

                attempts.Add(new AttemptRecord
                {
                    Attempt = i + 1,
                    Output = output,
                    Confidence = confidence
                });

                if (confidence > bestConfidence)
                {
                    bestConfidence = confidence;
                    bestOutput = output;
                }

                if (confidence >= confidenceThreshold)
                {
                    return new ConfidenceResult
                    {
                        Output = output,
                        Confidence = confidence,
                        Attempts = attempts,
                        MetThreshold = true
                    };
                }
            }

            return new ConfidenceResult
            {
                Output = bestOutput,
                Confidence = bestConfidence,
                Attempts = attempts,
                MetThreshold = false
            };
        }

        private (string output, double confidence) ParseConfidenceResponse(string text)
        {
            var confidenceMatch = System.Text.RegularExpressions.Regex.Match(
                text, @"CONFIDENCE:\s*([0-9.]+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            double confidence = 0.5;
            if (confidenceMatch.Success && double.TryParse(confidenceMatch.Groups[1].Value, out var parsed))
            {
                confidence = Math.Min(1.0, Math.Max(0.0, parsed));
            }

            var output = System.Text.RegularExpressions.Regex.Replace(
                text, @"\nCONFIDENCE:\s*[0-9.]+", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim();

            return (output, confidence);
        }
    }

    public class ConfidenceResult
    {
        public string Output { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public List<AttemptRecord> Attempts { get; set; } = new();
        public bool MetThreshold { get; set; }
    }

    public class AttemptRecord
    {
        public int Attempt { get; set; }
        public string Output { get; set; } = string.Empty;
        public double Confidence { get; set; }
    }

    public static class EvaluatorOptimizerExamples
    {
        public static async Task WritingOptimizationExample()
        {
            var apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
                ?? throw new InvalidOperationException("ANTHROPIC_API_KEY not set");

            var client = new AnthropicClient(apiKey);
            var optimizer = new EvaluatorOptimizer(client);

            // Add evaluation criteria
            optimizer
                .AddCriterion(new EvaluationCriterion
                {
                    Name = "clarity",
                    Description = "Writing is clear and easy to understand",
                    Weight = 1.5
                })
                .AddCriterion(new EvaluationCriterion
                {
                    Name = "engagement",
                    Description = "Content is engaging and holds attention",
                    Weight = 1.2
                })
                .AddCriterion(new EvaluationCriterion
                {
                    Name = "accuracy",
                    Description = "Information is accurate and well-researched",
                    Weight = 1.5
                })
                .AddCriterion(new EvaluationCriterion
                {
                    Name = "structure",
                    Description = "Well-organized with logical flow",
                    Weight = 1.0
                });

            var result = await optimizer.OptimizeAsync(
                "Write a blog post explaining how large language models work to a non-technical audience",
                maxIterations: 3,
                scoreThreshold: 0.85);

            Console.WriteLine($"=== Optimization Results ===");
            Console.WriteLine($"Iterations: {result.Iterations}");
            Console.WriteLine($"Final Score: {result.FinalScore:P}");
            Console.WriteLine($"Met Threshold: {result.MetThreshold}");

            Console.WriteLine("\n=== Score Progress ===");
            foreach (var iteration in result.History)
            {
                Console.WriteLine($"Iteration {iteration.Iteration}: {iteration.Evaluation.OverallScore:P}");
            }

            Console.WriteLine($"\n=== Final Output ===\n{result.FinalOutput}");
        }

        public static async Task ConfidenceBasedExample()
        {
            var apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
                ?? throw new InvalidOperationException("ANTHROPIC_API_KEY not set");

            var client = new AnthropicClient(apiKey);
            var optimizer = new ConfidenceBasedOptimizer(client);

            var result = await optimizer.GenerateWithConfidenceAsync(
                "What is the time complexity of quicksort in the average case and why?",
                confidenceThreshold: 0.9);

            Console.WriteLine($"=== Confidence-Based Results ===");
            Console.WriteLine($"Final Confidence: {result.Confidence:P}");
            Console.WriteLine($"Attempts: {result.Attempts.Count}");

            foreach (var attempt in result.Attempts)
            {
                Console.WriteLine($"  Attempt {attempt.Attempt}: {attempt.Confidence:P}");
            }

            Console.WriteLine($"\n=== Output ===\n{result.Output}");
        }
    }
}
