/// Autonomous Agent Pattern Implementation for Dart
/// Open-ended exploration with tool usage

import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;

/// Anthropic API client
class AnthropicClient {
  final String apiKey;
  final http.Client httpClient;

  AnthropicClient({
    required this.apiKey,
    http.Client? httpClient,
  }) : httpClient = httpClient ?? http.Client();

  Future<String> createMessage({
    required String prompt,
    String model = 'claude-sonnet-4-20250514',
    int maxTokens = 4096,
    String? systemPrompt,
  }) async {
    final body = <String, dynamic>{
      'model': model,
      'max_tokens': maxTokens,
      'messages': [
        {'role': 'user', 'content': prompt}
      ],
    };

    if (systemPrompt != null) {
      body['system'] = systemPrompt;
    }

    final response = await httpClient.post(
      Uri.parse('https://api.anthropic.com/v1/messages'),
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: jsonEncode(body),
    );

    if (response.statusCode != 200) {
      throw Exception('API error (${response.statusCode}): ${response.body}');
    }

    final data = jsonDecode(response.body);
    final content = data['content'] as List;

    for (var block in content) {
      if (block['type'] == 'text') {
        return block['text'] as String;
      }
    }

    throw Exception('No text content in response');
  }
}

/// Tool parameter definition
class ToolParameter {
  final String type;
  final String description;
  final bool required;

  ToolParameter({
    required this.type,
    required this.description,
    this.required = false,
  });
}

/// Tool handler function type
typedef ToolHandler = Future<String> Function(Map<String, dynamic> args);

/// Agent tool definition
class AgentTool {
  final String name;
  final String description;
  final Map<String, ToolParameter> parameters;
  final ToolHandler handler;

  AgentTool({
    required this.name,
    required this.description,
    required this.parameters,
    required this.handler,
  });
}

/// Represents an action in the agent's history
class ActionRecord {
  final int step;
  final String actionType;
  final String? toolName;
  final Map<String, dynamic>? toolArgs;
  final String? toolResult;
  final String? thought;

  ActionRecord({
    required this.step,
    required this.actionType,
    this.toolName,
    this.toolArgs,
    this.toolResult,
    this.thought,
  });

  @override
  String toString() {
    final name = toolName ?? thought ?? actionType;
    return 'Step $step [$actionType]: $name';
  }
}

/// Current state of the agent
class AgentState {
  int totalSteps = 0;
  int toolCalls = 0;
  List<ActionRecord> actionHistory = [];
  bool isComplete = false;
  String? finalResult;
}

/// Result of running the agent
class AgentResult {
  final bool success;
  final String finalResult;
  final int totalSteps;
  final int toolCalls;
  final List<ActionRecord> actionHistory;

  AgentResult({
    required this.success,
    required this.finalResult,
    required this.totalSteps,
    required this.toolCalls,
    required this.actionHistory,
  });
}

/// Autonomous agent that can explore and use tools to complete tasks.
///
/// Example:
/// ```dart
/// final agent = AutonomousAgent(client: client)
///   ..registerTool(AgentTool(
///     name: 'search',
///     description: 'Search for information',
///     parameters: {
///       'query': ToolParameter(type: 'string', description: 'Search query', required: true),
///     },
///     handler: (args) async => 'Results for: ${args['query']}',
///   ));
///
/// final result = await agent.run('Research AI safety', maxSteps: 10);
/// ```
class AutonomousAgent {
  final AnthropicClient client;
  final String model;
  final Map<String, AgentTool> _tools = {};
  AgentState _state = AgentState();
  final List<_ConversationMessage> _conversationHistory = [];

  AutonomousAgent({
    required this.client,
    this.model = 'claude-sonnet-4-20250514',
  });

  /// Register a tool for the agent
  AutonomousAgent registerTool(AgentTool tool) {
    _tools[tool.name] = tool;
    return this;
  }

  /// Get current agent state
  AgentState get state => _state;

  /// Run the agent on a task
  Future<AgentResult> run(String task, {int maxSteps = 10}) async {
    return runWithStopCondition(task, maxSteps: maxSteps);
  }

  /// Run with custom stopping condition
  Future<AgentResult> runWithStopCondition(
    String task, {
    int maxSteps = 10,
    bool Function(AgentState state)? shouldStop,
  }) async {
    // Reset state
    _state = AgentState();
    _conversationHistory.clear();

    // Build system prompt
    final systemPrompt = _buildSystemPrompt();

    // Add initial message
    _conversationHistory.add(_ConversationMessage(
      role: 'user',
      content: 'Task: $task',
    ));

    while (_state.totalSteps < maxSteps && !_state.isComplete) {
      _state.totalSteps++;

      // Check custom stopping condition
      if (shouldStop != null && shouldStop(_state)) {
        break;
      }

      // Get next action
      final response = await _getNextAction(systemPrompt);

      // Process response
      await _processResponse(response);
    }

    final finalResult = _state.finalResult ?? 'Task not completed within step limit';

    return AgentResult(
      success: _state.isComplete,
      finalResult: finalResult,
      totalSteps: _state.totalSteps,
      toolCalls: _state.toolCalls,
      actionHistory: _state.actionHistory,
    );
  }

