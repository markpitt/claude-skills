# Agent Pattern Templates

This directory contains implementation templates for all agent patterns from Anthropic's "Building Effective Agents" guide.

## Available Languages

- **Python** - Full async/await support with Anthropic SDK ⭐ Complete
- **TypeScript** - Type-safe implementations with generics ⭐ Complete
- **C#** - .NET implementations with async/await ⭐ Complete
- **Rust** - Type-safe with compile-time guarantees ⭐ Complete
- **Go** - Concurrent implementations with goroutines and channels ⭐ Complete
- **Dart** - Flutter-compatible async implementations ⭐ Complete
- **C** - Low-level implementations with manual memory management ⭐ Complete
- **GenAIScript** - Declarative agent definitions ⭐ Complete

## Template Availability Matrix

| Pattern | Python | TypeScript | C# | Rust | Go | Dart | C | GenAIScript |
|---------|--------|------------|-----|------|-----|------|---|-------------|
| Prompt Chaining | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Routing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Parallelization | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Orchestrator-Workers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Evaluator-Optimizer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Autonomous Agents | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Template Structure

Each language directory contains pattern implementations:

### Core Workflow Patterns
- `prompt_chaining.*` - Sequential LLM calls with validation and checkpoints
- `routing.*` - Classification and specialized handler routing  
- `parallelization.*` - Sectioning (parallel subtasks) and Voting (consensus)

### Dynamic Orchestration Patterns
- `orchestrator_workers.*` - Dynamic task decomposition with specialized workers
- `autonomous_agent.*` - Open-ended exploration with tool usage and environment feedback

### Iterative Refinement
- `evaluator_optimizer.*` - Generator + Evaluator feedback loops

## Usage

### Python

```bash
cd python
pip install anthropic
python prompt_chaining.py
```

### TypeScript

```bash
cd typescript
npm install @anthropic-ai/sdk
ts-node prompt_chaining.ts
```

### C#

```bash
cd csharp
dotnet add package Anthropic.SDK
dotnet run
```

### Rust

```bash
cd rust
cargo add anyhow reqwest serde tokio
cargo run
```

### Go

```bash
cd go
go get
go run prompt_chaining.go
```

### Dart

```bash
cd dart
dart pub get
dart run prompt_chaining.dart
```

## Pattern Implementations

### 1. Prompt Chaining
Sequential LLM calls with programmatic checkpoints. Available in all languages:
- Step definition with validators
- Context passing between steps
- Execution history tracking
- Error handling
- Type safety (where applicable)

### 2. Routing
Classification and specialized handler routing:
- Input classification with confidence scores
- Multiple specialized handlers per route
- Model-based routing (route to different models by complexity)
- Fallback handling for unclassified inputs

### 3. Parallelization
Concurrent execution patterns:
- **Sectioning**: Split task into independent parallel subtasks
- **Voting**: Run same task multiple times for consensus
- **Guardrails**: Run safety checks in parallel with main task

### 4. Orchestrator-Workers
Dynamic task decomposition:
- Central orchestrator plans subtasks dynamically
- Specialized workers execute in parallel
- Result synthesis into coherent output
- Worker type registration and specialization

### 5. Evaluator-Optimizer
Iterative refinement loops:
- Separate generator and evaluator roles
- Configurable evaluation criteria with weights
- Stopping conditions (score threshold, no improvement, max iterations)
- Confidence-based optimization variant

### 6. Autonomous Agents
Open-ended exploration with tool usage:
- Tool registration and execution
- Environment feedback loop
- Multiple stopping conditions
- Action history tracking
- Sandboxed execution patterns

## Environment Setup

All templates require the `ANTHROPIC_API_KEY` environment variable:

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

## Customization

These templates are designed as starting points. Customize them for your specific use case:

1. **Model Selection** - Change the default model as needed
2. **Validation Logic** - Add domain-specific validators
3. **Processing Steps** - Add custom processors for your data
4. **Tool Integration** - Add tools for your specific domain
5. **Error Handling** - Enhance for production use

## Best Practices

### Type Safety

Use strong typing where available:

```typescript
// TypeScript
interface MyContext {
  topic: string;
  style: 'formal' | 'casual';
}
const chain = new PromptChain<MyContext>(client);
```

```rust
// Rust
struct MyContext {
    topic: String,
    style: Style,
}
```

```csharp
// C#
public class MyContext
{
    public string Topic { get; set; }
    public ContentStyle Style { get; set; }
}
```

### Error Handling

Always handle LLM failures gracefully:

```python
# Python
try:
    result = await chain.execute(context)
except ValueError as e:
    logger.error(f"Validation failed: {e}")
    # Fallback logic
```

```go
// Go
result, err := chain.Execute(ctx, context)
if err != nil {
    log.Printf("Chain execution failed: %v", err)
    // Fallback logic
}
```

### Async Patterns

Use native async support for better performance:

```python
# Python - asyncio
await chain.execute(context)
```

```typescript
// TypeScript - Promises
await chain.execute(context);
```

```csharp
// C# - async/await
await chain.ExecuteAsync(context);
```

```dart
// Dart - Future
await chain.execute(context);
```

```rust
// Rust - tokio
chain.execute(context).await?
```

```go
// Go - goroutines
result, err := chain.Execute(ctx, context)
```

## Testing

Each implementation should be tested with:

1. **Happy Path** - Normal execution
2. **Validation Failures** - Invalid outputs
3. **API Errors** - Network/auth failures
4. **Edge Cases** - Empty inputs, very long outputs

Example test structure:

```python
# Python
import pytest

@pytest.mark.asyncio
async def test_chain_execution():
    chain = PromptChain(mock_client)
    chain.add_step(...)
    result = await chain.execute({"topic": "test"})
    assert len(result) > 0
```

## Performance Considerations

### Parallelization

For independent steps, use appropriate concurrency:

```python
# Python
results = await asyncio.gather(*tasks)
```

```typescript
// TypeScript
const results = await Promise.all(tasks);
```

```go
// Go
var wg sync.WaitGroup
// Use goroutines and channels
```

```rust
// Rust
let results = futures::future::join_all(tasks).await;
```

### Caching

Consider caching LLM responses for repeated inputs:

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_cached_response(prompt: str) -> str:
    # Cache expensive LLM calls
    pass
```

### Token Optimization

- Use appropriate `max_tokens` limits
- Implement prompt truncation for long contexts
- Consider cheaper models for simple steps

## Model Context Protocol (MCP)

For MCP integration, see the tool design guide in `resources/tool-design.md`.

Example MCP tool definition:

```typescript
{
  name: "execute_chain",
  description: "Execute a prompt chain with given steps",
  inputSchema: {
    type: "object",
    properties: {
      steps: {
        type: "array",
        items: { type: "object" }
      }
    }
  }
}
```

## Contributing

When adding new language implementations:

1. Follow the existing pattern structure
2. Include comprehensive comments
3. Provide usage examples
4. Add error handling
5. Include type safety where applicable
6. Document any language-specific considerations

## Resources

- [Anthropic: Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Pattern Reference](../resources/patterns-reference.md)
- [Tool Design Guide](../resources/tool-design.md)
- Language-specific SDK documentation
