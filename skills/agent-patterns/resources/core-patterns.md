# Core Agent Patterns

Core sequential and classification patterns for deterministic workflows.

## Pattern: Prompt Chaining

**Core Concept:** Decompose tasks into a fixed sequence of LLM calls where each step processes the previous output.

**Architecture:**
```
Input → LLM₁ → Output₁ → [Processing] → LLM₂ → Output₂ → ... → Final Output
```

**Key Characteristics:**
- Sequential execution with programmatic checkpoints
- Each step can validate or transform data
- Predictable flow, fully deterministic
- Well-suited for specialization by step

**When to Use:**
✅ Fixed subtask sequence known in advance
✅ Each step requires different expertise or prompting
✅ Validation or transformation needed between steps
✅ Higher accuracy through step specialization
✅ Clear, linear workflow with no branching

**When NOT to Use:**
❌ Subtasks are unpredictable or input-dependent
❌ Need significant concurrent execution
❌ Require dynamic branching based on intermediate results
❌ Workflow varies significantly by input

**Implementation Considerations:**
- Store intermediate results appropriately (memory, database, cache)
- Implement error handling at each step with clear recovery paths
- Consider state management across steps
- Log each step for debugging and monitoring
- Plan for retry logic at individual steps
- Consider timeout handling per step

**Real-World Examples:**

1. **Document Generation Pipeline**
   - Step 1: Generate outline from requirements
   - Step 2: Validate structure against criteria
   - Step 3: Write introduction with context
   - Step 4: Write body sections with outline guidance
   - Step 5: Write conclusion and summary
   - Step 6: Proofread, verify tone, and format

2. **Localization Pipeline**
   - Step 1: Generate content in source language
   - Step 2: Extract translatable strings and segments
   - Step 3: Translate to target language
   - Step 4: Validate cultural appropriateness
   - Step 5: Format for target locale
   - Step 6: Test with target locale examples

3. **Code Review and Improvement**
   - Step 1: Analyze code for issues
   - Step 2: Identify refactoring opportunities
   - Step 3: Generate improved version
   - Step 4: Validate functionality preservation
   - Step 5: Add comments and documentation
   - Step 6: Format and lint

**Code Skeleton (TypeScript):**
```typescript
async function promptChaining(input: string) {
  // Step 1: Process input
  const step1 = await llm("Generate outline", input);
  const validated = validateOutline(step1);

  // Step 2: Process step 1 output
  const step2 = await llm("Write sections", validated);
  const sections = parseSection(step2);

  // Step 3: Process step 2 output
  const step3 = await llm("Proofread and format", sections);

  // Final output
  return step3;
}
```

**Code Skeleton (Python):**
```python
async def prompt_chaining(input_text: str):
    # Step 1
    step1 = await llm("Generate outline", input_text)
    validated = validate_outline(step1)
    
    # Step 2
    step2 = await llm("Write content", validated)
    processed = process_content(step2)
    
    # Step 3
    step3 = await llm("Finalize", processed)
    
    return step3
```

---

## Pattern: Routing

**Core Concept:** Classify input and route to specialized downstream processes or models based on classification.

**Architecture:**
```
Input → Classifier LLM → Route Decision
                            ├─ Route A → Specialized Handler A
                            ├─ Route B → Specialized Handler B
                            └─ Route C → Specialized Handler C
```

**Key Characteristics:**
- Single classification decision upfront
- Multiple specialized downstream handlers
- Can route to different models, prompts, or processes
- Often combined with other patterns for power

**When to Use:**
✅ Distinct input categories with clear decision criteria
✅ Categories benefit from significantly different handling
✅ Classification accuracy is reliably high
✅ Cost/performance optimization opportunities
✅ Different complexity levels requiring different model capabilities

**When NOT to Use:**
❌ All inputs need essentially the same handling
❌ Classification criteria are fuzzy or unreliable
❌ Classification overhead exceeds benefits
❌ Only minor variations between routes

**Implementation Considerations:**
- Make classification criteria explicit in prompt
- Use structured output for routing decision (XML, JSON)
- Implement fallback for unclassified or ambiguous inputs
- Monitor and measure classification accuracy continuously
- Track distribution of routes to detect shifting patterns
- Consider confidence scores in routing decision

**Real-World Examples:**

1. **Customer Service Routing**
   - General inquiry → FAQ bot or knowledge base
   - Refund request → Refund processing system
   - Technical issue → Specialized technical support agent
   - Complaint → Human escalation or complaint handler
   - Feature request → Feedback collection system

2. **Model Selection by Query Type**
   - Simple factual question → Fast, cheap model
   - Complex analysis or reasoning → Capable, expensive model
   - Code generation → Specialized code generation model
   - Creative writing → Model optimized for creative tasks

3. **Content Moderation**
   - Safe content → Publish directly
   - Borderline/ambiguous → Human review queue
   - Clear violation → Auto-reject with explanation
   - Requires context → Route to specialist

**Code Skeleton (TypeScript):**
```typescript
async function routing(input: string) {
  // Classify input
  const classification = await llm(
    "Classify this into: GENERAL, REFUND, TECHNICAL, COMPLAINT",
    input
  );

  // Route based on classification
  switch(classification.route) {
    case 'GENERAL':
      return await handleGeneral(input);
    case 'REFUND':
      return await handleRefund(input);
    case 'TECHNICAL':
      return await handleTechnical(input);
    case 'COMPLAINT':
      return await escalateToHuman(input);
    default:
      return await handleDefault(input);
  }
}
```

