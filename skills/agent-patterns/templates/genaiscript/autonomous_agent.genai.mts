/**
 * Autonomous Agent Pattern in GenAIScript
 * Open-ended exploration with tool usage
 *
 * GenAIScript provides a declarative way to define agent workflows
 * See: https://microsoft.github.io/genaiscript/
 */

script({
    title: "Autonomous Agent Pattern",
    description: "Agent that can explore and use tools to complete tasks",
    model: "claude-sonnet-4-20250514",
    parameters: {
        task: {
            type: "string",
            description: "The task for the agent to complete",
            default: "Research the current state of quantum computing and summarize key developments"
        },
        maxSteps: {
            type: "number",
            description: "Maximum steps the agent can take",
            default: 10
        }
    }
})

/**
 * Tool parameter definition
 */
interface ToolParameter {
    type: string
    description: string
    required: boolean
}

/**
 * Agent tool definition
 */
interface AgentTool {
    name: string
    description: string
    parameters: Record<string, ToolParameter>
    handler: (args: Record<string, any>) => Promise<string>
}

/**
 * Action record
 */
interface ActionRecord {
    step: number
    actionType: "thought" | "tool_call" | "text_response" | "complete"
    toolName?: string
    toolArgs?: Record<string, any>
    toolResult?: string
    thought?: string
}

/**
 * Agent state
 */
interface AgentState {
    totalSteps: number
    toolCalls: number
    actionHistory: ActionRecord[]
    isComplete: boolean
    finalResult?: string
}

/**
 * Agent result
 */
interface AgentResult {
    success: boolean
    finalResult: string
    totalSteps: number
    toolCalls: number
    actionHistory: ActionRecord[]
}

// Define tools
const tools: AgentTool[] = [
    {
        name: "search",
        description: "Search for information on a topic",
        parameters: {
            query: { type: "string", description: "Search query", required: true }
        },
        handler: async (args) => {
            // Mock search - in production, use actual search API
            const query = args.query
            return `Search results for "${query}":\n` +
                `1. Key information about ${query}\n` +
                `2. Recent developments in ${query}\n` +
                `3. Expert opinions on ${query}`
        }
    },
    {
        name: "read_url",
        description: "Read content from a URL",
        parameters: {
            url: { type: "string", description: "URL to read", required: true }
        },
        handler: async (args) => {
            const url = args.url
            // Mock URL reading - in production, use actual fetch
            return `Content from ${url}:\n[Mock content about the topic with relevant information]`
        }
    },
    {
        name: "save_note",
        description: "Save a note for later reference",
        parameters: {
            title: { type: "string", description: "Note title", required: true },
            content: { type: "string", description: "Note content", required: true }
        },
        handler: async (args) => {
            return `Note saved: "${args.title}"`
        }
    },
    {
        name: "calculate",
        description: "Perform mathematical calculations",
        parameters: {
            expression: { type: "string", description: "Math expression", required: true }
        },
        handler: async (args) => {
            try {
                // Simple eval for demo - use proper math parser in production
                const result = eval(args.expression)
                return `Result: ${result}`
            } catch (e) {
                return `Error evaluating expression: ${e.message}`
            }
        }
    }
]

/**
 * Build system prompt
 */
function buildSystemPrompt(): string {
    const toolDescriptions = tools.map(tool => {
        const params = Object.entries(tool.parameters)
            .map(([name, p]) => `${name}: ${p.type} - ${p.description}`)
            .join(", ")
        return `- ${tool.name}(${params}): ${tool.description}`
    }).join("\n")

    return `You are an autonomous agent that can use tools to complete tasks.

Available tools:
${toolDescriptions}

To use a tool, respond with JSON in this format:
{
    "thought": "Your reasoning about what to do next",
    "action": "tool_name",
    "args": { "param": "value" }
}

When you have completed the task, respond with:
{
    "thought": "Task is complete because...",
    "action": "complete",
    "result": "Your final answer"
}

Always think step by step and use tools to gather information before providing a final answer.`
}

/**
 * Parse agent action from response
 */
function parseAction(response: string): any {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0])
        } catch (e) {
            return null
        }
    }
    return null
}

/**
 * Run the agent
 */
