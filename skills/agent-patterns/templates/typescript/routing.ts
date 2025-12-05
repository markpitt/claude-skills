/**
 * Routing Pattern Implementation
 * Classify input and route to specialized handlers
 */

import Anthropic from "@anthropic-ai/sdk";

// Route types - extend as needed
enum RouteType {
  GENERAL = "general",
  REFUND = "refund",
  TECHNICAL = "technical",
  COMPLAINT = "complaint",
  UNKNOWN = "unknown",
}

interface RouteResult {
  route: RouteType;
  confidence: number;
  reasoning: string;
}

interface RouteHandler<T = string> {
  route: RouteType;
  handler: (input: string) => Promise<T>;
  description: string;
}

/**
 * Router that classifies input and routes to specialized handlers.
 *
 * @example
 * const router = new Router(client);
 * router.registerHandler(
 *   RouteType.REFUND,
 *   handleRefundRequest,
 *   "Handles refund and return requests"
 * );
 * const result = await router.route(userInput);
 */
class Router<T = string> {
  private client: Anthropic;
  private model: string;
  private handlers: Map<RouteType, RouteHandler<T>> = new Map();
  private fallbackHandler?: (input: string) => Promise<T>;

  constructor(client: Anthropic, model: string = "claude-sonnet-4-20250514") {
    this.client = client;
    this.model = model;
  }

  registerHandler(
    route: RouteType,
    handler: (input: string) => Promise<T>,
    description: string
  ): Router<T> {
    this.handlers.set(route, { route, handler, description });
    return this;
  }

  setFallback(handler: (input: string) => Promise<T>): Router<T> {
    this.fallbackHandler = handler;
    return this;
  }

  async classify(input: string): Promise<RouteResult> {
    // Build route descriptions for classification
    const routeDescriptions = Array.from(this.handlers.values())
      .map((h) => `- ${h.route}: ${h.description}`)
      .join("\n");

    const classificationPrompt = `Classify this input into exactly one category.

Available categories:
${routeDescriptions}
- unknown: Input doesn't fit any category

Input to classify:
${input}

Respond with JSON:
{
    "category": "category_name",
    "confidence": 0.0 to 1.0,
    "reasoning": "brief explanation"
}`;

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 256,
      messages: [{ role: "user", content: classificationPrompt }],
    });

    let responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Handle markdown code blocks
    if (responseText.includes("```json")) {
      responseText = responseText.split("```json")[1].split("```")[0];
    } else if (responseText.includes("```")) {
      responseText = responseText.split("```")[1].split("```")[0];
    }

    const result = JSON.parse(responseText.trim());

    // Map to RouteType enum
    const routeType =
      Object.values(RouteType).includes(result.category as RouteType)
        ? (result.category as RouteType)
        : RouteType.UNKNOWN;

    return {
      route: routeType,
      confidence: result.confidence ?? 0.5,
      reasoning: result.reasoning ?? "",
    };
  }

  async route(input: string): Promise<T> {
    const classification = await this.classify(input);

    // Get handler for classified route
    const handler = this.handlers.get(classification.route);
    if (handler) {
      return handler.handler(input);
    }

    // Use fallback if available
    if (this.fallbackHandler) {
      return this.fallbackHandler(input);
    }

    throw new Error(`No handler for route: ${classification.route}`);
  }
}

/**
 * Model-based routing: route to different models based on query complexity.
 */
class ModelRouter {
  private client: Anthropic;

  constructor(client: Anthropic) {
    this.client = client;
  }

