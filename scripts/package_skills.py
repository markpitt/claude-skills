#!/usr/bin/env python3
"""Build one distributable zip per skill, plus a manifest.

Each archive is a standalone distribution: unzipping gives `<skill>/` with its
SKILL.md, LICENSE, README and bundled files, ready to drop into
~/.claude/skills/ or upload to Claude Desktop.

Every skill is validated before its archive is written. Publishing 42 archives
that fail on upload is worse than publishing none, and the frontmatter
allowlist that Anthropic's packager enforces is exactly the kind of thing that
passes review and fails at the point of use.

Archives are reproducible: fixed timestamps and sorted entries, so rebuilding
the same commit produces identical bytes and release assets do not churn.

Usage:
    python scripts/package_skills.py                    # build into dist/skills
    python scripts/package_skills.py --version v1.2.3   # stamp the manifest
    python scripts/package_skills.py --out DIR
"""

from __future__ import annotations

import hashlib
import json
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import skill_roots  # noqa: E402
import validate_skills as vs  # noqa: E402

REPO_ROOT = skill_roots.REPO_ROOT
DEFAULT_OUT = REPO_ROOT / "dist" / "skills"

# A fixed timestamp keeps archives byte-identical between builds. Zip stores
# DOS times, whose epoch is 1980, so this is the earliest legal value.
FIXED_TIME = (1980, 1, 1, 0, 0, 0)

EXCLUDE_NAMES = {".DS_Store", "Thumbs.db"}
EXCLUDE_SUFFIXES = {".pyc"}
EXCLUDE_DIRS = {"__pycache__", ".git"}


class PackagingError(RuntimeError):
    """A skill cannot be packaged, so nothing is written for it."""


def _files(skill_dir: Path) -> list[Path]:
    out = []
    for path in skill_dir.rglob("*"):
        if not path.is_file():
            continue
        if path.name in EXCLUDE_NAMES or path.suffix in EXCLUDE_SUFFIXES:
            continue
        if EXCLUDE_DIRS & set(path.relative_to(skill_dir).parts):
            continue
        out.append(path)
    return sorted(out, key=lambda p: str(p.relative_to(skill_dir)))


def validate(skill_dir: Path) -> None:
    """Everything that would make the archive useless to a recipient."""
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.is_file():
        raise PackagingError(f"{skill_dir.name}: no SKILL.md")

    errors = [f.message for f in vs.validate_file(skill_md) if f.fatal]
    if errors:
        raise PackagingError(f"{skill_dir.name}: " + "; ".join(errors))

    if not (skill_dir / "LICENSE").is_file():
        raise PackagingError(
            f"{skill_dir.name}: no LICENSE. Apache-2.0 section 4(a) requires the "
            f"licence to travel with the work; run 'mise run skill:sync'"
        )


def package(skill_dir: Path, out_dir: Path) -> Path:
    validate(skill_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    archive = out_dir / f"{skill_dir.name}.zip"

    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as z:
        for path in _files(skill_dir):
            arcname = f"{skill_dir.name}/{path.relative_to(skill_dir).as_posix()}"
            info = zipfile.ZipInfo(arcname, date_time=FIXED_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            z.writestr(info, path.read_bytes())
    return archive


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    digest.update(path.read_bytes())
    return digest.hexdigest()


def build_manifest(archives: list[Path], version: str) -> dict:
    return {
        "version": version,
        "count": len(archives),
        "skills": [
            {"name": a.stem, "file": a.name, "sha256": sha256(a), "bytes": a.stat().st_size}
            for a in sorted(archives, key=lambda p: p.name)
        ],
    }


def package_all(skills_root: Path | list[Path], out_dir: Path) -> list[Path]:
    roots = skills_root if isinstance(skills_root, list) else [skills_root]
    for root in skill_roots.missing_roots(roots):
        raise PackagingError(f"skills root does not exist: {root}")

    try:
        all_dirs = skill_roots.skill_dirs(roots)
    except skill_roots.DuplicateSkill as exc:
        raise PackagingError(str(exc)) from exc
    skill_dirs = [p for p in all_dirs if (p / "SKILL.md").is_file()]
    if not skill_dirs:
        raise PackagingError(f"no skills found under {', '.join(map(str, roots))}")

    # Reconcile against an independent count. A directory holding a skill but
    # no SKILL.md would otherwise be skipped silently.
    missing = sorted(p.name for p in all_dirs if not (p / "SKILL.md").is_file())
    if missing:
        raise PackagingError(f"{len(missing)} directory(ies) have no SKILL.md: {missing}")

    failures: list[str] = []
    archives: list[Path] = []
    for skill_dir in skill_dirs:
        try:
            archives.append(package(skill_dir, out_dir))
        except PackagingError as exc:
            failures.append(str(exc))

    if failures:
        raise PackagingError(
            f"{len(failures)} of {len(skill_dirs)} skills failed to package:\n  "
            + "\n  ".join(failures)
        )
    return archives


def main(argv: list[str]) -> int:
    out = Path(argv[argv.index("--out") + 1]) if "--out" in argv else DEFAULT_OUT
    version = argv[argv.index("--version") + 1] if "--version" in argv else "dev"

    try:
        archives = package_all(skill_roots.skills_roots(), out)
    except PackagingError as exc:
        print(f"FATAL: {exc}", file=sys.stderr)
        return 1

    manifest = build_manifest(archives, version)
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    total = sum(s["bytes"] for s in manifest["skills"])
    manifest_path = out / "manifest.json"
    # --out may point anywhere, including outside the repository, so relative_to
    # is not safe here. Report the absolute path when it does not sit under the
    # repository root rather than raising after the archives are already written.
    try:
        shown = manifest_path.relative_to(REPO_ROOT)
    except ValueError:
        shown = manifest_path
    print(f"packaged {len(archives)} skills into {out} ({total / 1024:.0f} KiB)")
    print(f"manifest: {shown}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
