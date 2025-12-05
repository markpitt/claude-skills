/**
 * Parallelization Pattern Implementation for C
 * Concurrent LLM calls with sectioning, voting, and guardrails
 *
 * Note: This example uses POSIX threads. In production, use libcurl
 * for HTTP and cJSON for JSON parsing.
 *
 * Compile with:
 * gcc -o parallelization parallelization.c -pthread -lcurl -ljson-c
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <pthread.h>

// Maximum sizes
#define MAX_SECTIONS 50
#define MAX_VOTERS 10
#define MAX_GUARDRAILS 10
#define MAX_INPUT_SIZE 4096
#define MAX_OUTPUT_SIZE 16384
#define MAX_NAME_SIZE 64

/**
 * Result of processing a section
 */
typedef struct SectionResult {
    int index;
    char* section;
    char* result;
    bool success;
    char* error;
} SectionResult;

/**
 * Arguments for section worker thread
 */
typedef struct SectionWorkerArgs {
    int index;
    const char* section;
    const char* api_key;
    const char* model;
    const char* prompt_template;  // Format string with %s for section
    SectionResult* result;
} SectionWorkerArgs;

/**
 * Simplified API call - in production, use libcurl
 */
char* call_anthropic_api(const char* api_key, const char* model,
                         const char* prompt, int max_tokens) {
    // NOTE: Placeholder - implement using libcurl in production
    printf("API Call (mock) - Model: %s\n", model);

    // Mock response
    char* response = (char*)malloc(MAX_OUTPUT_SIZE);
    snprintf(response, MAX_OUTPUT_SIZE, "Mock response for: %.50s...", prompt);
    return response;
}

/**
 * Section worker thread function
 */
void* section_worker(void* args) {
    SectionWorkerArgs* worker = (SectionWorkerArgs*)args;

    // Format prompt
    char prompt[MAX_INPUT_SIZE];
    snprintf(prompt, sizeof(prompt), worker->prompt_template, worker->section);

    // Call API
    char* response = call_anthropic_api(worker->api_key, worker->model, prompt, 4096);

    // Store result
    worker->result->index = worker->index;
    worker->result->section = strdup(worker->section);
    if (response) {
        worker->result->result = response;
        worker->result->success = true;
        worker->result->error = NULL;
    } else {
        worker->result->result = NULL;
        worker->result->success = false;
        worker->result->error = strdup("API call failed");
    }

    return NULL;
}

/**
 * Sectioning parallelizer
 */
typedef struct SectioningParallelizer {
    char* api_key;
    char* model;
    char* prompt_template;
    int max_concurrency;
} SectioningParallelizer;

/**
 * Create sectioning parallelizer
 */
SectioningParallelizer* sectioning_create(const char* api_key, const char* prompt_template) {
    SectioningParallelizer* p = (SectioningParallelizer*)calloc(1, sizeof(SectioningParallelizer));
    p->api_key = strdup(api_key);
    p->model = strdup("claude-sonnet-4-20250514");
    p->prompt_template = strdup(prompt_template);
    p->max_concurrency = 0;  // No limit by default
    return p;
}

/**
 * Set maximum concurrency
 */
void sectioning_set_concurrency(SectioningParallelizer* p, int max) {
    p->max_concurrency = max;
}

/**
 * Process sections in parallel
 */
SectionResult* sectioning_process(SectioningParallelizer* p,
                                   const char** sections, int section_count,
                                   int* result_count) {
    *result_count = section_count;
    SectionResult* results = (SectionResult*)calloc(section_count, sizeof(SectionResult));

    pthread_t* threads = (pthread_t*)calloc(section_count, sizeof(pthread_t));
    SectionWorkerArgs* args = (SectionWorkerArgs*)calloc(section_count, sizeof(SectionWorkerArgs));

    // Determine batch size
    int batch_size = (p->max_concurrency > 0) ? p->max_concurrency : section_count;

    for (int batch_start = 0; batch_start < section_count; batch_start += batch_size) {
        int batch_end = batch_start + batch_size;
        if (batch_end > section_count) batch_end = section_count;

        // Start threads for this batch
        for (int i = batch_start; i < batch_end; i++) {
            args[i].index = i;
            args[i].section = sections[i];
            args[i].api_key = p->api_key;
            args[i].model = p->model;
            args[i].prompt_template = p->prompt_template;
            args[i].result = &results[i];

            pthread_create(&threads[i], NULL, section_worker, &args[i]);
        }

        // Wait for this batch to complete
        for (int i = batch_start; i < batch_end; i++) {
            pthread_join(threads[i], NULL);
        }
    }

    free(threads);
    free(args);
    return results;
}

/**
 * Free sectioning parallelizer
 */
void sectioning_free(SectioningParallelizer* p) {
    free(p->api_key);
    free(p->model);
    free(p->prompt_template);
    free(p);
}

