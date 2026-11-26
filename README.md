<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/banner-dark.svg">
    <img src="docs/assets/banner-light.svg" alt="claude-skills" width="100%">
  </picture>
</h1>

The Claude Skills I use, packaged so you can drop them into Claude Code or Claude Desktop. There are 70 of them, in seven group repositories. They cover .NET, Python, TypeScript, Rust, Go and shell; APIs such as Azure DevOps, GitHub, Microsoft Graph and Home Assistant; developer tooling such as mise and devcontainers; and nine GCSE revision tutors. Each one has been used on real work before it landed here; the ones that didn't earn their place were deleted.

This repository holds no skills itself. It links the groups, builds one zip per skill for each release, publishes the [skills site](https://markpitt.dev/claude-skills/), and keeps the shared toolchain: the validator, the packaging scripts and skills-tui.

## The groups

| Group | Skills | What it covers |
|---|---|---|
| [.NET skills](https://github.com/markpitt/claude-skills-dotnet) | 8 | .NET, Blazor, Avalonia, Aspire and the Azure services .NET shops use. |
| [Language gurus](https://github.com/markpitt/claude-skills-language-gurus) | 6 | Current best practice for Python, TypeScript, Rust, Go, shell and PowerShell. |
| [Engineering practices](https://github.com/markpitt/claude-skills-engineering-practices) | 7 | Language-neutral craft: TDD, KISS, design patterns, twelve-factor, root cause analysis and decision interviews. |
| [API skills](https://github.com/markpitt/claude-skills-api) | 6 | Working with REST APIs: GitHub, Microsoft Graph, Home Assistant, FreeAgent, AdGuard Home and Dokploy. |
| [AI engineering](https://github.com/markpitt/claude-skills-ai-engineering) | 20 | Building with and around models: agent patterns, coding agent setup and sandboxing, fine-tuning data and project kickoff. |
| [Developer environment](https://github.com/markpitt/claude-skills-dev-environment) | 14 | Tooling around the code: mise, devcontainers, terminal multiplexers, git protection, hosting and markdown. |
| [GCSE tutors](https://github.com/markpitt/claude-skills-gcse-tutors) | 9 | Nine GCSE revision tutors, frozen at the 2026 exam year. |

Every skill, with a one-line summary, is in [CATALOGUE.md](CATALOGUE.md) and on the [site](https://markpitt.dev/claude-skills/).

## Install a skill

Each release attaches every skill as its own zip, with its `SKILL.md`, its licence and any reference files it needs. Take the ones you want; there is no need to install a whole group.

For every project on this machine:

```bash
curl -LO https://github.com/markpitt/claude-skills/releases/latest/download/skill-name.zip
unzip skill-name.zip -d ~/.claude/skills/
```

For one project only, unzip into that project's `.claude/skills/` instead. Claude Code picks the skill up at the start of the next session. For Claude Desktop, upload the zip under Settings, Capabilities, Skills.

From a clone of a group instead:

```bash
git clone https://github.com/markpitt/claude-skills-dotnet.git
cp -r claude-skills-dotnet/skills/dotnet-guru ~/.claude/skills/
```

## Where did the skills go?

Until 2.0.0 this repository held 31 skills under `skills/`. They moved into the group repositories, unchanged in purpose; `microsoft-graph` was renamed `microsoft-graph-api` on the way. If you copied from `skills/<name>/`, copy from the group instead, or download the zip.

| Old path | Now |
|---|---|
| `skills/agent-patterns/` | [claude-skills-ai-engineering/skills/agent-patterns](https://github.com/markpitt/claude-skills-ai-engineering/tree/main/skills/agent-patterns) |
| `skills/ai-coding-agent-setup/` | [claude-skills-ai-engineering/skills/ai-coding-agent-setup](https://github.com/markpitt/claude-skills-ai-engineering/tree/main/skills/ai-coding-agent-setup) |
| `skills/avalonia/` | [claude-skills-dotnet/skills/avalonia](https://github.com/markpitt/claude-skills-dotnet/tree/main/skills/avalonia) |
| `skills/azure-devops/` | [claude-skills-dotnet/skills/azure-devops](https://github.com/markpitt/claude-skills-dotnet/tree/main/skills/azure-devops) |
| `skills/azure-swa/` | [claude-skills-dotnet/skills/azure-swa](https://github.com/markpitt/claude-skills-dotnet/tree/main/skills/azure-swa) |
| `skills/blazor-blog-feature/` | [claude-skills-dotnet/skills/blazor-blog-feature](https://github.com/markpitt/claude-skills-dotnet/tree/main/skills/blazor-blog-feature) |
| `skills/blazor-expert/` | [claude-skills-dotnet/skills/blazor-expert](https://github.com/markpitt/claude-skills-dotnet/tree/main/skills/blazor-expert) |
| `skills/devcontainers/` | [claude-skills-dev-environment/skills/devcontainers](https://github.com/markpitt/claude-skills-dev-environment/tree/main/skills/devcontainers) |
| `skills/dotnet-aspire/` | [claude-skills-dotnet/skills/dotnet-aspire](https://github.com/markpitt/claude-skills-dotnet/tree/main/skills/dotnet-aspire) |
| `skills/fine-tuning-data-generator/` | [claude-skills-ai-engineering/skills/fine-tuning-data-generator](https://github.com/markpitt/claude-skills-ai-engineering/tree/main/skills/fine-tuning-data-generator) |
| `skills/freeagent-api/` | [claude-skills-api/skills/freeagent-api](https://github.com/markpitt/claude-skills-api/tree/main/skills/freeagent-api) |
| `skills/gcse-art-tutor/` | [claude-skills-gcse-tutors/skills/gcse-art-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/tree/main/skills/gcse-art-tutor) |
| `skills/gcse-biology-tutor/` | [claude-skills-gcse-tutors/skills/gcse-biology-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/tree/main/skills/gcse-biology-tutor) |
| `skills/gcse-chemistry-tutor/` | [claude-skills-gcse-tutors/skills/gcse-chemistry-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/tree/main/skills/gcse-chemistry-tutor) |
| `skills/gcse-english-language-tutor/` | [claude-skills-gcse-tutors/skills/gcse-english-language-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/tree/main/skills/gcse-english-language-tutor) |
| `skills/gcse-english-literature-tutor/` | [claude-skills-gcse-tutors/skills/gcse-english-literature-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/tree/main/skills/gcse-english-literature-tutor) |
| `skills/gcse-history-tutor/` | [claude-skills-gcse-tutors/skills/gcse-history-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/tree/main/skills/gcse-history-tutor) |
| `skills/gcse-maths-tutor/` | [claude-skills-gcse-tutors/skills/gcse-maths-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/tree/main/skills/gcse-maths-tutor) |
| `skills/gcse-pe-tutor/` | [claude-skills-gcse-tutors/skills/gcse-pe-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/tree/main/skills/gcse-pe-tutor) |
| `skills/gcse-physics-tutor/` | [claude-skills-gcse-tutors/skills/gcse-physics-tutor](https://github.com/markpitt/claude-skills-gcse-tutors/tree/main/skills/gcse-physics-tutor) |
| `skills/genaiscript/` | [claude-skills-ai-engineering/skills/genaiscript](https://github.com/markpitt/claude-skills-ai-engineering/tree/main/skills/genaiscript) |
| `skills/github-api/` | [claude-skills-api/skills/github-api](https://github.com/markpitt/claude-skills-api/tree/main/skills/github-api) |
| `skills/gof-design-patterns/` | [claude-skills-engineering-practices/skills/gof-design-patterns](https://github.com/markpitt/claude-skills-engineering-practices/tree/main/skills/gof-design-patterns) |
| `skills/home-assistant-api/` | [claude-skills-api/skills/home-assistant-api](https://github.com/markpitt/claude-skills-api/tree/main/skills/home-assistant-api) |
| `skills/kiss-principle/` | [claude-skills-engineering-practices/skills/kiss-principle](https://github.com/markpitt/claude-skills-engineering-practices/tree/main/skills/kiss-principle) |
| `skills/markdown-formatter/` | [claude-skills-dev-environment/skills/markdown-formatter](https://github.com/markpitt/claude-skills-dev-environment/tree/main/skills/markdown-formatter) |
| `skills/microsoft-graph/` | [claude-skills-api/skills/microsoft-graph-api](https://github.com/markpitt/claude-skills-api/tree/main/skills/microsoft-graph-api) |
| `skills/mise/` | [claude-skills-dev-environment/skills/mise](https://github.com/markpitt/claude-skills-dev-environment/tree/main/skills/mise) |
| `skills/root-cause-analysis/` | [claude-skills-engineering-practices/skills/root-cause-analysis](https://github.com/markpitt/claude-skills-engineering-practices/tree/main/skills/root-cause-analysis) |
| `skills/thought-patterns/` | [claude-skills-ai-engineering/skills/thought-patterns](https://github.com/markpitt/claude-skills-ai-engineering/tree/main/skills/thought-patterns) |
| `skills/twelve-factor-app/` | [claude-skills-engineering-practices/skills/twelve-factor-app](https://github.com/markpitt/claude-skills-engineering-practices/tree/main/skills/twelve-factor-app) |

The old tree is still in this repository's history, before the 2.0.0 tag.

## The toolchain

The scripts here run against the group repositories, checked out side by side. `SKILL_GROUPS_DIR` names the directory that holds them, one checkout per group, named as in [groups.json](groups.json). The release and site workflows do exactly that.

```bash
mkdir -p .groups
for g in $(python3 -c "import json; print(' '.join(x['id'] for x in json.load(open('groups.json'))['groups']))"); do
  git clone --depth 1 "https://github.com/markpitt/$g.git" ".groups/$g"
done
export SKILL_GROUPS_DIR="$PWD/.groups"

mise run skill:validate        # frontmatter, naming and links in every SKILL.md
mise run skill:index:check     # CATALOGUE.md and the group tables match the skills
mise run skill:package:all     # one zip per skill into dist/skills/
```

[skills-tui](skills-tui/README.md) is a terminal browser for a skills directory: filter, read and install skills from the keyboard. Build it with `cargo build --release` in `skills-tui/` and point it at any `skills/` folder.

## Contributing

Open an issue here for the index, the site or the toolchain. For a skill, open it on that skill's group repository.

## Licence

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full text and [NOTICE](./NOTICE) for the copyright statement.

Copyright 2026 Mark Pitt.
