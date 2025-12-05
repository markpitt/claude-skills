/**
 * Orchestrator-Workers Pattern Implementation for C
 * Central orchestrator delegates to specialized workers
 *
 * Note: This is a simplified example. In production, use libcurl
 * for HTTP and cJSON for JSON parsing.
 *
 * Compile with:
 * gcc -o orchestrator_workers orchestrator_workers.c -pthread -lcurl -ljson-c
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <pthread.h>

// Maximum sizes
#define MAX_WORKERS 20
#define MAX_TASKS 50
#define MAX_DEPENDENCIES 10
#define MAX_NAME_SIZE 64
#define MAX_INPUT_SIZE 4096
#define MAX_OUTPUT_SIZE 16384

/**
 * Worker result
 */
typedef struct WorkerResult {
    char task_id[MAX_NAME_SIZE];
    char worker_type[MAX_NAME_SIZE];
    char* result;
    bool success;
    char* error;
} WorkerResult;

/**
 * Subtask definition
 */
typedef struct SubTask {
    char id[MAX_NAME_SIZE];
    char type[MAX_NAME_SIZE];
    char* description;
    char* context;  // JSON string
    char* dependencies[MAX_DEPENDENCIES];
    int dependency_count;
} SubTask;

/**
 * Worker function type
 */
typedef WorkerResult* (*WorkerExecuteFunc)(const SubTask* task, void* user_data);

/**
 * Worker definition
 */
typedef struct Worker {
    char type[MAX_NAME_SIZE];
    char* system_prompt;
    WorkerExecuteFunc execute;
    void* user_data;
} Worker;

/**
 * Simplified API call
 */
char* call_anthropic_api(const char* api_key, const char* model,
                         const char* prompt, int max_tokens) {
    printf("API Call (mock) - Model: %s\n", model);
    char* response = (char*)malloc(MAX_OUTPUT_SIZE);
    snprintf(response, MAX_OUTPUT_SIZE, "Mock response for: %.50s...", prompt);
    return response;
}

/**
 * LLM worker context
 */
typedef struct LLMWorkerContext {
    char* api_key;
    char* model;
    char* system_prompt;
} LLMWorkerContext;

/**
 * LLM worker execute function
 */
WorkerResult* llm_worker_execute(const SubTask* task, void* user_data) {
    LLMWorkerContext* ctx = (LLMWorkerContext*)user_data;

    // Build prompt
    char prompt[MAX_INPUT_SIZE];
    snprintf(prompt, sizeof(prompt),
        "%s\n\nTask: %s\n\nContext:\n%s\n\nProvide your result:",
        ctx->system_prompt, task->description,
        task->context ? task->context : "{}");

    // Call API
    char* response = call_anthropic_api(ctx->api_key, ctx->model, prompt, 4096);

    WorkerResult* result = (WorkerResult*)calloc(1, sizeof(WorkerResult));
    strcpy(result->task_id, task->id);
    strcpy(result->worker_type, task->type);

    if (response) {
        result->result = response;
        result->success = true;
    } else {
        result->result = NULL;
        result->success = false;
        result->error = strdup("API call failed");
    }

    return result;
}

/**
 * Create LLM worker context
 */
LLMWorkerContext* llm_worker_context_create(const char* api_key,
                                             const char* model,
                                             const char* system_prompt) {
    LLMWorkerContext* ctx = (LLMWorkerContext*)calloc(1, sizeof(LLMWorkerContext));
    ctx->api_key = strdup(api_key);
    ctx->model = strdup(model);
    ctx->system_prompt = strdup(system_prompt);
    return ctx;
}

/**
 * Free LLM worker context
 */
void llm_worker_context_free(LLMWorkerContext* ctx) {
    free(ctx->api_key);
    free(ctx->model);
    free(ctx->system_prompt);
    free(ctx);
}

/**
 * Orchestration plan
 */
typedef struct OrchestrationPlan {
    SubTask* tasks;
    int task_count;
    char* synthesis;
} OrchestrationPlan;

/**
 * Orchestration result
 */
typedef struct OrchestrationResult {
    char* task;
    WorkerResult** worker_results;
    int worker_count;
    char* final_result;
    bool success;
} OrchestrationResult;

/**
 * Orchestrator
 */
