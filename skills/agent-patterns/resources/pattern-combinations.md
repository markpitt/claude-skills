# Pattern Combinations and Advanced Workflows

Complex agent architectures combining multiple patterns.

## Why Combine Patterns?

Simple patterns work well for straightforward use cases, but real-world problems often need combinations:
- **Routing + Prompt Chaining**: Different input types need different workflows
- **Orchestrator + Evaluator-Optimizer**: Decompose task, then refine results
- **Routing + Autonomous Agent**: Route to appropriate complexity level
- **Parallelization + Evaluator-Optimizer**: Parallel generation, then evaluate all

---

## Pattern Combination 1: Routing + Prompt Chaining

**Use Case**: Different input types require different sequential workflows.

**Architecture:**
```
Input → Classifier
         ├─ Route A → Chain A: Step 1 → Step 2 → Step 3
         ├─ Route B → Chain B: Step 1 → Step 2
         └─ Route C → Specialized Handler
```

**Example: Customer Service**
- Route: Classify ticket type
  - REFUND → Refund Chain: Analyze → Check Policy → Generate Response
  - TECHNICAL → Technical Chain: Diagnose → Research Solutions → Recommend
  - COMPLAINT → Escalation Chain: Classify Severity → Route to Manager → Log

**Implementation Pattern:**
```typescript
async function routingWithChaining(input: string) {
  // Step 1: Route
  const route = await classifier(input);
  
  // Step 2: Execute appropriate chain
  if (route.type === 'REFUND') {
    return await refundChain(input);
  } else if (route.type === 'TECHNICAL') {
    return await technicalChain(input);
  } else {
    return await escalationChain(input);
  }
}

async function refundChain(input: string) {
  const analysis = await llm("Analyze refund request", input);
  const policyCheck = await llm("Check against policy", analysis);
  return await llm("Generate response", policyCheck);
}
```

**Cost-Benefit:**
- 1 routing call + N chaining calls (N depends on route)
- Better than single chain for all types
- Clear separation of concerns

---

## Pattern Combination 2: Orchestrator + Parallelization

**Use Case**: Decompose task, execute subtasks in parallel.

**Architecture:**
```
Input → Orchestrator Decomposes
         ├─ Worker 1 (Parallelization: Sectioning)
         │  ├─ Subtask A
         │  ├─ Subtask B (parallel)
         │  └─ Subtask C (parallel)
         ├─ Worker 2 (Standard)
         └─ Worker 3 (Parallelization: Sectioning)
              ↓
         Orchestrator Synthesizes → Output
```

**Example: Complex Code Review**
- Orchestrator analyzes: Determines aspects to check
- Workers run in parallel:
  - Worker 1: Functionality (parallelized: logic flow, error handling, edge cases)
  - Worker 2: Performance (sequential analysis)
  - Worker 3: Security (parallelized: SQL injection, XSS, auth checks)
- Orchestrator synthesizes all reviews

**Implementation:**
```typescript
async function orchestratorWithParallelization(input: string) {
  const plan = await orchestrator("Analyze and plan checks", input);
  
  const results = await Promise.all(plan.workers.map(worker =>
    executeWorker(worker, input)
  ));
  
  // Within each worker that uses parallelization
  async function executeWorker(worker: Worker, input: string) {
    if (worker.parallelizable) {
      const subtasks = worker.subtasks;
      const results = await Promise.all(
        subtasks.map(subtask => llm(subtask.prompt, input))
      );
      return combineResults(results);
    } else {
      return await llm(worker.prompt, input);
    }
  }
  
  return await orchestrator("Synthesize results", {input, results});
}
```

---

## Pattern Combination 3: Routing + Autonomous Agent

**Use Case**: Route based on complexity; simple cases get fast handling, complex cases get agentic.

**Architecture:**
```
Input → Complexity Classifier
         ├─ SIMPLE → Routing to Specialized Handlers
         ├─ MEDIUM → Prompt Chaining
         └─ COMPLEX → Autonomous Agent
```

**Example: Software Support**
- Simple Questions (FAQ, password reset) → Direct routing to handlers
- Medium Complexity (feature explanations, integration help) → Prompt chaining
- Complex (system design help, bug diagnosis) → Autonomous agent with tools

