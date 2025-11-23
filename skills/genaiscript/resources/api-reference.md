# GenAIScript API Reference

Complete reference for all GenAIScript functions and APIs.

## Core Functions

### `script(options)`

Defines script metadata and configuration.

**Parameters:**
```typescript
{
    title?: string              // Display name
    description?: string        // What the script does
    model?: string             // LLM model (e.g., "openai:gpt-4")
    temperature?: number       // 0.0-2.0, creativity vs consistency
    maxTokens?: number         // Maximum response tokens
    topP?: number             // Nucleus sampling (0.0-1.0)
    system?: string[]         // System prompt templates
    tools?: string[]          // Available tools
    cache?: boolean           // Enable prompt caching
    cacheName?: string        // Cache identifier
    parameters?: {            // User-provided parameters
        [key: string]: {
            type: string
            description: string
            default?: any
        }
    }
    files?: string | string[] // File patterns to include
}
```

**Example:**
```javascript
script({
    title: "Code Reviewer",
    description: "Reviews code for issues",
    model: "openai:gpt-4-turbo",
    temperature: 0.3,
    maxTokens: 4000,
    system: ["system.annotations"],
    cache: true,
    parameters: {
        severity: {
            type: "string",
            description: "Minimum severity level",
            default: "warning"
        }
    }
})
```

---

### `$(template)`

Creates a prompt from a template string.

**Parameters:**
- `template` (TemplateStringsArray): Template literal with interpolated values

**Returns:** void

**Example:**
```javascript
const topic = "AI automation"
const tone = "professional"

$`
You are a ${tone} technical writer.
Write an article about ${topic}.

Include:
- Introduction
- Key concepts
- Examples
- Conclusion
`
```

---

### `def(name, content, options?)`

Includes file content in the prompt with optimization.

**Parameters:**
```typescript
def(
    name: string,           // Identifier in prompt
    content: string | string[],  // File path(s)
    options?: {
        endsWith?: string | string[]  // Filter by extension
        glob?: string | string[]      // Glob pattern
        lineNumbers?: boolean         // Add line numbers
        language?: string             // Syntax highlighting
        maxTokens?: number           // Token limit
        sliceHead?: number           // First N lines
        sliceTail?: number           // Last N lines
    }
)
```

**Example:**
```javascript
// Basic usage
def("FILE", env.files)

// With filters
def("CODE", env.files, {
    endsWith: [".ts", ".tsx"],
    lineNumbers: true
})

// Token limiting
def("LARGE_FILE", env.files, {
    maxTokens: 2000,
    sliceHead: 500,
    sliceTail: 500
})

// Glob pattern
def("COMPONENTS", env.files, {
    glob: "src/components/**/*.tsx"
})
```

---

### `defData(name, data, options?)`

Includes structured data in the prompt (rendered as YAML by default).

**Parameters:**
```typescript
defData(
    name: string,           // Identifier in prompt
    data: any,             // Data to include
    options?: {
        format?: "yaml" | "json"  // Output format
        sliceHead?: number        // Limit array items (head)
        sliceTail?: number        // Limit array items (tail)
    }
)
```

**Example:**
```javascript
// Object data
const config = { theme: "dark", language: "en" }
defData("CONFIG", config)

// Array data
const users = [
    { name: "Alice", role: "admin" },
    { name: "Bob", role: "user" }
]
defData("USERS", users)

// CSV parsing
const rows = await parsers.CSV(env.files[0])
defData("ROWS", rows, { sliceHead: 100 })

// JSON format
defData("DATA", largeObject, { format: "json" })
```

---

### `defSchema(name, schema)`

Defines expected output structure using JSON Schema.

**Parameters:**
```typescript
defSchema(
    name: string,              // Schema identifier
    schema: JSONSchema         // JSON Schema object
)
```

**Returns:** Schema reference for use in prompts

