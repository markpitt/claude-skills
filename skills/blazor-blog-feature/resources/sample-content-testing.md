# Sample Content, Testing & Troubleshooting

## Sample Blog Post Format

Create an example markdown file for your blog:

```markdown
---
title: "Getting Started with Our Blog"
slug: "getting-started"
author: "Your Name"
publishedDate: 2025-01-15T10:00:00Z
excerpt: "Welcome to our blog! Discover the latest insights, tutorials, and updates."
tags:
  - welcome
  - getting-started
featuredImage: "/images/blog/welcome.jpg"
readTimeMinutes: 5
---

# Getting Started

Welcome to our blog! This is where we share insights, tutorials, and updates.

## What You'll Find Here

- **Technical Tutorials**: Step-by-step guides for developers
- **Industry Insights**: Analysis and trends in technology
- **Product Updates**: Latest features and improvements
- **Best Practices**: Tips and techniques for better development

## Featured Content Series

We organize content into several key areas:

### Blazor Development
Learn building modern web applications with Blazor, from basic components to advanced patterns.

### Azure Services
Deep dives into Azure services including Static Web Apps, Functions, Storage, and more.

### .NET Best Practices
Industry best practices for building robust, scalable .NET applications.

## Getting Started as a Reader

1. Browse blog posts on the [blog main page](/blog)
2. Click any post to read the full article
3. Check the tags to find related articles
4. Share posts with your network

## For Content Creators

To add a new blog post:

1. Create markdown file in `blog-posts/` folder
2. Include required YAML frontmatter
3. Write your content
4. Upload to Azure File Share
5. Posts appear automatically within minutes

## Stay Connected

Subscribe to our updates and follow us for the latest content!

---

**Happy reading!** We hope you find valuable content here.
```

## Testing Workflow - Complete Checklist

### Phase 1: Local Setup

- [ ] Install .NET 10 SDK
- [ ] Install Azure Functions Core Tools (v4+)
- [ ] Install Azure Static Web Apps CLI
- [ ] Create local test markdown files
- [ ] Start Azure Storage Emulator or Azurite

### Phase 2: Backend Testing

```bash
# Start Azure Functions locally
cd src/YourProject.Api
func start

# In another terminal, test endpoints
curl http://localhost:7071/api/blog/posts
curl http://localhost:7071/api/blog/posts/getting-started

# Expected response for first call:
# [] (empty array if no posts)

# Expected response for second call:
# 404 error (post doesn't exist yet)
```

Validation:
- [ ] Both endpoints respond
- [ ] Endpoints return correct HTTP status codes
- [ ] Function logs show activity in terminal

### Phase 3: File Share Integration Testing

1. Add sample markdown file to local file share emulator
2. Verify filename matches format: `{slug}.md`
3. Test GetBlogPosts endpoint
4. Test GetBlogPost endpoint with slug

Expected behavior:
- [ ] GetBlogPosts returns array with 1+ posts
- [ ] GetBlogPost returns full post data
- [ ] Frontmatter YAML parsed correctly
- [ ] Markdown content included in response

### Phase 4: Frontend Component Testing

```bash
# Start Blazor with SWA CLI
swa start http://localhost:3000 --api-location api

# Navigate to http://localhost:3000/blog
```

Validation:
- [ ] Blog listing page loads
- [ ] Posts display in grid
- [ ] Featured images appear
- [ ] Metadata displays correctly
- [ ] Click navigates to detail page

### Phase 5: Markdown Rendering Testing

On blog detail page:
- [ ] Headings render correctly
- [ ] Lists format properly
- [ ] Code blocks display with syntax highlighting
- [ ] Links are clickable
- [ ] Images display
- [ ] Tables (if included) render

### Phase 6: Error State Testing

Test these scenarios:
- [ ] No posts exist → "No posts available" message
- [ ] Invalid slug → 404 with "Post Not Found"
- [ ] API unavailable → Error message displays
- [ ] Featured image missing → Graceful fallback
- [ ] Malformed frontmatter → Post skipped or error logged

