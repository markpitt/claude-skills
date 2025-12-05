/**
 * Parallelization Pattern Implementation for C#
 * Concurrent LLM calls for independent subtasks
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
    /// Result of a parallel subtask execution
    /// </summary>
    public class SubtaskResult<T>
    {
        public string SubtaskName { get; set; } = string.Empty;
        public T? Result { get; set; }
        public bool Success { get; set; }
        public string? Error { get; set; }
        public TimeSpan Duration { get; set; }
    }

    /// <summary>
    /// Sectioning Parallelizer - divides task into independent subtasks
    /// 
    /// Example:
    /// <code>
    /// var parallelizer = new SectioningParallelizer(client);
    /// var result = await parallelizer.ProcessCodeReviewAsync(code);
    /// </code>
    /// </summary>
    public class SectioningParallelizer
    {
        private readonly AnthropicClient _client;
        private readonly string _model;

        public SectioningParallelizer(
            AnthropicClient client,
            string model = "claude-sonnet-4-20250514")
        {
            _client = client;
            _model = model;
        }

        /// <summary>
        /// Execute multiple subtasks in parallel
        /// </summary>
        public async Task<List<SubtaskResult<string>>> ExecuteParallelAsync(
            List<(string name, string prompt)> subtasks)
        {
            var tasks = subtasks.Select(async subtask =>
            {
                var startTime = DateTime.UtcNow;
                try
                {
                    var messages = new List<Message>
                    {
                        new Message(RoleType.User, subtask.prompt)
                    };

                    var parameters = new MessageParameters
                    {
                        Messages = messages,
                        Model = _model,
                        MaxTokens = 2048
                    };

                    var response = await _client.Messages.GetClaudeMessageAsync(parameters);
                    var result = response.Content.First().Text;

                    return new SubtaskResult<string>
                    {
                        SubtaskName = subtask.name,
                        Result = result,
                        Success = true,
                        Duration = DateTime.UtcNow - startTime
                    };
                }
                catch (Exception ex)
                {
                    return new SubtaskResult<string>
                    {
                        SubtaskName = subtask.name,
                        Success = false,
                        Error = ex.Message,
                        Duration = DateTime.UtcNow - startTime
                    };
                }
            }).ToList();

            return (await Task.WhenAll(tasks)).ToList();
        }

        /// <summary>
        /// Code review with parallel analysis
        /// </summary>
        public async Task<CodeReviewResult> ProcessCodeReviewAsync(string code)
        {
            var subtasks = new List<(string name, string prompt)>
            {
                ("security", $@"Analyze this code for security vulnerabilities:
```
{code}
```
List any security issues found with severity and recommendations."),

                ("performance", $@"Analyze this code for performance issues:
```
{code}
```
Identify inefficiencies and suggest optimizations."),

                ("maintainability", $@"Analyze this code for maintainability:
```
{code}
```
Check code structure, naming, and suggest improvements."),

                ("bugs", $@"Analyze this code for potential bugs:
```
{code}
```
Identify logic errors, edge cases, and potential runtime issues.")
            };

            var results = await ExecuteParallelAsync(subtasks);

            return new CodeReviewResult
            {
                SecurityAnalysis = results.FirstOrDefault(r => r.SubtaskName == "security")?.Result ?? "",
                PerformanceAnalysis = results.FirstOrDefault(r => r.SubtaskName == "performance")?.Result ?? "",
                MaintainabilityAnalysis = results.FirstOrDefault(r => r.SubtaskName == "maintainability")?.Result ?? "",
                BugAnalysis = results.FirstOrDefault(r => r.SubtaskName == "bugs")?.Result ?? "",
                TotalDuration = results.Max(r => r.Duration)
            };
        }
    }

    public class CodeReviewResult
    {
        public string SecurityAnalysis { get; set; } = string.Empty;
        public string PerformanceAnalysis { get; set; } = string.Empty;
        public string MaintainabilityAnalysis { get; set; } = string.Empty;
        public string BugAnalysis { get; set; } = string.Empty;
        public TimeSpan TotalDuration { get; set; }
    }

    /// <summary>
    /// Voting Parallelizer - multiple evaluations for consensus
    /// </summary>
    public class VotingParallelizer
    {
        private readonly AnthropicClient _client;
        private readonly string _model;

        public VotingParallelizer(
            AnthropicClient client,
            string model = "claude-sonnet-4-20250514")
        {
            _client = client;
            _model = model;
        }

        /// <summary>
        /// Get multiple votes on a decision
        /// </summary>
        public async Task<VotingResult> VoteAsync(
            string question,
            List<string> options,
            int voterCount = 3)
        {
            var optionsList = string.Join("\n", options.Select((o, i) => $"{i + 1}. {o}"));
            var prompt = $@"Consider this question:
{question}

Options:
{optionsList}

Analyze carefully and respond with only the number of your chosen option.";

            var tasks = Enumerable.Range(0, voterCount).Select(async i =>
            {
                var messages = new List<Message>
                {
                    new Message(RoleType.User, prompt)
                };

                var parameters = new MessageParameters
                {
                    Messages = messages,
                    Model = _model,
                    MaxTokens = 10,
                    Temperature = 0.7 // Some variance for diverse opinions
                };

                var response = await _client.Messages.GetClaudeMessageAsync(parameters);
                var text = response.Content.First().Text.Trim();

                if (int.TryParse(text, out var vote) && vote >= 1 && vote <= options.Count)
                {
                    return vote - 1; // 0-indexed
                }
                return -1; // Invalid vote
            }).ToList();

            var votes = await Task.WhenAll(tasks);
            var validVotes = votes.Where(v => v >= 0).ToList();

            // Count votes
            var voteCounts = validVotes
                .GroupBy(v => v)
                .ToDictionary(g => g.Key, g => g.Count());

            var winningOption = voteCounts.Count > 0
                ? voteCounts.OrderByDescending(kv => kv.Value).First().Key
                : 0;

            return new VotingResult
            {
                WinningOption = options[winningOption],
                WinningIndex = winningOption,
                VoteCounts = options.Select((o, i) =>
                    new VoteCount { Option = o, Votes = voteCounts.GetValueOrDefault(i, 0) }).ToList(),
                TotalVotes = validVotes.Count,
                Consensus = voteCounts.Count > 0 &&
                    voteCounts.Values.Max() > (double)validVotes.Count / 2
            };
        }

        /// <summary>
        /// Safety voting - all voters must agree for approval
        /// </summary>
        public async Task<SafetyVotingResult> SafetyVoteAsync(
            string content,
            int voterCount = 3)
        {
            var prompt = $@"Evaluate if this content is safe and appropriate:

{content}

Respond with only 'SAFE' or 'UNSAFE'.";

            var tasks = Enumerable.Range(0, voterCount).Select(async i =>
            {
                var messages = new List<Message>
                {
                    new Message(RoleType.User, prompt)
                };

                var parameters = new MessageParameters
                {
                    Messages = messages,
                    Model = _model,
                    MaxTokens = 10
                };

                var response = await _client.Messages.GetClaudeMessageAsync(parameters);
                var text = response.Content.First().Text.Trim().ToUpper();

                return text.Contains("SAFE") && !text.Contains("UNSAFE");
            }).ToList();

            var votes = await Task.WhenAll(tasks);
            var safeVotes = votes.Count(v => v);

            return new SafetyVotingResult
            {
                IsSafe = votes.All(v => v), // Require unanimous agreement
                SafeVotes = safeVotes,
                UnsafeVotes = votes.Length - safeVotes,
                Unanimous = votes.All(v => v) || votes.All(v => !v)
            };
        }
    }

    public class VotingResult
    {
        public string WinningOption { get; set; } = string.Empty;
        public int WinningIndex { get; set; }
        public List<VoteCount> VoteCounts { get; set; } = new();
        public int TotalVotes { get; set; }
        public bool Consensus { get; set; }
    }

    public class VoteCount
    {
        public string Option { get; set; } = string.Empty;
        public int Votes { get; set; }
    }

    public class SafetyVotingResult
    {
        public bool IsSafe { get; set; }
        public int SafeVotes { get; set; }
        public int UnsafeVotes { get; set; }
        public bool Unanimous { get; set; }
    }

    /// <summary>
    /// Guardrails Parallelizer - run guardrails in parallel with main task
    /// </summary>
    public class GuardrailsParallelizer
    {
        private readonly AnthropicClient _client;
        private readonly string _model;

        public GuardrailsParallelizer(
            AnthropicClient client,
            string model = "claude-sonnet-4-20250514")
        {
            _client = client;
            _model = model;
        }

        /// <summary>
        /// Execute task with parallel guardrails
        /// </summary>
        public async Task<GuardrailedResult> ExecuteWithGuardrailsAsync(
            string input,
            string taskPrompt,
            List<string> guardrailPrompts)
        {
            // Run main task and guardrails in parallel
            var mainTask = ExecuteMainTaskAsync(taskPrompt);
            var guardrailTasks = guardrailPrompts.Select(async (prompt, index) =>
            {
                var checkPrompt = prompt.Replace("{input}", input);
                return await CheckGuardrailAsync(checkPrompt, $"guardrail_{index}");
            }).ToList();

            await Task.WhenAll(new[] { mainTask }.Concat(guardrailTasks.Cast<Task>()));

            var mainResult = await mainTask;
            var guardrailResults = await Task.WhenAll(guardrailTasks);

            var passed = guardrailResults.All(g => g.Passed);

            return new GuardrailedResult
            {
                Result = passed ? mainResult : null,
                Blocked = !passed,
                GuardrailResults = guardrailResults.ToList(),
                BlockingGuardrails = guardrailResults
                    .Where(g => !g.Passed)
                    .Select(g => g.Name)
                    .ToList()
            };
        }

        private async Task<string> ExecuteMainTaskAsync(string prompt)
        {
            var messages = new List<Message>
            {
                new Message(RoleType.User, prompt)
            };

            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = _model,
                MaxTokens = 4096
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            return response.Content.First().Text;
        }

        private async Task<GuardrailResult> CheckGuardrailAsync(string prompt, string name)
        {
            var messages = new List<Message>
            {
                new Message(RoleType.User, prompt + "\n\nRespond with only 'PASS' or 'FAIL'.")
            };

            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-3-haiku-20240307", // Faster model for guardrails
                MaxTokens = 10
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var result = response.Content.First().Text.Trim().ToUpper();

            return new GuardrailResult
            {
                Name = name,
                Passed = result.Contains("PASS")
            };
        }
    }

    public class GuardrailResult
    {
        public string Name { get; set; } = string.Empty;
        public bool Passed { get; set; }
    }

    public class GuardrailedResult
    {
        public string? Result { get; set; }
        public bool Blocked { get; set; }
        public List<GuardrailResult> GuardrailResults { get; set; } = new();
        public List<string> BlockingGuardrails { get; set; } = new();
    }

    public static class ParallelizationExamples
    {
        public static async Task CodeReviewExample()
        {
            var apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
                ?? throw new InvalidOperationException("ANTHROPIC_API_KEY not set");

            var client = new AnthropicClient(apiKey);
            var parallelizer = new SectioningParallelizer(client);

            var code = @"
public class UserService
{
    private string connectionString;

    public User GetUser(int id)
    {
        var query = $""SELECT * FROM users WHERE id = {id}"";
        // Execute query...
        return null;
    }
}";

            var result = await parallelizer.ProcessCodeReviewAsync(code);

            Console.WriteLine("=== Code Review Results ===");
            Console.WriteLine($"\nSecurity:\n{result.SecurityAnalysis}");
            Console.WriteLine($"\nPerformance:\n{result.PerformanceAnalysis}");
            Console.WriteLine($"\nMaintainability:\n{result.MaintainabilityAnalysis}");
            Console.WriteLine($"\nPotential Bugs:\n{result.BugAnalysis}");
            Console.WriteLine($"\nTotal Duration: {result.TotalDuration.TotalMilliseconds}ms");
        }

        public static async Task VotingExample()
        {
            var apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
                ?? throw new InvalidOperationException("ANTHROPIC_API_KEY not set");

            var client = new AnthropicClient(apiKey);
            var voter = new VotingParallelizer(client);

            var result = await voter.VoteAsync(
                "What's the best approach for handling errors in an API?",
                new List<string>
                {
                    "Return HTTP status codes with error messages",
                    "Throw exceptions and let middleware handle them",
                    "Return a result object with success/failure status"
                },
                voterCount: 5);

            Console.WriteLine($"Winning option: {result.WinningOption}");
            Console.WriteLine($"Consensus reached: {result.Consensus}");
            foreach (var vc in result.VoteCounts)
            {
                Console.WriteLine($"  {vc.Option}: {vc.Votes} votes");
            }
        }
    }
}
