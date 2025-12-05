/*!
 * Autonomous Agent Pattern Implementation for Rust
 * Open-ended exploration with tool usage
 */

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
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

    pub async fn create_message_with_system(
        &self,
        messages: Vec<MessageContent>,
        model: &str,
        max_tokens: u32,
        system: Option<&str>,
    ) -> Result<String> {
        let request = MessageRequest {
            model: model.to_string(),
            max_tokens,
            messages,
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

/// Parameter definition for a tool
#[derive(Debug, Clone)]
pub struct ParameterDef {
    pub param_type: String,
    pub description: String,
    pub required: bool,
}

/// Tool definition for the agent
pub struct AgentTool {
    pub name: String,
    pub description: String,
    pub parameters: HashMap<String, ParameterDef>,
    pub handler: Box<
        dyn Fn(HashMap<String, serde_json::Value>) -> Pin<Box<dyn Future<Output = Result<String>> + Send>>
            + Send
            + Sync,
    >,
}

/// Action record in the history
#[derive(Debug, Clone)]
pub struct ActionRecord {
    pub step: usize,
    pub action_type: String,
    pub tool_name: Option<String>,
    pub tool_args: Option<HashMap<String, serde_json::Value>>,
    pub tool_result: Option<String>,
    pub thought: Option<String>,
}

/// Agent state tracking
#[derive(Debug, Default)]
pub struct AgentState {
    pub total_steps: usize,
    pub tool_calls: usize,
    pub action_history: Vec<ActionRecord>,
    pub is_complete: bool,
    pub final_result: Option<String>,
}

/// Parsed action from LLM response
#[derive(Debug, Deserialize)]
struct AgentAction {
    thought: Option<String>,
    action: Option<String>,
    args: Option<HashMap<String, serde_json::Value>>,
    result: Option<String>,
}

/// Autonomous agent that can explore and use tools.
///
/// # Example
/// ```rust
/// let agent = AutonomousAgent::new(client, "claude-sonnet-4-20250514".to_string());
/// agent.register_tool(AgentTool {
///     name: "search".to_string(),
///     description: "Search for information".to_string(),
///     parameters: HashMap::new(),
///     handler: Box::new(|args| Box::pin(search(args))),
/// });
/// let result = agent.run("Find information about AI safety", 10).await?;
/// ```
pub struct AutonomousAgent {
    client: Arc<AnthropicClient>,
    model: String,
    tools: HashMap<String, AgentTool>,
    state: AgentState,
    conversation_history: Vec<MessageContent>,
}

impl AutonomousAgent {
    pub fn new(client: Arc<AnthropicClient>, model: String) -> Self {
        Self {
            client,
            model,
            tools: HashMap::new(),
            state: AgentState::default(),
            conversation_history: Vec::new(),
        }
    }

    /// Register a tool for the agent to use
    pub fn register_tool(&mut self, tool: AgentTool) -> &mut Self {
        self.tools.insert(tool.name.clone(), tool);
        self
    }

    /// Get current state
    pub fn state(&self) -> &AgentState {
        &self.state
    }

    /// Run the agent on a task
    pub async fn run(
        &mut self,
        task: &str,
        max_steps: usize,
    ) -> Result<AgentResult> {
        self.run_with_stop(task, max_steps, |_| false).await
    }

    /// Run with custom stopping condition
    pub async fn run_with_stop<F>(
        &mut self,
        task: &str,
        max_steps: usize,
        should_stop: F,
    ) -> Result<AgentResult>
    where
        F: Fn(&AgentState) -> bool,
    {
        // Reset state
        self.state = AgentState::default();
        self.conversation_history.clear();

        // Build system prompt
        let system_prompt = self.build_system_prompt();

        // Add initial user message
        self.conversation_history.push(MessageContent {
            role: "user".to_string(),
            content: format!("Task: {}", task),
        });

        while self.state.total_steps < max_steps && !self.state.is_complete {
            self.state.total_steps += 1;

            // Check custom stopping condition
            if should_stop(&self.state) {
                break;
            }

            // Get next action from LLM
            let response = self
                .client
                .create_message_with_system(
                    self.conversation_history.clone(),
                    &self.model,
                    2048,
                    Some(&system_prompt),
                )
                .await?;

            // Process the response
            self.process_response(&response).await?;
        }

        Ok(AgentResult {
            success: self.state.is_complete,
            final_result: self
                .state
                .final_result
                .clone()
                .unwrap_or_else(|| "Task not completed within step limit".to_string()),
            total_steps: self.state.total_steps,
            tool_calls: self.state.tool_calls,
            action_history: self.state.action_history.clone(),
        })
    }

    fn build_system_prompt(&self) -> String {
        let tool_descriptions: String = self
            .tools
            .values()
            .map(|t| {
                let params: String = t
                    .parameters
                    .iter()
                    .map(|(k, v)| format!("{}: {} ({})", k, v.param_type, v.description))
                    .collect::<Vec<_>>()
                    .join(", ");
                format!("- {}({}): {}", t.name, params, t.description)
            })
            .collect::<Vec<_>>()
            .join("\n");

        format!(
            r#"You are an autonomous agent that can use tools to complete tasks.

Available tools:
{}

To use a tool, respond with JSON in this format:
{{
    "thought": "Your reasoning about what to do next",
    "action": "tool_name",
    "args": {{ "param": "value" }}
}}

When you have completed the task, respond with:
{{
    "thought": "Task is complete because...",
    "action": "complete",
    "result": "Your final answer"
}}

Always think step by step and use tools to gather information before providing a final answer."#,
            tool_descriptions
        )
    }

    async fn process_response(&mut self, response: &str) -> Result<()> {
        // Try to parse as JSON action
        let json = self.clean_json(response);

        match serde_json::from_str::<AgentAction>(&json) {
            Ok(action) => {
                // Record the thought
                if let Some(thought) = &action.thought {
                    self.state.action_history.push(ActionRecord {
                        step: self.state.total_steps,
                        action_type: "thought".to_string(),
                        tool_name: None,
                        tool_args: None,
                        tool_result: None,
                        thought: Some(thought.clone()),
                    });
                }

                // Check if task is complete
                if action.action.as_deref() == Some("complete") {
                    self.state.is_complete = true;
                    self.state.final_result = action.result.or_else(|| Some(response.to_string()));
                    return Ok(());
                }

                // Execute tool
                if let Some(action_name) = &action.action {
                    if let Some(tool) = self.tools.get(action_name) {
                        self.state.tool_calls += 1;
                        let args = action.args.clone().unwrap_or_default();

                        let tool_result = match (tool.handler)(args.clone()).await {
                            Ok(result) => result,
                            Err(e) => format!("Error: {}", e),
                        };

                        // Record tool call
                        self.state.action_history.push(ActionRecord {
                            step: self.state.total_steps,
                            action_type: "tool_call".to_string(),
                            tool_name: Some(action_name.clone()),
                            tool_args: Some(args),
                            tool_result: Some(tool_result.clone()),
                            thought: None,
                        });

                        // Add to conversation history
                        self.conversation_history.push(MessageContent {
                            role: "assistant".to_string(),
                            content: response.to_string(),
                        });
                        self.conversation_history.push(MessageContent {
                            role: "user".to_string(),
                            content: format!("Tool result: {}", tool_result),
                        });
                    } else {
                        // Unknown action
                        let tool_names: String = self.tools.keys().cloned().collect::<Vec<_>>().join(", ");
                        self.conversation_history.push(MessageContent {
                            role: "assistant".to_string(),
                            content: response.to_string(),
                        });
                        self.conversation_history.push(MessageContent {
                            role: "user".to_string(),
                            content: format!(
                                "Unknown action: {}. Available tools: {}",
                                action_name, tool_names
                            ),
                        });
                    }
                }
            }
            Err(_) => {
                // Non-JSON response
                self.conversation_history.push(MessageContent {
                    role: "assistant".to_string(),
                    content: response.to_string(),
                });
                self.conversation_history.push(MessageContent {
                    role: "user".to_string(),
                    content: "Please respond with a JSON action or mark the task as complete.".to_string(),
                });

                self.state.action_history.push(ActionRecord {
                    step: self.state.total_steps,
                    action_type: "text_response".to_string(),
                    tool_name: None,
                    tool_args: None,
                    tool_result: None,
                    thought: Some(response.chars().take(200).collect()),
                });
            }
        }

        Ok(())
    }

    fn clean_json(&self, text: &str) -> String {
        if text.contains("```") {
            // Extract JSON from code block
            let start = text.find('{').unwrap_or(0);
            let end = text.rfind('}').map(|i| i + 1).unwrap_or(text.len());
            text[start..end].to_string()
        } else {
            text.to_string()
        }
    }
}

#[derive(Debug)]
pub struct AgentResult {
    pub success: bool,
    pub final_result: String,
    pub total_steps: usize,
    pub tool_calls: usize,
    pub action_history: Vec<ActionRecord>,
}

// Example usage
pub async fn example_research_agent() -> Result<()> {
    let api_key = std::env::var("ANTHROPIC_API_KEY")
        .context("ANTHROPIC_API_KEY environment variable not set")?;

    let client = Arc::new(AnthropicClient::new(api_key));
    let mut agent = AutonomousAgent::new(client, "claude-sonnet-4-20250514".to_string());

    // Register tools
    agent.register_tool(AgentTool {
        name: "search".to_string(),
        description: "Search for information on a topic".to_string(),
        parameters: {
            let mut params = HashMap::new();
            params.insert(
                "query".to_string(),
                ParameterDef {
                    param_type: "string".to_string(),
                    description: "Search query".to_string(),
                    required: true,
                },
            );
            params
        },
        handler: Box::new(|args| {
            Box::pin(async move {
                let query = args
                    .get("query")
                    .and_then(|v| v.as_str())
                    .unwrap_or("unknown");
                // Mock search - use actual search API in production
                Ok(format!(
                    "Search results for '{}':\n1. Result about {}\n2. More info on {}",
                    query, query, query
                ))
            })
        }),
    });

    agent.register_tool(AgentTool {
        name: "read_url".to_string(),
        description: "Read content from a URL".to_string(),
        parameters: {
            let mut params = HashMap::new();
            params.insert(
                "url".to_string(),
                ParameterDef {
                    param_type: "string".to_string(),
                    description: "URL to read".to_string(),
                    required: true,
                },
            );
            params
        },
        handler: Box::new(|args| {
            Box::pin(async move {
                let url = args.get("url").and_then(|v| v.as_str()).unwrap_or("unknown");
                Ok(format!("Content from {}: [Mock content about the topic]", url))
            })
        }),
    });

    agent.register_tool(AgentTool {
        name: "write_note".to_string(),
        description: "Save a note for later reference".to_string(),
        parameters: {
            let mut params = HashMap::new();
            params.insert(
                "title".to_string(),
                ParameterDef {
                    param_type: "string".to_string(),
                    description: "Note title".to_string(),
                    required: true,
                },
            );
            params.insert(
                "content".to_string(),
                ParameterDef {
                    param_type: "string".to_string(),
                    description: "Note content".to_string(),
                    required: true,
                },
            );
            params
        },
        handler: Box::new(|args| {
            Box::pin(async move {
                let title = args.get("title").and_then(|v| v.as_str()).unwrap_or("Untitled");
                Ok(format!("Note saved: {}", title))
            })
        }),
    });

    let result = agent
        .run("Research the current state of quantum computing and summarize key developments", 8)
        .await?;

    println!("=== Agent Results ===");
    println!("Success: {}", result.success);
    println!("Steps: {}", result.total_steps);
    println!("Tool Calls: {}", result.tool_calls);

    println!("\n=== Action History ===");
    for action in &result.action_history {
        println!(
            "Step {} [{}]: {}",
            action.step,
            action.action_type,
            action.thought.as_deref().unwrap_or(action.tool_name.as_deref().unwrap_or(""))
        );
        if let Some(ref result) = action.tool_result {
            let preview: String = result.chars().take(100).collect();
            println!("  Result: {}...", preview);
        }
    }

    println!("\n=== Final Result ===\n{}", result.final_result);

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_state_default() {
        let state = AgentState::default();
        assert_eq!(state.total_steps, 0);
        assert!(!state.is_complete);
    }

    #[test]
    fn test_parameter_def() {
        let param = ParameterDef {
            param_type: "string".to_string(),
            description: "Test param".to_string(),
            required: true,
        };
        assert!(param.required);
    }
}
