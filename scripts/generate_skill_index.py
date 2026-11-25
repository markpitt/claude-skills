#!/usr/bin/env python3
"""Generate the skill index tables: one per group README, and CATALOGUE.md.

The list was maintained by hand and drifted: skills/README.md covered 31 of 42
skills and the root README 5 of 42. Generating it from the skills themselves is
the only fix that stays fixed.

Usage:
    python scripts/generate_skill_index.py           # rewrite the table
    python scripts/generate_skill_index.py --check   # exit 1 if stale, write nothing

Requires PyYAML.
"""

from __future__ import annotations

import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
import skill_roots  # noqa: E402

REPO_ROOT = skill_roots.REPO_ROOT
# Before the 18/11/2026 split: one table, in skills/README.md.
LEGACY_INDEX = Path("skills") / "README.md"
# After it: one table per group in <group>/README.md, and every group in
# CATALOGUE.md here, which is the front door that lists them all.
CATALOGUE = Path("CATALOGUE.md")

BEGIN = "<!-- BEGIN GENERATED SKILL INDEX -->"
END = "<!-- END GENERATED SKILL INDEX -->"

DESCRIPTION_LIMIT = 110

# Split on a full stop only when it ends a word and is followed by a capital or
# a digit. A naive split on "." cuts ".NET" and "Node.js" in half.
SENTENCE_END = re.compile(r"(?<=[a-z0-9)\]])[.!?](?=\s+[A-Z0-9])")


@dataclass(frozen=True)
class SkillRow:
    name: str
    summary: str
    resources: int


def first_sentence(description: str, limit: int = DESCRIPTION_LIMIT) -> str:
    """The first sentence, truncated on a word boundary if it runs long."""
    text = " ".join(description.split())
    match = SENTENCE_END.search(text)
    if match:
        text = text[: match.end()]
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0].rstrip(",;:") + "…"


def resource_count(skill_dir: Path) -> int:
    """Bundled files under either directory name, any extension.

    Counts .txt and .json as well as .md: they ship in the package and a reader
    comparing this number against the directory should get the same answer.
    """
    return sum(
        1
        for sub in ("resources", "references")
        if (skill_dir / sub).is_dir()
        for f in (skill_dir / sub).iterdir()
        if f.is_file()
    )


def collect(skills_root: Path) -> list[SkillRow]:
    rows: list[SkillRow] = []
    for skill_dir in sorted(p for p in skills_root.iterdir() if p.is_dir()):
        md = skill_dir / "SKILL.md"
        if not md.exists():
            continue
        parts = md.read_text(encoding="utf-8").split("---", 2)
        meta = yaml.safe_load(parts[1]) if len(parts) >= 3 else None
        description = str(meta.get("description", "")) if isinstance(meta, dict) else ""
        rows.append(
            SkillRow(skill_dir.name, first_sentence(description), resource_count(skill_dir))
        )
    return rows


def render_table(rows: list[SkillRow], prefix: str = "", total: bool = True) -> str:
    lines = ["| Skill | Bundled files | What it does |", "|---|---|---|"]
    for row in rows:
        count = "none" if row.resources == 0 else f"{row.resources} file" + (
            "" if row.resources == 1 else "s"
        )
        lines.append(f"| [{row.name}]({prefix}{row.name}/SKILL.md) | {count} | {row.summary} |")
    if total:
        lines.append("")
        lines.append(f"{len(rows)} skills.")
    return "\n".join(lines)


def render_catalogue(groups: list[skill_roots.Group], catalogue_dir: Path) -> str:
    """Every group, with its own table.

    A group with a public repository is linked there, not relative to the catalogue. The
    catalogue ships in the public claude-skills, which holds no skills of its own, so a
    relative `../<group>/` link would point at nothing there. Absolute links read the same
    in the monorepo and on the twin, so `--check` passes in both.
    """
    sections: list[str] = []
    total = 0
    for g in groups:
        rows = collect(g.skills_root)
        total += len(rows)
        if g.url:
            readme, prefix = f"{g.url}#readme", f"{g.url}/blob/main/skills/"
        else:
            rel = Path(os.path.relpath(g.root, catalogue_dir)).as_posix()
            readme, prefix = f"{rel}/README.md", f"{rel}/skills/"
        sections.append(
            f"### [{g.title}]({readme})\n\n"
            f"`{g.id}`, {len(rows)} skills. {g.summary}\n\n"
            + render_table(rows, prefix=prefix, total=False)
        )
    sections.append(f"{total} skills in {len(groups)} groups.")
    return "\n\n".join(sections)


def splice(document: str, table: str, name: str = "index") -> str:
    if BEGIN not in document or END not in document:
        raise ValueError(f"{name} has no {BEGIN} / {END} marker pair")
    head, rest = document.split(BEGIN, 1)
    _, tail = rest.split(END, 1)
    return f"{head}{BEGIN}\n{table}\n{END}{tail}"


def expected(repo_root: Path) -> dict[Path, str]:
    """Every generated index file, mapped to the content it should have."""
    groups = skill_roots.load_groups(repo_root / "groups.json")
    if not groups:
        index = repo_root / LEGACY_INDEX
        table = render_table(collect(repo_root / "skills"))
        return {index: splice(index.read_text(encoding="utf-8"), table, str(index))}
    out: dict[Path, str] = {}
    for g in groups:
        current = g.index_file.read_text(encoding="utf-8")
        out[g.index_file] = splice(
            current, render_table(collect(g.skills_root), prefix="skills/"), str(g.index_file)
        )
    catalogue = repo_root / CATALOGUE
    out[catalogue] = splice(
        catalogue.read_text(encoding="utf-8"), render_catalogue(groups, repo_root), str(catalogue)
    )
    return out


def check(repo_root: Path) -> str:
    """Empty string when every index is current, otherwise which ones drifted."""
    stale = [
        skill_roots.describe(path)
        for path, content in expected(repo_root).items()
        if path.read_text(encoding="utf-8") != content
    ]
    return f"out of date: {', '.join(stale)}" if stale else ""


def count(repo_root: Path) -> int:
    groups = skill_roots.load_groups(repo_root / "groups.json")
    roots = [g.skills_root for g in groups] or [repo_root / "skills"]
    return sum(len(collect(r)) for r in roots)


def main(argv: list[str]) -> int:
    missing = skill_roots.missing_roots()
    if missing:
        for root in missing:
            print(f"FATAL: skills root does not exist: {root}", file=sys.stderr)
        return 2

    if "--check" in argv:
        stale = check(REPO_ROOT)
        if stale:
            print(f"skill index {stale}", file=sys.stderr)
            print("       run 'mise run skill:index' and commit the result.", file=sys.stderr)
            return 1
        print(f"skill indexes are current ({count(REPO_ROOT)} skills)")
        return 0

    for path, content in expected(REPO_ROOT).items():
        path.write_text(content, encoding="utf-8")
        print(f"wrote {skill_roots.describe(path)}")
    print(f"{count(REPO_ROOT)} skills indexed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
