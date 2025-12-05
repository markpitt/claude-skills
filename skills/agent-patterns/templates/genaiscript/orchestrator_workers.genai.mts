/**
 * Orchestrator-Workers Pattern in GenAIScript
 * Central orchestrator delegates to specialized workers
 *
 * GenAIScript provides a declarative way to define agent workflows
 * See: https://microsoft.github.io/genaiscript/
 */

script({
    title: "Orchestrator-Workers Pattern",
    description: "Break down complex tasks and delegate to specialized workers",
    model: "claude-sonnet-4-20250514",
    parameters: {
        task: {
            type: "string",
            description: "The complex task to orchestrate",
            default: "Create a comprehensive guide on error handling best practices in TypeScript"
        }
    }
})

/**
 * Worker definition
 */
interface Worker {
    type: string
    description: string
    systemPrompt: string
}

/**
 * SubTask definition
 */
interface SubTask {
    id: string
    type: string
    description: string
    context: Record<string, any>
    dependencies: string[]
}

/**
 * Worker result
 */
interface WorkerResult {
    taskId: string
    workerType: string
    result: string
    success: boolean
    error?: string
}

// Define available workers
const workers: Record<string, Worker> = {
    researcher: {
        type: "researcher",
        description: "Research and gather information on topics",
        systemPrompt: "You are a research specialist. Gather comprehensive, accurate information. Cite sources when possible."
    },
    architect: {
        type: "architect",
        description: "Design structures and outlines",
        systemPrompt: "You are a software architect. Design clean, well-organized structures and outlines."
    },
    writer: {
        type: "writer",
        description: "Write clear, engaging content",
        systemPrompt: "You are a technical writer. Write clear, well-structured, and engaging content."
    },
    reviewer: {
        type: "reviewer",
        description: "Review and provide feedback",
        systemPrompt: "You are a quality reviewer. Provide constructive feedback and identify areas for improvement."
    },
    coder: {
        type: "coder",
        description: "Write code examples and implementations",
        systemPrompt: "You are an expert programmer. Write clean, well-documented code with best practices."
    }
}

/**
 * Create execution plan
 */
async function createPlan(task: string): Promise<{ tasks: SubTask[], synthesis: string }> {
    const workerDescriptions = Object.entries(workers)
        .map(([type, w]) => `- ${type}: ${w.description}`)
        .join("\n")

    const planResponse = await runPrompt((_) => {
        _.def("TASK", task)
        _.def("WORKERS", workerDescriptions)
        _.$`
Break down this task into subtasks for specialized workers.

Available workers:
${_.WORKERS}

Task: ${_.TASK}

Respond in JSON format:
{
    "tasks": [
        {
            "id": "task_1",
            "type": "worker_type",
            "description": "What this worker should do",
            "dependencies": []
        },
        {
            "id": "task_2",
            "type": "another_worker_type",
            "description": "What this worker should do",
            "dependencies": ["task_1"]
        }
    ],
    "synthesis": "How to combine the results into a final deliverable"
}
        `
    }, {
        label: "create_plan",
        model: "claude-sonnet-4-20250514",
        responseType: "json_object"
    })

    return JSON.parse(planResponse.text)
}

/**
 * Execute a worker task
 */
async function executeWorker(task: SubTask, context: Record<string, any>): Promise<WorkerResult> {
    const worker = workers[task.type]

    if (!worker) {
        return {
            taskId: task.id,
            workerType: task.type,
            result: "",
            success: false,
            error: `No worker found for type: ${task.type}`
        }
    }

    try {
        const response = await runPrompt((_) => {
            _.def("DESCRIPTION", task.description)
            _.def("CONTEXT", JSON.stringify(context, null, 2))
            _.$`
${worker.systemPrompt}

Task: ${_.DESCRIPTION}

Context from previous tasks:
${_.CONTEXT}

Provide your result:
            `
        }, {
            label: `worker_${task.type}_${task.id}`,
            model: "claude-sonnet-4-20250514"
        })

        return {
            taskId: task.id,
            workerType: task.type,
            result: response.text,
            success: true
        }
    } catch (error) {
        return {
            taskId: task.id,
            workerType: task.type,
            result: "",
            success: false,
            error: error.message
        }
    }
}