**Example:**
```javascript
// Simple array
const keywords = defSchema("KEYWORDS", {
    type: "array",
    items: { type: "string" }
})

// Object schema
const user = defSchema("USER", {
    type: "object",
    properties: {
        name: { type: "string" },
        email: { type: "string", format: "email" },
        age: { type: "number", minimum: 0 }
    },
    required: ["name", "email"]
})

// Complex nested schema
const analysis = defSchema("ANALYSIS", {
    type: "object",
    properties: {
        summary: {
            type: "string",
            minLength: 10,
            maxLength: 500
        },
        issues: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    severity: {
                        type: "string",
                        enum: ["low", "medium", "high", "critical"]
                    },
                    description: { type: "string" },
                    line: { type: "number" },
                    file: { type: "string" }
                },
                required: ["severity", "description"]
            }
        },
        score: {
            type: "number",
            minimum: 0,
            maximum: 100
        }
    },
    required: ["summary", "score"]
})

// Use in prompt
$`Analyze the code and return results using ${analysis} schema.`
```

---

### `defTool(name, description, parameters, implementation)`

Registers a JavaScript function as an LLM tool.

**Parameters:**
```typescript
defTool(
    name: string,              // Tool name
    description: string,       // What the tool does
    parameters: {              // Parameter schema
        [key: string]: {
            type: string
            description?: string
            enum?: string[]
            default?: any
        }
    },
    implementation: (args: any) => Promise<any>  // Tool function
)
```

**Example:**
```javascript
// Simple tool
defTool(
    "getCurrentTime",
    "Gets the current time in ISO format",
    {},
    async () => new Date().toISOString()
)

// Tool with parameters
defTool(
    "fetchWeather",
    "Fetches weather data for a location",
    {
        location: {
            type: "string",
            description: "City name or coordinates"
        },
        units: {
            type: "string",
            enum: ["metric", "imperial"],
            default: "metric"
        }
    },
    async (args) => {
        const response = await fetch(
            `https://api.weather.com/v1/current?location=${args.location}&units=${args.units}`
        )
        return await response.json()
    }
)

// Tool with file operations
defTool(
    "readConfig",
    "Reads configuration from a file",
    {
        path: {
            type: "string",
            description: "Config file path"
        }
    },
    async (args) => {
        const content = await host.readFile(args.path)
        return JSON.parse(content)
    }
)

// Tool with multiple parameters
defTool(
    "calculate",
    "Performs mathematical operations",
    {
        operation: {
            type: "string",
            enum: ["add", "subtract", "multiply", "divide"],
            description: "Math operation to perform"
        },
        a: {
            type: "number",
            description: "First operand"
        },
        b: {
            type: "number",
            description: "Second operand"
        }
    },
    async ({ operation, a, b }) => {
        switch (operation) {
            case "add": return a + b
            case "subtract": return a - b
            case "multiply": return a * b
            case "divide": return b !== 0 ? a / b : "Error: Division by zero"
        }
    }
)
```

---

### `defAgent(name, description, options, implementation)`

Creates an agent that can use tools to accomplish tasks.

**Parameters:**
```typescript
defAgent(
    name: string,              // Agent name
    description: string,       // Agent purpose
    options: {
        model?: string         // LLM model
        system?: string[]      // System prompts
        tools?: string[]       // Available tools
        temperature?: number   // Creativity setting
    },
    implementation?: (context) => Promise<any>  // Agent logic
)
```

**Example:**
```javascript
// Research agent
defAgent(
    "researcher",
    "Researches topics and summarizes findings",
    {
        model: "openai:gpt-4",
        system: ["You are a research assistant"],
        tools: ["webSearch", "summarize"],
        temperature: 0.7
    }
)

