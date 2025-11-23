---
name: markdown-formatter
description: Formats markdown files according to best practices and common style guidelines. Use when cleaning up markdown documentation, ensuring consistent formatting, or standardizing README files.
allowed-tools: Read, Edit, Grep, Glob, Bash
version: 1.0.0
---

# Markdown Formatter

This skill helps you format markdown files according to best practices and consistent style guidelines.

## When to Use This Skill

- Cleaning up existing markdown documentation
- Standardizing README files across projects
- Ensuring consistent formatting in documentation
- Preparing markdown for publication
- Fixing common markdown formatting issues

## How to Use This Skill

1. **Review the style guide** in `resources/style-guide.md` for formatting rules
2. **Check examples** in `resources/examples.md` for before/after samples
3. **Apply formatting** systematically through the document
4. **Validate** using the checklist in `resources/checklist.txt`

## Core Formatting Rules

### Headers
- Use ATX-style headers (`#` notation) not underline style
- One H1 (`#`) per document (typically the title)
- Don't skip header levels (e.g., don't go from H1 to H3)
- Add blank line before and after headers (except at start of file)
- No trailing punctuation in headers

### Lists
- Use `-` for unordered lists (not `*` or `+`)
- Use `1.` for ordered lists (auto-numbering)
- Indent nested lists with 2 spaces
- Add blank line before and after list blocks
- Ensure consistent indentation within lists

### Code Blocks
- Use fenced code blocks (```) not indentation
- Always specify language for syntax highlighting
- Add blank line before and after code blocks
- Use single backticks for inline code

### Links and Images
- Use reference-style links for repeated URLs
- Add descriptive alt text for images
- Keep link text meaningful (avoid "click here")
- Ensure URLs are properly encoded

### Spacing and Line Length
- One blank line between sections
- Two blank lines before major sections (if desired by project)
- No trailing whitespace on lines
- Line length: prefer 80-120 characters for readability (not enforced strictly)
- Single newline at end of file

### Emphasis
- Use `**bold**` for strong emphasis (not `__bold__`)
- Use `*italic*` for emphasis (not `_italic_`)
- Don't use bold or italic for headers

### Tables
- Align table columns with proper spacing
- Use header separator row with at least 3 dashes
- Add blank line before and after tables

## Formatting Process

1. **Read the file**: Use Read tool to examine current state
2. **Identify issues**: Check against style guide
3. **Apply fixes**: Use Edit tool for corrections
   - Start with structural issues (headers, spacing)
   - Fix list formatting
   - Correct code blocks
   - Standardize emphasis
   - Clean up links
4. **Verify**: Review changes against checklist

## Output Format

When formatting files, provide:
- **Summary**: Brief overview of changes made
- **Issues Fixed**: List of corrections applied
- **Recommendations**: Suggestions for content improvements (if any)

## Common Issues and Fixes

### Issue: Inconsistent List Markers
```markdown
<!-- Before -->
* Item 1
+ Item 2
- Item 3

<!-- After -->
- Item 1
- Item 2
- Item 3
```

### Issue: Missing Code Block Language
```markdown
<!-- Before -->
```
code here
```

<!-- After -->
```python
code here
```
```

### Issue: Improper Header Spacing
```markdown
<!-- Before -->
# Header
Content immediately after

<!-- After -->
# Header

Content with proper spacing
```

### Issue: Bad Link Text
```markdown
<!-- Before -->
Click [here](url) for details

<!-- After -->
See the [installation guide](url) for details
```

## Advanced Features

### Validation Script
Use `scripts/validate-markdown.sh` to check files before formatting:
```bash
./skills/markdown-formatter/scripts/validate-markdown.sh file.md
```

### Batch Processing
For multiple files:
1. Use Glob to find all markdown files
2. Process each file systematically
3. Report summary of changes

## Guidelines

- **Preserve content**: Never change the meaning or information
- **Be consistent**: Apply rules uniformly throughout
- **Respect context**: Some projects may have specific conventions
- **Document changes**: Clearly explain what was modified
- **Ask if uncertain**: Clarify project-specific preferences when needed

## Integration with Other Tools

This skill works well with:
- Linters: Can fix issues identified by markdownlint
- CI/CD: Can be part of pre-commit formatting
- Documentation: Can standardize docs before publication

## Limitations

- Does not check spelling or grammar
- Does not validate external links
- Does not optimize images
- Does not enforce specific line length (guideline only)

## References

See `resources/style-guide.md` for complete formatting rules and `resources/examples.md` for detailed before/after examples.
