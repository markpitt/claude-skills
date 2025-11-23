---
name: genaiscript
description: Comprehensive expertise for working with Microsoft's GenAIScript framework - a JavaScript/TypeScript-based system for building automatable LLM prompts and AI workflows. Use when creating, debugging, or optimizing GenAIScript scripts, implementing prompts-as-code, working with tools and agents, processing files (PDF, CSV, DOCX), defining schemas, or building AI automation workflows.
version: 1.0
---

# GenAIScript Expert

You are an expert in Microsoft's GenAIScript framework, a JavaScript-based system for building automatable prompts and AI workflows.

## Core Concepts

### What is GenAIScript?

GenAIScript is a scripting framework that enables:
- **Prompt-as-Code**: Build prompts programmatically using JavaScript/TypeScript
- **File Processing**: Import context from PDFs, DOCX, CSV, and other formats
- **Tool Integration**: Define custom tools and agents for LLMs
- **Structured Output**: Generate files, edits, and structured data from LLM responses
- **MCP Support**: Integrate with Model Context Protocol tools and resources

### Script Structure

GenAIScript files follow the naming convention `<scriptname>.genai.mjs` and are stored in the `genaisrc/` directory.

Basic script structure:
```javascript
script({
    title: "My Script",
    description: "What this script does",
    model: "openai:gpt-4",
    temperature: 0.5
})

// Define context
def("FILE", env.files)

// Build prompt
$`Analyze the FILE and provide insights.`
```

## Core API Functions

### 1. Prompt Creation with `$`

The `$` template tag creates prompts sent to the LLM:

```javascript
$`Generate a summary of the following content.`

// Multi-line prompts
$`
You are a technical writer.
Create documentation for the provided code.
`

// Interpolate variables
const topic = "AI automation"
$`Write an article about ${topic}.`
```

### 2. Context Definition with `def()`

Include file content in prompts with automatic optimization:

```javascript
// Basic file inclusion
def("FILE", env.files)

// Filter by extension
def("CODE", env.files, { endsWith: ".ts" })

// Add line numbers
def("SOURCE", env.files, { lineNumbers: true })

// Limit tokens
def("LARGE_FILE", env.files, { maxTokens: 1000 })

// Slice head/tail
def("LOG", env.files, { sliceHead: 100, sliceTail: 50 })
```

### 3. Script Metadata with `script()`

Configure script behavior and model settings:

```javascript
script({
    title: "Code Reviewer",
    description: "Reviews code for best practices",
    model: "openai:gpt-4-turbo",
    temperature: 0.3,
    maxTokens: 2000,
    system: ["system.annotations"],  // System prompts
    tools: ["fs", "git"],  // Available tools
    cache: true,  // Enable caching
    parameters: {
        language: {
            type: "string",
            description: "Programming language"
        }
    }
})
```

### 4. Structured Data with `defData()`

Render objects as YAML or other formats in prompts:

```javascript
// Process CSV data
const rows = await parsers.CSV(env.files[0])
defData("ROWS", rows, { sliceHead: 100 })

// Include JSON data
const config = { theme: "dark", language: "en" }
defData("CONFIG", config)

// Array of objects
const users = [
    { name: "Alice", role: "admin" },
    { name: "Bob", role: "user" }
]
defData("USERS", users)
```

### 5. Schema Definition with `defSchema()`

Define expected output structure for LLM responses:

```javascript
// Array of strings
const keywords = defSchema("KEYWORDS", {
    type: "array",
    items: { type: "string" }
})
$`Extract keywords using ${keywords} schema.`

// Object with properties
const user = defSchema("USER", {
    type: "object",
    properties: {
        name: { type: "string" },
        email: { type: "string" },
        age: { type: "number" }
    },
    required: ["name", "email"]
})
$`Extract user information using ${user} schema.`

// Complex nested schema
const analysis = defSchema("ANALYSIS", {
    type: "object",
    properties: {
        summary: { type: "string" },
        issues: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    severity: { type: "string", enum: ["low", "medium", "high"] },
                    description: { type: "string" },
                    line: { type: "number" }
                }
            }
        },
        score: { type: "number", minimum: 0, maximum: 100 }
    }
})
```

