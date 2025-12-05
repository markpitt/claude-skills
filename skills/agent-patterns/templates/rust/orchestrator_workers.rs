/*!
 * Orchestrator-Workers Pattern Implementation for Rust
 * Central LLM dynamically breaks down tasks and delegates to workers
 */

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;

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
    system: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
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
        system: Option<&str>,
    ) -> Result<String> {
        let request = MessageRequest {
            model: model.to_string(),
            max_tokens,
            messages: vec![MessageContent {
                role: "user".to_string(),
                content: prompt.to_string(),
            }],
            system: system.map(|s| s.to_string()),
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

/// Represents a subtask created by the orchestrator
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subtask {
    pub id: String,
    pub description: String,
    pub worker_type: String,
    #[serde(default)]
    pub dependencies: Vec<String>,
}

/// Result from a worker execution
#[derive(Debug, Clone)]
pub struct WorkerResult {
    pub subtask_id: String,
    pub result: Option<String>,
    pub success: bool,
    pub error: Option<String>,
}

/// Worker trait for specialized task execution
pub trait Worker: Send + Sync {
    fn worker_type(&self) -> &str;
    fn execute(
        &self,
        subtask: &Subtask,
        dependency_results: &HashMap<String, String>,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<String>> + Send + '_>>;
}

/// LLM-based worker that uses prompts for execution
pub struct LLMWorker {
    client: Arc<AnthropicClient>,
    worker_type: String,
    system_prompt: String,
    model: String,
}

impl LLMWorker {
    pub fn new(
        client: Arc<AnthropicClient>,
        worker_type: &str,
        system_prompt: &str,
        model: &str,
    ) -> Self {
        Self {
            client,
            worker_type: worker_type.to_string(),
            system_prompt: system_prompt.to_string(),
            model: model.to_string(),
        }
    }
}

impl Worker for LLMWorker {
    fn worker_type(&self) -> &str {
        &self.worker_type
    }

    fn execute(
        &self,
        subtask: &Subtask,
        dependency_results: &HashMap<String, String>,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<String>> + Send + '_>> {
        let client = self.client.clone();
        let model = self.model.clone();
        let system_prompt = self.system_prompt.clone();
        let description = subtask.description.clone();
        let deps = dependency_results.clone();

        Box::pin(async move {
            let context_info = if !deps.is_empty() {
                let dep_text: String = deps
                    .iter()
                    .map(|(k, v)| format!("[{}]: {}", k, v))
                    .collect::<Vec<_>>()
                    .join("\n");
                format!("\n\nContext from previous tasks:\n{}", dep_text)
            } else {
                String::new()
            };

            let prompt = format!(
                "{}\n\nTask: {}{}\n\nProvide your result:",
                system_prompt, description, context_info
            );

            client
                .create_message(&prompt, &model, 4096, None)
                .await
        })
    }
}

/// Orchestrator that decomposes tasks and coordinates workers.
///
/// # Example
/// ```rust
/// let orchestrator = Orchestrator::new(client, "claude-sonnet-4-20250514".to_string());
/// orchestrator.register_worker(Box::new(LLMWorker::new(client, "researcher", "You research topics", model)));
/// let result = orchestrator.execute("Write an article about AI").await?;
/// ```
pub struct Orchestrator {
    client: Arc<AnthropicClient>,
    model: String,
    workers: HashMap<String, Box<dyn Worker>>,
}

impl Orchestrator {
    pub fn new(client: Arc<AnthropicClient>, model: String) -> Self {
        Self {
            client,
            model,
            workers: HashMap::new(),
        }
    }

    /// Register a worker
    pub fn register_worker(&mut self, worker: Box<dyn Worker>) -> &mut Self {
        self.workers.insert(worker.worker_type().to_string(), worker);
        self
    }

    /// Execute a complex task by decomposing and delegating
    pub async fn execute(&self, task: &str) -> Result<OrchestratorResult> {
        // Step 1: Decompose the task
        let subtasks = self.decompose_task(task).await?;

        // Step 2: Execute subtasks respecting dependencies
        let mut results: HashMap<String, String> = HashMap::new();
        let mut worker_results: Vec<WorkerResult> = Vec::new();

        let sorted_subtasks = self.topological_sort(&subtasks)?;

        for subtask in sorted_subtasks {
            // Gather dependency results
            let dep_results: HashMap<String, String> = subtask
                .dependencies
                .iter()
                .filter_map(|d| results.get(d).map(|r| (d.clone(), r.clone())))
                .collect();

            // Find appropriate worker
            let worker_result = if let Some(worker) = self.workers.get(&subtask.worker_type) {
                match worker.execute(&subtask, &dep_results).await {
                    Ok(result) => {
                        results.insert(subtask.id.clone(), result.clone());
                        WorkerResult {
                            subtask_id: subtask.id.clone(),
                            result: Some(result),
                            success: true,
                            error: None,
                        }
                    }
                    Err(e) => WorkerResult {
                        subtask_id: subtask.id.clone(),
                        result: None,
                        success: false,
                        error: Some(e.to_string()),
                    },
                }
            } else {
                // Use default LLM worker
                let default_worker = LLMWorker::new(
                    self.client.clone(),
                    &subtask.worker_type,
                    &format!("You are a {} specialist.", subtask.worker_type),
                    &self.model,
                );
                match default_worker.execute(&subtask, &dep_results).await {
                    Ok(result) => {
                        results.insert(subtask.id.clone(), result.clone());
                        WorkerResult {
                            subtask_id: subtask.id.clone(),
                            result: Some(result),
                            success: true,
                            error: None,
                        }
                    }
                    Err(e) => WorkerResult {
                        subtask_id: subtask.id.clone(),
                        result: None,
                        success: false,
                        error: Some(e.to_string()),
                    },
                }
            };

            worker_results.push(worker_result);
        }

        // Step 3: Synthesize final result
        let final_result = self.synthesize_results(task, &results).await?;

        Ok(OrchestratorResult {
            final_result,
            subtasks,
            worker_results,
        })
    }

    /// Decompose task into subtasks
    async fn decompose_task(&self, task: &str) -> Result<Vec<Subtask>> {
        let worker_types: String = self.workers.keys().cloned().collect::<Vec<_>>().join(", ");

        let prompt = format!(
            r#"Break down this task into subtasks that can be delegated to specialized workers.

Task: {}

Available worker types: {}

Respond with JSON array of subtasks:
[
  {{
    "id": "subtask_1",
    "description": "What needs to be done",
    "worker_type": "worker_type",
    "dependencies": []
  }},
  {{
    "id": "subtask_2",
    "description": "Another task",
    "worker_type": "worker_type",
    "dependencies": ["subtask_1"]
  }}
]

Only include the JSON array, no other text."#,
            task, worker_types
        );

        let response = self
            .client
            .create_message(&prompt, &self.model, 2048, None)
            .await?;

        // Clean up JSON
        let json = if response.contains("```") {
            response
                .lines()
                .skip_while(|l| !l.starts_with('['))
                .take_while(|l| !l.starts_with("```"))
                .collect::<Vec<_>>()
                .join("\n")
        } else {
            response
        };

        serde_json::from_str(&json).or_else(|_| {
            // Fallback: create a single subtask
            Ok(vec![Subtask {
                id: "main".to_string(),
                description: task.to_string(),
                worker_type: self.workers.keys().next().cloned().unwrap_or("general".to_string()),
                dependencies: vec![],
            }])
        })
    }

    /// Synthesize results into final output
    async fn synthesize_results(
        &self,
        original_task: &str,
        results: &HashMap<String, String>,
    ) -> Result<String> {
        let results_text: String = results
            .iter()
            .map(|(k, v)| format!("### {}\n{}", k, v))
            .collect::<Vec<_>>()
            .join("\n\n");

        let prompt = format!(
            r#"Synthesize these subtask results into a cohesive final result.

Original Task: {}

Subtask Results:
{}

Provide a well-organized final result that addresses the original task:"#,
            original_task, results_text
        );

        self.client
            .create_message(&prompt, &self.model, 4096, None)
            .await
    }

    /// Topological sort of subtasks based on dependencies
    fn topological_sort(&self, subtasks: &[Subtask]) -> Result<Vec<Subtask>> {
        let mut result = Vec::new();
        let mut visited = HashSet::new();
        let mut visiting = HashSet::new();
        let task_map: HashMap<String, &Subtask> = subtasks.iter().map(|s| (s.id.clone(), s)).collect();

        fn visit<'a>(
            id: &str,
            task_map: &HashMap<String, &'a Subtask>,
            visited: &mut HashSet<String>,
            visiting: &mut HashSet<String>,
            result: &mut Vec<Subtask>,
        ) -> Result<()> {
            if visited.contains(id) {
                return Ok(());
            }
            if visiting.contains(id) {
                anyhow::bail!("Circular dependency detected: {}", id);
            }

            visiting.insert(id.to_string());

            if let Some(subtask) = task_map.get(id) {
                for dep in &subtask.dependencies {
                    visit(dep, task_map, visited, visiting, result)?;
                }
                result.push((*subtask).clone());
            }

            visiting.remove(id);
            visited.insert(id.to_string());
            Ok(())
        }

        for subtask in subtasks {
            visit(&subtask.id, &task_map, &mut visited, &mut visiting, &mut result)?;
        }

        Ok(result)
    }
}

#[derive(Debug)]
pub struct OrchestratorResult {
    pub final_result: String,
    pub subtasks: Vec<Subtask>,
    pub worker_results: Vec<WorkerResult>,
}

// Example usage
pub async fn example_research_article() -> Result<()> {
    let api_key = std::env::var("ANTHROPIC_API_KEY")
        .context("ANTHROPIC_API_KEY environment variable not set")?;

    let client = Arc::new(AnthropicClient::new(api_key));
    let mut orchestrator = Orchestrator::new(client.clone(), "claude-sonnet-4-20250514".to_string());

    // Register specialized workers
    orchestrator
        .register_worker(Box::new(LLMWorker::new(
            client.clone(),
            "researcher",
            "You are a research specialist. Gather facts, statistics, and key information.",
            "claude-sonnet-4-20250514",
        )))
        .register_worker(Box::new(LLMWorker::new(
            client.clone(),
            "writer",
            "You are a skilled writer. Create engaging, well-structured content.",
            "claude-sonnet-4-20250514",
        )))
        .register_worker(Box::new(LLMWorker::new(
            client,
            "editor",
            "You are an editor. Review and improve content for clarity and accuracy.",
            "claude-sonnet-4-20250514",
        )));

    let result = orchestrator
        .execute("Write a comprehensive article about the impact of AI on healthcare")
        .await?;

    println!("=== Orchestrator Results ===");
    println!("\nSubtasks created: {}", result.subtasks.len());
    for subtask in &result.subtasks {
        println!("  - [{}] {}", subtask.worker_type, subtask.description);
    }

    println!("\n=== Final Result ===\n{}", result.final_result);

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_subtask_serialization() {
        let subtask = Subtask {
            id: "test".to_string(),
            description: "Test task".to_string(),
            worker_type: "general".to_string(),
            dependencies: vec![],
        };
        let json = serde_json::to_string(&subtask).unwrap();
        assert!(json.contains("test"));
    }
}