**Implementation:**
```typescript
async function routeByComplexity(input: string) {
  const complexity = await assessComplexity(input);
  
  switch(complexity.level) {
    case 'SIMPLE':
      return await handleSimple(input);
    case 'MEDIUM':
      return await chainedApproach(input);
    case 'COMPLEX':
      return await autonomousAgent(input);
  }
}

function assessComplexity(input: string): {level: string, confidence: number} {
  // Could be another LLM call or heuristic-based
  const wordCount = input.split(' ').length;
  const hasCode = input.includes('code') || input.includes('error');
  const hasMultipleParts = input.split('?').length > 2;
  
  if (wordCount < 50 && !hasCode) return {level: 'SIMPLE', confidence: 0.9};
  if (wordCount < 200 && !hasMultipleParts) return {level: 'MEDIUM', confidence: 0.8};
  return {level: 'COMPLEX', confidence: 0.7};
}
```

---

## Pattern Combination 4: Evaluator-Optimizer with Routing

**Use Case**: Evaluate outputs, refine with different approach if needed.

**Architecture:**
```
Input → Generator
         ↓
Evaluator LLM (Classifier)
├─ Score > Threshold → Output
├─ Refinable Issues → Route to Improvement Strategy 1
└─ Complex Issues → Route to Improvement Strategy 2
     ↓
New Output → Evaluator (re-evaluate)
```

**Example: Content Generation**
- Generate initial content
- Evaluate against criteria
  - If GOOD → Done
  - If fixable issues → Re-generate with specific feedback
  - If structural issues → Route to rewrite with different approach

**Implementation:**
```typescript
async function evaluatorWithRouting(input: string, maxIterations = 3) {
  let output = await generator(input);
  
  for (let i = 0; i < maxIterations; i++) {
    const evaluation = await evaluator(output);
    
    if (evaluation.score >= threshold) {
      break; // Success
    }
    
    // Route based on issue type
    if (evaluation.issueType === 'FIXABLE') {
      // Small improvements
      output = await generator(
        `Improve: ${evaluation.feedback}`,
        output
      );
    } else if (evaluation.issueType === 'STRUCTURAL') {
      // Major rewrite needed
      output = await rewriter(
        `Rewrite with focus on: ${evaluation.suggestion}`,
        input
      );
    } else {
      break; // Can't improve
    }
  }
  
  return output;
}
```

---

## Pattern Combination 5: Orchestrator + Evaluator-Optimizer

**Use Case**: Orchestrator decomposes, each worker output is evaluated and refined.

**Architecture:**
```
Input → Orchestrator Plans
         ├─ Worker 1 → Output₁ → Evaluator → Refined Output₁
         ├─ Worker 2 → Output₂ → Evaluator → Refined Output₂
         └─ Worker 3 → Output₃ → Evaluator → Refined Output₃
              ↓
         Orchestrator Synthesizes
```

**Example: Technical Document Generation**
- Orchestrator decomposes: Introduction, Architecture, Implementation, Conclusion
- Each section:
  - Worker generates
  - Evaluator checks clarity, accuracy, consistency
  - Iterate if needed
- Orchestrator synthesizes into coherent document

**Implementation:**
```typescript
async function orchestratorWithRefinement(input: string) {
  const plan = await orchestrator("Plan document sections", input);
  
  const refinedResults = await Promise.all(
    plan.sections.map(async section => {
      let output = await worker(section.prompt, input);
      
      // Evaluate and refine this section
      for (let i = 0; i < 3; i++) {
        const evaluation = await evaluator(
          `Evaluate section against criteria: ${section.criteria}`,
          output
        );
        
        if (evaluation.acceptable) break;
        
        output = await worker(
          `Improve section: ${evaluation.feedback}`,
          { input, previous: output, section }
        );
      }
      
      return { section: section.name, output };
    })
  );
  
  return await orchestrator("Synthesize sections", refinedResults);
}
```

---

## Pattern Combination 6: Parallel Orchestrators

**Use Case**: Multiple independent problem decompositions, synthesized at top level.

**Architecture:**
```
Input → Orchestrator 1 (Perspective A)
         ├─ Worker 1A
         ├─ Worker 2A
         └─ Worker 3A
              ↓
        Orchestrator 2 (Perspective B)
         ├─ Worker 1B
         ├─ Worker 2B
         └─ Worker 3B
              ↓
        Top-Level Synthesizer → Output
```

