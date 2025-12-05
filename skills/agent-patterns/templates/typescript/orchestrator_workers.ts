/**
 * Orchestrator-Workers Pattern Implementation
 * Dynamic task decomposition with specialized workers
 */

import Anthropic from "@anthropic-ai/sdk";

// Types
interface Subtask {
  id: string;
  description: string;
  context: Record<string, unknown>;
  workerType: string;
}

interface WorkerResult {
  subtaskId: string;
  result: string;
  success: boolean;
  error?: string;
}

interface OrchestratorResult {
  finalOutput: string;
  subtasks: Subtask[];
  workerResults: WorkerResult[];
  executionHistory: Array<{
    phase: string;
    data: unknown;
  }>;
}

/**
 * Worker that executes subtasks using an LLM
 */
class LLMWorker {
  private client: Anthropic;
  public workerType: string;
  private systemPrompt: string;
  private model: string;

  constructor(
    client: Anthropic,
    workerType: string,
    systemPrompt: string,
    model: string = "claude-sonnet-4-20250514"
  ) {
    this.client = client;
    this.workerType = workerType;
    this.systemPrompt = systemPrompt;
    this.model = model;
  }

  async execute(subtask: Subtask): Promise<WorkerResult> {
    const prompt = `
Task: ${subtask.description}

Context:
${JSON.stringify(subtask.context, null, 2)}

Please complete this task following the instructions above.
    `.trim();

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: this.systemPrompt,
        messages: [{ role: "user", content: prompt }],
      });

      const result =
        message.content[0].type === "text" ? message.content[0].text : "";

      return {
        subtaskId: subtask.id,
        result,
        success: true,
      };
    } catch (error) {
      return {
        subtaskId: subtask.id,
        result: "",
        success: false,
        error: String(error),
      };
    }
  }
}

/**
 * Orchestrator that coordinates task decomposition and worker execution.
 *
 * From Anthropic blog: "In the orchestrator-workers workflow, a central LLM
 * dynamically breaks down tasks, delegates them to worker LLMs, and
 * synthesizes their results."
 *
 * Use when:
 * - Subtasks cannot be known until runtime
 * - Complex multi-component problems requiring decomposition
 * - Different inputs require different decomposition strategies
 * - Workers can meaningfully specialize by subtask type
 *
 * @example
 * const orchestrator = new Orchestrator(client);
 * orchestrator.registerWorker(new LLMWorker(client, "analyzer", "You analyze code..."));
 * orchestrator.registerWorker(new LLMWorker(client, "writer", "You write documentation..."));
 *
 * const result = await orchestrator.execute({
 *   goal: "Create documentation for this codebase"
 * });
 */
class Orchestrator {
  private client: Anthropic;
  private model: string;
  private workers: Map<string, LLMWorker> = new Map();
  private executionHistory: OrchestratorResult["executionHistory"] = [];

  constructor(client: Anthropic, model: string = "claude-sonnet-4-20250514") {
    this.client = client;
    this.model = model;
  }

  registerWorker(worker: LLMWorker): Orchestrator {
    this.workers.set(worker.workerType, worker);
    return this;
  }