### 6. File Output with `defFileOutput()`

Declare files that the script will generate:

```javascript
// Single file output
defFileOutput("output.md", "Generated documentation")

// Multiple outputs
defFileOutput("summary.txt", "Summary of analysis")
defFileOutput("data.json", "Extracted data")
defFileOutput("report.html", "HTML report")

// Pattern-based outputs
defFileOutput("*.test.ts", "Generated test files")
```

### 7. Tools with `defTool()`

Register JavaScript functions as LLM tools:

```javascript
// Simple tool
defTool(
    "getCurrentTime",
    "Gets the current time",
    {},
    async () => new Date().toISOString()
)

// Tool with parameters
defTool(
    "weather",
    "Query weather for a location",
    {
        location: {
            type: "string",
            description: "City name"
        }
    },
    async (args) => {
        const response = await fetch(
            `https://api.weather.com/?location=${args.location}`
        )
        return await response.json()
    }
)

// Tool with multiple parameters
defTool(
    "calculate",
    "Perform mathematical calculations",
    {
        operation: {
            type: "string",
            enum: ["add", "subtract", "multiply", "divide"]
        },
        a: { type: "number" },
        b: { type: "number" }
    },
    async ({ operation, a, b }) => {
        switch (operation) {
            case "add": return a + b
            case "subtract": return a - b
            case "multiply": return a * b
            case "divide": return a / b
        }
    }
)
```

### 8. Agents with `defAgent()`

Create agents that use tools to accomplish tasks:

```javascript
defAgent(
    "researcher",
    "Research agent that can search and summarize",
    {
        model: "openai:gpt-4",
        system: ["You are a research assistant"],
        tools: ["webSearch", "summarize"]
    },
    async (context) => {
        // Agent implementation
        return await context.generate("Find information about AI trends")
    }
)
```

## File Processing

### Supported Formats

GenAIScript includes parsers for various file types:

```javascript
// PDF files
def("PDF", env.files, { endsWith: ".pdf" })
const { pages } = await parsers.PDF(env.files[0])
defData("PAGES", pages)

// CSV files
def("CSV", env.files, { endsWith: ".csv" })
const rows = await parsers.CSV(env.files[0])
defData("ROWS", rows, { sliceHead: 100 })

// XLSX (Excel) files
const data = await parsers.XLSX(env.files[0])
defData("SHEETS", data)

// DOCX (Word) files
const { text } = await parsers.DOCX(env.files[0])
def("DOCUMENT", text)

// JSON files
const json = await parsers.JSON(env.files[0])
defData("DATA", json)

// YAML files
const yaml = await parsers.YAML(env.files[0])
defData("CONFIG", yaml)

// Code files with syntax highlighting
def("CODE", env.files, {
    endsWith: [".ts", ".js", ".py"],
    lineNumbers: true
})
```

## Common Patterns

### 1. Code Analysis

```javascript
script({
    title: "Code Reviewer",
    description: "Analyzes code for issues",
    model: "openai:gpt-4"
})

def("CODE", env.files, {
    endsWith: [".ts", ".js", ".tsx", ".jsx"],
    lineNumbers: true
})

const issues = defSchema("ISSUES", {
    type: "array",
    items: {
        type: "object",
        properties: {
            file: { type: "string" },
            line: { type: "number" },
            severity: { type: "string", enum: ["error", "warning", "info"] },
            message: { type: "string" },
            suggestion: { type: "string" }
        }
    }
})

$`
Analyze CODE for:
- Bugs and errors
- Performance issues
- Security vulnerabilities
- Code style violations

Return findings using ${issues} schema.
`
```

### 2. Documentation Generation

```javascript
script({
    title: "Doc Generator",
    description: "Generates documentation from code",
    model: "openai:gpt-4-turbo"
})