**Example: Business Strategy Analysis**
- Orchestrator 1: Financial Perspective
  - Worker 1: Revenue analysis
  - Worker 2: Cost analysis
  - Worker 3: Profitability
- Orchestrator 2: Market Perspective
  - Worker 1: Competitive analysis
  - Worker 2: Market trends
  - Worker 3: Customer segments
- Top Synthesizer: Integrated strategy

**Implementation:**
```typescript
async function parallelOrchestrators(input: string) {
  const perspectives = ['financial', 'market', 'operational'];
  
  const analyses = await Promise.all(
    perspectives.map(perspective =>
      orchestratorForPerspective(perspective, input)
    )
  );
  
  return await topLevelSynthesizer(input, analyses);
}

async function orchestratorForPerspective(
  perspective: string,
  input: string
) {
  const plan = await orchestrator(
    `Analyze from ${perspective} perspective`,
    input
  );
  
  const results = await Promise.all(
    plan.workers.map(worker => worker.execute(input))
  );
  
  return await orchestrator(
    `Synthesize ${perspective} analysis`,
    results
  );
}
```

---

## Pattern Combination 7: Cascading Complexity

**Use Case**: Start simple, increase complexity until satisfactory.

**Architecture:**
```
Input → Simple Approach
         ↓
    Is output good?
    ├─ YES → Done
    └─ NO → Medium Approach
             ↓
        Is output good?
        ├─ YES → Done
        └─ NO → Complex Approach
```

**Example: Problem Solving**
- Try simple prompt first (fast, cheap)
- If unsatisfactory, try prompt chaining (medium cost)
- If still unsatisfactory, use orchestrator-workers (higher cost)
- If still needed, consider autonomous agent (highest cost)

**Implementation:**
```typescript
async function cascadingComplexity(
  input: string,
  acceptableThreshold = 0.7
): Promise<string> {
  // Level 1: Simple
  let output = await llm("Simple prompt", input);
  let score = await evaluateOutput(output);
  
  if (score >= acceptableThreshold) {
    return output;
  }
  
  // Level 2: Chaining
  output = await promptChaining(input);
  score = await evaluateOutput(output);
  
  if (score >= acceptableThreshold) {
    return output;
  }
  
  // Level 3: Orchestrator
  output = await orchestratorWorkers(input);
  score = await evaluateOutput(output);
  
  if (score >= acceptableThreshold) {
    return output;
  }
  
  // Level 4: Autonomous
  output = await autonomousAgent(input);
  
  return output;
}
```

---

## Decision Framework: Which Combination?

### Quick Reference Table

| Problem Type | Recommended Combination | Reason |
|------|------|------|
| Different inputs need different workflows | Routing + Chaining | Route determines workflow |
| Need parallel work on decomposed task | Orchestrator + Parallelization | Decompose then parallelize |
| Complexity varies significantly | Routing by Complexity | Match complexity to approach |
| Output quality matters most | Evaluator + Routing | Evaluate, refine differently |
| Multiple perspectives valuable | Parallel Orchestrators | Independent analyses synthesized |
| May need increasing complexity | Cascading Complexity | Start simple, escalate if needed |
| Decompose + Quality check | Orchestrator + Evaluator | Decompose then refine each part |

### Decision Tree

```
Does input type determine approach?
├─ YES → Route (+ appropriate pattern for each route)
└─ NO ↓

Does output quality need iterative improvement?
├─ YES → Evaluator-Optimizer (+ routing if strategies differ)
└─ NO ↓

Must you decompose task dynamically?
├─ YES → Orchestrator-Workers
│       ├─ Sub-question: Can workers run in parallel?
│       │   ├─ YES → Add Parallelization
│       │   └─ NO → Sequential workers
│       └─ Sub-question: Do results need refinement?
│           ├─ YES → Add Evaluator-Optimizer to workers
│           └─ NO → Done
└─ NO ↓

Would multiple perspectives improve solution?
├─ YES → Parallel Orchestrators
└─ NO → Use single simple or chained approach
```

---

## Cost-Complexity Trade-offs

