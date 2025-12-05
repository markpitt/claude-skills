/**
 * Autonomous Agent Pattern Implementation for C
 * Open-ended exploration with tool usage
 *
 * Note: This is a simplified example. In production, use libcurl
 * for HTTP and cJSON for JSON parsing.
 *
 * Compile with:
 * gcc -o autonomous_agent autonomous_agent.c -lcurl -ljson-c
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

// Maximum sizes
#define MAX_TOOLS 20
#define MAX_PARAMS 10
#define MAX_HISTORY 100
#define MAX_CONVERSATION 50
#define MAX_NAME_SIZE 64
#define MAX_INPUT_SIZE 4096
#define MAX_OUTPUT_SIZE 16384

/**
 * Tool parameter definition
 */
typedef struct ToolParameter {
    char name[MAX_NAME_SIZE];
    char type[32];
    char description[256];
    bool required;
} ToolParameter;

/**
 * Tool handler function type
 */
typedef char* (*ToolHandler)(const char* args_json, void* user_data);

/**
 * Agent tool definition
 */
typedef struct AgentTool {
    char name[MAX_NAME_SIZE];
    char description[256];
    ToolParameter parameters[MAX_PARAMS];
    int param_count;
    ToolHandler handler;
    void* user_data;
} AgentTool;

/**
 * Action record
 */
typedef struct ActionRecord {
    int step;
    char action_type[32];  // "thought", "tool_call", "text_response"
    char tool_name[MAX_NAME_SIZE];
    char* tool_args;
    char* tool_result;
    char* thought;
} ActionRecord;

/**
 * Agent state
 */
typedef struct AgentState {
    int total_steps;
    int tool_calls;
    ActionRecord history[MAX_HISTORY];
    int history_count;
    bool is_complete;
    char* final_result;
} AgentState;

/**
 * Agent result
 */
typedef struct AgentResult {
    bool success;
    char* final_result;
    int total_steps;
    int tool_calls;
    ActionRecord* history;
    int history_count;
} AgentResult;

/**
 * Conversation message
 */
typedef struct ConversationMessage {
    char role[16];  // "user" or "assistant"
    char* content;
} ConversationMessage;

/**
 * Autonomous agent
 */
typedef struct AutonomousAgent {
    char* api_key;
    char* model;
    AgentTool tools[MAX_TOOLS];
    int tool_count;
    AgentState state;
    ConversationMessage conversation[MAX_CONVERSATION];
    int conversation_count;
} AutonomousAgent;

/**
 * Simplified API call
 */
char* call_anthropic_api(const char* api_key, const char* model,
                         const char* prompt, const char* system_prompt,
                         int max_tokens) {
    printf("API Call (mock) - Model: %s\n", model);

    // Mock response - return a tool call action
    char* response = (char*)malloc(MAX_OUTPUT_SIZE);
    snprintf(response, MAX_OUTPUT_SIZE,
        "{\n"
        "  \"thought\": \"I need to search for information first.\",\n"
        "  \"action\": \"search\",\n"
        "  \"args\": {\"query\": \"example search\"}\n"
        "}");
    return response;
}

/**
 * Create autonomous agent
 */
AutonomousAgent* agent_create(const char* api_key, const char* model) {
    AutonomousAgent* agent = (AutonomousAgent*)calloc(1, sizeof(AutonomousAgent));
    agent->api_key = strdup(api_key);
    agent->model = model ? strdup(model) : strdup("claude-sonnet-4-20250514");
    agent->tool_count = 0;
    agent->conversation_count = 0;
    return agent;
}

/**
 * Register a tool
 */
bool agent_register_tool(AutonomousAgent* agent, const char* name,
                          const char* description, ToolHandler handler,
                          void* user_data) {
    if (agent->tool_count >= MAX_TOOLS) return false;

    AgentTool* tool = &agent->tools[agent->tool_count];
    strncpy(tool->name, name, MAX_NAME_SIZE - 1);
    strncpy(tool->description, description, 255);
    tool->handler = handler;
    tool->user_data = user_data;
    tool->param_count = 0;
    agent->tool_count++;

    return true;
}

/**
 * Add parameter to most recently registered tool
 */
bool agent_add_tool_param(AutonomousAgent* agent, const char* name,
                           const char* type, const char* description,
                           bool required) {
    if (agent->tool_count == 0) return false;

    AgentTool* tool = &agent->tools[agent->tool_count - 1];
    if (tool->param_count >= MAX_PARAMS) return false;

    ToolParameter* param = &tool->parameters[tool->param_count];
    strncpy(param->name, name, MAX_NAME_SIZE - 1);
    strncpy(param->type, type, 31);
    strncpy(param->description, description, 255);
    param->required = required;
    tool->param_count++;

    return true;
}