/**
 * Execute tasks respecting dependencies
 */
async function executeWithDependencies(tasks: SubTask[]): Promise<WorkerResult[]> {
    const results: Record<string, WorkerResult> = {}
    const completed = new Set<string>()
    const pending = [...tasks]

    while (pending.length > 0) {
        // Find tasks ready to execute (all dependencies completed)
        const ready = pending.filter(task =>
            task.dependencies.every(dep => completed.has(dep))
        )

        if (ready.length === 0 && pending.length > 0) {
            throw new Error("Circular dependency detected")
        }

        // Execute ready tasks in parallel
        const batchResults = await Promise.all(
            ready.map(async (task) => {
                // Build context from dependencies
                const context: Record<string, any> = {}
                for (const depId of task.dependencies) {
                    if (results[depId]) {
                        context[depId] = results[depId].result
                    }
                }

                return executeWorker(task, context)
            })
        )

        // Update state
        for (const result of batchResults) {
            results[result.taskId] = result
            completed.add(result.taskId)
        }

        // Remove completed tasks from pending
        for (const task of ready) {
            const index = pending.indexOf(task)
            if (index > -1) {
                pending.splice(index, 1)
            }
        }

        console.log(`Completed batch: ${ready.map(t => t.id).join(", ")}`)
    }

    return Object.values(results)
}

/**
 * Synthesize results
 */
async function synthesize(
    originalTask: string,
    results: WorkerResult[],
    synthesisInstructions: string
): Promise<string> {
    const resultSummaries = results.map(r => `
Worker: ${r.workerType}
Task: ${r.taskId}
Result: ${r.success ? r.result : `FAILED: ${r.error}`}
---`).join("\n")

    const response = await runPrompt((_) => {
        _.def("TASK", originalTask)
        _.def("RESULTS", resultSummaries)
        _.def("INSTRUCTIONS", synthesisInstructions)
        _.$`
Synthesize these worker results into a final response.

Original task: ${_.TASK}

Worker results:
${_.RESULTS}

Instructions: ${_.INSTRUCTIONS}

Provide a comprehensive final result:
        `
    }, {
        label: "synthesize",
        model: "claude-sonnet-4-20250514"
    })

    return response.text
}

// Main execution
const task = env.vars.task

console.log(`Orchestrating task: ${task}`)
console.log("Creating execution plan...")

// Step 1: Plan
const plan = await createPlan(task)

console.log(`Plan created with ${plan.tasks.length} tasks:`)
for (const t of plan.tasks) {
    console.log(`  - ${t.id} (${t.type}): ${t.description.substring(0, 50)}...`)
}

// Step 2: Execute
console.log("\nExecuting tasks...")
const workerResults = await executeWithDependencies(plan.tasks)

// Step 3: Synthesize
console.log("\nSynthesizing results...")
const finalResult = await synthesize(task, workerResults, plan.synthesis)

// Output results
$`
# Orchestration Results

## Task
${task}

## Execution Plan
${plan.tasks.map(t => `
### ${t.id} (${t.type})
- Description: ${t.description}
- Dependencies: ${t.dependencies.length > 0 ? t.dependencies.join(", ") : "none"}
`).join("\n")}

## Worker Results
${workerResults.map(r => `
### ${r.taskId} (${r.workerType})
- Status: ${r.success ? "✓ Success" : "✗ Failed"}
${r.success ? `- Result preview: ${r.result.substring(0, 200)}...` : `- Error: ${r.error}`}
`).join("\n")}

## Final Synthesized Result
${finalResult}
`

// Export for use in other scripts
export const orchestrationResult = {
    task,
    plan,
    workerResults,
    finalResult,
    success: workerResults.every(r => r.success)
}

export {
    createPlan,
    executeWorker,
    executeWithDependencies,
    synthesize,
    workers
}

export type { Worker, SubTask, WorkerResult }
