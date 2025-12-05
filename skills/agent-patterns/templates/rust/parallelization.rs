/*!
 * Parallelization Pattern Implementation for Rust
 * Concurrent LLM calls for independent subtasks
 */

use anyhow::{Context, Result};
use futures::future::join_all;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::task::JoinHandle;

/// Anthropic API client
#[derive(Clone)]
pub struct AnthropicClient {
    api_key: String,
    http_client: reqwest::Client,
}

#[derive(Serialize)]
struct MessageRequest {
    model: String,
    max_tokens: u32,
    messages: Vec<MessageContent>,
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f64>,
}

#[derive(Serialize, Deserialize)]
struct MessageContent {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct MessageResponse {
    content: Vec<ContentBlock>,
}

#[derive(Deserialize)]
struct ContentBlock {
    #[serde(rename = "type")]
    content_type: String,
    text: Option<String>,
}

impl AnthropicClient {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            http_client: reqwest::Client::new(),
        }
    }

    pub async fn create_message(
        &self,
        prompt: &str,
        model: &str,
        max_tokens: u32,
        temperature: Option<f64>,
    ) -> Result<String> {
        let request = MessageRequest {
            model: model.to_string(),
            max_tokens,
            messages: vec![MessageContent {
                role: "user".to_string(),
                content: prompt.to_string(),
            }],
            temperature,
        };

        let response = self
            .http_client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&request)
            .send()
            .await?
            .json::<MessageResponse>()
            .await?;

        response
            .content
            .into_iter()
            .find(|c| c.content_type == "text")
            .and_then(|c| c.text)
            .context("No text content in response")
    }
}

/// Result of a parallel subtask
#[derive(Debug, Clone)]
pub struct SubtaskResult {
    pub name: String,
    pub result: Option<String>,
    pub success: bool,
    pub error: Option<String>,
    pub duration: Duration,
}

/// Subtask definition
pub struct Subtask {
    pub name: String,
    pub prompt: String,
}

/// Sectioning Parallelizer - divides task into independent subtasks
///
/// # Example
/// ```rust
/// let parallelizer = SectioningParallelizer::new(client, "claude-sonnet-4-20250514".to_string());
/// let result = parallelizer.process_code_review(&code).await?;
/// ```
pub struct SectioningParallelizer {
    client: Arc<AnthropicClient>,
    model: String,
}

impl SectioningParallelizer {
    pub fn new(client: Arc<AnthropicClient>, model: String) -> Self {
        Self { client, model }
    }

    /// Execute multiple subtasks in parallel
    pub async fn execute_parallel(&self, subtasks: Vec<Subtask>) -> Vec<SubtaskResult> {
        let handles: Vec<JoinHandle<SubtaskResult>> = subtasks
            .into_iter()
            .map(|subtask| {
                let client = self.client.clone();
                let model = self.model.clone();

                tokio::spawn(async move {
                    let start = Instant::now();

                    match client
                        .create_message(&subtask.prompt, &model, 2048, None)
                        .await
                    {
                        Ok(result) => SubtaskResult {
                            name: subtask.name,
                            result: Some(result),
                            success: true,
                            error: None,
                            duration: start.elapsed(),
                        },
                        Err(e) => SubtaskResult {
                            name: subtask.name,
                            result: None,
                            success: false,
                            error: Some(e.to_string()),
                            duration: start.elapsed(),
                        },
                    }
                })
            })
            .collect();

        let results = join_all(handles).await;
        results
            .into_iter()
            .filter_map(|r| r.ok())
            .collect()
    }

    /// Code review with parallel analysis
    pub async fn process_code_review(&self, code: &str) -> Result<CodeReviewResult> {
        let subtasks = vec![
            Subtask {
                name: "security".to_string(),
                prompt: format!(
                    r#"Analyze this code for security vulnerabilities:
```
{}
```
List any security issues found with severity and recommendations."#,
                    code
                ),
            },
            Subtask {
                name: "performance".to_string(),
                prompt: format!(
                    r#"Analyze this code for performance issues:
```
{}
```
Identify inefficiencies and suggest optimizations."#,
                    code
                ),
            },
            Subtask {
                name: "maintainability".to_string(),
                prompt: format!(
                    r#"Analyze this code for maintainability:
```
{}
```
Check code structure, naming, and suggest improvements."#,
                    code
                ),
            },
            Subtask {
                name: "bugs".to_string(),
                prompt: format!(
                    r#"Analyze this code for potential bugs:
```
{}
```
Identify logic errors, edge cases, and potential runtime issues."#,
                    code
                ),
            },
        ];

        let results = self.execute_parallel(subtasks).await;

        let get_result = |name: &str| -> String {
            results
                .iter()
                .find(|r| r.name == name)
                .and_then(|r| r.result.clone())
                .unwrap_or_default()
        };

        let total_duration = results.iter().map(|r| r.duration).max().unwrap_or_default();

        Ok(CodeReviewResult {
            security_analysis: get_result("security"),
            performance_analysis: get_result("performance"),
            maintainability_analysis: get_result("maintainability"),
            bug_analysis: get_result("bugs"),
            total_duration,
        })
    }
}

