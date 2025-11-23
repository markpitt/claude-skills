# GenAIScript Examples

This document provides practical examples of GenAIScript usage for common scenarios.

## Table of Contents

1. [Code Quality](#code-quality)
2. [Documentation](#documentation)
3. [Testing](#testing)
4. [Data Processing](#data-processing)
5. [File Operations](#file-operations)
6. [Advanced Workflows](#advanced-workflows)

## Code Quality

### ESLint Rule Generator

```javascript
script({
    title: "ESLint Rule Generator",
    description: "Generates custom ESLint rules from code patterns",
    model: "openai:gpt-4"
})

def("CODE", env.files, {
    endsWith: [".ts", ".js"],
    lineNumbers: true
})

const rule = defSchema("ESLINT_RULE", {
    type: "object",
    properties: {
        name: { type: "string" },
        meta: {
            type: "object",
            properties: {
                type: { type: "string" },
                docs: {
                    type: "object",
                    properties: {
                        description: { type: "string" },
                        category: { type: "string" }
                    }
                }
            }
        },
        implementation: { type: "string" }
    }
})

defFileOutput("*.eslint.js", "Generated ESLint rules")

$`
Analyze CODE for repeated patterns that could be enforced with ESLint rules.
Generate custom ESLint rules using ${rule} schema.
Focus on:
- Security issues (XSS, injection)
- Performance anti-patterns
- Project-specific conventions
`
```

### Code Complexity Analyzer

```javascript
script({
    title: "Complexity Analyzer",
    description: "Analyzes code complexity metrics",
    model: "openai:gpt-4"
})

def("SOURCE", env.files, { endsWith: [".ts", ".js"], lineNumbers: true })

const metrics = defSchema("COMPLEXITY_METRICS", {
    type: "object",
    properties: {
        files: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    path: { type: "string" },
                    functions: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                line: { type: "number" },
                                cyclomaticComplexity: { type: "number" },
                                cognitiveComplexity: { type: "number" },
                                linesOfCode: { type: "number" },
                                suggestions: {
                                    type: "array",
                                    items: { type: "string" }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
})

defFileOutput("complexity-report.json", "Complexity analysis results")

$`
Analyze SOURCE and calculate complexity metrics using ${metrics} schema.

For each function, determine:
1. Cyclomatic complexity (decision points)
2. Cognitive complexity (difficulty to understand)
3. Lines of code
4. Refactoring suggestions if complexity is high

Flag functions with:
- Cyclomatic complexity > 10
- Cognitive complexity > 15
- LOC > 50
`
```

### Security Audit

```javascript
script({
    title: "Security Auditor",
    description: "Performs security audit on codebase",
    model: "openai:gpt-4"
})

def("CODE", env.files, {
    endsWith: [".ts", ".js", ".tsx", ".jsx"],
    lineNumbers: true
})

const vulnerabilities = defSchema("VULNERABILITIES", {
    type: "object",
    properties: {
        critical: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    type: { type: "string" },
                    file: { type: "string" },
                    line: { type: "number" },
                    description: { type: "string" },
                    exploit: { type: "string" },
                    fix: { type: "string" }
                }
            }
        },
        high: { type: "array", items: { type: "object" } },
        medium: { type: "array", items: { type: "object" } },
        low: { type: "array", items: { type: "object" } }
    }
})

$`
Audit CODE for security vulnerabilities using ${vulnerabilities} schema.

Check for:
- SQL injection (parameterized queries)
- XSS (input sanitization)
- CSRF (token validation)
- Authentication bypass
- Insecure deserialization
- Path traversal
- Command injection
- Hardcoded secrets
- Weak crypto
- SSRF

For each finding, provide:
1. Vulnerability type
2. Exact location (file:line)
3. How it can be exploited
4. Specific fix with code example
`
```

## Documentation

### API Documentation Generator

```javascript
script({
    title: "API Doc Generator",
    description: "Generates OpenAPI/Swagger docs from code",
    model: "openai:gpt-4"
})

def("API_ROUTES", env.files, {
    endsWith: [".ts", ".js"],
    glob: "**/routes/**"
})

defFileOutput("openapi.yaml", "OpenAPI specification")
defFileOutput("api-docs.md", "Human-readable API documentation")

$`
Analyze API_ROUTES and generate:

1. OpenAPI 3.0 specification (openapi.yaml):
   - All endpoints with paths
   - HTTP methods
   - Request parameters
   - Request body schemas
   - Response schemas
   - Authentication requirements

2. Markdown documentation (api-docs.md):
   - Endpoint descriptions
   - Usage examples with curl
   - Response examples
   - Error codes
`
```

### Changelog Generator

```javascript
script({
    title: "Changelog Generator",
    description: "Generates changelog from git commits",
    model: "openai:gpt-4"
})

// Get git log
const gitLog = await host.exec("git log --oneline --since='1 month ago'")
defData("COMMITS", gitLog.stdout)

const changelog = defSchema("CHANGELOG", {
    type: "object",
    properties: {
        version: { type: "string" },
        date: { type: "string" },
        sections: {
            type: "object",
            properties: {
                breaking: { type: "array", items: { type: "string" } },
                features: { type: "array", items: { type: "string" } },
                fixes: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } },
                documentation: { type: "array", items: { type: "string" } }
            }
        }
    }
})

defFileOutput("CHANGELOG.md", "Generated changelog")

$`
Generate a changelog from COMMITS using ${changelog} schema.

Categorize commits into:
- 💥 Breaking Changes
- ✨ Features
- 🐛 Bug Fixes
- ⚡ Improvements
- 📝 Documentation

Format as conventional changelog with dates and versions.
`
```

### Tutorial Generator

```javascript
script({
    title: "Tutorial Generator",
    description: "Creates step-by-step tutorials from code",
    model: "openai:gpt-4-turbo"
})

def("CODE", env.files)

defFileOutput("tutorial.md", "Step-by-step tutorial")
defFileOutput("exercises.md", "Practice exercises")

$`
Create a beginner-friendly tutorial from CODE:

1. Introduction
   - What we're building
   - Prerequisites
   - Learning objectives

2. Step-by-step guide (10-15 steps)
   - Each step builds on previous
   - Include code snippets
   - Explain key concepts
   - Show expected output

3. Practice exercises
   - 5 exercises of increasing difficulty
   - Solutions provided

4. Next steps
   - Advanced topics
   - Related resources
`
```

## Testing

### Integration Test Generator

```javascript
script({
    title: "Integration Test Generator",
    description: "Generates integration tests for APIs",
    model: "openai:gpt-4"
})

def("API", env.files, {
    endsWith: [".ts", ".js"],
    glob: "**/api/**"
})

defFileOutput("*.integration.test.ts", "Integration tests")

$`
Generate comprehensive integration tests for API endpoints.

For each endpoint, create tests for:

1. Happy path
   - Valid request
   - Expected response
   - Status codes

2. Edge cases
   - Empty data
   - Maximum values
   - Minimum values

3. Error scenarios
   - Invalid input
   - Missing required fields
   - Authentication failures
   - Rate limiting

4. Data validation
   - Schema validation
   - Business rule validation

Use Jest/Supertest framework.
Include setup/teardown for test data.
`
```

### E2E Test Generator

```javascript
script({
    title: "E2E Test Generator",
    description: "Generates Playwright/Cypress E2E tests",
    model: "openai:gpt-4"
})

def("COMPONENTS", env.files, {
    endsWith: [".tsx", ".jsx"]
})

defFileOutput("*.e2e.spec.ts", "E2E test specs")

$`
Generate Playwright E2E tests for COMPONENTS.

For each user flow:

1. Test setup
   - Navigation
   - Authentication
   - Initial state

2. User interactions
   - Click elements
   - Fill forms
   - Submit data

3. Assertions
   - Element visibility
   - Content validation
   - URL changes
   - Network requests

4. Cleanup
   - Reset state
   - Logout
   - Clear data

Use page object pattern.
Include accessibility checks.
Add visual regression tests.
`
```

### Test Data Generator

```javascript
script({
    title: "Test Data Generator",
    description: "Generates realistic test data",
    model: "openai:gpt-4"
})

def("SCHEMA", env.files, { glob: "**/schema/**" })

const testData = defSchema("TEST_DATA", {
    type: "object",
    properties: {
        users: { type: "array", items: { type: "object" } },
        products: { type: "array", items: { type: "object" } },
        orders: { type: "array", items: { type: "object" } }
    }
})

defFileOutput("test-data.json", "Generated test data")

$`
Generate realistic test data based on SCHEMA using ${testData} schema.

Requirements:
- 50 users with varied demographics
- 100 products across categories
- 200 orders with realistic patterns

Ensure:
- Data relationships are valid
- Dates are realistic and sequential
- Names and emails are diverse
- Prices and quantities make sense
- Include edge cases (empty strings, max values)
`
```

## Data Processing

### CSV to JSON Converter

```javascript
script({
    title: "CSV to JSON",
    description: "Converts CSV files to structured JSON",
    model: "openai:gpt-4"
})

const csvData = await parsers.CSV(env.files[0])
defData("CSV", csvData, { sliceHead: 10 })

defFileOutput("output.json", "Converted JSON data")

$`
Convert CSV data to well-structured JSON.

Requirements:
1. Infer data types (numbers, dates, booleans)
2. Handle missing values appropriately
3. Group related fields into nested objects
4. Convert date strings to ISO format
5. Normalize field names (camelCase)
6. Remove duplicate entries
7. Validate data consistency

Output should be an array of typed objects.
`
```

### PDF Data Extractor

```javascript
script({
    title: "PDF Data Extractor",
    description: "Extracts structured data from PDF invoices",
    model: "openai:gpt-4-vision"
})

const { pages } = await parsers.PDF(env.files[0])
defData("PDF_PAGES", pages)

const invoice = defSchema("INVOICE", {
    type: "object",
    properties: {
        invoiceNumber: { type: "string" },
        date: { type: "string" },
        vendor: {
            type: "object",
            properties: {
                name: { type: "string" },
                address: { type: "string" },
                taxId: { type: "string" }
            }
        },
        items: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    description: { type: "string" },
                    quantity: { type: "number" },
                    unitPrice: { type: "number" },
                    total: { type: "number" }
                }
            }
        },
        subtotal: { type: "number" },
        tax: { type: "number" },
        total: { type: "number" }
    }
})

defFileOutput("invoice-data.json", "Extracted invoice data")

$`
Extract invoice data from PDF_PAGES using ${invoice} schema.

Parse carefully:
- Invoice number and date
- Vendor information
- Line items with quantities and prices
- Calculate totals and verify math
- Extract tax information
`
```

### Log Analyzer

```javascript
script({
    title: "Log Analyzer",
    description: "Analyzes application logs for issues",
    model: "openai:gpt-4"
})

def("LOGS", env.files, {
    endsWith: ".log",
    sliceHead: 500,
    sliceTail: 500
})

const analysis = defSchema("LOG_ANALYSIS", {
    type: "object",
    properties: {
        summary: { type: "string" },
        errors: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    timestamp: { type: "string" },
                    level: { type: "string" },
                    message: { type: "string" },
                    stackTrace: { type: "string" },
                    frequency: { type: "number" }
                }
            }
        },
        warnings: { type: "array", items: { type: "object" } },
        patterns: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    pattern: { type: "string" },
                    occurrences: { type: "number" },
                    significance: { type: "string" }
                }
            }
        },
        recommendations: {
            type: "array",
            items: { type: "string" }
        }
    }
})

defFileOutput("log-analysis.md", "Log analysis report")

$`
Analyze LOGS using ${analysis} schema.

Focus on:
1. Error patterns and frequency
2. Warning trends
3. Performance issues (slow queries, timeouts)
4. Security events (failed auth, suspicious activity)
5. Resource usage patterns

Provide actionable recommendations.
`
```

## File Operations

### Code Migrator

```javascript
script({
    title: "Framework Migrator",
    description: "Migrates code to new framework version",
    model: "openai:gpt-4-turbo"
})

def("OLD_CODE", env.files, { lineNumbers: true })

defFileOutput("*.migrated.ts", "Migrated files")
defFileOutput("MIGRATION_NOTES.md", "Migration guide")

$`
Migrate OLD_CODE from React 17 to React 18.

Changes needed:
1. Replace ReactDOM.render with createRoot
2. Update lifecycle methods to hooks
3. Fix automatic batching changes
4. Update TypeScript types
5. Remove unsafe lifecycle methods
6. Update third-party dependencies

For each file:
- Show before/after diff
- Explain why changes are needed
- Note breaking changes

Generate MIGRATION_NOTES.md with:
- Summary of changes
- Manual steps required
- Testing checklist
`
```

### File Organizer

```javascript
script({
    title: "File Organizer",
    description: "Organizes files into logical structure",
    model: "openai:gpt-4"
})

// Get file listing
const files = await host.exec("find . -type f -name '*.ts' -o -name '*.tsx'")
defData("FILES", files.stdout.split('\n'))

const structure = defSchema("FILE_STRUCTURE", {
    type: "object",
    properties: {
        moves: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    from: { type: "string" },
                    to: { type: "string" },
                    reason: { type: "string" }
                }
            }
        },
        newDirectories: {
            type: "array",
            items: { type: "string" }
        }
    }
})

defFileOutput("reorganize.sh", "Shell script to reorganize files")

$`
Analyze FILES and propose better organization using ${structure} schema.

Principles:
- Feature-based structure over type-based
- Co-locate related files
- Separate presentation from logic
- Group by domain/module
- Keep flat hierarchy when possible

Generate shell script to:
1. Create new directories
2. Move files to new locations
3. Update imports
`
```

## Advanced Workflows

### Multi-Language Translation

```javascript
script({
    title: "Code Translator",
    description: "Translates code between programming languages",
    model: "openai:gpt-4-turbo"
})

def("SOURCE", env.files, { lineNumbers: true })

const targetLang = env.vars.TARGET_LANG || "rust"

defFileOutput(`*.${targetLang}`, `Translated ${targetLang} files`)
defFileOutput("TRANSLATION_NOTES.md", "Translation notes")

$`
Translate SOURCE from TypeScript to ${targetLang}.

Preserve:
- Logic and algorithms
- Error handling
- Comments and documentation
- Code structure

Adapt to ${targetLang} idioms:
- Use language conventions
- Leverage language features
- Apply best practices
- Optimize for performance

Include translation notes explaining:
- Major differences
- Idiomatic changes
- Performance implications
- Testing recommendations
`
```

### Automated Refactoring

```javascript
script({
    title: "Auto Refactor",
    description: "Suggests and implements refactorings",
    model: "openai:gpt-4"
})

def("CODE", env.files, { lineNumbers: true })

const refactorings = defSchema("REFACTORINGS", {
    type: "array",
    items: {
        type: "object",
        properties: {
            type: {
                type: "string",
                enum: [
                    "extract-function",
                    "extract-variable",
                    "inline-function",
                    "rename",
                    "move-to-module",
                    "split-class",
                    "remove-dead-code"
                ]
            },
            location: { type: "string" },
            description: { type: "string" },
            before: { type: "string" },
            after: { type: "string" },
            impact: { type: "string" }
        }
    }
})

defFileOutput("refactored/*", "Refactored files")
defFileOutput("REFACTORING_PLAN.md", "Refactoring plan")

$`
Analyze CODE and suggest refactorings using ${refactorings} schema.

Look for:
1. Long functions (>50 lines) → extract functions
2. Duplicated code → extract common logic
3. Complex conditionals → extract/simplify
4. Large classes → split responsibilities
5. Dead code → remove
6. Magic numbers → extract constants
7. Nested callbacks → async/await

Prioritize by:
- Impact on readability
- Risk level (low risk first)
- Dependencies

Implement top 5 refactorings.
`
```

### CI/CD Generator

```javascript
script({
    title: "CI/CD Generator",
    description: "Generates CI/CD pipeline configuration",
    model: "openai:gpt-4"
})

def("PACKAGE_JSON", env.files, { glob: "package.json" })
def("SOURCE", env.files, { glob: "src/**" })

defFileOutput(".github/workflows/ci.yml", "GitHub Actions workflow")
defFileOutput(".github/workflows/deploy.yml", "Deployment workflow")
defFileOutput("Dockerfile", "Container configuration")

$`
Generate CI/CD pipeline based on project structure.

CI Workflow (ci.yml):
1. Trigger: PR, push to main
2. Steps:
   - Checkout code
   - Setup Node.js
   - Install dependencies
   - Run linter
   - Run type check
   - Run tests with coverage
   - Build project
   - Upload artifacts

Deploy Workflow (deploy.yml):
1. Trigger: push to main (after CI passes)
2. Steps:
   - Build Docker image
   - Push to registry
   - Deploy to staging
   - Run smoke tests
   - Deploy to production (manual approval)

Include:
- Caching for dependencies
- Parallel jobs where possible
- Proper secrets management
- Status badges
`
```

These examples demonstrate the versatility and power of GenAIScript for automating various development tasks.
