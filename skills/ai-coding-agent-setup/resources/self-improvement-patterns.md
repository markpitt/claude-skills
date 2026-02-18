# Self-Improvement Patterns for AI Agents

Agent configurations become stale over time — a phenomenon called "context rot." This resource covers strategies for keeping AI context accurate, establishing feedback loops, preventing context window poisoning, and building living documentation that improves with the project.

---

## The Problem: Context Rot

Context rot occurs when:
- AGENTS.md instructions describe outdated conventions or deleted files
- Skills contain stale commands that no longer match the codebase
- The agent follows superseded patterns because no one updated the docs
- Context windows fill with conflicting instructions, reducing signal quality

Left unaddressed, context rot causes agents to regress — making mistakes that were previously corrected.

---

## Strategy 1: Treat Agent Mistakes as Documentation Bugs

Every repeated agent error signals a gap or inaccuracy in AGENTS.md or a skill.

### Feedback Loop Protocol

When an agent makes a mistake:

1. **Identify** — Was it a wrong command, wrong pattern, or wrong file path?
2. **Locate** — Which file (AGENTS.md or a skill) should have prevented it?
3. **Update** — Add an explicit instruction that corrects the behaviour
4. **Test** — Repeat the original task; verify the agent now follows the correction
5. **Commit** — Treat the doc update as a code fix; add it to the PR or commit

**Example:**
```
Agent made mistake: Used `npm install` instead of `pnpm install`
Fix: Added to AGENTS.md under ## Setup:
  "Package manager: pnpm (NOT npm or yarn). Always use `pnpm install`.
   Running `npm install` will corrupt the lockfile."
```

---

## Strategy 2: End-of-Session Improvement Prompts

After completing a complex task, explicitly ask the agent to propose documentation improvements.

### Prompt Templates

**After debugging:**
```
Based on the debugging session we just completed, what should we add to 
AGENTS.md to prevent this class of error in future sessions?
```

**After implementing a new pattern:**
```
We just added [feature/pattern]. Update AGENTS.md to document this new
convention so future agents (and teammates) understand it.
```

**After a failed refactor attempt:**
```
The approach we first tried didn't work because [reason]. Add a note to
AGENTS.md or the relevant skill so agents don't repeat this mistake.
```

**Weekly/monthly review:**
```
Review AGENTS.md and all skills in .claude/skills/. Identify any instructions
that are outdated, incorrect, or missing based on what you know about the
current codebase. List proposed changes.
```

---

## Strategy 3: Progressive Disclosure to Prevent Context Overload

Loading everything into context simultaneously causes "context collapse" — the agent loses coherence as the window fills.

### Tiered Loading Architecture

| Level | Content | Tokens | When Loaded |
|-------|---------|--------|-------------|
| 1 — Always present | AGENTS.md + skill metadata (name/description only) | ~500 | Session start |
| 2 — On demand | Full SKILL.md when a skill is triggered | ~2,000 per skill | Matching task |
| 3 — Reference pull | Resource files within a skill | ~5,000 per file | When referenced |

**Design for this in AGENTS.md:**
- Keep AGENTS.md under 500 lines — move detailed docs to skills and references
- Use skills instead of long AGENTS.md appendices for workflow procedures
- Write skill descriptions that are specific enough to trigger only when relevant

### Context Compression Checkpoints

For long sessions, periodically compact context:

```
Provide a concise summary of what we've accomplished, the key decisions made,
and importantly, any updated understanding of the codebase architecture. 
I'll use this as a checkpoint if the context window fills.
```

---

## Strategy 4: Memory Architecture for Long-Lived Projects

For projects maintained over months/years, structure persistent memory across layers:

### Memory Tiers

```
Short-term memory:   Active conversation context (message buffer)
                     ↓ fades at session end
Core memory:         AGENTS.md — stable conventions and project identity
                     ↓ persists across sessions
Skill memory:        .claude/skills/ — executable workflows and patterns
                     ↓ persists across sessions
Archival memory:     Vector store (via MCP) — searchable history of decisions
                     ↓ persists; retrieved on demand
```

### Practical Implementation

1. **Core memory** → Maintain in `AGENTS.md` (version-controlled, human-readable)
2. **Skill memory** → Commit skills to `.claude/skills/` in the repo
3. **Archival memory** → For decision rationale, use an Architecture Decision Record (ADR) folder:

```
docs/
└── decisions/
    ├── 001-chose-drizzle-over-prisma.md
    ├── 002-feature-slice-architecture.md
    └── 003-tanstack-query-for-server-state.md
```