typedef struct Orchestrator {
    char* api_key;
    char* model;
    Worker workers[MAX_WORKERS];
    int worker_count;
} Orchestrator;

/**
 * Create orchestrator
 */
Orchestrator* orchestrator_create(const char* api_key, const char* model) {
    Orchestrator* o = (Orchestrator*)calloc(1, sizeof(Orchestrator));
    o->api_key = strdup(api_key);
    o->model = model ? strdup(model) : strdup("claude-sonnet-4-20250514");
    o->worker_count = 0;
    return o;
}

/**
 * Register a worker
 */
bool orchestrator_register_worker(Orchestrator* o, const char* type,
                                   const char* system_prompt,
                                   WorkerExecuteFunc execute,
                                   void* user_data) {
    if (o->worker_count >= MAX_WORKERS) return false;

    Worker* worker = &o->workers[o->worker_count];
    strncpy(worker->type, type, MAX_NAME_SIZE - 1);
    worker->system_prompt = strdup(system_prompt);
    worker->execute = execute;
    worker->user_data = user_data;
    o->worker_count++;

    return true;
}

/**
 * Register an LLM worker (convenience function)
 */
bool orchestrator_register_llm_worker(Orchestrator* o, const char* type,
                                       const char* system_prompt) {
    LLMWorkerContext* ctx = llm_worker_context_create(o->api_key, o->model, system_prompt);
    return orchestrator_register_worker(o, type, system_prompt, llm_worker_execute, ctx);
}

/**
 * Parse planning response to create subtasks (simplified)
 */
OrchestrationPlan* parse_plan(const char* response) {
    // Simplified - in production use proper JSON parsing
    OrchestrationPlan* plan = (OrchestrationPlan*)calloc(1, sizeof(OrchestrationPlan));

    // Create mock tasks for demonstration
    plan->task_count = 2;
    plan->tasks = (SubTask*)calloc(plan->task_count, sizeof(SubTask));

    strcpy(plan->tasks[0].id, "task_1");
    strcpy(plan->tasks[0].type, "researcher");
    plan->tasks[0].description = strdup("Research the topic");
    plan->tasks[0].context = strdup("{}");
    plan->tasks[0].dependency_count = 0;

    strcpy(plan->tasks[1].id, "task_2");
    strcpy(plan->tasks[1].type, "writer");
    plan->tasks[1].description = strdup("Write based on research");
    plan->tasks[1].context = strdup("{}");
    plan->tasks[1].dependencies[0] = strdup("task_1");
    plan->tasks[1].dependency_count = 1;

    plan->synthesis = strdup("Combine research and writing into final document");

    return plan;
}

/**
 * Create execution plan
 */
OrchestrationPlan* orchestrator_create_plan(Orchestrator* o, const char* task) {
    // Build list of available workers
    char workers_desc[MAX_INPUT_SIZE];
    workers_desc[0] = '\0';

    for (int i = 0; i < o->worker_count; i++) {
        char line[256];
        snprintf(line, sizeof(line), "- %s\n", o->workers[i].type);
        strcat(workers_desc, line);
    }

    char prompt[MAX_INPUT_SIZE];
    snprintf(prompt, sizeof(prompt),
        "Break down this task into subtasks for specialized workers.\n\n"
        "Available workers:\n%s\n"
        "Task: %s\n\n"
        "Respond in JSON format:\n"
        "{\n"
        "  \"tasks\": [\n"
        "    {\"id\": \"task_1\", \"type\": \"worker_type\", \"description\": \"...\", \"dependencies\": []}\n"
        "  ],\n"
        "  \"synthesis\": \"How to combine results\"\n"
        "}",
        workers_desc, task);

    char* response = call_anthropic_api(o->api_key, o->model, prompt, 2048);
    OrchestrationPlan* plan = parse_plan(response);
    free(response);

    return plan;
}

/**
 * Find worker by type
 */
Worker* orchestrator_find_worker(Orchestrator* o, const char* type) {
    for (int i = 0; i < o->worker_count; i++) {
        if (strcmp(o->workers[i].type, type) == 0) {
            return &o->workers[i];
        }
    }
    return NULL;
}

/**
 * Check if all dependencies are completed
 */
