/**
 * Prompt Chaining Pattern Implementation for C#
 * Sequential LLM calls with programmatic checkpoints
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
    /// Represents a single step in the prompt chain
    /// </summary>
    public class ChainStep<TContext> where TContext : class
    {
        public string Name { get; set; }
        public Func<TContext, string> PromptTemplate { get; set; }
        public Func<string, bool>? Validator { get; set; }
        public Func<string, object>? Processor { get; set; }

        public ChainStep(
            string name,
            Func<TContext, string> promptTemplate,
            Func<string, bool>? validator = null,
            Func<string, object>? processor = null)
        {
            Name = name;
            PromptTemplate = promptTemplate;
            Validator = validator;
            Processor = processor;
        }
    }

    /// <summary>
    /// Execution history entry
    /// </summary>
    public record ChainHistory(
        string Step,
        string Prompt,
        string Output,
        Dictionary<string, object> Context
    );

    /// <summary>
    /// Executes a sequence of LLM calls with validation and processing between steps.
    ///
    /// Example:
    /// <code>
    /// var chain = new PromptChain&lt;DocumentContext&gt;(anthropicClient);
    /// chain.AddStep(new ChainStep&lt;DocumentContext&gt;(
    ///     name: "outline",
    ///     promptTemplate: ctx => $"Create an outline for: {ctx.Topic}",
    ///     validator: output => output.Contains("1.") && output.Contains("2.")
    /// ));
    /// var result = await chain.ExecuteAsync(new DocumentContext { Topic = "AI Safety" });
    /// </code>
    /// </summary>
    public class PromptChain<TContext> where TContext : class
    {
        private readonly AnthropicClient _client;
        private readonly string _model;
        private readonly List<ChainStep<TContext>> _steps = new();
        private readonly List<ChainHistory> _history = new();

        public IReadOnlyList<ChainHistory> History => _history.AsReadOnly();

        public PromptChain(
            AnthropicClient client,
            string model = "claude-3-5-sonnet-20241022")
        {
            _client = client;
            _model = model;
        }

        /// <summary>
        /// Add a step to the chain
        /// </summary>
        public PromptChain<TContext> AddStep(ChainStep<TContext> step)
        {
            _steps.Add(step);
            return this; // Allow fluent chaining
        }

        /// <summary>
        /// Execute the chain with initial context
        /// </summary>
        public async Task<string> ExecuteAsync(TContext initialContext)
        {
            var context = new Dictionary<string, object>();

            // Copy properties from initial context to dictionary
            foreach (var prop in typeof(TContext).GetProperties())
            {
                var value = prop.GetValue(initialContext);
                if (value != null)
                {
                    context[prop.Name] = value;
                }
            }

            string currentOutput = string.Empty;

            foreach (var step in _steps)
            {
                // Format prompt with current context
                var prompt = step.PromptTemplate(initialContext);

                // Call LLM
                var messages = new List<Message>
                {
                    new Message(RoleType.User, prompt)
                };

                var parameters = new MessageParameters
                {
                    Messages = messages,
                    Model = _model,
                    MaxTokens = 4096,
                    Stream = false
                };

                var response = await _client.Messages.GetClaudeMessageAsync(parameters);
                currentOutput = response.Content.First().Text;

                // Validate if validator provided
                if (step.Validator != null && !step.Validator(currentOutput))
                {
                    throw new InvalidOperationException(
                        $"Step '{step.Name}' validation failed. Output: {currentOutput.Substring(0, Math.Min(100, currentOutput.Length))}"
                    );
                }

                // Process if processor provided
                if (step.Processor != null)
                {
                    var processed = step.Processor(currentOutput);
                    context[step.Name] = processed;
                }
                else
                {
                    context[step.Name] = currentOutput;
                }

                // Track history
                _history.Add(new ChainHistory(
                    Step: step.Name,
                    Prompt: prompt,
                    Output: currentOutput,
                    Context: new Dictionary<string, object>(context)
                ));
            }

            return currentOutput;
        }
    }

    // Example usage with DTOs
    public class DocumentContext
    {
        public string Topic { get; set; } = string.Empty;
    }

    public static class Examples
    {
        public static async Task<string> DocumentGenerationExample()
        {
            var apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
                ?? throw new InvalidOperationException("ANTHROPIC_API_KEY not set");

            var client = new AnthropicClient(apiKey);
            var chain = new PromptChain<DocumentContext>(client);

            // Step 1: Generate outline
            chain.AddStep(new ChainStep<DocumentContext>(
                name: "outline",
                promptTemplate: ctx => $"Create a detailed outline for an article about: {ctx.Topic}",
                validator: output => output.Contains("1.") && output.Contains("2.")
            ));

            // Step 2: Expand outline
            chain.AddStep(new ChainStep<DocumentContext>(
                name: "draft",
                promptTemplate: ctx => $@"
                    Expand this outline into a full article:
                    {((Dictionary<string, object>)ctx.GetType().GetProperty("Context")?.GetValue(ctx) ?? new Dictionary<string, object>())["outline"]}

                    Write in a professional tone with clear examples.
                ",
                validator: output => output.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length > 200
            ));

            // Step 3: Proofread
            chain.AddStep(new ChainStep<DocumentContext>(
                name: "final",
                promptTemplate: ctx => $@"
                    Proofread and polish this article:
                    (draft from previous step)

                    Fix any grammar, improve clarity, and ensure consistent tone.
                "
            ));

            var result = await chain.ExecuteAsync(new DocumentContext
            {
                Topic = "Building Effective AI Agents"
            });

            Console.WriteLine("Final Article:");
            Console.WriteLine(result);

            return result;
        }

        // Example with Semantic Kernel integration
        public static async Task SemanticKernelIntegration()
        {
            // This shows how to integrate with Microsoft Semantic Kernel
            // for more advanced scenarios

            /*
            using Microsoft.SemanticKernel;
            using Microsoft.SemanticKernel.Connectors.Anthropic;

            var kernel = Kernel.CreateBuilder()
                .AddAnthropicChatCompletion(
                    modelId: "claude-3-5-sonnet-20241022",
                    apiKey: Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
                )
                .Build();

            // Create plugins for each chain step
            var outlineFunction = kernel.CreateFunctionFromPrompt(
                "Create a detailed outline for: {{$topic}}"
            );

            var expandFunction = kernel.CreateFunctionFromPrompt(
                "Expand this outline: {{$outline}}"
            );

            // Execute chain through Semantic Kernel
            var outlineResult = await kernel.InvokeAsync(outlineFunction,
                new KernelArguments { ["topic"] = "AI Agents" }
            );

            var finalResult = await kernel.InvokeAsync(expandFunction,
                new KernelArguments { ["outline"] = outlineResult.ToString() }
            );
            */

            await Task.CompletedTask;
        }
    }
}