Reference ADRs in AGENTS.md:
```markdown
## Architecture Decisions

Key architectural decisions are documented in `docs/decisions/`.
Consult these before proposing changes to core patterns.
Notable decisions:
- #002 — Feature-slice structure (do not flatten to component-based layout)
- #003 — TanStack Query for all server state (do not use useEffect + fetch)
```

---

## Strategy 5: Skills as Living Workflows

Skills degrade when the project changes but the skill is not updated.

### Skill Maintenance Checklist

Run this when making significant changes to the project:

- [ ] Do any skill commands reference renamed/moved files? Update paths.
- [ ] Do any skill commands reference deprecated tools or packages? Update.
- [ ] Have new conventions been adopted that conflict with existing skills?
- [ ] Are any skills never triggered? Consider merging into AGENTS.md or deleting.
- [ ] Are any AGENTS.md sections complex enough to deserve their own skill?

### Skill Version Pinning

When a skill is created at a specific project checkpoint, note it:

```yaml
---
name: add-api-endpoint
metadata:
  version: 2.0.0
  updated: 2026-02-18
  note: Updated for v2 route structure after API refactor
---
```

---

## Strategy 6: Meta-Skills for Automated Improvement

### The Skill-Creator Pattern

A "meta-skill" is a skill that writes other skills. After successfully completing a complex workflow, invoke the `skill-creator` meta-skill (or prompt the agent directly) to codify the workflow.

**Trigger:**
```
We just successfully [completed task]. This workflow is repeatable.
Create a new skill in .claude/skills/[name]/ that captures this workflow
so it can be triggered automatically next time.
```

The agent should:
1. Identify the steps performed
2. Extract the trigger phrases (what prompted the original task)
3. Write a `SKILL.md` with imperative instructions
4. Include exact commands, file paths, and validation steps
5. Run `python scripts/package_skill.py .claude/skills/[name]` to validate

### Reflexion Loops

For complex tasks, build in a self-critique step:

```
Before finalizing this implementation:
1. Review what you just produced against the constraints in AGENTS.md
2. Identify any violations of the project conventions
3. Fix them, then confirm the implementation is compliant
```

This prevents the agent from bypassing AGENTS.md rules during long edits.

---

## Strategy 7: Observability — Detecting When Agents Go Off-Track

Signs that agent configuration needs attention:

| Signal | Likely Cause | Action |
|--------|-------------|--------|
| Agent uses wrong package manager | Missing/wrong command in AGENTS.md | Update Setup section |
| Agent creates files in wrong location | Missing directory map in AGENTS.md | Add Key Directories section |
| Agent suggests deprecated patterns | Stale skill or AGENTS.md | Version-check and update |
| Agent ignores existing conventions | Convention not documented | Add to AGENTS.md Conventions |
| Skill never triggers automatically | Description too vague | Add specific trigger phrases |
| Skill triggers for wrong tasks | Description too broad | Add "Do NOT use for X" exclusions |
| Same mistake recurs across sessions | Not documented after previous fix | Re-run error → AGENTS.md fix → commit |

### Minimal Observability Setup

Track agent errors in a lightweight log alongside ADRs:

```
docs/
└── agent-learnings/
    ├── 2026-01-15-wrong-import-paths.md
    ├── 2026-01-22-missing-migration-step.md
    └── TEMPLATE.md
```

Template:
```markdown
# Agent Learning: [Date]

## Mistake Observed
[What the agent did wrong]

## Root Cause
[Which instruction was missing or incorrect]

## Fix Applied
[What was updated in AGENTS.md / skill]

## Verification
[How we confirmed the fix works]
```

---

## Emerging Approaches (Experimental)

### SAGE (Skill Augmented GRPO for Self-Evolution)
A reinforcement-learning framework where agents generate and refine skills across sequential tasks. Skills produced in earlier tasks are preserved in a library and reused in later tasks. Achieves ~8.9% improvement in goal completion with 59% fewer tokens. Not yet production-ready for typical codebases — relevant for teams building fine-tuned agents.

### SEAgent (Self-Evolving Agent)
Enables autonomous skill discovery for unseen software via a World State Model and Curriculum Generator. Trains a specialist-to-generalist approach from software documentation. Significantly outperforms static-prompt baselines on OSWorld benchmarks.

### Agentic Context Engineering
Agents acting as "context engineers" — rewriting and pruning their own context files to mitigate brevity bias and context collapse. Uses `start_focus` / `complete_focus` checkpoints where intermediate reasoning is compressed into a persistent "knowledge block," reducing token usage by 20%+ without accuracy loss.

For practical projects today, the human-curated approaches in Strategies 1–6 above remain more reliable and easier to audit.
