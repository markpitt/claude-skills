/**
 * Evaluator-Optimizer Pattern Implementation
 * One LLM generates while another evaluates and provides feedback for iterative refinement
 */

import Anthropic from "@anthropic-ai/sdk";

interface EvaluationCriteria {
  name: string;
  description: string;
  weight: number; // 0-1
  threshold: number; // Minimum acceptable score (out of 10)
}

interface EvaluationResult {
  scores: Record<string, number>;
  overallScore: number;
  feedback: string;
  acceptable: boolean;
  needsImprovement: string[];
}

interface RefinementResult {
  finalOutput: string;
  iterations: number;
  initialScore: number;
  finalScore: number;
  history: Array<{
    iteration: number;
    output: string;
    evaluation: {
      scores: Record<string, number>;
      overallScore: number;
      feedback: string;
    };
  }>;
}

/**
 * Iterative refinement with separate generator and evaluator.
 *
 * From Anthropic blog: "This workflow is particularly effective when we have
 * clear evaluation criteria, and when iterative refinement provides measurable value."
 */
class EvaluatorOptimizer {
  private client: Anthropic;
  private generatorModel: string;
  private evaluatorModel: string;
  private criteria: EvaluationCriteria[] = [];
  private history: RefinementResult["history"] = [];

  constructor(
    client: Anthropic,
    generatorModel: string = "claude-sonnet-4-20250514",
    evaluatorModel: string = "claude-sonnet-4-20250514"
  ) {
    this.client = client;
    this.generatorModel = generatorModel;
    this.evaluatorModel = evaluatorModel;
  }

  addCriterion(
    name: string,
    description: string,
    weight: number = 1.0,
    threshold: number = 7.0
  ): EvaluatorOptimizer {
    this.criteria.push({ name, description, weight, threshold });
    return this;
  }

  private async generate(
    prompt: string,
    context?: string,
    feedback?: string
  ): Promise<string> {
    let fullPrompt: string;

    if (feedback) {
      fullPrompt = `Improve this content based on the feedback provided.

Original prompt: ${prompt}

Previous version:
${context}

Feedback for improvement:
${feedback}

Generate an improved version that addresses all feedback points.`;
    } else {
      fullPrompt = `Generate high-quality content for the following:

${prompt}

Focus on quality, clarity, and accuracy.`;
    }

    const message = await this.client.messages.create({
      model: this.generatorModel,
      max_tokens: 4096,
      messages: [{ role: "user", content: fullPrompt }],
    });

    return message.content[0].type === "text" ? message.content[0].text : "";
  }

  private async evaluate(
    content: string,
    originalPrompt: string
  ): Promise<EvaluationResult> {
    const criteriaText = this.criteria
      .map(
        (c) =>
          `- ${c.name}: ${c.description} (threshold: ${c.threshold}/10, weight: ${c.weight})`
      )
      .join("\n");

    const evalPrompt = `Evaluate the following content against these criteria:

${criteriaText}

Original task:
${originalPrompt}

Content to evaluate:
${content}

Provide your evaluation as JSON:
{
    "scores": {
        "criterion_name": score_out_of_10,
        ...
    },
    "feedback": "Specific, actionable feedback on how to improve",
    "strengths": ["List of strengths"],
    "weaknesses": ["List of areas needing improvement"]
}`;

    const message = await this.client.messages.create({
      model: this.evaluatorModel,
      max_tokens: 2048,
      messages: [{ role: "user", content: evalPrompt }],
    });

    let responseText =
      message.content[0].type === "text" ? message.content[0].text : "{}";

    // Handle markdown code blocks
    if (responseText.includes("```json")) {
      responseText = responseText.split("```json")[1].split("```")[0];
    } else if (responseText.includes("```")) {
      responseText = responseText.split("```")[1].split("```")[0];
    }

    const result = JSON.parse(responseText.trim());

    // Calculate overall score (weighted average)
    const totalWeight = this.criteria.reduce((sum, c) => sum + c.weight, 0);
    const overallScore =
      this.criteria.reduce(
        (sum, c) => sum + (result.scores[c.name] || 0) * c.weight,
        0
      ) / totalWeight;

    // Determine which criteria need improvement
    const needsImprovement = this.criteria
      .filter((c) => (result.scores[c.name] || 0) < c.threshold)
      .map((c) => c.name);

    return {
      scores: result.scores,
      overallScore,
      feedback: result.feedback,
      acceptable: needsImprovement.length === 0,
      needsImprovement,
    };
  }

