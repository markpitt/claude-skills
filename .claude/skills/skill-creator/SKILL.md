---
name: skill-creator
description: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Claude's capabilities with specialized knowledge, workflows, or tool integrations.
license: Complete terms in LICENSE.txt
---

# Skill Creator

This skill provides guidance for creating effective skills.

## About Skills

Skills are modular, self-contained packages that extend Claude's capabilities by providing
specialized knowledge, workflows, and tools. Think of them as "onboarding guides" for specific
domains or tasks—they transform Claude from a general-purpose agent into a specialized agent
equipped with procedural knowledge that no model can fully possess.

### Skill Categories

Skills are most powerful for repeatable workflows. Three common categories:

1. **Document & Asset Creation** — Generating consistent documents, presentations, apps, and designs with embedded style guides, templates, and quality checklists (e.g., `frontend-design`, `docx-creator`)
2. **Workflow Automation** — Multi-step processes with consistent methodology, including coordination across multiple MCP servers (e.g., `skill-creator`, `sprint-planner`)
3. **MCP Enhancement** — Workflow guidance layered on top of existing MCP tool access, teaching Claude *how* to use a service effectively rather than just *what* it can do (e.g., `sentry-code-review`)

### Core Design Principles

#### Progressive Disclosure

Skills use a three-level loading system to manage context efficiently:

1. **Metadata (name + description)** — Always in context (~100 words)
2. **SKILL.md body** — Loaded when skill triggers (<5k words)
3. **Bundled resources** — Loaded as needed by Claude (unlimited*)

*Unlimited because scripts can be executed without reading into context window.

#### Composability

Claude can load multiple skills simultaneously. Skills should work well alongside others—don't assume the skill is the only capability available.

#### Portability

Skills work identically across Claude.ai, Claude Code, and the API. Create a skill once and it works across all surfaces without modification.

### Skills + MCP

For MCP integrations, skills add a knowledge layer on top of tool access:

| | MCP (Connectivity) | Skills (Knowledge) |
|---|---|---|
| **Provides** | Tool access and real-time data | Workflows and best practices |
| **Answers** | What Claude can do | How Claude should do it |

Without skills, users connecting an MCP server must figure out workflows themselves, leading to inconsistent results and support burden. Skills embed best practices so they activate automatically.

See `references/workflow-patterns.md` for five proven patterns (sequential orchestration, multi-MCP coordination, iterative refinement, context-aware tool selection, domain-specific intelligence).

### Anatomy of a Skill

Every skill consists of a required SKILL.md file and optional bundled resources:

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata (required)
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/          - Executable code (Python/Bash/etc.)
    ├── references/       - Documentation loaded into context as needed
    └── assets/           - Files used in output (templates, icons, fonts, etc.)
```

**Important: Do NOT include `README.md` inside the skill folder.** All documentation goes in SKILL.md or `references/`. A repo-level README is fine for human visitors to a GitHub repo hosting the skill, but it must not be inside the skill folder itself.

#### SKILL.md

**Metadata Quality:** The `name` and `description` in YAML frontmatter determine when Claude will use the skill. Be specific about what the skill does and when to use it. Use third-person phrasing (e.g., "This skill should be used when..." rather than "Use this skill when...").

**YAML Frontmatter Fields:**

```yaml
---
name: skill-name-in-kebab-case          # required; lowercase, hyphens only, max 64 chars
description: What it does and when.     # required; WHAT + WHEN, max 1024 chars
license: MIT                            # optional; for open-source skills
allowed-tools: "Bash(python:*) WebFetch" # optional; restrict available tools
compatibility: Requires internet access  # optional; environment requirements, 1-500 chars
metadata:                               # optional; custom key-value pairs
  author: Your Name
  version: 1.0.0
  mcp-server: your-service-name
  tags: [automation, productivity]
---
```

**Security restrictions:**
- No XML angle brackets (`< >`) anywhere in frontmatter (appears in system prompt)
- Names with "claude" or "anthropic" prefix are reserved

**Writing effective descriptions** — structure: `[What it does] + [When to use it] + [Key capabilities]`

```yaml
# Good — specific trigger phrases
description: Manages Linear project workflows including sprint planning and task
  creation. Use when user mentions "sprint", "Linear tasks", "project planning",
  or asks to "create tickets".

# Good — file types + trigger phrases
description: Analyzes Figma design files and generates developer handoff docs.
  Use when user uploads .fig files or asks for "design specs" or
  "design-to-code handoff".

# Bad — too vague, no triggers
description: Helps with projects.
```

To prevent over-triggering, add explicit exclusions:

```yaml
description: Advanced CSV statistical analysis for regression, clustering, and
  modeling. Do NOT use for simple data exploration (use data-viz skill instead).
