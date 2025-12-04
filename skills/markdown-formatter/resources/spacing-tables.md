# Spacing, Tables, and Document Polish

Reference for spacing rules, table formatting, and final document quality.

## Blank Line Rules

### Between Sections
```markdown
## Section One

Content of section one.

## Section Two

Content of section two.
```

- **Between sections**: One blank line minimum
- **Multiple sections**: Single blank line creates flow

### Around Code Blocks
```markdown
Here's an example:

```python
code_example()
```

As you can see...
```

- **Before code block**: One blank line
- **After code block**: One blank line

### Around Lists
```markdown
Here are the items:

- Item one
- Item two

Now continue...
```

- **Before list**: One blank line
- **After list**: One blank line
- **Between items**: No blank lines (except multi-paragraph items)

### Around Images
```markdown
Here's a screenshot:

![Alt text](image.png)

This shows the feature in action.
```

- **Before image**: One blank line
- **After image**: One blank line

### Around Tables
```markdown
Here's the comparison:

| Column | Value |
|--------|-------|
| A      | 1     |

Note the results above.
```

- **Before table**: One blank line
- **After table**: One blank line

### Around Blockquotes
```markdown
Context before quote.

> This is a quote.
> Spanning multiple lines.

Context after quote.
```

- **Before blockquote**: One blank line
- **After blockquote**: One blank line

### No Multiple Blank Lines
```markdown
<!-- Wrong -->
## Header


Content with extra blank lines.

<!-- Correct -->
## Header

Content with proper spacing.
```

Use single blank lines, not multiple consecutive ones.

## Line Length

### Guideline: 80-120 Characters
```markdown
This is a line that's around 80-90 characters long and reads comfortably
on most screens without requiring horizontal scrolling.

This is a much longer line that extends beyond 120 characters and becomes harder to read on smaller screens, so it's generally better to break it into multiple lines at natural breaking points like sentence ends.
```

- **Soft limit**: 80-120 characters
- **Not strict**: Varies by project
- **Natural breaks**: End of sentences, clause boundaries

### Breaking Long Lines
```markdown
<!-- Long line -->
For more information about configuring the application, including security settings, deployment options, and performance tuning parameters, see the comprehensive documentation.

<!-- Broken line -->
For more information about configuring the application, including
security settings, deployment options, and performance tuning parameters,
see the comprehensive documentation.
```

## Trailing Whitespace

### Remove Trailing Spaces
```markdown
<!-- Wrong -->
This line has trailing spaces at the end.   

This line also has trailing spaces.  

<!-- Correct -->
This line is clean with no trailing spaces.

This line is also clean.
```

Remove all trailing whitespace at line ends. Most editors have settings to auto-trim this.

### Hard Line Breaks (Rare)
```markdown
Line one  
Line two
```

Two trailing spaces create a hard line break. Generally not recommended—use paragraphs instead.

## End of File

### Single Newline
```markdown
# Document

Content here.

```

Every markdown file should end with **exactly one newline** after the last content.

### No Multiple Trailing Newlines
```markdown
<!-- Wrong -->
Content.



← Multiple newlines at end

<!-- Correct -->
Content.
← Single newline at end
```

## Tables

### Basic Structure
```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |
```

### Alignment

```markdown
| Left | Center | Right |
|:-----|:------:|------:|
| L    | C      | R     |
| L    | C      | R     |
```

- **`:--`** = left-aligned
- **`:--:`** = center-aligned  
- **`--:`** = right-aligned
- **`---`** = default (left)

### Formatting Inside Tables

```markdown
| Feature | Description |
|---------|-------------|
| **Bold** | *Emphasized* |
| `Code` | [Link](url) |
| ![Icon](icon.png) | Plain text |
```

Tables support inline formatting, links, and images.

### Spacing for Readability

```markdown
<!-- Tight (harder to read) -->
|A|B|C|
|---|---|---|
|1|2|3|

<!-- Readable -->
| Column A | Column B | Column C |
|----------|----------|----------|
| 1        | 2        | 3        |
```

Align columns with spaces for readability.

### Complex Tables

```markdown
| Feature | Basic | Pro | Enterprise |
|---------|-------|-----|------------|
| API Access | ✓ | ✓ | ✓ |
| Custom Domain | — | ✓ | ✓ |
| Priority Support | — | — | ✓ |
| SLA | — | 99.5% | 99.99% |
```

Use symbols for clarity: ✓ (yes), — (no/N/A)

## Special Characters and Escaping

### Common Escapes
```markdown
\* escaped asterisk
\[ escaped bracket
\` escaped backtick
\# escaped hash
\_ escaped underscore
```

Use backslash to escape special markdown characters.

### UTF-8 Characters
```markdown
© Copyright notice
— em dash
… ellipsis
→ arrow
```

Markdown supports UTF-8. Use special characters directly instead of HTML entities.

### HTML Entities (Avoid)
```markdown
<!-- Avoid -->
&mdash; &copy; &nbsp;

<!-- Prefer -->
— © (space)
```

Use UTF-8 characters directly for better readability.

## Document-Level Spacing

### No Blank Line Before H1
```markdown
# Document Title
← No blank line before first header

Content starts here.
```

The first H1 should be at the very start.

### One Blank Line After H1
```markdown
# Document Title

Content here.
← Blank line between title and content
```

Add blank line after the first header.

### Consistent Section Spacing
```markdown
# Document

Introduction text.

## Section One

Content.

## Section Two

Content.

### Subsection

Content.
```

Maintain consistent spacing throughout.

## Validation Checklist

### Spacing
- [ ] One blank line between sections
- [ ] Blank lines around code blocks
- [ ] Blank lines around lists
- [ ] Blank lines around images
- [ ] Blank lines around tables
- [ ] Blank lines around blockquotes
- [ ] No multiple consecutive blank lines
- [ ] No trailing whitespace
- [ ] Single newline at end of file

### Line Length
- [ ] Lines generally under 120 characters (where practical)
- [ ] Lines broken at natural points
- [ ] Readable without horizontal scrolling (ideally)

### Tables
- [ ] Header row present
- [ ] Separator row with minimum 3 dashes
- [ ] Columns aligned for readability
- [ ] Blank lines before and after
- [ ] Consistent cell formatting

### Final Polish
- [ ] No HTML entities (use UTF-8)
- [ ] Special characters escaped properly
- [ ] Consistent formatting throughout
- [ ] Document renders correctly
- [ ] All links verify correctly

