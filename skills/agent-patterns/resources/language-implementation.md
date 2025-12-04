# Language-Specific Implementation

Guide to implementing agent patterns in different programming languages.

## Overview by Language

| Language | Best For | Key Advantages | Concurrency Model |
|----------|----------|----------------|-------------------|
| **TypeScript** | Web, Node.js, full-stack | Async/await, excellent typing, npm ecosystem | Promise-based |
| **Python** | Data science, automation, scripting | Easy learning, rich libraries, rapid development | asyncio, threading |
| **Rust** | Performance, reliability, systems | Type safety, zero-cost abstractions, fearless concurrency | async-await, channels |
| **C#** | Enterprise, .NET, Windows | LINQ, strong typing, async/await, dependency injection | async/await |
| **Go** | Microservices, concurrent systems | Goroutines, channels, simple concurrency model | Goroutines, channels |
| **Dart** | Mobile (Flutter), multi-platform | Hot reload, strong typing, null safety | Future, async/await |
| **C** | Systems, performance-critical | Direct control, minimal overhead | POSIX threads, signals |

---

## TypeScript/JavaScript Implementation

### Strengths
- Excellent async/await support
- NPM ecosystem (many LLM libraries)
- Strong typing with TypeScript
- Works in browser and Node.js

### Weaknesses
- Single-threaded event loop
- Can't true parallelize CPU-bound work
- Memory overhead for large agents

### Core Patterns

#### Prompt Chaining
```typescript
async function documentChaining(topic: string): Promise<string> {
  // Step 1: Generate outline
  const outline = await callLLM(
    "Create detailed outline for article about: " + topic,
    topic
  );
  
  // Step 2: Validate structure
  const validated = validateOutline(outline);
  
  // Step 3: Write sections
  const content = await callLLM(
    "Write article sections based on outline",
    validated
  );
  
  // Step 4: Proofread
  return await callLLM("Proofread and finalize", content);
}

async function callLLM(prompt: string, context: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || ''
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt + '\n\nContext: ' + context }]
    })
  });
  
  const data = await response.json();
  return data.content[0].text;
}
```

#### Orchestrator-Workers
```typescript
interface WorkerTask {
  id: string;
  description: string;
  context?: string;
}

interface OrchestratorPlan {
  analysis: string;
  subtasks: WorkerTask[];
}

async function orchestratorWorkers(input: string): Promise<string> {
  // Orchestrator creates plan
  const planJson = await callLLM(
    `Plan how to decompose this problem:
${input}

Return JSON with structure: {analysis: string, subtasks: Array<{id, description, context}>}`,
    ""
  );
  
  const plan: OrchestratorPlan = JSON.parse(planJson);
  
  // Execute workers in parallel
  const workerResults = await Promise.all(
    plan.subtasks.map(async (task) => {
      const result = await callLLM(
        `Execute subtask: ${task.description}`,
        task.context || input
      );
      return { taskId: task.id, result };
    })
  );
  
  // Orchestrator synthesizes
  const synthesis = await callLLM(
    "Synthesize these worker results into final output",
    JSON.stringify(workerResults)
  );
  
  return synthesis;
}
```

#### Evaluator-Optimizer
```typescript
interface Evaluation {
  score: number; // 0-10
  feedback: string;
  acceptable: boolean;
}

async function evaluatorOptimizer(
  input: string,
  maxIterations: number = 3
): Promise<string> {
  let output = await callLLM("Generate initial output", input);
  
  for (let i = 0; i < maxIterations; i++) {
    const evaluation: Evaluation = JSON.parse(
      await callLLM(
        `Evaluate this output on a scale of 0-10 and provide feedback.
Return JSON: {score: number, feedback: string, acceptable: boolean}`,
        output
      )
    );
    
    if (evaluation.acceptable) {
      break;
    }
    
    output = await callLLM(
      `Improve based on feedback: ${evaluation.feedback}`,
      output
    );
  }
  
  return output;
}
```

### Best Practices in TypeScript

```typescript
// 1. Type-safe tool definitions
interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ParameterDef>;
  required: string[];
}

interface ParameterDef {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  example?: unknown;
  enum?: unknown[];
  default?: unknown;
}

// 2. Error handling patterns
async function safeCallLLM(prompt: string, maxRetries: number = 3): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callLLM(prompt, "");
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  return null;
}

// 3. Async iteration patterns
async function* streamResults(inputs: string[]): AsyncGenerator<string> {
  for (const input of inputs) {
    yield await callLLM("Process", input);
  }
}
```

