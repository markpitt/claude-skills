/**
 * Autonomous Agent Pattern Implementation
 * Open-ended exploration with tool usage and environment feedback
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  Tool as AnthropicTool,
  MessageParam,
  ContentBlock,
} from "@anthropic-ai/sdk/resources/messages";

// Types
enum ActionType {
  TOOL_CALL = "tool_call",
  THINK = "think",
  RESPOND = "respond",
  FINISH = "finish",
}

interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

interface AgentAction {
  actionType: ActionType;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  thought?: string;
  response?: string;
}

interface AgentState {
  goal: string;
  history: Array<Record<string, unknown>>;
  stepCount: number;
  completed: boolean;
  result?: string;
}

interface StoppingCondition {
  maxSteps: number;
  maxToolErrors: number;
  timeoutSeconds?: number;
}

interface AgentResult {
  completed: boolean;
  result?: string;
  steps: number;
  history: Array<Record<string, unknown>>;
  stopReason: string;
}

/**
 * Autonomous agent that handles open-ended problems with tool usage.
 *
 * From Anthropic blog: "Agents begin their work with either a command from,
 * or interactive discussion with, the human user. Once the task is clear,
 * agents plan and operate independently, potentially returning to the human
 * for further information or judgement."
 *
 * Critical requirements:
 * 1. Environment Feedback - Agent must see results of actions
 * 2. Stopping Conditions - Prevent infinite loops
 * 3. Sandboxing - Contain potential damage
 * 4. Monitoring - Track agent behavior
 * 5. Human Oversight - Ability to intervene
 */
class AutonomousAgent {
  private client: Anthropic;
  private model: string;
  private tools: Map<string, Tool> = new Map();
  private state: AgentState | null = null;
  private stoppingCondition: StoppingCondition = {
    maxSteps: 50,
    maxToolErrors: 3,
  };
  private toolErrorCount: number = 0;
  private systemPrompt: string;

  constructor(
    client: Anthropic,
    model: string = "claude-sonnet-4-20250514",
    systemPrompt?: string
  ) {
    this.client = client;
    this.model = model;
    this.systemPrompt =
      systemPrompt ||
      `You are an autonomous agent that accomplishes goals by taking actions step by step.

For each step:
1. Analyze the current state and what you've learned
2. Decide on the next action to take
3. Use tools to interact with the environment
4. Learn from the results

Always think before acting. If you're unsure, ask for clarification.
When the goal is achieved, use the 'finish' action with your final result.`;
  }

  registerTool(tool: Tool): AutonomousAgent {
    this.tools.set(tool.name, tool);
    return this;
  }

  setStoppingCondition(
    maxSteps: number = 50,
    maxToolErrors: number = 3,
    timeoutSeconds?: number
  ): AutonomousAgent {
    this.stoppingCondition = { maxSteps, maxToolErrors, timeoutSeconds };
    return this;
  }

  private buildToolsSchema(): AnthropicTool[] {
    const tools: AnthropicTool[] = Array.from(this.tools.values()).map(
      (tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters as AnthropicTool["input_schema"],
      })
    );

    // Add finish tool
    tools.push({
      name: "finish",
      description:
        "Call this when the goal has been achieved. Provide the final result.",
      input_schema: {
        type: "object" as const,
        properties: {
          result: {
            type: "string",
            description: "The final result or answer",
          },
        },
        required: ["result"],
      },
    });

