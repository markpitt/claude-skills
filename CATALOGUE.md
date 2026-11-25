---
title: Skills Catalogue
description: Every skill group and skill, plus the structure and patterns the skills follow.
---

# Skills Catalogue

Every skill, in the seven group repositories that hold them, and the structure the skills follow.

---

## Contents

1. [Overview](#overview)
2. [Skill Groups](#skill-groups)
3. [How Skills Are Organised](#how-skills-are-organised)
4. [Using the Skills](#using-the-skills)
5. [Adding New Skills](#adding-new-skills)

---

## Overview

The skills are split into seven groups, each a repository under `markpitt` with its own README, licence and `skills/` folder. Most skills follow an **orchestration hub + focused resources** pattern. Each skill's main `SKILL.md` file acts as a router that points Claude at the right specialised resource file for a given task.

### Structure

- **Main hub (SKILL.md):** 120–250 lines, contains a decision table routing to resource files
- **Resource files:** 5–7 files per skill, each 200–600 lines, focused on one topic

These are targets, not rules. The largest hubs (`agent-patterns`, `home-assistant-api`) run past
400 lines, and the smaller operator guides (`adguard-home-api`, `dokploy-api`, `grill-me`) are a single
SKILL.md with no resources at all.

---

## Skill Groups

<!-- BEGIN GENERATED SKILL INDEX -->
### [.NET skills](https://github.com/markpitt/claude-skills-dotnet#readme)

`claude-skills-dotnet`, 8 skills. .NET, Blazor, Avalonia, Aspire and the Azure services .NET shops use.

| Skill | Bundled files | What it does |
|---|---|---|
| [avalonia](https://github.com/markpitt/claude-skills-dotnet/blob/main/skills/avalonia/SKILL.md) | 6 files | Expert guidance for developing cross-platform desktop applications with Avalonia UI framework. |
| [azure-devops](https://github.com/markpitt/claude-skills-dotnet/blob/main/skills/azure-devops/SKILL.md) | 7 files | Works with the Azure DevOps REST API across all services including Boards (work items, queries, backlogs)… |
| [azure-swa](https://github.com/markpitt/claude-skills-dotnet/blob/main/skills/azure-swa/SKILL.md) | 6 files | Expert guidance for Azure Static Web Apps including architecture, configuration, API integration with Azure… |
| [blazor-blog-feature](https://github.com/markpitt/claude-skills-dotnet/blob/main/skills/blazor-blog-feature/SKILL.md) | 5 files | Adds a complete blog feature to an existing Blazor WebAssembly Static Web App with Azure Functions backend… |
| [blazor-expert](https://github.com/markpitt/claude-skills-dotnet/blob/main/skills/blazor-expert/SKILL.md) | 6 files | Blazor development expertise covering Blazor Server, WebAssembly, and Hybrid apps. |
| [dotnet-aspire](https://github.com/markpitt/claude-skills-dotnet/blob/main/skills/dotnet-aspire/SKILL.md) | 6 files | Adds .NET Aspire cloud-native orchestration to existing .NET solutions. |
| [dotnet-github-packages-release](https://github.com/markpitt/claude-skills-dotnet/blob/main/skills/dotnet-github-packages-release/SKILL.md) | 7 files | Publishes .NET NuGet packages to a GitHub Packages organisation feed, lets the organisation's other… |
| [dotnet-guru](https://github.com/markpitt/claude-skills-dotnet/blob/main/skills/dotnet-guru/SKILL.md) | 9 files | Enforces current C# and .NET 10 best practices when writing, reviewing, or refactoring .NET code. |

### [Language gurus](https://github.com/markpitt/claude-skills-language-gurus#readme)

`claude-skills-language-gurus`, 6 skills. Current best practice for Python, TypeScript, Rust, Go, shell and PowerShell.

| Skill | Bundled files | What it does |
|---|---|---|
| [golang-guru](https://github.com/markpitt/claude-skills-language-gurus/blob/main/skills/golang-guru/SKILL.md) | 6 files | Enforces Go 1.26 best practices when writing, reviewing, or refactoring Go code. |
| [pwsh-guru](https://github.com/markpitt/claude-skills-language-gurus/blob/main/skills/pwsh-guru/SKILL.md) | 6 files | Enforces PowerShell 7.5+ best practices when writing, reviewing, or refactoring PowerShell scripts and… |
| [python-guru](https://github.com/markpitt/claude-skills-language-gurus/blob/main/skills/python-guru/SKILL.md) | 6 files | Enforces Python 3.12+ best practices when writing, reviewing, or refactoring Python code. |
| [rust-guru](https://github.com/markpitt/claude-skills-language-gurus/blob/main/skills/rust-guru/SKILL.md) | 8 files | Enforces current Rust best practices when writing, reviewing, or refactoring Rust code. |
| [shell-guru](https://github.com/markpitt/claude-skills-language-gurus/blob/main/skills/shell-guru/SKILL.md) | 5 files | Enforces current shell scripting best practices when writing, reviewing, or refactoring Bash/POSIX sh scripts. |
| [typescript-guru](https://github.com/markpitt/claude-skills-language-gurus/blob/main/skills/typescript-guru/SKILL.md) | 6 files | Enforces TypeScript 5.9 best practices when writing, reviewing, or refactoring TypeScript code. |

### [Engineering practices](https://github.com/markpitt/claude-skills-engineering-practices#readme)

`claude-skills-engineering-practices`, 7 skills. Language-neutral craft: TDD, KISS, design patterns, twelve-factor, root cause analysis and decision interviews.

| Skill | Bundled files | What it does |
|---|---|---|
| [audit-remediation-loop](https://github.com/markpitt/claude-skills-engineering-practices/blob/main/skills/audit-remediation-loop/SKILL.md) | 4 files | Runs the full audit, remediation and review loop. |
| [gof-design-patterns](https://github.com/markpitt/claude-skills-engineering-practices/blob/main/skills/gof-design-patterns/SKILL.md) | 6 files | Orchestrates Gang of Four design pattern implementations across 8 languages. |
| [grill-me](https://github.com/markpitt/claude-skills-engineering-practices/blob/main/skills/grill-me/SKILL.md) | none | Interview the user one decision at a time down a dependency-ordered decision tree, asking exactly one… |
| [kiss-principle](https://github.com/markpitt/claude-skills-engineering-practices/blob/main/skills/kiss-principle/SKILL.md) | 3 files | Apply the KISS principle to reduce unnecessary complexity. |
| [root-cause-analysis](https://github.com/markpitt/claude-skills-engineering-practices/blob/main/skills/root-cause-analysis/SKILL.md) | 4 files | Conducts systematic root cause analysis using proven methodologies including Toyota's 5 Whys, Ishikawa… |
| [tdd-guru](https://github.com/markpitt/claude-skills-engineering-practices/blob/main/skills/tdd-guru/SKILL.md) | 3 files | Enforces current Test-Driven Development (TDD) best practices across programming languages and scripts… |
| [twelve-factor-app](https://github.com/markpitt/claude-skills-engineering-practices/blob/main/skills/twelve-factor-app/SKILL.md) | 7 files | Applies the Twelve-Factor App methodology when designing, building, reviewing, or auditing cloud-native and… |

### [API skills](https://github.com/markpitt/claude-skills-api#readme)

`claude-skills-api`, 6 skills. Working with REST APIs: GitHub, Microsoft Graph, Home Assistant, FreeAgent, AdGuard Home and Dokploy.

| Skill | Bundled files | What it does |
|---|---|---|
| [adguard-home-api](https://github.com/markpitt/claude-skills-api/blob/main/skills/adguard-home-api/SKILL.md) | none | Query and manage an AdGuard Home DNS server through its REST API. Covers stats, the query log, finding out… |
| [dokploy-api](https://github.com/markpitt/claude-skills-api/blob/main/skills/dokploy-api/SKILL.md) | none | Inspect and operate Docker Compose stacks managed by a Dokploy instance through its HTTP API. Covers listing… |
| [freeagent-api](https://github.com/markpitt/claude-skills-api/blob/main/skills/freeagent-api/SKILL.md) | 7 files | Interacts with the FreeAgent accounting API to manage invoices, contacts, projects, expenses, timeslips, and… |
| [github-api](https://github.com/markpitt/claude-skills-api/blob/main/skills/github-api/SKILL.md) | 7 files | Orchestrates GitHub API access across all services. |
| [home-assistant-api](https://github.com/markpitt/claude-skills-api/blob/main/skills/home-assistant-api/SKILL.md) | 7 files | Orchestrates access to the Home Assistant REST API for programmatic control of smart home devices. |
| [microsoft-graph-api](https://github.com/markpitt/claude-skills-api/blob/main/skills/microsoft-graph-api/SKILL.md) | 8 files | Orchestration hub for Microsoft Graph API across Microsoft 365 services. |

### [AI engineering](https://github.com/markpitt/claude-skills-ai-engineering#readme)

`claude-skills-ai-engineering`, 20 skills. Building with and around models: agent patterns, coding agent setup and sandboxing, fine-tuning data and project kickoff.

| Skill | Bundled files | What it does |
|---|---|---|
| [agent-council](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/agent-council/SKILL.md) | 4 files | Convenes a council of independent expert agents, each blind to the others and fixed to one lens, to review a… |
| [agent-instruction-load-audit](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/agent-instruction-load-audit/SKILL.md) | 2 files | Proves at runtime which instruction files a coding-agent harness actually loaded, in what precedence, and… |
| [agent-patterns](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/agent-patterns/SKILL.md) | 8 files | Modular orchestration of agent patterns from Anthropic's engineering guide. |
| [ai-coding-agent-setup](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/ai-coding-agent-setup/SKILL.md) | 4 files | Configures AI agents (GitHub Copilot, Claude Code, Cursor, Codex) to understand a codebase and self-improve… |
| [browser-assisted-portal](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/browser-assisted-portal/SKILL.md) | 1 file | Help a person through a government or service portal in a browser-automation session (for example Claude in… |
| [decision-models](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/decision-models/SKILL.md) | 3 files | Uses a System One decision model (OpenRouter, inception/mercury-decide:free) through the bundled `decide`… |
| [fine-tuning-data-generator](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/fine-tuning-data-generator/SKILL.md) | 6 files | Generates synthetic fine-tuning datasets in ChatML format (JSONL) for use with Unsloth, Axolotl, and similar… |
| [genaiscript](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/genaiscript/SKILL.md) | 5 files | Expert guidance for Microsoft's GenAIScript framework - a JavaScript/TypeScript-based system for building… |
| [instruction-context-budget](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/instruction-context-budget/SKILL.md) | 2 files | Measures what a coding-agent harness always loads (CLAUDE.md and AGENTS.md chains, unscoped rules, memory… |
| [local-llm-serving](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/local-llm-serving/SKILL.md) | 7 files | Serve local GGUF models on a single consumer GPU (for example 24 GB) through llama-swap, optionally fronted… |
| [omp-harness](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/omp-harness/SKILL.md) | 7 files | Configures and operates the omp coding agent harness, covering global and project config layers, model roles… |
| [parallel-worktree-integration](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/parallel-worktree-integration/SKILL.md) | 3 files | Runs several subagents in parallel git worktrees, one branch per task pinned to a base commit, then… |
| [pi-agent-extensions](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/pi-agent-extensions/SKILL.md) | 5 files | Writes, debugs and checks extensions for the pi coding agent, covering its ExtensionAPI events and tools… |
| [project-kickoff](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/project-kickoff/SKILL.md) | none | Turns a rough idea for a new product, venture or project into a short goal statement and a set of parallel… |
| [remediation-script](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/remediation-script/SKILL.md) | 2 files | Write a bash script for the human to run when a guard, sandbox or permission rule blocks the agent's own… |
| [resume-after-crash](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/resume-after-crash/SKILL.md) | 3 files | Recover an agent's work after a host crash, WSL restart, Windows update reboot or lost terminal. |
| [sandboxed-agent](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/sandboxed-agent/SKILL.md) | 4 files | Create a sandboxed coding agent for one folder, using a bubblewrap sandbox profile inferred from the folder… |
| [thought-patterns](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/thought-patterns/SKILL.md) | 7 files | Orchestrates cognitive thinking patterns for complex problem-solving. |
| [token-lean-document-reading](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/token-lean-document-reading/SKILL.md) | 2 files | Reads PDFs, email files (.eml and .msg), Word documents, zip archives, large text files and scanned images… |
| [transcript-analysis](https://github.com/markpitt/claude-skills-ai-engineering/blob/main/skills/transcript-analysis/SKILL.md) | none | Inventory and aggregate coding-agent session transcripts across Claude Code, OMP, Codex CLI and pi, with… |

### [Developer environment](https://github.com/markpitt/claude-skills-dev-environment#readme)

`claude-skills-dev-environment`, 14 skills. Tooling around the code: mise, devcontainers, terminal multiplexers, git protection, hosting and markdown.

| Skill | Bundled files | What it does |
|---|---|---|
| [atomic-commit-organiser](https://github.com/markpitt/claude-skills-dev-environment/blob/main/skills/atomic-commit-organiser/SKILL.md) | 3 files | Turn a dirty working tree, or several repositories at once, into commits grouped by intent, staging explicit… |
| [cloudflare-workers-static-site](https://github.com/markpitt/claude-skills-dev-environment/blob/main/skills/cloudflare-workers-static-site/SKILL.md) | none | Deploy a static site (Astro, Vite, Hugo, Eleventy, plain HTML) from a GitHub repo to Cloudflare Workers… |
| [container-image-updates](https://github.com/markpitt/claude-skills-dev-environment/blob/main/skills/container-image-updates/SKILL.md) | none | Check a Docker Compose stack's images for newer releases without pulling them, read the release notes for… |
| [devcontainers](https://github.com/markpitt/claude-skills-dev-environment/blob/main/skills/devcontainers/SKILL.md) | 5 files | Provides expert guidance on Development Containers (devcontainers), creating, configuring, and optimising… |
| [git-protection](https://github.com/markpitt/claude-skills-dev-environment/blob/main/skills/git-protection/SKILL.md) | none | Stop force pushes and history rewrites from a machine with a global git pre-push hook, and set the matching… |
| [internal-ca-trust](https://github.com/markpitt/claude-skills-dev-environment/blob/main/skills/internal-ca-trust/SKILL.md) | none | Make containers, language runtimes and headless browsers trust a private certificate authority (step-ca or… |
| [markdown-formatter](https://github.com/markpitt/claude-skills-dev-environment/blob/main/skills/markdown-formatter/SKILL.md) | 8 files | Formats markdown files according to best practices and common style guidelines. |
| [markdown-to-pdf](https://github.com/markpitt/claude-skills-dev-environment/blob/main/skills/markdown-to-pdf/SKILL.md) | 3 files | Produces high-quality PDF documents from Markdown using reproducible, automation-friendly workflows. |
| [mise](https://github.com/markpitt/claude-skills-dev-environment/blob/main/skills/mise/SKILL.md) | 7 files | Provides expert guidance on mise (mise-en-place), a polyglot dev tool and environment orchestrator that… |
| [public-repo-hygiene](https://github.com/markpitt/claude-skills-dev-environment/blob/main/skills/public-repo-hygiene/SKILL.md) | none | Make a private working repository safe to publish. |
| [tmux-persist](https://github.com/markpitt/claude-skills-dev-environment/blob/main/skills/tmux-persist/SKILL.md) | none | Keep tmux sessions across reboots on any Linux machine. |
| [traefik-lan-routes](https://github.com/markpitt/claude-skills-dev-environment/blob/main/skills/traefik-lan-routes/SKILL.md) | none | Publish a self-hosted service on the local network through Traefik v3, reachable only from LAN addresses… |
| [wsl-host-ops](https://github.com/markpitt/claude-skills-dev-environment/blob/main/skills/wsl-host-ops/SKILL.md) | none | Operate a WSL2 distribution from both sides of the boundary. |
| [zellij](https://github.com/markpitt/claude-skills-dev-environment/blob/main/skills/zellij/SKILL.md) | 1 file | Configure and operate zellij terminal multiplexer sessions. |

### [GCSE tutors](https://github.com/markpitt/claude-skills-gcse-tutors#readme)

`claude-skills-gcse-tutors`, 9 skills. Nine GCSE revision tutors, frozen at the 2026 exam year.

| Skill | Bundled files | What it does |
|---|---|---|
| [gcse-art-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/blob/main/skills/gcse-art-tutor/SKILL.md) | 4 files | GCSE Art and Design (Fine Art) tutor and revision assistant for 15–16 year old students preparing for 2026… |
| [gcse-biology-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/blob/main/skills/gcse-biology-tutor/SKILL.md) | 4 files | GCSE Biology tutor and revision assistant for 15–16 year old students preparing for 2026 exams across AQA… |
| [gcse-chemistry-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/blob/main/skills/gcse-chemistry-tutor/SKILL.md) | 4 files | GCSE Chemistry tutor and revision assistant for 15–16 year old students preparing for 2026 exams across AQA… |
| [gcse-english-language-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/blob/main/skills/gcse-english-language-tutor/SKILL.md) | 4 files | GCSE English Language tutor and revision assistant for 15–16 year old students preparing for 2026 exams… |
| [gcse-english-literature-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/blob/main/skills/gcse-english-literature-tutor/SKILL.md) | 4 files | GCSE English Literature tutor and revision assistant for 15–16 year old students preparing for 2026 exams… |
| [gcse-history-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/blob/main/skills/gcse-history-tutor/SKILL.md) | 4 files | GCSE History tutor and revision assistant for 15–16 year old students preparing for 2026 exams across AQA… |
| [gcse-maths-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/blob/main/skills/gcse-maths-tutor/SKILL.md) | 3 files | GCSE Maths tutor and revision assistant for 15–16 year old students preparing for 2026 exams across AQA… |
| [gcse-pe-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/blob/main/skills/gcse-pe-tutor/SKILL.md) | 4 files | GCSE Physical Education tutor and revision assistant for 15–16 year old students preparing for 2026 exams… |
| [gcse-physics-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/blob/main/skills/gcse-physics-tutor/SKILL.md) | 4 files | GCSE Physics tutor and revision assistant for 15–16 year old students preparing for 2026 exams across AQA… |

70 skills in 7 groups.
<!-- END GENERATED SKILL INDEX -->

These tables are generated from the skills themselves by `mise run skill:index`, and
`mise run skill:index:check` fails if any of them is out of date. `groups.json` lists the groups
and their repositories.

---

## How Skills Are Organised

Every skill follows the same structure:

```
skill-name/
├── SKILL.md                    # Orchestration hub (120–250 lines)
│   ├── YAML frontmatter        # name, description, metadata
│   ├── Quick Reference Table   # "When to Load Which Resource"
│   ├── Orchestration Protocol  # Phase 1/2/3 decision workflow
│   ├── Common Task Workflows   # 3–5 step-by-step scenarios
│   ├── Resource Summaries      # One-liner per resource file
│   ├── Best Practices          # Key takeaways and anti-patterns
│   └── External References     # Links to official docs
│
└── resources/                  # 5–7 focused topic files
    ├── core-concepts.md
    ├── [domain]-reference.md
    ├── [topic]-guide.md
    └── ...
```

### Hub Sections

Every hub (`SKILL.md`) contains:

1. **Quick Reference Table**: Decision table mapping tasks to resource files
2. **Orchestration Protocol**: Three-phase workflow (classify → select resource → execute)
3. **Common Task Workflows**: Step-by-step guides for frequent scenarios
4. **Resource Summaries**: One-liner descriptions with line counts for each resource
5. **Best Practices**: Key takeaways and anti-patterns
6. **External References**: Links to official documentation

### Decision Table Format

All hubs use a 3-column decision table as the primary navigation aid:

```markdown
| Use Case | Load Resource | Key Concepts |
|----------|---------------|--------------|
| Task A   | resource-a.md | concept, concept |
| Task B   | resource-b.md | concept, concept |
```

---

## Using the Skills

### Finding What You Need

1. Go to the skill's `SKILL.md`
2. Scan the Quick Reference Table (takes ~10 seconds)
3. Find the row matching your task
4. Load the indicated resource file
5. Find the relevant section within that resource

### Navigation by Goal

| Goal | Approach |
|---|---|
| Understand a new technology | Read Quick Reference Table → choose resource |
| Set up authentication | Look for "auth" in resource file names |
| See code examples | Look for "examples" or "patterns" in resource names |
| Troubleshoot an error | Check hub Troubleshooting section → load suggested resource |
| Understand architecture | Look for "core" or "concepts" resource |

---

## Adding New Skills

### Resource Naming Conventions

| Pattern | For |
|---|---|
| `core-concepts.md` | Foundational knowledge |
| `[domain]-reference.md` | API or command reference |
| `[topic]-guide.md` | How-to guidance |
| `examples.md` | Code samples |
| `[aspect]-advanced.md` | Advanced usage |
| `[domain]-integration.md` | Integration patterns |

Rules:
- Use hyphens, not underscores
- Start with domain/topic
- End with a descriptor (`reference`, `guide`, `examples`, `advanced`)
- Keep names under 40 characters

### Size Targets

| File | Target |
|---|---|
| Hub (SKILL.md) | 150–250 lines |
| Each resource | 250–400 lines (sweet spot) |
| Total across all resources | 1,500–3,500 lines |

### Checklist for New Skills

- [ ] YAML frontmatter with `name`, `description`, and `metadata`
- [ ] Quick Reference table (task → resource mapping)
- [ ] Orchestration Protocol with 3 phases
- [ ] 3–5 common task workflows
- [ ] Resource Summaries section with line counts
- [ ] Best Practices section
- [ ] External References section
- [ ] No hand-written README.md inside the skill folder (`mise run skill:sync` generates it from SKILL.md)

### Initialisation

Use the init script to scaffold a new skill inside a checkout of its group:

```bash
python scripts/init_skill.py <skill-name> --path <group-checkout>/skills/
```

---

**Navigation:** [Return to the claude-skills README](README.md)
