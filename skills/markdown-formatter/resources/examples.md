# Markdown Formatting Examples

This document shows before and after examples of common formatting fixes.

## Example 1: Header Formatting

### Before
```markdown
header without hash
===================

### Level 3 header (skipped level 2)
content here
#### Level 4 header
more content
```

### After
```markdown
# Header Without Hash

## Level 2 Header

Content here.

### Level 3 Header

More content.
```

### Issues Fixed
- Converted underline-style header to ATX-style
- Fixed skipped header level
- Added proper spacing around headers
- Capitalized headers appropriately

## Example 2: List Formatting

### Before
```markdown
Here is a list:
* Item one
+ Item two
  * nested item
    * deeply nested
- Item three
```

### After
```markdown
Here is a list:

- Item one
- Item two
  - Nested item
    - Deeply nested
- Item three
```

### Issues Fixed
- Standardized list markers to `-`
- Added blank line before list
- Consistent indentation (2 spaces per level)
- Capitalized list items

## Example 3: Code Block Formatting

### Before
```markdown
Install the package:
```
npm install package-name
```
Then run the script with:
    python script.py
```

### After
```markdown
Install the package:

```bash
npm install package-name
```

Then run the script with:

```python
python script.py
```
```

### Issues Fixed
- Added language identifiers
- Added blank lines before and after code blocks
- Converted indented code to fenced blocks
- Used appropriate language tags

## Example 4: Link and Emphasis Formatting

### Before
```markdown
For more info click __here__ or read _this_ guide.

You can also check [here](http://example.com) for details.
```

### After
```markdown
For more info see the **installation guide** or read the *configuration reference*.

You can also check the [detailed documentation](http://example.com) for more information.
```

### Issues Fixed
- Changed `__bold__` to `**bold**`
- Changed `_italic_` to `*italic*`
- Made link text descriptive
- Removed "click here" anti-pattern

## Example 5: Table Formatting

### Before
```markdown
|Name|Age|City|
|---|---|---|
|Alice|30|NYC|
|Bob|25|LA|
```

### After
```markdown
| Name  | Age | City |
|-------|-----|------|
| Alice | 30  | NYC  |
| Bob   | 25  | LA   |
```

### Issues Fixed
- Added spacing for alignment
- Added blank lines before/after (when in context)
- Aligned columns for readability

## Example 6: Complete Document

### Before
```markdown
# my project
this is a cool project

## features
Here are the features:
* Feature 1
+ Feature 2
* Feature 3

## installation
Install it like this:
```
npm install
```

For more info click [here](http://example.com).

###Usage
Just run it:
    node index.js
```

### After
```markdown
# My Project

This is a cool project.

## Features

Here are the features:

- Feature 1
- Feature 2
- Feature 3

## Installation

Install it like this:

```bash
npm install
```

For more information, see the [complete documentation](http://example.com).

## Usage

Just run it:

```bash
node index.js
```
```

### Issues Fixed
- Capitalized title
- Added blank lines throughout
- Standardized list markers
- Added language identifiers to code blocks
- Fixed missing space in header (`###Usage`)
- Improved link text
- Converted indented code to fenced blocks
- Consistent spacing and structure

## Example 7: Nested Lists

### Before
```markdown
- Item 1
- Item 2
    - Nested 1
        - Deep nested
    - Nested 2
- Item 3
```

### After
```markdown
- Item 1
- Item 2
  - Nested 1
    - Deep nested
  - Nested 2
- Item 3
```

### Issues Fixed
- Fixed indentation (2 spaces per level, not 4)
- Consistent alignment

## Example 8: Multiple Issues

### Before
```markdown
# My Document
## Section 1
This section has __bold text__ and _italic text_.

Here's some code:
    def hello():
        print("hi")

And a list:
* one
* two
* three

Check out [this](url).
##Section 2
More content here.
```

### After
```markdown
# My Document

## Section 1

This section has **bold text** and *italic text*.

Here's some code:

```python
def hello():
    print("hi")
```

And a list:

- One
- Two
- Three

Check out the [detailed guide](url).

## Section 2

More content here.
```

### Issues Fixed
- Added spacing after headers
- Changed emphasis markers
- Converted indented code to fenced block with language
- Standardized list markers
- Added blank lines around blocks
- Fixed missing space in header
- Improved link text
- Capitalized list items

## Example 9: Blockquotes

### Before
```markdown
Here is a quote:
>This is quoted text.
>More quoted text.
Back to normal.
```

### After
```markdown
Here is a quote:

> This is quoted text.
> More quoted text.

Back to normal.
```

### Issues Fixed
- Added space after `>`
- Added blank lines before and after blockquote

## Example 10: Horizontal Rules and Spacing

### Before
```markdown
Section 1 content.
***
Section 2 content.



Section 3 content.
```

### After
```markdown
Section 1 content.

---

Section 2 content.

Section 3 content.
```

### Issues Fixed
- Standardized horizontal rule to `---`
- Added proper spacing around rule
- Removed excessive blank lines
- Single blank line between sections

## Example 11: Image Formatting

### Before
```markdown
![](logo.png)
Check out this image:
![image](screenshot.png)
```

### After
```markdown
![Company logo](logo.png)

Check out this image:

![Dashboard screenshot showing main navigation](screenshot.png)
```

### Issues Fixed
- Added descriptive alt text
- Added blank lines for spacing
- Made alt text meaningful

## Example 12: Reference-Style Links

### Before
```markdown
Check [this](http://example.com/very/long/url) and [this](http://example.com/very/long/url) and [that](http://example.com/very/long/url).
```

### After
```markdown
Check the [installation guide][install], [configuration reference][config], and [API documentation][api].

[install]: http://example.com/very/long/url
[config]: http://example.com/very/long/url
[api]: http://example.com/very/long/url
```

### Issues Fixed
- Converted to reference-style for repeated URLs
- Made text more readable
- Improved link text
- Grouped references at bottom

## Summary of Common Fixes

| Issue | Before | After |
|-------|--------|-------|
| Headers | `header\n===` | `# Header` |
| Lists | `* + -` mixed | `-` consistent |
| Code blocks | indented | fenced with language |
| Emphasis | `__bold__` | `**bold**` |
| Spacing | missing | proper blank lines |
| Links | "click here" | descriptive text |
| Alt text | missing | descriptive |

## Quick Checklist

After formatting, verify:
- [ ] ATX-style headers with proper spacing
- [ ] Consistent list markers (`-`)
- [ ] All code blocks have language identifiers
- [ ] Proper blank lines around all blocks
- [ ] Emphasis uses `**bold**` and `*italic*`
- [ ] Links have descriptive text
- [ ] Images have alt text
- [ ] No trailing whitespace
- [ ] Single newline at end of file
- [ ] No header levels skipped