```

#### Bundled Resources (optional)

##### Scripts (`scripts/`)

Executable code (Python/Bash/etc.) for tasks that require deterministic reliability or are repeatedly rewritten.

- **When to include**: When the same code is rewritten repeatedly, or deterministic correctness is critical
- **Example**: `scripts/rotate_pdf.py` for PDF rotation tasks
- **Benefits**: Token efficient, deterministic, may be executed without loading into context
- **Note**: Scripts may still need to be read for patching or environment-specific adjustments

##### References (`references/`)

Documentation and reference material intended to be loaded as needed into context to inform Claude's process and thinking.

- **When to include**: For documentation that Claude should consult while working
- **Examples**: `references/schema.md` for database schemas, `references/api_docs.md` for API specs, `references/policies.md` for company policies
- **Best practice**: If files are large (>10k words), include grep search patterns in SKILL.md
- **Avoid duplication**: Information should live in SKILL.md *or* references files, not both. Keep SKILL.md lean—move detailed reference material, schemas, and examples to references files.

##### Assets (`assets/`)

Files used in the output Claude produces, not loaded into context.

- **When to include**: When the skill needs files that will appear in the final output
- **Examples**: `assets/logo.png` for brand assets, `assets/slides.pptx` for PowerPoint templates, `assets/frontend-template/` for HTML/React boilerplate
- **Benefits**: Separates output resources from documentation, enables Claude to use files without loading them into context

## Skill Creation Process

To create a skill, follow these steps in order, skipping only with clear reason.

### Step 1: Understand the Skill with Concrete Examples

Skip only when usage patterns are already clearly understood.

Gather 2–3 concrete use cases by asking targeted questions—avoid overwhelming users with too many at once:

- "What functionality should this skill support?"
- "Can you give examples of how this skill would be used?"
- "What would a user say to trigger this skill?"

Also define **success criteria** before building:

**Quantitative targets (rough benchmarks):**
- Skill triggers on ~90% of relevant queries (test with 10–20 representative prompts)
- Consistent tool call count per workflow (compare with/without skill enabled)
- 0 failed API calls per workflow (if MCP-dependent)

**Qualitative targets:**
- Users don't need to redirect Claude mid-workflow
- Consistent results across sessions
- New users can accomplish the task on first try with minimal guidance

Conclude when there is a clear picture of the functionality and what success looks like.

### Step 2: Plan the Reusable Skill Contents

To turn concrete examples into an effective skill, analyze each example by:

1. Considering how to execute it from scratch
2. Identifying what scripts, references, and assets would help when repeating it

| Use Case | Analysis | Resource |
|---|---|---|
| "Rotate this PDF" | Same code rewritten each time | `scripts/rotate_pdf.py` |
| "Build me a todo app" | Same HTML/React boilerplate each time | `assets/hello-world/` template |
| "How many users logged in?" | Table schemas re-discovered each time | `references/schema.md` |
| "Review this PR via Sentry" | Complex multi-MCP workflow | Structured sequence in SKILL.md |

Produce a list of the reusable resources to include.

### Step 3: Initialize the Skill

Skip only if the skill already exists and only iteration is needed.

When creating a new skill from scratch, always run the `init_skill.py` script:

```bash
scripts/init_skill.py <skill-name> --path <output-directory>
```

The script:

- Creates the skill directory with proper structure
- Generates a SKILL.md template with frontmatter and TODO placeholders
- Creates example resource directories: `scripts/`, `references/`, and `assets/`
- Adds example files in each directory that can be customized or deleted

After initialization, customize or remove the generated SKILL.md and example files as needed.

### Step 4: Edit the Skill

The skill is being created for another Claude instance to use. Focus on procedural knowledge, domain-specific details, and reusable assets that would be non-obvious.

#### Start with Reusable Skill Contents

Implement the resources identified in Step 2 first: `scripts/`, `references/`, and `assets/` files. User input may be required for domain-specific content (e.g., brand assets, company policies, API documentation).

Delete any example files not needed for the skill—the initialization script creates placeholders to demonstrate structure, but most skills won't need all of them.

#### Update SKILL.md

**Writing style:** Use **imperative/infinitive form** (verb-first), not second person. Write "To accomplish X, do Y" rather than "You should do X." This maintains consistency and clarity for AI consumption.

To complete SKILL.md, answer:

1. What is the purpose of the skill?
2. When should it be used?
3. How should Claude use each bundled resource?

**Critical instruction guidelines:**

- Put critical instructions near the top; use `## Critical` or `## Important` headers
- For must-follow validations, prefer deterministic scripts over language instructions—code is reliable, language interpretation is not:
  ```
  CRITICAL: Before calling create_project, run scripts/validate_input.py
  ```
