#!/usr/bin/env python3
"""
Initialize a new Claude Skill directory structure.

Usage:
    ./init_skill.py <skill-name> --path <output-directory>

Example:
    ./init_skill.py my-awesome-skill --path ./skills
"""

import argparse
import os
import sys
from pathlib import Path


SKILL_MD_TEMPLATE = '''---
name: {skill_name}
description: TODO - Brief description of what this skill does and when to use it (max 1024 chars). Use third-person voice.
version: 1.0.0
---

# {skill_title}

TODO - Main skill purpose and overview in 2-3 sentences.

## When to Use This Skill

TODO - Use this skill when:
- Condition or scenario 1
- Condition or scenario 2
- Condition or scenario 3

## How to Use This Skill

TODO - Step-by-step instructions:

1. First, do this
2. Then, do this
3. Finally, do this

## Resources

This skill includes the following resources:

- **references/example-reference.md** - Example reference documentation
- **scripts/example-script.py** - Example utility script
- **assets/** - Directory for templates and static assets

## Best Practices

TODO - Key guidelines:
- Best practice 1
- Best practice 2
- Best practice 3

## Examples

TODO - Provide 1-2 concrete examples:

### Example 1: Basic Usage

Description of what this example demonstrates.

### Example 2: Advanced Usage

Description of what this example demonstrates.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| TODO - Issue 1 | Solution 1 |
| TODO - Issue 2 | Solution 2 |

## External Resources

- [Link 1](https://example.com) - Description
- [Link 2](https://example.com) - Description
'''

REFERENCE_TEMPLATE = '''# Example Reference

This is an example reference file. Reference files contain documentation that Claude should reference while working.

## Overview

TODO - Add detailed reference content here.

## Sections

### Section 1

TODO - Add section content.

### Section 2

TODO - Add section content.

## API Reference

TODO - Add API details, schemas, or other reference material.

## Examples

TODO - Add code examples or usage patterns.
'''

SCRIPT_TEMPLATE = '''#!/usr/bin/env python3
"""
Example Script

This is an example utility script for the skill.
Scripts are for tasks requiring deterministic reliability
or code that would be repeatedly rewritten.

Usage:
    python example-script.py [options]
"""

import argparse
import sys


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Example script")
    parser.add_argument("--input", help="Input file or value")
    parser.add_argument("--output", help="Output file")
    args = parser.parse_args()

    # TODO: Implement script logic
    print("Example script executed successfully!")
    print(f"Input: {args.input}")
    print(f"Output: {args.output}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
'''

ASSET_README_TEMPLATE = '''# Assets Directory

This directory contains static assets used by the skill.

## Contents

Place files here that will be used in output, such as:
- Templates (PowerPoint, Word, etc.)
- Images and icons
- Boilerplate code
- Sample documents

## Usage

Assets are not loaded into context but are referenced in skill outputs.
'''


def create_skill(skill_name: str, output_path: Path) -> Path:
    """Create a new skill directory structure."""
    # Validate skill name
    if not skill_name.replace("-", "").replace("_", "").isalnum():
        raise ValueError(f"Invalid skill name: {skill_name}. Use alphanumeric characters and hyphens only.")
    
    # Normalize skill name
    skill_name = skill_name.lower().replace("_", "-")
    
    # Create skill directory
    skill_dir = output_path / skill_name
    if skill_dir.exists():
        raise FileExistsError(f"Skill directory already exists: {skill_dir}")
    
    # Create directory structure
    skill_dir.mkdir(parents=True)
    (skill_dir / "references").mkdir()
    (skill_dir / "scripts").mkdir()
    (skill_dir / "assets").mkdir()
    
    # Create SKILL.md
    skill_title = skill_name.replace("-", " ").title()
    skill_md_content = SKILL_MD_TEMPLATE.format(
        skill_name=skill_name,
        skill_title=skill_title
    )
    (skill_dir / "SKILL.md").write_text(skill_md_content)
    
    # Create example reference
    (skill_dir / "references" / "example-reference.md").write_text(REFERENCE_TEMPLATE)
    
    # Create example script
    script_path = skill_dir / "scripts" / "example-script.py"
    script_path.write_text(SCRIPT_TEMPLATE)
    script_path.chmod(0o755)
    
    # Create assets README
    (skill_dir / "assets" / "README.md").write_text(ASSET_README_TEMPLATE)
    
    return skill_dir


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Initialize a new Claude Skill directory structure",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    %(prog)s my-skill --path ./skills
    %(prog)s data-analyzer --path /home/user/claude-skills/skills
        """
    )
    parser.add_argument(
        "skill_name",
        help="Name of the skill (lowercase, hyphenated)"
    )
    parser.add_argument(
        "--path",
        required=True,
        type=Path,
        help="Output directory where skill folder will be created"
    )
    
    args = parser.parse_args()
    
    try:
        skill_dir = create_skill(args.skill_name, args.path)
        print(f"✓ Created skill: {skill_dir}")
        print(f"\nDirectory structure:")
        print(f"  {skill_dir}/")
        print(f"  ├── SKILL.md")
        print(f"  ├── references/")
        print(f"  │   └── example-reference.md")
        print(f"  ├── scripts/")
        print(f"  │   └── example-script.py")
        print(f"  └── assets/")
        print(f"      └── README.md")
        print(f"\nNext steps:")
        print(f"  1. Edit SKILL.md to add your skill instructions")
        print(f"  2. Add reference files to references/")
        print(f"  3. Add utility scripts to scripts/")
        print(f"  4. Add templates/assets to assets/")
        return 0
    except (ValueError, FileExistsError) as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
