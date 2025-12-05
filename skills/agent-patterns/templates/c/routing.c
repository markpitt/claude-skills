/**
 * Routing Pattern Implementation for C
 * Classification-based routing of inputs to specialized handlers
 *
 * Note: This is a simplified example. In production, use a proper HTTP library
 * like libcurl and JSON library like cJSON or jansson.
 *
 * Compile with:
 * gcc -o routing routing.c -lcurl -ljson-c
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

// Maximum sizes
#define MAX_CATEGORIES 20
#define MAX_INPUT_SIZE 4096
#define MAX_OUTPUT_SIZE 16384
#define MAX_CATEGORY_NAME 64
#define MAX_DESCRIPTION 256

// Forward declarations
typedef struct ClassificationResult ClassificationResult;
typedef struct Route Route;
typedef struct Router Router;

/**
 * Classification result from LLM
 */
typedef struct ClassificationResult {
    char category[MAX_CATEGORY_NAME];
    double confidence;
    char reasoning[MAX_DESCRIPTION];
} ClassificationResult;

/**
 * Route handler function type
 */
typedef char* (*RouteHandler)(const char* input, void* user_data);

/**
 * Route definition
 */
typedef struct Route {
    char category[MAX_CATEGORY_NAME];
    char description[MAX_DESCRIPTION];
    RouteHandler handler;
    void* user_data;
} Route;

/**
 * Router that classifies and routes inputs
 */
typedef struct Router {
    char* api_key;
    char* model;
    Route routes[MAX_CATEGORIES];
    size_t route_count;
    double confidence_threshold;
    RouteHandler fallback_handler;
    void* fallback_user_data;
} Router;

/**
 * Simplified API call - in production, use libcurl
 */
char* call_anthropic_api(const char* api_key, const char* model,
                         const char* prompt, int max_tokens) {
    // NOTE: This is a placeholder. In production, implement using libcurl:
    //
    // Example with libcurl:
    // CURL *curl = curl_easy_init();
    // struct curl_slist *headers = NULL;
    // headers = curl_slist_append(headers, "Content-Type: application/json");
    // headers = curl_slist_append(headers, api_key_header);
    // headers = curl_slist_append(headers, "anthropic-version: 2023-06-01");
    // curl_easy_setopt(curl, CURLOPT_URL, "https://api.anthropic.com/v1/messages");
    // curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    // curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_body);
    // ...

    printf("API Call (mock):\n");
    printf("Model: %s\n", model);
    printf("Max tokens: %d\n", max_tokens);
    printf("Prompt: %.100s...\n", prompt);

    // Mock response - return classification JSON
    return strdup("{\"category\": \"general\", \"confidence\": 0.85, \"reasoning\": \"Mock classification\"}");
}

/**
 * Parse classification JSON response
 */
bool parse_classification(const char* json, ClassificationResult* result) {
    // Simplified JSON parsing - use cJSON or jansson in production

    // Find category
    const char* cat_start = strstr(json, "\"category\"");
    if (cat_start) {
        cat_start = strchr(cat_start + 10, '"');
        if (cat_start) {
            cat_start++;
            const char* cat_end = strchr(cat_start, '"');
            if (cat_end) {
                size_t len = cat_end - cat_start;
                if (len >= MAX_CATEGORY_NAME) len = MAX_CATEGORY_NAME - 1;
                strncpy(result->category, cat_start, len);
                result->category[len] = '\0';
            }
        }
    }

    // Find confidence
    const char* conf_start = strstr(json, "\"confidence\"");
    if (conf_start) {
        conf_start = strchr(conf_start + 12, ':');
        if (conf_start) {
            result->confidence = atof(conf_start + 1);
        }
    }

    // Find reasoning
    const char* reason_start = strstr(json, "\"reasoning\"");
    if (reason_start) {
        reason_start = strchr(reason_start + 11, '"');
        if (reason_start) {
            reason_start++;
            const char* reason_end = strchr(reason_start, '"');
            if (reason_end) {
                size_t len = reason_end - reason_start;
                if (len >= MAX_DESCRIPTION) len = MAX_DESCRIPTION - 1;
                strncpy(result->reasoning, reason_start, len);
                result->reasoning[len] = '\0';
            }
        }
    }

    return strlen(result->category) > 0;
}

/**
 * Create a new router
 */
