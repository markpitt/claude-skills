# Agent Patterns Reference

Comprehensive reference for all agent patterns from Anthropic's "Building Effective Agents" engineering guide.

## Pattern Selection Guide

### Decision Tree

```
Does the task require multiple LLM calls?
├─ NO → Use single augmented LLM call with tools/RAG
└─ YES ↓

Are the subtasks known and fixed?
├─ YES ↓
│   └─ Are subtasks independent?
│       ├─ YES → Use Parallelization (Sectioning)
│       └─ NO → Use Prompt Chaining
└─ NO ↓

Can input be classified into distinct categories?
├─ YES → Use Routing
└─ NO ↓

Do you need iterative refinement with clear criteria?
├─ YES → Use Evaluator-Optimizer
└─ NO ↓

Are subtasks dynamically determined at runtime?
├─ YES ↓
│   └─ Is the number of steps predictable?
│       ├─ YES → Use Orchestrator-Workers
│       └─ NO → Use Autonomous Agents
└─ Reconsider if you need agentic workflow
```

## Pattern Details

### 1. Prompt Chaining

**Core Concept:** Decompose tasks into a fixed sequence of LLM calls where each step processes the previous output.

**Architecture:**
```
Input → LLM₁ → Output₁ → [Processing] → LLM₂ → Output₂ → ... → Final Output
```

**Key Characteristics:**
- Sequential execution
- Programmatic checkpoints between calls
- Each step can validate or transform data
- Predictable flow

**When to Use:**
✅ Fixed subtask sequence
✅ Each step requires different expertise/prompting
✅ Validation needed between steps
✅ Higher accuracy through specialization

**When NOT to Use:**
❌ Subtasks are unpredictable
❌ Need concurrent execution
❌ Branching logic based on intermediate results

**Implementation Considerations:**
- Store intermediate results appropriately
- Handle errors at each step
- Consider state management
- Log each step for debugging

**Real-World Examples:**
1. **Document Generation**
   - Step 1: Generate outline
   - Step 2: Validate structure
   - Step 3: Write introduction
   - Step 4: Write body sections
   - Step 5: Write conclusion
   - Step 6: Proofread and format

2. **Localization Pipeline**
   - Step 1: Generate English content
   - Step 2: Extract translatable strings
   - Step 3: Translate to target language
   - Step 4: Validate cultural appropriateness
   - Step 5: Format for target locale

**Code Skeleton:**
```
async function promptChaining(input) {
  const step1 = await llm("prompt for step 1", input);
  const validated = validateStep1(step1);

  const step2 = await llm("prompt for step 2", validated);
  const processed = processStep2(step2);

  const final = await llm("prompt for final step", processed);
  return final;
}
```

---

### 2. Routing

**Core Concept:** Classify input and route to specialized downstream processes.

**Architecture:**
```
Input → Classifier LLM → Route Decision
                            ├─ Route A → Specialized Handler A
                            ├─ Route B → Specialized Handler B
                            └─ Route C → Specialized Handler C
```

**Key Characteristics:**
- Single classification step
- Multiple specialized handlers
- Can route to different models or processes
- Often combined with other patterns

**When to Use:**
✅ Distinct input categories
✅ Categories benefit from different handling
✅ Classification accuracy is high
✅ Cost/performance optimization opportunities

**When NOT to Use:**
❌ All inputs need the same handling
❌ Classification is unreliable
❌ Overhead exceeds benefits

**Implementation Considerations:**
- Clear classification criteria in prompt
- Structured output for routing decision
- Fallback for unclassified inputs
- Monitoring of classification accuracy

**Real-World Examples:**
1. **Customer Service**
   - General inquiry → FAQ bot
   - Refund request → Refund processing system
   - Technical issue → Technical support agent
   - Complaint → Human escalation

2. **Model Selection**
   - Simple question → Fast, cheap model
   - Complex analysis → Capable, expensive model
   - Code generation → Specialized coding model

3. **Content Moderation**
   - Safe content → Publish
   - Borderline → Human review
   - Violation → Auto-reject

**Code Skeleton:**
```
async function routing(input) {
  const classification = await llm(
    "Classify this input into: A, B, or C",
    input
  );

  switch(classification) {
    case 'A': return await handleTypeA(input);
    case 'B': return await handleTypeB(input);
    case 'C': return await handleTypeC(input);
    default: return await handleDefault(input);
  }
}
```

---

### 3. Parallelization

**Two Variants:** Sectioning and Voting

#### 3a. Sectioning (Parallel Independent Tasks)

**Core Concept:** Break task into independent subtasks and execute concurrently.

**Architecture:**
```
Input → Split into Subtasks
         ├─ LLM₁(Subtask A) ─┐
         ├─ LLM₂(Subtask B) ─┤
         └─ LLM₃(Subtask C) ─┴→ Combine Results → Output
```

**When to Use:**
✅ Independent subtasks
✅ Speed is important
✅ Subtasks don't depend on each other
✅ Can combine results meaningfully

**Real-World Examples:**
- Multiple guardrails running simultaneously
- Analyzing different document sections
- Evaluating multiple performance aspects
- Multi-language translation