#[derive(Debug)]
pub struct CodeReviewResult {
    pub security_analysis: String,
    pub performance_analysis: String,
    pub maintainability_analysis: String,
    pub bug_analysis: String,
    pub total_duration: Duration,
}

/// Voting Parallelizer - multiple evaluations for consensus
pub struct VotingParallelizer {
    client: Arc<AnthropicClient>,
    model: String,
}

impl VotingParallelizer {
    pub fn new(client: Arc<AnthropicClient>, model: String) -> Self {
        Self { client, model }
    }

    /// Get multiple votes on a decision
    pub async fn vote(
        &self,
        question: &str,
        options: &[String],
        voter_count: usize,
    ) -> Result<VotingResult> {
        let options_list: String = options
            .iter()
            .enumerate()
            .map(|(i, o)| format!("{}. {}", i + 1, o))
            .collect::<Vec<_>>()
            .join("\n");

        let prompt = format!(
            r#"Consider this question:
{}

Options:
{}

Analyze carefully and respond with only the number of your chosen option."#,
            question, options_list
        );

        let handles: Vec<JoinHandle<Option<usize>>> = (0..voter_count)
            .map(|_| {
                let client = self.client.clone();
                let model = self.model.clone();
                let prompt = prompt.clone();
                let option_count = options.len();

                tokio::spawn(async move {
                    let response = client
                        .create_message(&prompt, &model, 10, Some(0.7))
                        .await
                        .ok()?;

                    response
                        .trim()
                        .parse::<usize>()
                        .ok()
                        .filter(|&v| v >= 1 && v <= option_count)
                        .map(|v| v - 1) // 0-indexed
                })
            })
            .collect();

        let votes: Vec<Option<usize>> = join_all(handles)
            .await
            .into_iter()
            .filter_map(|r| r.ok())
            .collect();

        let valid_votes: Vec<usize> = votes.into_iter().flatten().collect();

        // Count votes
        let mut vote_counts: std::collections::HashMap<usize, usize> =
            std::collections::HashMap::new();
        for vote in &valid_votes {
            *vote_counts.entry(*vote).or_insert(0) += 1;
        }

        let winning_index = vote_counts
            .iter()
            .max_by_key(|(_, count)| *count)
            .map(|(idx, _)| *idx)
            .unwrap_or(0);

        let option_votes: Vec<VoteCount> = options
            .iter()
            .enumerate()
            .map(|(i, opt)| VoteCount {
                option: opt.clone(),
                votes: *vote_counts.get(&i).unwrap_or(&0),
            })
            .collect();

        let max_votes = vote_counts.values().max().copied().unwrap_or(0);
        let consensus = !valid_votes.is_empty() && max_votes > valid_votes.len() / 2;

        Ok(VotingResult {
            winning_option: options.get(winning_index).cloned().unwrap_or_default(),
            winning_index,
            vote_counts: option_votes,
            total_votes: valid_votes.len(),
            consensus,
        })
    }

    /// Safety voting - all voters must agree for approval
    pub async fn safety_vote(&self, content: &str, voter_count: usize) -> Result<SafetyVotingResult> {
        let prompt = format!(
            r#"Evaluate if this content is safe and appropriate:

{}

Respond with only 'SAFE' or 'UNSAFE'."#,
            content
        );

        let handles: Vec<JoinHandle<bool>> = (0..voter_count)
            .map(|_| {
                let client = self.client.clone();
                let model = self.model.clone();
                let prompt = prompt.clone();

                tokio::spawn(async move {
                    let response = client
                        .create_message(&prompt, &model, 10, None)
                        .await
                        .unwrap_or_default();

                    let upper = response.to_uppercase();
                    upper.contains("SAFE") && !upper.contains("UNSAFE")
                })
            })
            .collect();

        let votes: Vec<bool> = join_all(handles)
            .await
            .into_iter()
            .filter_map(|r| r.ok())
            .collect();

        let safe_votes = votes.iter().filter(|&&v| v).count();
        let unsafe_votes = votes.len() - safe_votes;

        Ok(SafetyVotingResult {
            is_safe: votes.iter().all(|&v| v), // Require unanimous
            safe_votes,
            unsafe_votes,
            unanimous: votes.iter().all(|&v| v) || votes.iter().all(|&v| !v),
        })
    }
}

