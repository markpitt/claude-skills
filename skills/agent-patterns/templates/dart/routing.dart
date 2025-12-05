/// Routing Pattern Implementation for Dart
/// Classification-based routing of inputs to specialized handlers

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

/// Result of classification
class ClassificationResult<T> {
  final T category;
  final double confidence;
  final String reasoning;

  ClassificationResult({
    required this.category,
    required this.confidence,
    required this.reasoning,
  });

  @override
  String toString() =>
      'ClassificationResult(category: $category, confidence: $confidence)';
}

/// A route definition
class Route<T, R> {
  final T category;
  final String description;
  final Future<R> Function(String input) handler;

  Route({
    required this.category,
    required this.description,
    required this.handler,
  });
}

/// Routes inputs to specialized handlers based on LLM classification.
///
/// Example:
/// ```dart
/// final router = Router<String, String>(client: client)
///   ..addRoute(Route(
///     category: 'code',
///     description: 'Programming questions',
///     handler: (input) => handleCodeQuestion(input),
///   ))
///   ..addRoute(Route(
///     category: 'general',
///     description: 'General questions',
///     handler: (input) => handleGeneralQuestion(input),
///   ));
///
/// final result = await router.route('How do I sort a list in Python?');
/// ```
class Router<T, R> {
  final AnthropicClient client;
  final String model;
  final double confidenceThreshold;
  final List<Route<T, R>> _routes = [];
  final Future<R> Function(String input)? fallbackHandler;

  Router({
    required this.client,
    this.model = 'claude-sonnet-4-20250514',
    this.confidenceThreshold = 0.7,
    this.fallbackHandler,
  });

  /// Add a route
  Router<T, R> addRoute(Route<T, R> route) {
    _routes.add(route);
    return this;
  }

  /// Classify input into a category
  Future<ClassificationResult<T>> classify(String input) async {
    final categories = _routes.map((r) => '${r.category}: ${r.description}').join('\n');

    final prompt = '''
Classify the following input into one of these categories:
$categories

Input: $input

Respond in JSON format:
{
  "category": "category_name",
  "confidence": 0.0-1.0,
  "reasoning": "explanation"
}
''';

    final response = await client.createMessage(
      prompt: prompt,
      model: model,
      maxTokens: 256,
    );

    final jsonStr = _extractJson(response);
    final data = jsonDecode(jsonStr);

    return ClassificationResult<T>(
      category: data['category'] as T,
      confidence: (data['confidence'] as num).toDouble(),
      reasoning: data['reasoning'] as String,
    );
  }

