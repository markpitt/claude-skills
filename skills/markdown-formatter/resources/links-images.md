# Links, Images, and References

Reference for links, images, reference styles, and alt text.

## Inline Links

### Basic Syntax
```markdown
[link text](https://example.com)
```

Keep it simple: text in brackets, URL in parentheses.

### Good Link Text
```markdown
<!-- Descriptive -->
See the [installation guide](https://example.com) for setup steps.
Check the [API documentation](https://example.com) for more details.
Read about [configuration options](https://example.com) to customize behavior.

<!-- Not descriptive -->
Click [here](https://example.com) for details.
For more info, see [this](https://example.com).
[Link](https://example.com) to the guide.
```

**Link text should be descriptive** and make sense out of context.

### URLs with Special Characters

```markdown
[resource](https://example.com/path?param=value&other=123)

[anchor link](https://example.com#section-name)
```

URLs are encoded automatically. Keep them as-is.

## Reference-Style Links

### When to Use
```markdown
For repeated URLs or when you want cleaner text:

See the [documentation][docs] for details.
Visit the [repository][repo] for code.
Check the [blog post][blog] for examples.

[docs]: https://example.com/documentation
[repo]: https://github.com/user/project
[blog]: https://example.com/blog-post
```

Use reference links when:
- Same URL appears multiple times
- URLs are very long
- You want cleaner text flow

### Reference Link Styles

```markdown
<!-- Style 1: Implicit -->
See [documentation][]

[documentation]: https://example.com

<!-- Style 2: Named -->
See [the full guide][guide]

[guide]: https://example.com

<!-- Style 3: Numbered -->
For details, see [1].

[1]: https://example.com
```

### Organizing References

```markdown
# My Document

Introduction with links to [concepts][1] and [examples][2].

## Section One

More text with [additional resources][3].

## References

[1]: https://example.com/concepts
[2]: https://example.com/examples
[3]: https://example.com/resources
```

Group all reference definitions at the bottom.

## Images

### Basic Syntax
```markdown
![alt text](image-url.jpg)
```

The alt text goes in square brackets. The URL goes in parentheses.

### Alt Text Guidelines

**Good alt text:**
```markdown
![Claude logo on blue background](logo.png)
![Screenshot of dashboard with navigation menu highlighted](dashboard.png)
![Graph showing sales increase from 2020 to 2024](sales-chart.png)
```

**Poor alt text:**
```markdown
![image](logo.png)
![screenshot](dashboard.png)
![chart](sales-chart.png)
```

Alt text should be:
- Descriptive and specific
- Concise but informative
- Meaningful if someone can't see the image
- Not redundant with surrounding text

### Image Dimensions (Optional)

```markdown
[Logo][logo-img]{width=100}

[logo-img]: /assets/logo.png
```

Some markdown flavors support sizing. Check your platform.

### Image Links

```markdown
[![alt text](image.png)](https://example.com)
```

Clicking the image goes to the URL.

### Local vs. Remote Images

```markdown
<!-- Local image (relative path) -->
![Project logo](./assets/logo.png)

<!-- Remote image (full URL) -->
![Project logo](https://example.com/assets/logo.png)

<!-- Absolute path (avoid in shared projects) -->
![Project logo](/home/user/project/assets/logo.png)
```

Use relative paths for portability.

## Spacing Around Images

```markdown
Some context about the image.

![Descriptive alt text](image.png)

Explanation or related text.
```

Add blank lines before and after images for readability.

### Image in Lists

```markdown
- **Item with image**

  ![Relevant image](image.png)

  Description of the image.

- **Another item**
```

Indent images and descriptions within list items.

## Complex Reference Setups

### Many Images
```markdown
# Gallery

![First image][img1]
![Second image][img2]
![Third image][img3]

[img1]: /assets/image1.jpg
[img2]: /assets/image2.jpg
[img3]: /assets/image3.jpg
```

### Mixed References

```markdown
See the [documentation][1] and [examples][2].

![Example screenshot][img1]

For more, visit our [blog][blog].

[1]: https://example.com/docs
[2]: https://example.com/examples
[img1]: /assets/screenshot.png
[blog]: https://example.com/blog
```

## Tables with Links

```markdown
| Feature | Documentation |
|---------|---------------|
| Installation | [Guide](https://example.com/install) |
| Configuration | [Guide](https://example.com/config) |
| API Reference | [Docs](https://example.com/api) |
```

Links work in tables. Use inline style for readability.

## Anchor Links (Internal References)

### Basic Anchor
```markdown
# Main Section

Content here.

## Subsection

More content.

Jump to [Main Section](#main-section).
```

Most markdown renderers auto-generate anchors from headers.

### Creating Custom Anchors

```markdown
<a name="custom-anchor"></a>

## Section with Custom Anchor

Content here.

[Jump to this section](#custom-anchor)
```

HTML anchor tags work in markdown.

## Common Issues and Fixes

### Issue: Bad Link Text

Before:
```markdown
For details, click [here](https://example.com).
See [this link](https://example.com) for more.
```

After:
```markdown
See the [detailed guide](https://example.com).
Check the [API documentation](https://example.com).
```

### Issue: Missing Alt Text

Before:
```markdown
![](screenshot.png)
```

After:
```markdown
![Dashboard showing user analytics](screenshot.png)
```

### Issue: Broken Image Path

Before:
```markdown
![Logo](../../../assets/logo.png)
```

After:
```markdown
![Logo](./assets/logo.png)
```

Use relative paths from the document location.

### Issue: Inconsistent Reference Style

Before:
```markdown
See [guide1](url1) and the [guide 2][ref2].

[ref2]: url2
```

After:
```markdown
See [guide 1](url1) and [guide 2](url2).

<!-- Or use references consistently -->
See [guide 1][1] and [guide 2][2].

[1]: url1
[2]: url2
```

## Tables with Images and Links

```markdown
| Item | Image | Documentation |
|------|-------|----------------|
| Feature A | ![Icon][icon1] | [Docs][doc1] |
| Feature B | ![Icon][icon2] | [Docs][doc2] |

[icon1]: /assets/icon-a.png
[icon2]: /assets/icon-b.png
[doc1]: https://example.com/feature-a
[doc2]: https://example.com/feature-b
```

## Validation Checklist

### Links
- [ ] Link text is descriptive
- [ ] No "click here" or "here" links
- [ ] URLs are valid and working
- [ ] Relative paths use `./` correctly
- [ ] Reference links grouped together
- [ ] Consistent link style throughout

### Images
- [ ] All images have alt text
- [ ] Alt text is descriptive
- [ ] Image paths are correct
- [ ] Relative paths use `./` correctly
- [ ] Blank lines around images
- [ ] File formats are web-friendly (jpg, png, webp)

### References
- [ ] Reference definitions are clear
- [ ] No orphaned references
- [ ] Reference style is consistent
- [ ] All links are properly formatted
- [ ] Anchor links work correctly