def("SOURCE", env.files, {
    endsWith: [".ts", ".tsx"],
    lineNumbers: true
})

defFileOutput("README.md", "Generated documentation")
defFileOutput("API.md", "API reference")

$`
Generate comprehensive documentation for SOURCE:

1. README.md with:
   - Overview
   - Installation
   - Quick start
   - Examples

2. API.md with:
   - Function signatures
   - Parameters
   - Return types
   - Usage examples
`
```

### 3. Data Extraction

```javascript
script({
    title: "Data Extractor",
    description: "Extracts structured data from documents"
})

def("DOCS", env.files, { endsWith: ".pdf" })

const data = defSchema("EXTRACTED_DATA", {
    type: "object",
    properties: {
        entities: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    type: { type: "string" },
                    value: { type: "string" }
                }
            }
        },
        summary: { type: "string" },
        keyPoints: {
            type: "array",
            items: { type: "string" }
        }
    }
})

$`Extract information from DOCS using ${data} schema.`
```

### 4. Test Generation

```javascript
script({
    title: "Test Generator",
    description: "Generates unit tests for code"
})

def("SOURCE", env.files, {
    endsWith: [".ts", ".js"],
    lineNumbers: true
})

defFileOutput("*.test.ts", "Generated test files")

$`
For each function in SOURCE, generate comprehensive unit tests:

- Test happy paths
- Test edge cases
- Test error handling
- Include mock data
- Use appropriate testing framework (Jest/Vitest)

Generate tests in separate .test.ts files.
`
```

### 5. File Transformation

```javascript
script({
    title: "Format Converter",
    description: "Converts between file formats"
})

def("INPUT", env.files)

defFileOutput("output.json", "Converted data")

$`
Convert INPUT to JSON format.
Preserve all data and structure.
Ensure valid JSON output.
`
```

## Environment Variables

Access runtime information through `env`:

```javascript
// Files provided to the script
env.files  // Array of file paths

// Script metadata
env.script  // Current script info

// Variables passed to script
env.vars.CUSTOM_VAR

// Generator model info
env.generator  // LLM model being used
```

## Best Practices

### 1. Clear Prompts

```javascript
// ❌ Vague
$`Analyze the file.`

// ✅ Specific
$`
Analyze CODE for:
1. Type safety issues
2. Unused variables
3. Missing error handling
Provide specific line numbers and fix suggestions.
`
```

### 2. Schema Validation

```javascript
// Always use schemas for structured output
const result = defSchema("RESULT", {
    type: "object",
    properties: {
        success: { type: "boolean" },
        data: { type: "object" },
        errors: {
            type: "array",
            items: { type: "string" }
        }
    },
    required: ["success"]
})
```

### 3. Token Management

```javascript
// Limit tokens for large files
def("LARGE_LOG", env.files, {
    maxTokens: 2000,
    sliceHead: 500,
    sliceTail: 500
})
```

### 4. Error Handling

```javascript
// Check for file existence
if (!env.files || env.files.length === 0) {
    throw new Error("No files provided")
}

// Validate file types
const validFiles = env.files.filter(f => f.endsWith(".ts"))
if (validFiles.length === 0) {
    throw new Error("No TypeScript files found")
}
```

### 5. Modular Scripts

```javascript
// Break complex scripts into functions
async function analyzeCode(files) {
    def("CODE", files, { lineNumbers: true })
    // Analysis logic
}

async function generateReport(analysis) {
    defFileOutput("report.md", "Analysis report")
    // Report generation
}

// Main script
await analyzeCode(env.files)
await generateReport()
```

## VS Code Integration

GenAIScript includes a VS Code extension with:

- **Syntax highlighting** for `.genai.mjs` files
- **IntelliSense** for API functions
- **Debug support** with breakpoints
- **Script runner** to test scripts
- **Output preview** for generated files

### Running Scripts

```bash
# CLI usage
genaiscript run <script-name>

# With files
genaiscript run <script-name> file1.ts file2.ts