/**
 * Find tool by name
 */
AgentTool* agent_find_tool(AutonomousAgent* agent, const char* name) {
    for (int i = 0; i < agent->tool_count; i++) {
        if (strcmp(agent->tools[i].name, name) == 0) {
            return &agent->tools[i];
        }
    }
    return NULL;
}

/**
 * Build system prompt
 */
char* agent_build_system_prompt(AutonomousAgent* agent) {
    char* prompt = (char*)malloc(MAX_INPUT_SIZE);
    char tools_desc[MAX_INPUT_SIZE / 2];
    tools_desc[0] = '\0';

    for (int i = 0; i < agent->tool_count; i++) {
        AgentTool* tool = &agent->tools[i];

        char params[512];
        params[0] = '\0';

        for (int j = 0; j < tool->param_count; j++) {
            char param_str[128];
            snprintf(param_str, sizeof(param_str), "%s: %s",
                     tool->parameters[j].name, tool->parameters[j].type);
            if (j > 0) strcat(params, ", ");
            strcat(params, param_str);
        }

        char tool_line[512];
        snprintf(tool_line, sizeof(tool_line), "- %s(%s): %s\n",
                 tool->name, params, tool->description);
        strcat(tools_desc, tool_line);
    }

    snprintf(prompt, MAX_INPUT_SIZE,
        "You are an autonomous agent that can use tools to complete tasks.\n\n"
        "Available tools:\n%s\n"
        "To use a tool, respond with JSON in this format:\n"
        "{\n"
        "  \"thought\": \"Your reasoning about what to do next\",\n"
        "  \"action\": \"tool_name\",\n"
        "  \"args\": { \"param\": \"value\" }\n"
        "}\n\n"
        "When you have completed the task, respond with:\n"
        "{\n"
        "  \"thought\": \"Task is complete because...\",\n"
        "  \"action\": \"complete\",\n"
        "  \"result\": \"Your final answer\"\n"
        "}\n\n"
        "Always think step by step and use tools to gather information before providing a final answer.",
        tools_desc);

    return prompt;
}

/**
 * Add message to conversation
 */
void agent_add_message(AutonomousAgent* agent, const char* role, const char* content) {
    if (agent->conversation_count >= MAX_CONVERSATION) {
        // Shift conversation (drop oldest)
        free(agent->conversation[0].content);
        for (int i = 0; i < agent->conversation_count - 1; i++) {
            agent->conversation[i] = agent->conversation[i + 1];
        }
        agent->conversation_count--;
    }

    ConversationMessage* msg = &agent->conversation[agent->conversation_count];
    strncpy(msg->role, role, 15);
    msg->content = strdup(content);
    agent->conversation_count++;
}

/**
 * Build conversation prompt
 */
char* agent_build_conversation(AutonomousAgent* agent) {
    char* conv = (char*)malloc(MAX_OUTPUT_SIZE);
    conv[0] = '\0';

    for (int i = 0; i < agent->conversation_count; i++) {
        char msg[MAX_INPUT_SIZE];
        snprintf(msg, sizeof(msg), "%s: %s\n\n",
                 agent->conversation[i].role, agent->conversation[i].content);
        strcat(conv, msg);
    }

    return conv;
}

/**
 * Extract JSON from text (handles markdown code blocks)
 */
char* extract_json(const char* text) {
    const char* start = strchr(text, '{');
    if (!start) return strdup(text);

    // Find matching closing brace
    int depth = 0;
    const char* end = start;
    while (*end) {
        if (*end == '{') depth++;
        else if (*end == '}') {
            depth--;
            if (depth == 0) break;
        }
        end++;
    }

    if (*end == '}') {
        size_t len = end - start + 1;
        char* json = (char*)malloc(len + 1);
        strncpy(json, start, len);
        json[len] = '\0';
        return json;
    }

    return strdup(text);
}

/**
 * Parse JSON field (simplified)
 */
char* json_get_string(const char* json, const char* field) {
    char pattern[128];
    snprintf(pattern, sizeof(pattern), "\"%s\"", field);

    const char* start = strstr(json, pattern);
    if (!start) return NULL;

    start = strchr(start + strlen(pattern), '"');
    if (!start) return NULL;
    start++;

    const char* end = start;
    while (*end && *end != '"') {
        if (*end == '\\' && *(end + 1)) end++;  // Skip escaped chars
        end++;
    }

    size_t len = end - start;
    char* value = (char*)malloc(len + 1);
    strncpy(value, start, len);
    value[len] = '\0';

    return value;
}

/**
 * Process agent response
 */
