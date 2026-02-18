# AGENTS.md Guide

AGENTS.md is an open-standard file (governed by the Agentic AI Foundation / Linux Foundation) that serves as a "README for agents." While README.md is written for human contributors, AGENTS.md provides the precise technical context AI coding agents need to operate autonomously: build steps, testing protocols, architectural constraints, and conventions.

---

## Recommended Sections

### 1. Project Overview

A concise technical summary — not marketing copy. Include:

- Primary tech stack (languages, frameworks, runtimes)
- Core architectural pattern (monolith, microservices, monorepo, etc.)
- Key directories and their purpose
- Any unusual or non-standard choices

**Example:**
```markdown
## Project Overview

Full-stack web application built with Next.js 15 (App Router), TypeScript strict mode,
and a PostgreSQL database accessed via Drizzle ORM. REST API routes in `app/api/`.
Frontend components use shadcn/ui. Authentication via NextAuth.js.

Key directories:
- `app/` — Next.js App Router pages and API routes
- `lib/` — Shared utilities, database client, auth helpers
- `components/` — Reusable UI components (shadcn/ui based)
- `db/` — Drizzle schema, migrations
- `tests/` — Vitest unit + integration tests
```

### 2. Setup & Build Commands

Exact, copy-pasteable commands. Agents run these literally.

```markdown
## Setup & Build

Install dependencies:
  pnpm install

Start development server:
  pnpm dev                  # runs on http://localhost:3000

Run database migrations:
  pnpm db:migrate

Build for production:
  pnpm build
```

### 3. Testing Instructions

Include linting, type-checking, and unit/integration test commands. Specify what agents must run before committing.

```markdown
## Testing

Run all tests:
  pnpm test

Run tests in watch mode:
  pnpm test:watch

Type-check without building:
  pnpm typecheck

Lint:
  pnpm lint

IMPORTANT: Always run `pnpm typecheck && pnpm test` before marking a task complete.
```

### 4. Code Style & Conventions

The most valuable section for eliminating repeated mistakes. Be specific.

```markdown
## Code Style & Conventions

- TypeScript strict mode is enabled — never use `any`
- Use `type` not `interface` for object shapes
- Functional components only — no class components
- All imports use path aliases (`@/lib/...` not relative `../../lib/...`)
- Single quotes, no semicolons (enforced by ESLint/Prettier)
- Use named exports, not default exports (except page components)
- Database queries go in `lib/db/` — never inline SQL in components
- Environment variables accessed only through `lib/env.ts` (validated at startup)
```

### 5. Architecture & Constraints

Document non-obvious decisions and hard constraints.

```markdown
## Architecture Constraints

- This is a multi-tenant SaaS — always filter queries by `organizationId`
- Never expose user PII in API responses; strip before returning
- All external API calls go through `lib/api-client.ts` (centralizes auth headers)
- Background jobs use BullMQ — do not use `setTimeout` for deferred work
- Feature flags checked via `lib/flags.ts` — do not hardcode feature availability
```

### 6. Security Considerations

Make implicit security rules explicit.

```markdown
## Security

- Never log request bodies or database query results (may contain PII)
- API routes validate JWT via `lib/auth/validate.ts` — do not skip this
- All user-controlled strings are escaped before DB insertion (Drizzle handles this)
- `NEXT_PUBLIC_*` env vars are exposed to the browser — never put secrets there
- Dependency updates: run `pnpm audit` before merging security-related PRs
```

### 7. Operational Context

Commit message format, PR conventions, branch naming, etc.

```markdown
## Operational Context

Commit format: `type(scope): description` (Conventional Commits)
  - feat(auth): add OAuth2 provider
  - fix(api): handle null user response
  - chore(deps): update Next.js to 15.2

Branch naming: `feature/short-description`, `fix/issue-number`, `chore/task-name`

Do not commit directly to `main` — use PRs with at least one reviewer.
```

---

## Hierarchical Discovery in Monorepos

AGENTS.md supports nested files to avoid bloating a single root file and to provide scoped instructions per package.

