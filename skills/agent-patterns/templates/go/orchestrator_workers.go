/*
 * Orchestrator-Workers Pattern Implementation for Go
 * Central LLM dynamically breaks down tasks and delegates to workers
 */

package agentpatterns

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
)

// Subtask represents a subtask created by the orchestrator
type OrchestratorSubtask struct {
	ID           string   `json:"id"`
	Description  string   `json:"description"`
	WorkerType   string   `json:"worker_type"`
	Dependencies []string `json:"dependencies"`
}

// WorkerResult represents the result from a worker
type WorkerResult struct {
	SubtaskID string
	Result    string
	Success   bool
	Error     string
}

// Worker interface for specialized task execution
type Worker interface {
	WorkerType() string
	Execute(ctx context.Context, subtask *OrchestratorSubtask, depResults map[string]string) (string, error)
}

// LLMWorker is an LLM-based worker
type LLMWorker struct {
	client       *AnthropicClient
	workerType   string
	systemPrompt string
	model        string
}

// NewLLMWorker creates a new LLM worker
func NewLLMWorker(client *AnthropicClient, workerType, systemPrompt, model string) *LLMWorker {
	return &LLMWorker{
		client:       client,
		workerType:   workerType,
		systemPrompt: systemPrompt,
		model:        model,
	}
}

// WorkerType returns the worker type
func (w *LLMWorker) WorkerType() string {
	return w.workerType
}

// Execute executes the subtask
func (w *LLMWorker) Execute(ctx context.Context, subtask *OrchestratorSubtask, depResults map[string]string) (string, error) {
	var contextInfo string
	if len(depResults) > 0 {
		var parts []string
		for k, v := range depResults {
			parts = append(parts, fmt.Sprintf("[%s]: %s", k, v))
		}
		contextInfo = "\n\nContext from previous tasks:\n" + strings.Join(parts, "\n")
	}

	prompt := fmt.Sprintf("%s\n\nTask: %s%s\n\nProvide your result:", w.systemPrompt, subtask.Description, contextInfo)

	return w.client.CreateMessage(ctx, prompt, w.model, 4096)
}

// Orchestrator decomposes tasks and coordinates workers.
//
// Example:
//
//	orch := NewOrchestrator(client, "claude-sonnet-4-20250514")
//	orch.RegisterWorker(NewLLMWorker(client, "researcher", "You research topics", model))
//	result, err := orch.Execute(ctx, "Write an article about AI")
type Orchestrator struct {
	client  *AnthropicClient
	model   string
	workers map[string]Worker
}

// NewOrchestrator creates a new Orchestrator
func NewOrchestrator(client *AnthropicClient, model string) *Orchestrator {
	return &Orchestrator{
		client:  client,
		model:   model,
		workers: make(map[string]Worker),
	}
}

// RegisterWorker registers a worker
func (o *Orchestrator) RegisterWorker(worker Worker) *Orchestrator {
	o.workers[worker.WorkerType()] = worker
	return o
}

// OrchestratorResult represents the result of orchestration
type OrchestratorResult struct {
	FinalResult   string
	Subtasks      []OrchestratorSubtask
	WorkerResults []WorkerResult
}

// Execute executes a complex task by decomposing and delegating
func (o *Orchestrator) Execute(ctx context.Context, task string) (*OrchestratorResult, error) {
	// Step 1: Decompose the task
	subtasks, err := o.decomposeTask(ctx, task)
	if err != nil {
		return nil, fmt.Errorf("failed to decompose task: %w", err)
	}

	// Step 2: Execute subtasks respecting dependencies
	results := make(map[string]string)
	var workerResults []WorkerResult

	sortedSubtasks, err := o.topologicalSort(subtasks)
	if err != nil {
		return nil, err
	}

	for _, subtask := range sortedSubtasks {
		// Gather dependency results
		depResults := make(map[string]string)
		for _, dep := range subtask.Dependencies {
			if result, exists := results[dep]; exists {
				depResults[dep] = result
			}
		}

		// Find appropriate worker
		worker, exists := o.workers[subtask.WorkerType]
		if !exists {
			// Use default LLM worker
			worker = NewLLMWorker(
				o.client,
				subtask.WorkerType,
				fmt.Sprintf("You are a %s specialist.", subtask.WorkerType),
				o.model,
			)
		}

		result, err := worker.Execute(ctx, &subtask, depResults)
		if err != nil {
			workerResults = append(workerResults, WorkerResult{
				SubtaskID: subtask.ID,
				Success:   false,
				Error:     err.Error(),
			})
		} else {
			results[subtask.ID] = result
			workerResults = append(workerResults, WorkerResult{
				SubtaskID: subtask.ID,
				Result:    result,
				Success:   true,
			})
		}
	}

	// Step 3: Synthesize final result
	finalResult, err := o.synthesizeResults(ctx, task, results)
	if err != nil {
		return nil, err
	}

	return &OrchestratorResult{
		FinalResult:   finalResult,
		Subtasks:      subtasks,
		WorkerResults: workerResults,
	}, nil
}

