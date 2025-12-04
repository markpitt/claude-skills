# Dynamic Orchestration Patterns

Advanced patterns for unpredictable workflows and runtime-determined subtasks.

## Pattern: Orchestrator-Workers

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
- Dynamic subtask determination at runtime
- Input-dependent decomposition strategy
- Central orchestrator coordinates all work
- Workers can be specialized or generalist
- Iterative delegation possible (orchestrator may re-plan)

**When to Use:**
✅ Subtasks cannot be known until runtime
✅ Complex multi-component problems requiring decomposition
✅ Different inputs require different decomposition strategies
✅ Workers can meaningfully specialize by subtask type
✅ Flexibility needed based on problem characteristics

**When NOT to Use:**
❌ Workflow is fully predetermined (use Prompt Chaining)
❌ Fixed subtasks (use Prompt Chaining or Routing)
❌ Simple single-step problems (overhead not justified)
❌ Workers cannot be meaningfully specialized

**Implementation Considerations:**
- Orchestrator prompt is absolutely critical—this determines success
- Plan worker specialization: same prompt for all vs specialized by task
- Result synthesis strategy: how to combine diverse outputs
- Error handling: what if a worker fails? Can orchestrator retry or recover?
- Cost tracking: can escalate quickly, needs monitoring
- Stopping conditions: prevent infinite replanning
- Context window management: summarize or discard intermediate results

**Communication Between Orchestrator and Workers:**
- Workers need clear task descriptions from orchestrator
- Workers return structured results (JSON recommended)
- Orchestrator needs enough context to synthesize meaningfully
- Consider timeout per worker to prevent hanging

**Real-World Examples:**

1. **Complex Code Changes**
   - Input: Requirements or GitHub issue
   - Orchestrator analyzes: determines scope, affected files, testing needed
   - Delegates:
     - Worker 1: Analyze existing code structure
     - Worker 2: Design changes
     - Worker 3: Generate code
     - Worker 4: Write tests
     - Worker 5: Document changes
   - Synthesizes: Creates coherent PR with all components

2. **Research Tasks**
   - Input: Research question
   - Orchestrator analyzes: identifies sub-questions, information needs
   - Delegates:
     - Worker 1: Search for background info
     - Worker 2: Find recent developments
     - Worker 3: Locate expert sources
     - Worker 4: Analyze methodologies
   - Synthesizes: Comprehensive research report with sources

3. **Multi-Document Processing**
   - Input: Set of related documents
   - Orchestrator analyzes: determines relationships, themes
   - Delegates:
     - Worker 1: Extract key info from each document
     - Worker 2: Identify document relationships
     - Worker 3: Compare perspectives
     - Worker 4: Find conflicts/contradictions
   - Synthesizes: Unified analysis with cross-document insights

4. **System Design**
   - Input: Requirements specification
   - Orchestrator analyzes: breaks into architecture components
   - Delegates:
     - Worker 1: Design data layer
     - Worker 2: Design API layer
     - Worker 3: Design UI components
     - Worker 4: Design security model
     - Worker 5: Plan deployment strategy
   - Synthesizes: Complete system design document

**Orchestrator Prompt Template:**
```
You are an orchestrator responsible for decomposing tasks and delegating to specialized workers.

Given the input task:
[TASK]

Your responsibilities:
1. Analyze the task and identify required subtasks
2. Determine the optimal decomposition strategy
3. Assign each subtask to a worker with clear instructions
4. Wait for worker results
5. Synthesize results into final output

Return a JSON object:
{
  "analysis": "Brief analysis of task requirements",
  "strategy": "Decomposition strategy explanation",
  "subtasks": [
    {
      "id": "worker_1",
      "description": "Clear description for the worker",
      "context": "Any relevant context"
    }
  ]
}
```

**Code Skeleton (TypeScript):**
```typescript
async function orchestratorWorkers(input: string) {
  // Orchestrator plans
  const plan = await orchestratorLLM(
    orchestratorPrompt,
    input
  );

  // Execute worker tasks in parallel
  const workerResults = await Promise.all(
    plan.subtasks.map(subtask =>
      workerLLM(
        `${workerSystemPrompt}\n\nTask: ${subtask.description}`,
        subtask.context || input
      )
    )
  );

  // Orchestrator synthesizes results
  const final = await orchestratorLLM(
    `Synthesize these worker results into final output:\n${JSON.stringify(workerResults)}`,
    input
  );

  return final;
}
```

