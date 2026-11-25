"""Where the skills live.

The skills used to sit in one directory, `skills/` under this repository. Since
18/11/2026 they are split into seven groups, each a directory beside
claude-skills in the monorepo (`../claude-skills-dotnet/skills/`, `../claude-skills-gcse-tutors/skills/`
and so on). `groups.json` lists the groups; the disk decides which skills each
one holds. Every script and test resolves skills through this module, so the
layout is stated once.

Resolution, first match wins:

1. `SKILLS_ROOTS`, a list of skills directories separated by `os.pathsep`.
   For tests and one-off runs against another tree.
2. `groups.json`, when present: each group's `skills/` directory, plus this
   repository's own `skills/` if it still holds any skill. `SKILL_GROUPS_DIR`, when set, is
   a directory holding one checkout per group named by its id, and replaces each group's
   `path`. The public twin's Pages workflow uses it, because the twin does not hold the
   skills: it checks the seven group repositories out side by side.
3. This repository's `skills/`, the layout before the split. A tree with no
   `groups.json` (the public twin as it stands) keeps working unchanged.

A group listed in `groups.json` whose directory is missing is a configuration
error, reported by `missing_roots()`. Silently skipping it would make a typo
read as "this group has no skills".
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
GROUPS_FILE = REPO_ROOT / "groups.json"
LOCAL_SKILLS = REPO_ROOT / "skills"


@dataclass(frozen=True)
class Group:
    id: str
    title: str
    summary: str
    root: Path
    # The group's public twin, `owner/name`. Empty only for a group not yet published.
    public_repo: str = ""

    @property
    def url(self) -> str:
        """The group's public repository on GitHub, or empty if it has none."""
        return f"https://github.com/{self.public_repo}" if self.public_repo else ""

    @property
    def skills_root(self) -> Path:
        return self.root / "skills"

    @property
    def index_file(self) -> Path:
        return self.root / "README.md"


def load_groups(groups_file: Path = GROUPS_FILE) -> list[Group]:
    if not groups_file.is_file():
        return []
    data = json.loads(groups_file.read_text(encoding="utf-8"))
    checkouts = os.environ.get("SKILL_GROUPS_DIR", "").strip()
    return [
        Group(
            id=g["id"],
            title=g["title"],
            summary=g["summary"],
            root=(Path(checkouts) / g["id"]).resolve()
            if checkouts
            else (groups_file.parent / g["path"]).resolve(),
            public_repo=g.get("public_repo", ""),
        )
        for g in data["groups"]
    ]


def _has_skills(root: Path) -> bool:
    return root.is_dir() and any((p / "SKILL.md").exists() for p in root.iterdir() if p.is_dir())


def skills_roots() -> list[Path]:
    """Every configured skills directory, existing or not, in a stable order."""
    override = os.environ.get("SKILLS_ROOTS", "").strip()
    if override:
        return [Path(p).resolve() for p in override.split(os.pathsep) if p]
    groups = load_groups()
    if not groups:
        return [LOCAL_SKILLS]
    roots = [g.skills_root for g in groups]
    if _has_skills(LOCAL_SKILLS):
        roots.append(LOCAL_SKILLS)
    return roots


def missing_roots(roots: list[Path] | None = None) -> list[Path]:
    return [r for r in (roots if roots is not None else skills_roots()) if not r.is_dir()]


class DuplicateSkill(Exception):
    pass


def skill_dirs(roots: list[Path] | None = None) -> list[Path]:
    """Every directory directly under a skills root, sorted by skill name.

    Includes directories with no SKILL.md, so the validator can report them.
    Two skills with the same name in different groups would install over each
    other in ~/.claude/skills/, so that raises rather than picking one.
    """
    seen: dict[str, Path] = {}
    for root in roots if roots is not None else skills_roots():
        if not root.is_dir():
            continue
        for d in root.iterdir():
            if not d.is_dir():
                continue
            if d.name in seen:
                raise DuplicateSkill(f"skill {d.name!r} is in both {seen[d.name]} and {d}")
            seen[d.name] = d
    return [seen[name] for name in sorted(seen)]


def find_skill(name: str, roots: list[Path] | None = None) -> Path:
    """The directory of a named skill. Raises FileNotFoundError naming the roots searched."""
    roots = roots if roots is not None else skills_roots()
    for root in roots:
        if (root / name / "SKILL.md").exists():
            return root / name
    searched = ", ".join(str(r) for r in roots)
    raise FileNotFoundError(f"SKILL.md not found for skill {name!r}; searched: {searched}")


def group_of(skill_dir: Path, groups: list[Group] | None = None) -> Group | None:
    resolved = skill_dir.resolve()
    for g in groups if groups is not None else load_groups():
        if resolved.parent == g.skills_root:
            return g
    return None


def describe(path: Path) -> str:
    """A path relative to the monorepo root when it is inside it, for messages."""
    try:
        return str(path.resolve().relative_to(REPO_ROOT.parent))
    except ValueError:
        return str(path)