bool dependencies_completed(const SubTask* task, const char** completed, int completed_count) {
    for (int i = 0; i < task->dependency_count; i++) {
        bool found = false;
        for (int j = 0; j < completed_count; j++) {
            if (strcmp(task->dependencies[i], completed[j]) == 0) {
                found = true;
                break;
            }
        }
        if (!found) return false;
    }
    return true;
}

/**
 * Worker thread arguments
 */
typedef struct WorkerThreadArgs {
    Worker* worker;
    SubTask* task;
    WorkerResult** result;
} WorkerThreadArgs;

/**
 * Worker thread function
 */
void* worker_thread(void* args) {
    WorkerThreadArgs* wargs = (WorkerThreadArgs*)args;
    *wargs->result = wargs->worker->execute(wargs->task, wargs->worker->user_data);
    return NULL;
}

/**
 * Execute tasks respecting dependencies
 */
WorkerResult** orchestrator_execute_tasks(Orchestrator* o, OrchestrationPlan* plan,
                                           int* result_count) {
    *result_count = plan->task_count;
    WorkerResult** results = (WorkerResult**)calloc(plan->task_count, sizeof(WorkerResult*));

    // Track completed tasks
    const char** completed = (const char**)calloc(plan->task_count, sizeof(char*));
    int completed_count = 0;

    // Track pending tasks
    bool* pending = (bool*)calloc(plan->task_count, sizeof(bool));
    for (int i = 0; i < plan->task_count; i++) pending[i] = true;
    int pending_count = plan->task_count;

    while (pending_count > 0) {
        // Find ready tasks
        int ready_indices[MAX_TASKS];
        int ready_count = 0;

        for (int i = 0; i < plan->task_count; i++) {
            if (pending[i] && dependencies_completed(&plan->tasks[i], completed, completed_count)) {
                ready_indices[ready_count++] = i;
            }
        }

        if (ready_count == 0 && pending_count > 0) {
            fprintf(stderr, "Circular dependency detected!\n");
            break;
        }

        // Execute ready tasks in parallel
        pthread_t* threads = (pthread_t*)calloc(ready_count, sizeof(pthread_t));
        WorkerThreadArgs* args = (WorkerThreadArgs*)calloc(ready_count, sizeof(WorkerThreadArgs));

        for (int i = 0; i < ready_count; i++) {
            int task_idx = ready_indices[i];
            SubTask* task = &plan->tasks[task_idx];
            Worker* worker = orchestrator_find_worker(o, task->type);

            if (!worker) {
                results[task_idx] = (WorkerResult*)calloc(1, sizeof(WorkerResult));
                strcpy(results[task_idx]->task_id, task->id);
                strcpy(results[task_idx]->worker_type, task->type);
                results[task_idx]->success = false;
                results[task_idx]->error = strdup("No worker found for type");
                continue;
            }

            args[i].worker = worker;
            args[i].task = task;
            args[i].result = &results[task_idx];

            pthread_create(&threads[i], NULL, worker_thread, &args[i]);
        }

        // Wait for ready tasks
        for (int i = 0; i < ready_count; i++) {
            if (args[i].worker) {  // Skip tasks that failed to find worker
                pthread_join(threads[i], NULL);
            }

            int task_idx = ready_indices[i];
            completed[completed_count++] = plan->tasks[task_idx].id;
            pending[task_idx] = false;
            pending_count--;
        }

        free(threads);
        free(args);
    }

    free(completed);
    free(pending);
    return results;
}

/**
 * Synthesize results
 */
char* orchestrator_synthesize(Orchestrator* o, const char* task,
                               WorkerResult** results, int result_count,
                               const char* synthesis_instructions) {
    // Build result summaries
    char summaries[MAX_OUTPUT_SIZE];
    summaries[0] = '\0';

    for (int i = 0; i < result_count; i++) {
        char summary[2048];
        if (results[i]->success) {
            snprintf(summary, sizeof(summary),
                "Worker: %s\nTask: %s\nResult: %s\n---\n",
                results[i]->worker_type, results[i]->task_id, results[i]->result);
        } else {
            snprintf(summary, sizeof(summary),
                "Worker: %s\nTask: %s\nFAILED: %s\n---\n",
                results[i]->worker_type, results[i]->task_id, results[i]->error);
        }
        strcat(summaries, summary);
    }

    char prompt[MAX_OUTPUT_SIZE];
    snprintf(prompt, sizeof(prompt),
        "Synthesize these worker results into a final response.\n\n"
        "Original task: %s\n\n"
        "Worker results:\n%s\n\n"
        "Instructions: %s\n\n"
        "Provide a comprehensive final result:",
        task, summaries, synthesis_instructions);

    return call_anthropic_api(o->api_key, o->model, prompt, 4096);
}