  async refine(
    prompt: string,
    options: {
      maxIterations?: number;
      targetScore?: number;
      stopOnNoImprovement?: boolean;
    } = {}
  ): Promise<RefinementResult> {
    const {
      maxIterations = 3,
      targetScore = 8.0,
      stopOnNoImprovement = true,
    } = options;

    this.history = [];

    // Initial generation
    let output = await this.generate(prompt);
    let evaluation = await this.evaluate(output, prompt);

    const initialScore = evaluation.overallScore;
    let previousScore = initialScore;

    this.history.push({
      iteration: 0,
      output,
      evaluation: {
        scores: evaluation.scores,
        overallScore: evaluation.overallScore,
        feedback: evaluation.feedback,
      },
    });

    let iteration = 0;
    while (iteration < maxIterations) {
      // Check if we've reached target score
      if (evaluation.overallScore >= targetScore) {
        break;
      }

      // Check if acceptable
      if (evaluation.acceptable) {
        break;
      }

      // Generate improved version
      output = await this.generate(prompt, output, evaluation.feedback);

      // Evaluate new version
      evaluation = await this.evaluate(output, prompt);

      iteration++;

      this.history.push({
        iteration,
        output,
        evaluation: {
          scores: evaluation.scores,
          overallScore: evaluation.overallScore,
          feedback: evaluation.feedback,
        },
      });

      // Check for improvement stagnation
      if (stopOnNoImprovement) {
        const improvement = evaluation.overallScore - previousScore;
        if (improvement < 0.1) {
          break;
        }
      }

      previousScore = evaluation.overallScore;
    }

    return {
      finalOutput: output,
      iterations: iteration + 1,
      initialScore,
      finalScore: evaluation.overallScore,
      history: this.history,
    };
  }
}

/**
 * Confidence-based optimizer that continues until confidence threshold is met.
 */
class ConfidenceBasedOptimizer {
  private client: Anthropic;
  private model: string;

  constructor(client: Anthropic, model: string = "claude-sonnet-4-20250514") {
    this.client = client;
    this.model = model;
  }

