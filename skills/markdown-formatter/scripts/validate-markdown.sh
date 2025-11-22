#!/bin/bash
# Markdown Validation Script
# Checks markdown files for common formatting issues

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check if file is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No file specified${NC}"
    echo "Usage: $0 <markdown-file>"
    exit 1
fi

FILE="$1"

# Check if file exists
if [ ! -f "$FILE" ]; then
    echo -e "${RED}Error: File not found: $FILE${NC}"
    exit 1
fi

# Initialize counters
ERRORS=0
WARNINGS=0

echo "Validating: $FILE"
echo "----------------------------------------"

# Check 1: File ends with newline
if [ -n "$(tail -c 1 "$FILE")" ]; then
    echo -e "${YELLOW}WARNING: File does not end with newline${NC}"
    ((WARNINGS++))
fi

# Check 2: No trailing whitespace
if grep -n ' $' "$FILE" > /dev/null 2>&1; then
    echo -e "${YELLOW}WARNING: Trailing whitespace found on lines:${NC}"
    grep -n ' $' "$FILE" | cut -d: -f1 | tr '\n' ' '
    echo ""
    ((WARNINGS++))
fi

# Check 3: No tabs (prefer spaces)
if grep -n $'\t' "$FILE" > /dev/null 2>&1; then
    echo -e "${YELLOW}WARNING: Tabs found on lines:${NC}"
    grep -n $'\t' "$FILE" | cut -d: -f1 | tr '\n' ' '
    echo ""
    ((WARNINGS++))
fi

# Check 4: Code blocks have language identifiers
if grep -n '^```$' "$FILE" > /dev/null 2>&1; then
    echo -e "${YELLOW}WARNING: Code blocks without language identifier on lines:${NC}"
    grep -n '^```$' "$FILE" | cut -d: -f1 | tr '\n' ' '
    echo ""
    ((WARNINGS++))
fi

# Check 5: Multiple consecutive blank lines
if grep -Pzo '\n\n\n+' "$FILE" > /dev/null 2>&1; then
    echo -e "${YELLOW}WARNING: Multiple consecutive blank lines found${NC}"
    ((WARNINGS++))
fi

# Check 6: Headers start with #
if grep -n '^[A-Za-z].*\n[=-]\+$' "$FILE" > /dev/null 2>&1; then
    echo -e "${YELLOW}WARNING: Underline-style headers found (use ATX-style)${NC}"
    ((WARNINGS++))
fi

# Check 7: Check for common list marker inconsistencies
ASTERISK_COUNT=$(grep -c '^\* ' "$FILE" 2>/dev/null || true)
PLUS_COUNT=$(grep -c '^+ ' "$FILE" 2>/dev/null || true)
DASH_COUNT=$(grep -c '^- ' "$FILE" 2>/dev/null || true)

if [ $ASTERISK_COUNT -gt 0 ] && [ $DASH_COUNT -gt 0 ]; then
    echo -e "${YELLOW}WARNING: Mixed list markers (* and -) found${NC}"
    echo "  * markers: $ASTERISK_COUNT, - markers: $DASH_COUNT"
    ((WARNINGS++))
fi

if [ $PLUS_COUNT -gt 0 ]; then
    echo -e "${YELLOW}WARNING: Plus (+) list markers found (prefer -)${NC}"
    echo "  + markers: $PLUS_COUNT"
    ((WARNINGS++))
fi

# Check 8: Check for bad link text
if grep -i '\[click here\]' "$FILE" > /dev/null 2>&1; then
    echo -e "${YELLOW}WARNING: 'Click here' links found (use descriptive text)${NC}"
    ((WARNINGS++))
fi

if grep -i '\[here\]' "$FILE" > /dev/null 2>&1; then
    echo -e "${YELLOW}WARNING: 'Here' links found (use descriptive text)${NC}"
    ((WARNINGS++))
fi

# Check 9: Check for images without alt text
if grep -n '!\[\](' "$FILE" > /dev/null 2>&1; then
    echo -e "${YELLOW}WARNING: Images without alt text on lines:${NC}"
    grep -n '!\[\](' "$FILE" | cut -d: -f1 | tr '\n' ' '
    echo ""
    ((WARNINGS++))
fi

# Check 10: Check for emphasis with underscores
if grep '__[^_]*__' "$FILE" > /dev/null 2>&1; then
    echo -e "${YELLOW}WARNING: Bold with __ found (prefer **)${NC}"
    ((WARNINGS++))
fi

if grep '_[^_]*_' "$FILE" > /dev/null 2>&1; then
    # Exclude URLs which may have underscores
    if grep -v 'http' "$FILE" | grep '_[^_]*_' > /dev/null 2>&1; then
        echo -e "${YELLOW}WARNING: Italic with _ found (prefer *)${NC}"
        ((WARNINGS++))
    fi
fi

# Summary
echo "----------------------------------------"
echo -e "Errors: ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ No issues found!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}! Validation completed with warnings${NC}"
    exit 0
else
    echo -e "${RED}✗ Validation failed${NC}"
    exit 1
fi
