#!/usr/bin/env bash
# Static validation: SKILL.md frontmatter, structure and resource references,
# then markdown linting. Run from the repository root.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

uv run --with pyyaml python scripts/validate_skills.py
# The skills live in the group directories beside this repository (groups.json).
npx --yes markdownlint-cli2 "../*/skills/*/SKILL.md"
