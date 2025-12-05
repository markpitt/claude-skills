#!/usr/bin/env python3
"""
Package and validate a Claude Skill for distribution.

Usage:
    ./package_skill.py <path/to/skill-folder> [output-directory]

Example:
    ./package_skill.py ./skills/my-skill
    ./package_skill.py ./skills/my-skill ./dist
"""

import argparse
import os
import re
import sys
import zipfile
from pathlib import Path
from typing import List, Tuple


class ValidationError(Exception):
    """Raised when skill validation fails."""
    pass


def validate_frontmatter(content: str) -> Tuple[dict, List[str]]:
    """Parse and validate YAML frontmatter."""
    errors = []
    metadata = {}
    
    lines = content.split('\n')
    if not lines or lines[0].strip() != '---':
        errors.append("Missing frontmatter: SKILL.md must start with '---'")
        return metadata, errors
    
    # Find closing delimiter
    end_idx = None
    for i, line in enumerate(lines[1:], 1):
        if line.strip() == '---':
            end_idx = i
            break
    
    if end_idx is None:
        errors.append("Unclosed frontmatter: Missing closing '---'")
        return metadata, errors
    
    # Parse frontmatter
    frontmatter_lines = lines[1:end_idx]
    for line in frontmatter_lines:
        if ':' in line:
            key, value = line.split(':', 1)
            metadata[key.strip()] = value.strip()
    
    # Validate required fields
    if 'name' not in metadata:
        errors.append("Missing required field: 'name'")
    elif len(metadata['name']) > 64:
        errors.append(f"Name too long: {len(metadata['name'])} chars (max 64)")
    elif not re.match(r'^[a-z][a-z0-9-]*$', metadata['name']):
        errors.append("Invalid name format: must be lowercase, start with letter, use only letters/numbers/hyphens")
    
    if 'description' not in metadata:
        errors.append("Missing required field: 'description'")
    elif len(metadata['description']) > 1024:
        errors.append(f"Description too long: {len(metadata['description'])} chars (max 1024)")
    elif len(metadata['description']) < 20:
        errors.append(f"Description too short: {len(metadata['description'])} chars (min 20)")
    
    return metadata, errors


def validate_skill(skill_path: Path) -> Tuple[bool, List[str], dict]:
    """
    Validate a skill directory structure and content.
    
    Returns:
        Tuple of (is_valid, errors, metadata)
    """
    errors = []
    metadata = {}
    
    # Check directory exists
    if not skill_path.is_dir():
        errors.append(f"Skill path is not a directory: {skill_path}")
        return False, errors, metadata
    
    # Check SKILL.md exists
    skill_md = skill_path / "SKILL.md"
    if not skill_md.exists():
        errors.append("Missing required file: SKILL.md")
        return False, errors, metadata
    
    # Read and validate SKILL.md
    content = skill_md.read_text()
    metadata, fm_errors = validate_frontmatter(content)
    errors.extend(fm_errors)
    
    # Check name matches directory
    if 'name' in metadata and metadata['name'] != skill_path.name:
        errors.append(f"Name mismatch: frontmatter says '{metadata['name']}', directory is '{skill_path.name}'")
    
    # Check for TODO markers (warn, not error)
    if 'TODO' in content:
        todo_count = content.count('TODO')
        print(f"  ⚠ Warning: {todo_count} TODO marker(s) found in SKILL.md")
    
    # Validate file structure
    valid_dirs = {'resources', 'references', 'scripts', 'templates', 'assets'}
    for item in skill_path.iterdir():
        if item.is_dir() and item.name not in valid_dirs and not item.name.startswith('.'):
            print(f"  ⚠ Warning: Non-standard directory: {item.name}")
    
    # Check for reasonable file sizes
    total_size = 0
    for file in skill_path.rglob('*'):
        if file.is_file():
            size = file.stat().st_size
            total_size += size
            if size > 1_000_000:  # 1MB
                print(f"  ⚠ Warning: Large file ({size/1024:.1f}KB): {file.relative_to(skill_path)}")
    
    if total_size > 10_000_000:  # 10MB
        errors.append(f"Skill too large: {total_size/1024/1024:.1f}MB (max 10MB)")
    
    is_valid = len(errors) == 0
    return is_valid, errors, metadata


def package_skill(skill_path: Path, output_dir: Path) -> Path:
    """
    Create a zip archive of the skill.
    
    Returns:
        Path to the created zip file
    """
    skill_name = skill_path.name
    output_dir.mkdir(parents=True, exist_ok=True)
    zip_path = output_dir / f"{skill_name}.zip"
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for file in skill_path.rglob('*'):
            if file.is_file():
                # Skip hidden files and common exclusions
                if any(part.startswith('.') for part in file.parts):
                    continue
                if file.suffix in {'.pyc', '.pyo'}:
                    continue
                if '__pycache__' in file.parts:
                    continue
                
                arcname = file.relative_to(skill_path)
                zf.write(file, arcname)
    
    return zip_path


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Package and validate a Claude Skill for distribution",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    %(prog)s ./skills/my-skill
    %(prog)s ./skills/my-skill ./dist
        """
    )
    parser.add_argument(
        "skill_path",
        type=Path,
        help="Path to skill directory"
    )
    parser.add_argument(
        "output_dir",
        nargs='?',
        type=Path,
        default=Path('.'),
        help="Output directory for zip file (default: current directory)"
    )
    
    args = parser.parse_args()
    skill_path = args.skill_path.resolve()
    output_dir = args.output_dir.resolve()
    
    print(f"Validating skill: {skill_path.name}")
    print("=" * 50)
    
    is_valid, errors, metadata = validate_skill(skill_path)
    
    if errors:
        print("\n❌ Validation errors:")
        for error in errors:
            print(f"  • {error}")
        print("\nFix errors and try again.")
        return 1
    
    print("✓ Validation passed")
    print(f"  Name: {metadata.get('name', 'N/A')}")
    print(f"  Version: {metadata.get('version', 'N/A')}")
    
    print("\nPackaging skill...")
    zip_path = package_skill(skill_path, output_dir)
    
    print(f"\n✓ Created: {zip_path}")
    print(f"  Size: {zip_path.stat().st_size / 1024:.1f}KB")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
