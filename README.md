# Claude Skills Repository

A centralized repository for custom Claude Skills that can be imported into Claude Code or Claude Desktop.

## What are Claude Skills?

Claude Skills are modular capabilities that extend Claude's functionality through organized directories containing instructions, scripts, and resources. They teach Claude how to complete specific repeatable tasks like creating documents with brand guidelines, analyzing data using organizational workflows, or automating personal tasks.

## Quick Start

### Using Skills with Claude Code (CLI)

**For project-level access:**
```bash
cp -r skills/skill-name .claude/skills/
```

**For personal/global access:**
```bash
cp -r skills/skill-name ~/.claude/skills/
```

Skills are automatically discovered on the next session.

### Using Skills with Claude Desktop

1. Create a `.zip` file of the skill directory:
   ```bash
   cd skills/skill-name
   zip -r skill-name.zip .
   ```

2. Open Claude Desktop → Settings → Capabilities → Skills

3. Click "Upload skill" and select the .zip file

## Available Skills

### azure-swa

Comprehensive expertise for Azure Static Web Apps including architecture, configuration, API integration with Azure Functions, authentication, routing, deployment, and CI/CD.

**Use when:**
- Building new Azure Static Web Apps
- Configuring SWA with React, Angular, Vue, Blazor, or other frameworks
- Integrating Azure Functions as serverless APIs
- Setting up authentication and authorization
- Configuring custom domains and SSL
- Troubleshooting deployment or runtime issues
- Implementing CI/CD with GitHub Actions

**Location:** `skills/azure-swa/`

**Features:**
- Complete architecture guidance
- Configuration examples (staticwebapp.config.json)
- API integration patterns
- Authentication and authorization setup
- Deployment and CI/CD workflows
- Security and performance best practices
- Comprehensive troubleshooting guide

### blazor-blog-feature

Adds a complete blog feature to an existing Blazor WebAssembly Static Web App with Azure Functions backend and Azure File Share for markdown storage.

**Use when:**
- Implementing blog functionality in .NET Blazor WASM projects
- Integrating Azure Storage for content management
- Building content-driven Blazor applications

**Location:** `skills/blazor-blog-feature/`

### freeagent-api

Interacts with the FreeAgent accounting API to manage invoices, contacts, projects, expenses, timeslips, and other financial data.

**Use when:**
- Building integrations with FreeAgent accounting system
- Automating financial workflows
- Retrieving or analyzing FreeAgent data

**Location:** `skills/freeagent-api/`

### markdown-formatter

Formats markdown files according to best practices and common style guidelines.

**Use when:**
- Cleaning up existing markdown documentation
- Standardizing README files across projects
- Ensuring consistent formatting in documentation
- Preparing markdown for publication

**Location:** `skills/markdown-formatter/`

**Features:**
- Standardizes headers, lists, and code blocks
- Fixes spacing and indentation
- Ensures consistent emphasis markers
- Validates link text and alt text
- Includes validation script

### microsoft-graph

Comprehensive skill for working with Microsoft Graph API across all services including users, groups, mail, calendar, files (OneDrive/SharePoint), Teams, security, applications, and more.

**Use when:**
- Implementing Microsoft Graph API integrations
- Querying Microsoft 365 data
- Building applications that interact with Azure AD and Microsoft services

**Location:** `skills/microsoft-graph/`

## Repository Structure

```
claude-skills/
├── README.md              # This file - getting started guide
├── CLAUDE.md              # Repository documentation for Claude
├── skills/                # All skills stored here
│   └── skill-name/       # Individual skill directory
│       ├── SKILL.md      # Required: skill entry point
│       ├── resources/    # Optional: supporting files
│       ├── templates/    # Optional: forms or structured prompts
│       └── scripts/      # Optional: utility scripts
└── .claude/              # Claude Code configuration
    └── hooks/            # Repository hooks
```

## Creating a New Skill

### 1. Create Directory Structure

```bash
mkdir -p skills/my-skill/resources
mkdir -p skills/my-skill/scripts
touch skills/my-skill/SKILL.md
```

### 2. Write SKILL.md

Every skill must have a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: my-skill
description: Brief description of what the skill does and when to use it
allowed-tools: Read, Edit, Bash  # Optional: restrict tools
version: 1.0.0
---

# My Skill

Main skill instructions here...

## When to Use This Skill

- Describe use cases

## How to Use This Skill

1. Step-by-step instructions
2. Reference resources as needed

