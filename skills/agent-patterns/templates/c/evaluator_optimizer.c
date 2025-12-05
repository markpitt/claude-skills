/**
 * Evaluator-Optimizer Pattern Implementation for C
 * Iterative refinement through evaluation and feedback loops
 *
 * Note: This is a simplified example. In production, use libcurl
 * for HTTP and cJSON for JSON parsing.
 *
 * Compile with:
 * gcc -o evaluator_optimizer evaluator_optimizer.c -lcurl -ljson-c -lm
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <math.h>

// Maximum sizes
#define MAX_CRITERIA 20
#define MAX_SUGGESTIONS 10
#define MAX_ITERATIONS 10
#define MAX_NAME_SIZE 64
#define MAX_INPUT_SIZE 4096
#define MAX_OUTPUT_SIZE 16384

/**
 * Evaluation criterion
 */
typedef struct EvaluationCriterion {
    char name[MAX_NAME_SIZE];
    char description[256];
    double weight;
} EvaluationCriterion;

/**
 * Score for a single criterion
 */
typedef struct CriterionScore {
    char criterion[MAX_NAME_SIZE];
    double score;
    char feedback[512];
} CriterionScore;

/**
 * Complete evaluation result
 */
typedef struct EvaluationResult {
    double overall_score;
    CriterionScore* criteria_scores;
    int criteria_count;
    char overall_feedback[1024];
    char* suggestions[MAX_SUGGESTIONS];
    int suggestion_count;
} EvaluationResult;

/**
 * One iteration of optimization
 */
typedef struct OptimizationIteration {
    int iteration;
    char* content;
    EvaluationResult* evaluation;
} OptimizationIteration;

/**
 * Result of the optimization process
 */
typedef struct OptimizationResult {
    char* final_content;
    int total_iterations;
    OptimizationIteration* history;
    int history_count;
    bool converged;
    double final_score;
} OptimizationResult;

/**
 * Evaluator-Optimizer configuration
 */
typedef struct EvaluatorOptimizer {
    char* api_key;
    char* model;
    EvaluationCriterion* criteria;
    int criteria_count;
    double target_score;
    int max_iterations;
} EvaluatorOptimizer;

/**
 * Simplified API call
 */
char* call_anthropic_api(const char* api_key, const char* model,
                         const char* prompt, int max_tokens) {
    printf("API Call (mock) - Model: %s\n", model);
    char* response = (char*)malloc(MAX_OUTPUT_SIZE);
    snprintf(response, MAX_OUTPUT_SIZE,
        "{\n"
        "  \"criteria_scores\": [\n"
        "    {\"criterion\": \"accuracy\", \"score\": 0.85, \"feedback\": \"Good accuracy\"},\n"
        "    {\"criterion\": \"clarity\", \"score\": 0.80, \"feedback\": \"Could be clearer\"}\n"
        "  ],\n"
        "  \"overall_feedback\": \"Good overall with room for improvement\",\n"
        "  \"suggestions\": [\"Add more examples\", \"Improve structure\"]\n"
        "}");
    return response;
}

/**
 * Create evaluator-optimizer
 */
EvaluatorOptimizer* evaluator_create(const char* api_key) {
    EvaluatorOptimizer* e = (EvaluatorOptimizer*)calloc(1, sizeof(EvaluatorOptimizer));
    e->api_key = strdup(api_key);
    e->model = strdup("claude-sonnet-4-20250514");
    e->criteria = (EvaluationCriterion*)calloc(MAX_CRITERIA, sizeof(EvaluationCriterion));
    e->criteria_count = 0;
    e->target_score = 0.8;
    e->max_iterations = 5;
    return e;
}

/**
 * Add evaluation criterion
 */
bool evaluator_add_criterion(EvaluatorOptimizer* e, const char* name,
                              const char* description, double weight) {
    if (e->criteria_count >= MAX_CRITERIA) return false;

    EvaluationCriterion* c = &e->criteria[e->criteria_count];
    strncpy(c->name, name, MAX_NAME_SIZE - 1);
    strncpy(c->description, description, 255);
    c->weight = weight;
    e->criteria_count++;

    return true;
}

