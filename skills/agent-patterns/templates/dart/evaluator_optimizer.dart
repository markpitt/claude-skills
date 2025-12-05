/// Evaluator-Optimizer Pattern Implementation for Dart
/// Iterative refinement through evaluation and feedback loops

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

/// Evaluation criterion
class EvaluationCriterion {
  final String name;
  final String description;
  final double weight;

  EvaluationCriterion({
    required this.name,
    required this.description,
    this.weight = 1.0,
  });
}

/// Score for a single criterion
class CriterionScore {
  final String criterion;
  final double score;
  final String feedback;

  CriterionScore({
    required this.criterion,
    required this.score,
    required this.feedback,
  });
}

/// Complete evaluation result
class EvaluationResult {
  final double overallScore;
  final List<CriterionScore> criteriaScores;
  final String overallFeedback;
  final List<String> suggestions;

  EvaluationResult({
    required this.overallScore,
    required this.criteriaScores,
    required this.overallFeedback,
    required this.suggestions,
  });

  bool meetsThreshold(double threshold) => overallScore >= threshold;
}

/// One iteration of optimization
class OptimizationIteration {
  final int iteration;
  final String content;
  final EvaluationResult evaluation;

  OptimizationIteration({
    required this.iteration,
    required this.content,
    required this.evaluation,
  });
}

/// Result of the optimization process
class OptimizationResult {
  final String finalContent;
  final int totalIterations;
  final List<OptimizationIteration> history;
  final bool converged;
  final double finalScore;

  OptimizationResult({
    required this.finalContent,
    required this.totalIterations,
    required this.history,
    required this.converged,
    required this.finalScore,
  });
}

/// Iteratively refines content through evaluation and optimization.
///
/// Example:
/// ```dart
/// final optimizer = EvaluatorOptimizer(
///   client: client,
///   criteria: [
///     EvaluationCriterion(
///       name: 'clarity',
///       description: 'Is the writing clear and easy to understand?',
///       weight: 2.0,
///     ),
///     EvaluationCriterion(
///       name: 'completeness',
///       description: 'Does it cover all required topics?',
///     ),
///   ],
///   targetScore: 0.85,
///   maxIterations: 5,
/// );
///
/// final result = await optimizer.optimize(
///   'Write an introduction to machine learning',
/// );
/// ```
class EvaluatorOptimizer {
  final AnthropicClient client;
  final String model;
  final List<EvaluationCriterion> criteria;
  final double targetScore;
  final int maxIterations;

  EvaluatorOptimizer({
    required this.client,
    required this.criteria,
    this.model = 'claude-sonnet-4-20250514',
    this.targetScore = 0.8,
    this.maxIterations = 5,
  });

  /// Run the optimization loop
  Future<OptimizationResult> optimize(String task) async {
    final history = <OptimizationIteration>[];
    String currentContent = '';

    // Initial generation
    currentContent = await _generate(task, null);

    for (int i = 0; i < maxIterations; i++) {
      // Evaluate current content
      final evaluation = await _evaluate(task, currentContent);

      history.add(OptimizationIteration(
        iteration: i + 1,
        content: currentContent,
        evaluation: evaluation,
      ));

      // Check if we've reached target
      if (evaluation.meetsThreshold(targetScore)) {
        return OptimizationResult(
          finalContent: currentContent,
          totalIterations: i + 1,
          history: history,
          converged: true,
          finalScore: evaluation.overallScore,
        );
      }

      // Generate improved version
      currentContent = await _generate(task, evaluation);
    }

    // Max iterations reached
    final lastScore = history.isNotEmpty
        ? history.last.evaluation.overallScore
        : 0.0;

    return OptimizationResult(
      finalContent: currentContent,
      totalIterations: maxIterations,
      history: history,
      converged: false,
      finalScore: lastScore,
    );
  }

  Future<String> _generate(
    String task,
    EvaluationResult? previousEvaluation,
  ) async {
    String prompt;

    if (previousEvaluation == null) {
      prompt = '''
Complete this task:
$task

Criteria to consider:
${criteria.map((c) => '- ${c.name}: ${c.description}').join('\n')}
''';
    } else {
      prompt = '''
Improve your previous response based on this feedback:

Original task: $task

Previous evaluation:
- Overall score: ${(previousEvaluation.overallScore * 100).toStringAsFixed(0)}%
- Feedback: ${previousEvaluation.overallFeedback}

Specific improvements needed:
${previousEvaluation.suggestions.map((s) => '- $s').join('\n')}

Criteria scores:
${previousEvaluation.criteriaScores.map((cs) => '- ${cs.criterion}: ${(cs.score * 100).toStringAsFixed(0)}% - ${cs.feedback}').join('\n')}

Generate an improved version addressing all feedback:
''';
    }

    return client.createMessage(
      prompt: prompt,
      model: model,
    );
  }