**Code Skeleton (Python):**
```python
async def orchestrator_workers(input_text: str):
    # Orchestrator plans
    plan = await orchestrator_llm(orchestrator_prompt, input_text)
    
    # Execute workers in parallel
    worker_results = await asyncio.gather(*[
        worker_llm(
            f"{worker_system_prompt}\n\nTask: {task['description']}",
            task.get('context', input_text)
        )
        for task in plan['subtasks']
    ])
    
    # Orchestrator synthesizes
    synthesis_prompt = f"""Synthesize these worker results:
    {json.dumps(worker_results, indent=2)}"""
    
    final = await orchestrator_llm(synthesis_prompt, input_text)
    return final
```

---

## Pattern: Autonomous Agents

**Core Concept:** Handle open-ended problems where required steps are completely unpredictable and must be determined iteratively.

**Architecture:**
```
Input/Goal → Agent LLM ↔ [Planning Loop]
                         ├─ Decide Next Action
                         ├─ Execute Tool/Action
                         ├─ Receive Environment Feedback
                         └─ Replan if Needed
                              ↓
                         Output (when stopping condition met)
```

**Key Characteristics:**
- Unpredictable number of steps
- Continuous planning and re-planning loop
- Tool execution critical—environment feedback drives decisions
- Agent autonomy is high; human oversight needed
- Stopping conditions are essential

**When to Use:**
✅ Cannot predict required steps upfront
✅ Problem requires exploration or adaptation
✅ Cannot hardcode a fixed workflow
✅ High trust in model's decision-making
✅ Sandboxed, controlled environment available
✅ Cost/risk of errors acceptable

**When NOT to Use:**
❌ Workflow can be predetermined (use other patterns)
❌ Safety-critical scenarios without human oversight
❌ Tasks with tight cost constraints
❌ Cannot tolerate compounding errors
❌ No meaningful feedback from environment

**Critical Requirements:**

1. **Environment Feedback (Ground Truth)**
   - Agent must see results of actions
   - Feedback must be deterministic and meaningful
   - Hallucination detection critical
   - Real outcomes vs. assumed outcomes

2. **Stopping Conditions**
   - Goal achieved: agent recognizes success
   - Timeout: max steps or time limit
   - Failure detection: agent recognizes impossibility
   - User cancellation: human intervention capability

3. **Sandboxing**
   - Controlled, safe execution environment
   - Limits on resource access
   - Reversible operations
   - No production system access

4. **Monitoring**
   - Track agent decisions and reasoning
   - Log all actions taken
   - Monitor for problematic patterns
   - Cost tracking (can be 10-100x normal)

5. **Human Oversight**
   - Ability to review agent decisions
   - Pause/stop capability
   - Manual intervention when needed
   - Audit trail for compliance

**Implementation Considerations:**
- Cost can be 10-100x higher than simple patterns—monitor carefully
- Errors compound across steps—each step's error can propagate
- Tool interface design is critical—quality of tools drives success
- Requires comprehensive testing before deployment
- Implement timeouts to prevent infinite loops
- Implement step counters and resource limits
- Plan for error recovery and backtracking
- Consider temperature/sampling strategy
- May need specialized stopping/reflection prompts

**Real-World Examples:**

1. **Software Engineering (SWE-bench)**
   - Goal: Solve a GitHub issue
   - Steps (unpredictable):
     - Read issue description
     - Explore relevant files
     - Understand current implementation
     - Identify required changes
     - Make changes
     - Run tests
     - Debug failures
     - Iterate until passing
   - Stopping: Tests pass or max steps reached

2. **Computer Use**
   - Goal: Complete multi-step task using applications
   - Steps (unpredictable):
     - Navigate application UI
     - Click buttons, enter data
     - Interpret results
     - Adjust strategy based on feedback
     - Retry failed operations
     - Complete task
   - Stopping: Goal achieved or impossible

3. **Research Agent**
   - Goal: Answer complex research question
   - Steps (unpredictable):
     - Formulate initial search queries
     - Analyze results
     - Follow promising leads
     - Verify information
     - Synthesize findings
     - Identify gaps
     - Continue searching
   - Stopping: Comprehensive answer or resources exhausted

4. **Data Analysis**
   - Goal: Analyze dataset and generate insights
   - Steps (unpredictable):
     - Load and explore data
     - Identify patterns
     - Test hypotheses
     - Generate visualizations
     - Derive conclusions
   - Stopping: Insights found or data exhausted

**Agent Loop Pseudocode:**
```
goal = INPUT
state = initialize(goal)
step = 0
max_steps = 50

while not is_goal_achieved(state) and step < max_steps:
    # Agent decides next action
    action = await agent_llm(
        "Given goal and state, decide next action",
        {goal, state, history}
    )
    
    # Execute in sandboxed environment
    result = execute_in_sandbox(action)
    
    # Update state with feedback
    state = update(state, action, result)
    
    # Check stopping conditions
    if should_stop(state):
        break
    
    step += 1

return state.result
```