/**
 * Set target score
 */
void evaluator_set_target(EvaluatorOptimizer* e, double target) {
    e->target_score = target;
}

/**
 * Set max iterations
 */
void evaluator_set_max_iterations(EvaluatorOptimizer* e, int max) {
    e->max_iterations = max;
}

/**
 * Parse evaluation JSON (simplified)
 */
EvaluationResult* parse_evaluation(const char* json, EvaluatorOptimizer* e) {
    EvaluationResult* result = (EvaluationResult*)calloc(1, sizeof(EvaluationResult));
    result->criteria_scores = (CriterionScore*)calloc(MAX_CRITERIA, sizeof(CriterionScore));

    // Simplified parsing - use cJSON in production
    // This mock implementation creates scores based on criteria
    result->criteria_count = e->criteria_count;

    double total_weight = 0;
    double weighted_sum = 0;

    for (int i = 0; i < e->criteria_count; i++) {
        strncpy(result->criteria_scores[i].criterion, e->criteria[i].name, MAX_NAME_SIZE - 1);
        result->criteria_scores[i].score = 0.75 + ((double)(rand() % 20) / 100.0);  // 0.75-0.95
        snprintf(result->criteria_scores[i].feedback, 512, "Feedback for %s", e->criteria[i].name);

        total_weight += e->criteria[i].weight;
        weighted_sum += result->criteria_scores[i].score * e->criteria[i].weight;
    }

    result->overall_score = total_weight > 0 ? weighted_sum / total_weight : 0;
    strcpy(result->overall_feedback, "Overall good with areas for improvement");

    result->suggestions[0] = strdup("Add more detail");
    result->suggestions[1] = strdup("Improve examples");
    result->suggestion_count = 2;

    return result;
}

/**
 * Generate initial or improved content
 */
char* evaluator_generate(EvaluatorOptimizer* e, const char* task,
                          EvaluationResult* previous_eval) {
    char prompt[MAX_INPUT_SIZE];

    if (previous_eval == NULL) {
        // Build criteria list
        char criteria_list[2048];
        criteria_list[0] = '\0';

        for (int i = 0; i < e->criteria_count; i++) {
            char line[256];
            snprintf(line, sizeof(line), "- %s: %s\n",
                     e->criteria[i].name, e->criteria[i].description);
            strcat(criteria_list, line);
        }

        snprintf(prompt, sizeof(prompt),
            "Complete this task:\n%s\n\n"
            "Criteria to consider:\n%s",
            task, criteria_list);
    } else {
        // Build feedback from previous evaluation
        char scores_text[2048];
        scores_text[0] = '\0';

        for (int i = 0; i < previous_eval->criteria_count; i++) {
            char line[256];
            snprintf(line, sizeof(line), "- %s: %.0f%% - %s\n",
                     previous_eval->criteria_scores[i].criterion,
                     previous_eval->criteria_scores[i].score * 100,
                     previous_eval->criteria_scores[i].feedback);
            strcat(scores_text, line);
        }

        char suggestions_text[1024];
        suggestions_text[0] = '\0';

        for (int i = 0; i < previous_eval->suggestion_count; i++) {
            char line[256];
            snprintf(line, sizeof(line), "- %s\n", previous_eval->suggestions[i]);
            strcat(suggestions_text, line);
        }

        snprintf(prompt, sizeof(prompt),
            "Improve your previous response based on this feedback:\n\n"
            "Original task: %s\n\n"
            "Previous evaluation:\n"
            "- Overall score: %.0f%%\n"
            "- Feedback: %s\n\n"
            "Specific improvements needed:\n%s\n"
            "Criteria scores:\n%s\n"
            "Generate an improved version addressing all feedback:",
            task,
            previous_eval->overall_score * 100,
            previous_eval->overall_feedback,
            suggestions_text,
            scores_text);
    }

    return call_anthropic_api(e->api_key, e->model, prompt, 4096);
}