// Custom agent with implementation
defAgent(
    "codeAnalyzer",
    "Analyzes code and suggests improvements",
    {
        model: "openai:gpt-4",
        tools: ["readFile", "parseCode", "searchDocs"]
    },
    async (context) => {
        // Custom agent logic
        const files = await context.tool("readFile", { path: "src/" })
        const analysis = await context.generate(
            `Analyze these files: ${files}`
        )
        return analysis
    }
)
```

---

### `defFileOutput(pattern, description?)`

Declares files that the script will generate.

**Parameters:**
```typescript
defFileOutput(
    pattern: string,           // File path or pattern
    description?: string       // File purpose
)
```

**Example:**
```javascript
// Single file
defFileOutput("output.md", "Generated documentation")

// Multiple files
defFileOutput("summary.txt", "Summary of analysis")
defFileOutput("data.json", "Extracted data")
defFileOutput("report.html", "HTML report")

// Pattern-based
defFileOutput("*.test.ts", "Generated test files")
defFileOutput("docs/*.md", "Documentation files")
```

---

## Parsers

Built-in parsers for various file formats.

### `parsers.PDF(filePath)`

Parses PDF files.

**Returns:**
```typescript
{
    text: string          // Full text content
    pages: Array<{        // Per-page content
        pageNumber: number
        text: string
    }>
}
```

**Example:**
```javascript
const { pages, text } = await parsers.PDF(env.files[0])
defData("PDF_CONTENT", pages)
```

---

### `parsers.CSV(filePath, options?)`

Parses CSV files.

**Parameters:**
```typescript
parsers.CSV(
    filePath: string,
    options?: {
        delimiter?: string     // Default: ","
        headers?: boolean      // Default: true
    }
)
```

**Returns:** `Array<Record<string, string>>`

**Example:**
```javascript
const rows = await parsers.CSV(env.files[0])
defData("DATA", rows, { sliceHead: 100 })

// Custom delimiter
const tsvRows = await parsers.CSV(file, { delimiter: "\t" })
```

---

### `parsers.XLSX(filePath)`

Parses Excel files.

**Returns:**
```typescript
{
    [sheetName: string]: Array<Record<string, any>>
}
```

**Example:**
```javascript
const sheets = await parsers.XLSX(env.files[0])
defData("EXCEL_DATA", sheets)

// Access specific sheet
const firstSheet = Object.values(sheets)[0]
```

---

### `parsers.DOCX(filePath)`

Parses Word documents.

**Returns:**
```typescript
{
    text: string          // Full text content
}
```

**Example:**
```javascript
const { text } = await parsers.DOCX(env.files[0])
def("DOCUMENT", text)
```

---

### `parsers.JSON(filePath)`

Parses JSON files.

**Returns:** `any` (parsed JSON)

**Example:**
```javascript
const data = await parsers.JSON(env.files[0])
defData("JSON_DATA", data)
```

---

### `parsers.YAML(filePath)`

Parses YAML files.

**Returns:** `any` (parsed YAML)

**Example:**
```javascript
const config = await parsers.YAML(".github/workflows/ci.yml")
defData("CI_CONFIG", config)
```

---

## Environment (`env`)

Access to runtime environment and variables.

### `env.files`

Array of file paths provided to the script.

**Type:** `string[]`

**Example:**
```javascript
if (!env.files || env.files.length === 0) {
    throw new Error("No files provided")
}

const tsFiles = env.files.filter(f => f.endsWith(".ts"))
```

---

### `env.vars`

User-provided variables.

**Type:** `Record<string, string>`

**Example:**
```javascript
const targetLang = env.vars.TARGET_LANG || "rust"
const severity = env.vars.MIN_SEVERITY || "warning"
```

---

### `env.script`

Current script metadata.

**Type:**
```typescript
{
    title: string
    description: string
    id: string
}
```

---

### `env.generator`

Information about the LLM being used.

**Type:**
```typescript
{
    model: string
    temperature: number
    maxTokens: number
}
```

---

## Host (`host`)

Interface to system operations.

### `host.exec(command)`

Executes shell command.

**Parameters:**
- `command` (string): Shell command to execute

**Returns:**
```typescript
{
    stdout: string
    stderr: string
    exitCode: number
}
```

**Example:**
```javascript
// Git log
const { stdout } = await host.exec("git log --oneline -10")
defData("RECENT_COMMITS", stdout.split('\n'))

