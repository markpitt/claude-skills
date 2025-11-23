# Tool Design Guidelines

Best practices for designing Agent-Computer Interfaces (ACI) based on Anthropic's engineering insights.

## Core Principles

### 1. Poka-Yoke (Error-Proofing)
Design interfaces that make mistakes impossible rather than detectable.

**Examples:**
- ✅ Use absolute paths instead of relative paths
- ✅ Provide enums instead of free text
- ✅ Validate inputs before execution
- ✅ Type-safe parameters

### 2. Natural Format Selection
Choose formats close to naturally-occurring text on the internet.

**Good Formats:**
- JSON (widely used, model-familiar)
- Markdown (natural text structure)
- Common DSLs (SQL, regex patterns)
- Plain key-value pairs

**Avoid:**
- Custom binary formats
- Excessive escape sequences
- Manual line counting
- Overly nested structures

### 3. Sufficient Reasoning Space
Provide enough tokens for the model to reason about tool usage.

**Best Practices:**
- Include "thinking" or "rationale" fields
- Allow models to explain their tool choices
- Don't overly constrain output format
- Balance structure with flexibility

## Tool Interface Design

### Required Components

#### 1. Clear Name
```typescript
// Good
"search_codebase_by_keyword"
"create_github_pull_request"
"analyze_sentiment"

// Bad
"search" // Too vague
"do_it" // Meaningless
"func1" // No semantic value
```

#### 2. Comprehensive Description
```typescript
{
  name: "search_codebase",
  description: `
    Searches the entire codebase for files and content matching the query.

    Use this when you need to:
    - Find files by name or pattern
    - Locate code implementing specific functionality
    - Discover where a symbol is defined or used

    Returns: Array of {file: string, line: number, content: string}

    Note: Search is case-insensitive by default. Use regex: true for
    advanced pattern matching.
  `
}
```

#### 3. Explicit Parameters

**With Examples:**
```typescript
{
  name: "send_email",
  parameters: {
    to: {
      type: "string",
      description: "Recipient email address (e.g., 'user@example.com')",
      required: true
    },
    subject: {
      type: "string",
      description: "Email subject line (e.g., 'Quarterly Report')",
      required: true
    },
    body: {
      type: "string",
      description: "Email body content in plain text or HTML",
      required: true
    },
    cc: {
      type: "array",
      items: { type: "string" },
      description: "Optional CC recipients (e.g., ['user1@example.com', 'user2@example.com'])",
      required: false
    }
  }
}
```

#### 4. Edge Cases Documentation
```typescript
{
  name: "divide_numbers",
  description: `
    Divides numerator by denominator.

    Edge cases:
    - Division by zero returns error: {error: "Division by zero"}
    - Very large numbers may lose precision
    - Result is always returned as float
    - Null/undefined inputs return error
  `,
  parameters: {
    numerator: { type: "number", description: "Number to divide" },
    denominator: { type: "number", description: "Number to divide by (cannot be 0)" }
  }
}
```

### Real-World Insight from SWE-bench

**Problem:** Agent frequently failed with path errors

**Initial Approach:** Relative paths
```typescript
// Caused many errors
{
  name: "edit_file",
  parameters: {
    path: "src/utils/helper.ts" // Relative path
  }
}
```

**Solution:** Absolute paths
```typescript
// Eliminated entire error class
{
  name: "edit_file",
  parameters: {
    path: "/workspace/project/src/utils/helper.ts" // Absolute path
  }
}
```

**Result:** This single change eliminated an entire category of errors.

**Lesson:** Spend more time optimizing tool interfaces than prompts.

## Format Selection Examples

### ✅ Good: JSON for Structured Data
```json
{
  "action": "create_file",
  "path": "/workspace/src/new_file.ts",
  "content": "export function hello() { return 'world'; }"
}
```

**Why:** Familiar format, good balance of structure and readability.

### ✅ Good: Markdown for Text
```markdown
## Summary
Created three new components for the dashboard.

## Changes
- Added MetricsCard component
- Added ChartWidget component
- Updated Dashboard layout
```