#[derive(Debug)]
pub struct VotingResult {
    pub winning_option: String,
    pub winning_index: usize,
    pub vote_counts: Vec<VoteCount>,
    pub total_votes: usize,
    pub consensus: bool,
}

#[derive(Debug)]
pub struct VoteCount {
    pub option: String,
    pub votes: usize,
}

#[derive(Debug)]
pub struct SafetyVotingResult {
    pub is_safe: bool,
    pub safe_votes: usize,
    pub unsafe_votes: usize,
    pub unanimous: bool,
}

/// Guardrails Parallelizer - run guardrails in parallel with main task
pub struct GuardrailsParallelizer {
    client: Arc<AnthropicClient>,
    model: String,
}

impl GuardrailsParallelizer {
    pub fn new(client: Arc<AnthropicClient>, model: String) -> Self {
        Self { client, model }
    }

    /// Execute task with parallel guardrails
    pub async fn execute_with_guardrails(
        &self,
        input: &str,
        task_prompt: &str,
        guardrail_prompts: Vec<String>,
    ) -> Result<GuardrailedResult> {
        // Run main task
        let client_main = self.client.clone();
        let model_main = self.model.clone();
        let task_prompt_owned = task_prompt.to_string();
        let main_handle = tokio::spawn(async move {
            client_main
                .create_message(&task_prompt_owned, &model_main, 4096, None)
                .await
        });

        // Run guardrails in parallel
        let guardrail_handles: Vec<JoinHandle<GuardrailResult>> = guardrail_prompts
            .into_iter()
            .enumerate()
            .map(|(i, prompt)| {
                let client = self.client.clone();
                let check_prompt = prompt.replace("{input}", input) + "\n\nRespond with only 'PASS' or 'FAIL'.";

                tokio::spawn(async move {
                    let response = client
                        .create_message(&check_prompt, "claude-3-haiku-20240307", 10, None)
                        .await
                        .unwrap_or_default();

                    GuardrailResult {
                        name: format!("guardrail_{}", i),
                        passed: response.to_uppercase().contains("PASS"),
                    }
                })
            })
            .collect();

        // Wait for all tasks
        let main_result = main_handle.await??;
        let guardrail_results: Vec<GuardrailResult> = join_all(guardrail_handles)
            .await
            .into_iter()
            .filter_map(|r| r.ok())
            .collect();

        let all_passed = guardrail_results.iter().all(|g| g.passed);
        let blocking: Vec<String> = guardrail_results
            .iter()
            .filter(|g| !g.passed)
            .map(|g| g.name.clone())
            .collect();

        Ok(GuardrailedResult {
            result: if all_passed { Some(main_result) } else { None },
            blocked: !all_passed,
            guardrail_results,
            blocking_guardrails: blocking,
        })
    }
}

#[derive(Debug)]
pub struct GuardrailResult {
    pub name: String,
    pub passed: bool,
}

#[derive(Debug)]
pub struct GuardrailedResult {
    pub result: Option<String>,
    pub blocked: bool,
    pub guardrail_results: Vec<GuardrailResult>,
    pub blocking_guardrails: Vec<String>,
}

// Example usage
pub async fn example_code_review() -> Result<()> {
    let api_key = std::env::var("ANTHROPIC_API_KEY")
        .context("ANTHROPIC_API_KEY environment variable not set")?;

    let client = Arc::new(AnthropicClient::new(api_key));
    let parallelizer = SectioningParallelizer::new(client, "claude-sonnet-4-20250514".to_string());

    let code = r#"
fn get_user(id: i32) -> User {
    let query = format!("SELECT * FROM users WHERE id = {}", id);
    // Execute query...
    User::default()
}
"#;

    let result = parallelizer.process_code_review(code).await?;

    println!("=== Code Review Results ===");
    println!("\nSecurity:\n{}", result.security_analysis);
    println!("\nPerformance:\n{}", result.performance_analysis);
    println!("\nMaintainability:\n{}", result.maintainability_analysis);
    println!("\nBugs:\n{}", result.bug_analysis);
    println!("\nTotal Duration: {:?}", result.total_duration);

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_subtask_result_creation() {
        let result = SubtaskResult {
            name: "test".to_string(),
            result: Some("output".to_string()),
            success: true,
            error: None,
            duration: Duration::from_millis(100),
        };
        assert!(result.success);
        assert_eq!(result.name, "test");
    }
}
