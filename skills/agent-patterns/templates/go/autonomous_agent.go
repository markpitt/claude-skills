/*
 * Autonomous Agent Pattern Implementation for Go
 * Open-ended exploration with tool usage
 */

package agentpatterns

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
)

// ParameterDef defines a tool parameter
type ParameterDef struct {
	Type        string
	Description string
	Required    bool
}

// AgentTool represents a tool for the agent
type AgentTool struct {
	Name        string
	Description string
	Parameters  map[string]ParameterDef
	Handler     func(ctx context.Context, args map[string]interface{}) (string, error)
}

// ActionRecord represents an action in the history
type ActionRecord struct {
	Step       int
	ActionType string
	ToolName   string
	ToolArgs   map[string]interface{}
	ToolResult string
	Thought    string
}

// AgentState tracks the agent's state
type AgentState struct {
	TotalSteps    int
	ToolCalls     int
	ActionHistory []ActionRecord
	IsComplete    bool
	FinalResult   string
}

// AgentAction represents a parsed action from the LLM
type AgentAction struct {
	Thought string                 `json:"thought"`
	Action  string                 `json:"action"`
	Args    map[string]interface{} `json:"args"`
	Result  string                 `json:"result"`
}

// AutonomousAgent can explore and use tools to complete tasks.
//
// Example:
//
//	agent := NewAutonomousAgent(client, "claude-sonnet-4-20250514")
//	agent.RegisterTool(AgentTool{
//	    Name: "search",
//	    Description: "Search for information",
//	    Handler: searchHandler,
//	})
//	result, err := agent.Run(ctx, "Research AI safety", 10)
type AutonomousAgent struct {
	client              *AnthropicClient
	model               string
	tools               map[string]*AgentTool
	state               AgentState
	conversationHistory []MessageItem
}

// NewAutonomousAgent creates a new AutonomousAgent
func NewAutonomousAgent(client *AnthropicClient, model string) *AutonomousAgent {
	return &AutonomousAgent{
		client:              client,
		model:               model,
		tools:               make(map[string]*AgentTool),
		state:               AgentState{},
		conversationHistory: []MessageItem{},
	}
}

// RegisterTool registers a tool for the agent
func (a *AutonomousAgent) RegisterTool(tool AgentTool) *AutonomousAgent {
	a.tools[tool.Name] = &tool
	return a
}

// State returns the current agent state
func (a *AutonomousAgent) State() *AgentState {
	return &a.state
}

// AgentResult represents the result of running the agent
type AgentResult struct {
	Success       bool
	FinalResult   string
	TotalSteps    int
	ToolCalls     int
	ActionHistory []ActionRecord
}

// Run runs the agent on a task
func (a *AutonomousAgent) Run(ctx context.Context, task string, maxSteps int) (*AgentResult, error) {
	return a.RunWithStop(ctx, task, maxSteps, nil)
}

// RunWithStop runs the agent with a custom stopping condition
func (a *AutonomousAgent) RunWithStop(ctx context.Context, task string, maxSteps int, shouldStop func(*AgentState) bool) (*AgentResult, error) {
	// Reset state
	a.state = AgentState{}
	a.conversationHistory = []MessageItem{}

	// Build system prompt
	systemPrompt := a.buildSystemPrompt()

	// Add initial user message
	a.conversationHistory = append(a.conversationHistory, MessageItem{
		Role:    "user",
		Content: fmt.Sprintf("Task: %s", task),
	})

	for a.state.TotalSteps < maxSteps && !a.state.IsComplete {
		a.state.TotalSteps++

		// Check custom stopping condition
		if shouldStop != nil && shouldStop(&a.state) {
			break
		}

		// Get next action from LLM
		response, err := a.getNextAction(ctx, systemPrompt)
		if err != nil {
			return nil, fmt.Errorf("failed to get next action: %w", err)
		}

		// Process the response
		if err := a.processResponse(ctx, response); err != nil {
			return nil, err
		}
	}

	finalResult := a.state.FinalResult
	if finalResult == "" {
		finalResult = "Task not completed within step limit"
	}

	return &AgentResult{
		Success:       a.state.IsComplete,
		FinalResult:   finalResult,
		TotalSteps:    a.state.TotalSteps,
		ToolCalls:     a.state.ToolCalls,
		ActionHistory: a.state.ActionHistory,
	}, nil
}

