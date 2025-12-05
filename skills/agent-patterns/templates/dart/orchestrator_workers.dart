/// Orchestrator-Workers Pattern Implementation for Dart
/// Central orchestrator delegates to specialized workers

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
  }) async {
    final response = await httpClient.post(
      Uri.parse('https://api.anthropic.com/v1/messages'),
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: jsonEncode({
        'model': model,
        'max_tokens': maxTokens,
        'messages': [
          {'role': 'user', 'content': prompt}
        ],
      }),
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

/// Result of a worker's execution
class WorkerResult {
  final String taskId;
  final String workerType;
  final dynamic result;
  final bool success;
  final String? error;

  WorkerResult({
    required this.taskId,
    required this.workerType,
    required this.result,
    required this.success,
    this.error,
  });
}

/// A subtask assigned to a worker
class SubTask {
  final String id;
  final String type;
  final String description;
  final Map<String, dynamic> context;
  final List<String> dependencies;

  SubTask({
    required this.id,
    required this.type,
    required this.description,
    this.context = const {},
    this.dependencies = const [],
  });

  factory SubTask.fromJson(Map<String, dynamic> json) {
    return SubTask(
      id: json['id'] as String,
      type: json['type'] as String,
      description: json['description'] as String,
      context: json['context'] as Map<String, dynamic>? ?? {},
      dependencies: (json['dependencies'] as List?)?.cast<String>() ?? [],
    );
  }
}

/// Worker interface
abstract class Worker {
  String get workerType;
  Future<WorkerResult> execute(SubTask task);
}

/// LLM-based worker
class LLMWorker implements Worker {
  final AnthropicClient client;
  @override
  final String workerType;
  final String systemPrompt;
  final String model;

  LLMWorker({
    required this.client,
    required this.workerType,
    required this.systemPrompt,
    this.model = 'claude-sonnet-4-20250514',
  });

  @override
  Future<WorkerResult> execute(SubTask task) async {
    try {
      final prompt = '''
$systemPrompt

Task: ${task.description}

Context:
${jsonEncode(task.context)}

Provide your result:
''';

      final result = await client.createMessage(
        prompt: prompt,
        model: model,
      );

      return WorkerResult(
        taskId: task.id,
        workerType: workerType,
        result: result,
        success: true,
      );
    } catch (e) {
      return WorkerResult(
        taskId: task.id,
        workerType: workerType,
        result: null,
        success: false,
        error: e.toString(),
      );
    }
  }
}

/// Orchestration plan
class OrchestrationPlan {
  final List<SubTask> tasks;
  final String synthesis;

  OrchestrationPlan({
    required this.tasks,
    required this.synthesis,
  });
}

/// Result of orchestration
class OrchestrationResult {
  final String task;
  final List<WorkerResult> workerResults;
  final String finalResult;
  final bool success;

  OrchestrationResult({
    required this.task,
    required this.workerResults,
    required this.finalResult,
    required this.success,
  });
}

/// Orchestrator that breaks down tasks and delegates to workers.
///
/// Example:
/// ```dart
/// final orchestrator = Orchestrator(client: client)
///   ..registerWorker(LLMWorker(
///     client: client,
///     workerType: 'researcher',
///     systemPrompt: 'You are a research specialist.',
///   ))
///   ..registerWorker(LLMWorker(
///     client: client,
///     workerType: 'writer',
///     systemPrompt: 'You are a technical writer.',
///   ));
///
/// final result = await orchestrator.execute('Write a report on AI safety');
/// ```
class Orchestrator {
  final AnthropicClient client;
  final String model;
  final Map<String, Worker> _workers = {};

  Orchestrator({
    required this.client,
    this.model = 'claude-sonnet-4-20250514',
  });

  /// Register a worker
  Orchestrator registerWorker(Worker worker) {
    _workers[worker.workerType] = worker;
    return this;
  }

  /// Get registered worker types
  List<String> get workerTypes => _workers.keys.toList();

  /// Execute a complex task
  Future<OrchestrationResult> execute(String task) async {
    // Step 1: Plan the work
    final plan = await _createPlan(task);

    // Step 2: Execute tasks respecting dependencies
    final workerResults = await _executeWithDependencies(plan.tasks);

    // Step 3: Synthesize results
    final finalResult = await _synthesize(task, workerResults, plan.synthesis);

    return OrchestrationResult(
      task: task,
      workerResults: workerResults,
      finalResult: finalResult,
      success: workerResults.every((r) => r.success),
    );
  }

  Future<OrchestrationPlan> _createPlan(String task) async {
    final workerDescriptions = _workers.entries
        .map((e) => '- ${e.key}: ${e.value.workerType}')
        .join('\n');

    final prompt = '''
Break down this task into subtasks for specialized workers.

Available workers:
$workerDescriptions

Task: $task

Respond in JSON format:
{
  "tasks": [
    {
      "id": "task_1",
      "type": "worker_type",
      "description": "What this worker should do",
      "dependencies": []
    },
    {
      "id": "task_2",
      "type": "another_worker_type",
      "description": "What this worker should do",
      "dependencies": ["task_1"]
    }
  ],
  "synthesis": "How to combine the results"
}
''';

    final response = await client.createMessage(
      prompt: prompt,
      model: model,
    );

    final jsonStr = _extractJson(response);
    final data = jsonDecode(jsonStr);

    final tasks = (data['tasks'] as List)
        .map((t) => SubTask.fromJson(t as Map<String, dynamic>))
        .toList();

    return OrchestrationPlan(
      tasks: tasks,
      synthesis: data['synthesis'] as String? ?? 'Combine all results.',
    );
  }

  Future<List<WorkerResult>> _executeWithDependencies(
    List<SubTask> tasks,
  ) async {
    final results = <String, WorkerResult>{};
    final completed = <String>{};
    final pending = List<SubTask>.from(tasks);

    while (pending.isNotEmpty) {
      // Find tasks ready to execute
      final ready = pending.where((t) {
        return t.dependencies.every((d) => completed.contains(d));
      }).toList();

      if (ready.isEmpty && pending.isNotEmpty) {
        throw Exception('Circular dependency detected');
      }

      // Execute ready tasks in parallel
      final futures = ready.map((task) async {
        // Add context from dependencies
        final taskContext = Map<String, dynamic>.from(task.context);
        for (final depId in task.dependencies) {
          if (results.containsKey(depId)) {
            taskContext[depId] = results[depId]!.result;
          }
        }

        final taskWithContext = SubTask(
          id: task.id,
          type: task.type,
          description: task.description,
          context: taskContext,
          dependencies: task.dependencies,
        );

        final worker = _workers[task.type];
        if (worker == null) {
          return WorkerResult(
            taskId: task.id,
            workerType: task.type,
            result: null,
            success: false,
            error: 'No worker found for type: ${task.type}',
          );
        }

        return worker.execute(taskWithContext);
      });

      final batchResults = await Future.wait(futures);

      // Update state
      for (final result in batchResults) {
        results[result.taskId] = result;
        completed.add(result.taskId);
      }

      pending.removeWhere((t) => completed.contains(t.id));
    }

    return results.values.toList();
  }

  Future<String> _synthesize(
    String originalTask,
    List<WorkerResult> results,
    String synthesisInstructions,
  ) async {
    final resultSummaries = results.map((r) => '''
Worker: ${r.workerType}
Task: ${r.taskId}
Result: ${r.success ? r.result : 'FAILED: ${r.error}'}
''').join('\n---\n');

    final prompt = '''
Synthesize these worker results into a final response.

Original task: $originalTask

Worker results:
$resultSummaries

Instructions: $synthesisInstructions

Provide a comprehensive final result:
''';

    return client.createMessage(
      prompt: prompt,
      model: model,
    );
  }

  String _extractJson(String text) {
    final start = text.indexOf('{');
    final end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return text.substring(start, end + 1);
    }
    return text;
  }
}

/// Simple code generation orchestrator
class CodeGenerationOrchestrator {
  final Orchestrator _orchestrator;

  CodeGenerationOrchestrator(AnthropicClient client)
      : _orchestrator = Orchestrator(client: client) {
    _orchestrator
      ..registerWorker(LLMWorker(
        client: client,
        workerType: 'architect',
        systemPrompt:
            'You are a software architect. Design clean, maintainable solutions.',
      ))
      ..registerWorker(LLMWorker(
        client: client,
        workerType: 'implementer',
        systemPrompt:
            'You are a code implementer. Write clean, working code based on designs.',
      ))
      ..registerWorker(LLMWorker(
        client: client,
        workerType: 'tester',
        systemPrompt:
            'You are a test engineer. Write comprehensive tests for the code.',
      ))
      ..registerWorker(LLMWorker(
        client: client,
        workerType: 'documenter',
        systemPrompt:
            'You are a technical writer. Create clear documentation.',
      ));
  }

  Future<OrchestrationResult> generateCode(String requirement) =>
      _orchestrator.execute(requirement);
}

/// Research orchestrator
class ResearchOrchestrator {
  final Orchestrator _orchestrator;

  ResearchOrchestrator(AnthropicClient client)
      : _orchestrator = Orchestrator(client: client) {
    _orchestrator
      ..registerWorker(LLMWorker(
        client: client,
        workerType: 'researcher',
        systemPrompt:
            'You are a research analyst. Gather and analyze information.',
      ))
      ..registerWorker(LLMWorker(
        client: client,
        workerType: 'fact_checker',
        systemPrompt:
            'You are a fact checker. Verify claims and identify uncertainties.',
      ))
      ..registerWorker(LLMWorker(
        client: client,
        workerType: 'synthesizer',
        systemPrompt:
            'You are a research synthesizer. Combine findings into coherent summaries.',
      ));
  }

  Future<OrchestrationResult> research(String topic) =>
      _orchestrator.execute('Research and summarize: $topic');
}

// Example usage
Future<void> exampleOrchestration() async {
  final apiKey = const String.fromEnvironment('ANTHROPIC_API_KEY');
  if (apiKey.isEmpty) {
    throw Exception('ANTHROPIC_API_KEY environment variable not set');
  }

  final client = AnthropicClient(apiKey: apiKey);

  // Custom orchestrator
  print('=== Custom Orchestrator ===');
  final orchestrator = Orchestrator(client: client)
    ..registerWorker(LLMWorker(
      client: client,
      workerType: 'planner',
      systemPrompt: 'You are a project planner. Break down projects into phases.',
    ))
    ..registerWorker(LLMWorker(
      client: client,
      workerType: 'estimator',
      systemPrompt: 'You are a time estimator. Provide realistic time estimates.',
    ))
    ..registerWorker(LLMWorker(
      client: client,
      workerType: 'risk_analyst',
      systemPrompt: 'You are a risk analyst. Identify potential risks and mitigations.',
    ));

  final result = await orchestrator.execute(
    'Plan a mobile app development project for a fitness tracker',
  );

  print('Task: ${result.task}');
  print('Success: ${result.success}');
  print('\nWorker Results:');
  for (final workerResult in result.workerResults) {
    print('- ${workerResult.workerType}: ${workerResult.success ? 'Success' : 'Failed'}');
  }
  print('\nFinal Result:');
  print(result.finalResult);

  // Code generation orchestrator
  print('\n=== Code Generation Orchestrator ===');
  final codeOrchestrator = CodeGenerationOrchestrator(client);
  final codeResult = await codeOrchestrator.generateCode(
    'Create a Dart class for managing a shopping cart with add, remove, and total calculation',
  );

  print('Code generation success: ${codeResult.success}');
  print('\nGenerated code and documentation:');
  print(codeResult.finalResult);
}

void main() async {
  try {
    await exampleOrchestration();
  } catch (e) {
    print('Error: $e');
  }
}