**Code Skeleton (TypeScript):**
```typescript
async function autonomousAgent(
  goal: string,
  maxSteps: number = 50
): Promise<string> {
  let state = initializeState(goal);
  let step = 0;

  while (!isGoalAchieved(state) && step < maxSteps) {
    // Agent plans next action
    const action = await agentLLM(
      agentSystemPrompt,
      `Goal: ${goal}\nCurrent State: ${JSON.stringify(state)}`
    );

    // Execute in sandbox
    const result = await executeInSandbox(action);

    // Update state with feedback
    state = updateState(state, action, result);

    // Log for monitoring
    logStep(step, action, result);

    // Check stopping conditions
    if (shouldStop(state)) break;

    step++;
  }

  return state.result;
}
```

**Code Skeleton (Python):**
```python
async def autonomous_agent(
    goal: str,
    max_steps: int = 50
) -> str:
    state = initialize_state(goal)
    step = 0
    
    while not is_goal_achieved(state) and step < max_steps:
        # Agent plans
        action = await agent_llm(
            agent_system_prompt,
            f"Goal: {goal}\nState: {json.dumps(state)}"
        )
        
        # Execute in sandbox
        result = await execute_in_sandbox(action)
        
        # Update state
        state = update_state(state, action, result)
        
        # Monitor
        log_step(step, action, result)
        
        if should_stop(state):
            break
        
        step += 1
    
    return state.get('result')
```

**Tool Design for Agents:**
Autonomous agents depend critically on well-designed tools:

```typescript
// ✅ Good tool: Clear interface, error handling
{
  name: "search_codebase",
  description: "Search code by keyword or pattern. Returns files and line numbers.",
  inputSchema: {
    query: { type: "string", description: "Search term or regex" },
    fileTypes: {
      type: "array",
      description: "File extensions to search (e.g., ['ts', 'js'])"
    }
  }
}

// ✅ Good tool: Explicit paths
{
  name: "read_file",
  description: "Read file at absolute path",
  inputSchema: {
    filePath: {
      type: "string",
      description: "Absolute file path (e.g., '/workspace/src/app.ts')"
    }
  }
}

// ❌ Poor tool: Vague, no feedback
{
  name: "do_something",
  description: "Do something with the file"
}
```

---

## Decision Tree for Dynamic Patterns

```
Can you determine all subtasks upfront?
├─ YES → Use core patterns (see core-patterns.md)
└─ NO ↓

Can you predict the number of steps needed?
├─ YES → Orchestrator-Workers
│       (dynamic subtasks, bounded steps)
└─ NO → Autonomous Agents
        (fully open-ended exploration)
```

---

## Orchestrator-Workers vs Autonomous Agents

| Aspect | Orchestrator-Workers | Autonomous Agents |
|--------|------|------|
| **Subtask Count** | Determined at runtime | Completely unpredictable |
| **Subtasks Known** | Identified by orchestrator | Discovered by agent |
| **Workflow Shape** | Orchestrator → Workers (parallel) | Agent loop (sequential/iterative) |
| **Autonomy Level** | Medium (workers execute plans) | High (agent makes all decisions) |
| **Cost Typical Range** | 2-5x single call | 10-100x single call |
| **Error Compounding** | Moderate (orchestrator controls) | High (each step affects next) |
| **Best For** | Decomposable problems | Exploratory/adaptive problems |
| **Examples** | Code changes, research | GitHub issues, computer use |
| **Risk Level** | Medium | High |
| **Monitoring Importance** | High | Critical |

---

## Combining Orchestrator and Agents

**Hybrid Pattern: Orchestrator + Autonomous Worker**

Some workflows benefit from combining patterns:
- Orchestrator decomposes task
- Some workers are autonomous agents (for complex subtasks)
- Orchestrator synthesizes results

```
Input → Orchestrator Decomposes
         ├─ Worker 1: Standard LLM
         ├─ Worker 2: Autonomous Agent (complex subtask)
         └─ Worker 3: Standard LLM
              ↓
         Orchestrator Synthesizes → Output
```

---

## Validation Checklist: Dynamic Patterns

- [ ] Subtasks truly cannot be predetermined
- [ ] Orchestrator/Agent prompt is clear and comprehensive
- [ ] Tools have good error handling and feedback
- [ ] Stopping conditions defined and tested
- [ ] Sandboxed environment (agents) or isolation strategy
- [ ] Monitoring/logging captures decision points
- [ ] Cost monitoring implemented
- [ ] Human oversight/intervention capability exists
- [ ] Error recovery strategy planned
- [ ] Test extensively in sandbox before deployment
- [ ] Max steps/timeout implemented
- [ ] Resource limits enforced
- [ ] Audit trail maintained for critical decisions

