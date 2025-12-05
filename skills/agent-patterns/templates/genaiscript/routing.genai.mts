/**
 * Routing Pattern in GenAIScript
 * Classification-based routing of inputs to specialized handlers
 *
 * GenAIScript provides a declarative way to define agent workflows
 * See: https://microsoft.github.io/genaiscript/
 */

script({
    title: "Routing Pattern - Input Classification and Routing",
    description: "Route inputs to specialized handlers based on classification",
    model: "claude-sonnet-4-20250514",
    parameters: {
        input: {
            type: "string",
            description: "The input to classify and route",
            default: "How do I implement a binary search tree in Python?"
        },
        confidenceThreshold: {
            type: "number",
            description: "Minimum confidence for routing",
            default: 0.7
        }
    }
})

// Define route categories
const routes = {
    code: {
        description: "Programming and coding questions",
        systemPrompt: "You are a coding expert. Provide clear, well-documented code examples."
    },
    math: {
        description: "Mathematics and calculations",
        systemPrompt: "You are a math expert. Show step-by-step solutions."
    },
    general: {
        description: "General knowledge questions",
        systemPrompt: "You are a knowledgeable assistant. Provide accurate, helpful answers."
    },
    creative: {
        description: "Creative writing and content generation",
        systemPrompt: "You are a creative writer. Generate engaging, original content."
    }
}

// Step 1: Classify the input
const classification = await runPrompt((_) => {
    const categories = Object.entries(routes)
        .map(([name, r]) => `${name}: ${r.description}`)
        .join("\n")

    _.def("INPUT", env.vars.input)
    _.def("CATEGORIES", categories)

    _.$`
Classify the following input into one of these categories:
${_.CATEGORIES}

Input: ${_.INPUT}

Respond in JSON format:
{
    "category": "category_name",
    "confidence": 0.0-1.0,
    "reasoning": "brief explanation"
}
    `
}, {
    label: "classify",
    model: "claude-sonnet-4-20250514",
    responseType: "json_object"
})

// Parse classification result
let classificationResult
try {
    classificationResult = JSON.parse(classification.text)
} catch (e) {
    // Try to extract JSON from response
    const jsonMatch = classification.text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
        classificationResult = JSON.parse(jsonMatch[0])
    } else {
        throw new Error("Failed to parse classification result")
    }
}

console.log(`Classification: ${classificationResult.category} (confidence: ${classificationResult.confidence})`)
console.log(`Reasoning: ${classificationResult.reasoning}`)

// Step 2: Route to appropriate handler
const category = classificationResult.category
const confidence = classificationResult.confidence

let response
if (routes[category] && confidence >= env.vars.confidenceThreshold) {
    // Route to specialized handler
    response = await runPrompt((_) => {
        _.def("INPUT", env.vars.input)
        _.def("SYSTEM", routes[category].systemPrompt)

        _.$`
${_.SYSTEM}

User Query: ${_.INPUT}
        `
    }, {
        label: `handle_${category}`,
        model: "claude-sonnet-4-20250514"
    })

    console.log(`✓ Routed to ${category} handler`)
} else {
    // Fallback handler
    response = await runPrompt((_) => {
        _.def("INPUT", env.vars.input)

        _.$`
I'll do my best to help with your query:

${_.INPUT}
        `
    }, {
        label: "fallback",
        model: "claude-sonnet-4-20250514"
    })

    console.log(`✓ Used fallback handler (confidence too low: ${confidence})`)
}

// Output results
$`
# Routing Results

## Input
${env.vars.input}

## Classification
- Category: ${classificationResult.category}
- Confidence: ${(classificationResult.confidence * 100).toFixed(0)}%
- Reasoning: ${classificationResult.reasoning}

## Routing Decision
- Threshold: ${env.vars.confidenceThreshold * 100}%
- Routed to: ${confidence >= env.vars.confidenceThreshold ? category : "fallback"}

## Response
${response.text}
`

// Export for use in other scripts
export const routingResult = {
    input: env.vars.input,
    classification: classificationResult,
    routedTo: confidence >= env.vars.confidenceThreshold ? category : "fallback",
    response: response.text
}

/**
 * Model Router - Routes to different models based on complexity
 */
export async function routeByComplexity(input: string) {
    const models = {
        simple: "claude-3-haiku-20240307",
        moderate: "claude-sonnet-4-20250514",
        complex: "claude-opus-4-20250514"
    }

    // Assess complexity
    const assessment = await runPrompt((_) => {
        _.def("INPUT", input)
        _.$`
Assess the complexity of handling this request:

${_.INPUT}

Consider:
- simple: Direct factual answers, simple calculations, basic questions
- moderate: Analysis, explanations, moderate coding tasks
- complex: Deep analysis, complex reasoning, creative writing, complex code

Respond in JSON format:
{
    "complexity": "simple|moderate|complex",
    "confidence": 0.0-1.0,
    "reasoning": "explanation"
}
        `
    }, {
        label: "assess_complexity",
        model: "claude-sonnet-4-20250514",
        responseType: "json_object"
    })

    const result = JSON.parse(assessment.text)
    const selectedModel = models[result.complexity] || models.moderate

    console.log(`Complexity: ${result.complexity} -> Using model: ${selectedModel}`)

    // Execute with selected model
    const response = await runPrompt((_) => {
        _.def("INPUT", input)
        _.$`${_.INPUT}`
    }, {
        label: "execute",
        model: selectedModel
    })

    return {
        complexity: result.complexity,
        model: selectedModel,
        response: response.text
    }
}