  String _buildSystemPrompt() {
    final toolDescriptions = _tools.values.map((tool) {
      final params = tool.parameters.entries
          .map((e) => '${e.key}: ${e.value.type} - ${e.value.description}')
          .join(', ');
      return '- ${tool.name}($params): ${tool.description}';
    }).join('\n');

    return '''
You are an autonomous agent that can use tools to complete tasks.

Available tools:
$toolDescriptions

To use a tool, respond with JSON in this format:
{
  "thought": "Your reasoning about what to do next",
  "action": "tool_name",
  "args": { "param": "value" }
}

When you have completed the task, respond with:
{
  "thought": "Task is complete because...",
  "action": "complete",
  "result": "Your final answer"
}

Always think step by step and use tools to gather information before providing a final answer.
''';
  }

  Future<String> _getNextAction(String systemPrompt) async {
    // Build full prompt with conversation history
    final historyText = _conversationHistory
        .map((m) => '${m.role}: ${m.content}')
        .join('\n\n');

    return client.createMessage(
      prompt: historyText,
      model: model,
      maxTokens: 2048,
      systemPrompt: systemPrompt,
    );
  }

  Future<void> _processResponse(String response) async {
    // Try to parse as JSON action
    final jsonStr = _cleanJson(response);

    try {
      final data = jsonDecode(jsonStr) as Map<String, dynamic>;

      // Record thought
      final thought = data['thought'] as String?;
      if (thought != null) {
        _state.actionHistory.add(ActionRecord(
          step: _state.totalSteps,
          actionType: 'thought',
          thought: thought,
        ));
      }

      final action = data['action'] as String?;

      // Check if complete
      if (action?.toLowerCase() == 'complete') {
        _state.isComplete = true;
        _state.finalResult = data['result'] as String? ?? response;
        return;
      }

      // Execute tool
      if (action != null && _tools.containsKey(action)) {
        _state.toolCalls++;

        final tool = _tools[action]!;
        final args = (data['args'] as Map<String, dynamic>?) ?? {};

        String toolResult;
        try {
          toolResult = await tool.handler(args);
        } catch (e) {
          toolResult = 'Error: $e';
        }

        // Record tool call
        _state.actionHistory.add(ActionRecord(
          step: _state.totalSteps,
          actionType: 'tool_call',
          toolName: action,
          toolArgs: args,
          toolResult: toolResult,
        ));

        // Update conversation
        _conversationHistory.add(_ConversationMessage(
          role: 'assistant',
          content: response,
        ));
        _conversationHistory.add(_ConversationMessage(
          role: 'user',
          content: 'Tool result: $toolResult',
        ));
      } else if (action != null) {
        // Unknown action
        final toolNames = _tools.keys.join(', ');
        _conversationHistory.add(_ConversationMessage(
          role: 'assistant',
          content: response,
        ));
        _conversationHistory.add(_ConversationMessage(
          role: 'user',
          content: 'Unknown action: $action. Available tools: $toolNames',
        ));
      }
    } catch (e) {
      // Non-JSON response
      _handleTextResponse(response);
    }
  }

  void _handleTextResponse(String response) {
    _conversationHistory.add(_ConversationMessage(
      role: 'assistant',
      content: response,
    ));
    _conversationHistory.add(_ConversationMessage(
      role: 'user',
      content: 'Please respond with a JSON action or mark the task as complete.',
    ));

    final thought = response.length > 200 ? response.substring(0, 200) : response;
    _state.actionHistory.add(ActionRecord(
      step: _state.totalSteps,
      actionType: 'text_response',
      thought: thought,
    ));
  }

  String _cleanJson(String text) {
    if (text.contains('```')) {
      final start = text.indexOf('{');
      final end = text.lastIndexOf('}');
      if (start >= 0 && end > start) {
        return text.substring(start, end + 1);
      }
    }
    return text;
  }
}

/// Internal conversation message
class _ConversationMessage {
  final String role;
  final String content;

  _ConversationMessage({
    required this.role,
    required this.content,
  });
}

/// Research agent with pre-configured tools
class ResearchAgent {
  final AutonomousAgent _agent;

  ResearchAgent(AnthropicClient client)
      : _agent = AutonomousAgent(client: client) {
    _agent
      ..registerTool(AgentTool(
        name: 'search',
        description: 'Search for information on a topic',
        parameters: {
          'query': ToolParameter(
            type: 'string',
            description: 'Search query',
            required: true,
          ),
        },
        handler: (args) async {
          final query = args['query'] as String;
          // Mock search - use actual search API in production
          return 'Search results for "$query":\n'
              '1. Key information about $query\n'
              '2. Recent developments in $query\n'
              '3. Expert opinions on $query';
        },
      ))
      ..registerTool(AgentTool(
        name: 'read_url',
        description: 'Read content from a URL',
        parameters: {
          'url': ToolParameter(
            type: 'string',
            description: 'URL to read',
            required: true,
          ),
        },
        handler: (args) async {
          final url = args['url'] as String;
          return 'Content from $url: [Mock content about the topic]';
        },
      ))
      ..registerTool(AgentTool(
        name: 'save_note',
        description: 'Save a note for later reference',
        parameters: {
          'title': ToolParameter(
            type: 'string',
            description: 'Note title',
            required: true,
          ),
          'content': ToolParameter(
            type: 'string',
            description: 'Note content',
            required: true,
          ),
        },
        handler: (args) async {
          final title = args['title'] as String;
          return 'Note saved: $title';
        },
      ));
  }

