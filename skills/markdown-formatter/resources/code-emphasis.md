# Code and Inline Elements

Reference for code blocks, inline code, emphasis, and related elements.

## Inline Code

### Syntax
```markdown
Use `functionName()` for function references.
Check the `config.json` file.
Run the `git commit` command.
```

Use **single backticks** for inline code.

### What to Mark as Code

Mark these as inline code:
- Function/method names: `calculateTotal()`, `Array.map()`
- Variable names: `userCount`, `activeUsers`
- File names: `config.json`, `README.md`
- Command names: `npm install`, `git clone`
- Keywords: `const`, `if`, `return`
- Class names: `UserService`, `DatabaseConnection`
- Paths: `/etc/config`, `./src/index.js`

### What NOT to Mark

Don't use code for:
- Regular text emphasis (use `*italic*` or `**bold**`)
- Quoted phrases ("use this phrase")
- Concepts or terms (unless programming-related)

## Code Blocks (Fenced)

### Basic Structure
```markdown
Here's how to install:

```bash
npm install package-name
```

Now run it:
```

**Always use fenced blocks** (triple backticks), not indentation.

### Specify Language

```markdown
Wrong (no language):
```
code here
```

Correct (with language):
```bash
code here
```
```

Every code block **must** have a language identifier for syntax highlighting.

### Common Language Identifiers

| Language | Identifier |
|----------|-----------|
| Bash/Shell | `bash`, `sh`, `shell` |
| Python | `python`, `py` |
| JavaScript | `javascript`, `js` |
| TypeScript | `typescript`, `ts` |
| JSON | `json` |
| YAML | `yaml`, `yml` |
| Markdown | `markdown`, `md` |
| HTML | `html` |
| CSS | `css` |
| SQL | `sql` |
| Java | `java` |
| C/C++ | `c`, `cpp` |
| C# | `csharp`, `cs` |
| Ruby | `ruby`, `rb` |
| Go | `go` |
| Rust | `rust`, `rs` |
| Plain Text | `text`, `plaintext` |

### Spacing Around Code Blocks

```markdown
Install the package:

```bash
npm install express
```

Then start the server:

```bash
npm start
```
```

- **Before block**: One blank line
- **After block**: One blank line
- **No indentation** of the block itself

### Multi-Line Code Examples

```markdown
Here's a complete example:

```python
class Calculator:
    def add(self, a, b):
        return a + b
    
    def subtract(self, a, b):
        return a - b
```

This calculator handles basic operations.
```

### Code with Output

```markdown
Running the command:

```bash
$ npm run build
> Building...
> Successfully built!
```

The output shows success.
```

Include the prompt (`$`, `>`) and output for clarity.

### Inline Code in Code Blocks

Use backticks inside code blocks—markdown won't interpret them:

````markdown
```javascript
// This is a comment
const name = `template string`;
const regex = /`backtick`/;
```
````

No escaping needed inside fenced blocks.

## Emphasis and Strong Emphasis

### Bold (Strong Emphasis)
```markdown
Use **double asterisks** for bold.
Don't use __double underscores__.
```

**Use `**double asterisks**`.** Avoid `__underscores__`.

### Italic (Emphasis)
```markdown
Use *single asterisks* for italic.
Don't use _single underscores_.
```

**Use `*single asterisks*`.** Avoid `_underscores_`.

### Both Bold and Italic
```markdown
***This is bold and italic***
```

Rarely needed, use sparingly.

### When to Use Emphasis

**Bold** for:
- Strong emphasis
- Important terms
- Warnings
- Key concepts

*Italic* for:
- Mild emphasis
- Technical terms
- Book/film titles
- Stress on words

### What NOT to Emphasize

```markdown
# Don't use emphasis in headers
The header is already emphasized.

- Don't emphasize list items in markdown
Use it sparingly in lists.

`Don't emphasize code` with emphasis.
Use backticks for code.

> Don't emphasize blockquotes heavily
> They're already distinct.
```

## Blockquotes

### Basic Syntax
```markdown
> This is a quote.
> It can span multiple lines.
```

### With Spaces

```markdown
> This is quoted text.
>
> With a paragraph break.
```

Always add space after `>` marker.

### Nested Blockquotes

```markdown
> Level 1 quote.
>
> > Level 2 quote (indented).
> >
> > > Level 3 quote.
```

### Blockquotes with Other Elements

```markdown
> **Important warning:**
>
> This is a critical message.
>
> - Point one
> - Point two
>
> ```
> code block in quote
> ```
```

### Spacing Around Blockquotes

```markdown
Some context.

> Quoted material here.

More context after.
```

Add blank lines before and after blockquotes.

## Horizontal Rules

### Syntax
```markdown
---
```

Use **three dashes** `---`.

Other syntaxes work (`***`, `___`) but `---` is clearest.

### Spacing

```markdown
Section one content.

---

Section two content.
```

Always add blank lines before and after.

### Use Cases
- Separate major sections
- Visual breaks
- Thematic pause

Don't overuse—it can disrupt reading flow.

## Common Issues and Fixes

### Issue: No Language on Code Block

Before:
```markdown
```
npm install
```
```

After:
```markdown
```bash
npm install
```
```

### Issue: Wrong Emphasis Markers

Before:
```markdown
This is __bold__ and _italic_.
```

After:
```markdown
This is **bold** and *italic*.
```

### Issue: Inconsistent Backticks

Before:
```markdown
Use `functionName() for the function
or the `variable_name` for the variable.
```

After:
```markdown
Use `functionName()` for the function
or the `variable_name` for the variable.
```

### Issue: Missing Spacing Around Blocks

Before:
```markdown
Here's code:
```bash
code
```
Continuation.
```

After:
```markdown
Here's code:

```bash
code
```

Continuation.
```

## Validation Checklist

- [ ] Inline code uses single backticks
- [ ] All code blocks have language identifiers
- [ ] Fenced blocks (not indented)
- [ ] Bold uses `**double asterisks**`
- [ ] Italic uses `*single asterisks*`
- [ ] Blank lines before and after code blocks
- [ ] Blockquotes have space after `>`
- [ ] Blockquotes have blank lines before/after
- [ ] Horizontal rules use `---`
- [ ] No emphasis in headers or code