Router* router_create(const char* api_key, const char* model) {
    Router* router = (Router*)calloc(1, sizeof(Router));
    router->api_key = strdup(api_key);
    router->model = model ? strdup(model) : strdup("claude-sonnet-4-20250514");
    router->route_count = 0;
    router->confidence_threshold = 0.7;
    router->fallback_handler = NULL;
    return router;
}

/**
 * Set confidence threshold
 */
void router_set_threshold(Router* router, double threshold) {
    router->confidence_threshold = threshold;
}

/**
 * Set fallback handler
 */
void router_set_fallback(Router* router, RouteHandler handler, void* user_data) {
    router->fallback_handler = handler;
    router->fallback_user_data = user_data;
}

/**
 * Add a route to the router
 */
bool router_add_route(Router* router, const char* category,
                      const char* description, RouteHandler handler,
                      void* user_data) {
    if (router->route_count >= MAX_CATEGORIES) {
        return false;
    }

    Route* route = &router->routes[router->route_count];
    strncpy(route->category, category, MAX_CATEGORY_NAME - 1);
    strncpy(route->description, description, MAX_DESCRIPTION - 1);
    route->handler = handler;
    route->user_data = user_data;
    router->route_count++;

    return true;
}

/**
 * Classify an input
 */
ClassificationResult* router_classify(Router* router, const char* input) {
    // Build classification prompt
    char prompt[MAX_INPUT_SIZE * 2];
    char categories[MAX_INPUT_SIZE];
    categories[0] = '\0';

    for (size_t i = 0; i < router->route_count; i++) {
        char cat_line[MAX_CATEGORY_NAME + MAX_DESCRIPTION + 10];
        snprintf(cat_line, sizeof(cat_line), "%s: %s\n",
                 router->routes[i].category, router->routes[i].description);
        strcat(categories, cat_line);
    }

    snprintf(prompt, sizeof(prompt),
        "Classify the following input into one of these categories:\n"
        "%s\n"
        "Input: %s\n\n"
        "Respond in JSON format:\n"
        "{\"category\": \"category_name\", \"confidence\": 0.0-1.0, \"reasoning\": \"explanation\"}",
        categories, input);

    char* response = call_anthropic_api(router->api_key, router->model, prompt, 256);
    if (!response) {
        return NULL;
    }

    ClassificationResult* result = (ClassificationResult*)calloc(1, sizeof(ClassificationResult));
    if (!parse_classification(response, result)) {
        free(result);
        free(response);
        return NULL;
    }

    free(response);
    return result;
}

/**
 * Route an input to the appropriate handler
 */
char* router_route(Router* router, const char* input) {
    ClassificationResult* classification = router_classify(router, input);
    if (!classification) {
        if (router->fallback_handler) {
            return router->fallback_handler(input, router->fallback_user_data);
        }
        return NULL;
    }

    printf("Classification: %s (confidence: %.2f)\n",
           classification->category, classification->confidence);

    // Find matching route
    Route* matching_route = NULL;
    for (size_t i = 0; i < router->route_count; i++) {
        if (strcmp(router->routes[i].category, classification->category) == 0) {
            matching_route = &router->routes[i];
            break;
        }
    }

    char* result = NULL;

    if (matching_route && classification->confidence >= router->confidence_threshold) {
        result = matching_route->handler(input, matching_route->user_data);
    } else if (router->fallback_handler) {
        result = router->fallback_handler(input, router->fallback_user_data);
    }

    free(classification);
    return result;
}

/**
 * Free router resources
 */
void router_free(Router* router) {
    free(router->api_key);
    free(router->model);
    free(router);
}

// Complexity levels for model routing
typedef enum {
    COMPLEXITY_SIMPLE,
    COMPLEXITY_MODERATE,
    COMPLEXITY_COMPLEX
} Complexity;

/**
 * Model router for complexity-based routing
 */
typedef struct ModelRouter {
    char* api_key;
    char* fast_model;
    char* standard_model;
    char* powerful_model;
    char* classification_model;
} ModelRouter;

/**
 * Create model router
 */
ModelRouter* model_router_create(const char* api_key) {
    ModelRouter* router = (ModelRouter*)calloc(1, sizeof(ModelRouter));
    router->api_key = strdup(api_key);
    router->fast_model = strdup("claude-3-haiku-20240307");
    router->standard_model = strdup("claude-sonnet-4-20250514");
    router->powerful_model = strdup("claude-opus-4-20250514");
    router->classification_model = strdup("claude-sonnet-4-20250514");
    return router;
}

/**
 * Assess complexity of input
 */