  private async generateWithConfidence(
    prompt: string,
    previous?: string,
    feedback?: string
  ): Promise<[string, number]> {
    let fullPrompt: string;

    if (feedback) {
      fullPrompt = `Improve based on feedback:
${feedback}

Previous: ${previous}

Original task: ${prompt}

After generating, rate your confidence (0.0-1.0) that this fully addresses the task.`;
    } else {
      fullPrompt = `${prompt}

After generating, rate your confidence (0.0-1.0) that this fully addresses the task.

Format:
[Your response here]

CONFIDENCE: [0.0-1.0]`;
    }

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: fullPrompt }],
    });

    let response =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract confidence score
    let confidence = 0.5;
    if (response.includes("CONFIDENCE:")) {
      try {
        const confStr = response.split("CONFIDENCE:")[1].trim();
        confidence = parseFloat(confStr.split(/\s/)[0]);
      } catch {
        // Keep default
      }
      response = response.split("CONFIDENCE:")[0].trim();
    }

    return [response, confidence];
  }

  private async evaluate(
    content: string,
    prompt: string
  ): Promise<[number, string]> {
    const evalPrompt = `Evaluate this content for the task: ${prompt}

Content:
${content}

Provide:
1. Confidence score (0.0-1.0) that this is a high-quality response
2. Specific feedback for improvement

Format:
SCORE: [0.0-1.0]
FEEDBACK: [Your feedback]`;

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: "user", content: evalPrompt }],
    });

    const response =
      message.content[0].type === "text" ? message.content[0].text : "";

    let score = 0.5;
    let feedback = "";

    if (response.includes("SCORE:")) {
      try {
        const scoreStr = response.split("SCORE:")[1].split("\n")[0].trim();
        score = parseFloat(scoreStr);
      } catch {
        // Keep default
      }
    }

    if (response.includes("FEEDBACK:")) {
      feedback = response.split("FEEDBACK:")[1].trim();
    }

    return [score, feedback];
  }

  async refineUntilConfident(
    prompt: string,
    targetConfidence: number = 0.85,
    maxIterations: number = 5
  ): Promise<{
    output: string;
    confidence: number;
    iterations: number;
    finalFeedback: string;
  }> {
    let [output, selfConfidence] = await this.generateWithConfidence(prompt);
    let [score, feedback] = await this.evaluate(output, prompt);

    let confidence = (selfConfidence + score) / 2;
    let iteration = 0;

    while (confidence < targetConfidence && iteration < maxIterations) {
      [output, selfConfidence] = await this.generateWithConfidence(
        prompt,
        output,
        feedback
      );
      [score, feedback] = await this.evaluate(output, prompt);
      confidence = (selfConfidence + score) / 2;
      iteration++;
    }

    return {
      output,
      confidence,
      iterations: iteration + 1,
      finalFeedback: feedback,
    };
  }
}

// Example usage
async function exampleContentRefinement() {
  const client = new Anthropic();

  const eo = new EvaluatorOptimizer(client);
  eo.addCriterion(
    "clarity",
    "Is the writing clear and easy to understand?",
    1.0,
    8.0
  )
    .addCriterion(
      "persuasiveness",
      "Is the copy persuasive and compelling?",
      1.2,
      7.5
    )
    .addCriterion(
      "brand_voice",
      "Does it match a professional, friendly brand voice?",
      0.8,
      7.0
    )
    .addCriterion(
      "call_to_action",
      "Is there a clear, effective call to action?",
      1.0,
      8.0
    );

  const result = await eo.refine(
    "Write marketing copy for a new AI-powered writing assistant that helps users write better emails",
    { maxIterations: 3, targetScore: 8.5 }
  );

  console.log("=== Content Refinement Results ===");
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Initial score: ${result.initialScore.toFixed(1)}`);
  console.log(`Final score: ${result.finalScore.toFixed(1)}`);
  console.log(`\n=== Final Output ===\n${result.finalOutput}`);

  console.log("\n=== Iteration History ===");
  for (const entry of result.history) {
    console.log(`\nIteration ${entry.iteration}:`);
    console.log(`  Score: ${entry.evaluation.overallScore.toFixed(1)}`);
    console.log(
      `  Feedback: ${entry.evaluation.feedback.substring(0, 100)}...`
    );
  }
}

async function exampleConfidenceBased() {
  const client = new Anthropic();

  const optimizer = new ConfidenceBasedOptimizer(client);

  const result = await optimizer.refineUntilConfident(
    "Explain the Halting Problem in computer science in a way that a high school student could understand",
    0.85,
    4
  );

  console.log("=== Confidence-Based Results ===");
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Final confidence: ${(result.confidence * 100).toFixed(0)}%`);
  console.log(`\n=== Output ===\n${result.output}`);
}

// Export for module usage
export {
  EvaluatorOptimizer,
  ConfidenceBasedOptimizer,
  EvaluationCriteria,
  EvaluationResult,
  RefinementResult,
};

// Run examples
async function main() {
  await exampleContentRefinement();
  // await exampleConfidenceBased();
}

main().catch(console.error);