func (a *AutonomousAgent) buildSystemPrompt() string {
	var toolDescriptions []string
	for _, tool := range a.tools {
		var params []string
		for name, param := range tool.Parameters {
			params = append(params, fmt.Sprintf("%s: %s (%s)", name, param.Type, param.Description))
		}
		toolDescriptions = append(toolDescriptions,
			fmt.Sprintf("- %s(%s): %s", tool.Name, strings.Join(params, ", "), tool.Description))
	}

	return fmt.Sprintf(`You are an autonomous agent that can use tools to complete tasks.

Available tools:
%s

To use a tool, respond with JSON in this format:
{
    "thought": "Your reasoning about what to do next",
    "action": "tool_name",
    "args": { "param": "value" }
}

When you have completed the task, respond with:
{
    "thought": "Task is complete because...",
    "action": "complete",
    "result": "Your final answer"
}

Always think step by step and use tools to gather information before providing a final answer.`,
		strings.Join(toolDescriptions, "\n"))
}

func (a *AutonomousAgent) getNextAction(ctx context.Context, systemPrompt string) (string, error) {
	// Build request with system prompt
	reqBody := struct {
		Model     string        `json:"model"`
		MaxTokens int           `json:"max_tokens"`
		Messages  []MessageItem `json:"messages"`
		System    string        `json:"system,omitempty"`
	}{
		Model:     a.model,
		MaxTokens: 2048,
		Messages:  a.conversationHistory,
		System:    systemPrompt,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	// This would use the actual HTTP client in production
	_ = jsonData
	return a.client.CreateMessage(ctx, a.conversationHistory[len(a.conversationHistory)-1].Content, a.model, 2048)
}

func (a *AutonomousAgent) processResponse(ctx context.Context, response string) error {
	// Try to parse as JSON action
	jsonStr := a.cleanJSON(response)

	var action AgentAction
	if err := json.Unmarshal([]byte(jsonStr), &action); err != nil {
		// Non-JSON response
		return a.handleTextResponse(response)
	}

	// Record the thought
	if action.Thought != "" {
		a.state.ActionHistory = append(a.state.ActionHistory, ActionRecord{
			Step:       a.state.TotalSteps,
			ActionType: "thought",
			Thought:    action.Thought,
		})
	}

	// Check if task is complete
	if strings.ToLower(action.Action) == "complete" {
		a.state.IsComplete = true
		a.state.FinalResult = action.Result
		if a.state.FinalResult == "" {
			a.state.FinalResult = response
		}
		return nil
	}

	// Execute tool
	if tool, exists := a.tools[action.Action]; exists {
		a.state.ToolCalls++

		args := action.Args
		if args == nil {
			args = make(map[string]interface{})
		}

		toolResult, err := tool.Handler(ctx, args)
		if err != nil {
			toolResult = fmt.Sprintf("Error: %s", err.Error())
		}

		// Record tool call
		a.state.ActionHistory = append(a.state.ActionHistory, ActionRecord{
			Step:       a.state.TotalSteps,
			ActionType: "tool_call",
			ToolName:   action.Action,
			ToolArgs:   args,
			ToolResult: toolResult,
		})

		// Add to conversation history
		a.conversationHistory = append(a.conversationHistory,
			MessageItem{Role: "assistant", Content: response},
			MessageItem{Role: "user", Content: fmt.Sprintf("Tool result: %s", toolResult)},
		)
	} else {
		// Unknown action
		var toolNames []string
		for name := range a.tools {
			toolNames = append(toolNames, name)
		}

		a.conversationHistory = append(a.conversationHistory,
			MessageItem{Role: "assistant", Content: response},
			MessageItem{Role: "user", Content: fmt.Sprintf("Unknown action: %s. Available tools: %s", action.Action, strings.Join(toolNames, ", "))},
		)
	}

	return nil
}

func (a *AutonomousAgent) handleTextResponse(response string) error {
	a.conversationHistory = append(a.conversationHistory,
		MessageItem{Role: "assistant", Content: response},
		MessageItem{Role: "user", Content: "Please respond with a JSON action or mark the task as complete."},
	)

	thought := response
	if len(thought) > 200 {
		thought = thought[:200]
	}

	a.state.ActionHistory = append(a.state.ActionHistory, ActionRecord{
		Step:       a.state.TotalSteps,
		ActionType: "text_response",
		Thought:    thought,
	})

	return nil
}

func (a *AutonomousAgent) cleanJSON(text string) string {
	if strings.Contains(text, "```") {
		start := strings.Index(text, "{")
		end := strings.LastIndex(text, "}")
		if start >= 0 && end > start {
			return text[start : end+1]
		}
	}
	return text
}

// ExampleResearchAgent demonstrates the autonomous agent pattern
func ExampleResearchAgent() error {
	apiKey := getEnv("ANTHROPIC_API_KEY", "")
	if apiKey == "" {
		return fmt.Errorf("ANTHROPIC_API_KEY environment variable not set")
	}

	client := &AnthropicClient{
		APIKey:     apiKey,
		HTTPClient: nil, // Would use http.Client in production
	}

	agent := NewAutonomousAgent(client, "claude-sonnet-4-20250514")

	// Register tools
	agent.RegisterTool(AgentTool{
		Name:        "search",
		Description: "Search for information on a topic",
		Parameters: map[string]ParameterDef{
			"query": {Type: "string", Description: "Search query", Required: true},
		},
		Handler: func(ctx context.Context, args map[string]interface{}) (string, error) {
			query, _ := args["query"].(string)
			// Mock search - use actual search API in production
			return fmt.Sprintf("Search results for '%s':\n1. Result about %s\n2. More info on %s", query, query, query), nil
		},
	})

	agent.RegisterTool(AgentTool{
		Name:        "read_url",
		Description: "Read content from a URL",
		Parameters: map[string]ParameterDef{
			"url": {Type: "string", Description: "URL to read", Required: true},
		},
		Handler: func(ctx context.Context, args map[string]interface{}) (string, error) {
			url, _ := args["url"].(string)
			return fmt.Sprintf("Content from %s: [Mock content about the topic]", url), nil
		},
	})

	agent.RegisterTool(AgentTool{
		Name:        "write_note",
		Description: "Save a note for later reference",
		Parameters: map[string]ParameterDef{
			"title":   {Type: "string", Description: "Note title", Required: true},
			"content": {Type: "string", Description: "Note content", Required: true},
		},
		Handler: func(ctx context.Context, args map[string]interface{}) (string, error) {
			title, _ := args["title"].(string)
			return fmt.Sprintf("Note saved: %s", title), nil
		},
	})

	ctx := context.Background()
	result, err := agent.Run(ctx, "Research the current state of quantum computing and summarize key developments", 8)
	if err != nil {
		return err
	}

	fmt.Println("=== Agent Results ===")
	fmt.Printf("Success: %v\n", result.Success)
	fmt.Printf("Steps: %d\n", result.TotalSteps)
	fmt.Printf("Tool Calls: %d\n", result.ToolCalls)

	fmt.Println("\n=== Action History ===")
	for _, action := range result.ActionHistory {
		name := action.Thought
		if action.ToolName != "" {
			name = action.ToolName
		}
		fmt.Printf("Step %d [%s]: %s\n", action.Step, action.ActionType, name)
		if action.ToolResult != "" {
			preview := action.ToolResult
			if len(preview) > 100 {
				preview = preview[:100] + "..."
			}
			fmt.Printf("  Result: %s\n", preview)
		}
	}

	fmt.Printf("\n=== Final Result ===\n%s\n", result.FinalResult)

	return nil
}
