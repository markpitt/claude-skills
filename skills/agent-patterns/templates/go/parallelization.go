/*
 * Parallelization Pattern Implementation for Go
 * Concurrent LLM calls for independent subtasks
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
	"sync"
	"time"
)

// SubtaskResult represents the result of a parallel subtask
type SubtaskResult struct {
	Name     string
	Result   string
	Success  bool
	Error    string
	Duration time.Duration
}

// Subtask represents a subtask to be executed
type Subtask struct {
	Name   string
	Prompt string
}

// SectioningParallelizer divides tasks into independent subtasks for parallel execution.
//
// Example:
//
//	parallelizer := NewSectioningParallelizer(client, "claude-sonnet-4-20250514")
//	result, err := parallelizer.ProcessCodeReview(ctx, code)
type SectioningParallelizer struct {
	client *AnthropicClient
	model  string
}

// NewSectioningParallelizer creates a new SectioningParallelizer
func NewSectioningParallelizer(client *AnthropicClient, model string) *SectioningParallelizer {
	return &SectioningParallelizer{
		client: client,
		model:  model,
	}
}

// ExecuteParallel executes multiple subtasks in parallel
func (p *SectioningParallelizer) ExecuteParallel(ctx context.Context, subtasks []Subtask) []SubtaskResult {
	results := make([]SubtaskResult, len(subtasks))
	var wg sync.WaitGroup

	for i, subtask := range subtasks {
		wg.Add(1)
		go func(idx int, st Subtask) {
			defer wg.Done()
			start := time.Now()

			response, err := p.client.CreateMessage(ctx, st.Prompt, p.model, 2048)
			duration := time.Since(start)

			if err != nil {
				results[idx] = SubtaskResult{
					Name:     st.Name,
					Success:  false,
					Error:    err.Error(),
					Duration: duration,
				}
			} else {
				results[idx] = SubtaskResult{
					Name:     st.Name,
					Result:   response,
					Success:  true,
					Duration: duration,
				}
			}
		}(i, subtask)
	}

	wg.Wait()
	return results
}

// CodeReviewResult represents the result of a code review
type CodeReviewResult struct {
	SecurityAnalysis        string
	PerformanceAnalysis     string
	MaintainabilityAnalysis string
	BugAnalysis             string
	TotalDuration           time.Duration
}

// ProcessCodeReview performs parallel code review analysis
func (p *SectioningParallelizer) ProcessCodeReview(ctx context.Context, code string) (*CodeReviewResult, error) {
	subtasks := []Subtask{
		{
			Name: "security",
			Prompt: fmt.Sprintf(`Analyze this code for security vulnerabilities:
%s
List any security issues found with severity and recommendations.`, code),
		},
		{
			Name: "performance",
			Prompt: fmt.Sprintf(`Analyze this code for performance issues:
%s
Identify inefficiencies and suggest optimizations.`, code),
		},
		{
			Name: "maintainability",
			Prompt: fmt.Sprintf(`Analyze this code for maintainability:
%s
Check code structure, naming, and suggest improvements.`, code),
		},
		{
			Name: "bugs",
			Prompt: fmt.Sprintf(`Analyze this code for potential bugs:
%s
Identify logic errors, edge cases, and potential runtime issues.`, code),
		},
	}

	results := p.ExecuteParallel(ctx, subtasks)

	// Find results by name
	getResult := func(name string) string {
		for _, r := range results {
			if r.Name == name && r.Success {
				return r.Result
			}
		}
		return ""
	}

	// Find max duration
	var maxDuration time.Duration
	for _, r := range results {
		if r.Duration > maxDuration {
			maxDuration = r.Duration
		}
	}

	return &CodeReviewResult{
		SecurityAnalysis:        getResult("security"),
		PerformanceAnalysis:     getResult("performance"),
		MaintainabilityAnalysis: getResult("maintainability"),
		BugAnalysis:             getResult("bugs"),
		TotalDuration:           maxDuration,
	}, nil
}

// VotingParallelizer gets multiple votes for consensus
type VotingParallelizer struct {
	client *AnthropicClient
	model  string
}

// NewVotingParallelizer creates a new VotingParallelizer
func NewVotingParallelizer(client *AnthropicClient, model string) *VotingParallelizer {
	return &VotingParallelizer{
		client: client,
		model:  model,
	}
}

// VoteCount represents a vote count for an option
type VoteCount struct {
	Option string
	Votes  int
}

// VotingResult represents the result of a vote
type VotingResult struct {
	WinningOption string
	WinningIndex  int
	VoteCounts    []VoteCount
	TotalVotes    int
	Consensus     bool
}

// Vote gets multiple votes on a decision
func (v *VotingParallelizer) Vote(ctx context.Context, question string, options []string, voterCount int) (*VotingResult, error) {
	var optionsList strings.Builder
	for i, opt := range options {
		optionsList.WriteString(fmt.Sprintf("%d. %s\n", i+1, opt))
	}

	prompt := fmt.Sprintf(`Consider this question:
%s

Options:
%s

Analyze carefully and respond with only the number of your chosen option.`, question, optionsList.String())

	votes := make([]int, voterCount)
	var wg sync.WaitGroup
	var mu sync.Mutex

	for i := 0; i < voterCount; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()

			// Create request with temperature for variance
			reqBody := struct {
				Model       string        `json:"model"`
				MaxTokens   int           `json:"max_tokens"`
				Messages    []MessageItem `json:"messages"`
				Temperature float64       `json:"temperature"`
			}{
				Model:       v.model,
				MaxTokens:   10,
				Messages:    []MessageItem{{Role: "user", Content: prompt}},
				Temperature: 0.7,
			}

			jsonData, _ := json.Marshal(reqBody)
			req, _ := http.NewRequestWithContext(ctx, "POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(jsonData))
			req.Header.Set("x-api-key", v.client.APIKey)
			req.Header.Set("anthropic-version", "2023-06-01")
			req.Header.Set("content-type", "application/json")

			resp, err := v.client.HTTPClient.Do(req)
			if err != nil {
				mu.Lock()
				votes[idx] = -1
				mu.Unlock()
				return
			}
			defer resp.Body.Close()

			var msgResp MessageResponse
			if err := json.NewDecoder(resp.Body).Decode(&msgResp); err != nil {
				mu.Lock()
				votes[idx] = -1
				mu.Unlock()
				return
			}

			for _, block := range msgResp.Content {
				if block.Type == "text" {
					var vote int
					fmt.Sscanf(strings.TrimSpace(block.Text), "%d", &vote)
					if vote >= 1 && vote <= len(options) {
						mu.Lock()
						votes[idx] = vote - 1 // 0-indexed
						mu.Unlock()
						return
					}
				}
			}

			mu.Lock()
			votes[idx] = -1
			mu.Unlock()
		}(i)
	}

	wg.Wait()

	// Count valid votes
	voteCounts := make(map[int]int)
	validVotes := 0
	for _, vote := range votes {
		if vote >= 0 {
			voteCounts[vote]++
			validVotes++
		}
	}

	// Find winner
	winningIndex := 0
	maxVotes := 0
	for idx, count := range voteCounts {
		if count > maxVotes {
			maxVotes = count
			winningIndex = idx
		}
	}

	// Build vote counts
	voteCountsList := make([]VoteCount, len(options))
	for i, opt := range options {
		voteCountsList[i] = VoteCount{
			Option: opt,
			Votes:  voteCounts[i],
		}
	}

	consensus := validVotes > 0 && maxVotes > validVotes/2

	return &VotingResult{
		WinningOption: options[winningIndex],
		WinningIndex:  winningIndex,
		VoteCounts:    voteCountsList,
		TotalVotes:    validVotes,
		Consensus:     consensus,
	}, nil
}

// SafetyVotingResult represents the result of a safety vote
type SafetyVotingResult struct {
	IsSafe      bool
	SafeVotes   int
	UnsafeVotes int
	Unanimous   bool
}

// SafetyVote performs a safety vote requiring unanimous agreement
func (v *VotingParallelizer) SafetyVote(ctx context.Context, content string, voterCount int) (*SafetyVotingResult, error) {
	prompt := fmt.Sprintf(`Evaluate if this content is safe and appropriate:

%s

Respond with only 'SAFE' or 'UNSAFE'.`, content)

	votes := make([]bool, voterCount)
	var wg sync.WaitGroup

	for i := 0; i < voterCount; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()

			response, err := v.client.CreateMessage(ctx, prompt, v.model, 10)
			if err != nil {
				votes[idx] = false
				return
			}

			upper := strings.ToUpper(response)
			votes[idx] = strings.Contains(upper, "SAFE") && !strings.Contains(upper, "UNSAFE")
		}(i)
	}

	wg.Wait()

	safeVotes := 0
	for _, safe := range votes {
		if safe {
			safeVotes++
		}
	}

	allSafe := safeVotes == voterCount
	allUnsafe := safeVotes == 0

	return &SafetyVotingResult{
		IsSafe:      allSafe, // Require unanimous
		SafeVotes:   safeVotes,
		UnsafeVotes: voterCount - safeVotes,
		Unanimous:   allSafe || allUnsafe,
	}, nil
}

// GuardrailsParallelizer runs guardrails in parallel with main task
type GuardrailsParallelizer struct {
	client *AnthropicClient
	model  string
}

// NewGuardrailsParallelizer creates a new GuardrailsParallelizer
func NewGuardrailsParallelizer(client *AnthropicClient, model string) *GuardrailsParallelizer {
	return &GuardrailsParallelizer{
		client: client,
		model:  model,
	}
}

// GuardrailResult represents the result of a guardrail check
type GuardrailResult struct {
	Name   string
	Passed bool
}

// GuardrailedResult represents the result of a guardrailed execution
type GuardrailedResult struct {
	Result             *string
	Blocked            bool
	GuardrailResults   []GuardrailResult
	BlockingGuardrails []string
}

// ExecuteWithGuardrails executes task with parallel guardrails
func (g *GuardrailsParallelizer) ExecuteWithGuardrails(
	ctx context.Context,
	input string,
	taskPrompt string,
	guardrailPrompts []string,
) (*GuardrailedResult, error) {
	var wg sync.WaitGroup
	var mainResult string
	var mainErr error
	guardrailResults := make([]GuardrailResult, len(guardrailPrompts))

	// Run main task
	wg.Add(1)
	go func() {
		defer wg.Done()
		mainResult, mainErr = g.client.CreateMessage(ctx, taskPrompt, g.model, 4096)
	}()

	// Run guardrails
	for i, prompt := range guardrailPrompts {
		wg.Add(1)
		go func(idx int, p string) {
			defer wg.Done()

			checkPrompt := strings.ReplaceAll(p, "{input}", input) + "\n\nRespond with only 'PASS' or 'FAIL'."
			response, err := g.client.CreateMessage(ctx, checkPrompt, "claude-3-haiku-20240307", 10)

			passed := false
			if err == nil {
				passed = strings.Contains(strings.ToUpper(response), "PASS")
			}

			guardrailResults[idx] = GuardrailResult{
				Name:   fmt.Sprintf("guardrail_%d", idx),
				Passed: passed,
			}
		}(i, prompt)
	}

	wg.Wait()

	if mainErr != nil {
		return nil, mainErr
	}

	// Check if all guardrails passed
	allPassed := true
	var blocking []string
	for _, gr := range guardrailResults {
		if !gr.Passed {
			allPassed = false
			blocking = append(blocking, gr.Name)
		}
	}

	var result *string
	if allPassed {
		result = &mainResult
	}

	return &GuardrailedResult{
		Result:             result,
		Blocked:            !allPassed,
		GuardrailResults:   guardrailResults,
		BlockingGuardrails: blocking,
	}, nil
}

// ExampleCodeReview demonstrates the parallelization pattern
func ExampleCodeReview() error {
	apiKey := getEnv("ANTHROPIC_API_KEY", "")
	if apiKey == "" {
		return fmt.Errorf("ANTHROPIC_API_KEY environment variable not set")
	}

	client := &AnthropicClient{
		APIKey:     apiKey,
		HTTPClient: &http.Client{},
	}

	parallelizer := NewSectioningParallelizer(client, "claude-sonnet-4-20250514")

	code := `
func getUser(id int) *User {
    query := fmt.Sprintf("SELECT * FROM users WHERE id = %d", id)
    // Execute query...
    return nil
}
`

	ctx := context.Background()
	result, err := parallelizer.ProcessCodeReview(ctx, code)
	if err != nil {
		return err
	}

	fmt.Println("=== Code Review Results ===")
	fmt.Printf("\nSecurity:\n%s\n", result.SecurityAnalysis)
	fmt.Printf("\nPerformance:\n%s\n", result.PerformanceAnalysis)
	fmt.Printf("\nMaintainability:\n%s\n", result.MaintainabilityAnalysis)
	fmt.Printf("\nBugs:\n%s\n", result.BugAnalysis)
	fmt.Printf("\nTotal Duration: %v\n", result.TotalDuration)

	return nil
}
