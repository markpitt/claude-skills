# Agent Skills Architecture for Project-Specific Workflows

Agent skills package specialized, reusable workflows as `SKILL.md`-based modules. While AGENTS.md defines *what the project is*, skills define *what the agent can do* within it. This resource covers how to design skills for your project's repeatable tasks.

---

## Overview: Identity vs. Capability

| Layer | Artifact | Purpose | Example |
|-------|----------|---------|---------|
| Identity | `AGENTS.md` | Static project rules, conventions, build steps | "Use TypeScript strict mode" |
| Capability | `SKILL.md` + resources | Dynamic, executable workflows loaded on demand | "Scaffold a new API endpoint" |
| Connectivity | `mcp.json` | Live tool access (databases, IDE, APIs) | "Query the database schema" |

Skills are loaded via **progressive disclosure**:
- Level 1 (always in context): metadata only (~100 tokens per skill)
- Level 2 (loaded when triggered): full SKILL.md instructions
- Level 3 (loaded as needed): scripts, reference files, assets

---

## When to Create a Skill for Your Project

Create a project-specific skill when:

- The same multi-step workflow is repeated frequently (e.g., "add a new feature module")
- Architectural rules are complex enough to warrant dedicated instructions
- The workflow involves tool coordination (MCP + file edits + test runs)
- Agent mistakes follow a pattern that hints at missing procedural knowledge

**Do not** create a skill for:
- One-off tasks unlikely to recur
- Simple conventions already in AGENTS.md
- Straightforward single-step operations

---

## Skill Structure for Project Workflows

```
.claude/skills/
├── add-feature/
│   ├── SKILL.md               # Trigger phrases + step-by-step workflow
│   └── resources/
│       ├── feature-template.md    # Template showing expected file layout
│       └── conventions.md         # Architecture-specific rules
│
├── database-migration/
│   ├── SKILL.md
│   └── scripts/
│       └── generate-migration.py  # Deterministic migration generation
│
└── deploy-staging/
    ├── SKILL.md
    └── resources/
        └── checklist.md           # Pre-deploy validation steps
```

Skills can live in:
- `.claude/skills/` — project-level (committed to repo)
- `~/.claude/skills/` — personal/global (available across all projects)

---

## Writing Effective Trigger Phrases in SKILL.md

The `description` field in SKILL.md frontmatter determines when the skill loads. Per the AAIF spec, it is pre-loaded as lightweight metadata (~100 tokens) so the agent can decide relevance.

### Effective Description Pattern

```
[What it does] + [When to use it] + [Exact trigger phrases]
```

**Example — good:**
```yaml
description: Scaffolds a new REST API endpoint in this project following our
  layered architecture (router → service → repository). Use when asked to
  "add an endpoint", "create a route", or "add an API for [feature]".
  Generates controller, service, repository, and test files in the correct
  directories with the project's naming conventions pre-applied.
```

**Example — too vague:**
```yaml
description: Helps with API development.
```

### Preventing Over-Triggering

Add explicit exclusions to prevent the skill loading for unrelated tasks:

```yaml
description: ... Do NOT use for frontend component creation (use the
  add-component skill instead) or for database migrations (use
  database-migration skill).
```

---

## Structuring SKILL.md for a Project Workflow

Follow this template for project-specific skills:

```markdown
---
name: [project-name]-[workflow]
description: [What + When + Triggers + Exclusions]
metadata:
  project: [project-name]
  version: 1.0.0
---

# [Workflow Name]

Brief description of what this workflow produces.

## Critical

[Any must-follow rules — put them first, use this section for non-negotiables]

## Steps

1. [Step 1 — specific, actionable]
2. [Step 2]
3. [Step 3 — including: run `[test command]` to validate]

## File Locations

- New files go in: `[path]/`
- Naming pattern: `[pattern]`
- Import from: `[path]` using `[alias]`

## Conventions for This Workflow

- [Specific rule 1]
- [Specific rule 2]

## Validation Checklist

Before marking complete:
- [ ] Tests pass: `[command]`
- [ ] Types check: `[command]`  
- [ ] No lint errors: `[command]`
```

---

## Example: "Add Feature Module" Skill

For a project using a feature-based folder structure:

