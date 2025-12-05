/**
 * Orchestrator-Workers Pattern Implementation for C#
 * Central LLM dynamically breaks down tasks and delegates to workers
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;

namespace AgentPatterns
{
    /// <summary>
    /// Represents a subtask created by the orchestrator
    /// </summary>
    public class Subtask
    {
        public string Id { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string WorkerType { get; set; } = string.Empty;
        public List<string> Dependencies { get; set; } = new();
        public Dictionary<string, object> Context { get; set; } = new();
    }

    /// <summary>
    /// Result from a worker execution
    /// </summary>
    public class WorkerResult
    {
        public string SubtaskId { get; set; } = string.Empty;
        public string Result { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string? Error { get; set; }
    }

    /// <summary>
    /// Interface for specialized workers
    /// </summary>
    public interface IWorker
    {
        string WorkerType { get; }
        Task<string> ExecuteAsync(Subtask subtask, Dictionary<string, string> dependencyResults);
    }

    /// <summary>
    /// LLM-based worker that uses prompts for execution
    /// </summary>
    public class LLMWorker : IWorker
    {
        private readonly AnthropicClient _client;
        private readonly string _model;
        private readonly string _systemPrompt;

        public string WorkerType { get; }

        public LLMWorker(
            AnthropicClient client,
            string workerType,
            string systemPrompt,
            string model = "claude-sonnet-4-20250514")
        {
            _client = client;
            WorkerType = workerType;
            _systemPrompt = systemPrompt;
            _model = model;
        }

        public async Task<string> ExecuteAsync(Subtask subtask, Dictionary<string, string> dependencyResults)
        {
            var contextInfo = dependencyResults.Count > 0
                ? "\n\nContext from previous tasks:\n" +
                  string.Join("\n", dependencyResults.Select(kv => $"[{kv.Key}]: {kv.Value}"))
                : "";

            var messages = new List<Message>
            {
                new Message(RoleType.User, $@"{_systemPrompt}

Task: {subtask.Description}
{contextInfo}

Provide your result:")
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
    }

    /// <summary>
    /// Orchestrator that decomposes tasks and coordinates workers.
    /// 
    /// Example:
    /// <code>
    /// var orchestrator = new Orchestrator(client);
    /// orchestrator.RegisterWorker(new LLMWorker(client, "researcher", "You research topics"));
    /// orchestrator.RegisterWorker(new LLMWorker(client, "writer", "You write content"));
    /// var result = await orchestrator.ExecuteAsync("Write an article about AI");
    /// </code>
    /// </summary>
    public class Orchestrator
    {
        private readonly AnthropicClient _client;
        private readonly string _model;
        private readonly Dictionary<string, IWorker> _workers = new();

        public Orchestrator(
            AnthropicClient client,
            string model = "claude-sonnet-4-20250514")
        {
            _client = client;
            _model = model;
        }

        /// <summary>
        /// Register a worker
        /// </summary>
        public Orchestrator RegisterWorker(IWorker worker)
        {
            _workers[worker.WorkerType] = worker;
            return this;
        }

        /// <summary>
        /// Execute a complex task by decomposing and delegating
        /// </summary>
        public async Task<OrchestratorResult> ExecuteAsync(string task)
        {
            // Step 1: Decompose the task
            var subtasks = await DecomposeTaskAsync(task);

            // Step 2: Execute subtasks respecting dependencies
            var results = new Dictionary<string, string>();
            var workerResults = new List<WorkerResult>();

            foreach (var subtask in TopologicalSort(subtasks))
            {
                // Gather dependency results
                var depResults = subtask.Dependencies
                    .Where(d => results.ContainsKey(d))
                    .ToDictionary(d => d, d => results[d]);

                // Find appropriate worker
                if (!_workers.TryGetValue(subtask.WorkerType, out var worker))
                {
                    // Use default LLM worker
                    worker = new LLMWorker(_client, subtask.WorkerType, 
                        $"You are a {subtask.WorkerType} specialist.");
                }

                try
                {
                    var result = await worker.ExecuteAsync(subtask, depResults);
                    results[subtask.Id] = result;
                    workerResults.Add(new WorkerResult
                    {
                        SubtaskId = subtask.Id,
                        Result = result,
                        Success = true
                    });
                }
                catch (Exception ex)
                {
                    workerResults.Add(new WorkerResult
                    {
                        SubtaskId = subtask.Id,
                        Success = false,
                        Error = ex.Message
                    });
                }
            }

            // Step 3: Synthesize final result
            var finalResult = await SynthesizeResultsAsync(task, results);

            return new OrchestratorResult
            {
                FinalResult = finalResult,
                Subtasks = subtasks,
                WorkerResults = workerResults
            };
        }

        /// <summary>
        /// Decompose task into subtasks
        /// </summary>
        private async Task<List<Subtask>> DecomposeTaskAsync(string task)
        {
            var workerTypes = string.Join(", ", _workers.Keys);
            var prompt = $@"Break down this task into subtasks that can be delegated to specialized workers.

Task: {task}

Available worker types: {workerTypes}

Respond with JSON array of subtasks:
[
  {{
    ""id"": ""subtask_1"",
    ""description"": ""What needs to be done"",
    ""workerType"": ""worker_type"",
    ""dependencies"": []
  }},
  {{
    ""id"": ""subtask_2"",
    ""description"": ""Another task"",
    ""workerType"": ""worker_type"",
    ""dependencies"": [""subtask_1""]
  }}
]

Only include the JSON array, no other text.";

            var messages = new List<Message>
            {
                new Message(RoleType.User, prompt)
            };

            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = _model,
                MaxTokens = 2048
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var json = response.Content.First().Text.Trim();

            // Clean up JSON if needed
            if (json.StartsWith("```"))
            {
                json = json.Split('\n').Skip(1).Take(json.Split('\n').Length - 2)
                    .Aggregate((a, b) => a + "\n" + b);
            }

            try
            {
                var subtasks = JsonSerializer.Deserialize<List<Subtask>>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return subtasks ?? new List<Subtask>();
            }
            catch
            {
                // Fallback: create a single subtask
                return new List<Subtask>
                {
                    new Subtask
                    {
                        Id = "main",
                        Description = task,
                        WorkerType = _workers.Keys.FirstOrDefault() ?? "general"
                    }
                };
            }
        }

        /// <summary>
        /// Synthesize results into final output
        /// </summary>
        private async Task<string> SynthesizeResultsAsync(
            string originalTask,
            Dictionary<string, string> results)
        {
            var resultsText = string.Join("\n\n",
                results.Select(kv => $"### {kv.Key}\n{kv.Value}"));

            var prompt = $@"Synthesize these subtask results into a cohesive final result.

Original Task: {originalTask}

Subtask Results:
{resultsText}

Provide a well-organized final result that addresses the original task:";

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

        /// <summary>
        /// Topological sort of subtasks based on dependencies
        /// </summary>
        private static List<Subtask> TopologicalSort(List<Subtask> subtasks)
        {
            var result = new List<Subtask>();
            var visited = new HashSet<string>();
            var visiting = new HashSet<string>();
            var taskMap = subtasks.ToDictionary(s => s.Id);

            void Visit(string id)
            {
                if (visited.Contains(id)) return;
                if (visiting.Contains(id))
                    throw new InvalidOperationException($"Circular dependency detected: {id}");

                visiting.Add(id);

                if (taskMap.TryGetValue(id, out var subtask))
                {
                    foreach (var dep in subtask.Dependencies)
                    {
                        Visit(dep);
                    }
                    result.Add(subtask);
                }

                visiting.Remove(id);
                visited.Add(id);
            }

            foreach (var subtask in subtasks)
            {
                Visit(subtask.Id);
            }

            return result;
        }
    }

    public class OrchestratorResult
    {
        public string FinalResult { get; set; } = string.Empty;
        public List<Subtask> Subtasks { get; set; } = new();
        public List<WorkerResult> WorkerResults { get; set; } = new();
    }

    public static class OrchestratorExamples
    {
        public static async Task ResearchArticleExample()
        {
            var apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
                ?? throw new InvalidOperationException("ANTHROPIC_API_KEY not set");

            var client = new AnthropicClient(apiKey);
            var orchestrator = new Orchestrator(client);

            // Register specialized workers
            orchestrator
                .RegisterWorker(new LLMWorker(client, "researcher",
                    "You are a research specialist. Gather facts, statistics, and key information."))
                .RegisterWorker(new LLMWorker(client, "writer",
                    "You are a skilled writer. Create engaging, well-structured content."))
                .RegisterWorker(new LLMWorker(client, "editor",
                    "You are an editor. Review and improve content for clarity and accuracy."));

            var result = await orchestrator.ExecuteAsync(
                "Write a comprehensive article about the impact of AI on healthcare");

            Console.WriteLine("=== Orchestrator Results ===");
            Console.WriteLine($"\nSubtasks created: {result.Subtasks.Count}");
            foreach (var subtask in result.Subtasks)
            {
                Console.WriteLine($"  - [{subtask.WorkerType}] {subtask.Description}");
            }

            Console.WriteLine($"\n=== Final Result ===\n{result.FinalResult}");
        }

        public static async Task CodeGenerationExample()
        {
            var apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
                ?? throw new InvalidOperationException("ANTHROPIC_API_KEY not set");

            var client = new AnthropicClient(apiKey);
            var orchestrator = new Orchestrator(client);

            // Register code-focused workers
            orchestrator
                .RegisterWorker(new LLMWorker(client, "architect",
                    "You design software architecture and data models.",
                    "claude-sonnet-4-20250514"))
                .RegisterWorker(new LLMWorker(client, "implementer",
                    "You write clean, efficient code implementations.",
                    "claude-sonnet-4-20250514"))
                .RegisterWorker(new LLMWorker(client, "tester",
                    "You write comprehensive unit tests.",
                    "claude-sonnet-4-20250514"))
                .RegisterWorker(new LLMWorker(client, "documenter",
                    "You write clear documentation and API docs.",
                    "claude-sonnet-4-20250514"));

            var result = await orchestrator.ExecuteAsync(
                "Create a REST API for a todo list application with CRUD operations");

            Console.WriteLine("=== Code Generation Results ===");
            foreach (var workerResult in result.WorkerResults)
            {
                Console.WriteLine($"\n--- {workerResult.SubtaskId} ---");
                Console.WriteLine(workerResult.Success
                    ? workerResult.Result.Substring(0, Math.Min(500, workerResult.Result.Length)) + "..."
                    : $"Error: {workerResult.Error}");
            }
        }
    }
}
