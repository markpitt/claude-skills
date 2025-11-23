# Agent Pattern Templates

This directory contains implementation templates for agent patterns in multiple programming languages.

## Available Languages

- **Python** - Full async/await support with Anthropic SDK
- **TypeScript** - Type-safe implementations with generics
- **C#** - .NET implementations with async/await and optional Semantic Kernel integration
- **Rust** - Type-safe with compile-time guarantees
- **Go** - Concurrent implementations with goroutines and channels
- **Dart** - Flutter-compatible async implementations
- **C** - Low-level implementations with manual memory management
- **GenAIScript** - Declarative agent definitions

## Template Structure

Each language directory contains:

- `prompt_chaining.*` - Sequential LLM calls with validation
- `orchestrator_workers.*` - Dynamic task decomposition (selected languages)
- `routing.*` - Classification and specialized routing (coming soon)
- `evaluator_optimizer.*` - Iterative refinement loops (coming soon)
- Additional patterns as needed

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

All languages include:
- Step definition with validators
- Context passing between steps
- Execution history tracking
- Error handling
- Type safety (where applicable)

### 2. Orchestrator-Workers

Python, TypeScript, and C# include full implementations showing:
- Dynamic subtask planning
- Parallel worker execution
- Result synthesis
- Worker specialization

### 3. Other Patterns

Additional patterns can be generated on-demand using the agent-patterns skill.

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