  async assessComplexity(
    input: string
  ): Promise<"SIMPLE" | "MEDIUM" | "COMPLEX"> {
    const prompt = `Assess the complexity of this query.

Query: ${input}

Categories:
- SIMPLE: Basic factual questions, simple lookups, short answers
- MEDIUM: Requires some analysis or explanation
- COMPLEX: Requires deep analysis, multi-step reasoning, or expertise

Respond with just the category name: SIMPLE, MEDIUM, or COMPLEX`;

    const message = await this.client.messages.create({
      model: "claude-3-5-haiku-20241022", // Use cheap model for classification
      max_tokens: 10,
      messages: [{ role: "user", content: prompt }],
    });

    const response =
      message.content[0].type === "text"
        ? message.content[0].text.trim().toUpperCase()
        : "MEDIUM";

    return response as "SIMPLE" | "MEDIUM" | "COMPLEX";
  }

  async routeAndRespond(input: string): Promise<string> {
    const complexity = await this.assessComplexity(input);

    // Select model based on complexity
    let model: string;
    switch (complexity) {
      case "SIMPLE":
        model = "claude-3-5-haiku-20241022";
        break;
      case "MEDIUM":
        model = "claude-sonnet-4-20250514";
        break;
      case "COMPLEX":
        model = "claude-sonnet-4-20250514"; // or opus for most complex
        break;
    }

    const message = await this.client.messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: input }],
    });

    return message.content[0].type === "text" ? message.content[0].text : "";
  }
}

// Example usage
async function exampleCustomerService() {
  const client = new Anthropic();

  // Define handlers
  async function handleGeneral(input: string): Promise<string> {
    const message = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      system:
        "You are a helpful customer service agent answering general inquiries.",
      messages: [{ role: "user", content: input }],
    });
    return message.content[0].type === "text" ? message.content[0].text : "";
  }

  async function handleRefund(input: string): Promise<string> {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `You are a customer service agent specializing in refunds.
      
Policy:
- Full refund within 30 days
- 50% refund within 60 days
- No refund after 60 days
- Always verify purchase details first`,
      messages: [{ role: "user", content: input }],
    });
    return message.content[0].type === "text" ? message.content[0].text : "";
  }

  async function handleTechnical(input: string): Promise<string> {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: `You are a technical support specialist.
      
Process:
1. Identify the specific issue
2. Ask clarifying questions if needed
3. Provide step-by-step troubleshooting
4. Escalate to engineering if unresolved`,
      messages: [{ role: "user", content: input }],
    });
    return message.content[0].type === "text" ? message.content[0].text : "";
  }

  async function handleComplaint(_input: string): Promise<string> {
    return "Thank you for your feedback. Your complaint has been logged and a supervisor will contact you within 24 hours.";
  }

  async function handleUnknown(_input: string): Promise<string> {
    return "I'm not sure how to help with that. Could you please provide more details or rephrase your question?";
  }

  // Set up router
  const router = new Router(client);
  router
    .registerHandler(
      RouteType.GENERAL,
      handleGeneral,
      "General questions and information requests"
    )
    .registerHandler(
      RouteType.REFUND,
      handleRefund,
      "Refund and return requests"
    )
    .registerHandler(
      RouteType.TECHNICAL,
      handleTechnical,
      "Technical problems, bugs, and issues"
    )
    .registerHandler(
      RouteType.COMPLAINT,
      handleComplaint,
      "Complaints and negative feedback"
    )
    .setFallback(handleUnknown);

  // Test routing
  const testInputs = [
    "What are your business hours?",
    "I want a refund for my order #12345",
    "The app crashes when I click the settings button",
    "This is the worst service I've ever experienced!",
  ];

  for (const input of testInputs) {
    console.log(`\nInput: ${input}`);
    const classification = await router.classify(input);
    console.log(
      `Route: ${classification.route} (confidence: ${classification.confidence.toFixed(2)})`
    );
    console.log(`Reasoning: ${classification.reasoning}`);
    const response = await router.route(input);
    console.log(`Response: ${response.substring(0, 200)}...`);
  }
}

// Export for module usage
export { Router, ModelRouter, RouteType, RouteResult, RouteHandler };

// Run example if executed directly
exampleCustomerService().catch(console.error);