**Code Skeleton (Python):**
```python
async def routing(input_text: str):
    # Classification
    classification = await llm(
        "Classify: GENERAL, REFUND, TECHNICAL, COMPLAINT",
        input_text
    )
    
    handlers = {
        'GENERAL': handle_general,
        'REFUND': handle_refund,
        'TECHNICAL': handle_technical,
        'COMPLAINT': escalate_to_human,
    }
    
    handler = handlers.get(classification.route, handle_default)
    return await handler(input_text)
```

---

## Pattern: Parallelization

Parallelization has two distinct variants with different use cases.

### Variant A: Sectioning (Parallel Independent Tasks)

**Core Concept:** Break task into independent subtasks and execute concurrently.

**Architecture:**
```
Input → Split into Subtasks
         ├─ LLM₁(Subtask A) ─┐
         ├─ LLM₂(Subtask B) ─┤
         └─ LLM₃(Subtask C) ─┴→ Combine Results → Output
```

**When to Use:**
✅ Subtasks are truly independent (no dependencies)
✅ Speed/throughput is important
✅ Results can be meaningfully combined
✅ Parallelization overhead justified by speedup
✅ Can distribute work across multiple models if needed

**When NOT to Use:**
❌ Subtasks have dependencies on each other
❌ Results must be tightly integrated
❌ Sequential processing required for context

**Real-World Examples:**
- Multiple guardrails running on content simultaneously
- Analyzing different sections of a document in parallel
- Evaluating multiple performance/quality aspects in parallel
- Multi-language translation of independent sections
- Parallel content moderation checks

**Code Skeleton (TypeScript):**
```typescript
async function sectioningParallelization(
  input: string,
  sections: Array<{name: string; prompt: string}>
) {
  // Execute all sections in parallel
  const promises = sections.map(section =>
    llm(section.prompt, input)
  );
  const results = await Promise.all(promises);

  // Combine results
  return combineResults(sections, results);
}
```

### Variant B: Voting (Parallel Same Task)

**Core Concept:** Run the same task multiple times with different prompts/models and aggregate results for robustness.

**Architecture:**
```
Input → Replicate Task
         ├─ LLM₁(Task with Prompt A) ─┐
         ├─ LLM₂(Task with Prompt B) ─┤
         └─ LLM₃(Task with Prompt C) ─┴→ Vote/Aggregate → Output
```

**When to Use:**
✅ Critical accuracy is needed
✅ Consensus improves quality
✅ Different prompts/approaches provide different perspectives
✅ Cost of errors significantly exceeds compute cost
✅ Need confidence metrics on output

**When NOT to Use:**
❌ Single run is adequate
❌ All approaches converge to same answer
❌ Cost/speed is primary constraint
❌ Need specific, not consensus, answer

**Real-World Examples:**
- Security code review (multiple vulnerability perspectives)
- Content moderation with threshold voting
- Medical diagnosis assistance (multiple specialist perspectives)
- Critical decision validation (multiple reasoning approaches)
- Fact-checking (multiple sources, consensus validation)

**Code Skeleton (TypeScript):**
```typescript
async function votingParallelization(
  input: string,
  prompts: string[],
  numVotes: number = 3
) {
  // Run same task multiple times
  const promises = Array(numVotes).fill(null).map((_, i) =>
    llm(prompts[i % prompts.length], input)
  );
  const votes = await Promise.all(promises);

  // Aggregate votes
  return aggregateVotes(votes);
}
```

---

## Decision Tree for Core Patterns

```
Is the workflow fully predetermined?
├─ YES ↓
│   └─ Are subtasks independent?
│       ├─ YES → Parallelization (Sectioning)
│       └─ NO → Prompt Chaining
└─ NO ↓

Can you classify the input into distinct categories?
├─ YES → Routing (with handlers for each route)
└─ NO → Need dynamic patterns (see dynamic-orchestration.md)
```

---

## Common Patterns Combinations with Core Patterns

### Routing + Prompt Chaining
Classification determines which chain to execute.
```
Input → Route → Chain A: Step 1 → Step 2 → Step 3
            └─→ Chain B: Step 1 → Step 2
```

### Routing + Parallelization
Routes input, then parallelizes within each route.
```
Input → Route → Sectioning (all routes)
    or
Input → Route → Voting (complex routes only)
```

### Prompt Chaining + Internal Routing
Chain with conditional steps based on intermediate results.
```
Step 1 Output → Classify → Route A Path
                       └─→ Route B Path
```

---

## Validation Checklist: Core Patterns

- [ ] Workflow steps are fully known and predetermined
- [ ] Each step has clear input/output contracts
- [ ] Error handling planned for each step/route
- [ ] Classification/routing criteria clearly defined
- [ ] Parallelization has no hidden dependencies
- [ ] Results can be meaningfully combined (sectioning)
- [ ] Voting thresholds defined and tested
- [ ] Fallbacks defined for edge cases
- [ ] Monitoring/logging planned
- [ ] Cost implications understood

