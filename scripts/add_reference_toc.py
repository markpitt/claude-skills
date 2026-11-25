#!/usr/bin/env python3
"""Add a contents list to large reference files.

Anthropic's guidance: "For reference files longer than 100 lines, include a
table of contents at the top. This ensures Claude can see the full scope of
available information even when previewing with partial reads."

Partial reads are the reason it matters. Claude may preview a referenced file
with head -100 instead of reading it whole, so a 900-line file with no contents
list looks like whatever its first hundred lines happen to be.

The threshold here is 600 rather than 100. That is where the gap is worst, and
it keeps the change to 32 files rather than 164. Files between 100 and 600
lines mostly fit in a single read.

Usage:
    python scripts/add_reference_toc.py           # insert where missing
    python scripts/add_reference_toc.py --check   # exit 1 if any are missing
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import skill_roots  # noqa: E402

REPO_ROOT = skill_roots.REPO_ROOT

THRESHOLD = 600
MIN_HEADINGS = 2

FENCE = re.compile(r"^\s*(```|~~~)")
H2 = re.compile(r"^##\s+(.+?)\s*$")
CONTENTS_HEADING = re.compile(r"^##\s+(Contents|Table of Contents)\s*$", re.IGNORECASE)
# Bullet or numbered. Four files already carried a hand-written numbered
# contents list, and reading only bullets reported them as having no links.
ANCHOR_LINK = re.compile(r"^\s*(?:[-*]|\d+\.)\s*\[[^\]]+\]\(#([^)]+)\)")


def slug(heading: str) -> str:
    """GitHub's anchor rules: lowercase, drop punctuation, spaces to hyphens."""
    text = heading.strip().lower()
    text = re.sub(r"`([^`]*)`", r"\1", text)
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"\s+", "-", text.strip())


def headings(text: str) -> list[str]:
    """Every H2, skipping anything inside a fenced code block."""
    out: list[str] = []
    in_fence = False
    for line in text.splitlines():
        if FENCE.match(line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        match = H2.match(line)
        if match and not CONTENTS_HEADING.match(line):
            out.append(match.group(1))
    return out


def has_toc(text: str) -> bool:
    in_fence = False
    for line in text.splitlines():
        if FENCE.match(line):
            in_fence = not in_fence
            continue
        if not in_fence and CONTENTS_HEADING.match(line):
            return True
    return False


def listed_anchors(text: str) -> set[str]:
    """Anchors linked from inside the contents block only."""
    found: set[str] = set()
    in_block = False
    in_fence = False
    for line in text.splitlines():
        if FENCE.match(line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        if CONTENTS_HEADING.match(line):
            in_block = True
            continue
        if in_block:
            match = ANCHOR_LINK.match(line)
            if match:
                found.add(match.group(1))
            elif line.strip() and not re.match(r"^(\s|[-*]|\d+\.)", line):
                break
    return found


def anchors(items: list[str]) -> list[str]:
    """Anchors for headings in document order, disambiguated as GitHub does.

    Two headings can slug to the same string: "## C#" and "## C" both give
    "c", because the punctuation is stripped. GitHub suffixes the second and
    later occurrences with -1, -2, and so on. gof-design-patterns'
    language-guide.md has exactly that pair, and a contents list that ignored
    it would link the second entry to the first heading.
    """
    seen: dict[str, int] = {}
    out: list[str] = []
    for heading in items:
        base = slug(heading)
        count = seen.get(base, 0)
        out.append(base if count == 0 else f"{base}-{count}")
        seen[base] = count + 1
    return out


def render(items: list[str]) -> str:
    lines = ["## Contents", ""]
    lines += [f"- [{h}](#{a})" for h, a in zip(items, anchors(items))]
    return "\n".join(lines)


def insert(text: str) -> str:
    """Put the contents list after the intro, before the first H2."""
    if has_toc(text):
        return text
    items = headings(text)
    if len(items) < MIN_HEADINGS:
        return text

    lines = text.splitlines()
    in_fence = False
    first_h2 = None
    for i, line in enumerate(lines):
        if FENCE.match(line):
            in_fence = not in_fence
            continue
        if not in_fence and H2.match(line):
            first_h2 = i
            break
    if first_h2 is None:
        return text

    block = render(items).splitlines()
    before = lines[:first_h2]
    while before and not before[-1].strip():
        before.pop()
    out = before + [""] + block + [""] + lines[first_h2:]
    return "\n".join(out) + ("\n" if text.endswith("\n") else "")


def large_files() -> list[Path]:
    return sorted(
        p
        for root in skill_roots.skills_roots()
        for p in root.glob("*/*/*.md")
        if p.parent.name in ("resources", "references")
        and len(p.read_text(encoding="utf-8").splitlines()) > THRESHOLD
    )


def main(argv: list[str]) -> int:
    missing_roots = skill_roots.missing_roots()
    if missing_roots:
        for root in missing_roots:
            print(f"FATAL: skills root does not exist: {root}", file=sys.stderr)
        return 2
    files = large_files()
    if not files:
        print(f"FATAL: no reference files over {THRESHOLD} lines found", file=sys.stderr)
        return 2

    missing = [p for p in files if not has_toc(p.read_text(encoding="utf-8"))]

    if "--check" in argv:
        if missing:
            print(f"{len(missing)} reference file(s) over {THRESHOLD} lines have no contents list:",
                  file=sys.stderr)
            for p in missing:
                print(f"  {skill_roots.describe(p)}", file=sys.stderr)
            print("       run 'mise run skill:toc' and commit the result.", file=sys.stderr)
            return 1
        print(f"all {len(files)} reference files over {THRESHOLD} lines have a contents list")
        return 0

    written = 0
    for path in missing:
        text = path.read_text(encoding="utf-8")
        new = insert(text)
        if new != text:
            path.write_text(new, encoding="utf-8")
            written += 1
    skipped = len(missing) - written
    print(f"added a contents list to {written} file(s) of {len(files)} over {THRESHOLD} lines")
    if skipped:
        print(f"  {skipped} skipped: fewer than {MIN_HEADINGS} H2 headings")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
