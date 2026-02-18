---
title: Skills Repository
description: Guide to the modular skill structure, navigation, and patterns for all skills in this repository.
---

# Skills Repository Guide

**Last Updated:** February 18, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Skills Directory](#skills-directory)
3. [How Skills Are Organized](#how-skills-are-organized)
4. [Using the Skills](#using-the-skills)
5. [Adding New Skills](#adding-new-skills)

---

## Overview

This repository contains **modular AI skills** organized using an **orchestration hub + focused resources** pattern. Each skill's main `SKILL.md` file acts as an intelligent router that helps quickly identify and load the right specialized resource file for a given task.

### Structure

- **Main hub (SKILL.md):** 120–250 lines, contains a decision table routing to resource files
- **Resource files:** 5–7 files per skill, each 200–600 lines, focused on one topic

---

## Skills Directory

| Skill | Resources | Description |
|---|---|---|
| [agent-patterns](agent-patterns/SKILL.md) | 7 files | AI agent workflows and orchestration patterns |
| [avalonia](avalonia/SKILL.md) | 6 files | Cross-platform .NET UI with Avalonia |
| [azure-devops](azure-devops/SKILL.md) | 7 files | Azure DevOps REST API |
| [azure-swa](azure-swa/SKILL.md) | 6 files | Azure Static Web Apps |
| [blazor-blog-feature](blazor-blog-feature/SKILL.md) | 5 files | Blazor blog feature implementation |
| [blazor-expert](blazor-expert/SKILL.md) | 5 files | Advanced Blazor development |
| [devcontainers](devcontainers/SKILL.md) | 5 files | Dev Container Specification — devcontainer.json, Features, Templates, multi-container, cloud environments |
| [dotnet-aspire](dotnet-aspire/SKILL.md) | 5 files | .NET Aspire cloud deployment |
| [fine-tuning-data-generator](fine-tuning-data-generator/SKILL.md) | 6 files | ML training data generation |
| [freeagent-api](freeagent-api/SKILL.md) | 5 files | FreeAgent accounting API |
| [genaiscript](genaiscript/SKILL.md) | 4 files | GenAIScript scripting framework |
| [github-api](github-api/SKILL.md) | 7 files | GitHub REST & GraphQL API |
| [gof-design-patterns](gof-design-patterns/SKILL.md) | 6 files | Gang of Four design patterns |
| [home-assistant-api](home-assistant-api/SKILL.md) | 7 files | Home Assistant smart home API |
| [kiss-principle](kiss-principle/SKILL.md) | 3 files | KISS software design principle |
| [markdown-formatter](markdown-formatter/SKILL.md) | 7 files | Markdown formatting and processing |
| [microsoft-graph](microsoft-graph/SKILL.md) | 5 files | Microsoft Graph API |
| [mise](mise/SKILL.md) | 6 files | mise-en-place dev tool and environment orchestrator (replaces asdf, nvm, direnv, make) |
| [root-cause-analysis](root-cause-analysis/SKILL.md) | 4 files | Root cause analysis methodology |
| [thought-patterns](thought-patterns/SKILL.md) | 4 files | Structured thinking and reasoning patterns |
| [twelve-factor-app](twelve-factor-app/SKILL.md) | 7 files | Twelve-Factor App methodology for cloud-native SaaS |

---

## How Skills Are Organized

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

1. **Quick Reference Table** — Decision table mapping tasks to resource files
2. **Orchestration Protocol** — Three-phase workflow (classify → select resource → execute)
3. **Common Task Workflows** — Step-by-step guides for frequent scenarios
4. **Resource Summaries** — One-liner descriptions with line counts for each resource
5. **Best Practices** — Key takeaways and anti-patterns
6. **External References** — Links to official documentation

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

| Pattern | Examples | Effectiveness |
|---|---|---|
| `core-concepts.md` | Foundational knowledge | ⭐⭐⭐⭐⭐ |
| `[domain]-reference.md` | API or command reference | ⭐⭐⭐⭐⭐ |
| `[topic]-guide.md` | How-to guidance | ⭐⭐⭐⭐ |
| `examples.md` | Code samples | ⭐⭐⭐⭐ |
| `[aspect]-advanced.md` | Advanced usage | ⭐⭐⭐ |
| `[domain]-integration.md` | Integration patterns | ⭐⭐⭐ |

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
- [ ] No README.md inside the skill folder (docs go in SKILL.md or resource files)

### Initialization

Use the init script to scaffold a new skill:

```bash
python scripts/init_skill.py <skill-name> --path skills/
```

---

**Navigation:** [Return to repository root](..)
