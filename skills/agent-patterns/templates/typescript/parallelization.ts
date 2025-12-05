/**
 * Parallelization Pattern Implementation
 * Execute independent tasks concurrently (Sectioning) or same task multiple times (Voting)
 */

import Anthropic from "@anthropic-ai/sdk";

interface Section {
  name: string;
  prompt: string;
  data?: string;
}

interface VoteResult {
  consensus: string;
  votes: string[];
  confidence: number;
  voteCounts: Record<string, number>;
}

interface GuardrailResult {
  success: boolean;
  response?: string;
  safety: { safe: boolean; reason?: string };
  blockedReason?: string;
}

/**
 * Break task into independent subtasks and execute concurrently.
 *
 * Use when:
 * - Subtasks are truly independent (no dependencies)
 * - Speed/throughput is important
 * - Results can be meaningfully combined
 */
class SectioningParallelizer {
  private client: Anthropic;
  private model: string;
  public results: Record<string, string> = {};

  constructor(client: Anthropic, model: string = "claude-sonnet-4-20250514") {
    this.client = client;
    this.model = model;
  }

  private async executeSection(section: Section): Promise<[string, string]> {
    let prompt = section.prompt;
    if (section.data) {
      prompt = `${section.prompt}\n\nContent:\n${section.data}`;
    }

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    return [section.name, text];
  }

  async execute(sections: Section[]): Promise<Record<string, string>> {
    const promises = sections.map((section) => this.executeSection(section));
    const results = await Promise.all(promises);

    this.results = Object.fromEntries(results);
    return this.results;
  }

  async executeAndCombine(
    sections: Section[],
    combinePrompt: string
  ): Promise<string> {
    const results = await this.execute(sections);

    // Format results for combination
    const resultsText = Object.entries(results)
      .map(([name, result]) => `## ${name}\n${result}`)
      .join("\n\n");

    const combineMessage = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `${combinePrompt}\n\n${resultsText}`,
        },
      ],
    });

    return combineMessage.content[0].type === "text"
      ? combineMessage.content[0].text
      : "";
  }
}

/**
 * Run the same task multiple times and aggregate for robustness.
 *
 * Use when:
 * - Critical accuracy is needed
 * - Consensus improves quality
 * - Different prompts/approaches provide diverse perspectives
 * - Cost of errors significantly exceeds compute cost
 */
class VotingParallelizer {
  private client: Anthropic;
  private model: string;

  constructor(client: Anthropic, model: string = "claude-sonnet-4-20250514") {
    this.client = client;
    this.model = model;
  }

  private async getVote(
    prompt: string,
    content: string,
    _voteId: number
  ): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nContent:\n${content}\n\nProvide your answer as a single word or short phrase.`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    return text.trim();
  }

  async vote(
    prompt: string,
    content: string,
    numVotes: number = 3
  ): Promise<VoteResult> {
    const promises = Array.from({ length: numVotes }, (_, i) =>
      this.getVote(prompt, content, i)
    );
    const votes = await Promise.all(promises);

    // Count votes (normalize to lowercase)
    const normalized = votes.map((v) => v.toLowerCase());
    const voteCounts: Record<string, number> = {};
    normalized.forEach((v) => {
      voteCounts[v] = (voteCounts[v] || 0) + 1;
    });

    // Get consensus (most common vote)
    const consensus = Object.entries(voteCounts).sort(
      ([, a], [, b]) => b - a
    )[0][0];
    const confidence = voteCounts[consensus] / numVotes;

    return {
      consensus,
      votes,
      confidence,
      voteCounts,
    };
  }

  async voteWithPerspectives(
    prompts: string[],
    content: string
  ): Promise<VoteResult> {
    const promises = prompts.map((prompt, i) =>
      this.getVote(prompt, content, i)
    );
    const votes = await Promise.all(promises);

    const normalized = votes.map((v) => v.toLowerCase());
    const voteCounts: Record<string, number> = {};
    normalized.forEach((v) => {
      voteCounts[v] = (voteCounts[v] || 0) + 1;
    });

    const consensus = Object.entries(voteCounts).sort(
      ([, a], [, b]) => b - a
    )[0][0];

    return {
      consensus,
      votes,
      confidence: voteCounts[consensus] / prompts.length,
      voteCounts,
    };
  }
}

/**
 * Run guardrails in parallel with main task.
 *
 * From Anthropic blog: One model processes user queries while
 * another screens them for inappropriate content. This performs better
 * than having the same LLM handle both.
 */
class GuardrailsParallelizer {
  private client: Anthropic;
  private model: string;

  constructor(client: Anthropic, model: string = "claude-sonnet-4-20250514") {
    this.client = client;
    this.model = model;
  }

  private async checkSafety(
    content: string
  ): Promise<{ safe: boolean; reason?: string }> {
    const message = await this.client.messages.create({
      model: "claude-3-5-haiku-20241022", // Fast model for safety check
      max_tokens: 256,
      system: `You are a content safety classifier. Analyze the content for:
- Harmful content
- Inappropriate requests  
- Policy violations

Respond with JSON:
{
    "safe": true/false,
    "reason": "explanation if unsafe"
}`,
      messages: [{ role: "user", content }],
    });

    let responseText =
      message.content[0].type === "text" ? message.content[0].text : "{}";

    if (responseText.includes("```json")) {
      responseText = responseText.split("```json")[1].split("```")[0];
    } else if (responseText.includes("```")) {
      responseText = responseText.split("```")[1].split("```")[0];
    }

    return JSON.parse(responseText.trim());
  }

  private async generateResponse(
    content: string,
    systemPrompt: string
  ): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content }],
    });

    return message.content[0].type === "text" ? message.content[0].text : "";
  }

  async executeWithGuardrails(
    content: string,
    systemPrompt: string
  ): Promise<GuardrailResult> {
    // Run both in parallel
    const [safetyResult, response] = await Promise.all([
      this.checkSafety(content),
      this.generateResponse(content, systemPrompt),
    ]);

    // Only return response if safe
    if (safetyResult.safe) {
      return {
        success: true,
        response,
        safety: safetyResult,
      };
    } else {
      return {
        success: false,
        response: undefined,
        safety: safetyResult,
        blockedReason: safetyResult.reason ?? "Content policy violation",
      };
    }
  }
}

