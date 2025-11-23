/**
 * Prompt Chaining Pattern Implementation for C
 * Sequential LLM calls with programmatic checkpoints
 *
 * Note: This is a simplified example. In production, use a proper HTTP library
 * like libcurl and JSON library like cJSON or jansson.
 *
 * Compile with:
 * gcc -o prompt_chaining prompt_chaining.c -lcurl -ljson-c
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

// Forward declarations
typedef struct ChainStep ChainStep;
typedef struct PromptChain PromptChain;
typedef struct ChainHistory ChainHistory;
typedef struct Context Context;

// Type definitions for callbacks
typedef char* (*PromptTemplateFunc)(Context* ctx);
typedef bool (*ValidatorFunc)(const char* output);
typedef void* (*ProcessorFunc)(const char* output);

/**
 * Context holds key-value pairs for the chain execution
 */
typedef struct Context {
    char** keys;
    char** values;
    size_t count;
    size_t capacity;
} Context;

/**
 * Chain history entry
 */
typedef struct ChainHistory {
    char* step_name;
    char* prompt;
    char* output;
} ChainHistory;

/**
 * Chain step definition
 */
typedef struct ChainStep {
    char* name;
    PromptTemplateFunc prompt_template;
    ValidatorFunc validator;
    ProcessorFunc processor;
} ChainStep;

/**
 * Prompt chain executor
 */
typedef struct PromptChain {
    char* api_key;
    char* model;
    ChainStep** steps;
    size_t step_count;
    size_t step_capacity;
    ChainHistory** history;
    size_t history_count;
    size_t history_capacity;
} PromptChain;

// Context functions
Context* context_create() {
    Context* ctx = (Context*)malloc(sizeof(Context));
    ctx->capacity = 10;
    ctx->count = 0;
    ctx->keys = (char**)calloc(ctx->capacity, sizeof(char*));
    ctx->values = (char**)calloc(ctx->capacity, sizeof(char*));
    return ctx;
}

void context_set(Context* ctx, const char* key, const char* value) {
    // Check if key exists
    for (size_t i = 0; i < ctx->count; i++) {
        if (strcmp(ctx->keys[i], key) == 0) {
            free(ctx->values[i]);
            ctx->values[i] = strdup(value);
            return;
        }
    }

    // Add new key-value pair
    if (ctx->count >= ctx->capacity) {
        ctx->capacity *= 2;
        ctx->keys = (char**)realloc(ctx->keys, ctx->capacity * sizeof(char*));
        ctx->values = (char**)realloc(ctx->values, ctx->capacity * sizeof(char*));
    }

    ctx->keys[ctx->count] = strdup(key);
    ctx->values[ctx->count] = strdup(value);
    ctx->count++;
}

const char* context_get(Context* ctx, const char* key) {
    for (size_t i = 0; i < ctx->count; i++) {
        if (strcmp(ctx->keys[i], key) == 0) {
            return ctx->values[i];
        }
    }
    return NULL;
}

void context_free(Context* ctx) {
    for (size_t i = 0; i < ctx->count; i++) {
        free(ctx->keys[i]);
        free(ctx->values[i]);
    }
    free(ctx->keys);
    free(ctx->values);
    free(ctx);
}

// Chain step functions
ChainStep* chain_step_create(
    const char* name,
    PromptTemplateFunc prompt_template,
    ValidatorFunc validator,
    ProcessorFunc processor
) {
    ChainStep* step = (ChainStep*)malloc(sizeof(ChainStep));
    step->name = strdup(name);
    step->prompt_template = prompt_template;
    step->validator = validator;
    step->processor = processor;
    return step;
}

void chain_step_free(ChainStep* step) {
    free(step->name);
    free(step);
}

// Prompt chain functions
PromptChain* prompt_chain_create(const char* api_key, const char* model) {
    PromptChain* chain = (PromptChain*)malloc(sizeof(PromptChain));
    chain->api_key = strdup(api_key);
    chain->model = strdup(model);
    chain->step_capacity = 10;
    chain->step_count = 0;
    chain->steps = (ChainStep**)calloc(chain->step_capacity, sizeof(ChainStep*));
    chain->history_capacity = 10;
    chain->history_count = 0;
    chain->history = (ChainHistory**)calloc(chain->history_capacity, sizeof(ChainHistory*));
    return chain;
}

void prompt_chain_add_step(PromptChain* chain, ChainStep* step) {
    if (chain->step_count >= chain->step_capacity) {
        chain->step_capacity *= 2;
        chain->steps = (ChainStep**)realloc(
            chain->steps,
            chain->step_capacity * sizeof(ChainStep*)
        );
    }
    chain->steps[chain->step_count++] = step;
}

/**
 * Simplified API call - in production, use libcurl
 */
