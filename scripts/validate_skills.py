#!/usr/bin/env python3
"""Static validation for every SKILL.md in the repository.

Errors fail the build. Warnings are reported and do not, so that house-style
conventions can be adopted incrementally without a permanently red gate.

Usage:
    python scripts/validate_skills.py            # validate
    python scripts/validate_skills.py paths      # print resolved paths and exit
    python scripts/validate_skills.py --strict   # treat warnings as errors

Requires PyYAML.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
import skill_roots  # noqa: E402

# Roots are derived from this file's own location, not the caller's working
# directory. Since the 18/11/2026 split the skills live in seven group
# directories; skill_roots.py says where.
REPO_ROOT = skill_roots.REPO_ROOT

MAX_LINES = 500
MAX_NAME = 64
MAX_DESCRIPTION = 1024

# The set Anthropic's packager enforces, copied from
# anthropics/skills/skills/skill-creator/scripts/quick_validate.py:
#
#     ALLOWED_PROPERTIES = {'name', 'description', 'license', 'allowed-tools',
#                           'metadata', 'compatibility'}
#     # Check for unexpected properties (excluding nested keys under metadata)
#     unexpected_keys = set(frontmatter.keys()) - ALLOWED_PROPERTIES
#
# package_skill.py runs that before zipping and aborts on failure, so a key
# outside this set does not get ignored: it stops the skill being packaged for
# claude.ai, the Skills API, or a Claude Desktop upload. That makes it an
# error here rather than a warning.
#
# Claude Code accepts a larger set (when_to_use, argument-hint, model, paths
# and others). Those are fine in a skill that will never be packaged, and are
# still rejected here, because everything in this repository is meant to be
# installable by anyone.
#
# Nested keys under `metadata` are deliberately not checked, matching the
# comment above: it is a free-form map.
SPEC_FRONTMATTER_KEYS = {
    "name",
    "description",
    "license",
    "allowed-tools",
    "metadata",
    "compatibility",
}

# SKILL.md files in this repository reference their resources three ways:
# inside backticks, as a markdown link target, and bare in a table cell. All
# three are recognised, because a reference the tooling cannot see is a file
# that silently never loads.
#
# The directory prefix is required in every form. A bare `foo.md` is not
# matched, since that is ambiguous with a filename example code writes at
# runtime. Fenced code is stripped first for the same reason.
RESOURCE_REF = re.compile(
    r"`((?:resources|references)/[^`\s]+\.md)`"       # `resources/foo.md`
    r"|\]\(((?:resources|references)/[^)\s]+\.md)\)"  # [text](resources/foo.md)
    r"|(?<![`(/\w])((?:resources|references)/[\w.-]+\.md)\b"  # bare
)
FENCE = re.compile(r"^\s*(?:```|~~~).*?^\s*(?:```|~~~)", re.M | re.S)


def find_resource_refs(text: str) -> tuple[set[str], set[str]]:
    """Resource paths SKILL.md points at, as (explicit, bare).

    Explicit means backticked or a markdown link target: unambiguous, so a
    missing file is an error. Bare means plain text in a table cell or prose,
    which is how several skills route, but which can also legitimately name a
    file the skill writes at runtime. Both count towards reachability; only
    explicit ones fail the build when the target is absent.
    """
    body = FENCE.sub("", text)
    explicit: set[str] = set()
    bare: set[str] = set()
    for m in RESOURCE_REF.finditer(body):
        tick, link, plain = m.groups()
        if tick or link:
            explicit.add(tick or link)
        else:
            bare.add(plain)
    return explicit, bare - explicit


KEBAB = re.compile(r"^[a-z][a-z0-9-]*$")
FIRST_PERSON = re.compile(r"\b(I|we|our|my)\b", re.IGNORECASE)

# House conventions, not Anthropic requirements. Neither phrasing is mandated
# by the Agent Skills docs, so both stay warnings.
#
# Match the intent rather than one exact string: "Use ONLY when" and "Do NOT
# trigger for" are stronger trigger and exclusion clauses than the plain forms,
# and warning on them would penalise the better description.
USE_WHEN = re.compile(r"\buse\s+(?:this\s+|the\s+)?(?:skill\s+)?(?:only\s+)?when\b", re.IGNORECASE)
EXCLUSION = re.compile(r"\bdo\s+not\s+(?:use|trigger|invoke|apply)\b", re.IGNORECASE)


class Finding:
    __slots__ = ("skill", "message", "fatal")

    def __init__(self, skill: str, message: str, fatal: bool) -> None:
        self.skill = skill
        self.message = message
        self.fatal = fatal


def find_skill_files(roots: list[Path] | None = None) -> list[Path]:
    """Every SKILL.md one level under each skills root, matched case-insensitively.

    A case-sensitive glob silently skips a file named SKILL.MD and reports a
    total that looks complete. Suffix comparison is lowercased for the same
    reason.
    """
    return sorted(
        (
            p
            for root in (roots if roots is not None else skill_roots.skills_roots())
            for p in root.glob("*/*")
            if p.is_file() and p.name.lower() == "skill.md"
        ),
        key=lambda p: p.parent.name,
    )


def validate_file(path: Path) -> list[Finding]:
    skill = path.parent.name
    findings: list[Finding] = []

    def err(msg: str) -> None:
        findings.append(Finding(skill, msg, True))

    def warn(msg: str) -> None:
        findings.append(Finding(skill, msg, False))

    text = path.read_text(encoding="utf-8")

    if not text.startswith("---"):
        err("no YAML frontmatter block")
        return findings

    parts = text.split("---", 2)
    if len(parts) < 3:
        err("frontmatter block is not closed")
        return findings

    try:
        meta = yaml.safe_load(parts[1])
    except yaml.YAMLError as exc:
        err(f"frontmatter is not valid YAML: {str(exc).splitlines()[0]}")
        return findings

    if not isinstance(meta, dict):
        err(f"frontmatter is {type(meta).__name__}, expected a mapping")
        return findings

    unexpected = sorted(set(meta) - SPEC_FRONTMATTER_KEYS)
    if unexpected:
        allowed = ", ".join(sorted(SPEC_FRONTMATTER_KEYS))
        err(
            f"unexpected frontmatter key(s): {', '.join(unexpected)}. "
            f"Allowed properties are: {allowed}. "
            f"Packaging for claude.ai or the Skills API fails on these; "
            f"put your own fields under 'metadata'"
        )

    name = meta.get("name")
    if not name:
        err("frontmatter has no 'name'")
    else:
        if name != skill:
            err(f"name {name!r} does not match directory {skill!r}")
        if not KEBAB.match(str(name)):
            err(f"name {name!r} is not kebab-case")
        if len(str(name)) > MAX_NAME:
            err(f"name is {len(str(name))} chars, limit {MAX_NAME}")

    description = meta.get("description")
    if not description:
        err("frontmatter has no 'description'")
    else:
        description = str(description)
        if len(description) > MAX_DESCRIPTION:
            err(f"description is {len(description)} chars, limit {MAX_DESCRIPTION}")
        if not USE_WHEN.search(description):
            warn("description has no 'Use when' trigger phrase")
        if not EXCLUSION.search(description):
            warn("description has no 'Do NOT use for' exclusion")
        if FIRST_PERSON.search(description):
            warn("description uses first person; prefer third person")

    line_count = len(text.splitlines())
    if line_count > MAX_LINES:
        warn(f"SKILL.md is {line_count} lines, guideline is {MAX_LINES}")

    explicit_refs, bare_refs = find_resource_refs(text)
    referenced = explicit_refs | bare_refs
    for ref in sorted(explicit_refs):
        if not (path.parent / ref).exists():
            err(f"referenced resource does not exist: {ref}")
    for ref in sorted(bare_refs):
        if not (path.parent / ref).exists():
            warn(f"mentions {ref}, which does not exist (bare path, may be runtime output)")

    for sub in ("resources", "references"):
        sub_dir = path.parent / sub
        if sub_dir.is_dir():
            nested = [p for p in sub_dir.iterdir() if p.is_dir()]
            if nested:
                names = ", ".join(sorted(p.name for p in nested))
                warn(f"{sub}/ should be one level deep, found: {names}")

            # A resource file SKILL.md never names, in any of the three
            # syntaxes, is never loaded into a composed prompt. Only meaningful
            # when the skill references something: with no references at all the
            # loader falls back to globbing the directory, so nothing is orphaned.
            if referenced:
                on_disk = {f"{sub}/{p.name}" for p in sub_dir.glob("*.md")}
                for orphan in sorted(on_disk - referenced):
                    warn(f"unreachable resource, never referenced by SKILL.md: {orphan}")

            for resource in sub_dir.glob("*.md"):
                nested_explicit, _ = find_resource_refs(
                    resource.read_text(encoding="utf-8")
                )
                for nested_ref in sorted(nested_explicit):
                    if not (path.parent / nested_ref).exists():
                        err(f"{sub}/{resource.name} references missing {nested_ref}")

    return findings


def print_paths() -> int:
    roots = skill_roots.skills_roots()
    print(f"script      {Path(__file__).resolve()}")
    print(f"repo root   {REPO_ROOT}")
    print(f"groups file {skill_roots.GROUPS_FILE} (exists: {skill_roots.GROUPS_FILE.is_file()})")
    for root in roots:
        count = sum(1 for p in root.iterdir() if p.is_dir()) if root.is_dir() else 0
        state = f"{count} skill dirs" if root.is_dir() else "MISSING"
        print(f"skills root {skill_roots.describe(root)}  {state}")
    print(f"SKILL.md    {len(find_skill_files(roots))}")
    return 1 if skill_roots.missing_roots(roots) else 0


def main(argv: list[str]) -> int:
    if "paths" in argv:
        return print_paths()

    strict = "--strict" in argv

    # A wrong root makes glob return nothing, which otherwise reads as
    # "nothing to validate" and exits successfully. Fail loudly instead.
    roots = skill_roots.skills_roots()
    missing_roots = skill_roots.missing_roots(roots)
    if missing_roots:
        for root in missing_roots:
            print(f"FATAL: skills root does not exist: {root}", file=sys.stderr)
        print("       run 'validate_skills.py paths' to see what resolved.", file=sys.stderr)
        return 2

    try:
        skill_dirs = skill_roots.skill_dirs(roots)
    except skill_roots.DuplicateSkill as exc:
        print(f"FATAL: {exc}", file=sys.stderr)
        return 2
    files = find_skill_files(roots)

    if not files:
        print(f"FATAL: no SKILL.md found under {', '.join(map(str, roots))}", file=sys.stderr)
        return 2

    # Reconcile against an independent count. A sweep that only reports the
    # number its own glob found cannot detect what the glob missed.
    missing = sorted(d.name for d in skill_dirs if not (d / "SKILL.md").exists())
    if missing:
        print(f"FATAL: {len(missing)} skill director(ies) have no SKILL.md:", file=sys.stderr)
        for name in missing:
            print(f"       {name}", file=sys.stderr)
        return 2

    if len(files) != len(skill_dirs):
        print(
            f"FATAL: found {len(files)} SKILL.md but {len(skill_dirs)} skill directories",
            file=sys.stderr,
        )
        return 2

    errors: list[Finding] = []
    warnings: list[Finding] = []

    for path in files:
        findings = validate_file(path)
        if not findings:
            print(f"  ok    {path.parent.name}")
            continue
        fatal = [f for f in findings if f.fatal]
        print(f"  {'FAIL ' if fatal else 'warn '} {path.parent.name}")
        for f in findings:
            print(f"          {'error' if f.fatal else 'warn'}: {f.message}")
            (errors if f.fatal else warnings).append(f)

    print()
    print(
        f"{len(files)} skills across {len(roots)} skills root(s), "
        f"reconciled against {len(skill_dirs)} directories"
    )
    print(f"{len(errors)} error(s), {len(warnings)} warning(s)")

    if warnings and not strict:
        by_kind: dict[str, int] = {}
        for w in warnings:
            key = re.sub(r"\d+", "N", w.message.split(";")[0].split(",")[0])
            by_kind[key] = by_kind.get(key, 0) + 1
        print("\nwarning classes (not failing the build):")
        for kind, count in sorted(by_kind.items(), key=lambda kv: -kv[1]):
            print(f"  {count:3d}  {kind}")

    if errors:
        return 1
    if warnings and strict:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
