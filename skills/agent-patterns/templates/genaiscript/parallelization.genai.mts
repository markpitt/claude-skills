/**
 * Parallelization Pattern in GenAIScript
 * Concurrent LLM calls with sectioning, voting, and guardrails
 *
 * GenAIScript provides a declarative way to define agent workflows
 * See: https://microsoft.github.io/genaiscript/
 */

script({
    title: "Parallelization Pattern - Concurrent LLM Operations",
    description: "Process multiple inputs in parallel with various strategies",
    model: "claude-sonnet-4-20250514",
    parameters: {
        mode: {
            type: "string",
            description: "Parallelization mode: sectioning, voting, or guardrails",
            default: "sectioning"
        }
    }
})

/**
 * Sectioning Parallelizer - Process independent sections in parallel
 */
async function sectioningParallelize(sections: string[], promptTemplate: (section: string) => string) {
    console.log(`Processing ${sections.length} sections in parallel...`)

    const results = await Promise.all(
        sections.map(async (section, index) => {
            try {
                const response = await runPrompt((_) => {
                    _.def("SECTION", section)
                    _.$`${promptTemplate(section)}`
                }, {
                    label: `section_${index}`,
                    model: "claude-sonnet-4-20250514"
                })

                return {
                    index,
                    section,
                    result: response.text,
                    success: true
                }
            } catch (error) {
                return {
                    index,
                    section,
                    result: null,
                    success: false,
                    error: error.message
                }
            }
        })
    )

    // Sort by original index
    results.sort((a, b) => a.index - b.index)
    return results
}

/**
 * Voting Parallelizer - Get multiple responses and aggregate
 */
async function votingParallelize(prompt: string, numVoters: number = 3, extractAnswer?: (response: string) => string) {
    console.log(`Getting ${numVoters} votes...`)

    const votes = await Promise.all(
        Array.from({ length: numVoters }, async (_, index) => {
            try {
                const response = await runPrompt((_) => {
                    _.def("PROMPT", prompt)
                    _.$`${_.PROMPT}`
                }, {
                    label: `voter_${index}`,
                    model: "claude-sonnet-4-20250514",
                    temperature: 0.7  // Slight variation for diversity
                })

                return {
                    index,
                    response: response.text,
                    success: true
                }
            } catch (error) {
                return {
                    index,
                    response: null,
                    success: false,
                    error: error.message
                }
            }
        })
    )

    // Count votes
    const voteCounts = new Map<string, number>()

    for (const vote of votes) {
        if (!vote.success) continue

        const answer = extractAnswer
            ? extractAnswer(vote.response)
            : vote.response.trim().toLowerCase()

        voteCounts.set(answer, (voteCounts.get(answer) || 0) + 1)
    }

    // Find winner
    let winner = ""
    let maxCount = 0
    for (const [answer, count] of voteCounts) {
        if (count > maxCount) {
            maxCount = count
            winner = answer
        }
    }

    const successfulVotes = votes.filter(v => v.success).length
    const confidence = successfulVotes > 0 ? maxCount / successfulVotes : 0

    return {
        winner,
        winnerCount: maxCount,
        totalVotes: votes.length,
        successfulVotes,
        confidence,
        votes: Object.fromEntries(voteCounts),
        allResponses: votes
    }
}

/**
 * Guardrails Parallelizer - Run guardrails in parallel with main task
 */
interface Guardrail {
    name: string
    prompt: string
    check: (response: string) => boolean
}