---

## Python Implementation

### Strengths
- asyncio for async/await
- Rich data science libraries
- Great for scripting and automation
- Strong typing with type hints

### Weaknesses
- GIL limits parallelization
- Slower than compiled languages
- Async can feel non-native

### Core Patterns

#### Prompt Chaining
```python
import asyncio
import json
import anthropic

async def document_chaining(topic: str) -> str:
    """Prompt chaining example in Python."""
    # Step 1: Generate outline
    outline = await call_llm(
        f"Create detailed outline for article about: {topic}",
        topic
    )
    
    # Step 2: Validate structure
    validated = validate_outline(outline)
    
    # Step 3: Write sections
    content = await call_llm(
        "Write article sections based on outline",
        validated
    )
    
    # Step 4: Proofread
    final = await call_llm("Proofread and finalize", content)
    
    return final

async def call_llm(prompt: str, context: str) -> str:
    """Call Claude API asynchronously."""
    client = anthropic.Anthropic()
    
    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": f"{prompt}\n\nContext: {context}"
        }]
    )
    
    return message.content[0].text
```

#### Orchestrator-Workers
```python
import asyncio
from dataclasses import dataclass
from typing import Any

@dataclass
class WorkerTask:
    id: str
    description: str
    context: str = ""

@dataclass
class OrchestratorPlan:
    analysis: str
    subtasks: list[WorkerTask]

async def orchestrator_workers(input_text: str) -> str:
    """Orchestrator-workers pattern in Python."""
    # Orchestrator creates plan
    plan_json = await call_llm(
        f"""Plan how to decompose this problem:
{input_text}

Return JSON with structure: {{"analysis": str, "subtasks": [{{"id": str, "description": str, "context": str}}]}}""",
        ""
    )
    
    plan_data = json.loads(plan_json)
    plan = OrchestratorPlan(
        analysis=plan_data["analysis"],
        subtasks=[
            WorkerTask(**task) for task in plan_data["subtasks"]
        ]
    )
    
    # Execute workers in parallel
    worker_results = await asyncio.gather(*[
        execute_worker(task, input_text)
        for task in plan.subtasks
    ])
    
    # Orchestrator synthesizes
    synthesis = await call_llm(
        "Synthesize these worker results into final output",
        json.dumps(worker_results, indent=2)
    )
    
    return synthesis

async def execute_worker(task: WorkerTask, input_text: str) -> dict[str, Any]:
    """Execute a single worker task."""
    result = await call_llm(
        f"Execute subtask: {task.description}",
        task.context or input_text
    )
    return {"task_id": task.id, "result": result}
```

#### Evaluator-Optimizer with Concurrency
```python
import asyncio
from dataclasses import dataclass

@dataclass
class Evaluation:
    score: float  # 0-10
    feedback: str
    acceptable: bool

async def evaluator_optimizer(
    input_text: str,
    max_iterations: int = 3
) -> str:
    """Evaluator-optimizer pattern with async."""
    output = await call_llm("Generate initial output", input_text)
    
    for i in range(max_iterations):
        eval_json = await call_llm(
            f"""Evaluate this output on a scale of 0-10.
Return JSON: {{"score": number, "feedback": string, "acceptable": boolean}}

Output: {output}""",
            input_text
        )
        
        evaluation = Evaluation(**json.loads(eval_json))
        
        if evaluation.acceptable:
            break
        
        output = await call_llm(
            f"Improve based on feedback: {evaluation.feedback}",
            output
        )
    
    return output
```

### Best Practices in Python

```python
# 1. Type hints for clarity
from typing import TypedDict, Literal, Optional

class SearchParams(TypedDict):
    query: str
    case_sensitive: bool
    file_types: list[Literal["py", "js", "ts"]]

# 2. Async context managers for resource management
async def with_timeout(coro, timeout: float):
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except asyncio.TimeoutError:
        raise TimeoutError(f"Operation exceeded {timeout}s timeout")

# 3. Error handling patterns
async def call_llm_with_retry(
    prompt: str,
    max_retries: int = 3,
    backoff_factor: float = 2.0
) -> str:
    for attempt in range(max_retries):
        try:
            return await call_llm(prompt, "")
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            wait_time = backoff_factor ** attempt
            await asyncio.sleep(wait_time)
```

---

## Rust Implementation