# With variables
genaiscript run <script-name> --var KEY=value

# Specify model
genaiscript run <script-name> --model openai:gpt-4
```

## Advanced Features

### 1. Caching

Enable prompt caching for better performance:

```javascript
script({
    cache: true,  // Enable caching
    cacheName: "my-cache"  // Optional cache key
})
```

### 2. System Prompts

Use built-in system prompts:

```javascript
script({
    system: [
        "system.annotations",  // Use annotation format
        "system.safety",  // Safety guidelines
        "system.python"  // Python expert
    ]
})
```

### 3. Temperature Control

Adjust creativity vs. consistency:

```javascript
script({
    temperature: 0.0  // Deterministic (code generation, analysis)
})

script({
    temperature: 0.7  // Balanced (general tasks)
})

script({
    temperature: 1.0  // Creative (writing, brainstorming)
})
```

### 4. Multi-step Workflows

Chain multiple LLM calls:

```javascript
// Step 1: Analyze
$`Analyze the code and identify issues.`
const analysis = await generate()

// Step 2: Plan fixes
defData("ANALYSIS", analysis)
$`Based on ANALYSIS, create a fix plan.`
const plan = await generate()

// Step 3: Implement
defData("PLAN", plan)
$`Implement the fixes from PLAN.`
```

## Common Use Cases

1. **Code Review**: Analyze code for bugs, style, and best practices
2. **Documentation**: Generate README, API docs, and guides
3. **Testing**: Create unit tests, integration tests, and test data
4. **Data Extraction**: Parse PDFs, CSVs, and extract structured data
5. **File Transformation**: Convert between formats (CSV → JSON, MD → HTML)
6. **Summarization**: Summarize documents, logs, or codebases
7. **Translation**: Convert code between languages or frameworks
8. **Refactoring**: Suggest and implement code improvements
9. **Automation**: Build CI/CD workflows with AI assistance
10. **Analysis**: Perform sentiment analysis, trend detection, etc.

## Troubleshooting

### Script Not Running

- Verify file is in `genaisrc/` directory
- Check filename ends with `.genai.mjs`
- Ensure `script()` metadata is defined
- Validate JavaScript syntax

### Token Limit Errors

- Use `maxTokens` in `def()` to limit context
- Implement `sliceHead`/`sliceTail` for large files
- Break large tasks into smaller scripts
- Use caching to reduce token usage

### Schema Validation Failures

- Ensure schema matches expected output format
- Use `required` fields appropriately
- Test schemas with simple examples first
- Check enum values are valid

### Performance Issues

- Enable caching with `cache: true`
- Limit file context with filters
- Use appropriate model (GPT-3.5 for simple tasks)
- Reduce temperature for deterministic tasks

## Resources

For additional information, see the **resources/** directory:
- `api-reference.md` - Complete API documentation
- `examples.md` - More example scripts
- `patterns.md` - Advanced patterns and recipes

## Quick Reference

| Function | Purpose | Example |
|----------|---------|---------|
| `$` | Create prompt | `$\`Analyze code\`` |
| `def()` | Include files | `def("FILE", env.files)` |
| `defData()` | Include data | `defData("JSON", data)` |
| `defSchema()` | Define output | `defSchema("OUT", schema)` |
| `defTool()` | Create tool | `defTool("name", "desc", {}, fn)` |
| `defAgent()` | Create agent | `defAgent("name", "desc", opts, fn)` |
| `defFileOutput()` | Declare output | `defFileOutput("out.md")` |
| `script()` | Set metadata | `script({ title: "X" })` |

## Getting Help

When helping users with GenAIScript:
1. Always ask what they're trying to accomplish
2. Review their script structure and syntax
3. Suggest appropriate API functions
4. Provide complete, working examples
5. Explain token management strategies
6. Recommend appropriate models and temperatures
7. Show how to test and debug scripts

Remember: GenAIScript is about making LLM prompts programmable, testable, and maintainable. Focus on clean code, clear prompts, and structured outputs.