/**
 * Free section results
 */
void section_results_free(SectionResult* results, int count) {
    for (int i = 0; i < count; i++) {
        free(results[i].section);
        free(results[i].result);
        free(results[i].error);
    }
    free(results);
}

// Voting structures

typedef struct VoteResult {
    int index;
    char* response;
    bool success;
    char* error;
} VoteResult;

typedef struct VotingResult {
    char* winner;
    int winner_count;
    int total_votes;
    VoteResult* all_responses;
    int response_count;
} VotingResult;

typedef struct VoteCount {
    char* answer;
    int count;
} VoteCount;

typedef struct VotingWorkerArgs {
    int index;
    const char* prompt;
    const char* api_key;
    const char* model;
    VoteResult* result;
} VotingWorkerArgs;

/**
 * Vote worker thread
 */
void* vote_worker(void* args) {
    VotingWorkerArgs* worker = (VotingWorkerArgs*)args;

    char* response = call_anthropic_api(worker->api_key, worker->model,
                                        worker->prompt, 1024);

    worker->result->index = worker->index;
    if (response) {
        worker->result->response = response;
        worker->result->success = true;
        worker->result->error = NULL;
    } else {
        worker->result->response = NULL;
        worker->result->success = false;
        worker->result->error = strdup("API call failed");
    }

    return NULL;
}

/**
 * Extract answer callback type
 */
typedef char* (*ExtractAnswerFunc)(const char* response);

/**
 * Voting parallelizer
 */
typedef struct VotingParallelizer {
    char* api_key;
    char* model;
    int num_voters;
    ExtractAnswerFunc extract_answer;
} VotingParallelizer;

/**
 * Default answer extractor - returns trimmed first line
 */
char* default_extract_answer(const char* response) {
    char* answer = strdup(response);

    // Find first newline
    char* newline = strchr(answer, '\n');
    if (newline) *newline = '\0';

    // Trim whitespace
    char* start = answer;
    while (*start == ' ' || *start == '\t') start++;

    char* result = strdup(start);
    free(answer);
    return result;
}

/**
 * Create voting parallelizer
 */
VotingParallelizer* voting_create(const char* api_key, int num_voters) {
    VotingParallelizer* v = (VotingParallelizer*)calloc(1, sizeof(VotingParallelizer));
    v->api_key = strdup(api_key);
    v->model = strdup("claude-sonnet-4-20250514");
    v->num_voters = num_voters > 0 ? num_voters : 3;
    v->extract_answer = default_extract_answer;
    return v;
}

/**
 * Set custom answer extractor
 */
void voting_set_extractor(VotingParallelizer* v, ExtractAnswerFunc extractor) {
    v->extract_answer = extractor;
}

/**
 * Get votes and aggregate
 */
VotingResult* voting_vote(VotingParallelizer* v, const char* prompt) {
    VoteResult* results = (VoteResult*)calloc(v->num_voters, sizeof(VoteResult));
    pthread_t* threads = (pthread_t*)calloc(v->num_voters, sizeof(pthread_t));
    VotingWorkerArgs* args = (VotingWorkerArgs*)calloc(v->num_voters, sizeof(VotingWorkerArgs));

    // Start all voting threads
    for (int i = 0; i < v->num_voters; i++) {
        args[i].index = i;
        args[i].prompt = prompt;
        args[i].api_key = v->api_key;
        args[i].model = v->model;
        args[i].result = &results[i];

        pthread_create(&threads[i], NULL, vote_worker, &args[i]);
    }

    // Wait for all to complete
    for (int i = 0; i < v->num_voters; i++) {
        pthread_join(threads[i], NULL);
    }

    // Count votes
    VoteCount* votes = (VoteCount*)calloc(v->num_voters, sizeof(VoteCount));
    int unique_votes = 0;

    for (int i = 0; i < v->num_voters; i++) {
        if (!results[i].success) continue;

        char* answer = v->extract_answer(results[i].response);

        // Find existing vote
        int found = -1;
        for (int j = 0; j < unique_votes; j++) {
            if (strcmp(votes[j].answer, answer) == 0) {
                found = j;
                break;
            }
        }

        if (found >= 0) {
            votes[found].count++;
            free(answer);
        } else {
            votes[unique_votes].answer = answer;
            votes[unique_votes].count = 1;
            unique_votes++;
        }
    }

    // Find winner
    int max_count = 0;
    char* winner = NULL;
    for (int i = 0; i < unique_votes; i++) {
        if (votes[i].count > max_count) {
            max_count = votes[i].count;
            winner = votes[i].answer;
        }
    }

    // Create result
    VotingResult* voting_result = (VotingResult*)calloc(1, sizeof(VotingResult));
    voting_result->winner = winner ? strdup(winner) : strdup("");
    voting_result->winner_count = max_count;
    voting_result->total_votes = v->num_voters;
    voting_result->all_responses = results;
    voting_result->response_count = v->num_voters;

    // Cleanup
    for (int i = 0; i < unique_votes; i++) {
        free(votes[i].answer);
    }
    free(votes);
    free(threads);
    free(args);

    return voting_result;
}