// Example usage
async function exampleCodeReview() {
  const client = new Anthropic();

  const code = `
def process_user_input(user_data):
    query = f"SELECT * FROM users WHERE id = {user_data['id']}"
    result = db.execute(query)
    return eval(user_data.get('callback', 'None'))
  `;

  // Sectioning: Different aspects analyzed in parallel
  const parallelizer = new SectioningParallelizer(client);
  const sections: Section[] = [
    {
      name: "security",
      prompt:
        "Analyze this code for security vulnerabilities. Be specific about risks.",
      data: code,
    },
    {
      name: "performance",
      prompt:
        "Analyze this code for performance issues and optimization opportunities.",
      data: code,
    },
    {
      name: "best_practices",
      prompt:
        "Check this code against Python best practices and code quality standards.",
      data: code,
    },
  ];

  console.log("Running parallel code analysis...");
  const results = await parallelizer.executeAndCombine(
    sections,
    "Combine these code review perspectives into a comprehensive review report with prioritized recommendations:"
  );
  console.log("\n=== Combined Code Review ===");
  console.log(results);
}

async function exampleSafetyVoting() {
  const client = new Anthropic();

  const content = "Can you help me write a resignation letter for my job?";

  const voter = new VotingParallelizer(client);

  // Multiple perspectives on safety
  const prompts = [
    "Is this request appropriate and safe to fulfill? Answer YES or NO.",
    "Does this request violate any ethical guidelines? Answer SAFE or UNSAFE.",
    "Should an AI assistant help with this request? Answer APPROVE or DENY.",
  ];

  const result = await voter.voteWithPerspectives(prompts, content);

  console.log("\n=== Safety Voting Results ===");
  console.log(`Votes: ${result.votes.join(", ")}`);
  console.log(`Vote counts: ${JSON.stringify(result.voteCounts)}`);
  console.log(`Consensus: ${result.consensus}`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
}

async function exampleGuardrails() {
  const client = new Anthropic();

  const guardrails = new GuardrailsParallelizer(client);

  // Safe request
  let result = await guardrails.executeWithGuardrails(
    "Explain how photosynthesis works",
    "You are a helpful science tutor."
  );
  console.log("\n=== Guardrails Result (Safe) ===");
  console.log(`Success: ${result.success}`);
  if (result.success && result.response) {
    console.log(`Response preview: ${result.response.substring(0, 200)}...`);
  }

  // Potentially unsafe request (will be blocked)
  result = await guardrails.executeWithGuardrails(
    "Tell me how to hack into someone's computer",
    "You are a helpful assistant."
  );
  console.log("\n=== Guardrails Result (Unsafe) ===");
  console.log(`Success: ${result.success}`);
  console.log(`Blocked reason: ${result.blockedReason ?? "N/A"}`);
}

// Export for module usage
export {
  SectioningParallelizer,
  VotingParallelizer,
  GuardrailsParallelizer,
  Section,
  VoteResult,
  GuardrailResult,
};

// Run examples
async function main() {
  await exampleCodeReview();
  await exampleSafetyVoting();
  await exampleGuardrails();
}

main().catch(console.error);