  /// Route input to appropriate handler
  Future<R> route(String input) async {
    final classification = await classify(input);

    // Find matching route
    final matchingRoute = _routes.cast<Route<T, R>?>().firstWhere(
          (r) => r!.category == classification.category,
          orElse: () => null,
        );

    // Check confidence threshold
    if (matchingRoute != null && classification.confidence >= confidenceThreshold) {
      return matchingRoute.handler(input);
    }

    // Use fallback if available
    if (fallbackHandler != null) {
      return fallbackHandler!(input);
    }

    throw Exception(
      'No handler found for category: ${classification.category} '
      '(confidence: ${classification.confidence})',
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

/// Complexity level for model routing
enum Complexity { simple, moderate, complex }

/// Routes inputs to different models based on complexity.
///
/// Example:
/// ```dart
/// final router = ModelRouter(client: client);
/// final result = await router.route('What is 2+2?');  // Uses fast model
/// final result2 = await router.route('Analyze this code...');  // Uses powerful model
/// ```
class ModelRouter {
  final AnthropicClient client;
  final String fastModel;
  final String standardModel;
  final String powerfulModel;
  final String classificationModel;

  ModelRouter({
    required this.client,
    this.fastModel = 'claude-3-haiku-20240307',
    this.standardModel = 'claude-sonnet-4-20250514',
    this.powerfulModel = 'claude-opus-4-20250514',
    this.classificationModel = 'claude-sonnet-4-20250514',
  });

  /// Assess complexity of input
  Future<ClassificationResult<Complexity>> assessComplexity(String input) async {
    final prompt = '''
Assess the complexity of handling this request:

$input

Consider:
- simple: Direct factual answers, simple calculations, basic questions
- moderate: Analysis, explanations, moderate coding tasks
- complex: Deep analysis, complex reasoning, creative writing, complex code

Respond in JSON format:
{
  "complexity": "simple|moderate|complex",
  "confidence": 0.0-1.0,
  "reasoning": "explanation"
}
''';

    final response = await client.createMessage(
      prompt: prompt,
      model: classificationModel,
      maxTokens: 256,
    );

    final jsonStr = _extractJson(response);
    final data = jsonDecode(jsonStr);

    final complexityStr = data['complexity'] as String;
    final complexity = Complexity.values.firstWhere(
      (c) => c.name == complexityStr,
      orElse: () => Complexity.moderate,
    );

    return ClassificationResult<Complexity>(
      category: complexity,
      confidence: (data['confidence'] as num).toDouble(),
      reasoning: data['reasoning'] as String,
    );
  }

  /// Route to appropriate model and get response
  Future<String> route(String input) async {
    final assessment = await assessComplexity(input);

    final model = switch (assessment.category) {
      Complexity.simple => fastModel,
      Complexity.moderate => standardModel,
      Complexity.complex => powerfulModel,
    };

    return client.createMessage(
      prompt: input,
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

/// Support ticket for multi-stage routing example
class SupportTicket {
  final String id;
  final String content;
  final String? priority;
  final String? department;
  final String? resolution;

  SupportTicket({
    required this.id,
    required this.content,
    this.priority,
    this.department,
    this.resolution,
  });

  SupportTicket copyWith({
    String? id,
    String? content,
    String? priority,
    String? department,
    String? resolution,
  }) {
    return SupportTicket(
      id: id ?? this.id,
      content: content ?? this.content,
      priority: priority ?? this.priority,
      department: department ?? this.department,
      resolution: resolution ?? this.resolution,
    );
  }
}

/// Multi-stage routing pipeline
class TicketRouter {
  final AnthropicClient client;
  final String model;

  TicketRouter({
    required this.client,
    this.model = 'claude-sonnet-4-20250514',
  });

  Future<SupportTicket> routeTicket(SupportTicket ticket) async {
    // Stage 1: Classify priority
    final priority = await _classifyPriority(ticket.content);

    // Stage 2: Route to department
    final department = await _routeToDepartment(ticket.content);

    // Stage 3: Generate initial response
    final resolution = await _generateResponse(ticket.content, department);

    return ticket.copyWith(
      priority: priority,
      department: department,
      resolution: resolution,
    );
  }

  Future<String> _classifyPriority(String content) async {
    final prompt = '''
Classify the priority of this support ticket:
$content

Options: low, medium, high, critical
Respond with just the priority level.
''';

    final response = await client.createMessage(
      prompt: prompt,
      model: model,
      maxTokens: 32,
    );

    return response.trim().toLowerCase();
  }

  Future<String> _routeToDepartment(String content) async {
    final prompt = '''
Route this support ticket to the appropriate department:
$content

Options: billing, technical, sales, general
Respond with just the department name.
''';

    final response = await client.createMessage(
      prompt: prompt,
      model: model,
      maxTokens: 32,
    );

    return response.trim().toLowerCase();
  }

  Future<String> _generateResponse(String content, String department) async {
    final prompt = '''
As a $department support specialist, provide an initial response to:
$content

Be helpful and professional.
''';

    return client.createMessage(
      prompt: prompt,
      model: model,
    );
  }
}

// Example usage
Future<void> exampleRouting() async {
  final apiKey = const String.fromEnvironment('ANTHROPIC_API_KEY');
  if (apiKey.isEmpty) {
    throw Exception('ANTHROPIC_API_KEY environment variable not set');
  }

  final client = AnthropicClient(apiKey: apiKey);

  // Category-based routing
  final router = Router<String, String>(
    client: client,
    fallbackHandler: (input) async => 'Handling as general query: $input',
  )
    ..addRoute(Route(
      category: 'code',
      description: 'Programming and coding questions',
      handler: (input) async {
        return client.createMessage(
          prompt: 'As a coding expert, answer: $input',
        );
      },
    ))
    ..addRoute(Route(
      category: 'math',
      description: 'Mathematics and calculations',
      handler: (input) async {
        return client.createMessage(
          prompt: 'As a math expert, solve: $input',
        );
      },
    ))
    ..addRoute(Route(
      category: 'general',
      description: 'General knowledge questions',
      handler: (input) async {
        return client.createMessage(
          prompt: 'Answer this question: $input',
        );
      },
    ));

  final result = await router.route('How do I implement a binary search tree?');
  print('Routed result: $result');

  // Model-based routing
  final modelRouter = ModelRouter(client: client);
  final modelResult = await modelRouter.route('What is the capital of France?');
  print('Model routing result: $modelResult');
}

void main() async {
  try {
    await exampleRouting();
  } catch (e) {
    print('Error: $e');
  }
}