async function guardrailsParallelize(
    taskPrompt: string,
    input: string,
    guardrails: Guardrail[],
    stopOnFailure: boolean = true
) {
    console.log(`Running ${guardrails.length} guardrails in parallel with main task...`)

    // Run guardrails and main task in parallel
    const [guardrailResults, taskResult] = await Promise.all([
        // Guardrails
        Promise.all(
            guardrails.map(async (guardrail) => {
                try {
                    const response = await runPrompt((_) => {
                        _.def("INPUT", input)
                        _.$`
${guardrail.prompt}

Content: ${_.INPUT}

Respond with yes or no and a brief reason.
                        `
                    }, {
                        label: `guardrail_${guardrail.name}`,
                        model: "claude-sonnet-4-20250514",
                        maxTokens: 256
                    })

                    const passed = guardrail.check(response.text)
                    return {
                        name: guardrail.name,
                        passed,
                        reason: response.text
                    }
                } catch (error) {
                    return {
                        name: guardrail.name,
                        passed: false,
                        reason: `Error: ${error.message}`
                    }
                }
            })
        ),
        // Main task
        runPrompt((_) => {
            _.def("INPUT", input)
            _.$`
${taskPrompt}

Input: ${_.INPUT}
            `
        }, {
            label: "main_task",
            model: "claude-sonnet-4-20250514"
        })
    ])

    const allPassed = guardrailResults.every(r => r.passed)
    const failedGuardrails = guardrailResults.filter(r => !r.passed)

    return {
        allPassed,
        guardrailResults,
        failedGuardrails,
        response: (!stopOnFailure || allPassed) ? taskResult.text : null
    }
}

// Example: Sectioning - Translate multiple sentences
if (env.vars.mode === "sectioning") {
    const sentences = [
        "Hello, how are you?",
        "The weather is nice today.",
        "I love programming.",
        "GenAIScript is powerful."
    ]

    const results = await sectioningParallelize(
        sentences,
        (section) => `Translate to French: ${section}`
    )

    $`
# Sectioning Results

## Translations
${results.map(r => `- "${r.section}" → "${r.result}"`).join("\n")}

## Summary
- Total sections: ${results.length}
- Successful: ${results.filter(r => r.success).length}
- Failed: ${results.filter(r => !r.success).length}
    `
}

// Example: Voting - Get consensus answer
if (env.vars.mode === "voting") {
    const result = await votingParallelize(
        "Is the sky blue? Answer with just 'yes' or 'no'.",
        5,
        (response) => {
            const lower = response.toLowerCase()
            if (lower.includes("yes")) return "yes"
            if (lower.includes("no")) return "no"
            return response.trim()
        }
    )

    $`
# Voting Results

## Question
Is the sky blue?

## Result
- Winner: ${result.winner}
- Votes: ${result.winnerCount}/${result.totalVotes}
- Confidence: ${(result.confidence * 100).toFixed(0)}%

## Vote Distribution
${Object.entries(result.votes).map(([answer, count]) => `- ${answer}: ${count} votes`).join("\n")}
    `
}

// Example: Guardrails - Safe code generation
if (env.vars.mode === "guardrails") {
    const guardrails: Guardrail[] = [
        {
            name: "safe_request",
            prompt: "Is this a safe, non-malicious code request?",
            check: (r) => r.toLowerCase().includes("yes")
        },
        {
            name: "appropriate",
            prompt: "Is this request appropriate for a coding assistant?",
            check: (r) => r.toLowerCase().includes("yes")
        }
    ]

    const result = await guardrailsParallelize(
        "Write a function based on this request:",
        "Sort a list of numbers in ascending order",
        guardrails
    )

    $`
# Guardrails Results

## Input
Sort a list of numbers in ascending order

## Guardrail Checks
${result.guardrailResults.map(r => `- ${r.name}: ${r.passed ? "✓ PASSED" : "✗ FAILED"}`).join("\n")}

## Overall
- All passed: ${result.allPassed ? "Yes" : "No"}
${result.failedGuardrails.length > 0 ? `- Failed: ${result.failedGuardrails.map(g => g.name).join(", ")}` : ""}

## Response
${result.response || "Blocked by guardrails"}
    `
}

// Export for use in other scripts
export {
    sectioningParallelize,
    votingParallelize,
    guardrailsParallelize
}

export type { Guardrail }