    return tools;
  }

  private async decideAction(): Promise<AgentAction> {
    if (!this.state) {
      throw new Error("Agent state not initialized");
    }

    // Build messages from history
    const messages: MessageParam[] = [];

    // Add goal
    messages.push({
      role: "user",
      content: `Goal: ${this.state.goal}\n\nProceed step by step to accomplish this goal.`,
    });

    // Add history as conversation
    for (const entry of this.state.history) {
      if (entry.type === "action") {
        if (entry.action_type === ActionType.TOOL_CALL) {
          messages.push({
            role: "assistant",
            content: [
              {
                type: "tool_use",
                id: (entry.tool_use_id as string) || "tool_1",
                name: entry.tool_name as string,
                input: entry.tool_args as Record<string, unknown>,
              },
            ],
          });
        } else if (entry.action_type === ActionType.THINK) {
          messages.push({
            role: "assistant",
            content: entry.thought as string,
          });
        }
      } else if (entry.type === "tool_result") {
        messages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: (entry.tool_use_id as string) || "tool_1",
              content: String(entry.result),
            },
          ],
        });
      } else if (entry.type === "observation") {
        messages.push({
          role: "user",
          content: `Observation: ${entry.content}`,
        });
      }
    }

    // If last message was from assistant, add continuation prompt
    if (
      messages.length === 0 ||
      messages[messages.length - 1].role === "assistant"
    ) {
      messages.push({
        role: "user",
        content: "Continue with the next step.",
      });
    }

    // Get next action from model
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: this.systemPrompt,
      tools: this.buildToolsSchema(),
      messages,
    });

    // Parse response into action
    for (const content of response.content) {
      if (content.type === "tool_use") {
        if (content.name === "finish") {
          return {
            actionType: ActionType.FINISH,
            response: (content.input as { result?: string }).result || "",
          };
        }
        return {
          actionType: ActionType.TOOL_CALL,
          toolName: content.name,
          toolArgs: content.input as Record<string, unknown>,
        };
      } else if (content.type === "text") {
        return {
          actionType: ActionType.THINK,
          thought: content.text,
        };
      }
    }

    // Default to thinking
    return {
      actionType: ActionType.THINK,
      thought: "Analyzing the situation...",
    };
  }

  private async executeTool(
    toolName: string,
    toolArgs: Record<string, unknown>
  ): Promise<unknown> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      this.toolErrorCount++;
      return { error: `Unknown tool: ${toolName}` };
    }

    try {
      const result = await tool.handler(toolArgs);
      return result;
    } catch (e) {
      this.toolErrorCount++;
      return { error: String(e) };
    }
  }

  private shouldStop(): [boolean, string] {
    if (!this.state) return [true, "No state"];

    if (this.state.completed) {
      return [true, "Goal completed"];
    }

    if (this.state.stepCount >= this.stoppingCondition.maxSteps) {
      return [true, `Max steps (${this.stoppingCondition.maxSteps}) reached`];
    }

    if (this.toolErrorCount >= this.stoppingCondition.maxToolErrors) {
      return [
        true,
        `Max tool errors (${this.stoppingCondition.maxToolErrors}) reached`,
      ];
    }

    return [false, ""];
  }

  async run(goal: string, initialContext?: string): Promise<AgentResult> {
    this.state = {
      goal,
      history: [],
      stepCount: 0,
      completed: false,
    };
    this.toolErrorCount = 0;

    // Add initial context if provided
    if (initialContext) {
      this.state.history.push({
        type: "observation",
        content: initialContext,
      });
    }

    let reason = "";

    while (true) {
      // Check stopping conditions
      const [shouldStop, stopReason] = this.shouldStop();
      if (shouldStop) {
        reason = stopReason;
        break;
      }

      // Decide next action
      const action = await this.decideAction();
      this.state.stepCount++;

      // Log action
      console.log(`[Step ${this.state.stepCount}] ${action.actionType}`);

      if (action.actionType === ActionType.FINISH) {
        this.state.completed = true;
        this.state.result = action.response;
        this.state.history.push({
          type: "action",
          action_type: action.actionType,
          response: action.response,
        });
        reason = "Goal achieved";
        break;
      } else if (action.actionType === ActionType.TOOL_CALL) {
        // Record the action
        const toolUseId = `tool_${this.state.stepCount}`;
        this.state.history.push({
          type: "action",
          action_type: action.actionType,
          tool_name: action.toolName,
          tool_args: action.toolArgs,
          tool_use_id: toolUseId,
        });

        // Execute and record result
        const result = await this.executeTool(
          action.toolName!,
          action.toolArgs!
        );
        console.log(`  Tool: ${action.toolName}`);
        console.log(`  Result: ${String(result).substring(0, 200)}...`);

        this.state.history.push({
          type: "tool_result",
          tool_use_id: toolUseId,
          result,
        });
      } else if (action.actionType === ActionType.THINK) {
        this.state.history.push({
          type: "action",
          action_type: action.actionType,
          thought: action.thought,
        });
        console.log(`  Thought: ${action.thought?.substring(0, 200)}...`);
      }
    }

    return {
      completed: this.state.completed,
      result: this.state.result,
      steps: this.state.stepCount,
      history: this.state.history,
      stopReason: reason,
    };
  }
}

// Example tools
function createSearchTool(): Tool {
  return {
    name: "search",
    description: "Search for information. Use this to find relevant data.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
      },
      required: ["query"],
    },
    handler: async (args) => {
      const query = args.query as string;
      // Mock search results
      return {
        results: [
          {
            title: `Result 1 for '${query}'`,
            snippet: "...relevant content...",
          },
          { title: `Result 2 for '${query}'`, snippet: "...more content..." },
        ],
      };
    },
  };
}

function createCalculatorTool(): Tool {
  return {
    name: "calculator",
    description: "Perform mathematical calculations",
    parameters: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description:
            "Mathematical expression to evaluate (e.g., '2 + 2', '10 * 5')",
        },
      },
      required: ["expression"],
    },
    handler: async (args) => {
      const expression = args.expression as string;
      try {
        // Basic safe eval for math only
        const result = Function(
          '"use strict"; return (' + expression + ")"
        )();
        return { result };
      } catch {
        return { error: "Invalid expression" };
      }
    },
  };
}

function createReadFileTool(): Tool {
  // Note: This is a mock - in production use fs.promises
  return {
    name: "read_file",
    description: "Read the contents of a file. Always use absolute paths.",
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Absolute path to the file to read",
        },
      },
      required: ["file_path"],
    },
    handler: async (args) => {
      const filePath = args.file_path as string;
      // Mock implementation
      return {
        content: `[Mock content of ${filePath}]`,
      };
    },
  };
}

// Example usage
async function exampleResearchAgent() {
  const client = new Anthropic();

  const agent = new AutonomousAgent(
    client,
    "claude-sonnet-4-20250514",
    `You are a research agent. Your job is to find information 
    and synthesize it into a clear answer. Use the search tool to find 
    relevant information. When you have enough information, use finish 
    to provide your final answer.`
  );

  agent.registerTool(createSearchTool());
  agent.registerTool(createCalculatorTool());
  agent.setStoppingCondition(10);

  const result = await agent.run(
    "What are the key benefits of using agent patterns in AI applications?"
  );

  console.log("\n=== Research Agent Results ===");
  console.log(`Completed: ${result.completed}`);
  console.log(`Steps: ${result.steps}`);
  console.log(`Stop reason: ${result.stopReason}`);
  console.log(`\nResult:\n${result.result}`);
}

// Export for module usage
export {
  AutonomousAgent,
  Tool,
  AgentAction,
  AgentState,
  AgentResult,
  ActionType,
  createSearchTool,
  createCalculatorTool,
  createReadFileTool,
};

// Run example
exampleResearchAgent().catch(console.error);