#### 3b. Voting (Parallel Same Task)

**Core Concept:** Run the same task multiple times and aggregate for robustness.

**Architecture:**
```
Input → Replicate
         ├─ LLM₁(Task) ─┐
         ├─ LLM₂(Task) ─┤
         └─ LLM₃(Task) ─┴→ Vote/Aggregate → Output
```

**When to Use:**
✅ Critical accuracy needed
✅ Consensus improves quality
✅ Different prompts/approaches available
✅ Cost of errors exceeds compute cost

**Real-World Examples:**
- Code security review (multiple perspectives)
- Content moderation (threshold voting)
- Medical diagnosis assistance
- Critical decision validation

**Code Skeleton:**
```
// Sectioning
async function sectioning(input, sections) {
  const promises = sections.map(section =>
    llm(`Process section: ${section.prompt}`, section.data)
  );
  const results = await Promise.all(promises);
  return combineResults(results);
}

// Voting
async function voting(input, numVotes = 3) {
  const promises = Array(numVotes).fill().map(() =>
    llm("prompt", input)
  );
  const votes = await Promise.all(promises);
  return aggregateVotes(votes);
}
```

---

### 4. Orchestrator-Workers

**Core Concept:** Central LLM dynamically decomposes task, delegates to workers, and synthesizes results.

**Architecture:**
```
Input → Orchestrator LLM ↔ Dynamic Planning
                           ├─ Worker₁(Subtask A)
                           ├─ Worker₂(Subtask B)
                           └─ Worker₃(Subtask C)
                                    ↓
                        Orchestrator Synthesis → Output
```

**Key Characteristics:**
- Dynamic subtask determination
- Runtime adaptation
- Central coordination
- Iterative delegation possible

**When to Use:**
✅ Subtasks unknown until runtime
✅ Complex, multi-component problems
✅ Flexibility needed based on input
✅ Workers can be specialized

**When NOT to Use:**
❌ Fixed, predictable workflow (use Prompt Chaining)
❌ Simple tasks (overhead not justified)
❌ Workers can't be meaningfully specialized

**Implementation Considerations:**
- Orchestrator prompt is critical
- Worker specialization vs generalization
- Result synthesis strategy
- Error handling and retry logic
- Cost monitoring (can be expensive)

**Real-World Examples:**
1. **Complex Code Changes**
   - Orchestrator analyzes requirements
   - Delegates: file analysis, code generation, testing, documentation
   - Synthesizes changes into coherent PR

2. **Research Tasks**
   - Orchestrator breaks down research question
   - Delegates: web search, data analysis, source verification
   - Synthesizes into comprehensive report

3. **Multi-Document Processing**
   - Orchestrator determines document relationships
   - Delegates: extraction, comparison, summarization
   - Synthesizes into unified output

**Code Skeleton:**
```
async function orchestratorWorkers(input) {
  // Orchestrator plans
  const plan = await orchestratorLLM(
    "Break this task into subtasks and assign to workers",
    input
  );

  // Execute worker tasks
  const workerResults = await Promise.all(
    plan.subtasks.map(subtask =>
      workerLLM(subtask.prompt, subtask.context)
    )
  );

  // Orchestrator synthesizes
  const final = await orchestratorLLM(
    "Synthesize worker results into final output",
    { original: input, results: workerResults }
  );

  return final;
}
```

---

### 5. Evaluator-Optimizer

**Core Concept:** One LLM generates, another evaluates and provides feedback for iterative refinement.

**Architecture:**
```
Input → Generator LLM → Output₁
              ↓                ↓
         [Feedback Loop] ← Evaluator LLM
              ↓
    Generator LLM → Output₂ → ... → Final Output
```

**Key Characteristics:**
- Iterative refinement loop
- Separation of generation and evaluation
- Feedback drives improvement
- Stopping condition needed

**When to Use:**
✅ Clear evaluation criteria exist
✅ Iteration improves quality
✅ Human feedback would help
✅ Quality matters more than speed

**When NOT to Use:**
❌ First attempt is usually sufficient
❌ No clear evaluation criteria
❌ Feedback doesn't improve output
❌ Time/cost constraints

**Implementation Considerations:**
- Max iteration limit to prevent infinite loops
- Clear evaluation criteria in prompts
- Structured feedback format
- Track improvement metrics
- Consider when to stop iterating

**Indicators of Good Fit:**
- Human reviewers currently improve outputs
- Multiple revision rounds common
- Quality varies significantly in first attempts
- Clear improvement path exists

**Real-World Examples:**
1. **Literary Translation**
   - Generator: Translate text
   - Evaluator: Check cultural nuance, idioms, tone
   - Iterate: Refine translation based on feedback

2. **Complex Search**
   - Generator: Create search query
   - Evaluator: Assess result relevance
   - Iterate: Refine query based on results

3. **Content Creation**
   - Generator: Write content
   - Evaluator: Check style, accuracy, engagement
   - Iterate: Improve based on criteria