### Strengths
- Compile-time safety guarantees
- Excellent performance
- Fearless concurrency
- Zero-cost abstractions

### Weaknesses
- Steep learning curve
- Verbose error handling
- Compilation can be slow

### Core Patterns

#### Prompt Chaining with Error Handling
```rust
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let topic = "AI agents";
    let result = document_chaining(topic).await?;
    println!("{}", result);
    Ok(())
}

async fn document_chaining(topic: &str) -> Result<String, Box<dyn std::error::Error>> {
    // Step 1: Generate outline
    let outline = call_llm(
        &format!("Create detailed outline for article about: {}", topic),
        topic
    ).await?;
    
    // Step 2: Validate structure
    let validated = validate_outline(&outline)?;
    
    // Step 3: Write sections
    let content = call_llm(
        "Write article sections based on outline",
        &validated
    ).await?;
    
    // Step 4: Proofread
    let final_output = call_llm("Proofread and finalize", &content).await?;
    
    Ok(final_output)
}

async fn call_llm(prompt: &str, context: &str) -> Result<String, Box<dyn std::error::Error>> {
    let client = Client::new();
    let api_key = std::env::var("ANTHROPIC_API_KEY")?;
    
    let response = client
        .post("https://api.anthropic.com/messages")
        .header("x-api-key", api_key)
        .json(&json!({
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 2048,
            "messages": [{
                "role": "user",
                "content": format!("{}\n\nContext: {}", prompt, context)
            }]
        }))
        .send()
        .await?
        .json::<serde_json::Value>()
        .await?;
    
    Ok(response["content"][0]["text"].as_str().unwrap_or("").to_string())
}
```

#### Orchestrator-Workers
```rust
use futures::future::join_all;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct WorkerTask {
    id: String,
    description: String,
    context: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct OrchestratorPlan {
    analysis: String,
    subtasks: Vec<WorkerTask>,
}

async fn orchestrator_workers(input: &str) -> Result<String, Box<dyn std::error::Error>> {
    // Orchestrator plans
    let plan_json = call_llm(
        &format!("Plan decomposition:\n{}", input),
        ""
    ).await?;
    
    let plan: OrchestratorPlan = serde_json::from_str(&plan_json)?;
    
    // Execute workers concurrently
    let futures: Vec<_> = plan.subtasks.iter().map(|task| {
        async {
            call_llm(
                &format!("Execute: {}", task.description),
                task.context.as_deref().unwrap_or(input)
            ).await
        }
    }).collect();
    
    let results = join_all(futures).await;
    
    // Collect results (handling errors)
    let worker_results: Vec<String> = results.into_iter()
        .collect::<Result<Vec<_>, _>>()?;
    
    // Synthesize
    let synthesis = call_llm(
        "Synthesize results",
        &worker_results.join("\n---\n")
    ).await?;
    
    Ok(synthesis)
}
```

### Best Practices in Rust

```rust
// 1. Strong typing for safety
struct Agent {
    client: Client,
    api_key: String,
    model: String,
}

impl Agent {
    async fn execute(&self, prompt: &str) -> Result<String, AgentError> {
        // Type-safe execution
        Ok(String::new())
    }
}

// 2. Error types for clarity
#[derive(Debug)]
enum AgentError {
    ApiError(String),
    InvalidResponse,
    Timeout,
}

// 3. Async patterns with tokio
#[tokio::main]
async fn main() {
    let agent = Agent::new();
    match agent.execute("task").await {
        Ok(result) => println!("{}", result),
        Err(e) => eprintln!("Error: {:?}", e),
    }
}
```

---

## C# / .NET Implementation

### Strengths
- Strong typing and LINQ
- Async/await first-class
- Dependency injection built-in
- Excellent for enterprise systems

### Weaknesses
- Heavy framework
- Windows-centric (though improving)

### Core Patterns