func (o *Orchestrator) decomposeTask(ctx context.Context, task string) ([]OrchestratorSubtask, error) {
	var workerTypes []string
	for wt := range o.workers {
		workerTypes = append(workerTypes, wt)
	}

	prompt := fmt.Sprintf(`Break down this task into subtasks that can be delegated to specialized workers.

Task: %s

Available worker types: %s

Respond with JSON array of subtasks:
[
  {
    "id": "subtask_1",
    "description": "What needs to be done",
    "worker_type": "worker_type",
    "dependencies": []
  },
  {
    "id": "subtask_2",
    "description": "Another task",
    "worker_type": "worker_type",
    "dependencies": ["subtask_1"]
  }
]

Only include the JSON array, no other text.`, task, strings.Join(workerTypes, ", "))

	response, err := o.client.CreateMessage(ctx, prompt, o.model, 2048)
	if err != nil {
		return nil, err
	}

	// Clean up JSON
	jsonStr := response
	if strings.Contains(response, "```") {
		lines := strings.Split(response, "\n")
		var jsonLines []string
		inJSON := false
		for _, line := range lines {
			if strings.HasPrefix(line, "[") {
				inJSON = true
			}
			if inJSON {
				if strings.HasPrefix(line, "```") {
					break
				}
				jsonLines = append(jsonLines, line)
			}
		}
		jsonStr = strings.Join(jsonLines, "\n")
	}

	var subtasks []OrchestratorSubtask
	if err := json.Unmarshal([]byte(jsonStr), &subtasks); err != nil {
		// Fallback: create a single subtask
		workerType := "general"
		if len(workerTypes) > 0 {
			workerType = workerTypes[0]
		}
		return []OrchestratorSubtask{{
			ID:           "main",
			Description:  task,
			WorkerType:   workerType,
			Dependencies: []string{},
		}}, nil
	}

	return subtasks, nil
}

func (o *Orchestrator) synthesizeResults(ctx context.Context, originalTask string, results map[string]string) (string, error) {
	var resultParts []string
	for k, v := range results {
		resultParts = append(resultParts, fmt.Sprintf("### %s\n%s", k, v))
	}

	prompt := fmt.Sprintf(`Synthesize these subtask results into a cohesive final result.

Original Task: %s

Subtask Results:
%s

Provide a well-organized final result that addresses the original task:`, originalTask, strings.Join(resultParts, "\n\n"))

	return o.client.CreateMessage(ctx, prompt, o.model, 4096)
}

func (o *Orchestrator) topologicalSort(subtasks []OrchestratorSubtask) ([]OrchestratorSubtask, error) {
	taskMap := make(map[string]*OrchestratorSubtask)
	for i := range subtasks {
		taskMap[subtasks[i].ID] = &subtasks[i]
	}

	visited := make(map[string]bool)
	visiting := make(map[string]bool)
	var result []OrchestratorSubtask

	var visit func(id string) error
	visit = func(id string) error {
		if visited[id] {
			return nil
		}
		if visiting[id] {
			return fmt.Errorf("circular dependency detected: %s", id)
		}

		visiting[id] = true

		if task, exists := taskMap[id]; exists {
			for _, dep := range task.Dependencies {
				if err := visit(dep); err != nil {
					return err
				}
			}
			result = append(result, *task)
		}

		delete(visiting, id)
		visited[id] = true
		return nil
	}

	for _, subtask := range subtasks {
		if err := visit(subtask.ID); err != nil {
			return nil, err
		}
	}

	return result, nil
}

// ExampleResearchArticle demonstrates the orchestrator-workers pattern
func ExampleResearchArticle() error {
	apiKey := getEnv("ANTHROPIC_API_KEY", "")
	if apiKey == "" {
		return fmt.Errorf("ANTHROPIC_API_KEY environment variable not set")
	}

	client := &AnthropicClient{
		APIKey:     apiKey,
		HTTPClient: nil, // Would use http.Client in production
	}

	orchestrator := NewOrchestrator(client, "claude-sonnet-4-20250514")

	// Register specialized workers
	orchestrator.
		RegisterWorker(NewLLMWorker(
			client,
			"researcher",
			"You are a research specialist. Gather facts, statistics, and key information.",
			"claude-sonnet-4-20250514",
		)).
		RegisterWorker(NewLLMWorker(
			client,
			"writer",
			"You are a skilled writer. Create engaging, well-structured content.",
			"claude-sonnet-4-20250514",
		)).
		RegisterWorker(NewLLMWorker(
			client,
			"editor",
			"You are an editor. Review and improve content for clarity and accuracy.",
			"claude-sonnet-4-20250514",
		))

	ctx := context.Background()
	result, err := orchestrator.Execute(ctx, "Write a comprehensive article about the impact of AI on healthcare")
	if err != nil {
		return err
	}

	fmt.Println("=== Orchestrator Results ===")
	fmt.Printf("\nSubtasks created: %d\n", len(result.Subtasks))
	for _, subtask := range result.Subtasks {
		fmt.Printf("  - [%s] %s\n", subtask.WorkerType, subtask.Description)
	}

	fmt.Printf("\n=== Final Result ===\n%s\n", result.FinalResult)

	return nil
}
