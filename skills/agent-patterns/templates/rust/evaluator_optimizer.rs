/*!
 * Evaluator-Optimizer Pattern Implementation for Rust
 * Iterative refinement with generator and evaluator loop
 */

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
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
    temperature: Option<f64>,
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

/// Evaluation criteria with weight
#[derive(Debug, Clone)]
pub struct EvaluationCriterion {
    pub name: String,
    pub description: String,
    pub weight: f64,
}

/// Result of an evaluation
#[derive(Debug, Clone, Default)]
pub struct EvaluationResult {
    pub overall_score: f64,
    pub criteria_scores: std::collections::HashMap<String, f64>,
    pub feedback: String,
    pub suggestions: Vec<String>,
}

/// Iteration record for tracking progress
#[derive(Debug, Clone)]
pub struct IterationRecord {
    pub iteration: usize,
    pub output: String,
    pub evaluation: EvaluationResult,
}

/// Evaluator-Optimizer that iteratively refines output.
///
/// # Example
/// ```rust
/// let optimizer = EvaluatorOptimizer::new(client, "claude-sonnet-4-20250514".to_string());
/// optimizer.add_criterion(EvaluationCriterion {
///     name: "clarity".to_string(),
///     description: "Clear and understandable".to_string(),
///     weight: 1.5,
/// });
/// let result = optimizer.optimize("Write a blog post about AI", 3, 0.85).await?;
/// ```
pub struct EvaluatorOptimizer {
    client: Arc<AnthropicClient>,
    generator_model: String,
    evaluator_model: String,
    criteria: Vec<EvaluationCriterion>,
    history: Vec<IterationRecord>,
}

impl EvaluatorOptimizer {
    pub fn new(client: Arc<AnthropicClient>, model: String) -> Self {
        Self {
            client,
            generator_model: model.clone(),
            evaluator_model: model,
            criteria: Vec::new(),
            history: Vec::new(),
        }
    }

    pub fn with_evaluator_model(mut self, model: String) -> Self {
        self.evaluator_model = model;
        self
    }

    /// Add an evaluation criterion
    pub fn add_criterion(&mut self, criterion: EvaluationCriterion) -> &mut Self {
        self.criteria.push(criterion);
        self
    }

    /// Get iteration history
    pub fn history(&self) -> &[IterationRecord] {
        &self.history
    }

    /// Optimize output through iterative refinement
    pub async fn optimize(
        &mut self,
        task: &str,
        max_iterations: usize,
        score_threshold: f64,
    ) -> Result<OptimizationResult> {
        self.history.clear();
        let mut current_output = String::new();
        let mut last_evaluation: Option<EvaluationResult> = None;

        for i in 0..max_iterations {
            // Generate (or refine) output
            current_output = self
                .generate(task, &current_output, last_evaluation.as_ref())
                .await?;

            // Evaluate output
            let evaluation = self.evaluate(&current_output).await?;

            // Record iteration
            self.history.push(IterationRecord {
                iteration: i + 1,
                output: current_output.clone(),
                evaluation: evaluation.clone(),
            });

            // Check if we've met the threshold
            if evaluation.overall_score >= score_threshold {
                return Ok(OptimizationResult {
                    final_output: current_output,
                    final_score: evaluation.overall_score,
                    iterations: i + 1,
                    met_threshold: true,
                    history: self.history.clone(),
                });
            }

            last_evaluation = Some(evaluation);
        }

        // Return best result after max iterations
        let best = self
            .history
            .iter()
            .max_by(|a, b| {
                a.evaluation
                    .overall_score
                    .partial_cmp(&b.evaluation.overall_score)
                    .unwrap()
            })
            .unwrap();

        Ok(OptimizationResult {
            final_output: best.output.clone(),
            final_score: best.evaluation.overall_score,
            iterations: max_iterations,
            met_threshold: false,
            history: self.history.clone(),
        })
    }

