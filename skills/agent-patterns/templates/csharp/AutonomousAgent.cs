/**
 * Autonomous Agent Pattern Implementation for C#
 * Open-ended exploration with tool usage
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
    /// Tool definition for the agent
    /// </summary>
    public class AgentTool
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public Dictionary<string, ParameterDefinition> Parameters { get; set; } = new();
        public Func<Dictionary<string, object>, Task<string>> Handler { get; set; } = null!;
    }

    public class ParameterDefinition
    {
        public string Type { get; set; } = "string";
        public string Description { get; set; } = string.Empty;
        public bool Required { get; set; } = true;
    }

    /// <summary>
    /// Agent state tracking
    /// </summary>
    public class AgentState
    {
        public int TotalSteps { get; set; }
        public int ToolCalls { get; set; }
        public List<ActionRecord> ActionHistory { get; set; } = new();
        public bool IsComplete { get; set; }
        public string? FinalResult { get; set; }
    }

    public class ActionRecord
    {
        public int Step { get; set; }
        public string Type { get; set; } = string.Empty;
        public string? ToolName { get; set; }
        public Dictionary<string, object>? ToolArgs { get; set; }
        public string? ToolResult { get; set; }
        public string? Thought { get; set; }
    }

    /// <summary>
    /// Autonomous agent that can explore and use tools to complete tasks.
    /// 
    /// Example:
    /// <code>
    /// var agent = new AutonomousAgent(client);
    /// agent.RegisterTool(new AgentTool {
    ///     Name = "search",
    ///     Description = "Search for information",
    ///     Handler = async args => await SearchAsync((string)args["query"])
    /// });
    /// var result = await agent.RunAsync("Find information about AI safety");
    /// </code>
    /// </summary>
    public class AutonomousAgent
    {
        private readonly AnthropicClient _client;
        private readonly string _model;
        private readonly Dictionary<string, AgentTool> _tools = new();
        private readonly AgentState _state = new();
        private readonly List<Message> _conversationHistory = new();

        public AgentState State => _state;

        public AutonomousAgent(
            AnthropicClient client,
            string model = "claude-sonnet-4-20250514")
        {
            _client = client;
            _model = model;
        }

        /// <summary>
        /// Register a tool for the agent to use
        /// </summary>
        public AutonomousAgent RegisterTool(AgentTool tool)
        {
            _tools[tool.Name] = tool;
            return this;
        }

        /// <summary>
        /// Run the agent on a task
        /// </summary>
        public async Task<AgentResult> RunAsync(
            string task,
            int maxSteps = 10,
            Func<AgentState, bool>? shouldStop = null)
        {
            _state.TotalSteps = 0;
            _state.ToolCalls = 0;
            _state.ActionHistory.Clear();
            _state.IsComplete = false;
            _conversationHistory.Clear();

            // Initial system context
            var systemPrompt = BuildSystemPrompt();

            // Add initial user message
            _conversationHistory.Add(new Message(RoleType.User, $"Task: {task}"));

            while (_state.TotalSteps < maxSteps && !_state.IsComplete)
            {
                _state.TotalSteps++;

                // Check custom stopping condition
                if (shouldStop?.Invoke(_state) == true)
                {
                    break;
                }

                // Get next action from LLM
                var response = await GetNextActionAsync(systemPrompt);

                // Process the response
                var processResult = await ProcessResponseAsync(response);

                if (processResult.IsComplete)
                {
                    _state.IsComplete = true;
                    _state.FinalResult = processResult.FinalAnswer;
                }
            }

            return new AgentResult
            {
                Success = _state.IsComplete,
                FinalResult = _state.FinalResult ?? "Task not completed within step limit",
                TotalSteps = _state.TotalSteps,
                ToolCalls = _state.ToolCalls,
                ActionHistory = _state.ActionHistory.ToList()
            };
        }

        private string BuildSystemPrompt()
        {
            var toolDescriptions = string.Join("\n", _tools.Values.Select(t =>
            {
                var paramsDesc = string.Join(", ", t.Parameters.Select(p =>
                    $"{p.Key}: {p.Value.Type} ({p.Value.Description})"));
                return $"- {t.Name}({paramsDesc}): {t.Description}";
            }));

            return $@"You are an autonomous agent that can use tools to complete tasks.

Available tools:
{toolDescriptions}

To use a tool, respond with JSON in this format:
{{
    ""thought"": ""Your reasoning about what to do next"",
    ""action"": ""tool_name"",
    ""args"": {{ ""param"": ""value"" }}
}}

When you have completed the task, respond with:
{{
    ""thought"": ""Task is complete because..."",
    ""action"": ""complete"",
    ""result"": ""Your final answer""
}}

Always think step by step and use tools to gather information before providing a final answer.";
        }

        private async Task<MessageResponse> GetNextActionAsync(string systemPrompt)
        {
            var parameters = new MessageParameters
            {
                Messages = _conversationHistory.ToList(),
                Model = _model,
                MaxTokens = 2048,
                System = systemPrompt
            };

            return await _client.Messages.GetClaudeMessageAsync(parameters);
        }

        private async Task<ProcessResult> ProcessResponseAsync(MessageResponse response)
        {
            var text = response.Content.First().Text;

            // Try to parse as JSON action
            try
            {
                // Clean up potential markdown code blocks
                var json = text;
                if (json.Contains("```"))
                {
                    var start = json.IndexOf('{');
                    var end = json.LastIndexOf('}');
                    if (start >= 0 && end > start)
                    {
                        json = json.Substring(start, end - start + 1);
                    }
                }

                var action = JsonSerializer.Deserialize<AgentAction>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (action == null)
                {
                    return await HandleTextResponse(text);
                }

                // Record the thought
                _state.ActionHistory.Add(new ActionRecord
                {
                    Step = _state.TotalSteps,
                    Type = "thought",
                    Thought = action.Thought
                });

                // Check if task is complete
                if (action.Action?.ToLower() == "complete")
                {
                    return new ProcessResult
                    {
                        IsComplete = true,
                        FinalAnswer = action.Result ?? text
                    };
                }

                // Execute tool
                if (!string.IsNullOrEmpty(action.Action) && _tools.TryGetValue(action.Action, out var tool))
                {
                    _state.ToolCalls++;

                    var args = action.Args ?? new Dictionary<string, object>();
                    string toolResult;

                    try
                    {
                        toolResult = await tool.Handler(args);
                    }
                    catch (Exception ex)
                    {
                        toolResult = $"Error: {ex.Message}";
                    }

                    // Record tool call
                    _state.ActionHistory.Add(new ActionRecord
                    {
                        Step = _state.TotalSteps,
                        Type = "tool_call",
                        ToolName = action.Action,
                        ToolArgs = args,
                        ToolResult = toolResult
                    });

                    // Add assistant response and tool result to history
                    _conversationHistory.Add(new Message(RoleType.Assistant, text));
                    _conversationHistory.Add(new Message(RoleType.User, $"Tool result: {toolResult}"));

                    return new ProcessResult { IsComplete = false };
                }

                // Unknown action
                _conversationHistory.Add(new Message(RoleType.Assistant, text));
                _conversationHistory.Add(new Message(RoleType.User,
                    $"Unknown action: {action.Action}. Available tools: {string.Join(", ", _tools.Keys)}"));

                return new ProcessResult { IsComplete = false };
            }
            catch (JsonException)
            {
                return await HandleTextResponse(text);
            }
        }

        private Task<ProcessResult> HandleTextResponse(string text)
        {
            // Non-JSON response - treat as thinking/output
            _conversationHistory.Add(new Message(RoleType.Assistant, text));
            _conversationHistory.Add(new Message(RoleType.User,
                "Please respond with a JSON action or mark the task as complete."));

            _state.ActionHistory.Add(new ActionRecord
            {
                Step = _state.TotalSteps,
                Type = "text_response",
                Thought = text.Substring(0, Math.Min(200, text.Length))
            });

            return Task.FromResult(new ProcessResult { IsComplete = false });
        }

        private class AgentAction
        {
            public string? Thought { get; set; }
            public string? Action { get; set; }
            public Dictionary<string, object>? Args { get; set; }
            public string? Result { get; set; }
        }

        private class ProcessResult
        {
            public bool IsComplete { get; set; }
            public string? FinalAnswer { get; set; }
        }
    }

    public class AgentResult
    {
        public bool Success { get; set; }
        public string FinalResult { get; set; } = string.Empty;
        public int TotalSteps { get; set; }
        public int ToolCalls { get; set; }
        public List<ActionRecord> ActionHistory { get; set; } = new();
    }

    public static class AutonomousAgentExamples
    {
        public static async Task ResearchAgentExample()
        {
            var apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
                ?? throw new InvalidOperationException("ANTHROPIC_API_KEY not set");

            var client = new AnthropicClient(apiKey);
            var agent = new AutonomousAgent(client);

            // Register tools
            agent
                .RegisterTool(new AgentTool
                {
                    Name = "search",
                    Description = "Search for information on a topic",
                    Parameters = new Dictionary<string, ParameterDefinition>
                    {
                        ["query"] = new ParameterDefinition
                        {
                            Type = "string",
                            Description = "Search query"
                        }
                    },
                    Handler = async args =>
                    {
                        var query = args["query"]?.ToString() ?? "";
                        // Mock search - in production, use actual search API
                        await Task.Delay(100);
                        return $"Search results for '{query}':\n1. Result about {query}\n2. More info on {query}";
                    }
                })
                .RegisterTool(new AgentTool
                {
                    Name = "read_url",
                    Description = "Read content from a URL",
                    Parameters = new Dictionary<string, ParameterDefinition>
                    {
                        ["url"] = new ParameterDefinition
                        {
                            Type = "string",
                            Description = "URL to read"
                        }
                    },
                    Handler = async args =>
                    {
                        var url = args["url"]?.ToString() ?? "";
                        await Task.Delay(100);
                        return $"Content from {url}: [Mock content about the topic]";
                    }
                })
                .RegisterTool(new AgentTool
                {
                    Name = "write_note",
                    Description = "Save a note for later reference",
                    Parameters = new Dictionary<string, ParameterDefinition>
                    {
                        ["title"] = new ParameterDefinition { Type = "string", Description = "Note title" },
                        ["content"] = new ParameterDefinition { Type = "string", Description = "Note content" }
                    },
                    Handler = async args =>
                    {
                        var title = args["title"]?.ToString() ?? "";
                        var content = args["content"]?.ToString() ?? "";
                        await Task.Delay(50);
                        return $"Note saved: {title}";
                    }
                });

            var result = await agent.RunAsync(
                "Research the current state of quantum computing and summarize the key developments",
                maxSteps: 8);

            Console.WriteLine("=== Agent Results ===");
            Console.WriteLine($"Success: {result.Success}");
            Console.WriteLine($"Steps: {result.TotalSteps}");
            Console.WriteLine($"Tool Calls: {result.ToolCalls}");

            Console.WriteLine("\n=== Action History ===");
            foreach (var action in result.ActionHistory)
            {
                Console.WriteLine($"Step {action.Step} [{action.Type}]: {action.Thought ?? action.ToolName}");
                if (action.ToolResult != null)
                {
                    Console.WriteLine($"  Result: {action.ToolResult.Substring(0, Math.Min(100, action.ToolResult.Length))}...");
                }
            }

            Console.WriteLine($"\n=== Final Result ===\n{result.FinalResult}");
        }

        public static async Task CodingAgentExample()
        {
            var apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
                ?? throw new InvalidOperationException("ANTHROPIC_API_KEY not set");

            var client = new AnthropicClient(apiKey);
            var agent = new AutonomousAgent(client);

            // Register coding-focused tools
            agent
                .RegisterTool(new AgentTool
                {
                    Name = "read_file",
                    Description = "Read contents of a file",
                    Parameters = new Dictionary<string, ParameterDefinition>
                    {
                        ["path"] = new ParameterDefinition { Type = "string", Description = "File path" }
                    },
                    Handler = async args =>
                    {
                        var path = args["path"]?.ToString() ?? "";
                        // In production, implement actual file reading with safety checks
                        await Task.Delay(50);
                        return $"// Contents of {path}\npublic class Example {{ }}";
                    }
                })
                .RegisterTool(new AgentTool
                {
                    Name = "write_file",
                    Description = "Write content to a file",
                    Parameters = new Dictionary<string, ParameterDefinition>
                    {
                        ["path"] = new ParameterDefinition { Type = "string", Description = "File path" },
                        ["content"] = new ParameterDefinition { Type = "string", Description = "File content" }
                    },
                    Handler = async args =>
                    {
                        var path = args["path"]?.ToString() ?? "";
                        await Task.Delay(50);
                        return $"File written: {path}";
                    }
                })
                .RegisterTool(new AgentTool
                {
                    Name = "run_tests",
                    Description = "Run unit tests",
                    Parameters = new Dictionary<string, ParameterDefinition>
                    {
                        ["project"] = new ParameterDefinition { Type = "string", Description = "Project path" }
                    },
                    Handler = async args =>
                    {
                        await Task.Delay(100);
                        return "Tests passed: 5/5";
                    }
                })
                .RegisterTool(new AgentTool
                {
                    Name = "search_code",
                    Description = "Search for code patterns in the codebase",
                    Parameters = new Dictionary<string, ParameterDefinition>
                    {
                        ["pattern"] = new ParameterDefinition { Type = "string", Description = "Search pattern" }
                    },
                    Handler = async args =>
                    {
                        var pattern = args["pattern"]?.ToString() ?? "";
                        await Task.Delay(50);
                        return $"Found 3 matches for '{pattern}':\n- src/Service.cs:42\n- src/Handler.cs:15\n- tests/Test.cs:8";
                    }
                });

            var result = await agent.RunAsync(
                "Add input validation to the UserService.CreateUser method",
                maxSteps: 10);

            Console.WriteLine("=== Coding Agent Results ===");
            Console.WriteLine($"Success: {result.Success}");
            Console.WriteLine($"Steps: {result.TotalSteps}");
            Console.WriteLine($"\n=== Result ===\n{result.FinalResult}");
        }
    }
}
