---
name: ai-coding-agent-setup
description: Configures AI agents (GitHub Copilot, Claude Code, Cursor, Codex) to understand a codebase and self-improve as the project evolves. Use when setting up a new project for AI-assisted development, onboarding AI agents to an existing repo, creating AGENTS.md, configuring MCP servers for code navigation, packaging project workflows as agent skills, or establishing self-improvement feedback loops. Covers AGENTS.md authoring, skill packaging, MCP configuration, context management, and living-documentation strategies.
metadata:
  version: 1.0.0
  tags: [agents, ai, codebase, mcp, agents-md, self-improvement]
---

# AI Coding Agent Setup

Configure AI agents to deeply understand a codebase and continuously improve as the project grows. This skill covers the three-layer architecture: **AGENTS.md** for project identity, **agent skills** for packaged workflows, and **MCP servers** for live tool access — plus self-improvement strategies to prevent context rot.

## Quick Reference Table

| Goal | Load Resource | Key Concepts |
|------|---------------|--------------|
| Create or improve AGENTS.md | `resources/agents-md-guide.md` | project identity, hierarchical discovery, conventions |
| Package project workflows as skills | `resources/agent-skills-architecture.md` | progressive disclosure, SKILL.md, trigger phrases |
| Add IDE/codebase tools via MCP | `resources/mcp-codebase-tools.md` | Bifrost, vscode-mcp-server, semantic search |
| Reduce context rot, build feedback loops | `resources/self-improvement-patterns.md` | living docs, meta-skills, context compression |

---

## Orchestration Protocol

### Phase 1 — Classify the Request

Determine which layer the user needs help with:

- **"Set up AI for my project"** → start with `agents-md-guide.md`, then assess if skills and MCP are needed
- **"AI keeps making the same mistake"** → `self-improvement-patterns.md` (feedback loops section)
- **"AI can't navigate my code / doesn't understand the structure"** → `mcp-codebase-tools.md`
- **"How do I package this workflow for AI reuse?"** → `agent-skills-architecture.md`
- **"Agent ignores my conventions"** → `agents-md-guide.md` (conventions and enforcement section)

### Phase 2 — Select Resource

Load the relevant resource file from the table above. Most setups require `agents-md-guide.md` as the foundation, with other resources added on top.

### Phase 3 — Execute

Follow the specific guidance in the loaded resource. Output actionable file content (AGENTS.md, SKILL.md, mcp.json) — not just advice.

---

## Common Task Workflows

### Workflow 1: New Project AI Setup (15 minutes)

1. Load `resources/agents-md-guide.md` → create `AGENTS.md` at repo root using the template
2. Add project overview, build commands, test instructions, code conventions
3. Configure `.vscode/mcp.json` with at minimum the Bifrost server (see `mcp-codebase-tools.md`)
4. If the project has complex, repeatable workflows → package them as skills (see `agent-skills-architecture.md`)
5. Commit all AI configuration files to version control alongside the codebase

### Workflow 2: AGENTS.md for an Existing Repo

1. Load `resources/agents-md-guide.md`
2. Audit the existing `README.md` for technical content that belongs in AGENTS.md
3. Extract: build commands, test scripts, folder structure map, conventions → move to AGENTS.md
4. For monorepos: create root AGENTS.md + sub-directory AGENTS.md files for each package
5. Add a "pointer" to `CLAUDE.md` or `copilot-instructions.md` referencing AGENTS.md

### Workflow 3: Preventing Agent Mistakes from Recurring

1. Identify the pattern: did the agent use a wrong pattern/file/command?
2. Load `resources/self-improvement-patterns.md`
3. Update the relevant `AGENTS.md` section with an explicit correction
4. If the mistake is workflow-specific → update or create a skill (`agent-skills-architecture.md`)
5. Test: ask the agent to perform the same task; verify it now follows the corrected instruction

### Workflow 4: Giving Agents Deep Code Navigation

1. Load `resources/mcp-codebase-tools.md`
2. Install Bifrost VS Code extension (provides call hierarchy, find usages, go-to-definition)
3. Add server config to `.vscode/mcp.json`
4. For semantic search → configure a vector-store MCP server (Qdrant or Azure AI Search)
5. Document MCP tool names in AGENTS.md so the agent knows when to use them

### Workflow 5: Self-Improving Agent Configuration

1. After each significant debugging session, ask the agent: "What should we add to AGENTS.md to prevent this?"
2. Review proposed update → approve and commit
3. Monthly: use a "review" prompt against `self-improvement-patterns.md` to audit all config files
4. Over time: stale instructions become "context rot" — prune or update them proactively

---

## Resource Summaries

| Resource | Purpose | Line Count |
|----------|---------|-----------|
| `resources/agents-md-guide.md` | AGENTS.md template, recommended sections, hierarchical discovery, comparison with CLAUDE.md/copilot-instructions.md | ~350 |
| `resources/agent-skills-architecture.md` | How to package project workflows as reusable SKILL.md-based skills with progressive disclosure | ~300 |
| `resources/mcp-codebase-tools.md` | MCP servers for live code navigation: Bifrost, vscode-mcp-server, semantic search, GitHub MCP | ~280 |
| `resources/self-improvement-patterns.md` | Context rot prevention, feedback loops, living documentation, meta-skills, memory architecture | ~300 |

---

## Best Practices

- **Identity vs. Capability**: Use AGENTS.md for static project rules (identity); use skills for dynamic, executable workflows (capability). Do not put workflow logic in AGENTS.md.
- **Commit AI config to version control**: AGENTS.md, skills, and mcp.json are first-class project files — track them in git alongside code.
- **Hierarchical AGENTS.md for monorepos**: Root file holds global rules; sub-directory files override for local packages. Closest file wins.
- **Treat agent mistakes as documentation bugs**: Every repeated agent error is a missing or incorrect instruction in AGENTS.md or a skill. Fix the docs, not just the output.
- **Pointer pattern**: In `CLAUDE.md` write `Read @AGENTS.md` — avoids duplication across tool-specific instruction files.
- **Progressive disclosure in skills**: Keep SKILL.md under 5,000 words; move heavy reference content to `resources/` files loaded only when needed.
- **Name MCP tool names explicitly**: Include exact MCP tool names in AGENTS.md so agents know which tools to invoke for code navigation tasks.

---

## External References

- [AGENTS.md Open Standard — AAIF](https://agentprotocol.ai/agents-md)
- [Anthropic Skills Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [Bifrost VS Code MCP Extension](https://marketplace.visualstudio.com/items?itemName=bifrost.bifrost-mcp)
- [GitHub MCP Server](https://github.com/github/github-mcp-server)