**Why:** Natural text structure, easy for models to generate.

### ❌ Bad: Line-Counting Format
```
INSERT AT LINE 42:
export function newFunction() {
  return true;
}
END INSERT
```

**Why:** Requires manual counting, error-prone, not natural.

### ❌ Bad: Excessive Escaping
```
"content": "{\"key\": \"value\", \"nested\": {\"inner\": \"data\"}}"
```

**Why:** Hard to read, easy to make mistakes, better to use nested objects.

## Parameter Design Patterns

### Pattern 1: Enums Over Free Text

```typescript
// ✅ Good
{
  name: "set_log_level",
  parameters: {
    level: {
      type: "string",
      enum: ["debug", "info", "warn", "error"],
      description: "Logging level to set"
    }
  }
}

// ❌ Bad
{
  name: "set_log_level",
  parameters: {
    level: {
      type: "string",
      description: "Logging level (debug, info, warn, or error)"
    }
  }
}
```

### Pattern 2: Structured Objects Over Strings

```typescript
// ✅ Good
{
  name: "schedule_task",
  parameters: {
    schedule: {
      type: "object",
      properties: {
        hour: { type: "number", min: 0, max: 23 },
        minute: { type: "number", min: 0, max: 59 },
        timezone: { type: "string", default: "UTC" }
      }
    }
  }
}

// ❌ Bad
{
  name: "schedule_task",
  parameters: {
    schedule: {
      type: "string",
      description: "Schedule in format 'HH:MM TZ'"
    }
  }
}
```

### Pattern 3: Sensible Defaults

```typescript
// ✅ Good
{
  name: "search",
  parameters: {
    query: { type: "string", required: true },
    case_sensitive: { type: "boolean", default: false },
    max_results: { type: "number", default: 10, min: 1, max: 100 }
  }
}
```

### Pattern 4: Validation Constraints

```typescript
{
  name: "create_user",
  parameters: {
    username: {
      type: "string",
      pattern: "^[a-zA-Z0-9_-]{3,16}$",
      description: "Username (3-16 chars, alphanumeric, dash, underscore)"
    },
    email: {
      type: "string",
      format: "email",
      description: "Valid email address"
    },
    age: {
      type: "number",
      minimum: 13,
      maximum: 120,
      description: "User age (must be 13 or older)"
    }
  }
}
```

## Testing Tool Interfaces

### 1. Workbench Testing
Use Claude's workbench to test tools with varied inputs:

```typescript
// Test cases to try
const testCases = [
  // Happy path
  { query: "search term", filters: ["type:function"] },

  // Edge cases
  { query: "", filters: [] }, // Empty
  { query: "a".repeat(1000), filters: [] }, // Very long
  { query: "special!@#$%chars", filters: [] }, // Special chars

  // Error cases
  { query: null, filters: [] }, // Null
  { /* missing query */ }, // Missing required
];
```

### 2. Real-World Scenarios
Test with actual use cases, not synthetic examples:

```typescript
// ✅ Good: Real scenario
const scenario = {
  task: "Find all authentication-related functions in the codebase",
  expected_queries: [
    "authentication",
    "login",
    "verify user",
    "check credentials"
  ]
};

// ❌ Bad: Synthetic test
const test = {
  query: "test123"
};
```

### 3. Error Message Quality

```typescript
// ✅ Good: Actionable error
{
  error: "Invalid email format",
  details: "Email 'user@' is missing domain. Expected format: user@example.com",
  field: "email",
  received: "user@"
}

// ❌ Bad: Vague error
{
  error: "Validation failed"
}
```

## Common Pitfalls

### ❌ Pitfall 1: Ambiguous Parameters
```typescript
// Bad
{ name: "file", description: "The file" }

// Good
{ name: "source_file_path", description: "Absolute path to the source file to read" }
```