### Resolution Rules

1. Agents discover instructions by searching from the current file's directory **upward** to the repo root
2. The closest AGENTS.md takes precedence (most-specific wins)
3. Agents typically load all AGENTS.md files along the path and merge them, with closer files overriding global rules

### Recommended Structure

```
repo/
├── AGENTS.md                          # Global: team conventions, CI, git rules
├── packages/
│   ├── frontend/
│   │   └── AGENTS.md                  # Overrides: React/Next.js specifics
│   ├── backend/
│   │   └── AGENTS.md                  # Overrides: Go/API specifics
│   └── shared/
│       └── AGENTS.md                  # Overrides: shared library rules
└── infra/
    └── AGENTS.md                      # Overrides: Terraform/Pulumi specifics
```

The root AGENTS.md defines baseline rules. Subdirectory files add or override for their scope. Example root entry:
```markdown
## Root Conventions
Use spaces for indentation (2 spaces). All packages must have tests.
```

And the frontend override:
```markdown
## Frontend-Specific Build

Install all packages from repo root: `pnpm install`
Start only frontend: `pnpm --filter @repo/frontend dev`
Run frontend tests: `pnpm --filter @repo/frontend test`
```

---

## Comparison: AGENTS.md vs. CLAUDE.md vs. copilot-instructions.md

| Feature | AGENTS.md | CLAUDE.md | copilot-instructions.md |
|---------|-----------|-----------|------------------------|
| Governance | Open standard (AAIF/Linux Foundation) | Proprietary (Anthropic) | Proprietary (GitHub/Microsoft) |
| Scope | Cross-platform (Codex, Cursor, Gemini CLI, Claude Code) | Claude Code CLI only | GitHub Copilot only |
| File location | Repo root and nested directories | Repo root or `.claude/` | `.github/` directory |
| Discovery | Hierarchical (closest file wins) | Flat (root file) | Flat (single file) |
| Interoperability | High — referenced by other config files | Low | Low |

### Convergence Trend (2026)

The industry is converging on AGENTS.md as the unified baseline. As of early 2026, it is supported by Cursor, Codex, Gemini CLI, and Claude Code.

**The recommended pattern** for multi-tool repos:

1. Write all project context into `AGENTS.md` (the single source of truth)
2. Create `CLAUDE.md` containing only: `Read @AGENTS.md`
3. Create `.github/copilot-instructions.md` containing only: `See AGENTS.md for project context`

This avoids duplicating project knowledge across tool-specific files.

---

## AGENTS.md Template

Copy and customize this template for any project:

```markdown
# AGENTS.md — [Project Name]

## Project Overview

[One paragraph: tech stack, architecture, purpose]

Key directories:
- `src/` — [purpose]
- `tests/` — [purpose]

## Setup & Build

Install dependencies:
  [command]

Start development:
  [command]

## Testing

Run all tests:
  [command]

IMPORTANT: Always run [test command] before marking work complete.

## Code Style & Conventions

- [Convention 1]
- [Convention 2]
- [Convention 3]

## Architecture Constraints

- [Constraint 1]
- [Constraint 2]

## Security

- [Security rule 1]
- [Security rule 2]

## Operational Context

Commit format: [format]
Branch naming: [pattern]
```

---

## Common AGENTS.md Mistakes to Avoid

| Mistake | Why It's a Problem | Fix |
|---------|-------------------|-----|
| Copying README.md content verbatim | README is for humans; agents need precise commands | Extract only technical, actionable content |
| Vague conventions ("write clean code") | Unenforceable by agents | Give specific, checkable rules |
| No test/build commands | Agents guess or skip validation | Add exact commands, including flags |
| Not updating after refactors | Agents follow stale instructions ("context rot") | Schedule AGENTS.md reviews on major changes |
| Putting workflow logic in AGENTS.md | Should live in agent skills (SKILL.md) | Keep AGENTS.md for identity; skills for capability |
| No security section | Agents may repeat unsafe patterns | Add explicit security rules for your threat model |