/**
 * Evaluate content
 */
EvaluationResult* evaluator_evaluate(EvaluatorOptimizer* e, const char* task,
                                      const char* content) {
    // Build criteria list
    char criteria_list[2048];
    criteria_list[0] = '\0';

    for (int i = 0; i < e->criteria_count; i++) {
        char line[256];
        snprintf(line, sizeof(line), "%s (weight: %.1f): %s\n",
                 e->criteria[i].name, e->criteria[i].weight,
                 e->criteria[i].description);
        strcat(criteria_list, line);
    }

    char prompt[MAX_INPUT_SIZE];
    snprintf(prompt, sizeof(prompt),
        "Evaluate this content against the criteria below.\n\n"
        "Task: %s\n\n"
        "Content to evaluate:\n%s\n\n"
        "Criteria:\n%s\n\n"
        "Respond in JSON format:\n"
        "{\n"
        "  \"criteria_scores\": [{\"criterion\": \"name\", \"score\": 0.0-1.0, \"feedback\": \"...\"}],\n"
        "  \"overall_feedback\": \"...\",\n"
        "  \"suggestions\": [\"...\"]\n"
        "}",
        task, content, criteria_list);

    char* response = call_anthropic_api(e->api_key, e->model, prompt, 2048);
    EvaluationResult* result = parse_evaluation(response, e);
    free(response);

    return result;
}

/**
 * Run optimization loop
 */
OptimizationResult* evaluator_optimize(EvaluatorOptimizer* e, const char* task) {
    OptimizationResult* result = (OptimizationResult*)calloc(1, sizeof(OptimizationResult));
    result->history = (OptimizationIteration*)calloc(e->max_iterations, sizeof(OptimizationIteration));
    result->history_count = 0;

    char* current_content = NULL;
    EvaluationResult* current_eval = NULL;

    // Initial generation
    current_content = evaluator_generate(e, task, NULL);

    for (int i = 0; i < e->max_iterations; i++) {
        // Evaluate
        current_eval = evaluator_evaluate(e, task, current_content);

        // Record iteration
        result->history[i].iteration = i + 1;
        result->history[i].content = strdup(current_content);
        result->history[i].evaluation = current_eval;
        result->history_count++;

        printf("Iteration %d: %.0f%%\n", i + 1, current_eval->overall_score * 100);

        // Check if target reached
        if (current_eval->overall_score >= e->target_score) {
            result->final_content = strdup(current_content);
            result->total_iterations = i + 1;
            result->converged = true;
            result->final_score = current_eval->overall_score;

            free(current_content);
            return result;
        }

        // Generate improved version
        char* improved = evaluator_generate(e, task, current_eval);
        free(current_content);
        current_content = improved;
    }

    // Max iterations reached
    result->final_content = current_content;
    result->total_iterations = e->max_iterations;
    result->converged = false;
    result->final_score = result->history[result->history_count - 1].evaluation->overall_score;

    return result;
}

/**
 * Free evaluation result
 */
void evaluation_result_free(EvaluationResult* result) {
    free(result->criteria_scores);
    for (int i = 0; i < result->suggestion_count; i++) {
        free(result->suggestions[i]);
    }
    free(result);
}

/**
 * Free optimization result
 */
void optimization_result_free(OptimizationResult* result) {
    free(result->final_content);
    for (int i = 0; i < result->history_count; i++) {
        free(result->history[i].content);
        evaluation_result_free(result->history[i].evaluation);
    }
    free(result->history);
    free(result);
}

/**
 * Free evaluator-optimizer
 */
void evaluator_free(EvaluatorOptimizer* e) {
    free(e->api_key);
    free(e->model);
    free(e->criteria);
    free(e);
}

// Confidence-based optimizer

