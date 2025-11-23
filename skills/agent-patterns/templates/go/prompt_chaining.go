/*
 * Prompt Chaining Pattern Implementation for Go
 * Sequential LLM calls with programmatic checkpoints
 */

package agentpatterns

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// AnthropicClient represents a client for the Anthropic API
type AnthropicClient struct {
	APIKey     string
	HTTPClient *http.Client
}

// MessageRequest represents a request to the Anthropic API
type MessageRequest struct {
	Model      string          `json:"model"`
	MaxTokens  int             `json:"max_tokens"`
	Messages   []MessageItem   `json:"messages"`
}

// MessageItem represents a message in the conversation
type MessageItem struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// MessageResponse represents a response from the Anthropic API
type MessageResponse struct {
	Content []ContentBlock `json:"content"`
}

// ContentBlock represents a content block in the response
type ContentBlock struct {
	Type string `json:"type"`
	Text string `json:"text,omitempty"`
}

// CreateMessage sends a message to the Anthropic API
func (c *AnthropicClient) CreateMessage(ctx context.Context, prompt, model string) (string, error) {
	reqBody := MessageRequest{
		Model:     model,
		MaxTokens: 4096,
		Messages: []MessageItem{
			{Role: "user", Content: prompt},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("x-api-key", c.APIKey)
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("content-type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	var msgResp MessageResponse
	if err := json.NewDecoder(resp.Body).Decode(&msgResp); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	for _, block := range msgResp.Content {
		if block.Type == "text" {
			return block.Text, nil
		}
	}

	return "", fmt.Errorf("no text content in response")
}

// ValidatorFunc validates the output of a step
type ValidatorFunc func(output string) bool

// ProcessorFunc processes the output of a step
type ProcessorFunc func(output string) interface{}

// PromptTemplateFunc generates a prompt from the current context
type PromptTemplateFunc func(context map[string]interface{}) string

// ChainStep represents a single step in the prompt chain
type ChainStep struct {
	Name           string
	PromptTemplate PromptTemplateFunc
	Validator      ValidatorFunc
	Processor      ProcessorFunc
}

// ChainHistory represents the execution history of a step
type ChainHistory struct {
	Step    string
	Prompt  string
	Output  string
	Context map[string]interface{}
}

// PromptChain executes a sequence of LLM calls with validation and processing between steps.
//
// Example:
//
//	chain := NewPromptChain(client, "claude-3-5-sonnet-20241022")
//	chain.AddStep(ChainStep{
//	    Name: "outline",
//	    PromptTemplate: func(ctx map[string]interface{}) string {
//	        return fmt.Sprintf("Create an outline for: %v", ctx["topic"])
//	    },
//	    Validator: func(output string) bool {
//	        return strings.Contains(output, "1.") && strings.Contains(output, "2.")
//	    },
//	})
//	result, err := chain.Execute(ctx, map[string]interface{}{"topic": "AI Safety"})
type PromptChain struct {
	client  *AnthropicClient
	model   string
	steps   []ChainStep
	history []ChainHistory
}

// NewPromptChain creates a new prompt chain
func NewPromptChain(client *AnthropicClient, model string) *PromptChain {
	return &PromptChain{
		client:  client,
		model:   model,
		steps:   make([]ChainStep, 0),
		history: make([]ChainHistory, 0),
	}
}

// AddStep adds a step to the chain (builder pattern)
func (pc *PromptChain) AddStep(step ChainStep) *PromptChain {
	pc.steps = append(pc.steps, step)
	return pc
}

// Execute runs the chain with the initial context
func (pc *PromptChain) Execute(ctx context.Context, initialContext map[string]interface{}) (string, error) {
	// Copy initial context
	context := make(map[string]interface{})
	for k, v := range initialContext {
		context[k] = v
	}

	var currentOutput string

	for _, step := range pc.steps {
		// Format prompt with current context
		prompt := step.PromptTemplate(context)

		// Call LLM
		output, err := pc.client.CreateMessage(ctx, prompt, pc.model)
		if err != nil {
			return "", fmt.Errorf("step '%s' failed: %w", step.Name, err)
		}
		currentOutput = output

		// Validate if validator provided
		if step.Validator != nil && !step.Validator(currentOutput) {
			preview := currentOutput
			if len(preview) > 100 {
				preview = preview[:100]
			}
			return "", fmt.Errorf("step '%s' validation failed. Output: %s", step.Name, preview)
		}

		// Process if processor provided
		if step.Processor != nil {
			processed := step.Processor(currentOutput)
			context[step.Name] = processed
		} else {
			context[step.Name] = currentOutput
		}

		// Track history
		contextCopy := make(map[string]interface{})
		for k, v := range context {
			contextCopy[k] = v
		}
		pc.history = append(pc.history, ChainHistory{
			Step:    step.Name,
			Prompt:  prompt,
			Output:  currentOutput,
			Context: contextCopy,
		})
	}

	return currentOutput, nil
}

// History returns the execution history
func (pc *PromptChain) History() []ChainHistory {
	return pc.history
}

// Example usage
func ExampleDocumentGeneration() error {
	apiKey := getEnv("ANTHROPIC_API_KEY", "")
	if apiKey == "" {
		return fmt.Errorf("ANTHROPIC_API_KEY environment variable not set")
	}

	client := &AnthropicClient{
		APIKey:     apiKey,
		HTTPClient: &http.Client{},
	}

	chain := NewPromptChain(client, "claude-3-5-sonnet-20241022")

	// Step 1: Generate outline
	chain.AddStep(ChainStep{
		Name: "outline",
		PromptTemplate: func(ctx map[string]interface{}) string {
			return fmt.Sprintf("Create a detailed outline for an article about: %v", ctx["topic"])
		},
		Validator: func(output string) bool {
			return strings.Contains(output, "1.") && strings.Contains(output, "2.")
		},
	})

	// Step 2: Expand outline
	chain.AddStep(ChainStep{
		Name: "draft",
		PromptTemplate: func(ctx map[string]interface{}) string {
			return fmt.Sprintf(`Expand this outline into a full article:
%v

Write in a professional tone with clear examples.`, ctx["outline"])
		},
		Validator: func(output string) bool {
			return len(strings.Fields(output)) > 200
		},
	})

	// Step 3: Proofread
	chain.AddStep(ChainStep{
		Name: "final",
		PromptTemplate: func(ctx map[string]interface{}) string {
			return fmt.Sprintf(`Proofread and polish this article:
%v

Fix any grammar, improve clarity, and ensure consistent tone.`, ctx["draft"])
		},
	})

	result, err := chain.Execute(context.Background(), map[string]interface{}{
		"topic": "Building Effective AI Agents",
	})
	if err != nil {
		return err
	}

	fmt.Println("Final Article:")
	fmt.Println(result)

	fmt.Println("\n\nExecution History:")
	for _, entry := range chain.History() {
		fmt.Printf("\nStep: %s\n", entry.Step)
		fmt.Printf("Output length: %d chars\n", len(entry.Output))
	}

	return nil
}

// Helper function to get environment variable with default
func getEnv(key, defaultValue string) string {
	value := /* os.Getenv(key) */ ""
	if value == "" {
		return defaultValue
	}
	return value
}
