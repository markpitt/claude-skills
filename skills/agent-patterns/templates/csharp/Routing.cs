/**
 * Routing Pattern Implementation for C#
 * Classifying inputs and directing to specialized handlers
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
    /// Represents the result of a classification
    /// </summary>
    public class ClassificationResult<TCategory> where TCategory : Enum
    {
        public TCategory Category { get; set; }
        public double Confidence { get; set; }
        public string Reasoning { get; set; } = string.Empty;
    }

    /// <summary>
    /// Route definition with handler
    /// </summary>
    public class Route<TCategory, TResult> where TCategory : Enum
    {
        public TCategory Category { get; set; }
        public Func<string, Task<TResult>> Handler { get; set; } = null!;
        public string Description { get; set; } = string.Empty;
    }

    /// <summary>
    /// Router that classifies inputs and directs them to specialized handlers.
    /// 
    /// Example:
    /// <code>
    /// var router = new Router&lt;TicketType, string&gt;(client);
    /// router.AddRoute(TicketType.Technical, HandleTechnical, "Technical issues");
    /// router.AddRoute(TicketType.Billing, HandleBilling, "Billing questions");
    /// var result = await router.RouteAsync("My card was charged twice");
    /// </code>
    /// </summary>
    public class Router<TCategory, TResult> where TCategory : struct, Enum
    {
        private readonly AnthropicClient _client;
        private readonly string _model;
        private readonly Dictionary<TCategory, Route<TCategory, TResult>> _routes = new();
        private Func<string, Task<TResult>>? _fallbackHandler;

        public Router(
            AnthropicClient client,
            string model = "claude-sonnet-4-20250514")
        {
            _client = client;
            _model = model;
        }

        /// <summary>
        /// Add a route with its handler
        /// </summary>
        public Router<TCategory, TResult> AddRoute(
            TCategory category,
            Func<string, Task<TResult>> handler,
            string description = "")
        {
            _routes[category] = new Route<TCategory, TResult>
            {
                Category = category,
                Handler = handler,
                Description = description
            };
            return this;
        }

        /// <summary>
        /// Set fallback handler for unmatched inputs
        /// </summary>
        public Router<TCategory, TResult> SetFallback(Func<string, Task<TResult>> handler)
        {
            _fallbackHandler = handler;
            return this;
        }

        /// <summary>
        /// Classify input and route to appropriate handler
        /// </summary>
        public async Task<(TResult Result, ClassificationResult<TCategory> Classification)> RouteAsync(
            string input,
            double confidenceThreshold = 0.7)
        {
            var classification = await ClassifyAsync(input);

            if (classification.Confidence < confidenceThreshold)
            {
                if (_fallbackHandler != null)
                {
                    var fallbackResult = await _fallbackHandler(input);
                    return (fallbackResult, classification);
                }
                throw new InvalidOperationException(
                    $"Low confidence ({classification.Confidence:P}) and no fallback handler set");
            }

            if (!_routes.TryGetValue(classification.Category, out var route))
            {
                if (_fallbackHandler != null)
                {
                    var fallbackResult = await _fallbackHandler(input);
                    return (fallbackResult, classification);
                }
                throw new InvalidOperationException(
                    $"No handler registered for category: {classification.Category}");
            }

            var result = await route.Handler(input);
            return (result, classification);
        }

        /// <summary>
        /// Classify input into a category
        /// </summary>
        public async Task<ClassificationResult<TCategory>> ClassifyAsync(string input)
        {
            var categories = Enum.GetValues<TCategory>();
            var categoryDescriptions = categories
                .Select(c => _routes.TryGetValue(c, out var r)
                    ? $"- {c}: {r.Description}"
                    : $"- {c}")
                .ToList();

            var prompt = $@"Classify the following input into one of these categories:
{string.Join("\n", categoryDescriptions)}

Input: {input}

Respond with JSON in this exact format:
{{
    ""category"": ""<category_name>"",
    ""confidence"": <0.0-1.0>,
    ""reasoning"": ""<brief explanation>""
}}";

            var messages = new List<Message>
            {
                new Message(RoleType.User, prompt)
            };

            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = _model,
                MaxTokens = 256
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var json = response.Content.First().Text;

            // Parse JSON response (simplified - use System.Text.Json in production)
            var result = ParseClassificationJson<TCategory>(json);
            return result;
        }

        private static ClassificationResult<TCategory> ParseClassificationJson<T>(string json) where T : struct, Enum
        {
            // Simplified JSON parsing - use System.Text.Json in production
            var result = new ClassificationResult<TCategory>();

            // Extract category
            var categoryMatch = System.Text.RegularExpressions.Regex.Match(
                json, @"""category""\s*:\s*""([^""]+)""");
            if (categoryMatch.Success && Enum.TryParse<TCategory>(categoryMatch.Groups[1].Value, true, out var category))
            {
                result.Category = category;
            }

            // Extract confidence
            var confidenceMatch = System.Text.RegularExpressions.Regex.Match(
                json, @"""confidence""\s*:\s*([0-9.]+)");
            if (confidenceMatch.Success && double.TryParse(confidenceMatch.Groups[1].Value, out var confidence))
            {
                result.Confidence = confidence;
            }

            // Extract reasoning
            var reasoningMatch = System.Text.RegularExpressions.Regex.Match(
                json, @"""reasoning""\s*:\s*""([^""]+)""");
            if (reasoningMatch.Success)
            {
                result.Reasoning = reasoningMatch.Groups[1].Value;
            }

            return result;
        }
    }

    /// <summary>
    /// Model-based routing by task complexity
    /// </summary>
    public class ModelRouter
    {
        private readonly AnthropicClient _client;
        private readonly string _classificationModel;

        public ModelRouter(
            AnthropicClient client,
            string classificationModel = "claude-sonnet-4-20250514")
        {
            _client = client;
            _classificationModel = classificationModel;
        }

        public enum Complexity { Simple, Moderate, Complex }

        /// <summary>
        /// Route to appropriate model based on task complexity
        /// </summary>
        public async Task<string> RouteByComplexityAsync(string input)
        {
            var complexity = await AssessComplexityAsync(input);

            var model = complexity switch
            {
                Complexity.Simple => "claude-3-haiku-20240307",
                Complexity.Moderate => "claude-sonnet-4-20250514",
                Complexity.Complex => "claude-opus-4-20250514",
                _ => "claude-sonnet-4-20250514"
            };

            var messages = new List<Message>
            {
                new Message(RoleType.User, input)
            };

            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = model,
                MaxTokens = 4096
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            return response.Content.First().Text;
        }

        private async Task<Complexity> AssessComplexityAsync(string input)
        {
            var prompt = $@"Assess the complexity of this task on a scale:
- Simple: Factual lookup, simple formatting, basic questions
- Moderate: Analysis, summarization, code review
- Complex: Multi-step reasoning, creative writing, complex coding

Task: {input}

Respond with just one word: Simple, Moderate, or Complex";

            var messages = new List<Message>
            {
                new Message(RoleType.User, prompt)
            };

            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = _classificationModel,
                MaxTokens = 10
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var result = response.Content.First().Text.Trim();

            return result.ToLower() switch
            {
                "simple" => Complexity.Simple,
                "moderate" => Complexity.Moderate,
                "complex" => Complexity.Complex,
                _ => Complexity.Moderate
            };
        }
    }

    // Example enums and usage
    public enum TicketType { Technical, Billing, General, Urgent }

    public static class RoutingExamples
    {
        public static async Task CustomerServiceExample()
        {
            var apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
                ?? throw new InvalidOperationException("ANTHROPIC_API_KEY not set");

            var client = new AnthropicClient(apiKey);
            var router = new Router<TicketType, string>(client);

            // Configure routes
            router
                .AddRoute(
                    TicketType.Technical,
                    async input => await HandleTechnicalAsync(client, input),
                    "Technical issues, bugs, errors")
                .AddRoute(
                    TicketType.Billing,
                    async input => await HandleBillingAsync(client, input),
                    "Billing, payments, subscriptions")
                .AddRoute(
                    TicketType.General,
                    async input => await HandleGeneralAsync(client, input),
                    "General inquiries, information requests")
                .AddRoute(
                    TicketType.Urgent,
                    async input => await EscalateAsync(input),
                    "Urgent matters requiring immediate attention")
                .SetFallback(async input => await HandleGeneralAsync(client, input));

            // Route a ticket
            var (response, classification) = await router.RouteAsync(
                "My card was charged twice for the same subscription");

            Console.WriteLine($"Category: {classification.Category}");
            Console.WriteLine($"Confidence: {classification.Confidence:P}");
            Console.WriteLine($"Response: {response}");
        }

        private static async Task<string> HandleTechnicalAsync(AnthropicClient client, string input)
        {
            var messages = new List<Message>
            {
                new Message(RoleType.User, $@"You are a technical support specialist.
Help the user with their technical issue:

{input}

Provide clear troubleshooting steps.")
            };

            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 1024
            };

            var response = await client.Messages.GetClaudeMessageAsync(parameters);
            return response.Content.First().Text;
        }

        private static async Task<string> HandleBillingAsync(AnthropicClient client, string input)
        {
            var messages = new List<Message>
            {
                new Message(RoleType.User, $@"You are a billing support specialist.
Help the user with their billing inquiry:

{input}

Be empathetic and provide clear next steps.")
            };

            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 1024
            };

            var response = await client.Messages.GetClaudeMessageAsync(parameters);
            return response.Content.First().Text;
        }

        private static async Task<string> HandleGeneralAsync(AnthropicClient client, string input)
        {
            var messages = new List<Message>
            {
                new Message(RoleType.User, $@"Help the user with their inquiry:

{input}")
            };

            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-3-haiku-20240307",
                MaxTokens = 1024
            };

            var response = await client.Messages.GetClaudeMessageAsync(parameters);
            return response.Content.First().Text;
        }

        private static Task<string> EscalateAsync(string input)
        {
            // In production, this would create an urgent ticket
            return Task.FromResult($"[ESCALATED] Urgent ticket created for: {input}");
        }
    }
}
