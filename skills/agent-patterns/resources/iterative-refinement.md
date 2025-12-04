# Iterative Refinement Pattern

The Evaluator-Optimizer pattern for quality improvement through feedback loops.

## Pattern: Evaluator-Optimizer

**Core Concept:** One LLM generates responses while another evaluates and provides feedback for iterative refinement.

**Architecture:**
```
Input → Generator LLM → Output₁
              ↓                ↓
         [Feedback Loop] ← Evaluator LLM
              ↓
    Generator LLM → Output₂ → ... → Final Output
    (improved based on feedback)
```

**Key Characteristics:**
- Iterative refinement loop with clear stopping condition
- Separation of roles: generator vs evaluator
- Feedback drives improvement between iterations
- External stopping condition prevents infinite loops
- Quality-focused, cost-aware trade-off

**When to Use:**
✅ Clear, objective evaluation criteria exist
✅ Iteration demonstrably improves quality
✅ Human feedback would currently improve outputs
✅ Quality is more important than speed
✅ First attempts often have fixable issues
✅ Multiple revision rounds are valuable

**When NOT to Use:**
❌ First attempt is usually satisfactory
❌ No clear evaluation criteria exist
❌ Feedback doesn't improve output
❌ Time or cost constraints are tight
❌ Diminishing returns after first iteration

**Implementation Considerations:**
- Define evaluation criteria clearly before starting
- Implement max iteration limit (typically 3-5)
- Track iteration count and improvement metrics
- Consider stopping if no improvement detected
- Balance quality improvement against cost
- Timeout handling for long feedback/generation cycles
- Consider different models for generation vs evaluation
- Cache evaluation criteria for consistency

**Evaluation Criteria Examples:**

1. **Literary Translation**
   - Criteria: Preserve meaning, maintain tone, use idioms naturally, sound native
   - Evaluator feedback: "Phrase 'blue heart' is too literal, should be..."

2. **Code Quality**
   - Criteria: Functionality, readability, performance, test coverage, documentation
   - Evaluator feedback: "Loop is O(n²), refactor to use hash map for O(n)"

3. **Content Marketing**
   - Criteria: Clarity, engagement, brand voice, call-to-action effectiveness, SEO
   - Evaluator feedback: "Opening paragraph is too technical, start with benefit"

4. **Search Query Optimization**
   - Criteria: Result relevance, specificity, recall, diversity
   - Evaluator feedback: "Results include competitor info, modify query to exclude..."

5. **Scientific Writing**
   - Criteria: Accuracy, clarity, structure, evidence quality, conclusions justified
   - Evaluator feedback: "Conclusion goes beyond evidence presented, tone down claims"

**Real-World Examples:**

1. **Literary Translation**
   - Input: Text to translate to target language
   - Iteration 1:
     - Generator: Initial translation
     - Evaluator: Check cultural fit, idioms, tone, native sound
     - Feedback: Specific improvements needed
   - Iteration 2-N: Refine based on feedback
   - Stop: Evaluation score exceeds threshold

2. **Complex Search Query Refinement**
   - Input: Information need
   - Iteration 1:
     - Generator: Create initial search query
     - Evaluator: Run query, assess result relevance
     - Feedback: Query too broad/narrow, needs modification
   - Iteration 2-N: Refine query
   - Stop: Results satisfy criteria or max iterations

3. **Content Creation and Review**
   - Input: Content requirements
   - Iteration 1:
     - Generator: Write content
     - Evaluator: Check style, accuracy, engagement, brand fit
     - Feedback: Specific improvements needed
   - Iteration 2-N: Improve based on criteria
   - Stop: All criteria met or max iterations

4. **Code Review and Improvement**
   - Input: Code to improve
   - Iteration 1:
     - Generator: Analyze and generate improved version
     - Evaluator: Check functionality, readability, performance, tests
     - Feedback: Issues to fix
   - Iteration 2-N: Fix issues
   - Stop: All checks pass or max iterations

---

## Implementation Patterns

### Pattern A: Single Evaluator, Multiple Criteria

```typescript
interface EvaluationCriteria {
  name: string;
  description: string;
  weight: number; // 0-1
  acceptable: (score: number) => boolean;
}

async function evaluatorOptimizer(
  input: string,
  criteria: EvaluationCriteria[],
  maxIterations: number = 3
): Promise<string> {
  let output = await generatorLLM("Generate initial output", input);
  let iteration = 0;

  while (iteration < maxIterations) {
    // Evaluate against all criteria
    const evaluation = await evaluatorLLM(
      `Evaluate output against these criteria:
${criteria.map(c => `- ${c.name}: ${c.description}`).join('\n')}

Output to evaluate: ${output}`,
      input
    );

    // Check if all criteria met
    const allCriteriaMet = criteria.every(c =>
      c.acceptable(evaluation.scores[c.name])
    );

    if (allCriteriaMet) {
      break;
    }

    // Improve based on feedback
    output = await generatorLLM(
      `Improve based on this feedback:
${evaluation.feedback}

Previous output: ${output}`,
      input
    );

    iteration++;
  }

  return output;
}
```

### Pattern B: Sequential Evaluators

Different evaluators check different aspects:

```typescript
async function sequentialEvaluators(
  input: string,
  maxIterations: number = 3
): Promise<string> {
  let output = await generatorLLM("Generate", input);

  for (let i = 0; i < maxIterations; i++) {
    // First evaluator: Accuracy
    const accuracyFeedback = await accuracyEvaluator(output, input);
    if (!accuracyFeedback.needsImprovement) {
      // Second evaluator: Style
      const styleFeedback = await styleEvaluator(output, input);
      if (!styleFeedback.needsImprovement) {
        break; // Both pass
      }
      // Improve style
      output = await generatorLLM(
        `Improve style: ${styleFeedback.feedback}`,
        { original: input, output }
      );
    } else {
      // Improve accuracy first
      output = await generatorLLM(
        `Improve accuracy: ${accuracyFeedback.feedback}`,
        { original: input, output }
      );
    }
  }

  return output;
}
```

### Pattern C: Confidence-Based Continuation

```typescript
async function confidenceBasedRefinement(
  input: string,
  targetConfidence: number = 0.9,
  maxIterations: number = 5
): Promise<string> {
  let output = await generatorLLM("Generate", input);
  let iteration = 0;

  while (iteration < maxIterations) {
    const evaluation = await evaluatorLLM(
      "Evaluate and provide confidence score (0-1)",
      output
    );

    // Stop if confident enough
    if (evaluation.confidence >= targetConfidence) {
      break;
    }

    // Improve if not confident
    output = await generatorLLM(
      `Improve to address: ${evaluation.issues}`,
      { original: input, output, feedback: evaluation }
    );

    iteration++;
  }

  return output;
}
```

---

## Prompting Strategies

### Generator Prompts

**Initial Generation:**
```
You are a high-quality generator. Your task is to create excellent [output type].

Input: [INPUT]

Generate your best [output type]. Focus on [key criteria].
```

**Improvement Iteration:**
```
You are improving a [output type] based on feedback.

Original input: [INPUT]
Previous version: [OUTPUT]

Feedback for improvement:
[FEEDBACK]

Generate an improved version that addresses the feedback.
```

### Evaluator Prompts

**Structured Evaluation:**
```
You are an expert evaluator. Evaluate the following [output type] against these criteria:

Criteria:
1. [Criterion 1]: [Description]
   - Acceptable if: [Threshold]
2. [Criterion 2]: [Description]
   - Acceptable if: [Threshold]

Output to evaluate:
[OUTPUT]

Provide:
1. Score for each criterion (0-10)
2. Specific feedback on how to improve
3. Overall recommendation (Pass/Needs Improvement)
```

**Feedback-Focused Evaluation:**
```
You are a critical evaluator looking for improvement opportunities.

Evaluate this [output type] and provide specific, actionable feedback.

Output: [OUTPUT]

For each issue found, explain:
- What the issue is
- Why it matters
- How to fix it

Be specific and concise.
```

---

## Stopping Conditions

Different strategies for deciding when to stop:

1. **Threshold-Based**: Stop when evaluation score ≥ threshold
2. **Iteration-Count**: Stop after N iterations regardless
3. **No-Improvement**: Stop if no improvement detected in last iteration
4. **Time-Based**: Stop after time limit exceeded
5. **Cost-Based**: Stop if cost exceeds budget
6. **Combination**: Use multiple conditions with OR logic