/**
 * Execute orchestration
 */
OrchestrationResult* orchestrator_execute(Orchestrator* o, const char* task) {
    // Step 1: Plan
    OrchestrationPlan* plan = orchestrator_create_plan(o, task);

    // Step 2: Execute with dependencies
    int worker_count;
    WorkerResult** worker_results = orchestrator_execute_tasks(o, plan, &worker_count);

    // Step 3: Synthesize
    char* final_result = orchestrator_synthesize(o, task, worker_results, worker_count,
                                                  plan->synthesis);

    // Check success
    bool success = true;
    for (int i = 0; i < worker_count; i++) {
        if (!worker_results[i]->success) {
            success = false;
            break;
        }
    }

    // Create result
    OrchestrationResult* result = (OrchestrationResult*)calloc(1, sizeof(OrchestrationResult));
    result->task = strdup(task);
    result->worker_results = worker_results;
    result->worker_count = worker_count;
    result->final_result = final_result;
    result->success = success;

    // Free plan
    for (int i = 0; i < plan->task_count; i++) {
        free(plan->tasks[i].description);
        free(plan->tasks[i].context);
        for (int j = 0; j < plan->tasks[i].dependency_count; j++) {
            free(plan->tasks[i].dependencies[j]);
        }
    }
    free(plan->tasks);
    free(plan->synthesis);
    free(plan);

    return result;
}

/**
 * Free worker result
 */
void worker_result_free(WorkerResult* result) {
    free(result->result);
    free(result->error);
    free(result);
}

/**
 * Free orchestration result
 */
void orchestration_result_free(OrchestrationResult* result) {
    free(result->task);
    for (int i = 0; i < result->worker_count; i++) {
        worker_result_free(result->worker_results[i]);
    }
    free(result->worker_results);
    free(result->final_result);
    free(result);
}

/**
 * Free orchestrator
 */
void orchestrator_free(Orchestrator* o) {
    free(o->api_key);
    free(o->model);

    for (int i = 0; i < o->worker_count; i++) {
        free(o->workers[i].system_prompt);
        // Note: user_data cleanup depends on the worker type
        // For LLM workers, we need to free the context
        if (o->workers[i].execute == llm_worker_execute && o->workers[i].user_data) {
            llm_worker_context_free((LLMWorkerContext*)o->workers[i].user_data);
        }
    }

    free(o);
}

int main() {
    const char* api_key = getenv("ANTHROPIC_API_KEY");
    if (!api_key) {
        fprintf(stderr, "ANTHROPIC_API_KEY environment variable not set\n");
        return 1;
    }

    printf("=== Orchestrator-Workers Pattern ===\n\n");

    // Create orchestrator
    Orchestrator* orchestrator = orchestrator_create(api_key, NULL);

    // Register workers
    orchestrator_register_llm_worker(orchestrator, "researcher",
        "You are a research specialist. Gather and analyze information thoroughly.");

    orchestrator_register_llm_worker(orchestrator, "writer",
        "You are a technical writer. Create clear, well-structured documentation.");

    orchestrator_register_llm_worker(orchestrator, "reviewer",
        "You are a quality reviewer. Check for accuracy and completeness.");

    // Execute
    OrchestrationResult* result = orchestrator_execute(orchestrator,
        "Create a guide on best practices for error handling in C");

    // Print results
    printf("Task: %s\n", result->task);
    printf("Success: %s\n\n", result->success ? "yes" : "no");

    printf("Worker Results:\n");
    for (int i = 0; i < result->worker_count; i++) {
        printf("  - %s (%s): %s\n",
               result->worker_results[i]->worker_type,
               result->worker_results[i]->task_id,
               result->worker_results[i]->success ? "Success" : "Failed");
    }

    printf("\nFinal Result:\n%s\n", result->final_result);

    // Cleanup
    orchestration_result_free(result);
    orchestrator_free(orchestrator);

    return 0;
}