void agent_process_response(AutonomousAgent* agent, const char* response) {
    char* json = extract_json(response);

    // Extract fields
    char* thought = json_get_string(json, "thought");
    char* action = json_get_string(json, "action");
    char* result_str = json_get_string(json, "result");

    // Record thought
    if (thought) {
        if (agent->state.history_count < MAX_HISTORY) {
            ActionRecord* record = &agent->state.history[agent->state.history_count];
            record->step = agent->state.total_steps;
            strcpy(record->action_type, "thought");
            record->thought = strdup(thought);
            agent->state.history_count++;
        }
    }

    // Check if complete
    if (action && strcasecmp(action, "complete") == 0) {
        agent->state.is_complete = true;
        agent->state.final_result = result_str ? strdup(result_str) : strdup(response);
        free(json);
        free(thought);
        free(action);
        if (result_str) free(result_str);
        return;
    }

    // Try to execute tool
    if (action) {
        AgentTool* tool = agent_find_tool(agent, action);
        if (tool) {
            agent->state.tool_calls++;

            // Extract args (simplified - just pass the whole json)
            char* tool_result = tool->handler(json, tool->user_data);

            // Record tool call
            if (agent->state.history_count < MAX_HISTORY) {
                ActionRecord* record = &agent->state.history[agent->state.history_count];
                record->step = agent->state.total_steps;
                strcpy(record->action_type, "tool_call");
                strncpy(record->tool_name, action, MAX_NAME_SIZE - 1);
                record->tool_args = strdup(json);
                record->tool_result = tool_result ? strdup(tool_result) : NULL;
                agent->state.history_count++;
            }

            // Add to conversation
            agent_add_message(agent, "assistant", response);

            char tool_msg[MAX_INPUT_SIZE];
            snprintf(tool_msg, sizeof(tool_msg), "Tool result: %s",
                     tool_result ? tool_result : "No result");
            agent_add_message(agent, "user", tool_msg);

            free(tool_result);
        } else {
            // Unknown action
            agent_add_message(agent, "assistant", response);

            char unknown_msg[512];
            char tool_list[256];
            tool_list[0] = '\0';
            for (int i = 0; i < agent->tool_count; i++) {
                if (i > 0) strcat(tool_list, ", ");
                strcat(tool_list, agent->tools[i].name);
            }
            snprintf(unknown_msg, sizeof(unknown_msg),
                     "Unknown action: %s. Available tools: %s", action, tool_list);
            agent_add_message(agent, "user", unknown_msg);
        }
    } else {
        // Non-JSON response
        agent_add_message(agent, "assistant", response);
        agent_add_message(agent, "user",
            "Please respond with a JSON action or mark the task as complete.");

        // Record as text response
        if (agent->state.history_count < MAX_HISTORY) {
            ActionRecord* record = &agent->state.history[agent->state.history_count];
            record->step = agent->state.total_steps;
            strcpy(record->action_type, "text_response");
            size_t len = strlen(response);
            if (len > 200) len = 200;
            record->thought = (char*)malloc(len + 1);
            strncpy(record->thought, response, len);
            record->thought[len] = '\0';
            agent->state.history_count++;
        }
    }

    free(json);
    if (thought) free(thought);
    if (action) free(action);
    if (result_str) free(result_str);
}

/**
 * Custom stop condition function type
 */
typedef bool (*StopCondition)(const AgentState* state, void* user_data);

/**
 * Run the agent
 */
AgentResult* agent_run(AutonomousAgent* agent, const char* task, int max_steps) {
    return agent_run_with_stop(agent, task, max_steps, NULL, NULL);
}

/**
 * Run the agent with custom stop condition
 */
AgentResult* agent_run_with_stop(AutonomousAgent* agent, const char* task,
                                   int max_steps, StopCondition should_stop,
                                   void* stop_user_data) {
    // Reset state
    memset(&agent->state, 0, sizeof(AgentState));

    // Clear conversation
    for (int i = 0; i < agent->conversation_count; i++) {
        free(agent->conversation[i].content);
    }
    agent->conversation_count = 0;

    // Build system prompt
    char* system_prompt = agent_build_system_prompt(agent);

    // Add initial message
    char task_msg[MAX_INPUT_SIZE];
    snprintf(task_msg, sizeof(task_msg), "Task: %s", task);
    agent_add_message(agent, "user", task_msg);

    // Main loop
    while (agent->state.total_steps < max_steps && !agent->state.is_complete) {
        agent->state.total_steps++;

        // Check custom stop condition
        if (should_stop && should_stop(&agent->state, stop_user_data)) {
            break;
        }

        // Build conversation
        char* conv = agent_build_conversation(agent);

        // Get next action
        char* response = call_anthropic_api(agent->api_key, agent->model,
                                            conv, system_prompt, 2048);

        free(conv);

        // Process response
        agent_process_response(agent, response);
        free(response);

        // Mock: Complete after a few steps for demonstration
        if (agent->state.total_steps >= 3 && !agent->state.is_complete) {
            agent->state.is_complete = true;
            agent->state.final_result = strdup("Task completed after gathering information.");
        }
    }

    free(system_prompt);

    // Build result
    AgentResult* result = (AgentResult*)calloc(1, sizeof(AgentResult));
    result->success = agent->state.is_complete;
    result->final_result = agent->state.final_result
        ? strdup(agent->state.final_result)
        : strdup("Task not completed within step limit");
    result->total_steps = agent->state.total_steps;
    result->tool_calls = agent->state.tool_calls;

    // Copy history
    result->history_count = agent->state.history_count;
    result->history = (ActionRecord*)calloc(result->history_count, sizeof(ActionRecord));
    for (int i = 0; i < result->history_count; i++) {
        result->history[i] = agent->state.history[i];
        // Note: shallow copy - strings point to agent's data
    }

    return result;
}