### ❌ Pitfall 2: Missing Examples
```typescript
// Bad
{ name: "pattern", description: "A regex pattern" }

// Good
{
  name: "pattern",
  description: "Regular expression pattern (e.g., '^[A-Z]+$' for uppercase letters)"
}
```

### ❌ Pitfall 3: No Input Validation
```typescript
// Bad - accepts anything
function dividNumbers(a, b) {
  return a / b; // Crashes on division by zero
}

// Good - validates
function divideNumbers(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  if (b === 0) {
    throw new Error('Division by zero is not allowed');
  }
  return a / b;
}
```

### ❌ Pitfall 4: Hidden State Dependencies
```typescript
// Bad - depends on hidden state
{
  name: "get_next_item",
  description: "Gets the next item" // Next in what? Where does state live?
}

// Good - explicit state
{
  name: "get_item_by_index",
  parameters: {
    collection_id: { type: "string", description: "ID of the collection" },
    index: { type: "number", description: "Zero-based index of item to retrieve" }
  }
}
```

## Model Context Protocol (MCP) Integration

When designing tools for MCP:

### 1. Follow MCP Schema
```typescript
{
  name: "tool_name",
  description: "Tool description",
  inputSchema: {
    type: "object",
    properties: {
      param1: {
        type: "string",
        description: "Parameter description"
      }
    },
    required: ["param1"]
  }
}
```

### 2. Return Structured Results
```typescript
// ✅ Good: Structured
{
  success: true,
  data: {
    files_found: 5,
    results: [...]
  },
  metadata: {
    search_duration_ms: 150,
    total_files_scanned: 1250
  }
}

// ❌ Bad: Unstructured
"Found 5 files in 150ms after scanning 1250 files: ..."
```

### 3. Enable Composition
Design tools that work well together:

```typescript
// Tools that compose well
search_codebase() → read_file() → edit_file() → run_tests()

// Each tool:
// - Has clear input/output contracts
// - Doesn't require hidden state
// - Returns data usable by other tools
```

## Language-Specific Considerations

### Python
```python
from typing import TypedDict, Literal

class SearchParams(TypedDict):
    query: str
    case_sensitive: bool = False
    file_types: list[Literal["py", "js", "ts", "md"]] = ["py"]

def search_codebase(params: SearchParams) -> list[dict]:
    """Use type hints for clarity and IDE support"""
    pass
```

### TypeScript
```typescript
interface SearchParams {
  query: string;
  caseSensitive?: boolean;
  fileTypes?: ('ts' | 'js' | 'py' | 'md')[];
}

// Strong typing prevents errors at compile time
function searchCodebase(params: SearchParams): SearchResult[] {
  // Implementation
}
```

### Rust
```rust
#[derive(Deserialize)]
struct SearchParams {
    query: String,
    #[serde(default)]
    case_sensitive: bool,
    #[serde(default = "default_file_types")]
    file_types: Vec<String>,
}

// Compile-time guarantees prevent entire error classes
fn search_codebase(params: SearchParams) -> Vec<SearchResult> {
    // Implementation
}
```

### C#
```csharp
public class SearchParams
{
    [Required]
    public string Query { get; set; }

    public bool CaseSensitive { get; set; } = false;

    public List<FileType> FileTypes { get; set; } = new();
}

// Use attributes for validation
public List<SearchResult> SearchCodebase(SearchParams params)
{
    // Implementation
}
```

## Checklist for Tool Design

- [ ] Clear, semantic name
- [ ] Comprehensive description with examples
- [ ] All parameters documented with examples
- [ ] Edge cases documented
- [ ] Error cases handled and documented
- [ ] Input validation implemented
- [ ] Sensible defaults provided
- [ ] Return format documented
- [ ] Type safety where possible
- [ ] No hidden state dependencies
- [ ] Tested with varied inputs
- [ ] Examples of expected usage
- [ ] Integration with other tools considered

## Resources

- Model Context Protocol: https://modelcontextprotocol.io/
- Anthropic Building Effective Agents: https://www.anthropic.com/engineering/building-effective-agents
- Poka-Yoke Principles: Error-proofing design methodology