Complexity model_router_assess(ModelRouter* router, const char* input) {
    char prompt[MAX_INPUT_SIZE];
    snprintf(prompt, sizeof(prompt),
        "Assess the complexity of handling this request:\n\n"
        "%s\n\n"
        "Consider:\n"
        "- simple: Direct factual answers, simple calculations, basic questions\n"
        "- moderate: Analysis, explanations, moderate coding tasks\n"
        "- complex: Deep analysis, complex reasoning, creative writing, complex code\n\n"
        "Respond with just: simple, moderate, or complex",
        input);

    char* response = call_anthropic_api(router->api_key, router->classification_model, prompt, 32);
    if (!response) {
        return COMPLEXITY_MODERATE;
    }

    Complexity result = COMPLEXITY_MODERATE;
    if (strstr(response, "simple")) {
        result = COMPLEXITY_SIMPLE;
    } else if (strstr(response, "complex")) {
        result = COMPLEXITY_COMPLEX;
    }

    free(response);
    return result;
}

/**
 * Route to appropriate model and get response
 */
char* model_router_route(ModelRouter* router, const char* input) {
    Complexity complexity = model_router_assess(router, input);

    const char* model;
    switch (complexity) {
        case COMPLEXITY_SIMPLE:
            model = router->fast_model;
            printf("Using fast model: %s\n", model);
            break;
        case COMPLEXITY_COMPLEX:
            model = router->powerful_model;
            printf("Using powerful model: %s\n", model);
            break;
        default:
            model = router->standard_model;
            printf("Using standard model: %s\n", model);
            break;
    }

    return call_anthropic_api(router->api_key, model, input, 4096);
}

/**
 * Free model router
 */
void model_router_free(ModelRouter* router) {
    free(router->api_key);
    free(router->fast_model);
    free(router->standard_model);
    free(router->powerful_model);
    free(router->classification_model);
    free(router);
}

// Example handlers
char* handle_code_question(const char* input, void* user_data) {
    const char* api_key = (const char*)user_data;
    char prompt[MAX_INPUT_SIZE];
    snprintf(prompt, sizeof(prompt), "As a coding expert, answer: %s", input);
    return call_anthropic_api(api_key, "claude-sonnet-4-20250514", prompt, 4096);
}

char* handle_math_question(const char* input, void* user_data) {
    const char* api_key = (const char*)user_data;
    char prompt[MAX_INPUT_SIZE];
    snprintf(prompt, sizeof(prompt), "As a math expert, solve: %s", input);
    return call_anthropic_api(api_key, "claude-sonnet-4-20250514", prompt, 4096);
}

char* handle_general_question(const char* input, void* user_data) {
    const char* api_key = (const char*)user_data;
    char prompt[MAX_INPUT_SIZE];
    snprintf(prompt, sizeof(prompt), "Answer this question: %s", input);
    return call_anthropic_api(api_key, "claude-sonnet-4-20250514", prompt, 4096);
}

char* handle_fallback(const char* input, void* user_data) {
    printf("Using fallback handler for: %s\n", input);
    return strdup("Handled by fallback");
}

int main() {
    const char* api_key = getenv("ANTHROPIC_API_KEY");
    if (!api_key) {
        fprintf(stderr, "ANTHROPIC_API_KEY environment variable not set\n");
        return 1;
    }

    // Create router
    printf("=== Category Router ===\n");
    Router* router = router_create(api_key, NULL);
    router_set_threshold(router, 0.7);
    router_set_fallback(router, handle_fallback, (void*)api_key);

    // Add routes
    router_add_route(router, "code",
                     "Programming and coding questions",
                     handle_code_question, (void*)api_key);
    router_add_route(router, "math",
                     "Mathematics and calculations",
                     handle_math_question, (void*)api_key);
    router_add_route(router, "general",
                     "General knowledge questions",
                     handle_general_question, (void*)api_key);

    // Route a query
    char* result = router_route(router, "How do I implement a binary search tree?");
    if (result) {
        printf("Result: %s\n", result);
        free(result);
    }

    router_free(router);

    // Model-based routing
    printf("\n=== Model Router ===\n");
    ModelRouter* model_router = model_router_create(api_key);

    char* model_result = model_router_route(model_router, "What is 2+2?");
    if (model_result) {
        printf("Simple query result: %s\n", model_result);
        free(model_result);
    }

    model_result = model_router_route(model_router, "Analyze the complexity of quicksort");
    if (model_result) {
        printf("Complex query result: %s\n", model_result);
        free(model_result);
    }

    model_router_free(model_router);

    return 0;
}