/**
 * Free agent result
 */
void agent_result_free(AgentResult* result) {
    free(result->final_result);
    // Note: history strings are owned by agent, don't free them here
    free(result->history);
    free(result);
}

/**
 * Free agent
 */
void agent_free(AutonomousAgent* agent) {
    free(agent->api_key);
    free(agent->model);

    // Free conversation
    for (int i = 0; i < agent->conversation_count; i++) {
        free(agent->conversation[i].content);
    }

    // Free history
    for (int i = 0; i < agent->state.history_count; i++) {
        free(agent->state.history[i].tool_args);
        free(agent->state.history[i].tool_result);
        free(agent->state.history[i].thought);
    }

    if (agent->state.final_result) {
        free(agent->state.final_result);
    }

    free(agent);
}

// Example tool handlers

char* search_handler(const char* args_json, void* user_data) {
    char* query = json_get_string(args_json, "query");
    char* result = (char*)malloc(512);

    snprintf(result, 512,
        "Search results for '%s':\n"
        "1. Information about %s\n"
        "2. Related topic to %s\n"
        "3. More details on %s",
        query ? query : "unknown",
        query ? query : "unknown",
        query ? query : "unknown",
        query ? query : "unknown");

    if (query) free(query);
    return result;
}

char* read_url_handler(const char* args_json, void* user_data) {
    char* url = json_get_string(args_json, "url");
    char* result = (char*)malloc(256);

    snprintf(result, 256, "Content from %s: [Mock content about the topic]",
             url ? url : "unknown");

    if (url) free(url);
    return result;
}

char* save_note_handler(const char* args_json, void* user_data) {
    char* title = json_get_string(args_json, "title");
    char* result = (char*)malloc(128);

    snprintf(result, 128, "Note saved: %s", title ? title : "Untitled");

    if (title) free(title);
    return result;
}

int main() {
    const char* api_key = getenv("ANTHROPIC_API_KEY");
    if (!api_key) {
        fprintf(stderr, "ANTHROPIC_API_KEY environment variable not set\n");
        return 1;
    }

    printf("=== Autonomous Agent ===\n\n");

    // Create agent
    AutonomousAgent* agent = agent_create(api_key, NULL);

    // Register tools
    agent_register_tool(agent, "search",
        "Search for information on a topic", search_handler, NULL);
    agent_add_tool_param(agent, "query", "string", "Search query", true);

    agent_register_tool(agent, "read_url",
        "Read content from a URL", read_url_handler, NULL);
    agent_add_tool_param(agent, "url", "string", "URL to read", true);

    agent_register_tool(agent, "save_note",
        "Save a note for later reference", save_note_handler, NULL);
    agent_add_tool_param(agent, "title", "string", "Note title", true);
    agent_add_tool_param(agent, "content", "string", "Note content", true);

    // Run agent
    AgentResult* result = agent_run(agent,
        "Research the current state of quantum computing", 10);

    // Print results
    printf("\nSuccess: %s\n", result->success ? "yes" : "no");
    printf("Steps: %d\n", result->total_steps);
    printf("Tool Calls: %d\n", result->tool_calls);

    printf("\nAction History:\n");
    for (int i = 0; i < result->history_count; i++) {
        ActionRecord* record = &result->history[i];
        printf("  Step %d [%s]:", record->step, record->action_type);

        if (strcmp(record->action_type, "tool_call") == 0) {
            printf(" %s\n", record->tool_name);
            if (record->tool_result) {
                printf("    Result: %.50s...\n", record->tool_result);
            }
        } else if (record->thought) {
            printf(" %.50s...\n", record->thought);
        } else {
            printf("\n");
        }
    }

    printf("\nFinal Result:\n%s\n", result->final_result);

    // Cleanup
    agent_result_free(result);
    agent_free(agent);

    return 0;
}