**Code Skeleton:**
```
async function evaluatorOptimizer(input, maxIterations = 3) {
  let output = await generatorLLM("Generate initial output", input);

  for (let i = 0; i < maxIterations; i++) {
    const evaluation = await evaluatorLLM(
      "Evaluate and provide specific feedback",
      { input, output }
    );

    if (evaluation.score >= threshold) {
      break; // Good enough
    }

    output = await generatorLLM(
      "Improve based on feedback",
      { input, previous: output, feedback: evaluation.feedback }
    );
  }

  return output;
}
```

---

### 6. Autonomous Agents

**Core Concept:** Handle open-ended problems where required steps are unpredictable.

**Architecture:**
```
Input/Goal → Agent LLM ↔ [Planning Loop]
                         ├─ Tool Execution
                         ├─ Environment Feedback
                         └─ Replanning
                              ↓
                         Output (when stopping condition met)
```

**Key Characteristics:**
- Unpredictable step count
- Continuous planning and execution
- Environment interaction critical
- Stopping conditions essential
- Highest autonomy and risk

**When to Use:**
✅ Cannot predict required steps
✅ Cannot hardcode workflow
✅ High trust in model capabilities
✅ Sandboxed environment available
✅ Benefits justify costs and risks

**When NOT to Use:**
❌ Workflow can be predetermined
❌ Simple, bounded tasks
❌ Cannot tolerate errors
❌ No sandbox available
❌ Cost is primary concern

**Critical Requirements:**
1. **Environment Feedback** - "Ground truth" at each step
2. **Stopping Conditions** - Prevent infinite loops
3. **Sandboxing** - Contain potential damage
4. **Monitoring** - Track agent behavior
5. **Human Oversight** - Ability to intervene

**Implementation Considerations:**
- Cost can be 10-100x higher than simple patterns
- Errors compound across steps
- Requires robust tool design
- Need comprehensive testing
- Consider timeout and resource limits
- Implement guardrails

**Real-World Examples:**
1. **Software Engineering (SWE-bench)**
   - Read issue description
   - Explore codebase
   - Identify relevant files
   - Make changes
   - Run tests
   - Debug failures
   - Iterate until solved

2. **Computer Use**
   - Navigate applications
   - Click, type, interact
   - Verify outcomes
   - Adjust based on feedback
   - Complete multi-step tasks

3. **Research Agent**
   - Formulate search queries
   - Analyze results
   - Follow relevant links
   - Synthesize information
   - Identify gaps
   - Continue until comprehensive

**Code Skeleton:**
```
async function autonomousAgent(goal, maxSteps = 50) {
  let state = initializeState(goal);
  let steps = 0;

  while (!isGoalAchieved(state) && steps < maxSteps) {
    // Agent plans next action
    const action = await agentLLM(
      "Given goal and current state, decide next action",
      { goal, state, history: state.history }
    );

    // Execute in sandboxed environment
    const result = await executeInSandbox(action);

    // Get environment feedback
    state = updateState(state, action, result);
    steps++;

    // Check stopping conditions
    if (shouldStop(state)) break;
  }

  return state.result;
}
```

---

## Pattern Combinations

Patterns can be combined for complex workflows:

### Examples

**Routing + Prompt Chaining**
```
Input → Route → Chain A: Step 1 → Step 2 → Step 3
            └─→ Chain B: Step 1 → Step 2
```

**Orchestrator + Parallel Workers**
```
Input → Orchestrator → Worker₁ (Parallel Sectioning)
                    → Worker₂ (Evaluator-Optimizer)
                    → Worker₃ (Prompt Chaining)
```

**Routing + Autonomous Agent**
```
Input → Route → Simple → Prompt Chain
            └─→ Complex → Autonomous Agent
```

## Best Practices Across All Patterns

### 1. Start Simple
- Begin with single LLM call + tools
- Add patterns only when demonstrably beneficial
- Measure improvement objectively

### 2. Transparency
- Log all steps and decisions
- Make reasoning visible
- Enable debugging and monitoring

### 3. Tool Design
- Spend time on excellent tool interfaces
- Include examples and edge cases
- Make errors impossible (poka-yoke)
- Test extensively

### 4. Error Handling
- Plan for LLM failures
- Implement retries with backoff
- Graceful degradation where possible
- Clear error messages

### 5. Cost Management
- Monitor token usage
- Use appropriate models for each step
- Cache when possible
- Set budget limits

### 6. Testing
- Unit test individual components
- Integration test full workflows
- Use sandboxes for agents
- Monitor in production

### 7. Evaluation
- Define success metrics
- Measure against baselines
- A/B test improvements
- Collect user feedback

## Anti-Patterns

### ❌ Premature Complexity
Don't use sophisticated patterns when simple prompts suffice.

### ❌ Invisible Steps
Don't hide agent reasoning—show planning and decisions.

### ❌ Poor Tool Design
Don't rush tool interfaces—they're more critical than prompts.

### ❌ Unlimited Autonomy
Don't allow agents to run indefinitely—always have stopping conditions.

### ❌ No Monitoring
Don't deploy without logging, metrics, and alerting.

### ❌ Ignoring Costs
Don't implement expensive patterns without measuring ROI.

## Further Reading

- [Anthropic: Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- Agent-Computer Interface Design Principles
- Prompt Engineering Best Practices