```yaml
---
name: add-feature-module
description: Creates a new feature module in the project following the
  feature-slice architecture. Use when asked to "add a feature",
  "create a new module", or "scaffold [feature-name]". Creates the
  full directory structure, index barrel, component, hook, and test files.
  Do NOT use for standalone utility functions or API-only changes.
---

# Add Feature Module

Creates a complete feature slice: component, hook, types, tests, and barrel.

## Critical

All new feature modules MUST be placed in `src/features/[feature-name]/`.
Never place feature logic directly in `src/components/` or `src/pages/`.

## Steps

1. Create directory: `src/features/[name]/`
2. Create `src/features/[name]/index.ts` (barrel file, re-exports public API only)
3. Create `src/features/[name]/[Name].tsx` (main component — named export)
4. Create `src/features/[name]/use[Name].ts` (hook for business logic)
5. Create `src/features/[name]/[name].types.ts` (TypeScript types)
6. Create `src/features/[name]/[name].test.tsx` (Vitest + Testing Library)
7. Run `pnpm typecheck && pnpm test` to validate

## Naming Conventions

- Directory: lowercase kebab-case (`user-profile`)
- Component file: PascalCase (`UserProfile.tsx`)
- Hook file: camelCase with `use` prefix (`useUserProfile.ts`)
- Types file: lowercase with `.types.ts` suffix

## What NOT to do

- Do not create `default` exports (use named exports everywhere)
- Do not import directly from sub-files — always go through the barrel (`index.ts`)
- Do not add styling inline — use the `[Name].module.css` file pattern
```

---

## Skills for Architecture Migration

When the team is migrating from one pattern to another, a skill ensures consistency:

```yaml
---
name: migrate-to-react-query
description: Migrates a component from local useState/useEffect data fetching
  to TanStack Query (React Query). Use when asked to "migrate data fetching",
  "convert to React Query", or "refactor [component] to use TanStack".
---

# Migrate Component to TanStack Query

## Steps

1. Install check: verify `@tanstack/react-query` in package.json
2. Identify the fetch pattern to replace (useEffect + useState)
3. Create a query key constant in `lib/query-keys.ts`
4. Replace the useState/useEffect with `useQuery(queryKey, fetchFn)`
5. Map loading/error/data states to the component's existing UI
6. Add the query to `QueryClient` prefetching if it's a page-level fetch
7. Run `pnpm test [component]` to confirm behaviour unchanged

## Key Patterns in This Codebase

- Query keys defined in `lib/query-keys.ts` (centralized)
- Query functions defined in `lib/api/` (not inline in components)
- Error boundaries in `app/error.tsx` handle React Query errors globally
```

---

## Meta-Skills: Skills that Create Skills

A meta-skill instructs the agent to observe a successful session and write a new skill to automate it:

```yaml
---
name: capture-workflow
description: After successfully completing a complex, repeatable task, use
  this skill to capture the workflow as a new SKILL.md. Use when asked to
  "save this workflow", "create a skill for this", or "automate what we just did".
---

# Capture Workflow as Skill

## Steps

1. Review the current session for the repeatable steps just performed
2. Identify: trigger phrases, step order, file locations, validation commands
3. Run: `python scripts/init_skill.py [name] --path .claude/skills/`
4. Write SKILL.md with:
   - Precise description with trigger phrases from this session
   - Step-by-step instructions (imperative, not suggestions)
   - Exact commands used
   - Validation checklist
5. Test by asking: "Would you use [skill-name] to do [task]?" — verify it
   loads correctly
6. Commit to version control
```

---

## Deployment: Making Skills Available to the Team

| Method | Use Case | Commands |
|--------|----------|---------|
| Commit to `.claude/skills/` in repo | Project-level, shared with all contributors | `git add .claude/skills/ && git commit -m "add [skill] skill"` |
| User global `~/.claude/skills/` | Personal workflows across projects | `cp -r .claude/skills/[name] ~/.claude/skills/` |
| Claude Console (admin deploy) | Organization-wide deployment (Jan 2026+) | Via Claude Console → Capabilities → Skills |
| ZIP for Claude Desktop | Desktop/API distribution | `python scripts/package_skill.py .claude/skills/[name]` |