/**
 * Confidence attempt
 */
typedef struct ConfidenceAttempt {
    int attempt;
    char* answer;
    double confidence;
    char reasoning[512];
} ConfidenceAttempt;

/**
 * Confidence result
 */
typedef struct ConfidenceResult {
    char* final_answer;
    double final_confidence;
    ConfidenceAttempt* attempts;
    int attempt_count;
    bool converged;
} ConfidenceResult;

/**
 * Confidence-based optimizer
 */
typedef struct ConfidenceOptimizer {
    char* api_key;
    char* model;
    double confidence_threshold;
    int max_attempts;
} ConfidenceOptimizer;

/**
 * Create confidence optimizer
 */
ConfidenceOptimizer* confidence_create(const char* api_key) {
    ConfidenceOptimizer* c = (ConfidenceOptimizer*)calloc(1, sizeof(ConfidenceOptimizer));
    c->api_key = strdup(api_key);
    c->model = strdup("claude-sonnet-4-20250514");
    c->confidence_threshold = 0.9;
    c->max_attempts = 3;
    return c;
}

/**
 * Set confidence threshold
 */
void confidence_set_threshold(ConfidenceOptimizer* c, double threshold) {
    c->confidence_threshold = threshold;
}

/**
 * Parse confidence response (simplified)
 */
void parse_confidence_response(const char* response, char** answer, double* confidence,
                                char* reasoning, size_t reasoning_size) {
    // Simplified - in production use proper JSON parsing
    *answer = strdup("This is the answer based on the analysis.");
    *confidence = 0.85 + ((double)(rand() % 15) / 100.0);  // 0.85-1.0
    snprintf(reasoning, reasoning_size, "Based on careful analysis of the problem.");
}

/**
 * Attempt with confidence assessment
 */
void confidence_attempt(ConfidenceOptimizer* c, const char* task,
                         const char* previous_attempts, ConfidenceAttempt* result) {
    char prompt[MAX_INPUT_SIZE];

    if (previous_attempts == NULL || strlen(previous_attempts) == 0) {
        snprintf(prompt, sizeof(prompt),
            "Complete this task and assess your confidence:\n\n"
            "%s\n\n"
            "Respond in JSON format:\n"
            "{\"answer\": \"...\", \"confidence\": 0.0-1.0, \"reasoning\": \"...\"}",
            task);
    } else {
        snprintf(prompt, sizeof(prompt),
            "Improve upon your previous attempts:\n\n"
            "Task: %s\n\n"
            "Previous attempts:\n%s\n\n"
            "Provide a better answer with higher confidence.\n\n"
            "Respond in JSON format:\n"
            "{\"answer\": \"...\", \"confidence\": 0.0-1.0, \"reasoning\": \"...\"}",
            task, previous_attempts);
    }

    char* response = call_anthropic_api(c->api_key, c->model, prompt, 2048);

    char* answer;
    double confidence;
    parse_confidence_response(response, &answer, &confidence, result->reasoning, 512);

    result->answer = answer;
    result->confidence = confidence;

    free(response);
}

/**
 * Run confidence-based optimization
 */
