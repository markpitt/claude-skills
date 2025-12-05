/*!
 * Routing Pattern Implementation for Rust
 * Classifying inputs and directing to specialized handlers
 */

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

/// Anthropic API client (simplified)
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

    pub async fn create_message(&self, prompt: &str, model: &str, max_tokens: u32) -> Result<String> {
        let request = MessageRequest {
            model: model.to_string(),
            max_tokens,
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

/// Classification result
#[derive(Debug, Clone)]
pub struct ClassificationResult {
    pub category: String,
    pub confidence: f64,
    pub reasoning: String,
}

/// Route definition
pub struct Route<T> {
    pub category: String,
    pub description: String,
    pub handler: Box<dyn Fn(String) -> Pin<Box<dyn Future<Output = Result<T>> + Send>> + Send + Sync>,
}

/// Router that classifies inputs and directs them to specialized handlers.
///
/// # Example
/// ```rust
/// let router = Router::new(client, "claude-sonnet-4-20250514".to_string());
/// router.add_route(Route {
///     category: "technical".to_string(),
///     description: "Technical issues".to_string(),
///     handler: Box::new(|input| Box::pin(handle_technical(input))),
/// });
/// let (result, classification) = router.route("My app crashed").await?;
/// ```
pub struct Router<T> {
    client: Arc<AnthropicClient>,
    model: String,
    routes: HashMap<String, Route<T>>,
    fallback: Option<Box<dyn Fn(String) -> Pin<Box<dyn Future<Output = Result<T>> + Send>> + Send + Sync>>,
}

impl<T> Router<T> {
    pub fn new(client: Arc<AnthropicClient>, model: String) -> Self {
        Self {
            client,
            model,
            routes: HashMap::new(),
            fallback: None,
        }
    }

    /// Add a route with its handler
    pub fn add_route(&mut self, route: Route<T>) -> &mut Self {
        self.routes.insert(route.category.clone(), route);
        self
    }

    /// Set fallback handler
    pub fn set_fallback(
        &mut self,
        handler: Box<dyn Fn(String) -> Pin<Box<dyn Future<Output = Result<T>> + Send>> + Send + Sync>,
    ) -> &mut Self {
        self.fallback = Some(handler);
        self
    }

    /// Classify input and route to appropriate handler
    pub async fn route(
        &self,
        input: &str,
        confidence_threshold: f64,
    ) -> Result<(T, ClassificationResult)> {
        let classification = self.classify(input).await?;

        if classification.confidence < confidence_threshold {
            if let Some(ref fallback) = self.fallback {
                let result = fallback(input.to_string()).await?;
                return Ok((result, classification));
            }
            anyhow::bail!(
                "Low confidence ({:.2}) and no fallback handler set",
                classification.confidence
            );
        }

        if let Some(route) = self.routes.get(&classification.category) {
            let result = (route.handler)(input.to_string()).await?;
            Ok((result, classification))
        } else if let Some(ref fallback) = self.fallback {
            let result = fallback(input.to_string()).await?;
            Ok((result, classification))
        } else {
            anyhow::bail!("No handler for category: {}", classification.category)
        }
    }

    /// Classify input into a category
    pub async fn classify(&self, input: &str) -> Result<ClassificationResult> {
        let categories: Vec<String> = self
            .routes
            .values()
            .map(|r| format!("- {}: {}", r.category, r.description))
            .collect();

        let prompt = format!(
            r#"Classify the following input into one of these categories:
{}

Input: {}

Respond with JSON in this exact format:
{{
    "category": "<category_name>",
    "confidence": <0.0-1.0>,
    "reasoning": "<brief explanation>"
}}"#,
            categories.join("\n"),
            input
        );

        let response = self.client.create_message(&prompt, &self.model, 256).await?;
        parse_classification_json(&response)
    }
}

fn parse_classification_json(json: &str) -> Result<ClassificationResult> {
    // Simple regex-based parsing (use serde_json in production)
    let category = extract_json_string(json, "category").unwrap_or_default();
    let confidence = extract_json_number(json, "confidence").unwrap_or(0.5);
    let reasoning = extract_json_string(json, "reasoning").unwrap_or_default();

    Ok(ClassificationResult {
        category,
        confidence,
        reasoning,
    })
}

fn extract_json_string(json: &str, key: &str) -> Option<String> {
    let pattern = format!(r#""{}":\s*"([^"]*)""#, key);
    let re = regex::Regex::new(&pattern).ok()?;
    re.captures(json).map(|c| c[1].to_string())
}

fn extract_json_number(json: &str, key: &str) -> Option<f64> {
    let pattern = format!(r#""{}":\s*([0-9.]+)"#, key);
    let re = regex::Regex::new(&pattern).ok()?;
    re.captures(json)
        .and_then(|c| c[1].parse::<f64>().ok())
}

/// Model-based routing by task complexity
pub struct ModelRouter {
    client: Arc<AnthropicClient>,
    classification_model: String,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Complexity {
    Simple,
    Moderate,
    Complex,
}

impl ModelRouter {
    pub fn new(client: Arc<AnthropicClient>, classification_model: String) -> Self {
        Self {
            client,
            classification_model,
        }
    }

    /// Route to appropriate model based on task complexity
    pub async fn route_by_complexity(&self, input: &str) -> Result<String> {
        let complexity = self.assess_complexity(input).await?;

        let model = match complexity {
            Complexity::Simple => "claude-3-haiku-20240307",
            Complexity::Moderate => "claude-sonnet-4-20250514",
            Complexity::Complex => "claude-opus-4-20250514",
        };

        self.client.create_message(input, model, 4096).await
    }

    async fn assess_complexity(&self, input: &str) -> Result<Complexity> {
        let prompt = format!(
            r#"Assess the complexity of this task on a scale:
- Simple: Factual lookup, simple formatting, basic questions
- Moderate: Analysis, summarization, code review
- Complex: Multi-step reasoning, creative writing, complex coding

Task: {}

Respond with just one word: Simple, Moderate, or Complex"#,
            input
        );

        let response = self
            .client
            .create_message(&prompt, &self.classification_model, 10)
            .await?;

        Ok(match response.to_lowercase().trim() {
            "simple" => Complexity::Simple,
            "complex" => Complexity::Complex,
            _ => Complexity::Moderate,
        })
    }
}

// Example usage
pub async fn example_customer_service() -> Result<()> {
    let api_key = std::env::var("ANTHROPIC_API_KEY")
        .context("ANTHROPIC_API_KEY environment variable not set")?;

    let client = Arc::new(AnthropicClient::new(api_key));
    let mut router: Router<String> = Router::new(client.clone(), "claude-sonnet-4-20250514".to_string());

    // Add routes
    router.add_route(Route {
        category: "technical".to_string(),
        description: "Technical issues, bugs, errors".to_string(),
        handler: Box::new(move |input| {
            let client = client.clone();
            Box::pin(async move {
                client
                    .create_message(
                        &format!(
                            "You are a technical support specialist. Help with: {}",
                            input
                        ),
                        "claude-sonnet-4-20250514",
                        1024,
                    )
                    .await
            })
        }),
    });

    let client2 = Arc::new(AnthropicClient::new(
        std::env::var("ANTHROPIC_API_KEY").unwrap(),
    ));
    router.add_route(Route {
        category: "billing".to_string(),
        description: "Billing, payments, subscriptions".to_string(),
        handler: Box::new(move |input| {
            let client = client2.clone();
            Box::pin(async move {
                client
                    .create_message(
                        &format!(
                            "You are a billing support specialist. Help with: {}",
                            input
                        ),
                        "claude-sonnet-4-20250514",
                        1024,
                    )
                    .await
            })
        }),
    });

    // Route a request
    let (response, classification) = router
        .route("My card was charged twice", 0.7)
        .await?;

    println!("Category: {}", classification.category);
    println!("Confidence: {:.2}", classification.confidence);
    println!("Response: {}", response);

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_classification() {
        let json = r#"{"category": "technical", "confidence": 0.85, "reasoning": "test"}"#;
        let result = parse_classification_json(json).unwrap();
        assert_eq!(result.category, "technical");
        assert!((result.confidence - 0.85).abs() < 0.01);
    }

    #[test]
    fn test_complexity_enum() {
        assert_ne!(Complexity::Simple, Complexity::Complex);
    }
}
