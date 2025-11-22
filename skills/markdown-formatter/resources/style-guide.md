# Markdown Style Guide

This guide provides detailed formatting rules for markdown documents.

## Document Structure

### Title and Metadata
- Start with single H1 (`#`) containing document title
- No blank line before first header
- Add blank line after title before content

### Sections
- Use hierarchical headers (H1 → H2 → H3)
- Don't skip levels
- Add blank line before and after each header

## Headers

### Syntax
- **Use**: ATX-style (`#` notation)
- **Don't use**: Underline style (`===` or `---`)

### Spacing
```markdown
# Correct Header

Content here.

## Another Header

More content.
```

### Capitalization
- Use sentence case or title case consistently
- Be consistent within a document

### Length
- Keep headers concise
- No period at end

## Lists

### Unordered Lists
- Use `-` (dash/hyphen)
- Don't use `*` or `+`
- Indent nested items with 2 spaces

```markdown
- Parent item
  - Nested item
  - Another nested item
- Another parent
```

### Ordered Lists
- Use `1.` for all items (auto-numbering)
- Or use sequential numbers if preferred
- Be consistent within document

```markdown
1. First item
2. Second item
3. Third item
```

### List Spacing
- Blank line before list block
- Blank line after list block
- No blank lines between items (unless items contain blocks)
- Blank line between items if they contain multiple paragraphs

### Multi-paragraph List Items
```markdown
- First item with multiple paragraphs.

  Second paragraph of first item.

- Second item.
```

## Code

### Inline Code
- Use single backticks: `code`
- Use for:
  - Function names: `calculateTotal()`
  - Variable names: `userCount`
  - File names: `config.json`
  - Command names: `git commit`

### Code Blocks
- Use fenced code blocks (```)
- Always specify language
- Add blank line before and after

```markdown
Example text.

```python
def hello():
    print("Hello")
```

More text.
```

### Language Identifiers
Common language codes:
- `bash` or `sh` - shell scripts
- `python` - Python code
- `javascript` or `js` - JavaScript
- `typescript` or `ts` - TypeScript
- `json` - JSON data
- `yaml` - YAML configuration
- `markdown` or `md` - Markdown
- `html` - HTML
- `css` - CSS
- `sql` - SQL queries

## Links

### Inline Links
```markdown
[link text](https://example.com)
```

### Reference Links
For repeated URLs or cleaner text:
```markdown
See the [documentation][docs] for details.

[docs]: https://example.com/docs
```

### Link Text
- Be descriptive
- Avoid "click here" or "this link"
- Make text meaningful out of context

```markdown
<!-- Bad -->
Click [here](url) for more information.

<!-- Good -->
See the [installation guide](url) for more information.
```

## Images

### Syntax
```markdown
![Alt text](image-url)
```

### Alt Text
- Always provide descriptive alt text
- Describe the image content
- Be concise but informative

```markdown
![Claude Code logo with blue background](logo.png)
```

### Spacing
- Add blank line before and after images
- Treat like code blocks

## Emphasis

### Bold
- Use `**double asterisks**`
- Don't use `__double underscores__`

### Italic
- Use `*single asterisks*`
- Don't use `_single underscores_`

### Both
```markdown
***bold and italic***
```

### When to Use
- **Bold**: Strong emphasis, important terms, warnings
- *Italic*: Emphasis, technical terms, book titles

### Don't Use for
- Headers (use proper header syntax)
- Code (use backticks)
- Quotes (use blockquotes)

## Tables

### Basic Structure
```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |
```

### Alignment
```markdown
| Left | Center | Right |
|:-----|:------:|------:|
| L    | C      | R     |
```

### Guidelines
- Align columns for readability
- Use at least 3 dashes in separator
- Add blank line before and after
- Keep cell content simple

## Blockquotes

### Syntax
```markdown
> This is a quote.
> It can span multiple lines.
```

### Nested Quotes
```markdown
> Level 1
>
> > Level 2
```

### Spacing
- Add blank line before blockquote
- Add blank line after blockquote

## Horizontal Rules

### Syntax
- Use `---` (three dashes)
- Add blank line before and after

```markdown
Content before.

---

Content after.
```

## Line Breaks and Spacing

### Paragraphs
- Separate with single blank line
- Don't use multiple blank lines

### Line Length
- Soft limit: 80-120 characters
- Not strictly enforced
- Break at natural points (end of sentence)

### Trailing Whitespace
- Remove all trailing spaces
- Exception: Two spaces for hard line break (not recommended)

### End of File
- Single newline at end
- No multiple blank lines

## Special Characters

### Escaping
Use backslash to escape:
- `\*` - asterisk
- `\_` - underscore
- `\#` - hash
- `\[` `\]` - brackets
- `\`` - backtick

### HTML Entities
Avoid when possible, use UTF-8:
- Use: `—` not `&mdash;`
- Use: `©` not `&copy;`

## Front Matter (Optional)

If using front matter (for static site generators):
```markdown
---
title: Document Title
date: 2025-11-22
author: Name
---

# Document Title

Content here.
```

## Comments

### HTML Comments
```markdown
<!-- This is a comment -->
```

- Use sparingly
- Not visible in rendered output
- Useful for notes to editors

## Best Practices

### Consistency
- Follow one style throughout document
- Match project conventions if they exist
- When in doubt, choose simpler syntax

### Readability
- Use whitespace effectively
- Keep lines reasonable length
- Group related content

### Accessibility
- Provide alt text for images
- Use semantic headers
- Write descriptive link text

### Compatibility
- Stick to standard markdown
- Test rendering if using extensions
- Document any special syntax used

## Tools

### Validation
- Use markdownlint or similar
- Check rendering in target platform
- Validate links periodically

### Automation
- Use pre-commit hooks for formatting
- Automate common fixes
- Maintain consistency across project

## Common Mistakes to Avoid

1. Skipping header levels
2. Inconsistent list markers
3. Missing blank lines around blocks
4. No language for code blocks
5. Trailing whitespace
6. Bad link text ("click here")
7. Missing alt text on images
8. Using HTML when markdown suffices
9. Inconsistent emphasis markers
10. Multiple blank lines

## Quick Reference

```markdown
# H1
## H2
### H3

**bold**
*italic*

- List item
  - Nested item

1. Ordered item
2. Next item

`inline code`

```language
code block
```

[link text](url)

![alt text](image)

> blockquote

---

| Table | Header |
|-------|--------|
| Cell  | Cell   |
```
