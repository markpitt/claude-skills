/*
 * Routing Pattern Implementation for Go
 * Classifying inputs and directing to specialized handlers
 */

package agentpatterns

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
)

// AnthropicClient represents a client for the Anthropic API
type AnthropicClient struct {
	APIKey     string
	HTTPClient *http.Client
}

// MessageRequest represents a request to the Anthropic API
type MessageRequest struct {
	Model     string        `json:"model"`
	MaxTokens int           `json:"max_tokens"`
	Messages  []MessageItem `json:"messages"`
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
func (c *AnthropicClient) CreateMessage(ctx context.Context, prompt, model string, maxTokens int) (string, error) {
	reqBody := MessageRequest{
		Model:     model,
		MaxTokens: maxTokens,
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

// ClassificationResult represents the result of a classification
type ClassificationResult struct {
	Category   string  `json:"category"`
	Confidence float64 `json:"confidence"`
	Reasoning  string  `json:"reasoning"`
}

// Route defines a route with its handler
type Route[T any] struct {
	Category    string
	Description string
	Handler     func(ctx context.Context, input string) (T, error)
}

// Router classifies inputs and directs them to specialized handlers.
//
// Example:
//
//	router := NewRouter[string](client, "claude-sonnet-4-20250514")
//	router.AddRoute(Route[string]{
//	    Category: "technical",
//	    Description: "Technical issues",
//	    Handler: handleTechnical,
//	})
//	result, classification, err := router.Route(ctx, "My app crashed", 0.7)
type Router[T any] struct {
	client   *AnthropicClient
	model    string
	routes   map[string]Route[T]
	fallback func(ctx context.Context, input string) (T, error)
}

// NewRouter creates a new Router
func NewRouter[T any](client *AnthropicClient, model string) *Router[T] {
	return &Router[T]{
		client: client,
		model:  model,
		routes: make(map[string]Route[T]),
	}
}

// AddRoute adds a route with its handler
func (r *Router[T]) AddRoute(route Route[T]) *Router[T] {
	r.routes[route.Category] = route
	return r
}

// SetFallback sets the fallback handler
func (r *Router[T]) SetFallback(handler func(ctx context.Context, input string) (T, error)) *Router[T] {
	r.fallback = handler
	return r
}

// Route classifies input and routes to appropriate handler
func (r *Router[T]) Route(ctx context.Context, input string, confidenceThreshold float64) (T, *ClassificationResult, error) {
	var zero T

	classification, err := r.Classify(ctx, input)
	if err != nil {
		return zero, nil, fmt.Errorf("classification failed: %w", err)
	}

	if classification.Confidence < confidenceThreshold {
		if r.fallback != nil {
			result, err := r.fallback(ctx, input)
			return result, classification, err
		}
		return zero, classification, fmt.Errorf("low confidence (%.2f) and no fallback handler set", classification.Confidence)
	}

	route, exists := r.routes[classification.Category]
	if !exists {
		if r.fallback != nil {
			result, err := r.fallback(ctx, input)
			return result, classification, err
		}
		return zero, classification, fmt.Errorf("no handler for category: %s", classification.Category)
	}

	result, err := route.Handler(ctx, input)
	return result, classification, err
}

// Classify classifies input into a category
func (r *Router[T]) Classify(ctx context.Context, input string) (*ClassificationResult, error) {
	var categories []string
	for _, route := range r.routes {
		categories = append(categories, fmt.Sprintf("- %s: %s", route.Category, route.Description))
	}

	prompt := fmt.Sprintf(`Classify the following input into one of these categories:
%s

Input: %s

Respond with JSON in this exact format:
{
    "category": "<category_name>",
    "confidence": <0.0-1.0>,
    "reasoning": "<brief explanation>"
}`, strings.Join(categories, "\n"), input)

	response, err := r.client.CreateMessage(ctx, prompt, r.model, 256)
	if err != nil {
		return nil, err
	}

	return parseClassificationJSON(response)
}

func parseClassificationJSON(jsonStr string) (*ClassificationResult, error) {
	result := &ClassificationResult{
		Confidence: 0.5,
	}

	// Extract category
	categoryRe := regexp.MustCompile(`"category"\s*:\s*"([^"]*)"`)
	if match := categoryRe.FindStringSubmatch(jsonStr); len(match) > 1 {
		result.Category = match[1]
	}

	// Extract confidence
	confidenceRe := regexp.MustCompile(`"confidence"\s*:\s*([0-9.]+)`)
	if match := confidenceRe.FindStringSubmatch(jsonStr); len(match) > 1 {
		if conf, err := strconv.ParseFloat(match[1], 64); err == nil {
			result.Confidence = conf
		}
	}

	// Extract reasoning
	reasoningRe := regexp.MustCompile(`"reasoning"\s*:\s*"([^"]*)"`)
	if match := reasoningRe.FindStringSubmatch(jsonStr); len(match) > 1 {
		result.Reasoning = match[1]
	}

	return result, nil
}

// Complexity represents task complexity levels
type Complexity int

const (
	ComplexitySimple Complexity = iota
	ComplexityModerate
	ComplexityComplex
)

func (c Complexity) String() string {
	switch c {
	case ComplexitySimple:
		return "Simple"
	case ComplexityModerate:
		return "Moderate"
	case ComplexityComplex:
		return "Complex"
	default:
		return "Unknown"
	}
}

// ModelRouter routes to appropriate model based on task complexity
type ModelRouter struct {
	client              *AnthropicClient
	classificationModel string
}

// NewModelRouter creates a new ModelRouter
func NewModelRouter(client *AnthropicClient, classificationModel string) *ModelRouter {
	return &ModelRouter{
		client:              client,
		classificationModel: classificationModel,
	}
}

// RouteByComplexity routes to appropriate model based on task complexity
func (r *ModelRouter) RouteByComplexity(ctx context.Context, input string) (string, error) {
	complexity, err := r.AssessComplexity(ctx, input)
	if err != nil {
		return "", err
	}

	var model string
	switch complexity {
	case ComplexitySimple:
		model = "claude-3-haiku-20240307"
	case ComplexityModerate:
		model = "claude-sonnet-4-20250514"
	case ComplexityComplex:
		model = "claude-opus-4-20250514"
	default:
		model = "claude-sonnet-4-20250514"
	}

	return r.client.CreateMessage(ctx, input, model, 4096)
}

// AssessComplexity assesses the complexity of a task
func (r *ModelRouter) AssessComplexity(ctx context.Context, input string) (Complexity, error) {
	prompt := fmt.Sprintf(`Assess the complexity of this task on a scale:
- Simple: Factual lookup, simple formatting, basic questions
- Moderate: Analysis, summarization, code review
- Complex: Multi-step reasoning, creative writing, complex coding

Task: %s

Respond with just one word: Simple, Moderate, or Complex`, input)

	response, err := r.client.CreateMessage(ctx, prompt, r.classificationModel, 10)
	if err != nil {
		return ComplexityModerate, err
	}

	switch strings.ToLower(strings.TrimSpace(response)) {
	case "simple":
		return ComplexitySimple, nil
	case "complex":
		return ComplexityComplex, nil
	default:
		return ComplexityModerate, nil
	}
}

// Example usage
func ExampleCustomerServiceRouting() error {
	apiKey := getEnv("ANTHROPIC_API_KEY", "")
	if apiKey == "" {
		return fmt.Errorf("ANTHROPIC_API_KEY environment variable not set")
	}

	client := &AnthropicClient{
		APIKey:     apiKey,
		HTTPClient: &http.Client{},
	}

	router := NewRouter[string](client, "claude-sonnet-4-20250514")

	// Add routes
	router.AddRoute(Route[string]{
		Category:    "technical",
		Description: "Technical issues, bugs, errors",
		Handler: func(ctx context.Context, input string) (string, error) {
			prompt := fmt.Sprintf("You are a technical support specialist. Help with: %s", input)
			return client.CreateMessage(ctx, prompt, "claude-sonnet-4-20250514", 1024)
		},
	})

	router.AddRoute(Route[string]{
		Category:    "billing",
		Description: "Billing, payments, subscriptions",
		Handler: func(ctx context.Context, input string) (string, error) {
			prompt := fmt.Sprintf("You are a billing support specialist. Help with: %s", input)
			return client.CreateMessage(ctx, prompt, "claude-sonnet-4-20250514", 1024)
		},
	})

	router.AddRoute(Route[string]{
		Category:    "general",
		Description: "General inquiries, information requests",
		Handler: func(ctx context.Context, input string) (string, error) {
			prompt := fmt.Sprintf("Help the user with: %s", input)
			return client.CreateMessage(ctx, prompt, "claude-3-haiku-20240307", 1024)
		},
	})

	// Set fallback
	router.SetFallback(func(ctx context.Context, input string) (string, error) {
		return client.CreateMessage(ctx, input, "claude-sonnet-4-20250514", 1024)
	})

	// Route a request
	ctx := context.Background()
	result, classification, err := router.Route(ctx, "My card was charged twice", 0.7)
	if err != nil {
		return err
	}

	fmt.Printf("Category: %s\n", classification.Category)
	fmt.Printf("Confidence: %.2f\n", classification.Confidence)
	fmt.Printf("Response: %s\n", result)

	return nil
}

// Helper function to get environment variable with default
func getEnv(key, defaultValue string) string {
	// Implementation would use os.Getenv in production
	return defaultValue
}
