# GenAIScript Core Concepts

Fundamental concepts and building blocks for understanding GenAIScript.

## Table of Contents

1. [What is GenAIScript?](#what-is-genaiscript)
2. [Key Capabilities](#key-capabilities)
3. [Script Structure](#script-structure)
4. [File Processing](#file-processing)
5. [Environment Variables](#environment-variables)
6. [Running Scripts](#running-scripts)
7. [Best Practices](#best-practices)

---

## What is GenAIScript?

GenAIScript is Microsoft's JavaScript-based framework for building automatable prompts and AI workflows. It transforms prompt engineering from ad-hoc string concatenation into structured, testable, maintainable code.

**Core Philosophy**: Make LLM prompts programmable, testable, and maintainable.

### Traditional vs. GenAIScript Approach

**Traditional:**
```javascript
// Manual string building, hard to maintain
const prompt = `Analyze the following code:\n${codeContent}\n\nLook for bugs.`
const response = await llm.complete(prompt)
```

**GenAIScript:**
```javascript
// Structured, testable, optimized
def("CODE", env.files, { lineNumbers: true })
$`Analyze CODE for bugs.`
```

---

## Key Capabilities

### 1. Prompt-as-Code

Build prompts programmatically using JavaScript/TypeScript instead of string templates.

**Benefits:**
- Version control friendly (text-based, diffable)
- Testable and debuggable
- Reusable across scripts
- Type-safe with TypeScript

### 2. File Processing

Automatically import and optimize file context with support for multiple formats.

**Supported formats:**
- Code files (JS, TS, Python, etc.) with syntax highlighting
- Documents (PDF, DOCX, TXT)
- Data files (CSV, XLSX, JSON, YAML)

**Automatic optimization:**
- Token counting and limiting
- Intelligent slicing (head/tail for logs)
- Format conversion (PDF pages → text)

### 3. Tool Integration

Define JavaScript functions as tools that LLMs can call.

```javascript
defTool("getCurrentTime", "Gets current time", {}, async () => new Date().toISOString())
```

### 4. Structured Output

Define schemas for LLM responses to ensure consistent, parseable output.

```javascript
const result = defSchema("RESULT", {
    type: "object",
    properties: {
        summary: { type: "string" },
        score: { type: "number", minimum: 0, maximum: 100 }
    }
})
```

### 5. File Output Declaration

Declare output files the script will generate.

```javascript
defFileOutput("*.test.ts", "Generated test files")
defFileOutput("report.md", "Analysis report")
```

### 6. MCP Support

Integrate with Model Context Protocol tools and resources for extended capabilities.

---

## Script Structure

### Basic Script Format

GenAIScript files use the `.genai.mjs` extension and follow a standard structure:

```javascript
script({
    title: "My Script",
    description: "What this script does",
    model: "openai:gpt-4"
})

// Define context (files, data, schemas, tools)
def("FILE", env.files)
const schema = defSchema("RESULT", { /* schema */ })
defFileOutput("output.md", "Generated output")

// Build the prompt using template literals
$`
You are an expert analyzer.
Analyze FILE and return results using ${schema} schema.
`
```

### Metadata Configuration

The `script()` function at the top configures the script:

```javascript
script({
    title: "Code Reviewer",           // Display name
    description: "Reviews code",      // Purpose
    model: "openai:gpt-4-turbo",     // LLM model
    temperature: 0.3,                // 0.0 (deterministic) to 2.0 (creative)
    maxTokens: 4000,                 // Maximum response length
    topP: 0.9,                       // Nucleus sampling
    system: ["system.annotations"],  // System prompts
    cache: true,                     // Enable caching
    parameters: {                    // User-provided parameters
        severity: {
            type: "string",
            description: "Min severity",
            default: "warning"
        }
    }
})
```

### Prompt Creation with `$`

The `$` template tag creates prompts sent to the LLM:

```javascript
// Simple prompt
$`Generate a summary.`

// Multi-line prompt
$`
You are a technical writer.
Create documentation for the provided code.
Be comprehensive but concise.
`

// Interpolation
const topic = "AI automation"
$`Write an article about ${topic}.`

// Interpolate variables and schemas
const output = defSchema("OUTPUT", { /* schema */ })
$`
Analyze the data and return results using ${output} schema.
Focus on:
1. Key metrics
2. Anomalies
3. Recommendations
`
```

---

## Core API Functions

### `def(name, content, options?)`

Include file content in prompts with automatic optimization.

**Usage:**
```javascript
// Basic inclusion
def("FILE", env.files)

// Filter by extension
def("CODE", env.files, { endsWith: ".ts" })

// Multiple extensions
def("SOURCE", env.files, { endsWith: [".ts", ".tsx"] })

// With line numbers for reference
def("CODE", env.files, { lineNumbers: true })

// Token limiting for large files
def("LOGS", env.files, {
    maxTokens: 2000,
    sliceHead: 500,  // First 500 lines
    sliceTail: 500   // Last 500 lines
})

// Pattern matching
def("COMPONENTS", env.files, { glob: "src/components/**/*.tsx" })
```

**When to use:**
- Include source code for analysis or generation
- Add configuration files as context
- Process application logs

---

### `defData(name, data, options?)`

Include structured data in prompts (rendered as YAML by default).

**Usage:**
```javascript
// Object
const config = { theme: "dark", version: "2.0" }
defData("CONFIG", config)

// Array
const users = [
    { name: "Alice", role: "admin" },
    { name: "Bob", role: "user" }
]
defData("USERS", users)

// Parsed CSV data
const rows = await parsers.CSV(env.files[0])
defData("DATA", rows, { sliceHead: 100 })

// JSON format
defData("LARGE_DATA", complexObject, { format: "json" })
```

**When to use:**
- Include parsed file data
- Add configuration objects
- Pass structured context

---

### `defSchema(name, schema)`

Define expected output structure using JSON Schema.

**Basic examples:**

```javascript
// Array of strings
const keywords = defSchema("KEYWORDS", {
    type: "array",
    items: { type: "string" }
})

// Object with properties
const user = defSchema("USER", {
    type: "object",
    properties: {
        name: { type: "string" },
        email: { type: "string", format: "email" },
        age: { type: "number", minimum: 0 }
    },
    required: ["name", "email"]
})

// Complex nested structure
const report = defSchema("REPORT", {
    type: "object",
    properties: {
        summary: { type: "string" },
        sections: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    content: { type: "string" },
                    level: { type: "integer", minimum: 1, maximum: 3 }
                },
                required: ["title", "content"]
            }
        },
        confidence: { type: "number", minimum: 0, maximum: 1 }
    },
    required: ["summary", "sections"]
})
```

**When to use:**
- Define expected output format
- Ensure consistency of LLM responses
- Validate response structure before processing

---

### `defTool(name, description, parameters, implementation)`

Register JavaScript functions as LLM tools.

**Usage:**
```javascript
// Simple tool
defTool(
    "getCurrentTime",
    "Returns current time in ISO format",
    {},
    async () => new Date().toISOString()
)

// Tool with parameters
defTool(
    "fetchWeather",
    "Fetches weather for a location",
    {
        location: {
            type: "string",
            description: "City name"
        },
        units: {
            type: "string",
            enum: ["metric", "imperial"],
            default: "metric"
        }
    },
    async (args) => {
        const response = await fetch(
            `https://api.weather.com/current?location=${args.location}`
        )
        return await response.json()
    }
)
```

**When to use:**
- Allow LLM to call external APIs
- Integrate with local file systems
- Perform dynamic calculations

---

### `defAgent(name, description, options, implementation?)`

Create agents that can use tools to accomplish tasks.

**Usage:**
```javascript
defAgent(
    "researcher",
    "Research agent that can search and summarize",
    {
        model: "openai:gpt-4",
        system: ["You are a research assistant"],
        tools: ["webSearch", "summarize"],
        temperature: 0.7
    },
    async (context) => {
        // Optional custom agent logic
        return await context.generate("Find latest AI trends")
    }
)
```

**When to use:**
- Create autonomous agents with tool access
- Build multi-step workflows
- Enable complex reasoning and planning

---

### `defFileOutput(pattern, description?)`

Declare files the script will generate.

**Usage:**
```javascript
// Single file
defFileOutput("output.md", "Generated documentation")

// Multiple files
defFileOutput("summary.txt", "Summary")
defFileOutput("data.json", "Extracted data")

// Pattern-based
defFileOutput("*.test.ts", "Generated test files")
defFileOutput("docs/*.md", "Documentation files")
```

**When to use:**
- Declare expected outputs
- Help users understand what the script produces
- Enable output file discovery

---

## File Processing

### Parsers

GenAIScript includes built-in parsers for various file formats:

```javascript
// PDF files
const { pages, text } = await parsers.PDF(filePath)
defData("PDF_CONTENT", pages)

// CSV files
const rows = await parsers.CSV(filePath)
defData("CSV_DATA", rows)

// Excel files
const sheets = await parsers.XLSX(filePath)
defData("EXCEL_DATA", sheets)

// Word documents
const { text } = await parsers.DOCX(filePath)
def("DOCUMENT", text)

// JSON files
const data = await parsers.JSON(filePath)
defData("JSON_DATA", data)

// YAML files
const config = await parsers.YAML(filePath)
defData("YAML_CONFIG", config)
```

### File Filtering

Filter files by extension or glob pattern:

```javascript
// By extension
def("CODE", env.files, { endsWith: ".ts" })
def("SOURCE", env.files, { endsWith: [".ts", ".tsx", ".js"] })

// By glob pattern
def("TESTS", env.files, { glob: "**/*.test.ts" })
def("COMPONENTS", env.files, { glob: "src/components/**/*.tsx" })
```

### Token Management

Optimize token usage for large files:

```javascript
// Token limiting
def("LARGE_FILE", env.files, {
    maxTokens: 2000,           // Max tokens for this file
    sliceHead: 500,            // First 500 lines
    sliceTail: 500             // Last 500 lines
})

// For logs, often you want beginning and end
def("LOG", env.files, {
    maxTokens: 1500,
    sliceHead: 100,
    sliceTail: 100
})
```

---

## Environment Variables

Access runtime information through the `env` object:

### `env.files`

Array of file paths provided to the script.

```javascript
if (!env.files || env.files.length === 0) {
    throw new Error("No files provided")
}

const tsFiles = env.files.filter(f => f.endsWith(".ts"))
```

### `env.vars`

User-provided variables passed when running the script.

```javascript
// Passed via: genaiscript run script.genai.mjs --var TARGET_LANG=rust
const targetLanguage = env.vars.TARGET_LANG || "javascript"
const severity = env.vars.MIN_SEVERITY || "warning"
```

### `env.script`

Current script metadata.

```javascript
{
    title: "Script Title",
    description: "Script Description",
    id: "script-id"
}
```

### `env.generator`

Information about the LLM being used.

```javascript
{
    model: "openai:gpt-4",
    temperature: 0.3,
    maxTokens: 4000
}
```

---

## Running Scripts

### CLI Commands

```bash
# Basic execution
genaiscript run <script-name>

# With files
genaiscript run script.genai.mjs file1.ts file2.ts

# With variables
genaiscript run script.genai.mjs --var KEY=value --var LANG=rust

# Specify model
genaiscript run script.genai.mjs --model openai:gpt-4-turbo

# Multiple variables
genaiscript run script.genai.mjs --var MODE=detailed --var FORMAT=json
```

### Script Organization

Store scripts in the `genaisrc/` directory:

```
project/
├── genaisrc/
│   ├── analyze.genai.mjs
│   ├── generate-tests.genai.mjs
│   └── code-review.genai.mjs
├── src/
└── package.json
```

---

## Best Practices

### 1. Clear, Specific Prompts

**❌ Vague:**
```javascript
$`Analyze the file.`
```

**✅ Specific:**
```javascript
$`
Analyze CODE for:
1. Type safety issues (missing types, unsafe casts)
2. Unused variables and imports
3. Missing error handling

Provide specific line numbers and fix suggestions.
`
```

### 2. Validate Inputs

```javascript
// Check files exist
if (!env.files || env.files.length === 0) {
    throw new Error("No files provided")
}

// Validate file types
const validFiles = env.files.filter(f => f.endsWith(".ts"))
if (validFiles.length === 0) {
    throw new Error("Expected TypeScript files (.ts)")
}

// Validate parameters
const mode = env.vars.MODE
if (mode && !["simple", "detailed", "comprehensive"].includes(mode)) {
    throw new Error(`Invalid MODE: ${mode}`)
}
```

### 3. Use Schemas for Structure

Always use schemas for structured output:

```javascript
// ❌ Unstructured
$`Extract key data from the file.`

// ✅ Structured
const data = defSchema("DATA", {
    type: "object",
    properties: {
        entities: { type: "array", items: { type: "string" } },
        summary: { type: "string" },
        confidence: { type: "number" }
    },
    required: ["entities", "summary"]
})

$`Extract data using ${data} schema.`
```

### 4. Manage Token Budgets

```javascript
// Calculate available tokens
const TOTAL_BUDGET = 8000
const PROMPT_TOKENS = 1000
const RESPONSE_TOKENS = 2000
const AVAILABLE_FOR_CONTEXT = TOTAL_BUDGET - PROMPT_TOKENS - RESPONSE_TOKENS

// For large files, limit tokens
def("LARGE_LOG", env.files, {
    maxTokens: Math.floor(AVAILABLE_FOR_CONTEXT / 2),
    sliceHead: 500,
    sliceTail: 500
})
```

### 5. Break Complex Tasks into Steps

```javascript
// Step 1: Initial analysis
def("CODE", env.files, { lineNumbers: true })
$`Analyze CODE and identify issues.`
const issues = await generate()

// Step 2: Detailed analysis
defData("ISSUES", issues)
$`For each issue in ISSUES, provide detailed explanation and fix.`
const fixes = await generate()

// Step 3: Generate output
defData("FIXES", fixes)
defFileOutput("fixes.md", "Suggested fixes")
$`Create a markdown report from FIXES.`
```

### 6. Enable Caching for Repeated Work

```javascript
script({
    cache: true,
    cacheName: "code-analysis"
})

// This will be cached on first run
def("ENTIRE_CODEBASE", env.files, { glob: "src/**/*.ts" })
$`Analyze the overall architecture of ENTIRE_CODEBASE.`
```

### 7. Use System Prompts

```javascript
script({
    system: [
        "system.annotations",  // Use structured annotation format
        "system.typescript",   // TypeScript expert
        "system.safety"        // Safety guidelines
    ]
})
```

---

## See Also

- [API Reference](api-reference.md) - Complete function documentation
- [Examples](examples.md) - Practical code examples
- [Patterns](patterns.md) - Advanced patterns and optimization

