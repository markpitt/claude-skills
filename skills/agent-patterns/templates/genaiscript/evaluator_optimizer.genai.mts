/**
 * Evaluator-Optimizer Pattern in GenAIScript
 * Iterative refinement through evaluation and feedback loops
 *
 * GenAIScript provides a declarative way to define agent workflows
 * See: https://microsoft.github.io/genaiscript/
 */

script({
    title: "Evaluator-Optimizer Pattern",
    description: "Iteratively refine content through evaluation and feedback",
    model: "claude-sonnet-4-20250514",
    parameters: {
        task: {
            type: "string",
            description: "The task to optimize",
            default: "Explain how garbage collection works in modern programming languages"
        },
        targetScore: {
            type: "number",
            description: "Target score to achieve (0-1)",
            default: 0.85
        },
        maxIterations: {
            type: "number",
            description: "Maximum optimization iterations",
            default: 4
        }
    }
})

/**
 * Evaluation criterion
 */
interface EvaluationCriterion {
    name: string
    description: string
    weight: number
}

/**
 * Criterion score
 */
interface CriterionScore {
    criterion: string
    score: number
    feedback: string
}

/**
 * Evaluation result
 */
interface EvaluationResult {
    overallScore: number
    criteriaScores: CriterionScore[]
    overallFeedback: string
    suggestions: string[]
}

/**
 * Optimization iteration
 */
interface OptimizationIteration {
    iteration: number
    content: string
    evaluation: EvaluationResult
}

/**
 * Optimization result
 */
interface OptimizationResult {
    finalContent: string
    totalIterations: number
    history: OptimizationIteration[]
    converged: boolean
    finalScore: number
}

// Define evaluation criteria
const criteria: EvaluationCriterion[] = [
    {
        name: "accuracy",
        description: "Is the information factually accurate and technically correct?",
        weight: 2.0
    },
    {
        name: "clarity",
        description: "Is the explanation clear, well-organized, and easy to understand?",
        weight: 1.5
    },
    {
        name: "completeness",
        description: "Does it cover all important aspects and edge cases?",
        weight: 1.0
    },
    {
        name: "examples",
        description: "Are there helpful examples that illustrate the concepts?",
        weight: 1.0
    }
]

/**
 * Generate content (initial or improved)
 */
async function generate(task: string, previousEvaluation?: EvaluationResult): Promise<string> {
    if (!previousEvaluation) {
        // Initial generation
        const criteriaList = criteria
            .map(c => `- ${c.name}: ${c.description}`)
            .join("\n")

        const response = await runPrompt((_) => {
            _.def("TASK", task)
            _.def("CRITERIA", criteriaList)
            _.$`
Complete this task:
${_.TASK}

Criteria to consider:
${_.CRITERIA}
            `
        }, {
            label: "initial_generation",
            model: "claude-sonnet-4-20250514"
        })

        return response.text
    } else {
        // Improved generation based on feedback
        const scoresText = previousEvaluation.criteriaScores
            .map(cs => `- ${cs.criterion}: ${(cs.score * 100).toFixed(0)}% - ${cs.feedback}`)
            .join("\n")

        const suggestionsText = previousEvaluation.suggestions
            .map(s => `- ${s}`)
            .join("\n")

        const response = await runPrompt((_) => {
            _.def("TASK", task)
            _.def("SCORE", (previousEvaluation.overallScore * 100).toFixed(0))
            _.def("FEEDBACK", previousEvaluation.overallFeedback)
            _.def("SUGGESTIONS", suggestionsText)
            _.def("SCORES", scoresText)
            _.$`
Improve your previous response based on this feedback:

Original task: ${_.TASK}

Previous evaluation:
- Overall score: ${_.SCORE}%
- Feedback: ${_.FEEDBACK}

Specific improvements needed:
${_.SUGGESTIONS}

Criteria scores:
${_.SCORES}

Generate an improved version addressing all feedback:
            `
        }, {
            label: "improved_generation",
            model: "claude-sonnet-4-20250514"
        })

        return response.text
    }
}

/**
 * Evaluate content against criteria
 */
async function evaluate(task: string, content: string): Promise<EvaluationResult> {
    const criteriaList = criteria
        .map(c => `${c.name} (weight: ${c.weight}): ${c.description}`)
        .join("\n")

    const response = await runPrompt((_) => {
        _.def("TASK", task)
        _.def("CONTENT", content)
        _.def("CRITERIA", criteriaList)
        _.$`
Evaluate this content against the criteria below.

Task: ${_.TASK}

Content to evaluate:
${_.CONTENT}

Criteria:
${_.CRITERIA}

Respond in JSON format:
{
    "criteria_scores": [
        {
            "criterion": "name",
            "score": 0.0-1.0,
            "feedback": "specific feedback"
        }
    ],
    "overall_feedback": "summary of strengths and weaknesses",
    "suggestions": ["specific improvement 1", "specific improvement 2"]
}
        `
    }, {
        label: "evaluate",
        model: "claude-sonnet-4-20250514",
        responseType: "json_object"
    })

    const data = JSON.parse(response.text)

    // Calculate weighted average
    let totalWeight = 0
    let weightedSum = 0

    const criteriaScores: CriterionScore[] = data.criteria_scores.map((cs: any) => {
        const criterion = criteria.find(c => c.name === cs.criterion)
        const weight = criterion?.weight || 1.0
        totalWeight += weight
        weightedSum += cs.score * weight

        return {
            criterion: cs.criterion,
            score: cs.score,
            feedback: cs.feedback
        }
    })

    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0

    return {
        overallScore,
        criteriaScores,
        overallFeedback: data.overall_feedback,
        suggestions: data.suggestions
    }
}