- Move detailed documentation to `references/` and link to it; keep SKILL.md under 5,000 words
- For step ordering that matters, number steps explicitly and document dependencies between them

**For MCP-enhancing skills**, also include:
- Exact MCP tool names (case-sensitive, as they appear in the server)
- Validation at each workflow stage
- Error handling for common MCP failures (auth, rate limits, timeouts)

### Step 5: Test the Skill

Run three types of tests:

**1. Triggering tests** — Does the skill load at the right times?
- Test obvious queries that should trigger it
- Test paraphrased versions of those queries
- Verify it does NOT trigger on unrelated topics
- Debug tip: Ask Claude "When would you use the [skill name] skill?" — Claude will quote the description back, revealing gaps

**2. Functional tests** — Does the skill produce correct outputs?
- Verify valid outputs are generated
- Confirm API/MCP calls succeed (if applicable)
- Test error handling paths
- Cover edge cases

**3. Performance comparison** — Does the skill improve results?
- Run the same task with and without the skill
- Compare: number of back-and-forth messages, failed API calls, tokens consumed

**Effective iteration strategy:** Focus on a single challenging task until Claude succeeds, then extract the winning approach into the skill. Once there's a working foundation, expand to multiple test cases for coverage.

### Step 6: Package the Skill

```bash
scripts/package_skill.py <path/to/skill-folder>
```

Optional output directory:

```bash
scripts/package_skill.py <path/to/skill-folder> ./dist
```

The packaging script:

1. **Validates** the skill, checking:
   - YAML frontmatter format and required fields
   - Naming conventions and directory structure
   - Description completeness and quality
   - No `README.md` inside the skill folder

2. **Packages** into a distributable zip file if validation passes

Fix any validation errors and rerun if validation fails.

### Step 7: Distribute

**For individuals / open-source:**
1. Host on GitHub with a clear repo-level README (for human visitors—not inside the skill folder)
2. For MCP-enhancing skills, link to the skill from your MCP documentation and explain why using both together is valuable
3. Provide an installation guide pointing users to Settings > Capabilities > Skills > Upload

**For organizations (January 2026+):**
- Admins can deploy skills workspace-wide via Claude Console
- Automatic updates and centralized management are available

**For programmatic / API use:**
- Use the `/v1/skills` endpoint to list and manage skills
- Add skills to Messages API requests via the `container.skills` parameter
- Requires the Code Execution Tool beta

### Step 8: Iterate

After testing, improve based on observed signals:

**Under-triggering** (skill doesn't load for relevant queries, users invoke it manually):
- Add more specific trigger phrases to the description
- Include technical terms and exact phrases users say
- Ask Claude "When would you use [skill name]?" to surface blind spots

**Over-triggering** (skill loads for irrelevant queries, users disable it):
- Add negative triggers ("Do NOT use for...")
- Narrow the description scope with more specific language

**Execution issues** (inconsistent results, users correcting output, failed MCP calls):
- Move critical instructions to the top of SKILL.md
- Replace ambiguous language with deterministic validation scripts
- Add explicit step ordering and error handling

## Troubleshooting

### Skill Won't Upload

| Error | Cause | Fix |
|---|---|---|
| "Invalid frontmatter" | Missing `---` delimiters or unclosed quotes | Add delimiters, fix YAML syntax |
| "Invalid skill name" | Spaces, capitals, or underscores in name | Rename to `kebab-case` |
| "Could not find SKILL.md" | File not named exactly `SKILL.md` | Rename (case-sensitive) |

### Instructions Not Followed

- Move critical instructions to the top; use `## Critical` / `## Important` headers
- Replace language-based validations with executable scripts (code is deterministic)
- Keep instructions concise and direct—move detailed content to `references/`
- If Claude skips steps: add "Take your time—quality over speed. Do not skip validation steps." (Most effective when placed in the user's prompt rather than SKILL.md)

### Skill Context Too Large / Slow Responses

- Keep SKILL.md under 5,000 words
- Move detailed docs to `references/` and link to them from SKILL.md
- Limit enabled skills to 20–50 simultaneously

## Resources

- [Anthropic Skills Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills)
- [Example Skills Repository — anthropics/skills](https://github.com/anthropics/skills)
- [Skills Best Practices Guide](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/best-practices)
- [Claude Developers Discord](https://discord.gg/anthropic) — community support
- `references/workflow-patterns.md` — Five proven patterns for MCP and automated workflows