### Phase 7: Performance Testing

Measure with browser DevTools:
- [ ] Blog listing page loads in <2s
- [ ] Blog detail page loads in <1s
- [ ] No console errors
- [ ] Network requests have acceptable size

### Phase 8: Responsive Testing

Test on multiple screen sizes:
- [ ] Mobile (375px): Single column layout
- [ ] Tablet (768px): 2-3 columns
- [ ] Desktop (1440px): Full grid layout
- [ ] Large (1920px+): Maintains max-width

## Troubleshooting Guide

### Problem: Blog posts not loading (empty list)

**Symptom:** GetBlogPosts returns empty array []

**Diagnosis Steps:**
1. Check file share connection string in local.settings.json
2. Verify markdown files exist in `blog-posts/` directory
3. Check file names end with `.md`
4. Verify YAML frontmatter is valid (between `---` markers)

**Solution:**
1. Open Azure Storage Explorer
2. Connect to local storage emulator
3. Navigate to file share → blog-posts folder
4. Add test markdown file if missing
5. Restart Azure Functions
6. Retest endpoint

### Problem: "Post not found" error

**Symptom:** GetBlogPost returns 404 for valid slug

**Diagnosis Steps:**
1. Verify filename matches slug: `{slug}.md`
2. Check slug parameter in URL matches filename
3. Verify file encoding is UTF-8
4. Check for case sensitivity in slug

**Example:**
- Slug: `getting-started`
- Expected filename: `getting-started.md` ✓
- Won't work: `Getting-Started.md` ✗

**Solution:**
1. Rename file to match slug exactly
2. Test with simplified slug (e.g., "test")
3. Verify frontmatter contains matching slug property

### Problem: Markdown not rendering

**Symptom:** Blog detail page shows raw markdown text

**Diagnosis Steps:**
1. Check browser console for errors
2. Verify Markdig package installed in Client
3. Check markdown syntax validity
4. Look for special characters that need escaping

**Solution:**
```csharp
// Verify pipeline creation in Post.razor
var pipeline = new MarkdownPipelineBuilder()
    .UseAdvancedExtensions()
    .Build();
renderedContent = Markdown.ToHtml(post.Content, pipeline);
```