  Future<AgentResult> research(String topic, {int maxSteps = 10}) =>
      _agent.run(topic, maxSteps: maxSteps);
}

/// Coding agent with code-related tools
class CodingAgent {
  final AutonomousAgent _agent;

  CodingAgent(AnthropicClient client)
      : _agent = AutonomousAgent(client: client) {
    _agent
      ..registerTool(AgentTool(
        name: 'read_file',
        description: 'Read a file from the filesystem',
        parameters: {
          'path': ToolParameter(
            type: 'string',
            description: 'Path to the file',
            required: true,
          ),
        },
        handler: (args) async {
          final path = args['path'] as String;
          // Mock file read - implement actual file reading
          return '// Contents of $path\nclass Example {\n  void run() {}\n}';
        },
      ))
      ..registerTool(AgentTool(
        name: 'write_file',
        description: 'Write content to a file',
        parameters: {
          'path': ToolParameter(
            type: 'string',
            description: 'Path to the file',
            required: true,
          ),
          'content': ToolParameter(
            type: 'string',
            description: 'Content to write',
            required: true,
          ),
        },
        handler: (args) async {
          final path = args['path'] as String;
          return 'File written: $path';
        },
      ))
      ..registerTool(AgentTool(
        name: 'run_tests',
        description: 'Run tests for a file or project',
        parameters: {
          'target': ToolParameter(
            type: 'string',
            description: 'Test target (file or directory)',
            required: true,
          ),
        },
        handler: (args) async {
          final target = args['target'] as String;
          return 'Tests for $target:\n✓ test_example_1\n✓ test_example_2\nAll tests passed.';
        },
      ));
  }

  Future<AgentResult> code(String task, {int maxSteps = 10}) =>
      _agent.run(task, maxSteps: maxSteps);
}

// Example usage
Future<void> exampleAutonomousAgent() async {
  final apiKey = const String.fromEnvironment('ANTHROPIC_API_KEY');
  if (apiKey.isEmpty) {
    throw Exception('ANTHROPIC_API_KEY environment variable not set');
  }

  final client = AnthropicClient(apiKey: apiKey);

  // Custom agent
  print('=== Custom Autonomous Agent ===');
  final agent = AutonomousAgent(client: client)
    ..registerTool(AgentTool(
      name: 'calculate',
      description: 'Perform mathematical calculations',
      parameters: {
        'expression': ToolParameter(
          type: 'string',
          description: 'Math expression to evaluate',
          required: true,
        ),
      },
      handler: (args) async {
        final expr = args['expression'] as String;
        // Simplified - use actual expression evaluator
        if (expr.contains('+')) {
          final parts = expr.split('+').map((p) => int.tryParse(p.trim()) ?? 0);
          return 'Result: ${parts.reduce((a, b) => a + b)}';
        }
        return 'Result: [evaluated $expr]';
      },
    ))
    ..registerTool(AgentTool(
      name: 'lookup',
      description: 'Look up a fact or definition',
      parameters: {
        'term': ToolParameter(
          type: 'string',
          description: 'Term to look up',
          required: true,
        ),
      },
      handler: (args) async {
        final term = args['term'] as String;
        return 'Definition of "$term": A commonly used term in this context...';
      },
    ));

  final result = await agent.run(
    'What is 25 + 37 and what does the result mean in binary?',
    maxSteps: 8,
  );

  print('Success: ${result.success}');
  print('Steps: ${result.totalSteps}');
  print('Tool Calls: ${result.toolCalls}');

  print('\nAction History:');
  for (final action in result.actionHistory) {
    print('  $action');
    if (action.toolResult != null) {
      final preview = action.toolResult!.length > 50
          ? '${action.toolResult!.substring(0, 50)}...'
          : action.toolResult!;
      print('    Result: $preview');
    }
  }

  print('\nFinal Result:');
  print(result.finalResult);

  // Research agent
  print('\n=== Research Agent ===');
  final researcher = ResearchAgent(client);
  final researchResult = await researcher.research(
    'What are the latest developments in quantum computing?',
    maxSteps: 6,
  );

  print('Research completed: ${researchResult.success}');
  print('Steps: ${researchResult.totalSteps}');
  print('Final Result: ${researchResult.finalResult}');
}

void main() async {
  try {
    await exampleAutonomousAgent();
  } catch (e) {
    print('Error: $e');
  }
}