    /// Generate or refine output
    async fn generate(
        &self,
        task: &str,
        previous_output: &str,
        previous_evaluation: Option<&EvaluationResult>,
    ) -> Result<String> {
        let prompt = if previous_output.is_empty() {
            format!(
                r#"Complete this task:

{}

Provide your best output:"#,
                task
            )
        } else {
            let feedback_text = if let Some(eval) = previous_evaluation {
                let suggestions: String = eval
                    .suggestions
                    .iter()
                    .map(|s| format!("- {}", s))
                    .collect::<Vec<_>>()
                    .join("\n");
                format!(
                    r#"Previous evaluation feedback:
{}

Specific suggestions:
{}"#,
                    eval.feedback, suggestions
                )
            } else {
                String::new()
            };

            format!(
                r#"Improve this output based on the feedback:

Original task: {}

Previous output:
{}

{}

Provide an improved version:"#,
                task, previous_output, feedback_text
            )
        };

        self.client
            .create_message(&prompt, &self.generator_model, 4096, None)
            .await
    }

    /// Evaluate output against criteria
    async fn evaluate(&self, output: &str) -> Result<EvaluationResult> {
        let criteria_list = if !self.criteria.is_empty() {
            self.criteria
                .iter()
                .map(|c| format!("- {} (weight: {}): {}", c.name, c.weight, c.description))
                .collect::<Vec<_>>()
                .join("\n")
        } else {
            "- quality: Overall quality and correctness\n\
             - clarity: Clear and understandable\n\
             - completeness: Addresses all aspects"
                .to_string()
        };

        let prompt = format!(
            r#"Evaluate this output against the following criteria:

{}

Output to evaluate:
{}

Respond with JSON in this exact format:
{{
    "overall_score": 0.0-1.0,
    "criteria_scores": {{
        "criterion_name": 0.0-1.0
    }},
    "feedback": "Overall assessment",
    "suggestions": ["specific improvement 1", "specific improvement 2"]
}}"#,
            criteria_list, output
        );

        let response = self
            .client
            .create_message(&prompt, &self.evaluator_model, 1024, None)
            .await?;

        parse_evaluation_json(&response)
    }
}