  private async planSubtasks(goal: Record<string, unknown>): Promise<Subtask[]> {
    const workerTypes = Array.from(this.workers.keys()).join(", ");

    const planningPrompt = `
Break down this goal into concrete subtasks that can be executed in parallel
or sequence by specialized workers.

Goal: ${JSON.stringify(goal, null, 2)}

Available worker types: ${workerTypes}

Return a JSON array of subtasks with this structure:
[
  {
    "id": "unique_id",
    "description": "what the worker should do",
    "context": {"key": "relevant context"},
    "workerType": "type of worker to use"
  }
]

Only use worker types from the available list above.
    `.trim();

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: planningPrompt }],
    });

    let responseText =
      message.content[0].type === "text" ? message.content[0].text : "[]";

    // Extract JSON from markdown code blocks if present
    if (responseText.includes("```json")) {
      responseText = responseText.split("```json")[1].split("```")[0];
    } else if (responseText.includes("```")) {
      responseText = responseText.split("```")[1].split("```")[0];
    }

    const subtasksData = JSON.parse(responseText.trim());
    return subtasksData as Subtask[];
  }

  private async executeWorkers(
    subtasks: Subtask[]
  ): Promise<Map<string, WorkerResult>> {
    const results = new Map<string, WorkerResult>();

    // Execute workers in parallel
    const promises = subtasks.map(async (subtask) => {
      const worker = this.workers.get(subtask.workerType);
      if (!worker) {
        return {
          subtaskId: subtask.id,
          result: "",
          success: false,
          error: `No worker registered for type: ${subtask.workerType}`,
        };
      }
      return worker.execute(subtask);
    });

    const workerResults = await Promise.all(promises);

    for (const result of workerResults) {
      results.set(result.subtaskId, result);
    }

    return results;
  }

  private async synthesizeResults(
    goal: Record<string, unknown>,
    subtasks: Subtask[],
    results: Map<string, WorkerResult>
  ): Promise<string> {
    const resultsObj: Record<string, string> = {};
    for (const [id, result] of results) {
      resultsObj[id] = result.success ? result.result : `Error: ${result.error}`;
    }

    const synthesisPrompt = `
Original goal:
${JSON.stringify(goal, null, 2)}

Subtasks executed:
${JSON.stringify(
  subtasks.map((st) => ({ id: st.id, description: st.description })),
  null,
  2
)}

Results from workers:
${JSON.stringify(resultsObj, null, 2)}

Please synthesize these results into a coherent final output that
achieves the original goal.
    `.trim();

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: synthesisPrompt }],
    });

    return message.content[0].type === "text" ? message.content[0].text : "";
  }

  async execute(goal: Record<string, unknown>): Promise<OrchestratorResult> {
    this.executionHistory = [];

    // Step 1: Plan subtasks
    const subtasks = await this.planSubtasks(goal);
    this.executionHistory.push({
      phase: "planning",
      data: {
        subtasks: subtasks.map((st) => ({
          id: st.id,
          description: st.description,
          workerType: st.workerType,
        })),
      },
    });

    // Step 2: Execute workers
    const resultsMap = await this.executeWorkers(subtasks);
    const workerResults = Array.from(resultsMap.values());
    this.executionHistory.push({
      phase: "execution",
      data: { results: Object.fromEntries(resultsMap) },
    });

    // Step 3: Synthesize
    const finalOutput = await this.synthesizeResults(goal, subtasks, resultsMap);
    this.executionHistory.push({
      phase: "synthesis",
      data: { output: finalOutput },
    });

    return {
      finalOutput,
      subtasks,
      workerResults,
      executionHistory: this.executionHistory,
    };
  }
}

// Example usage
async function exampleResearchTask() {
  const client = new Anthropic();

  // Create specialized workers
  const researchWorker = new LLMWorker(
    client,
    "research",
    `You are a research specialist. When given a research question,
    provide comprehensive, well-sourced information with key findings.`
  );

  const analysisWorker = new LLMWorker(
    client,
    "analysis",
    `You are a data analyst. When given information, identify patterns,
    trends, and insights. Provide clear analytical conclusions.`
  );

  const writingWorker = new LLMWorker(
    client,
    "writing",
    `You are a technical writer. Transform research and analysis into
    clear, well-structured prose for a professional audience.`
  );

  // Create orchestrator and register workers
  const orchestrator = new Orchestrator(client);
  orchestrator
    .registerWorker(researchWorker)
    .registerWorker(analysisWorker)
    .registerWorker(writingWorker);

  // Execute complex task
  const result = await orchestrator.execute({
    goal: "Create a comprehensive report on the current state of AI agent architectures",
    requirements: [
      "Survey recent developments",
      "Analyze trade-offs between approaches",
      "Write clear recommendations",
    ],
  });

  console.log("Final Report:");
  console.log(result.finalOutput);

  console.log("\n\nExecution History:");
  for (const entry of result.executionHistory) {
    console.log(`\nPhase: ${entry.phase}`);
    console.log(JSON.stringify(entry.data, null, 2));
  }
}

async function exampleCodeTask() {
  const client = new Anthropic();

  // Create code-focused workers
  const analyzerWorker = new LLMWorker(
    client,
    "analyzer",
    `You are a code analyzer. Examine code structure, identify patterns,
    and understand the architecture. Focus on dependencies and relationships.`
  );

  const generatorWorker = new LLMWorker(
    client,
    "generator",
    `You are a code generator. Write clean, well-documented code
    following best practices for the given language and framework.`
  );

  const testerWorker = new LLMWorker(
    client,
    "tester",
    `You are a test engineer. Write comprehensive tests covering
    edge cases, error handling, and normal operation.`
  );

  const documentorWorker = new LLMWorker(
    client,
    "documentor",
    `You are a technical documentation specialist. Write clear
    documentation including usage examples, API references, and guides.`
  );

  const orchestrator = new Orchestrator(client);
  orchestrator
    .registerWorker(analyzerWorker)
    .registerWorker(generatorWorker)
    .registerWorker(testerWorker)
    .registerWorker(documentorWorker);

  const result = await orchestrator.execute({
    goal: "Create a utility function to validate email addresses",
    requirements: [
      "Analyze best practices for email validation",
      "Generate TypeScript implementation",
      "Write unit tests",
      "Create documentation",
    ],
  });

  console.log("=== Code Task Results ===");
  console.log(result.finalOutput);
}

// Export for module usage
export { Orchestrator, LLMWorker, Subtask, WorkerResult, OrchestratorResult };

// Run example
exampleResearchTask().catch(console.error);