ConfidenceResult* confidence_optimize(ConfidenceOptimizer* c, const char* task) {
    ConfidenceResult* result = (ConfidenceResult*)calloc(1, sizeof(ConfidenceResult));
    result->attempts = (ConfidenceAttempt*)calloc(c->max_attempts, sizeof(ConfidenceAttempt));
    result->attempt_count = 0;

    char previous_attempts[MAX_INPUT_SIZE];
    previous_attempts[0] = '\0';

    for (int i = 0; i < c->max_attempts; i++) {
        ConfidenceAttempt* attempt = &result->attempts[i];
        attempt->attempt = i + 1;

        confidence_attempt(c, task,
                           strlen(previous_attempts) > 0 ? previous_attempts : NULL,
                           attempt);
        result->attempt_count++;

        printf("Attempt %d: %.0f%% confidence\n", i + 1, attempt->confidence * 100);

        // Check if threshold reached
        if (attempt->confidence >= c->confidence_threshold) {
            result->final_answer = strdup(attempt->answer);
            result->final_confidence = attempt->confidence;
            result->converged = true;
            return result;
        }

        // Build previous attempts string for next iteration
        char attempt_str[1024];
        snprintf(attempt_str, sizeof(attempt_str),
            "Attempt %d: %s\nConfidence: %.0f%%\nReasoning: %s\n\n",
            i + 1, attempt->answer, attempt->confidence * 100, attempt->reasoning);
        strcat(previous_attempts, attempt_str);
    }

    // Find best attempt
    double best_confidence = 0;
    int best_idx = 0;
    for (int i = 0; i < result->attempt_count; i++) {
        if (result->attempts[i].confidence > best_confidence) {
            best_confidence = result->attempts[i].confidence;
            best_idx = i;
        }
    }

    result->final_answer = strdup(result->attempts[best_idx].answer);
    result->final_confidence = best_confidence;
    result->converged = false;

    return result;
}

/**
 * Free confidence result
 */
void confidence_result_free(ConfidenceResult* result) {
    free(result->final_answer);
    for (int i = 0; i < result->attempt_count; i++) {
        free(result->attempts[i].answer);
    }
    free(result->attempts);
    free(result);
}

/**
 * Free confidence optimizer
 */
void confidence_free(ConfidenceOptimizer* c) {
    free(c->api_key);
    free(c->model);
    free(c);
}

int main() {
    const char* api_key = getenv("ANTHROPIC_API_KEY");
    if (!api_key) {
        fprintf(stderr, "ANTHROPIC_API_KEY environment variable not set\n");
        return 1;
    }

    // Seed random for mock responses
    srand(42);

    // Evaluator-Optimizer
    printf("=== Evaluator-Optimizer ===\n\n");

    EvaluatorOptimizer* evaluator = evaluator_create(api_key);
    evaluator_add_criterion(evaluator, "accuracy",
                            "Is the information factually accurate?", 2.0);
    evaluator_add_criterion(evaluator, "clarity",
                            "Is the explanation clear and easy to understand?", 1.5);
    evaluator_add_criterion(evaluator, "completeness",
                            "Does it cover all important aspects?", 1.0);

    evaluator_set_target(evaluator, 0.85);
    evaluator_set_max_iterations(evaluator, 4);

    OptimizationResult* opt_result = evaluator_optimize(evaluator,
        "Explain how hash tables work");

    printf("\nConverged: %s\n", opt_result->converged ? "yes" : "no");
    printf("Iterations: %d\n", opt_result->total_iterations);
    printf("Final Score: %.0f%%\n", opt_result->final_score * 100);
    printf("\nIteration History:\n");
    for (int i = 0; i < opt_result->history_count; i++) {
        printf("  Iteration %d: %.0f%%\n",
               opt_result->history[i].iteration,
               opt_result->history[i].evaluation->overall_score * 100);
    }
    printf("\nFinal Content (first 100 chars):\n%.100s...\n", opt_result->final_content);

    optimization_result_free(opt_result);
    evaluator_free(evaluator);

    // Confidence-based optimizer
    printf("\n=== Confidence-Based Optimizer ===\n\n");

    ConfidenceOptimizer* conf_opt = confidence_create(api_key);
    confidence_set_threshold(conf_opt, 0.95);

    ConfidenceResult* conf_result = confidence_optimize(conf_opt,
        "What is the time complexity of binary search?");

    printf("\nConverged: %s\n", conf_result->converged ? "yes" : "no");
    printf("Final Confidence: %.0f%%\n", conf_result->final_confidence * 100);
    printf("Attempts: %d\n", conf_result->attempt_count);
    printf("\nFinal Answer: %s\n", conf_result->final_answer);

    confidence_result_free(conf_result);
    confidence_free(conf_opt);

    return 0;
}
