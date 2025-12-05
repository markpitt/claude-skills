/*
 * Evaluator-Optimizer Pattern Implementation for Go
 * Iterative refinement with generator and evaluator loop
 */

package agentpatterns

import (
	"context"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// EvaluationCriterion represents an evaluation criterion with weight
type EvaluationCriterion struct {
	Name        string
	Description string
	Weight      float64
}

// EvaluationResult represents the result of an evaluation
type EvaluationResult struct {
	OverallScore   float64
	CriteriaScores map[string]float64
	Feedback       string
	Suggestions    []string
}

// IterationRecord represents a record of an iteration
type IterationRecord struct {
	Iteration  int
	Output     string
	Evaluation *EvaluationResult
}

// EvaluatorOptimizer iteratively refines output.
//
// Example:
//
//	optimizer := NewEvaluatorOptimizer(client, "claude-sonnet-4-20250514")
//	optimizer.AddCriterion(EvaluationCriterion{Name: "clarity", Description: "Clear writing", Weight: 1.5})
//	result, err := optimizer.Optimize(ctx, "Write a blog post about AI", 3, 0.85)
type EvaluatorOptimizer struct {
	client         *AnthropicClient
	generatorModel string
	evaluatorModel string
	criteria       []EvaluationCriterion
	history        []IterationRecord
}

// NewEvaluatorOptimizer creates a new EvaluatorOptimizer
func NewEvaluatorOptimizer(client *AnthropicClient, model string) *EvaluatorOptimizer {
	return &EvaluatorOptimizer{
		client:         client,
		generatorModel: model,
		evaluatorModel: model,
		criteria:       []EvaluationCriterion{},
		history:        []IterationRecord{},
	}
}

// WithEvaluatorModel sets a different model for evaluation
func (e *EvaluatorOptimizer) WithEvaluatorModel(model string) *EvaluatorOptimizer {
	e.evaluatorModel = model
	return e
}

// AddCriterion adds an evaluation criterion
func (e *EvaluatorOptimizer) AddCriterion(criterion EvaluationCriterion) *EvaluatorOptimizer {
	e.criteria = append(e.criteria, criterion)
	return e
}

// History returns the iteration history
func (e *EvaluatorOptimizer) History() []IterationRecord {
	return e.history
}

// OptimizationResult represents the result of optimization
type OptimizationResult struct {
	FinalOutput  string
	FinalScore   float64
	Iterations   int
	MetThreshold bool
	History      []IterationRecord
}

// Optimize optimizes output through iterative refinement
func (e *EvaluatorOptimizer) Optimize(ctx context.Context, task string, maxIterations int, scoreThreshold float64) (*OptimizationResult, error) {
	e.history = []IterationRecord{}
	currentOutput := ""
	var lastEvaluation *EvaluationResult

	for i := 0; i < maxIterations; i++ {
		// Generate (or refine) output
		output, err := e.generate(ctx, task, currentOutput, lastEvaluation)
		if err != nil {
			return nil, fmt.Errorf("generation failed: %w", err)
		}
		currentOutput = output

		// Evaluate output
		evaluation, err := e.evaluate(ctx, currentOutput)
		if err != nil {
			return nil, fmt.Errorf("evaluation failed: %w", err)
		}

		// Record iteration
		e.history = append(e.history, IterationRecord{
			Iteration:  i + 1,
			Output:     currentOutput,
			Evaluation: evaluation,
		})

		// Check if we've met the threshold
		if evaluation.OverallScore >= scoreThreshold {
			return &OptimizationResult{
				FinalOutput:  currentOutput,
				FinalScore:   evaluation.OverallScore,
				Iterations:   i + 1,
				MetThreshold: true,
				History:      e.history,
			}, nil
		}

		lastEvaluation = evaluation
	}

	// Return best result after max iterations
	var bestIteration *IterationRecord
	var bestScore float64
	for i := range e.history {
		if e.history[i].Evaluation.OverallScore > bestScore {
			bestScore = e.history[i].Evaluation.OverallScore
			bestIteration = &e.history[i]
		}
	}

	return &OptimizationResult{
		FinalOutput:  bestIteration.Output,
		FinalScore:   bestIteration.Evaluation.OverallScore,
		Iterations:   maxIterations,
		MetThreshold: false,
		History:      e.history,
	}, nil
}

func (e *EvaluatorOptimizer) generate(ctx context.Context, task, previousOutput string, previousEvaluation *EvaluationResult) (string, error) {
	var prompt string

	if previousOutput == "" {
		prompt = fmt.Sprintf(`Complete this task:

%s

Provide your best output:`, task)
	} else {
		var feedbackText string
		if previousEvaluation != nil {
			var suggestions []string
			for _, s := range previousEvaluation.Suggestions {
				suggestions = append(suggestions, "- "+s)
			}
			feedbackText = fmt.Sprintf(`Previous evaluation feedback:
%s

Specific suggestions:
%s`, previousEvaluation.Feedback, strings.Join(suggestions, "\n"))
		}

		prompt = fmt.Sprintf(`Improve this output based on the feedback:

Original task: %s

Previous output:
%s

%s

Provide an improved version:`, task, previousOutput, feedbackText)
	}

	return e.client.CreateMessage(ctx, prompt, e.generatorModel, 4096)
}

func (e *EvaluatorOptimizer) evaluate(ctx context.Context, output string) (*EvaluationResult, error) {
	var criteriaList string
	if len(e.criteria) > 0 {
		var parts []string
		for _, c := range e.criteria {
			parts = append(parts, fmt.Sprintf("- %s (weight: %.1f): %s", c.Name, c.Weight, c.Description))
		}
		criteriaList = strings.Join(parts, "\n")
	} else {
		criteriaList = `- quality: Overall quality and correctness
- clarity: Clear and understandable
- completeness: Addresses all aspects`
	}

	prompt := fmt.Sprintf(`Evaluate this output against the following criteria:

%s

Output to evaluate:
%s

Respond with JSON in this exact format:
{
    "overall_score": 0.0-1.0,
    "criteria_scores": {
        "criterion_name": 0.0-1.0
    },
    "feedback": "Overall assessment",
    "suggestions": ["specific improvement 1", "specific improvement 2"]
}`, criteriaList, output)

	response, err := e.client.CreateMessage(ctx, prompt, e.evaluatorModel, 1024)
	if err != nil {
		return nil, err
	}

	return parseEvaluationJSON(response)
}

func parseEvaluationJSON(jsonStr string) (*EvaluationResult, error) {
	result := &EvaluationResult{
		OverallScore:   0.5,
		CriteriaScores: make(map[string]float64),
		Suggestions:    []string{},
	}

	// Extract overall score
	scoreRe := regexp.MustCompile(`"overall_score"\s*:\s*([0-9.]+)`)
	if match := scoreRe.FindStringSubmatch(jsonStr); len(match) > 1 {
		if score, err := strconv.ParseFloat(match[1], 64); err == nil {
			result.OverallScore = score
		}
	}

	// Extract feedback
	feedbackRe := regexp.MustCompile(`"feedback"\s*:\s*"([^"]*)"`)
	if match := feedbackRe.FindStringSubmatch(jsonStr); len(match) > 1 {
		result.Feedback = match[1]
	}

	// Extract suggestions
	suggestionsRe := regexp.MustCompile(`"suggestions"\s*:\s*\[(.*?)\]`)
	if match := suggestionsRe.FindStringSubmatch(jsonStr); len(match) > 1 {
		suggestionItemRe := regexp.MustCompile(`"([^"]+)"`)
		items := suggestionItemRe.FindAllStringSubmatch(match[1], -1)
		for _, item := range items {
			if len(item) > 1 {
				result.Suggestions = append(result.Suggestions, item[1])
			}
		}
	}

	return result, nil
}

// ConfidenceBasedOptimizer generates with confidence self-assessment
type ConfidenceBasedOptimizer struct {
	client *AnthropicClient
	model  string
}

// NewConfidenceBasedOptimizer creates a new ConfidenceBasedOptimizer
func NewConfidenceBasedOptimizer(client *AnthropicClient, model string) *ConfidenceBasedOptimizer {
	return &ConfidenceBasedOptimizer{
		client: client,
		model:  model,
	}
}

// AttemptRecord represents a record of an attempt
type AttemptRecord struct {
	Attempt    int
	Output     string
	Confidence float64
}

// ConfidenceResult represents the result of confidence-based generation
type ConfidenceResult struct {
	Output       string
	Confidence   float64
	Attempts     []AttemptRecord
	MetThreshold bool
}

// GenerateWithConfidence generates with confidence self-assessment
func (c *ConfidenceBasedOptimizer) GenerateWithConfidence(ctx context.Context, task string, confidenceThreshold float64, maxAttempts int) (*ConfidenceResult, error) {
	var attempts []AttemptRecord
	bestOutput := ""
	bestConfidence := 0.0

	for i := 0; i < maxAttempts; i++ {
		prompt := fmt.Sprintf(`Complete this task and assess your confidence:

%s

After your response, on a new line, provide your confidence level (0.0-1.0) that your answer is correct and complete.

Format:
[Your response here]

CONFIDENCE: [0.0-1.0]`, task)

		response, err := c.client.CreateMessage(ctx, prompt, c.model, 4096)
		if err != nil {
			return nil, err
		}

		output, confidence := parseConfidenceResponse(response)

		attempts = append(attempts, AttemptRecord{
			Attempt:    i + 1,
			Output:     output,
			Confidence: confidence,
		})

		if confidence > bestConfidence {
			bestConfidence = confidence
			bestOutput = output
		}

		if confidence >= confidenceThreshold {
			return &ConfidenceResult{
				Output:       output,
				Confidence:   confidence,
				Attempts:     attempts,
				MetThreshold: true,
			}, nil
		}
	}

	return &ConfidenceResult{
		Output:       bestOutput,
		Confidence:   bestConfidence,
		Attempts:     attempts,
		MetThreshold: false,
	}, nil
}

func parseConfidenceResponse(text string) (string, float64) {
	confidence := 0.5

	confidenceRe := regexp.MustCompile(`(?i)CONFIDENCE:\s*([0-9.]+)`)
	if match := confidenceRe.FindStringSubmatch(text); len(match) > 1 {
		if conf, err := strconv.ParseFloat(match[1], 64); err == nil {
			if conf > 1.0 {
				conf = 1.0
			}
			if conf < 0.0 {
				conf = 0.0
			}
			confidence = conf
		}
	}

	output := confidenceRe.ReplaceAllString(text, "")
	output = strings.TrimSpace(output)

	return output, confidence
}

// ExampleWritingOptimization demonstrates the evaluator-optimizer pattern
func ExampleWritingOptimization() error {
	apiKey := getEnv("ANTHROPIC_API_KEY", "")
	if apiKey == "" {
		return fmt.Errorf("ANTHROPIC_API_KEY environment variable not set")
	}

	client := &AnthropicClient{
		APIKey:     apiKey,
		HTTPClient: nil, // Would use http.Client in production
	}

	optimizer := NewEvaluatorOptimizer(client, "claude-sonnet-4-20250514")

	// Add evaluation criteria
	optimizer.
		AddCriterion(EvaluationCriterion{
			Name:        "clarity",
			Description: "Writing is clear and easy to understand",
			Weight:      1.5,
		}).
		AddCriterion(EvaluationCriterion{
			Name:        "engagement",
			Description: "Content is engaging and holds attention",
			Weight:      1.2,
		}).
		AddCriterion(EvaluationCriterion{
			Name:        "accuracy",
			Description: "Information is accurate and well-researched",
			Weight:      1.5,
		})

	ctx := context.Background()
	result, err := optimizer.Optimize(
		ctx,
		"Write a blog post explaining how large language models work to a non-technical audience",
		3,
		0.85,
	)
	if err != nil {
		return err
	}

	fmt.Println("=== Optimization Results ===")
	fmt.Printf("Iterations: %d\n", result.Iterations)
	fmt.Printf("Final Score: %.1f%%\n", result.FinalScore*100)
	fmt.Printf("Met Threshold: %v\n", result.MetThreshold)

	fmt.Println("\n=== Score Progress ===")
	for _, iteration := range result.History {
		fmt.Printf("Iteration %d: %.1f%%\n", iteration.Iteration, iteration.Evaluation.OverallScore*100)
	}

	fmt.Printf("\n=== Final Output ===\n%s\n", result.FinalOutput)

	return nil
}