### Cost Ranking (approximate)
```
1. Simple augmented LLM call          ~1x
2. Prompt Chaining                    ~2-3x
3. Routing                            ~1.1-1.5x (routing call + handler)
4. Parallelization (Sectioning)       ~1-N x (depends on sections)
5. Orchestrator-Workers               ~3-10x (plan + workers)
6. Evaluator-Optimizer                ~3-5x per iteration
7. Autonomous Agents                  ~10-100x
8. Combinations                       Multiplicative
```

### Quality Ranking
```
1. Simple augmented LLM                70-80%
2. Routing                             75-85% (if routing accurate)
3. Prompt Chaining                     80-90%
4. Parallelization                     85-92%
5. Evaluator-Optimizer                 85-95%
6. Orchestrator-Workers                85-95%
7. Combinations                        90-98%
8. Autonomous Agents                   75-95% (highly variable)
```

### Guidance: Choose Based on Task
- **Cost-Critical**: Use simple prompt + routing
- **Quality-Critical**: Use Orchestrator + Evaluator or combinations
- **Unpredictable Workflows**: Use Orchestrator or Autonomous Agent
- **Consistency Important**: Use Chaining or Routing
- **Speed Critical**: Minimize complexity, use Parallelization where applicable

---

## Testing Combinations

### Test Scenarios for Each Combination
1. **Happy Path**: Inputs that work well with the combination
2. **Edge Cases**: Inputs that test boundaries
3. **Failure Cases**: Inputs that should gracefully fail
4. **Cost Cases**: Measure token usage and cost
5. **Quality Cases**: Measure output quality

### Example Test for Routing + Chaining
```typescript
const testCases = [
  {
    input: "I need a refund",
    expectedRoute: "REFUND",
    qualityExpectation: "high"
  },
  {
    input: "My app crashes when I click the button",
    expectedRoute: "TECHNICAL",
    qualityExpectation: "high"
  },
  {
    input: "Your service is terrible!",
    expectedRoute: "COMPLAINT",
    qualityExpectation: "handle gracefully"
  },
  {
    input: "???",
    expectedRoute: "FALLBACK",
    qualityExpectation: "clarify or escalate"
  }
];
```

---

## Common Pitfalls in Combinations

### ❌ Pitfall 1: Over-Combination
Using more patterns than necessary.

```typescript
// Bad: Too complex
Routing → Chaining → Orchestrator → Evaluator → Parallelization

// Good: Focused combination
Routing → Chaining  (or just routing alone if sufficient)
```

### ❌ Pitfall 2: No Cost Monitoring
Combinations can multiply costs unexpectedly.

```typescript
// Good: Track costs at each stage
async function trackedCombination(input: string) {
  let totalCost = 0;
  
  const route = await router(input);
  totalCost += estimateCost(route);
  
  const chain = await executeChain(route);
  totalCost += estimateCost(chain);
  
  if (totalCost > budget) {
    // Handle budget exceeded
  }
  
  return chain;
}
```

### ❌ Pitfall 3: Unclear Orchestration
Each pattern doesn't clearly hand off to the next.

```typescript
// Bad: Unclear flow
result1 = something(input)
result2 = something_else(result1)
// What should result2 be used for?

// Good: Explicit flow
const routed = await router(input);        // Returns: route decision
const chained = await chains[routed](input); // Uses: route decision
const refined = await evaluator(chained);   // Uses: chain output
```

### ❌ Pitfall 4: Ignoring Intermediate Failures
What happens when one component fails?

```typescript
// Good: Handle failures at each stage
try {
  const route = await router(input);
} catch (e) {
  return await fallbackHandler(input);
}

try {
  const chainResult = await chains[route](input);
} catch (e) {
  return await simpleChain(input); // Simpler fallback
}
```

---

## Validation Checklist: Pattern Combinations

- [ ] Each pattern clearly separated and testable
- [ ] Clear input/output contracts between patterns
- [ ] Fallback strategy for each pattern's failure
- [ ] Cost tracking implemented
- [ ] Quality expectations defined for combination
- [ ] Edge cases identified and handled
- [ ] No circular dependencies between patterns
- [ ] Error messages clear at each stage
- [ ] Tested with diverse inputs
- [ ] Performance acceptable
- [ ] Documentation clear about flow
- [ ] Simpler solution attempted first
- [ ] Complexity justified by quality gain