/**
 * Free voting result
 */
void voting_result_free(VotingResult* result) {
    free(result->winner);
    for (int i = 0; i < result->response_count; i++) {
        free(result->all_responses[i].response);
        free(result->all_responses[i].error);
    }
    free(result->all_responses);
    free(result);
}

/**
 * Free voting parallelizer
 */
void voting_free(VotingParallelizer* v) {
    free(v->api_key);
    free(v->model);
    free(v);
}

// Guardrails structures

typedef bool (*GuardrailCheckFunc)(const char* response);

typedef struct Guardrail {
    char name[MAX_NAME_SIZE];
    char* prompt;
    GuardrailCheckFunc check;
} Guardrail;

typedef struct GuardrailResult {
    char name[MAX_NAME_SIZE];
    bool passed;
    char* reason;
} GuardrailResult;

typedef struct GuardrailsResult {
    bool all_passed;
    GuardrailResult* results;
    int result_count;
    char* response;
} GuardrailsResult;

typedef struct GuardrailWorkerArgs {
    const Guardrail* guardrail;
    const char* input;
    const char* api_key;
    const char* model;
    GuardrailResult* result;
} GuardrailWorkerArgs;

typedef struct TaskWorkerArgs {
    const char* prompt;
    const char* api_key;
    const char* model;
    char** result;
} TaskWorkerArgs;

/**
 * Guardrail worker thread
 */
void* guardrail_worker(void* args) {
    GuardrailWorkerArgs* worker = (GuardrailWorkerArgs*)args;

    char prompt[MAX_INPUT_SIZE];
    snprintf(prompt, sizeof(prompt),
             "%s\n\nContent: %s\n\nRespond with yes or no and a brief reason.",
             worker->guardrail->prompt, worker->input);

    char* response = call_anthropic_api(worker->api_key, worker->model, prompt, 256);

    strcpy(worker->result->name, worker->guardrail->name);
    if (response) {
        worker->result->passed = worker->guardrail->check(response);
        worker->result->reason = response;
    } else {
        worker->result->passed = false;
        worker->result->reason = strdup("Error: API call failed");
    }

    return NULL;
}

/**
 * Task worker thread
 */
void* task_worker(void* args) {
    TaskWorkerArgs* worker = (TaskWorkerArgs*)args;
    *worker->result = call_anthropic_api(worker->api_key, worker->model,
                                         worker->prompt, 4096);
    return NULL;
}

/**
 * Guardrails parallelizer
 */
typedef struct GuardrailsParallelizer {
    char* api_key;
    char* model;
    char* task_prompt;
    Guardrail guardrails[MAX_GUARDRAILS];
    int guardrail_count;
    bool stop_on_failure;
} GuardrailsParallelizer;

/**
 * Create guardrails parallelizer
 */
GuardrailsParallelizer* guardrails_create(const char* api_key, const char* task_prompt) {
    GuardrailsParallelizer* g = (GuardrailsParallelizer*)calloc(1, sizeof(GuardrailsParallelizer));
    g->api_key = strdup(api_key);
    g->model = strdup("claude-sonnet-4-20250514");
    g->task_prompt = strdup(task_prompt);
    g->guardrail_count = 0;
    g->stop_on_failure = true;
    return g;
}

/**
 * Add a guardrail
 */
bool guardrails_add(GuardrailsParallelizer* g, const char* name,
                    const char* prompt, GuardrailCheckFunc check) {
    if (g->guardrail_count >= MAX_GUARDRAILS) return false;

    Guardrail* guardrail = &g->guardrails[g->guardrail_count];
    strncpy(guardrail->name, name, MAX_NAME_SIZE - 1);
    guardrail->prompt = strdup(prompt);
    guardrail->check = check;
    g->guardrail_count++;

    return true;
}

/**
 * Execute task with parallel guardrails
 */