/**
 * Run optimization loop
 */
async function optimize(
    task: string,
    targetScore: number,
    maxIterations: number
): Promise<OptimizationResult> {
    const history: OptimizationIteration[] = []
    let currentContent = ""

    // Initial generation
    currentContent = await generate(task)

    for (let i = 0; i < maxIterations; i++) {
        // Evaluate
        const evaluation = await evaluate(task, currentContent)

        history.push({
            iteration: i + 1,
            content: currentContent,
            evaluation
        })

        console.log(`Iteration ${i + 1}: ${(evaluation.overallScore * 100).toFixed(0)}%`)

        // Check if target reached
        if (evaluation.overallScore >= targetScore) {
            return {
                finalContent: currentContent,
                totalIterations: i + 1,
                history,
                converged: true,
                finalScore: evaluation.overallScore
            }
        }

        // Generate improved version
        currentContent = await generate(task, evaluation)
    }

    // Max iterations reached
    const lastScore = history.length > 0
        ? history[history.length - 1].evaluation.overallScore
        : 0

    return {
        finalContent: currentContent,
        totalIterations: maxIterations,
        history,
        converged: false,
        finalScore: lastScore
    }
}

// Main execution
const task = env.vars.task
const targetScore = env.vars.targetScore
const maxIterations = env.vars.maxIterations

console.log(`Optimizing: ${task}`)
console.log(`Target score: ${(targetScore * 100).toFixed(0)}%`)
console.log(`Max iterations: ${maxIterations}`)

const result = await optimize(task, targetScore, maxIterations)

// Output results
$`
# Evaluator-Optimizer Results

## Task
${task}

## Configuration
- Target Score: ${(targetScore * 100).toFixed(0)}%
- Max Iterations: ${maxIterations}

## Results
- Converged: ${result.converged ? "Yes ✓" : "No"}
- Total Iterations: ${result.totalIterations}
- Final Score: ${(result.finalScore * 100).toFixed(0)}%

## Iteration History
${result.history.map(iter => `
### Iteration ${iter.iteration}
- Overall Score: ${(iter.evaluation.overallScore * 100).toFixed(0)}%
- Criteria Scores:
${iter.evaluation.criteriaScores.map(cs => `  - ${cs.criterion}: ${(cs.score * 100).toFixed(0)}%`).join("\n")}
- Feedback: ${iter.evaluation.overallFeedback}
`).join("\n")}

## Final Content
${result.finalContent}
`

// Export for use in other scripts
export const optimizationResult = result

export {
    generate,
    evaluate,
    optimize,
    criteria
}

export type {
    EvaluationCriterion,
    CriterionScore,
    EvaluationResult,
    OptimizationIteration,
    OptimizationResult
}

/**
 * Confidence-based optimizer
 */
export async function confidenceOptimize(
    task: string,
    confidenceThreshold: number = 0.9,
    maxAttempts: number = 3
) {
    interface ConfidenceAttempt {
        attempt: number
        answer: string
        confidence: number
        reasoning: string
    }

    const attempts: ConfidenceAttempt[] = []

    for (let i = 0; i < maxAttempts; i++) {
        const previousText = attempts.length > 0
            ? attempts.map(a => `
Attempt ${a.attempt}: ${a.answer}
Confidence: ${(a.confidence * 100).toFixed(0)}%
Reasoning: ${a.reasoning}
            `).join("\n")
            : null

        const response = await runPrompt((_) => {
            _.def("TASK", task)
            if (previousText) {
                _.def("PREVIOUS", previousText)
                _.$`
Improve upon your previous attempts:

Task: ${_.TASK}

Previous attempts:
${_.PREVIOUS}

Provide a better answer with higher confidence.

Respond in JSON format:
{
    "answer": "your improved answer",
    "confidence": 0.0-1.0,
    "reasoning": "why this is better"
}
                `
            } else {
                _.$`
Complete this task and assess your confidence:

${_.TASK}

Respond in JSON format:
{
    "answer": "your answer",
    "confidence": 0.0-1.0,
    "reasoning": "why you're this confident"
}
                `
            }
        }, {
            label: `confidence_attempt_${i + 1}`,
            model: "claude-sonnet-4-20250514",
            responseType: "json_object"
        })

        const data = JSON.parse(response.text)
        attempts.push({
            attempt: i + 1,
            answer: data.answer,
            confidence: data.confidence,
            reasoning: data.reasoning
        })

        console.log(`Attempt ${i + 1}: ${(data.confidence * 100).toFixed(0)}% confidence`)

        if (data.confidence >= confidenceThreshold) {
            return {
                finalAnswer: data.answer,
                finalConfidence: data.confidence,
                attempts,
                converged: true
            }
        }
    }

    // Return best attempt
    const best = attempts.reduce((a, b) => a.confidence > b.confidence ? a : b)

    return {
        finalAnswer: best.answer,
        finalConfidence: best.confidence,
        attempts,
        converged: false
    }
}