## Guidelines

- Key points
- Best practices
```

### 3. Add Supporting Files (Optional)

- `resources/style-guide.md` - Detailed reference documentation
- `resources/examples.md` - Before/after examples
- `resources/checklist.txt` - Structured checklists
- `scripts/helper.sh` - Executable utilities

### 4. Test Locally

```bash
# Copy to personal skills directory
cp -r skills/my-skill ~/.claude/skills/

# Test with Claude Code
# Request a task that should trigger the skill
```

### 5. Commit and Share

```bash
git add skills/my-skill/
git commit -m "Add my-skill for [purpose]"
git push
```

## Skill Best Practices

### Structure
- Keep `SKILL.md` under 500 lines
- Use progressive disclosure (reference additional files)
- Include clear examples
- Provide structured checklists for complex workflows

### Metadata
- Name: lowercase, hyphenated, max 64 characters
- Description: third-person, clear purpose, max 1024 characters
- Version: semantic versioning (1.0.0)

### Content
- Write in third person for descriptions
- Use second person for instructions
- Be specific and actionable
- Include examples of expected inputs/outputs

### Performance
- Only name/description (~100 tokens) is pre-loaded
- Full SKILL.md loaded when Claude determines relevance
- Additional resources loaded only when referenced
- Use scripts for computationally-intensive operations

### Testing
- Test with representative tasks
- Verify skill triggers appropriately
- Check that referenced files are accessible
- Validate scripts execute correctly

## Tool Restrictions

You can restrict which tools Claude can use within a skill by setting `allowed-tools` in the frontmatter:

```yaml
---
name: safe-reader
description: Read files without modification capabilities
allowed-tools: Read, Grep, Glob
---
```

Common tool combinations:
- Read-only: `Read, Grep, Glob`
- File editing: `Read, Edit, Write`
- Full access: `Read, Edit, Write, Bash, Grep, Glob`

## Advanced Features

### Progressive Disclosure

Structure skills in layers:
1. **Metadata**: Name and description (always loaded)
2. **Core**: Main SKILL.md body (loaded when relevant)
3. **Details**: Referenced files (loaded only when needed)

### Executable Scripts

Include scripts that Claude can run:
- Validation scripts (check before processing)
- Helper utilities (complex operations)
- Test scripts (verify correctness)

Example:
```markdown
## Validation

Before formatting, run the validation script:

```bash
./skills/markdown-formatter/scripts/validate-markdown.sh file.md
```
```

### Hooks Integration

Skills can work with Claude Code hooks:
- **SessionStart**: Load skill context on startup
- **PreToolUse**: Validate operations before execution
- **Stop**: Ensure work completeness

## Contributing

1. Fork this repository
2. Create your skill in `skills/your-skill-name/`
3. Test thoroughly
4. Submit a pull request with:
   - Clear description of skill purpose
   - Example use cases
   - Testing results

## Examples and Templates

### Minimal Skill

```markdown
---
name: simple-skill
description: Does one specific thing well
version: 1.0.0
---

# Simple Skill

This skill helps you do X.

## Instructions

1. Do this
2. Then this
3. Finally this

## Output

Provide results in this format:
- Summary
- Details
```

### Complex Skill

See `skills/markdown-formatter/` for an example of a comprehensive skill with:
- Detailed SKILL.md
- Multiple resource files
- Executable validation script
- Structured checklists

## Troubleshooting

### Skill Not Loading
- Verify `SKILL.md` exists with valid frontmatter
- Check YAML formatting (use `---` delimiters)
- Ensure `name` matches directory name
- Confirm proper file permissions

### Skill Not Triggering
- Make description more specific about when to use
- Test with explicit mention of skill name
- Check that task matches described use cases

### Performance Issues
- Reduce SKILL.md size (keep under 500 lines)
- Move detailed content to referenced files
- Use scripts for heavy operations

## Resources

- [Claude Skills Documentation](https://code.claude.com/docs/en/skills)
- [Skill Best Practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices)
- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [Awesome Claude Skills](https://github.com/travisvn/awesome-claude-skills)
- [CLAUDE.md](./CLAUDE.md) - Detailed repository documentation

## License

This repository is provided as-is for organizing and sharing Claude Skills. Individual skills may have their own licenses.

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review [CLAUDE.md](./CLAUDE.md) for detailed documentation
3. Consult [official Claude documentation](https://code.claude.com/docs/)
4. Open an issue in this repository