// Find files
const { stdout: files } = await host.exec("find . -name '*.ts'")

// Package info
const { stdout: version } = await host.exec("npm --version")
```

---

### `host.readFile(path)`

Reads file content.

**Parameters:**
- `path` (string): File path

**Returns:** `Promise<string>`

**Example:**
```javascript
const content = await host.readFile("package.json")
const pkg = JSON.parse(content)
```

---

### `host.writeFile(path, content)`

Writes file content.

**Parameters:**
- `path` (string): File path
- `content` (string): File content

**Returns:** `Promise<void>`

**Example:**
```javascript
await host.writeFile("output.json", JSON.stringify(data, null, 2))
```

---

## System Prompts

Built-in system prompts that can be included in `script()` configuration.

### Available System Prompts

- `system.annotations` - Use structured annotation format
- `system.safety` - Safety and ethical guidelines
- `system.python` - Python programming expert
- `system.typescript` - TypeScript programming expert
- `system.javascript` - JavaScript programming expert
- `system.files` - File operation guidelines
- `system.diagram` - Diagram generation (Mermaid, etc.)
- `system.math` - Mathematical reasoning
- `system.explanations` - Clear explanations

**Example:**
```javascript
script({
    system: [
        "system.annotations",
        "system.typescript",
        "system.safety"
    ]
})
```

---

## JSON Schema Types

Common JSON Schema patterns for `defSchema()`.

### String
```javascript
{ type: "string" }
{ type: "string", minLength: 1, maxLength: 100 }
{ type: "string", pattern: "^[A-Z]" }
{ type: "string", format: "email" }  // email, uri, date-time
{ type: "string", enum: ["small", "medium", "large"] }
```

### Number
```javascript
{ type: "number" }
{ type: "number", minimum: 0, maximum: 100 }
{ type: "integer" }
{ type: "integer", multipleOf: 5 }
```

### Boolean
```javascript
{ type: "boolean" }
```

### Array
```javascript
{ type: "array", items: { type: "string" } }
{ type: "array", items: { type: "number" }, minItems: 1, maxItems: 10 }
{ type: "array", items: { ... }, uniqueItems: true }
```

### Object
```javascript
{
    type: "object",
    properties: {
        name: { type: "string" },
        age: { type: "number" }
    },
    required: ["name"]
}
```

### Complex Types
```javascript
{
    oneOf: [
        { type: "string" },
        { type: "number" }
    ]
}

{
    anyOf: [
        { type: "string", format: "email" },
        { type: "string", format: "uri" }
    ]
}

{
    allOf: [
        { type: "object", properties: { id: { type: "string" } } },
        { type: "object", properties: { name: { type: "string" } } }
    ]
}
```

---

## Best Practices

### 1. Token Management
```javascript
// ❌ May exceed token limits
def("LOGS", env.files)

// ✅ Controlled token usage
def("LOGS", env.files, {
    maxTokens: 2000,
    sliceHead: 500,
    sliceTail: 500
})
```

### 2. Schema Validation
```javascript
// ❌ No structure
$`Extract data from the file`

// ✅ Structured output
const data = defSchema("DATA", { ... })
$`Extract data using ${data} schema`
```

### 3. Error Handling
```javascript
// ✅ Validate inputs
if (!env.files || env.files.length === 0) {
    throw new Error("No files provided")
}

const validFiles = env.files.filter(f => f.endsWith(".ts"))
if (validFiles.length === 0) {
    throw new Error("No TypeScript files found")
}
```

### 4. Clear Prompts
```javascript
// ❌ Vague
$`Analyze the code`

// ✅ Specific
$`
Analyze CODE for:
1. Type safety issues
2. Unused variables
3. Missing error handling

Provide specific line numbers and fix suggestions.
`
```

---

This API reference covers all major GenAIScript functions and patterns. For more examples, see `examples.md`.