fn parse_evaluation_json(json: &str) -> Result<EvaluationResult> {
    let mut result = EvaluationResult::default();

    // Extract overall score
    if let Some(score) = extract_json_number(json, "overall_score") {
        result.overall_score = score;
    }

    // Extract feedback
    if let Some(feedback) = extract_json_string(json, "feedback") {
        result.feedback = feedback;
    }

    // Extract suggestions
    if let Some(suggestions_match) = regex::Regex::new(r#""suggestions"\s*:\s*\[(.*?)\]"#)
        .ok()
        .and_then(|re| re.captures(json))
    {
        let suggestions_str = &suggestions_match[1];
        result.suggestions = regex::Regex::new(r#""([^"]+)""#)
            .ok()
            .map(|re| {
                re.captures_iter(suggestions_str)
                    .map(|c| c[1].to_string())
                    .collect()
            })
            .unwrap_or_default();
    }

    Ok(result)
}

fn extract_json_string(json: &str, key: &str) -> Option<String> {
    let pattern = format!(r#""{}":\s*"([^"]*)""#, key);
    regex::Regex::new(&pattern)
        .ok()?
        .captures(json)
        .map(|c| c[1].to_string())
}

fn extract_json_number(json: &str, key: &str) -> Option<f64> {
    let pattern = format!(r#""{}":\s*([0-9.]+)"#, key);
    regex::Regex::new(&pattern)
        .ok()?
        .captures(json)
        .and_then(|c| c[1].parse().ok())
}

#[derive(Debug)]
pub struct OptimizationResult {
    pub final_output: String,
    pub final_score: f64,
    pub iterations: usize,
    pub met_threshold: bool,
    pub history: Vec<IterationRecord>,
}

/// Confidence-based optimizer
pub struct ConfidenceBasedOptimizer {
    client: Arc<AnthropicClient>,
    model: String,
}

impl ConfidenceBasedOptimizer {
    pub fn new(client: Arc<AnthropicClient>, model: String) -> Self {
        Self { client, model }
    }

    /// Generate with confidence self-assessment
    pub async fn generate_with_confidence(
        &self,
        task: &str,
        confidence_threshold: f64,
        max_attempts: usize,
    ) -> Result<ConfidenceResult> {
        let mut attempts = Vec::new();
        let mut best_output = String::new();
        let mut best_confidence = 0.0;

        for i in 0..max_attempts {
            let prompt = format!(
                r#"Complete this task and assess your confidence:

{}

After your response, on a new line, provide your confidence level (0.0-1.0) that your answer is correct and complete.

Format:
[Your response here]

CONFIDENCE: [0.0-1.0]"#,
                task
            );

            let temperature = if i == 0 { None } else { Some(0.3) };
            let response = self
                .client
                .create_message(&prompt, &self.model, 4096, temperature)
                .await?;

            let (output, confidence) = parse_confidence_response(&response);

            attempts.push(AttemptRecord {
                attempt: i + 1,
                output: output.clone(),
                confidence,
            });

            if confidence > best_confidence {
                best_confidence = confidence;
                best_output = output.clone();
            }

            if confidence >= confidence_threshold {
                return Ok(ConfidenceResult {
                    output,
                    confidence,
                    attempts,
                    met_threshold: true,
                });
            }
        }

        Ok(ConfidenceResult {
            output: best_output,
            confidence: best_confidence,
            attempts,
            met_threshold: false,
        })
    }
}

fn parse_confidence_response(text: &str) -> (String, f64) {
    let confidence = regex::Regex::new(r"(?i)CONFIDENCE:\s*([0-9.]+)")
        .ok()
        .and_then(|re| re.captures(text))
        .and_then(|c| c[1].parse::<f64>().ok())
        .map(|v| v.clamp(0.0, 1.0))
        .unwrap_or(0.5);

    let output = regex::Regex::new(r"(?i)\nCONFIDENCE:\s*[0-9.]+")
        .ok()
        .map(|re| re.replace_all(text, "").trim().to_string())
        .unwrap_or_else(|| text.to_string());

    (output, confidence)
}

#[derive(Debug)]
pub struct ConfidenceResult {
    pub output: String,
    pub confidence: f64,
    pub attempts: Vec<AttemptRecord>,
    pub met_threshold: bool,
}

#[derive(Debug)]
pub struct AttemptRecord {
    pub attempt: usize,
    pub output: String,
    pub confidence: f64,
}

// Example usage
pub async fn example_writing_optimization() -> Result<()> {
    let api_key = std::env::var("ANTHROPIC_API_KEY")
        .context("ANTHROPIC_API_KEY environment variable not set")?;

    let client = Arc::new(AnthropicClient::new(api_key));
    let mut optimizer = EvaluatorOptimizer::new(client, "claude-sonnet-4-20250514".to_string());

    // Add evaluation criteria
    optimizer
        .add_criterion(EvaluationCriterion {
            name: "clarity".to_string(),
            description: "Writing is clear and easy to understand".to_string(),
            weight: 1.5,
        })
        .add_criterion(EvaluationCriterion {
            name: "engagement".to_string(),
            description: "Content is engaging and holds attention".to_string(),
            weight: 1.2,
        })
        .add_criterion(EvaluationCriterion {
            name: "accuracy".to_string(),
            description: "Information is accurate and well-researched".to_string(),
            weight: 1.5,
        });

    let result = optimizer
        .optimize(
            "Write a blog post explaining how large language models work to a non-technical audience",
            3,
            0.85,
        )
        .await?;

    println!("=== Optimization Results ===");
    println!("Iterations: {}", result.iterations);
    println!("Final Score: {:.1}%", result.final_score * 100.0);
    println!("Met Threshold: {}", result.met_threshold);

    println!("\n=== Score Progress ===");
    for iteration in &result.history {
        println!(
            "Iteration {}: {:.1}%",
            iteration.iteration,
            iteration.evaluation.overall_score * 100.0
        );
    }

    println!("\n=== Final Output ===\n{}", result.final_output);

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_confidence() {
        let text = "Here is my answer.\n\nCONFIDENCE: 0.85";
        let (output, confidence) = parse_confidence_response(text);
        assert!(!output.contains("CONFIDENCE"));
        assert!((confidence - 0.85).abs() < 0.01);
    }

    #[test]
    fn test_evaluation_criterion() {
        let criterion = EvaluationCriterion {
            name: "test".to_string(),
            description: "Test criterion".to_string(),
            weight: 1.0,
        };
        assert_eq!(criterion.name, "test");
    }
}
