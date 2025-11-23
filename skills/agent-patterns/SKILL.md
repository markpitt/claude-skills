---
name: agent-patterns
description: Implements AI agent patterns from Anthropic's engineering guide including prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer, and autonomous agents. Use when building agentic systems or implementing agent workflows in C#, Rust, Python, Dart, Go, GenAIScript, TypeScript, or C.
version: 1.0
---

# Agent Patterns

This skill implements the agent patterns and workflows described in Anthropic's engineering article "Building Effective Agents". It provides guidance and code generation for creating production-ready agentic systems.

## How to Use This Skill

You can interact with this skill in two ways:

### 1. Brainstorm and Identify Patterns
Describe your use case or problem, and I'll help you identify which pattern(s) best fit your needs:

- "I need to build a system that processes customer support tickets"
- "I'm building an agent that needs to handle unpredictable research tasks"
- "I want to improve the quality of generated content through multiple revisions"

I'll ask clarifying questions, analyze your requirements, and recommend the most appropriate pattern or combination of patterns.

### 2. Direct Implementation Request
Request a specific pattern or combination in your preferred language:

- "Implement prompt chaining in Python for document generation"
- "Create an orchestrator-workers pattern in TypeScript"
- "Build a combined routing + evaluator-optimizer system in Rust"

I'll generate production-ready code with proper error handling, validation, and best practices.

## Supported Patterns

### 1. Prompt Chaining
Decompose complex tasks into sequential steps with programmatic checkpoints between LLM calls. Each step processes the previous output.

**When to use:**
- Tasks with fixed, predictable subtasks
- Need for higher accuracy through specialization
- Validation or transformation steps required between calls

**Examples:**
- Generate marketing copy → translate to multiple languages
- Create document outline → validate structure → write full document

### 2. Routing
Classify input and direct it to specialized downstream tasks or models.

**When to use:**
- Distinct categories that benefit from different handling
- Input can be accurately classified
- Different complexity levels requiring different model capabilities

**Examples:**
- Customer service routing (general/refunds/technical)
- Model selection based on query complexity

### 3. Parallelization

**Sectioning:** Break independent subtasks to run concurrently
- Implementing multiple guardrails simultaneously
- Automated evaluations across different aspects

**Voting:** Run the same task multiple times for robustness
- Multiple vulnerability reviews with different prompts
- Content moderation with consensus thresholds

### 4. Orchestrator-Workers
Central LLM dynamically decomposes tasks, delegates to workers, and synthesizes results.

**When to use:**
- Subtasks are unpredictable and input-dependent
- Dynamic delegation based on runtime conditions
- Complex multi-component problems

**Examples:**
- Multi-file code changes
- Research tasks requiring multiple information sources

### 5. Evaluator-Optimizer
One LLM generates responses while another provides iterative feedback for refinement.

**When to use:**
- Clear evaluation criteria exist
- Iterative refinement improves outputs
- Human feedback would improve results

**Examples:**
- Literary translation with nuance
- Complex search requiring query refinement

### 6. Autonomous Agents
Handle open-ended problems where step count is unpredictable.

**When to use:**
- Cannot predict required steps upfront
- Cannot hardcode a fixed path
- High trust in model decision-making
- Sandboxed environment available

**Examples:**
- Solving GitHub issues
- Computer use tasks

**Critical considerations:**
- Higher costs and error compounding risks
- Require robust stopping conditions
- Need environment "ground truth" at each step
- Essential to test in sandboxed environments

## Implementation Guidelines

### Tool Development Best Practices

1. **Format Selection**
   - Provide sufficient tokens for model reasoning
   - Keep formats close to naturally-occurring text
   - Minimize formatting overhead (line counting, escaping)

2. **Agent-Computer Interface (ACI) Optimization**
   - Include example usage and edge cases
   - Clear parameter names and descriptions
   - Apply "poka-yoke" principles—make mistakes impossible
   - Test extensively with varied inputs

3. **Real-world Insights**
   - Tool optimization often takes more time than prompt engineering
   - Simple changes (e.g., absolute vs relative paths) can eliminate entire error classes

### Core Principles

1. **Simplicity** – Start simple; add complexity only when demonstrably beneficial
2. **Transparency** – Explicitly show planning steps to users and developers
3. **Documentation** – Thoroughly document tool interfaces

### Model Context Protocol (MCP)

Use MCP for tool integration to enable:
- Third-party tool ecosystem integration
- Standardized tool interfaces
- Reusable tool definitions across agents

## Usage Instructions

### For Brainstorming Sessions

When the user describes a problem or use case:

1. **Ask Clarifying Questions**
   - What is the primary goal of the system?
   - Are the steps predictable or dynamic?
   - Do you need concurrent execution?
   - How important is iterative refinement?
   - What are the cost constraints?
   - What's the acceptable error tolerance?

2. **Analyze Requirements**
   - Map user needs to pattern characteristics
   - Consider trade-offs (cost, complexity, reliability)
   - Identify if pattern combinations are needed
   - Reference the decision tree in `resources/patterns-reference.md`

3. **Recommend Solution**
   - Suggest the most appropriate pattern(s)
   - Explain why this pattern fits their use case
   - Discuss alternatives and trade-offs
   - Provide examples of similar implementations

4. **Iterate on Design**
   - Refine based on user feedback
   - Address concerns and constraints
   - Suggest optimizations or simplifications

### For Direct Implementation

When the user requests a specific pattern implementation:

1. **Confirm Requirements**
   - Verify the pattern selection is appropriate
   - Confirm the target programming language
   - Understand any specific constraints or requirements

2. **Select Language**
   - Use the specified programming language from supported options:
     - C#, Rust, Python, Dart, Go, GenAIScript, TypeScript, C
   - Reference language-specific templates from `templates/`

3. **Implement the Pattern**
   - Generate production-ready code following best practices
   - Include proper error handling and logging
   - Add comments explaining the pattern implementation
   - Demonstrate tool interface design if applicable
   - Show usage examples

4. **Provide Context**
   - Explain why this pattern fits the use case
   - Note any trade-offs or considerations
   - Suggest testing strategies
   - Recommend next steps or enhancements
   - Reference relevant sections from `resources/patterns-reference.md`

## Language-Specific Considerations

### C# / .NET
- Use async/await for LLM calls
- Leverage dependency injection for tool registration
- Consider Microsoft Semantic Kernel integration

### Rust
- Use tokio for async operations
- Leverage type system for compile-time guarantees
- Consider using async-trait for abstraction

### Python
- Use asyncio for concurrent operations
- Type hints for better tool interfaces
- Consider LangChain or direct API clients

### TypeScript/GenAIScript
- Promise-based async patterns
- Strong typing for tool definitions
- Consider Vercel AI SDK or LangChain.js

### Go
- Goroutines for parallelization
- Channels for worker communication
- Context for cancellation and timeouts

### Dart
- Future/async for asynchronous operations
- Isolates for true parallelization
- Strong typing for tool interfaces

### C
- Function pointers for callbacks
- Manual memory management for tool state
- POSIX threads for concurrency

## File References

For detailed pattern descriptions and examples:
- See `resources/patterns-reference.md` for comprehensive pattern documentation
- See `resources/tool-design.md` for tool development guidelines
- See `templates/` for language-specific implementation templates

## Examples

### Brainstorming Examples

**User:** "I'm building a customer support system. Should I use an agent?"

**Response approach:**
- Ask: What types of queries do you handle? Do they fall into distinct categories?
- Suggest: Routing pattern for categorization + specialized handlers
- Or: Orchestrator-workers if queries require multi-step resolution
- Discuss: Cost implications, accuracy needs, human-in-the-loop requirements

**User:** "I need to generate high-quality marketing content that gets reviewed multiple times"

**Response approach:**
- Identify: Evaluator-Optimizer pattern is ideal
- Ask: What are your evaluation criteria? Who defines quality?
- Suggest: Generator creates content, Evaluator provides feedback, iterate until criteria met
- Discuss: Number of iterations, stopping conditions, cost vs quality trade-offs

### Direct Implementation Examples

**Good requests:**
- "Implement a prompt chaining pattern in Python for document generation"
- "Create an orchestrator-workers system in C# for multi-file code changes"
- "Build a routing agent in Rust that classifies customer queries"
- "I need a combined routing + autonomous agent in TypeScript for handling complex vs simple tasks"

**Requests that need clarification:**
- "Make an AI agent" → Ask about the specific use case and requirements
- "Add intelligence to my app" → Ask what specific capability they need
- "Build something with AI" → Ask about their goal and constraints

### Expected Outputs

**For brainstorming:**
- Pattern recommendation with justification
- Trade-off analysis
- Implementation considerations
- Example use cases
- Next steps for implementation

**For direct implementation:**
- Complete, runnable code in the requested language
- Clear comments explaining the pattern
- Error handling and edge cases
- Usage examples with realistic scenarios
- Testing recommendations
- Deployment considerations

## Notes

- Always start with the simplest pattern that meets requirements
- Add complexity only when demonstrably beneficial
- Tool interface design is often more important than prompt engineering
- Test extensively in sandboxed environments for autonomous agents
- Consider costs and error compounding for complex workflows

## Version History

- 1.0 - Initial release with all six agent patterns and eight language support
