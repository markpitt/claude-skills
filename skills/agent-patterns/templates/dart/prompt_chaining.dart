/// Prompt Chaining Pattern Implementation for Dart
/// Sequential LLM calls with programmatic checkpoints

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
    String model = 'claude-3-5-sonnet-20241022',
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
        'max_tokens': 4096,
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

/// Validation function type
typedef Validator = bool Function(String output);

/// Processing function type
typedef Processor = dynamic Function(String output);

/// Prompt template function type
typedef PromptTemplate<T> = String Function(Map<String, dynamic> context);

/// Represents a single step in the prompt chain
class ChainStep<T> {
  final String name;
  final PromptTemplate<T> promptTemplate;
  final Validator? validator;
  final Processor? processor;

  ChainStep({
    required this.name,
    required this.promptTemplate,
    this.validator,
    this.processor,
  });
}

/// Execution history entry
class ChainHistory {
  final String step;
  final String prompt;
  final String output;
  final Map<String, dynamic> context;

  ChainHistory({
    required this.step,
    required this.prompt,
    required this.output,
    required this.context,
  });

  @override
  String toString() => 'ChainHistory(step: $step, output: ${output.length} chars)';
}

/// Executes a sequence of LLM calls with validation and processing between steps.
///
/// Example:
/// ```dart
/// final chain = PromptChain(client: client);
/// chain.addStep(ChainStep(
///   name: 'outline',
///   promptTemplate: (ctx) => 'Create an outline for: ${ctx['topic']}',
///   validator: (output) => output.contains('1.') && output.contains('2.'),
/// ));
/// final result = await chain.execute({'topic': 'AI Safety'});
/// ```
class PromptChain<T> {
  final AnthropicClient client;
  final String model;
  final List<ChainStep<T>> _steps = [];
  final List<ChainHistory> _history = [];

  PromptChain({
    required this.client,
    this.model = 'claude-3-5-sonnet-20241022',
  });

  /// Add a step to the chain (builder pattern)
  PromptChain<T> addStep(ChainStep<T> step) {
    _steps.add(step);
    return this; // Allow chaining
  }

  /// Execute the chain with initial context
  Future<String> execute(Map<String, dynamic> initialContext) async {
    final context = Map<String, dynamic>.from(initialContext);
    String currentOutput = '';

    for (final step in _steps) {
      // Format prompt with current context
      final prompt = step.promptTemplate(context);

      // Call LLM
      currentOutput = await client.createMessage(
        prompt: prompt,
        model: model,
      );

      // Validate if validator provided
      if (step.validator != null && !step.validator!(currentOutput)) {
        final preview = currentOutput.length > 100
            ? currentOutput.substring(0, 100)
            : currentOutput;
        throw Exception(
          "Step '${step.name}' validation failed. Output: $preview",
        );
      }

      // Process if processor provided
      if (step.processor != null) {
        final processed = step.processor!(currentOutput);
        context[step.name] = processed;
      } else {
        context[step.name] = currentOutput;
      }

      // Track history
      _history.add(ChainHistory(
        step: step.name,
        prompt: prompt,
        output: currentOutput,
        context: Map<String, dynamic>.from(context),
      ));
    }

    return currentOutput;
  }

  /// Get execution history
  List<ChainHistory> get history => List.unmodifiable(_history);
}

// Example usage
Future<void> exampleDocumentGeneration() async {
  final apiKey = const String.fromEnvironment('ANTHROPIC_API_KEY');
  if (apiKey.isEmpty) {
    throw Exception('ANTHROPIC_API_KEY environment variable not set');
  }

  final client = AnthropicClient(apiKey: apiKey);
  final chain = PromptChain(client: client);

  // Step 1: Generate outline
  chain.addStep(ChainStep(
    name: 'outline',
    promptTemplate: (ctx) =>
        'Create a detailed outline for an article about: ${ctx['topic']}',
    validator: (output) => output.contains('1.') && output.contains('2.'),
  ));

  // Step 2: Expand outline
  chain.addStep(ChainStep(
    name: 'draft',
    promptTemplate: (ctx) => '''
Expand this outline into a full article:
${ctx['outline']}

Write in a professional tone with clear examples.
''',
    validator: (output) => output.split(' ').length > 200,
  ));

  // Step 3: Proofread
  chain.addStep(ChainStep(
    name: 'final',
    promptTemplate: (ctx) => '''
Proofread and polish this article:
${ctx['draft']}

Fix any grammar, improve clarity, and ensure consistent tone.
''',
  ));

  final result = await chain.execute({
    'topic': 'Building Effective AI Agents',
  });

  print('Final Article:');
  print(result);

  print('\n\nExecution History:');
  for (final entry in chain.history) {
    print(entry);
  }
}

// Example with custom types for type safety
class DocumentContext {
  final String topic;
  final String? outline;
  final String? draft;

  DocumentContext({
    required this.topic,
    this.outline,
    this.draft,
  });

  Map<String, dynamic> toMap() => {
        'topic': topic,
        if (outline != null) 'outline': outline,
        if (draft != null) 'draft': draft,
      };
}

Future<void> exampleTypedChain() async {
  final apiKey = const String.fromEnvironment('ANTHROPIC_API_KEY');
  final client = AnthropicClient(apiKey: apiKey);
  final chain = PromptChain<DocumentContext>(client: client);

  chain.addStep(ChainStep(
    name: 'outline',
    promptTemplate: (ctx) => 'Create an outline for: ${ctx['topic']}',
  ));

  final context = DocumentContext(topic: 'AI Safety');
  final result = await chain.execute(context.toMap());

  print(result);
}

void main() async {
  try {
    await exampleDocumentGeneration();
  } catch (e) {
    print('Error: $e');
  }
}