1. Check `UseAdvancedExtensions()` is called
2. Verify markdown content is being passed correctly
3. Test with simple markdown first (# Heading)

### Problem: Featured images not displaying

**Symptom:** Image placeholders show but images don't load

**Diagnosis Steps:**
1. Check image URL in frontmatter
2. Verify image file exists at specified path
3. Check browser Network tab for 404 errors
4. Test with absolute vs. relative paths

**Solution:**
1. Use absolute path: `/images/blog/my-image.jpg`
2. Verify image uploaded to correct location
3. Check image format is supported (jpg, png, gif, webp)
4. Fallback: Use no featured image for testing

### Problem: Components not updating after page navigation

**Symptom:** Detail page shows old post when navigating between posts

**Diagnosis Steps:**
1. Check OnParametersSetAsync override in Post.razor
2. Verify slug parameter changes on navigation
3. Check component re-initialization logic

**Solution:**
```csharp
// Ensure Post.razor has proper navigation handling
protected override async Task OnParametersSetAsync()
{
    await LoadPost(); // Re-load when slug changes
}
```

### Problem: YAML frontmatter not parsed

**Symptom:** Posts missing metadata (author, tags, etc.)

**Diagnosis Steps:**
1. Verify YAML syntax validity
2. Check property names match expected format
3. Verify date format is ISO 8601
4. Check indentation (YAML is whitespace-sensitive)

**Valid YAML Example:**
```yaml
---
title: "Post Title"
slug: "post-slug"
author: "Name"
publishedDate: 2025-01-15T10:00:00Z
excerpt: "Summary"
tags:
  - tag1
  - tag2
---
```

**Common Issues:**
- ❌ `published-date` should be `publishedDate` (camelCase)
- ❌ Missing quotes around strings
- ❌ Inconsistent indentation
- ✓ ISO 8601 dates with Z suffix

### Problem: Azure Static Web App deployment fails

**Symptom:** Deployment pipeline fails or blog not working in production

**Diagnosis Steps:**
1. Check build logs in Azure Portal
2. Verify environment variables configured
3. Test locally first before deploying
4. Review staticwebapp.config.json syntax

**Solution:**
1. Ensure all configuration variables set:
   - `BlogFileShareName`
   - `AzureWebJobsStorage`
2. Verify connection string format
3. Test Functions deployment separately
4. Check SWA configuration for correct API location

## Sample Data for Testing

### Minimal Post
```markdown
---
title: "Test Post"
slug: "test-post"
author: "Tester"
publishedDate: 2025-01-15T10:00:00Z
excerpt: "Testing"
tags:
  - test
featuredImage: ""
readTimeMinutes: 1
---

# Test Post

This is a test.
```

### Comprehensive Post
```markdown
---
title: "Complete Blazor Blog Implementation"
slug: "blazor-blog-complete"
author: "Jane Developer"
publishedDate: 2025-01-20T14:30:00Z
updatedDate: 2025-01-21T09:00:00Z
excerpt: "A comprehensive guide to implementing a blog feature in Blazor WASM with Azure backend"
tags:
  - blazor
  - azure
  - blog
  - tutorial
featuredImage: "/images/blog/blazor-blog.jpg"
readTimeMinutes: 12
---

# Complete Blazor Blog Implementation

## Introduction

Learn how to build a production-ready blog feature for your Blazor application.

## Architecture Overview

The blog uses three key components:

### Frontend
- Blazor WASM components
- Markdown rendering
- Responsive UI

### Backend
- Azure Functions API
- File Share integration
- Metadata parsing

### Storage
- Azure File Share
- Markdown files
- Image management

## Getting Started

1. Set up Azure resources
2. Create Shared models
3. Implement backend services
4. Build frontend components
5. Test and deploy

## Code Example

```csharp
public class BlogPost
{
    public string Title { get; set; }
    public string Content { get; set; }
}
```

## Conclusion

This completes the implementation guide!
```

## Quick Reference - Common Tasks

### Add a New Blog Post
1. Create markdown file: `your-slug.md`
2. Add YAML frontmatter with required properties
3. Write markdown content
4. Upload to `blog-posts/` in file share
5. Wait 30-60 seconds for cache to clear
6. Post appears automatically

### Update an Existing Post
1. Edit markdown file in file share
2. Update frontmatter properties as needed
3. Save changes
4. Cache clears automatically within 1 minute
5. Changes appear on site

### Debug a Failing Post
1. Check filename matches slug exactly
2. Validate YAML frontmatter syntax
3. Verify content after `---` delimiter
4. Look in function logs for parsing errors
5. Test with simpler markdown first

### Performance Tuning
1. Resize featured images (< 200KB)
2. Limit posts per page (consider pagination)
3. Add CDN for static assets
4. Cache blog metadata in frontend
5. Consider database for thousands+ posts

## Next Steps

1. Deploy to Azure Static Web App staging
2. Test full end-to-end workflow
3. Add additional sample posts
4. Plan content calendar
5. Consider enhancements (search, comments, categories)

## Enhancement Ideas for Future

- **Pagination:** Limit posts per page for performance
- **Categories:** Organize posts by topic
- **Search:** Full-text search across posts
- **RSS Feed:** Generate RSS for subscribers
- **Comments:** Enable reader discussion
- **Related Posts:** Show similar articles
- **Author Management:** Multiple authors per post
- **Draft Status:** Schedule future posts
- **Analytics:** Track page views and engagement
- **Email Subscription:** Newsletter integration