char* call_anthropic_api(const char* api_key, const char* model, const char* prompt) {
    // NOTE: This is a placeholder. In production, implement using libcurl:
    //
    // 1. Create CURL handle
    // 2. Set URL to "https://api.anthropic.com/v1/messages"
    // 3. Set headers: x-api-key, anthropic-version, content-type
    // 4. Create JSON request body with prompt
    // 5. Execute request
    // 6. Parse JSON response
    // 7. Extract text content
    // 8. Return result

    printf("API Call (mock):\n");
    printf("Model: %s\n", model);
    printf("Prompt: %.100s...\n", prompt);

    // Mock response
    return strdup("This is a mock LLM response. In production, implement actual API call.");
}

char* prompt_chain_execute(PromptChain* chain, Context* initial_context) {
    Context* ctx = context_create();

    // Copy initial context
    for (size_t i = 0; i < initial_context->count; i++) {
        context_set(ctx, initial_context->keys[i], initial_context->values[i]);
    }

    char* current_output = NULL;

    for (size_t i = 0; i < chain->step_count; i++) {
        ChainStep* step = chain->steps[i];

        // Format prompt with current context
        char* prompt = step->prompt_template(ctx);

        // Call LLM
        if (current_output) {
            free(current_output);
        }
        current_output = call_anthropic_api(chain->api_key, chain->model, prompt);

        // Validate if validator provided
        if (step->validator && !step->validator(current_output)) {
            fprintf(stderr, "Step '%s' validation failed\n", step->name);
            free(prompt);
            free(current_output);
            context_free(ctx);
            return NULL;
        }

        // Process if processor provided
        if (step->processor) {
            void* processed = step->processor(current_output);
            // In this simplified version, we assume processor returns a string
            context_set(ctx, step->name, (char*)processed);
        } else {
            context_set(ctx, step->name, current_output);
        }

        // Track history
        if (chain->history_count >= chain->history_capacity) {
            chain->history_capacity *= 2;
            chain->history = (ChainHistory**)realloc(
                chain->history,
                chain->history_capacity * sizeof(ChainHistory*)
            );
        }

        ChainHistory* history_entry = (ChainHistory*)malloc(sizeof(ChainHistory));
        history_entry->step_name = strdup(step->name);
        history_entry->prompt = strdup(prompt);
        history_entry->output = strdup(current_output);
        chain->history[chain->history_count++] = history_entry;

        free(prompt);
    }

    char* result = strdup(current_output);
    free(current_output);
    context_free(ctx);

    return result;
}

void prompt_chain_free(PromptChain* chain) {
    free(chain->api_key);
    free(chain->model);

    for (size_t i = 0; i < chain->step_count; i++) {
        chain_step_free(chain->steps[i]);
    }
    free(chain->steps);

    for (size_t i = 0; i < chain->history_count; i++) {
        free(chain->history[i]->step_name);
        free(chain->history[i]->prompt);
        free(chain->history[i]->output);
        free(chain->history[i]);
    }
    free(chain->history);

    free(chain);
}

// Example usage
char* outline_template(Context* ctx) {
    const char* topic = context_get(ctx, "topic");
    char* prompt = (char*)malloc(1024);
    snprintf(prompt, 1024, "Create a detailed outline for an article about: %s", topic);
    return prompt;
}

bool outline_validator(const char* output) {
    return strstr(output, "1.") != NULL && strstr(output, "2.") != NULL;
}

char* draft_template(Context* ctx) {
    const char* outline = context_get(ctx, "outline");
    char* prompt = (char*)malloc(2048);
    snprintf(prompt, 2048,
        "Expand this outline into a full article:\n%s\n\nWrite in a professional tone with clear examples.",
        outline);
    return prompt;
}

int main() {
    const char* api_key = getenv("ANTHROPIC_API_KEY");
    if (!api_key) {
        fprintf(stderr, "ANTHROPIC_API_KEY environment variable not set\n");
        return 1;
    }

    // Create chain
    PromptChain* chain = prompt_chain_create(api_key, "claude-3-5-sonnet-20241022");

    // Add steps
    prompt_chain_add_step(chain, chain_step_create(
        "outline",
        outline_template,
        outline_validator,
        NULL
    ));

    prompt_chain_add_step(chain, chain_step_create(
        "draft",
        draft_template,
        NULL,
        NULL
    ));

    // Create initial context
    Context* ctx = context_create();
    context_set(ctx, "topic", "Building Effective AI Agents");

    // Execute chain
    char* result = prompt_chain_execute(chain, ctx);

    if (result) {
        printf("Final Result:\n%s\n", result);

        printf("\n\nExecution History:\n");
        for (size_t i = 0; i < chain->history_count; i++) {
            printf("\nStep: %s\n", chain->history[i]->step_name);
            printf("Output length: %zu chars\n", strlen(chain->history[i]->output));
        }

        free(result);
    }

    // Cleanup
    context_free(ctx);
    prompt_chain_free(chain);

    return 0;
}