async function runAgent(
    task: string,
    maxSteps: number,
    shouldStop?: (state: AgentState) => boolean
): Promise<AgentResult> {
    const state: AgentState = {
        totalSteps: 0,
        toolCalls: 0,
        actionHistory: [],
        isComplete: false
    }

    const conversation: { role: string, content: string }[] = [
        { role: "user", content: `Task: ${task}` }
    ]

    const systemPrompt = buildSystemPrompt()

    while (state.totalSteps < maxSteps && !state.isComplete) {
        state.totalSteps++

        // Check custom stop condition
        if (shouldStop && shouldStop(state)) {
            break
        }

        // Get next action
        const response = await runPrompt((_) => {
            _.def("SYSTEM", systemPrompt)
            _.def("CONVERSATION", conversation.map(m => `${m.role}: ${m.content}`).join("\n\n"))
            _.$`
${_.SYSTEM}

Conversation:
${_.CONVERSATION}

What is your next action?
            `
        }, {
            label: `agent_step_${state.totalSteps}`,
            model: "claude-sonnet-4-20250514"
        })

        const action = parseAction(response.text)

        if (!action) {
            // Non-JSON response
            state.actionHistory.push({
                step: state.totalSteps,
                actionType: "text_response",
                thought: response.text.substring(0, 200)
            })

            conversation.push(
                { role: "assistant", content: response.text },
                { role: "user", content: "Please respond with a JSON action or mark the task as complete." }
            )
            continue
        }

        // Record thought
        if (action.thought) {
            state.actionHistory.push({
                step: state.totalSteps,
                actionType: "thought",
                thought: action.thought
            })
        }

        // Check if complete
        if (action.action?.toLowerCase() === "complete") {
            state.isComplete = true
            state.finalResult = action.result || response.text
            break
        }

        // Find and execute tool
        const tool = tools.find(t => t.name === action.action)

        if (tool) {
            state.toolCalls++

            try {
                const toolResult = await tool.handler(action.args || {})

                state.actionHistory.push({
                    step: state.totalSteps,
                    actionType: "tool_call",
                    toolName: action.action,
                    toolArgs: action.args,
                    toolResult
                })

                conversation.push(
                    { role: "assistant", content: response.text },
                    { role: "user", content: `Tool result: ${toolResult}` }
                )

                console.log(`Step ${state.totalSteps}: ${action.action} -> ${toolResult.substring(0, 50)}...`)
            } catch (error) {
                const errorResult = `Error: ${error.message}`

                state.actionHistory.push({
                    step: state.totalSteps,
                    actionType: "tool_call",
                    toolName: action.action,
                    toolArgs: action.args,
                    toolResult: errorResult
                })

                conversation.push(
                    { role: "assistant", content: response.text },
                    { role: "user", content: `Tool error: ${errorResult}` }
                )
            }
        } else {
            // Unknown action
            const toolNames = tools.map(t => t.name).join(", ")
            conversation.push(
                { role: "assistant", content: response.text },
                { role: "user", content: `Unknown action: ${action.action}. Available tools: ${toolNames}` }
            )
        }
    }

    return {
        success: state.isComplete,
        finalResult: state.finalResult || "Task not completed within step limit",
        totalSteps: state.totalSteps,
        toolCalls: state.toolCalls,
        actionHistory: state.actionHistory
    }
}

// Main execution
const task = env.vars.task
const maxSteps = env.vars.maxSteps

console.log(`Starting agent with task: ${task}`)
console.log(`Max steps: ${maxSteps}`)

const result = await runAgent(task, maxSteps)

// Output results
$`
# Autonomous Agent Results

## Task
${task}

## Summary
- Success: ${result.success ? "Yes ✓" : "No"}
- Total Steps: ${result.totalSteps}
- Tool Calls: ${result.toolCalls}

## Action History
${result.actionHistory.map(action => {
    if (action.actionType === "thought") {
        return `### Step ${action.step}: Thought\n${action.thought}`
    } else if (action.actionType === "tool_call") {
        return `### Step ${action.step}: Tool Call\n- Tool: ${action.toolName}\n- Args: ${JSON.stringify(action.toolArgs)}\n- Result: ${action.toolResult?.substring(0, 100)}...`
    } else {
        return `### Step ${action.step}: ${action.actionType}\n${action.thought || ""}`
    }
}).join("\n\n")}

## Final Result
${result.finalResult}
`

// Export for use in other scripts
export const agentResult = result

export {
    runAgent,
    buildSystemPrompt,
    parseAction,
    tools
}

export type {
    AgentTool,
    ToolParameter,
    ActionRecord,
    AgentState,
    AgentResult
}

/**
 * Helper to create a research agent
 */
export function createResearchAgent() {
    return {
        run: (topic: string, maxSteps: number = 10) =>
            runAgent(`Research and summarize: ${topic}`, maxSteps)
    }
}

/**
 * Helper to create a coding agent
 */
export function createCodingAgent() {
    // Add coding-specific tools
    const codingTools: AgentTool[] = [
        ...tools,
        {
            name: "write_code",
            description: "Write code to a file",
            parameters: {
                filename: { type: "string", description: "File name", required: true },
                code: { type: "string", description: "Code content", required: true }
            },
            handler: async (args) => `Code written to ${args.filename}`
        },
        {
            name: "run_tests",
            description: "Run tests for a file",
            parameters: {
                target: { type: "string", description: "Test target", required: true }
            },
            handler: async (args) => `Tests for ${args.target}:\n✓ All tests passed`
        }
    ]

    return {
        run: (task: string, maxSteps: number = 10) =>
            runAgent(task, maxSteps)
    }
}
