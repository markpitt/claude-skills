/// Parallelization Pattern Implementation for Dart
/// Concurrent LLM calls with sectioning, voting, and guardrails

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

/// Result of processing a section
class SectionResult {
  final int index;
  final String section;
  final String result;
  final bool success;
  final String? error;

  SectionResult({
    required this.index,
    required this.section,
    required this.result,
    required this.success,
    this.error,
  });
}

/// Processes independent sections of work in parallel.
///
/// Example:
/// ```dart
/// final parallelizer = SectioningParallelizer(
///   client: client,
///   promptTemplate: (section) => 'Translate to Spanish: $section',
/// );
/// final results = await parallelizer.process([
///   'Hello, how are you?',
///   'The weather is nice today.',
///   'I love programming.',
/// ]);
/// ```
class SectioningParallelizer {
  final AnthropicClient client;
  final String model;
  final String Function(String section) promptTemplate;
  final int? maxConcurrency;

  SectioningParallelizer({
    required this.client,
    required this.promptTemplate,
    this.model = 'claude-sonnet-4-20250514',
    this.maxConcurrency,
  });

  /// Process all sections in parallel
  Future<List<SectionResult>> process(List<String> sections) async {
    if (maxConcurrency != null && maxConcurrency! > 0) {
      return _processWithLimit(sections, maxConcurrency!);
    }

    final futures = sections.asMap().entries.map((entry) async {
      final index = entry.key;
      final section = entry.value;
      try {
        final prompt = promptTemplate(section);
        final result = await client.createMessage(
          prompt: prompt,
          model: model,
        );
        return SectionResult(
          index: index,
          section: section,
          result: result,
          success: true,
        );
      } catch (e) {
        return SectionResult(
          index: index,
          section: section,
          result: '',
          success: false,
          error: e.toString(),
        );
      }
    }).toList();

    return Future.wait(futures);
  }

  Future<List<SectionResult>> _processWithLimit(
    List<String> sections,
    int limit,
  ) async {
    final results = <SectionResult>[];
    final chunks = _chunkList(sections.asMap().entries.toList(), limit);

    for (final chunk in chunks) {
      final chunkFutures = chunk.map((entry) async {
        final index = entry.key;
        final section = entry.value;
        try {
          final prompt = promptTemplate(section);
          final result = await client.createMessage(
            prompt: prompt,
            model: model,
          );
          return SectionResult(
            index: index,
            section: section,
            result: result,
            success: true,
          );
        } catch (e) {
          return SectionResult(
            index: index,
            section: section,
            result: '',
            success: false,
            error: e.toString(),
          );
        }
      }).toList();

      results.addAll(await Future.wait(chunkFutures));
    }

    // Sort by original index
    results.sort((a, b) => a.index.compareTo(b.index));
    return results;
  }

  List<List<T>> _chunkList<T>(List<T> list, int chunkSize) {
    final chunks = <List<T>>[];
    for (var i = 0; i < list.length; i += chunkSize) {
      final end = (i + chunkSize < list.length) ? i + chunkSize : list.length;
      chunks.add(list.sublist(i, end));
    }
    return chunks;
  }
}

/// Result of a vote
class VoteResult {
  final int index;
  final String response;
  final bool success;
  final String? error;

  VoteResult({
    required this.index,
    required this.response,
    required this.success,
    this.error,
  });
}

/// Voting result with aggregated responses
class VotingResult {
  final String winner;
  final int winnerCount;
  final Map<String, int> votes;
  final List<VoteResult> allResponses;

  VotingResult({
    required this.winner,
    required this.winnerCount,
    required this.votes,
    required this.allResponses,
  });

  double get confidence => allResponses.isEmpty
      ? 0.0
      : winnerCount / allResponses.where((r) => r.success).length;
}

/// Gets multiple LLM responses and aggregates via voting.
///
/// Example:
/// ```dart
/// final voter = VotingParallelizer(
///   client: client,
///   numVoters: 5,
///   extractAnswer: (response) => response.split('\n').first.toLowerCase(),
/// );
/// final result = await voter.vote('Is water wet? Answer yes or no.');
/// print('Winner: ${result.winner} (${result.confidence * 100}% confidence)');
/// ```
class VotingParallelizer {
  final AnthropicClient client;
  final String model;
  final int numVoters;
  final String Function(String response)? extractAnswer;

  VotingParallelizer({
    required this.client,
    this.model = 'claude-sonnet-4-20250514',
    this.numVoters = 3,
    this.extractAnswer,
  });