#### Prompt Chaining with Dependency Injection
```csharp
using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

public class PromptChain
{
    private readonly ILlmClient _llmClient;
    
    public PromptChain(ILlmClient llmClient)
    {
        _llmClient = llmClient;
    }
    
    public async Task<string> DocumentChaining(string topic)
    {
        // Step 1: Outline
        var outline = await _llmClient.CallAsync(
            $"Create outline for: {topic}",
            topic
        );
        
        // Step 2: Validate
        var validated = ValidateOutline(outline);
        
        // Step 3: Write
        var content = await _llmClient.CallAsync(
            "Write sections",
            validated
        );
        
        // Step 4: Proofread
        return await _llmClient.CallAsync("Proofread", content);
    }
}

public interface ILlmClient
{
    Task<string> CallAsync(string prompt, string context);
}

public class AnthropicLlmClient : ILlmClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    
    public AnthropicLlmClient(HttpClient httpClient, string apiKey)
    {
        _httpClient = httpClient;
        _apiKey = apiKey;
    }
    
    public async Task<string> CallAsync(string prompt, string context)
    {
        var request = new
        {
            model = "claude-3-5-sonnet-20241022",
            max_tokens = 2048,
            messages = new[] {
                new {
                    role = "user",
                    content = $"{prompt}\n\nContext: {context}"
                }
            }
        };
        
        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        
        var response = await _httpClient.PostAsync("https://api.anthropic.com/messages", content);
        var responseJson = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(responseJson);
        
        return result.GetProperty("content")[0].GetProperty("text").GetString() ?? "";
    }
}

// Startup configuration
public void ConfigureServices(IServiceCollection services)
{
    services.AddHttpClient<ILlmClient, AnthropicLlmClient>()
        .ConfigureHttpClient(client =>
        {
            client.DefaultRequestHeaders.Add("x-api-key", Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY"));
        });
}
```

---

## Go Implementation

### Strengths
- Goroutines for easy concurrency
- Fast compilation and execution
- Built-in networking
- Simple concurrency model

### Weaknesses
- Less mature generics
- Simpler error handling (can feel verbose)
- Smaller ecosystem than some alternatives

### Core Patterns

#### Orchestrator-Workers with Goroutines
```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "sync"
)

type WorkerTask struct {
    ID          string `json:"id"`
    Description string `json:"description"`
    Context     string `json:"context"`
}

type WorkerResult struct {
    TaskID string
    Result string
    Error  error
}

func orchestratorWorkers(ctx context.Context, input string) (string, error) {
    // Create plan
    planJSON, err := callLLM(ctx, fmt.Sprintf("Plan: %s", input), "")
    if err != nil {
        return "", err
    }
    
    var plan struct {
        Analysis string      `json:"analysis"`
        Subtasks []WorkerTask `json:"subtasks"`
    }
    
    if err := json.Unmarshal([]byte(planJSON), &plan); err != nil {
        return "", err
    }
    
    // Execute workers concurrently
    resultsChan := make(chan WorkerResult, len(plan.Subtasks))
    var wg sync.WaitGroup
    
    for _, task := range plan.Subtasks {
        wg.Add(1)
        go func(t WorkerTask) {
            defer wg.Done()
            result, err := callLLM(ctx, fmt.Sprintf("Execute: %s", t.Description), t.Context)
            resultsChan <- WorkerResult{
                TaskID: t.ID,
                Result: result,
                Error:  err,
            }
        }(task)
    }
    
    // Wait for completion
    go func() {
        wg.Wait()
        close(resultsChan)
    }()
    
    // Collect results
    var results []WorkerResult
    for r := range resultsChan {
        if r.Error != nil {
            return "", r.Error
        }
        results.append(results, r)
    }
    
    // Synthesize
    resultsJSON, _ := json.Marshal(results)
    return callLLM(ctx, "Synthesize", string(resultsJSON))
}
```

---

## Quick Reference: Implementation Patterns by Language

### Which Pattern is Easiest to Implement?

**Prompt Chaining**: All languages equally easy
**Routing**: All languages equally easy
**Parallelization**: 
  - ✅ Best: Go (goroutines), Rust (async)
  - ⚠️ Good: Python (asyncio), TypeScript (Promise.all), C# (Task.WhenAll)
  - ⚠️ Okay: C (manual threading)

**Orchestrator-Workers**: 
  - ✅ Best: Go (goroutines), Rust (tokio)
  - ⚠️ Good: Python (asyncio), TypeScript, C#

**Autonomous Agents**: 
  - ✅ Best: Python (simplest to prototype), Go
  - ⚠️ Good: TypeScript, Rust, C#

---

## Language Selection Guide

Choose based on your context:

- **Web Applications**: TypeScript/JavaScript (full-stack), C# (ASP.NET)
- **Data Science**: Python
- **Systems/Performance**: Rust, Go, C
- **Enterprise**: C#
- **Rapid Prototyping**: Python
- **Microservices**: Go
- **Mobile**: Dart (Flutter), C# (Xamarin)

