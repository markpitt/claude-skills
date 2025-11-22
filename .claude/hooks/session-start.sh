#!/bin/bash
# SessionStart hook for Claude Skills Repository
# Loads development context when starting a Claude Code session

set -e

# Output header
echo "=== Claude Skills Repository Context ==="
echo ""

# Show available skills
echo "Available Skills:"
if [ -d "skills" ]; then
    for skill_dir in skills/*/; do
        if [ -d "$skill_dir" ]; then
            skill_name=$(basename "$skill_dir")
            # Try to extract description from SKILL.md
            if [ -f "${skill_dir}SKILL.md" ]; then
                description=$(grep "^description:" "${skill_dir}SKILL.md" | sed 's/description: *//' | head -1)
                if [ -n "$description" ]; then
                    echo "  - $skill_name: $description"
                else
                    echo "  - $skill_name"
                fi
            else
                echo "  - $skill_name (missing SKILL.md)"
            fi
        fi
    done
else
    echo "  No skills directory found"
fi

echo ""

# Show git status
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Git Status:"
    branch=$(git branch --show-current)
    echo "  Branch: $branch"

    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        echo "  Status: Uncommitted changes"
    else
        echo "  Status: Clean working directory"
    fi

    # Show last commit
    last_commit=$(git log -1 --oneline 2>/dev/null || echo "No commits")
    echo "  Last commit: $last_commit"
fi

echo ""
echo "Repository: Claude Skills Store"
echo "Documentation: See CLAUDE.md and README.md"
echo "========================================"
echo ""

exit 0