  /// Get votes and aggregate
  Future<VotingResult> vote(String prompt) async {
    final futures = List.generate(numVoters, (index) async {
      try {
        final response = await client.createMessage(
          prompt: prompt,
          model: model,
        );
        return VoteResult(
          index: index,
          response: response,
          success: true,
        );
      } catch (e) {
        return VoteResult(
          index: index,
          response: '',
          success: false,
          error: e.toString(),
        );
      }
    });

    final results = await Future.wait(futures);
    return _aggregateVotes(results);
  }

  VotingResult _aggregateVotes(List<VoteResult> results) {
    final votes = <String, int>{};

    for (final result in results) {
      if (!result.success) continue;

      final answer = extractAnswer != null
          ? extractAnswer!(result.response)
          : result.response.trim();

      votes[answer] = (votes[answer] ?? 0) + 1;
    }

    if (votes.isEmpty) {
      return VotingResult(
        winner: '',
        winnerCount: 0,
        votes: votes,
        allResponses: results,
      );
    }

    final sorted = votes.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return VotingResult(
      winner: sorted.first.key,
      winnerCount: sorted.first.value,
      votes: votes,
      allResponses: results,
    );
  }
}

/// Guardrail check result
class GuardrailResult {
  final String name;
  final bool passed;
  final String reason;
  final double? score;

  GuardrailResult({
    required this.name,
    required this.passed,
    required this.reason,
    this.score,
  });
}

/// Combined guardrails result
class GuardrailsResult {
  final bool allPassed;
  final List<GuardrailResult> results;
  final String? response;

  GuardrailsResult({
    required this.allPassed,
    required this.results,
    this.response,
  });

  List<GuardrailResult> get failed =>
      results.where((r) => !r.passed).toList();
}

/// A guardrail definition
class Guardrail {
  final String name;
  final String prompt;
  final bool Function(String response) check;

  Guardrail({
    required this.name,
    required this.prompt,
    required this.check,
  });
}

/// Runs guardrail checks in parallel with the main task.
///
/// Example:
/// ```dart
/// final parallelizer = GuardrailsParallelizer(
///   client: client,
///   taskPrompt: 'Write code to sort a list',
///   guardrails: [
///     Guardrail(
///       name: 'safe_code',
///       prompt: 'Does this request safe code generation?',
///       check: (r) => r.toLowerCase().contains('yes'),
///     ),
///   ],
/// );
/// final result = await parallelizer.execute('Sort this list: [3, 1, 2]');
/// ```
class GuardrailsParallelizer {
  final AnthropicClient client;
  final String model;
  final String taskPrompt;
  final List<Guardrail> guardrails;
  final bool stopOnFailure;

  GuardrailsParallelizer({
    required this.client,
    required this.taskPrompt,
    required this.guardrails,
    this.model = 'claude-sonnet-4-20250514',
    this.stopOnFailure = true,
  });

  /// Execute task with parallel guardrails
  Future<GuardrailsResult> execute(String input) async {
    // Run guardrails and main task in parallel
    final guardrailFutures = guardrails.map((g) => _checkGuardrail(g, input));
    final taskFuture = client.createMessage(
      prompt: '$taskPrompt\n\nInput: $input',
      model: model,
    );

    // Wait for all to complete
    final guardrailResults = await Future.wait(guardrailFutures);
    final taskResponse = await taskFuture;

    final allPassed = guardrailResults.every((r) => r.passed);

    return GuardrailsResult(
      allPassed: allPassed,
      results: guardrailResults,
      response: (!stopOnFailure || allPassed) ? taskResponse : null,
    );
  }

  Future<GuardrailResult> _checkGuardrail(
    Guardrail guardrail,
    String input,
  ) async {
    try {
      final response = await client.createMessage(
        prompt: '${guardrail.prompt}\n\nContent: $input\n\nRespond with yes or no and a brief reason.',
        model: model,
        maxTokens: 256,
      );

      final passed = guardrail.check(response);
      return GuardrailResult(
        name: guardrail.name,
        passed: passed,
        reason: response,
      );
    } catch (e) {
      return GuardrailResult(
        name: guardrail.name,
        passed: false,
        reason: 'Error: $e',
      );
    }
  }
}

/// Code review result
class CodeReviewResult {
  final List<ReviewCategory> categories;
  final bool allPassed;
  final double overallScore;

  CodeReviewResult({
    required this.categories,
    required this.allPassed,
    required this.overallScore,
  });
}

/// A category in a code review
class ReviewCategory {
  final String name;
  final double score;
  final List<String> issues;

  ReviewCategory({
    required this.name,
    required this.score,
    required this.issues,
  });

  bool get passed => score >= 0.7;
}

/// Parallel code reviewer
class ParallelCodeReviewer {
  final AnthropicClient client;
  final String model;

