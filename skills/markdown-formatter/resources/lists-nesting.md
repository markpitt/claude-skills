# Lists and Nested Structures

Reference for proper list formatting, indentation, and nesting.

## Unordered Lists

### Use Dash Marker
```markdown
- Item one
- Item two
- Item three
```

**Use `-` (dash/hyphen).** Other markers (`*`, `+`) work but are inconsistent.

### Don't Mix Markers
```markdown
<!-- Incorrect -->
* Item one
+ Item two
- Item three

<!-- Correct -->
- Item one
- Item two
- Item three
```

### Indentation: 2 Spaces per Level
```markdown
- Parent item
  - Nested item level 1
    - Nested item level 2
      - Nested item level 3
- Another parent
```

**Use 2 spaces per nesting level**, not 4. This maintains readability.

### Spacing Around Lists

```markdown
Introductory paragraph.

- First item
- Second item
- Third item

Continuation paragraph.
```

- **Before list**: One blank line
- **After list**: One blank line
- **Between items**: No blank lines (unless items contain multiple blocks)

### Multi-Paragraph List Items

```markdown
- First item with multiple paragraphs.

  Second paragraph of same item (blank line + indent).

- Second item.

- Third item with code:

  ```python
  code_here()
  ```
```

When a list item contains multiple paragraphs or blocks:
1. Add blank line between paragraphs
2. Indent continuation with 2 spaces
3. Works for paragraphs, code blocks, blockquotes, etc.

### Nested Lists Example
```markdown
## Project Structure

- **Frontend**
  - React components
    - Button component
    - Form component
  - Styling
    - CSS modules
    - Tailwind config
- **Backend**
  - API routes
    - Authentication
    - Data endpoints
  - Database
    - Models
    - Migrations
```

## Ordered Lists

### Basic Syntax
```markdown
1. First item
2. Second item
3. Third item
```

### Auto-Numbering
```markdown
1. First item
1. Second item
1. Third item
```

Both work. Auto-numbering (all `1.`) is slightly easier to maintain.

### Nested Ordered Lists
```markdown
1. First step
   1. Sub-step A
   2. Sub-step B
2. Second step
   1. Sub-step A
   2. Sub-step B
```

### Mixed Lists (Unordered + Ordered)
```markdown
- Feature category one
  1. First feature
  2. Second feature
- Feature category two
  1. First feature
  2. Second feature
```

## Common List Issues and Fixes

### Issue: Inconsistent Markers

Before:
```markdown
* Item 1
+ Item 2
- Item 3
```

After:
```markdown
- Item 1
- Item 2
- Item 3
```

### Issue: Wrong Indentation

Before:
```markdown
- Item 1
    - Nested (4 spaces - wrong)
        - Deep nested
- Item 2
```

After:
```markdown
- Item 1
  - Nested (2 spaces - correct)
    - Deep nested
- Item 2
```

### Issue: Missing Spacing

Before:
```markdown
Here is a list:
- Item 1
- Item 2
- Item 3
Next section.
```

After:
```markdown
Here is a list:

- Item 1
- Item 2
- Item 3

Next section.
```

### Issue: Inconsistent Capitalization

Before:
```markdown
- first item
- Second item
- THIRD ITEM
```

After:
```markdown
- First item
- Second item
- Third item
```

## Special List Content

### Lists with Code Blocks
```markdown
Steps to install:

1. Clone the repository:

   ```bash
   git clone https://github.com/user/repo.git
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the application:

   ```bash
   npm start
   ```
```

### Lists with Blockquotes
```markdown
Key principles:

- Performance matters
  > "Premature optimization is the root of all evil." - Donald Knuth

- Readability counts
  > "Code is read much more often than it is written."
```

### Lists with Tables
```markdown
Comparison:

- **Option 1: Database**

  | Feature | Status |
  |---------|--------|
  | Speed   | Fast   |
  | Cost    | High   |

- **Option 2: Cache**

  | Feature | Status |
  |---------|--------|
  | Speed   | Faster |
  | Cost    | Low    |
```

## Task Lists (GitHub, GitLab, etc.)

```markdown
## Checklist

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
```

These are supported on GitHub and some other platforms. Use with caution if compatibility is needed.

## Definition Lists

Some markdown variants support definition lists:

```markdown
Term 1
:   Definition of term 1

Term 2
:   Definition of term 2
```

**Check your platform support** before using this syntax.

## Navigation Considerations

Well-formatted lists help users:
- **Scan** the document quickly
- **Understand** hierarchies and relationships
- **Reference** specific items
- **Extract** key points

Poorly formatted lists:
- Create reading obstacles
- Hide important information
- Reduce content clarity
- Frustrate readers

## Validation Checklist

### Unordered Lists
- [ ] All items use `-` marker
- [ ] Indentation is 2 spaces per level
- [ ] Blank line before list
- [ ] Blank line after list
- [ ] No blank lines between simple items
- [ ] Consistent capitalization

### Ordered Lists
- [ ] Items numbered `1.`, `2.`, etc. (or all `1.`)
- [ ] Indentation is 2 spaces per level
- [ ] Blank line before list
- [ ] Blank line after list
- [ ] Consecutive numbering or auto-numbering

### Nested Lists
- [ ] Proper 2-space indentation
- [ ] Marker consistency at each level
- [ ] Logical hierarchy
- [ ] Balanced depth (not too deep)

### Content
- [ ] Items start with capital letter
- [ ] Consistent style (all sentences, all phrases, etc.)
- [ ] No ambiguous references
- [ ] Related items grouped together