```typescript
interface StoppingCondition {
  type: 'threshold' | 'iterations' | 'no_improvement' | 'time' | 'cost';
  check: (state: IterationState) => boolean;
}

function shouldStop(
  state: IterationState,
  conditions: StoppingCondition[]
): boolean {
  return conditions.some(condition => condition.check(state));
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Unclear Evaluation Criteria
**Problem**: Evaluator has subjective judgment criteria
**Solution**: Define specific, measurable criteria upfront
```typescript
// Bad
"Evaluate if the writing is good"

// Good
"Evaluate on: Clarity (0-10), Engagement (0-10), Brand Consistency (0-10)"
```

### ❌ Pitfall 2: Generator Ignores Feedback
**Problem**: Generator remakes same mistakes
**Solution**: Make feedback explicit and actionable
```typescript
// Bad
"Improve the output"

// Good
"Previous output had these issues:
- Passive voice makes it sound weak
- No clear call-to-action
- Too technical for target audience
Rewrite addressing each issue."
```

### ❌ Pitfall 3: Infinite Loops
**Problem**: Max iterations not enforced
**Solution**: Always check iteration count and other stopping conditions
```typescript
// Always do this
if (iteration >= maxIterations) break;
```

### ❌ Pitfall 4: Cost Explosion
**Problem**: Didn't track token usage
**Solution**: Monitor cost and implement budget limits
```typescript
const maxCost = 1.00; // dollars
let currentCost = 0;

if (currentCost + estimatedCost > maxCost) break;
```

### ❌ Pitfall 5: Diminishing Returns
**Problem**: Later iterations don't improve quality
**Solution**: Detect stagnation and stop early
```typescript
if (iteration > 1) {
  const improvement = evaluation.score - previousScore;
  if (improvement < 0.05) break; // No meaningful improvement
}
```

---

## Metrics and Monitoring

**Metrics to Track:**
- Iteration count (how many needed on average?)
- Convergence rate (% that meet criteria?)
- Time per iteration
- Total cost per refinement cycle
- Improvement per iteration
- Final quality scores

**Monitoring Example:**
```typescript
interface RefinementMetrics {
  totalIterations: number;
  convergenceScore: number; // 0-1
  totalTime: number; // ms
  totalCost: number; // dollars
  improvementPerIteration: number[]; // array of scores
  finalQuality: number; // 0-1
}

function trackMetrics(
  output: string,
  evaluation: Evaluation,
  iteration: number,
  startTime: number,
  totalTokens: number
): RefinementMetrics {
  return {
    totalIterations: iteration,
    convergenceScore: evaluation.convergenceScore,
    totalTime: Date.now() - startTime,
    totalCost: totalTokens * pricePerToken,
    improvementPerIteration: improvementHistory,
    finalQuality: evaluation.overallScore,
  };
}
```

---

## Language-Specific Examples

### TypeScript Implementation
```typescript
async function evaluatorOptimizer(input: string): Promise<string> {
  let output = await generator(input);
  
  for (let i = 0; i < 3; i++) {
    const eval = await evaluator(output);
    if (eval.acceptable) break;
    
    output = await generator(`Improve: ${eval.feedback}`);
  }
  
  return output;
}
```

### Python Implementation
```python
async def evaluator_optimizer(input_text: str) -> str:
    output = await generator(input_text)
    
    for i in range(3):
        evaluation = await evaluator(output)
        if evaluation['acceptable']:
            break
        
        output = await generator(f"Improve: {evaluation['feedback']}")
    
    return output
```

### Rust Implementation
```rust
async fn evaluator_optimizer(input: String) -> Result<String> {
    let mut output = generator(&input).await?;
    
    for _ in 0..3 {
        let eval = evaluator(&output).await?;
        if eval.acceptable {
            break;
        }
        
        output = generator(&format!("Improve: {}", eval.feedback)).await?;
    }
    
    Ok(output)
}
```

---

## Validation Checklist: Evaluator-Optimizer

- [ ] Clear evaluation criteria defined and documented
- [ ] Criteria are measurable, not subjective
- [ ] Max iteration limit set and enforced
- [ ] Stopping conditions implemented (not just iteration count)
- [ ] Generator prompt encourages improvement based on feedback
- [ ] Evaluator prompt is specific and actionable
- [ ] Cost monitoring implemented
- [ ] Improvement tracking enables decision to stop early
- [ ] Error handling for evaluator failures
- [ ] Tested with sample inputs before deployment
- [ ] Metrics tracked for learning and optimization
- [ ] Different evaluators available for different content types

