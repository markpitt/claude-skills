/**
 * Prompt Chaining Pattern in GenAIScript
 * Sequential LLM calls with programmatic checkpoints
 *
 * GenAIScript provides a declarative way to define agent workflows
 * See: https://microsoft.github.io/genaiscript/
 */

script({
    title: "Prompt Chaining - Document Generation",
    description: "Generate a document using sequential prompt chaining",
    model: "claude-3-5-sonnet-20241022",
    parameters: {
        topic: {
            type: "string",
            description: "The topic to write about",
            default: "Building Effective AI Agents"
        }
    }
})

// Step 1: Generate outline
const outline = await runPrompt((_) => {
    _.def("TOPIC", env.vars.topic)
    _.$`Create a detailed outline for an article about: ${_.TOPIC}`
}, {
    label: "outline",
    model: "claude-3-5-sonnet-20241022"
})

// Validate outline
if (!outline.text.includes("1.") || !outline.text.includes("2.")) {
    throw new Error("Outline validation failed: missing numbered sections")
}

console.log("✓ Outline generated and validated")

// Step 2: Expand outline into draft
const draft = await runPrompt((_) => {
    _.def("OUTLINE", outline.text)
    _.$`
Expand this outline into a full article:

${_.OUTLINE}

Write in a professional tone with clear examples.
    `
}, {
    label: "draft",
    model: "claude-3-5-sonnet-20241022"
})

// Validate draft has substantial content
const wordCount = draft.text.split(/\s+/).length
if (wordCount < 200) {
    throw new Error(`Draft validation failed: only ${wordCount} words (minimum 200)`)
}

console.log(`✓ Draft generated and validated (${wordCount} words)`)

// Step 3: Proofread and polish
const final = await runPrompt((_) => {
    _.def("DRAFT", draft.text)
    _.$`
Proofread and polish this article:

${_.DRAFT}

Fix any grammar, improve clarity, and ensure consistent tone.
    `
}, {
    label: "final",
    model: "claude-3-5-sonnet-20241022"
})

console.log("✓ Final article completed")

// Output results
def("FINAL_ARTICLE", final.text, { lineNumbers: true })

$`
# Document Generation Complete

## Topic
${env.vars.topic}

## Outline
${outline.text}

## Statistics
- Draft word count: ${wordCount}
- Final article length: ${final.text.length} characters

## Final Article
${final.text}
`

// Export for use in other scripts
export const documentGeneration = {
    outline: outline.text,
    draft: draft.text,
    final: final.text,
    stats: {
        wordCount,
        length: final.text.length
    }
}