GuardrailsResult* guardrails_execute(GuardrailsParallelizer* g, const char* input) {
    int total_threads = g->guardrail_count + 1;  // guardrails + task
    pthread_t* threads = (pthread_t*)calloc(total_threads, sizeof(pthread_t));

    // Setup guardrail workers
    GuardrailResult* guardrail_results = (GuardrailResult*)calloc(g->guardrail_count, sizeof(GuardrailResult));
    GuardrailWorkerArgs* guardrail_args = (GuardrailWorkerArgs*)calloc(g->guardrail_count, sizeof(GuardrailWorkerArgs));

    for (int i = 0; i < g->guardrail_count; i++) {
        guardrail_args[i].guardrail = &g->guardrails[i];
        guardrail_args[i].input = input;
        guardrail_args[i].api_key = g->api_key;
        guardrail_args[i].model = g->model;
        guardrail_args[i].result = &guardrail_results[i];

        pthread_create(&threads[i], NULL, guardrail_worker, &guardrail_args[i]);
    }

    // Setup task worker
    char task_prompt[MAX_INPUT_SIZE];
    snprintf(task_prompt, sizeof(task_prompt), "%s\n\nInput: %s", g->task_prompt, input);

    char* task_response = NULL;
    TaskWorkerArgs task_args = {task_prompt, g->api_key, g->model, &task_response};
    pthread_create(&threads[g->guardrail_count], NULL, task_worker, &task_args);

    // Wait for all threads
    for (int i = 0; i < total_threads; i++) {
        pthread_join(threads[i], NULL);
    }

    // Check if all guardrails passed
    bool all_passed = true;
    for (int i = 0; i < g->guardrail_count; i++) {
        if (!guardrail_results[i].passed) {
            all_passed = false;
            break;
        }
    }

    // Create result
    GuardrailsResult* result = (GuardrailsResult*)calloc(1, sizeof(GuardrailsResult));
    result->all_passed = all_passed;
    result->results = guardrail_results;
    result->result_count = g->guardrail_count;

    if (!g->stop_on_failure || all_passed) {
        result->response = task_response;
    } else {
        result->response = NULL;
        free(task_response);
    }

    free(threads);
    free(guardrail_args);

    return result;
}

/**
 * Free guardrails result
 */
void guardrails_result_free(GuardrailsResult* result) {
    for (int i = 0; i < result->result_count; i++) {
        free(result->results[i].reason);
    }
    free(result->results);
    free(result->response);
    free(result);
}

/**
 * Free guardrails parallelizer
 */
void guardrails_free(GuardrailsParallelizer* g) {
    free(g->api_key);
    free(g->model);
    free(g->task_prompt);
    for (int i = 0; i < g->guardrail_count; i++) {
        free(g->guardrails[i].prompt);
    }
    free(g);
}

// Example check functions
bool check_safe_request(const char* response) {
    return strstr(response, "yes") != NULL || strstr(response, "Yes") != NULL;
}

bool check_appropriate(const char* response) {
    return strstr(response, "yes") != NULL || strstr(response, "Yes") != NULL;
}

int main() {
    const char* api_key = getenv("ANTHROPIC_API_KEY");
    if (!api_key) {
        fprintf(stderr, "ANTHROPIC_API_KEY environment variable not set\n");
        return 1;
    }

    // Sectioning parallelization
    printf("=== Sectioning Parallelization ===\n");
    SectioningParallelizer* sectioner = sectioning_create(api_key, "Translate to French: %s");
    sectioning_set_concurrency(sectioner, 3);

    const char* sections[] = {
        "Hello, how are you?",
        "The weather is nice today.",
        "I love programming.",
        "C is a powerful language."
    };

    int result_count;
    SectionResult* results = sectioning_process(sectioner, sections, 4, &result_count);

    for (int i = 0; i < result_count; i++) {
        printf("Section %d: %s -> %s\n", i, results[i].section,
               results[i].success ? results[i].result : results[i].error);
    }

    section_results_free(results, result_count);
    sectioning_free(sectioner);

    // Voting parallelization
    printf("\n=== Voting Parallelization ===\n");
    VotingParallelizer* voter = voting_create(api_key, 5);

    VotingResult* vote_result = voting_vote(voter, "Is the sky blue? Answer yes or no.");
    printf("Winner: %s (count: %d/%d)\n", vote_result->winner,
           vote_result->winner_count, vote_result->total_votes);

    voting_result_free(vote_result);
    voting_free(voter);

    // Guardrails parallelization
    printf("\n=== Guardrails Parallelization ===\n");
    GuardrailsParallelizer* guardrailed = guardrails_create(api_key,
        "Write a function based on this request:");

    guardrails_add(guardrailed, "safe_request",
                   "Is this a safe, non-malicious code request?",
                   check_safe_request);
    guardrails_add(guardrailed, "appropriate",
                   "Is this request appropriate for a coding assistant?",
                   check_appropriate);

    GuardrailsResult* guard_result = guardrails_execute(guardrailed,
        "Sort a list of numbers");

    printf("All guardrails passed: %s\n", guard_result->all_passed ? "yes" : "no");
    for (int i = 0; i < guard_result->result_count; i++) {
        printf("  %s: %s\n", guard_result->results[i].name,
               guard_result->results[i].passed ? "PASSED" : "FAILED");
    }
    if (guard_result->response) {
        printf("Response: %.100s...\n", guard_result->response);
    }

    guardrails_result_free(guard_result);
    guardrails_free(guardrailed);

    return 0;
}
