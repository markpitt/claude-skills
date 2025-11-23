/**
 * Prompt Chaining Pattern Implementation
 * Sequential LLM calls with programmatic checkpoints
 */

import Anthropic from "@anthropic-ai/sdk";

interface ChainStep<TContext = any> {
  name: string;
  promptTemplate: (context: TContext) => string;
  validator?: (output: string) => boolean;
  processor?: (output: string) => any;
}

interface ChainHistory {
  step: string;
  prompt: string;
  output: string;
  context: any;
}

export class PromptChain<TContext extends Record<string, any> = Record<string, any>> {
  private steps: ChainStep<TContext>[] = [];
  private history: ChainHistory[] = [];

  constructor(
    private client: Anthropic,
    private model: string = "claude-3-5-sonnet-20241022"
  ) {}

  /**
   * Add a step to the chain
   */
  addStep(step: ChainStep<TContext>): this {
    this.steps.push(step);
    return this; // Allow chaining
  }

  /**
   * Execute the chain with initial context
   */
  async execute(initialContext: TContext): Promise<string> {
    const context = { ...initialContext };
    let currentOutput = "";

    for (const step of this.steps) {
      // Format prompt with current context
      const prompt = step.promptTemplate(context as TContext);

      // Call LLM
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });

      const textContent = message.content[0];
      if (textContent.type !== "text") {
        throw new Error("Expected text response");
      }
      currentOutput = textContent.text;

      // Validate if validator provided
      if (step.validator && !step.validator(currentOutput)) {
        throw new Error(
          `Step '${step.name}' validation failed. Output: ${currentOutput.substring(0, 100)}`
        );
      }

      // Process if processor provided
      if (step.processor) {
        const processed = step.processor(currentOutput);
        (context as any)[step.name] = processed;
      } else {
        (context as any)[step.name] = currentOutput;
      }

      // Track history
      this.history.push({
        step: step.name,
        prompt,
        output: currentOutput,
        context: { ...context },
      });
    }

    return currentOutput;
  }

  /**
   * Get execution history
   */
  getHistory(): ChainHistory[] {
    return this.history;
  }
}

// Example usage
interface DocumentContext {
  topic: string;
  outline?: string;
  draft?: string;
}

async function exampleDocumentGeneration() {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const chain = new PromptChain<DocumentContext>(client);

  // Step 1: Generate outline
  chain.addStep({
    name: "outline",
    promptTemplate: (ctx) => `Create a detailed outline for an article about: ${ctx.topic}`,
    validator: (output) => output.includes("1.") && output.includes("2."),
  });

  // Step 2: Expand outline
  chain.addStep({
    name: "draft",
    promptTemplate: (ctx) => `
      Expand this outline into a full article:
      ${ctx.outline}

      Write in a professional tone with clear examples.
    `,
    validator: (output) => output.split(" ").length > 200,
  });

  // Step 3: Proofread
  chain.addStep({
    name: "final",
    promptTemplate: (ctx) => `
      Proofread and polish this article:
      ${ctx.draft}

      Fix any grammar, improve clarity, and ensure consistent tone.
    `,
  });

  const result = await chain.execute({
    topic: "Building Effective AI Agents",
  });

  console.log("Final Article:");
  console.log(result);

  console.log("\n\nExecution History:");
  chain.getHistory().forEach((entry) => {
    console.log(`\nStep: ${entry.step}`);
    console.log(`Output length: ${entry.output.length} chars`);
  });
}

// Example with TypeScript generics for type safety
interface TranslationContext {
  topic: string;
  language: string;
  content?: string;
  terms?: string[];
}

async function exampleTypedChain() {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const chain = new PromptChain<TranslationContext>(client);

  chain.addStep({
    name: "content",
    promptTemplate: (ctx) => `Write a technical explanation of: ${ctx.topic}`,
  });

  chain.addStep({
    name: "terms",
    promptTemplate: (ctx) => `
      Extract technical terms from this text and define them:
      ${ctx.content}
    `,
    processor: (output) => {
      // Extract terms from output
      return output.split("\n").filter((line) => line.includes(":"));
    },
  });

  chain.addStep({
    name: "translation",
    promptTemplate: (ctx) => `
      Translate this text to ${ctx.language}, preserving these key terms: ${ctx.terms?.join(", ")}

      Text:
      ${ctx.content}
    `,
  });

  const result = await chain.execute({
    topic: "Quantum Computing",
    language: "Spanish",
  });

  return result;
}

// Export for use in other modules
export { exampleDocumentGeneration, exampleTypedChain };