  Future<EvaluationResult> _evaluate(String task, String content) async {
    final criteriaList = criteria
        .map((c) => '${c.name} (weight: ${c.weight}): ${c.description}')
        .join('\n');

    final prompt = '''
Evaluate this content against the criteria below.

Task: $task

Content to evaluate:
$content

Criteria:
$criteriaList

Respond in JSON format:
{
  "criteria_scores": [
    {
      "criterion": "name",
      "score": 0.0-1.0,
      "feedback": "specific feedback"
    }
  ],
  "overall_feedback": "summary of strengths and weaknesses",
  "suggestions": ["specific improvement 1", "specific improvement 2"]
}
''';

    final response = await client.createMessage(
      prompt: prompt,
      model: model,
    );

    final jsonStr = _extractJson(response);
    final data = jsonDecode(jsonStr);

    final criteriaScores = (data['criteria_scores'] as List)
        .map((cs) => CriterionScore(
              criterion: cs['criterion'] as String,
              score: (cs['score'] as num).toDouble(),
              feedback: cs['feedback'] as String,
            ))
        .toList();

    // Calculate weighted average
    double totalWeight = 0;
    double weightedSum = 0;

    for (final cs in criteriaScores) {
      final criterion = criteria.firstWhere(
        (c) => c.name == cs.criterion,
        orElse: () => EvaluationCriterion(name: cs.criterion, description: ''),
      );
      totalWeight += criterion.weight;
      weightedSum += cs.score * criterion.weight;
    }

    final overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0.0;

    return EvaluationResult(
      overallScore: overallScore,
      criteriaScores: criteriaScores,
      overallFeedback: data['overall_feedback'] as String,
      suggestions: (data['suggestions'] as List).cast<String>(),
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

/// Confidence-based optimizer that stops when confidence is high.
///
/// Example:
/// ```dart
/// final optimizer = ConfidenceBasedOptimizer(
///   client: client,
///   confidenceThreshold: 0.9,
/// );
/// final result = await optimizer.optimize('Solve: what is 15% of 240?');
/// ```
class ConfidenceBasedOptimizer {
  final AnthropicClient client;
  final String model;
  final double confidenceThreshold;
  final int maxAttempts;

  ConfidenceBasedOptimizer({
    required this.client,
    this.model = 'claude-sonnet-4-20250514',
    this.confidenceThreshold = 0.9,
    this.maxAttempts = 3,
  });

  Future<ConfidenceResult> optimize(String task) async {
    final attempts = <ConfidenceAttempt>[];

    for (int i = 0; i < maxAttempts; i++) {
      final previousFeedback = attempts.isNotEmpty
          ? attempts.map((a) => '''
Attempt ${a.attempt}: ${a.answer}
Self-assessment: ${a.reasoning}
Confidence: ${(a.confidence * 100).toStringAsFixed(0)}%
''').join('\n')
          : null;

      final attempt = await _attemptWithConfidence(task, previousFeedback);
      attempts.add(ConfidenceAttempt(
        attempt: i + 1,
        answer: attempt['answer'] as String,
        confidence: attempt['confidence'] as double,
        reasoning: attempt['reasoning'] as String,
      ));

      if (attempt['confidence'] as double >= confidenceThreshold) {
        return ConfidenceResult(
          finalAnswer: attempt['answer'] as String,
          finalConfidence: attempt['confidence'] as double,
          attempts: attempts,
          converged: true,
        );
      }
    }

    // Return best attempt
    final bestAttempt = attempts.reduce(
      (a, b) => a.confidence > b.confidence ? a : b,
    );

    return ConfidenceResult(
      finalAnswer: bestAttempt.answer,
      finalConfidence: bestAttempt.confidence,
      attempts: attempts,
      converged: false,
    );
  }

  Future<Map<String, dynamic>> _attemptWithConfidence(
    String task,
    String? previousAttempts,
  ) async {
    String prompt;

    if (previousAttempts == null) {
      prompt = '''
Complete this task and assess your confidence:

$task

Respond in JSON format:
{
  "answer": "your answer",
  "confidence": 0.0-1.0,
  "reasoning": "why you're this confident"
}
''';
    } else {
      prompt = '''
Improve upon your previous attempts:

Task: $task

Previous attempts:
$previousAttempts

Provide a better answer with higher confidence.

Respond in JSON format:
{
  "answer": "your improved answer",
  "confidence": 0.0-1.0,
  "reasoning": "why this is better"
}
''';
    }

    final response = await client.createMessage(
      prompt: prompt,
      model: model,
    );

    final jsonStr = _extractJson(response);
    final data = jsonDecode(jsonStr);

    return {
      'answer': data['answer'] as String,
      'confidence': (data['confidence'] as num).toDouble(),
      'reasoning': data['reasoning'] as String,
    };
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

/// Result of a confidence attempt
class ConfidenceAttempt {
  final int attempt;
  final String answer;
  final double confidence;
  final String reasoning;

  ConfidenceAttempt({
    required this.attempt,
    required this.answer,
    required this.confidence,
    required this.reasoning,
  });
}

/// Result of confidence-based optimization
class ConfidenceResult {
  final String finalAnswer;
  final double finalConfidence;
  final List<ConfidenceAttempt> attempts;
  final bool converged;

  ConfidenceResult({
    required this.finalAnswer,
    required this.finalConfidence,
    required this.attempts,
    required this.converged,
  });
}

/// Code quality optimizer
class CodeQualityOptimizer {
  final EvaluatorOptimizer _optimizer;

  CodeQualityOptimizer(AnthropicClient client)
      : _optimizer = EvaluatorOptimizer(
          client: client,
          criteria: [
            EvaluationCriterion(
              name: 'correctness',
              description: 'Does the code work correctly for all edge cases?',
              weight: 3.0,
            ),
            EvaluationCriterion(
              name: 'readability',
              description: 'Is the code easy to read and understand?',
              weight: 2.0,
            ),
            EvaluationCriterion(
              name: 'efficiency',
              description: 'Is the code efficient and performant?',
              weight: 1.5,
            ),
            EvaluationCriterion(
              name: 'maintainability',
              description: 'Is the code easy to maintain and extend?',
              weight: 1.5,
            ),
            EvaluationCriterion(
              name: 'documentation',
              description: 'Is the code well documented?',
              weight: 1.0,
            ),
          ],
          targetScore: 0.85,
          maxIterations: 4,
        );

  Future<OptimizationResult> optimizeCode(String codeRequest) =>
      _optimizer.optimize(codeRequest);
}

// Example usage
Future<void> exampleEvaluatorOptimizer() async {
  final apiKey = const String.fromEnvironment('ANTHROPIC_API_KEY');
  if (apiKey.isEmpty) {
    throw Exception('ANTHROPIC_API_KEY environment variable not set');
  }

  final client = AnthropicClient(apiKey: apiKey);

  // Custom evaluator-optimizer
  print('=== Custom Evaluator-Optimizer ===');
  final optimizer = EvaluatorOptimizer(
    client: client,
    criteria: [
      EvaluationCriterion(
        name: 'accuracy',
        description: 'Is the information factually accurate?',
        weight: 2.0,
      ),
      EvaluationCriterion(
        name: 'clarity',
        description: 'Is the explanation clear and easy to understand?',
        weight: 1.5,
      ),
      EvaluationCriterion(
        name: 'completeness',
        description: 'Does it cover all important aspects?',
        weight: 1.0,
      ),
    ],
    targetScore: 0.85,
    maxIterations: 4,
  );

  final result = await optimizer.optimize(
    'Explain how neural networks learn',
  );

  print('Converged: ${result.converged}');
  print('Iterations: ${result.totalIterations}');
  print('Final Score: ${(result.finalScore * 100).toStringAsFixed(0)}%');

  print('\nIteration History:');
  for (final iteration in result.history) {
    print('  Iteration ${iteration.iteration}: '
        '${(iteration.evaluation.overallScore * 100).toStringAsFixed(0)}%');
  }

  print('\nFinal Content:');
  print(result.finalContent);

  // Confidence-based optimizer
  print('\n=== Confidence-Based Optimizer ===');
  final confidenceOptimizer = ConfidenceBasedOptimizer(
    client: client,
    confidenceThreshold: 0.9,
  );

  final confResult = await confidenceOptimizer.optimize(
    'What is the time complexity of quicksort in the average case?',
  );

  print('Converged: ${confResult.converged}');
  print('Final Confidence: ${(confResult.finalConfidence * 100).toStringAsFixed(0)}%');
  print('Attempts: ${confResult.attempts.length}');

  for (final attempt in confResult.attempts) {
    print('  Attempt ${attempt.attempt}: '
        '${(attempt.confidence * 100).toStringAsFixed(0)}% - ${attempt.reasoning}');
  }

  print('\nFinal Answer: ${confResult.finalAnswer}');

  // Code quality optimizer
  print('\n=== Code Quality Optimizer ===');
  final codeOptimizer = CodeQualityOptimizer(client);
  final codeResult = await codeOptimizer.optimizeCode(
    'Write a Dart function to find the longest common subsequence of two strings',
  );

  print('Code optimization converged: ${codeResult.converged}');
  print('Final score: ${(codeResult.finalScore * 100).toStringAsFixed(0)}%');
  print('\nOptimized code:');
  print(codeResult.finalContent);
}

void main() async {
  try {
    await exampleEvaluatorOptimizer();
  } catch (e) {
    print('Error: $e');
  }
}
