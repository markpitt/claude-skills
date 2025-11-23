/*!
 * Prompt Chaining Pattern Implementation for Rust
 * Sequential LLM calls with programmatic checkpoints
 */

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

/// Anthropic API client (simplified - use actual SDK in production)
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

    pub async fn create_message(&self, prompt: &str, model: &str) -> Result<String> {
        let request = MessageRequest {
            model: model.to_string(),
            max_tokens: 4096,
            messages: vec![MessageContent {
                role: "user".to_string(),
                content: prompt.to_string(),
            }],
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

/// Represents a single step in the prompt chain
pub struct ChainStep {
    pub name: String,
    pub prompt_template: Box<dyn Fn(&HashMap<String, String>) -> String + Send + Sync>,
    pub validator: Option<Box<dyn Fn(&str) -> bool + Send + Sync>>,
    pub processor: Option<Box<dyn Fn(&str) -> String + Send + Sync>>,
}

/// Execution history entry
#[derive(Debug, Clone)]
pub struct ChainHistory {
    pub step: String,
    pub prompt: String,
    pub output: String,
}

/// Executes a sequence of LLM calls with validation and processing between steps.
///
/// # Example
///
/// ```rust
/// let mut chain = PromptChain::new(client, "claude-3-5-sonnet-20241022".to_string());
///
/// chain.add_step(ChainStep {
///     name: "outline".to_string(),
///     prompt_template: Box::new(|ctx| {
///         format!("Create an outline for: {}", ctx.get("topic").unwrap())
///     }),
///     validator: Some(Box::new(|output| {
///         output.contains("1.") && output.contains("2.")
///     })),
///     processor: None,
/// });
///
/// let mut context = HashMap::new();
/// context.insert("topic".to_string(), "AI Safety".to_string());
///
/// let result = chain.execute(context).await?;
/// ```
pub struct PromptChain {
    client: Arc<AnthropicClient>,
    model: String,
    steps: Vec<ChainStep>,
    history: Vec<ChainHistory>,
}

impl PromptChain {
    pub fn new(client: Arc<AnthropicClient>, model: String) -> Self {
        Self {
            client,
            model,
            steps: Vec::new(),
            history: Vec::new(),
        }
    }

    /// Add a step to the chain (builder pattern)
    pub fn add_step(&mut self, step: ChainStep) -> &mut Self {
        self.steps.push(step);
        self
    }

    /// Execute the chain with initial context
    pub async fn execute(&mut self, mut context: HashMap<String, String>) -> Result<String> {
        let mut current_output = String::new();

        for step in &self.steps {
            // Format prompt with current context
            let prompt = (step.prompt_template)(&context);

            // Call LLM
            current_output = self
                .client
                .create_message(&prompt, &self.model)
                .await
                .context(format!("Failed to execute step: {}", step.name))?;

            // Validate if validator provided
            if let Some(validator) = &step.validator {
                if !validator(&current_output) {
                    anyhow::bail!(
                        "Step '{}' validation failed. Output: {}",
                        step.name,
                        &current_output[..current_output.len().min(100)]
                    );
                }
            }

            // Process if processor provided
            let processed_output = if let Some(processor) = &step.processor {
                processor(&current_output)
            } else {
                current_output.clone()
            };

            context.insert(step.name.clone(), processed_output);

            // Track history
            self.history.push(ChainHistory {
                step: step.name.clone(),
                prompt: prompt.clone(),
                output: current_output.clone(),
            });
        }

        Ok(current_output)
    }

    /// Get execution history
    pub fn history(&self) -> &[ChainHistory] {
        &self.history
    }
}

// Example usage
pub async fn example_document_generation() -> Result<()> {
    let api_key = std::env::var("ANTHROPIC_API_KEY")
        .context("ANTHROPIC_API_KEY environment variable not set")?;

    let client = Arc::new(AnthropicClient::new(api_key));
    let mut chain = PromptChain::new(client, "claude-3-5-sonnet-20241022".to_string());

    // Step 1: Generate outline
    chain.add_step(ChainStep {
        name: "outline".to_string(),
        prompt_template: Box::new(|ctx| {
            format!(
                "Create a detailed outline for an article about: {}",
                ctx.get("topic").unwrap_or(&"".to_string())
            )
        }),
        validator: Some(Box::new(|output| {
            output.contains("1.") && output.contains("2.")
        })),
        processor: None,
    });

    // Step 2: Expand outline
    chain.add_step(ChainStep {
        name: "draft".to_string(),
        prompt_template: Box::new(|ctx| {
            format!(
                "Expand this outline into a full article:\n{}\n\nWrite in a professional tone with clear examples.",
                ctx.get("outline").unwrap_or(&"".to_string())
            )
        }),
        validator: Some(Box::new(|output| output.split_whitespace().count() > 200)),
        processor: None,
    });

    // Step 3: Proofread
    chain.add_step(ChainStep {
        name: "final".to_string(),
        prompt_template: Box::new(|ctx| {
            format!(
                "Proofread and polish this article:\n{}\n\nFix any grammar, improve clarity, and ensure consistent tone.",
                ctx.get("draft").unwrap_or(&"".to_string())
            )
        }),
        validator: None,
        processor: None,
    });

    let mut context = HashMap::new();
    context.insert(
        "topic".to_string(),
        "Building Effective AI Agents".to_string(),
    );

    let result = chain.execute(context).await?;

    println!("Final Article:\n{}", result);

    println!("\n\nExecution History:");
    for entry in chain.history() {
        println!("\nStep: {}", entry.step);
        println!("Output length: {} chars", entry.output.len());
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_chain_execution() {
        // Mock client for testing
        // In real tests, use a mock HTTP server or test against real API
    }

    #[test]
    fn test_validator() {
        let validator = |output: &str| output.contains("1.") && output.contains("2.");
        assert!(validator("1. First item\n2. Second item"));
        assert!(!validator("No numbers here"));
    }
}
