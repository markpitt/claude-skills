# GenAIScript Patterns and Best Practices

Advanced patterns, recipes, and best practices for GenAIScript development.

## Table of Contents

1. [Design Patterns](#design-patterns)
2. [Performance Optimization](#performance-optimization)
3. [Error Handling](#error-handling)
4. [Testing Strategies](#testing-strategies)
5. [Modular Architecture](#modular-architecture)
6. [Production Patterns](#production-patterns)

## Design Patterns

### 1. Chain of Responsibility

Execute multiple LLM calls in sequence, each building on the previous result.

```javascript
script({
    title: "Multi-Step Analysis",
    description: "Performs analysis in multiple stages"
})

def("CODE", env.files)

// Step 1: Initial analysis
$`Analyze CODE and identify all functions.`
const functions = await generate()

// Step 2: Detailed analysis
defData("FUNCTIONS", functions)
$`For each function in FUNCTIONS, analyze complexity.`
const complexity = await generate()

// Step 3: Recommendations
defData("COMPLEXITY", complexity)
$`Based on COMPLEXITY, suggest refactorings.`
const recommendations = await generate()

// Step 4: Implementation
defData("RECOMMENDATIONS", recommendations)
$`Implement the top 3 recommendations from RECOMMENDATIONS.`
```

**When to use:** Complex tasks that benefit from breaking down into clear stages.

---

### 2. Template Method

Define a reusable script structure with customizable steps.

```javascript
// Base template
async function analyzeAndFix(files, analysisPrompt, fixPrompt) {
    def("FILES", files)

    // Analysis phase (template method)
    $`${analysisPrompt}`
    const issues = await generate()

    if (issues.length === 0) {
        return "No issues found"
    }

    // Fix phase (template method)
    defData("ISSUES", issues)
    $`${fixPrompt}`
    const fixes = await generate()

    return fixes
}

// Concrete implementation 1: Security
script({ title: "Security Fix" })
await analyzeAndFix(
    env.files,
    "Find security vulnerabilities in FILES",
    "Fix security ISSUES with code examples"
)

// Concrete implementation 2: Performance
script({ title: "Performance Fix" })
await analyzeAndFix(
    env.files,
    "Find performance issues in FILES",
    "Optimize performance ISSUES with implementations"
)
```

---

### 3. Strategy Pattern

Select different strategies based on context.

```javascript
const strategies = {
    async simple(code) {
        def("CODE", code)
        $`Provide a brief summary of CODE.`
        return await generate()
    },

    async detailed(code) {
        def("CODE", code, { lineNumbers: true })
        const analysis = defSchema("ANALYSIS", {
            type: "object",
            properties: {
                summary: { type: "string" },
                functions: { type: "array" },
                dependencies: { type: "array" },
                issues: { type: "array" }
            }
        })
        $`Provide detailed analysis using ${analysis} schema.`
        return await generate()
    },

    async comprehensive(code) {
        // Multi-step comprehensive analysis
        def("CODE", code, { lineNumbers: true })

        $`Complete analysis with metrics, issues, and suggestions.`
        const result = await generate()

        defData("INITIAL", result)
        $`Based on INITIAL, provide improvement roadmap.`
        const roadmap = await generate()

        return { result, roadmap }
    }
}

// Select strategy based on file size or user preference
const strategy = env.vars.MODE || "simple"
const result = await strategies[strategy](env.files)
```

---

### 4. Observer Pattern

Monitor and react to changes in generated content.

```javascript
let iteration = 0
let previousResult = null
const MAX_ITERATIONS = 5

async function iterativeImprovement(prompt) {
    while (iteration < MAX_ITERATIONS) {
        if (previousResult) {
            defData("PREVIOUS", previousResult)
            $`
            Improve upon PREVIOUS iteration.
            ${prompt}
            `
        } else {
            $`${prompt}`
        }

        const result = await generate()

        // Check if result meets quality criteria
        $`Rate the quality of this result on a scale of 1-10: ${result}`
        const quality = await generate()

        if (parseInt(quality) >= 8) {
            return result  // Good enough
        }

        previousResult = result
        iteration++
    }

    return previousResult
}

const finalResult = await iterativeImprovement(
    "Write a comprehensive test suite for this function."
)
```

---

### 5. Factory Pattern

Create different types of outputs based on input.

```javascript
async function createDocumentation(type, files) {
    const factories = {
        api: async () => {
            defFileOutput("API.md", "API documentation")
            $`Generate API documentation with endpoints, parameters, responses.`
        },

        tutorial: async () => {
            defFileOutput("TUTORIAL.md", "Step-by-step tutorial")
            $`Create beginner-friendly tutorial with examples.`
        },

        reference: async () => {
            defFileOutput("REFERENCE.md", "Technical reference")
            $`Generate complete technical reference with all functions.`
        },

        quickstart: async () => {
            defFileOutput("QUICKSTART.md", "Quick start guide")
            $`Create 5-minute quick start guide.`
        }
    }

    def("SOURCE", files)
    await factories[type]()
    return await generate()
}

const docType = env.vars.DOC_TYPE || "api"
await createDocumentation(docType, env.files)
```

---

## Performance Optimization

### 1. Token Budgeting

Carefully manage token usage to avoid limits.

```javascript
// Calculate token budget
const TOTAL_BUDGET = 8000
const PROMPT_TOKENS = 1000
const RESPONSE_TOKENS = 2000
const AVAILABLE_FOR_CONTEXT = TOTAL_BUDGET - PROMPT_TOKENS - RESPONSE_TOKENS

// Distribute context tokens
const filesCount = env.files.length
const tokensPerFile = Math.floor(AVAILABLE_FOR_CONTEXT / filesCount)

env.files.forEach((file, index) => {
    def(`FILE_${index}`, file, {
        maxTokens: tokensPerFile,
        sliceHead: Math.floor(tokensPerFile * 0.6),
        sliceTail: Math.floor(tokensPerFile * 0.4)
    })
})
```

---

### 2. Caching Strategy

Use caching for repeated content.

```javascript
script({
    cache: true,
    cacheName: "project-analysis"
})

// Cache expensive operations
def("ENTIRE_CODEBASE", env.files, {
    glob: "src/**/*.ts"
})

// This will be cached
$`Analyze the overall architecture of ENTIRE_CODEBASE.`
const architecture = await generate()

// Subsequent runs will use cached result
// Only re-run if files change
```

---

### 3. Parallel Processing

When possible, process independent items in parallel.

```javascript
// Sequential (slow)
for (const file of env.files) {
    def("FILE", file)
    $`Analyze FILE`
    await generate()
}

// Parallel (faster) - note: may require multiple script runs
// Split files into batches
const BATCH_SIZE = 5
const batches = []
for (let i = 0; i < env.files.length; i += BATCH_SIZE) {
    batches.push(env.files.slice(i, i + BATCH_SIZE))
}

// Process current batch
const batchIndex = parseInt(env.vars.BATCH || "0")
const currentBatch = batches[batchIndex]

def("BATCH", currentBatch)
$`Analyze all files in BATCH`
const results = await generate()
```

---

### 4. Selective Processing

Only process what's necessary.

```javascript
// Filter files before processing
const relevantFiles = env.files.filter(file => {
    // Only process changed files in git
    const status = await host.exec(`git status --short ${file}`)
    return status.stdout.trim().length > 0
})

// Only include modified functions
def("CODE", env.files, { lineNumbers: true })
$`
Identify which functions were modified in the last git commit.
Only analyze those specific functions.
`

// Progressive detail
if (env.vars.QUICK) {
    $`Quick analysis: just list issues`
} else {
    const issues = defSchema("ISSUES", { ... })
    $`Detailed analysis using ${issues} schema`
}
```

---

## Error Handling

### 1. Input Validation

Validate inputs before processing.

```javascript
// File validation
if (!env.files || env.files.length === 0) {
    throw new Error("No files provided to script")
}

const validExtensions = [".ts", ".tsx", ".js", ".jsx"]
const validFiles = env.files.filter(f =>
    validExtensions.some(ext => f.endsWith(ext))
)

if (validFiles.length === 0) {
    throw new Error(
        `No valid files found. Expected: ${validExtensions.join(", ")}`
    )
}

// Parameter validation
const mode = env.vars.MODE
if (mode && !["simple", "detailed", "comprehensive"].includes(mode)) {
    throw new Error(
        `Invalid MODE: ${mode}. Expected: simple, detailed, or comprehensive`
    )
}

// File size validation
for (const file of env.files) {
    const stat = await host.exec(`wc -l ${file}`)
    const lines = parseInt(stat.stdout.split(" ")[0])

    if (lines > 10000) {
        console.warn(`Warning: ${file} has ${lines} lines, processing may be slow`)
    }
}
```

---

### 2. Graceful Degradation

Handle failures without crashing.

```javascript
async function tryParse(file, parser) {
    try {
        return await parser(file)
    } catch (error) {
        console.error(`Failed to parse ${file}: ${error.message}`)
        return null
    }
}

// Process all files, skip failures
const results = []
for (const file of env.files) {
    let data

    if (file.endsWith(".csv")) {
        data = await tryParse(file, parsers.CSV)
    } else if (file.endsWith(".pdf")) {
        data = await tryParse(file, parsers.PDF)
    } else if (file.endsWith(".xlsx")) {
        data = await tryParse(file, parsers.XLSX)
    }

    if (data) {
        results.push({ file, data })
    }
}

if (results.length === 0) {
    throw new Error("All files failed to parse")
}

defData("PARSED", results)
$`Analyze PARSED data (${results.length}/${env.files.length} files succeeded)`
```

---

### 3. Retry Logic

Retry failed operations.

```javascript
async function withRetry(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation()
        } catch (error) {
            if (attempt === maxRetries) {
                throw error
            }
            console.warn(`Attempt ${attempt} failed: ${error.message}. Retrying...`)
            await new Promise(resolve => setTimeout(resolve, delay * attempt))
        }
    }
}

// Use with external APIs
const weatherData = await withRetry(async () => {
    const response = await fetch("https://api.weather.com/...")
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
})
```

---

## Testing Strategies

### 1. Unit Testing Scripts

Test script components in isolation.

```javascript
// script-to-test.genai.mjs
export async function analyzeCode(code) {
    def("CODE", code)
    $`Find all functions in CODE`
    return await generate()
}

// test-script.genai.mjs
script({
    title: "Test Script",
    description: "Tests analyzeCode function"
})

const testCases = [
    {
        input: "function foo() { return 42; }",
        expected: ["foo"]
    },
    {
        input: "const bar = () => {}; function baz() {}",
        expected: ["bar", "baz"]
    }
]

for (const testCase of testCases) {
    const result = await analyzeCode(testCase.input)

    // Validate result
    const foundAll = testCase.expected.every(name =>
        result.includes(name)
    )

    if (!foundAll) {
        throw new Error(`Test failed for: ${testCase.input}`)
    }
}

$`All tests passed!`
```

---

### 2. Snapshot Testing

Compare output against known good results.

```javascript
const snapshot = {
    version: "1.0",
    testCase: "basic-analysis",
    expected: {
        functions: ["main", "helper"],
        issues: ["no-type-annotations"]
    }
}

def("CODE", env.files[0])
const result = defSchema("RESULT", {
    type: "object",
    properties: {
        functions: { type: "array", items: { type: "string" } },
        issues: { type: "array", items: { type: "string" } }
    }
})

$`Analyze CODE using ${result} schema`
const actual = await generate()

// Compare with snapshot
const matches =
    JSON.stringify(actual.functions.sort()) ===
    JSON.stringify(snapshot.expected.functions.sort()) &&
    JSON.stringify(actual.issues.sort()) ===
    JSON.stringify(snapshot.expected.issues.sort())

if (!matches) {
    defFileOutput("snapshot-diff.json", "Snapshot differences")
    await host.writeFile("snapshot-diff.json", JSON.stringify({
        expected: snapshot.expected,
        actual
    }, null, 2))
    throw new Error("Snapshot mismatch. See snapshot-diff.json")
}
```

---

### 3. Integration Testing

Test end-to-end workflows.

```javascript
script({
    title: "Integration Test",
    description: "Tests complete workflow"
})

// Setup test environment
const testFiles = [
    "test/fixtures/sample.ts",
    "test/fixtures/sample.test.ts"
]

// Run analysis
def("CODE", testFiles)
$`Analyze CODE and generate test report`
const report = await generate()

// Verify output files were created
const expectedFiles = [
    "report.md",
    "issues.json",
    "metrics.csv"
]

for (const file of expectedFiles) {
    try {
        await host.readFile(file)
    } catch {
        throw new Error(`Expected output file not created: ${file}`)
    }
}

// Verify content quality
const reportContent = await host.readFile("report.md")
if (!reportContent.includes("# Test Report")) {
    throw new Error("Report missing expected header")
}

$`Integration test passed!`
```

---

## Modular Architecture

### 1. Reusable Functions

Extract common logic into functions.

```javascript
// lib/analysis.genai.mjs
export async function findFunctions(code) {
    def("CODE", code)
    $`List all function names in CODE`
    return await generate()
}

export async function analyzeComplexity(functions) {
    defData("FUNCTIONS", functions)
    $`Calculate cyclomatic complexity for FUNCTIONS`
    return await generate()
}

export async function generateReport(analysis) {
    defData("ANALYSIS", analysis)
    defFileOutput("report.md", "Analysis report")
    $`Create markdown report from ANALYSIS`
    return await generate()
}

// main.genai.mjs
import { findFunctions, analyzeComplexity, generateReport } from "./lib/analysis.genai.mjs"

script({ title: "Code Analysis" })

const functions = await findFunctions(env.files)
const complexity = await analyzeComplexity(functions)
await generateReport({ functions, complexity })
```

---

### 2. Configuration-Driven Scripts

Use configuration files for flexibility.

```javascript
// config.json
{
    "rules": [
        {
            "name": "no-console",
            "severity": "warning",
            "message": "Avoid console statements in production"
        },
        {
            "name": "max-complexity",
            "severity": "error",
            "threshold": 10
        }
    ],
    "ignore": ["*.test.ts", "*.spec.ts"]
}

// script
const config = await parsers.JSON("config.json")
defData("RULES", config.rules)

def("CODE", env.files, {
    glob: "src/**/*.ts",
    exclude: config.ignore
})

$`
Analyze CODE and check for violations of RULES.
Report severity level and suggested fixes.
`
```

---

### 3. Plugin Architecture

Allow extending scripts with plugins.

```javascript
// plugins/security.genai.mjs
export default {
    name: "security",
    async analyze(code) {
        def("CODE", code)
        $`Find security vulnerabilities in CODE`
        return await generate()
    }
}

// plugins/performance.genai.mjs
export default {
    name: "performance",
    async analyze(code) {
        def("CODE", code)
        $`Find performance issues in CODE`
        return await generate()
    }
}

// main.genai.mjs
import securityPlugin from "./plugins/security.genai.mjs"
import performancePlugin from "./plugins/performance.genai.mjs"

const plugins = [securityPlugin, performancePlugin]
const results = {}

for (const plugin of plugins) {
    results[plugin.name] = await plugin.analyze(env.files)
}

defData("RESULTS", results)
$`Summarize all plugin RESULTS into a final report`
```

---

## Production Patterns

### 1. Logging and Debugging

Add comprehensive logging.

```javascript
function log(level, message, data = {}) {
    const timestamp = new Date().toISOString()
    const logEntry = {
        timestamp,
        level,
        message,
        ...data
    }
    console.log(JSON.stringify(logEntry))
}

script({ title: "Production Script" })

log("info", "Script started", {
    files: env.files.length,
    model: env.generator.model
})

try {
    def("CODE", env.files)
    log("info", "Files loaded", { count: env.files.length })

    $`Analyze CODE`
    const result = await generate()

    log("info", "Analysis complete", {
        resultSize: JSON.stringify(result).length
    })

} catch (error) {
    log("error", "Script failed", {
        error: error.message,
        stack: error.stack
    })
    throw error
}

log("info", "Script completed successfully")
```

---

### 2. Metrics Collection

Track performance metrics.

```javascript
const metrics = {
    startTime: Date.now(),
    filesProcessed: 0,
    tokensUsed: 0,
    errors: 0
}

function recordMetric(name, value) {
    metrics[name] = value
}

function recordError(error) {
    metrics.errors++
    log("error", error.message)
}

// Process files
for (const file of env.files) {
    try {
        def("FILE", file)
        $`Analyze FILE`
        await generate()
        metrics.filesProcessed++
    } catch (error) {
        recordError(error)
    }
}

metrics.duration = Date.now() - metrics.startTime
metrics.filesPerSecond = metrics.filesProcessed / (metrics.duration / 1000)

// Output metrics
defFileOutput("metrics.json", "Performance metrics")
await host.writeFile("metrics.json", JSON.stringify(metrics, null, 2))
```

---

### 3. Progressive Enhancement

Start simple, add features incrementally.

```javascript
// Level 1: Basic analysis
async function basicAnalysis(code) {
    def("CODE", code)
    $`Provide a brief summary of CODE`
    return await generate()
}

// Level 2: Add structure
async function structuredAnalysis(code) {
    const result = await basicAnalysis(code)

    const schema = defSchema("STRUCTURED", {
        type: "object",
        properties: {
            summary: { type: "string" },
            keyPoints: { type: "array", items: { type: "string" } }
        }
    })

    defData("BASIC", result)
    $`Convert BASIC to ${schema} format`
    return await generate()
}

// Level 3: Add recommendations
async function comprehensiveAnalysis(code) {
    const structured = await structuredAnalysis(code)

    defData("ANALYSIS", structured)
    $`Based on ANALYSIS, provide actionable recommendations`
    const recommendations = await generate()

    return {
        ...structured,
        recommendations
    }
}

// Use appropriate level
const level = env.vars.LEVEL || "basic"
const analyzers = {
    basic: basicAnalysis,
    structured: structuredAnalysis,
    comprehensive: comprehensiveAnalysis
}

const result = await analyzers[level](env.files)
```

---

These patterns provide a solid foundation for building robust, maintainable GenAIScript applications.