  ParallelCodeReviewer({
    required this.client,
    this.model = 'claude-sonnet-4-20250514',
  });

  /// Review code across multiple aspects in parallel
  Future<CodeReviewResult> review(String code) async {
    final aspects = [
      ('security', 'Review for security vulnerabilities'),
      ('performance', 'Review for performance issues'),
      ('maintainability', 'Review for code quality and maintainability'),
      ('correctness', 'Review for logical errors and bugs'),
    ];

    final futures = aspects.map((aspect) async {
      final name = aspect.$1;
      final description = aspect.$2;

      final prompt = '''
$description in this code:

```
$code
```

Respond in JSON format:
{
  "score": 0.0-1.0,
  "issues": ["issue1", "issue2"]
}
''';

      try {
        final response = await client.createMessage(
          prompt: prompt,
          model: model,
          maxTokens: 512,
        );

        final jsonStr = _extractJson(response);
        final data = jsonDecode(jsonStr);

        return ReviewCategory(
          name: name,
          score: (data['score'] as num).toDouble(),
          issues: (data['issues'] as List).cast<String>(),
        );
      } catch (e) {
        return ReviewCategory(
          name: name,
          score: 0.0,
          issues: ['Error during review: $e'],
        );
      }
    });

    final categories = await Future.wait(futures);
    final allPassed = categories.every((c) => c.passed);
    final overallScore = categories.isEmpty
        ? 0.0
        : categories.map((c) => c.score).reduce((a, b) => a + b) /
            categories.length;

    return CodeReviewResult(
      categories: categories,
      allPassed: allPassed,
      overallScore: overallScore,
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

// Example usage
Future<void> exampleParallelization() async {
  final apiKey = const String.fromEnvironment('ANTHROPIC_API_KEY');
  if (apiKey.isEmpty) {
    throw Exception('ANTHROPIC_API_KEY environment variable not set');
  }

  final client = AnthropicClient(apiKey: apiKey);

  // Sectioning parallelization
  print('=== Sectioning Parallelization ===');
  final parallelizer = SectioningParallelizer(
    client: client,
    promptTemplate: (section) => 'Translate to French: $section',
    maxConcurrency: 3,
  );

  final sections = [
    'Hello, how are you?',
    'The weather is nice today.',
    'I love programming.',
    'Dart is a great language.',
  ];

  final results = await parallelizer.process(sections);
  for (final result in results) {
    print('${result.section} -> ${result.result}');
  }

  // Voting parallelization
  print('\n=== Voting Parallelization ===');
  final voter = VotingParallelizer(
    client: client,
    numVoters: 5,
    extractAnswer: (response) {
      final lower = response.toLowerCase();
      if (lower.contains('yes')) return 'yes';
      if (lower.contains('no')) return 'no';
      return response.trim();
    },
  );

  final voteResult = await voter.vote('Is the sky blue? Answer yes or no.');
  print('Winner: ${voteResult.winner}');
  print('Confidence: ${(voteResult.confidence * 100).toStringAsFixed(0)}%');
  print('Votes: ${voteResult.votes}');

  // Guardrails parallelization
  print('\n=== Guardrails Parallelization ===');
  final guardrailed = GuardrailsParallelizer(
    client: client,
    taskPrompt: 'Write a function based on this request:',
    guardrails: [
      Guardrail(
        name: 'safe_request',
        prompt: 'Is this a safe, non-malicious code request?',
        check: (r) => r.toLowerCase().contains('yes'),
      ),
      Guardrail(
        name: 'appropriate',
        prompt: 'Is this request appropriate for a coding assistant?',
        check: (r) => r.toLowerCase().contains('yes'),
      ),
    ],
  );

  final guardrailResult = await guardrailed.execute('Sort a list of numbers');
  print('All guardrails passed: ${guardrailResult.allPassed}');
  if (guardrailResult.response != null) {
    print('Response: ${guardrailResult.response!.substring(0, 100)}...');
  }

  // Code review
  print('\n=== Parallel Code Review ===');
  final reviewer = ParallelCodeReviewer(client: client);
  final reviewResult = await reviewer.review('''
def process_user_input(user_input):
    query = f"SELECT * FROM users WHERE name = '{user_input}'"
    return execute_query(query)
''');

  print('Overall score: ${(reviewResult.overallScore * 100).toStringAsFixed(0)}%');
  print('All passed: ${reviewResult.allPassed}');
  for (final category in reviewResult.categories) {
    print('${category.name}: ${(category.score * 100).toStringAsFixed(0)}%');
    for (final issue in category.issues) {
      print('  - $issue');
    }
  }
}

void main() async {
  try {
    await exampleParallelization();
  } catch (e) {
    print('Error: $e');
  }
}
