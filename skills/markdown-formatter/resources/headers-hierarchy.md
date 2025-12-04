# Headers and Document Hierarchy

Reference for proper header formatting and document structure.

## Header Syntax

### ATX-Style Headers (Recommended)
```markdown
# H1 - Document Title
## H2 - Major Section
### H3 - Subsection
#### H4 - Sub-subsection
##### H5 - Minor subsection
###### H6 - Lowest level
```

**Use this.** It's the standard markdown format and works everywhere.

### Underline-Style Headers (Not Recommended)
```markdown
Document Title
==============

Section Title
--------------
```

**Don't use this.** Avoid underline-style headers; convert to ATX-style.

## Hierarchy Rules

### One H1 per Document
```markdown
# My Project

Document should have exactly one H1, typically the title.

## Section One
Content here.

## Section Two
More content.
```

### No Skipped Levels
```markdown
# Correct: H1 → H2 → H3
# Header 1
## Header 2
### Header 3

# Incorrect: H1 → H3 (skipped H2)
# Header 1
### Header 3
```

When you skip levels, readers lose context and structure becomes unclear.

### Consistent Hierarchy
```markdown
# Main Document

## Primary Section
Content

### Subsection
Content

## Another Primary Section
Content

### Another Subsection
Content
```

Maintain the hierarchy throughout the document.

## Header Spacing

### Blank Lines
```markdown
# Header

Content after header.

## Next Header

More content.
```

- **Before header**: One blank line (except at start of file)
- **After header**: One blank line before content
- **No blank line** before first H1

### Example Structure
```markdown
# My Document

Introduction paragraph.

## Section One

This section discusses...

### Subsection 1.1

Details here.

### Subsection 1.2

More details.

## Section Two

Another major topic...
```

## Capitalization and Formatting

### Style Options
Choose one and be consistent:

**Title Case**
```markdown
# Getting Started Guide
## Installing Dependencies
### Configuration Options
```

**Sentence case**
```markdown
# Getting started guide
## Installing dependencies
### Configuration options
```

**ALL CAPS** (rarely used, harder to read)
```markdown
# GETTING STARTED GUIDE
## INSTALLING DEPENDENCIES
```

### No Trailing Punctuation
```markdown
# Correct Header
## Another Correct Header

# Incorrect Header.
## Another Incorrect Header:
```

Headers shouldn't end with periods or colons.

## Special Cases

### Headers with Code
```markdown
## Using the `getValue()` method

### Configuring `config.json`

#### The `--verbose` flag
```

Use backticks in headers for code references. Keep it readable.

### Headers with Links
```markdown
## See [our guide](https://example.com)

### More at [docs](https://example.com)
```

Links can appear in headers but keep them concise.

### Headers with Emphasis
```markdown
## Understanding **bold concepts**

### The *importance* of this feature
```

Emphasis can be used in headers. Don't overuse it.

## Common Issues and Fixes

| Issue | Before | After |
|-------|--------|-------|
| Underline style | `Header\n======` | `# Header` |
| Skipped level | `# H1\n### H3` | `# H1\n## H2\n### H3` |
| No spacing | `# Header\nContent` | `# Header\n\nContent` |
| Inconsistent case | Mix of cases | All same case |
| Trailing punctuation | `# Header.` | `# Header` |
| Multiple blanks | `# Header\n\n\nContent` | `# Header\n\nContent` |

## Navigation Tips

A well-structured hierarchy enables:
- **Table of contents**: Some tools auto-generate from headers
- **Outline view**: Readers can navigate document structure
- **Search**: Clear headers make finding content easier
- **Accessibility**: Proper hierarchy aids screen readers

Example table of contents (auto-generated from headers):
```
# My Project
  ## Introduction
  ## Getting Started
    ### Installation
    ### Configuration
  ## Usage Guide
    ### Basic Usage
    ### Advanced Features
  ## Troubleshooting
  ## FAQ
```

## Validation Checklist

- [ ] Single H1 at document start
- [ ] ATX-style headers (`#` notation)
- [ ] No skipped levels
- [ ] Blank line before each header (except first)
- [ ] Blank line after each header
- [ ] No trailing punctuation
- [ ] Consistent capitalization
- [ ] Logical hierarchy
- [ ] Descriptive header text

