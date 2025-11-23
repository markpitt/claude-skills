---
name: blazor-blog-feature
description: Adds a complete blog feature to an existing Blazor WebAssembly Static Web App with Azure Functions backend and Azure File Share for markdown storage. Use when implementing blog functionality in .NET Blazor WASM projects with Azure infrastructure. Includes post listing, detail pages, markdown rendering, Azure Storage integration, and full implementation steps.
version: 1.0
allowed-tools: Read, Edit, Write, Bash, Glob, Grep
---

# Blog Feature Skill for Blazor WASM + Azure Functions

## Description
Add a complete blog feature to an existing Blazor WASM Static Web App with Azure Functions backend and Azure File Share for markdown storage.

## Prerequisites
- Existing Blazor WASM SWA project
- Azure Functions API project
- Azure Storage account with File Share configured
- .NET 10 SDK (or current version)
- Azure Static Web Apps CLI

## Architecture Overview

**Frontend (Blazor WASM):**
- Blog listing page
- Blog post detail page
- Markdown rendering
- Routing and navigation

**Backend (Azure Functions):**
- HTTP triggered function to list blog posts
- HTTP triggered function to get individual post
- Azure File Share integration for markdown files
- Blog metadata management

**Storage:**
- Azure File Share with `/blog-posts` directory
- Markdown files with frontmatter metadata
- Images in `/blog-posts/images`

## Implementation Steps

### Step 1: Explore Existing Project Structure

First, understand the current project layout:

1. Search for the Blazor Client project (typically `*.Client.csproj`)
2. Search for the Azure Functions API project (typically `*.Api.csproj`)
3. Identify the shared models project (if exists) or create DTOs
4. Check existing routing patterns in the Client
5. Review existing Azure Functions structure

### Step 2: Create Shared Models

Create blog-related DTOs that will be shared between Client and API:

```csharp
// BlogPost.cs
namespace YourProject.Shared.Models;

public class BlogPost
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public DateTime PublishedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public string Excerpt { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public string FeaturedImage { get; set; } = string.Empty;
    public int ReadTimeMinutes { get; set; }
}

public class BlogPostMetadata
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public DateTime PublishedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public string Excerpt { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public string FeaturedImage { get; set; } = string.Empty;
    public int ReadTimeMinutes { get; set; }
}
```

### Step 3: Add NuGet Packages

Add required packages to the API project:

```bash
# In the Api project directory
dotnet add package Azure.Storage.Files.Shares
dotnet add package YamlDotNet
dotnet add package Markdig
```

Add required packages to the Client project:

```bash
# In the Client project directory
dotnet add package Markdig
```

### Step 4: Create Azure File Share Service

Create a service in the API project to interact with Azure File Share:

```csharp
// Services/BlogStorageService.cs
using Azure.Storage.Files.Shares;
using Azure.Storage.Files.Shares.Models;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace YourProject.Api.Services;

public interface IBlogStorageService
{
    Task<List<BlogPostMetadata>> GetAllPostMetadataAsync();
    Task<BlogPost?> GetPostBySlugAsync(string slug);
}

public class BlogStorageService : IBlogStorageService
{
    private readonly ShareClient _shareClient;
    private readonly ILogger<BlogStorageService> _logger;
    private const string BlogPostsDirectory = "blog-posts";

    public BlogStorageService(string connectionString, string shareName, ILogger<BlogStorageService> logger)
    {
        _shareClient = new ShareClient(connectionString, shareName);
        _logger = logger;
    }

    public async Task<List<BlogPostMetadata>> GetAllPostMetadataAsync()
    {
        var posts = new List<BlogPostMetadata>();
        var directoryClient = _shareClient.GetDirectoryClient(BlogPostsDirectory);

        await foreach (var item in directoryClient.GetFilesAndDirectoriesAsync())
        {
            if (item.IsDirectory || !item.Name.EndsWith(".md"))
                continue;

            var fileClient = directoryClient.GetFileClient(item.Name);
            var download = await fileClient.DownloadAsync();

            using var reader = new StreamReader(download.Value.Content);
            var content = await reader.ReadToEndAsync();

            var metadata = ParseFrontmatter(content, item.Name);
            if (metadata != null)
                posts.Add(metadata);
        }

        return posts.OrderByDescending(p => p.PublishedDate).ToList();
    }

    public async Task<BlogPost?> GetPostBySlugAsync(string slug)
    {
        var directoryClient = _shareClient.GetDirectoryClient(BlogPostsDirectory);
        var fileName = $"{slug}.md";
        var fileClient = directoryClient.GetFileClient(fileName);

        try
        {
            var download = await fileClient.DownloadAsync();
            using var reader = new StreamReader(download.Value.Content);
            var content = await reader.ReadToEndAsync();

            return ParseFullPost(content, fileName);
        }
        catch (Azure.RequestFailedException ex) when (ex.Status == 404)
        {
            _logger.LogWarning("Blog post not found: {Slug}", slug);
            return null;
        }
    }

    private BlogPostMetadata? ParseFrontmatter(string content, string fileName)
    {
        var parts = content.Split("---", 3);
        if (parts.Length < 3) return null;

        var deserializer = new DeserializerBuilder()
            .WithNamingConvention(CamelCaseNamingConvention.Instance)
            .Build();

        var frontmatter = deserializer.Deserialize<BlogPostMetadata>(parts[1].Trim());
        frontmatter.Id = Path.GetFileNameWithoutExtension(fileName);

        return frontmatter;
    }

    private BlogPost? ParseFullPost(string content, string fileName)
    {
        var parts = content.Split("---", 3);
        if (parts.Length < 3) return null;

        var deserializer = new DeserializerBuilder()
            .WithNamingConvention(CamelCaseNamingConvention.Instance)
            .Build();

        var post = deserializer.Deserialize<BlogPost>(parts[1].Trim());
        post.Id = Path.GetFileNameWithoutExtension(fileName);
        post.Content = parts[2].Trim();

        return post;
    }
}
```

### Step 5: Create Azure Functions

Create HTTP-triggered functions for blog operations:

```csharp
// Functions/BlogFunctions.cs
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using System.Net;

namespace YourProject.Api.Functions;

public class BlogFunctions
{
    private readonly IBlogStorageService _blogService;
    private readonly ILogger<BlogFunctions> _logger;

    public BlogFunctions(IBlogStorageService blogService, ILogger<BlogFunctions> logger)
    {
        _blogService = blogService;
        _logger = logger;
    }

    [Function("GetBlogPosts")]
    public async Task<HttpResponseData> GetBlogPosts(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "blog/posts")] HttpRequestData req)
    {
        _logger.LogInformation("Getting all blog posts");

        try
        {
            var posts = await _blogService.GetAllPostMetadataAsync();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(posts);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting blog posts");
            var response = req.CreateResponse(HttpStatusCode.InternalServerError);
            await response.WriteStringAsync("Error retrieving blog posts");
            return response;
        }
    }

    [Function("GetBlogPost")]
    public async Task<HttpResponseData> GetBlogPost(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "blog/posts/{slug}")] HttpRequestData req,
        string slug)
    {
        _logger.LogInformation("Getting blog post: {Slug}", slug);

        try
        {
            var post = await _blogService.GetPostBySlugAsync(slug);

            if (post == null)
            {
                var notFoundResponse = req.CreateResponse(HttpStatusCode.NotFound);
                await notFoundResponse.WriteStringAsync($"Blog post '{slug}' not found");
                return notFoundResponse;
            }

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(post);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting blog post: {Slug}", slug);
            var response = req.CreateResponse(HttpStatusCode.InternalServerError);
            await response.WriteStringAsync("Error retrieving blog post");
            return response;
        }
    }
}
```

### Step 6: Configure Dependency Injection

Update Program.cs in the API project:

```csharp
// Program.cs additions
builder.Services.AddSingleton<IBlogStorageService>(sp =>
{
    var connectionString = Environment.GetEnvironmentVariable("AzureWebJobsStorage");
    var shareName = Environment.GetEnvironmentVariable("BlogFileShareName") ?? "blog-content";
    var logger = sp.GetRequiredService<ILogger<BlogStorageService>>();
    return new BlogStorageService(connectionString!, shareName, logger);
});
```

### Step 7: Create Blazor Blog Components

Create blog listing page:

```razor
@* Pages/Blog/Index.razor *@
@page "/blog"
@inject HttpClient Http
@inject NavigationManager Navigation

<PageTitle>Blog</PageTitle>

<div class="blog-container">
    <h1>Blog</h1>
    <p class="lead">Latest articles and insights</p>

    @if (isLoading)
    {
        <div class="loading">
            <p>Loading posts...</p>
        </div>
    }
    else if (posts == null || !posts.Any())
    {
        <div class="no-posts">
            <p>No blog posts available yet. Check back soon!</p>
        </div>
    }
    else
    {
        <div class="blog-grid">
            @foreach (var post in posts)
            {
                <article class="blog-card" @onclick="() => NavigateToPost(post.Slug)">
                    @if (!string.IsNullOrEmpty(post.FeaturedImage))
                    {
                        <img src="@post.FeaturedImage" alt="@post.Title" class="featured-image" />
                    }
                    <div class="blog-card-content">
                        <h2>@post.Title</h2>
                        <div class="post-meta">
                            <span class="author">@post.Author</span>
                            <span class="date">@post.PublishedDate.ToString("MMM dd, yyyy")</span>
                            <span class="read-time">@post.ReadTimeMinutes min read</span>
                        </div>
                        <p class="excerpt">@post.Excerpt</p>
                        <div class="tags">
                            @foreach (var tag in post.Tags)
                            {
                                <span class="tag">@tag</span>
                            }
                        </div>
                    </div>
                </article>
            }
        </div>
    }
</div>

@code {
    private List<BlogPostMetadata>? posts;
    private bool isLoading = true;

    protected override async Task OnInitializedAsync()
    {
        try
        {
            posts = await Http.GetFromJsonAsync<List<BlogPostMetadata>>("api/blog/posts");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading posts: {ex.Message}");
        }
        finally
        {
            isLoading = false;
        }
    }

    private void NavigateToPost(string slug)
    {
        Navigation.NavigateTo($"/blog/{slug}");
    }
}
```

Create blog post detail page:

```razor
@* Pages/Blog/Post.razor *@
@page "/blog/{slug}"
@inject HttpClient Http
@inject NavigationManager Navigation
@using Markdig

<PageTitle>@(post?.Title ?? "Loading...")</PageTitle>

<div class="blog-post-container">
    @if (isLoading)
    {
        <div class="loading">
            <p>Loading post...</p>
        </div>
    }
    else if (post == null)
    {
        <div class="not-found">
            <h1>Post Not Found</h1>
            <p>The blog post you're looking for doesn't exist.</p>
            <button class="btn-primary" @onclick="NavigateToList">Back to Blog</button>
        </div>
    }
    else
    {
        <article class="blog-post">
            @if (!string.IsNullOrEmpty(post.FeaturedImage))
            {
                <img src="@post.FeaturedImage" alt="@post.Title" class="hero-image" />
            }

            <header>
                <h1>@post.Title</h1>
                <div class="post-meta">
                    <span class="author">By @post.Author</span>
                    <span class="date">@post.PublishedDate.ToString("MMMM dd, yyyy")</span>
                    @if (post.UpdatedDate.HasValue)
                    {
                        <span class="updated">Updated: @post.UpdatedDate.Value.ToString("MMM dd, yyyy")</span>
                    }
                    <span class="read-time">@post.ReadTimeMinutes min read</span>
                </div>
                <div class="tags">
                    @foreach (var tag in post.Tags)
                    {
                        <span class="tag">@tag</span>
                    }
                </div>
            </header>

            <div class="content">
                @((MarkupString)renderedContent)
            </div>

            <footer>
                <button class="btn-secondary" @onclick="NavigateToList">← Back to Blog</button>
            </footer>
        </article>
    }
</div>

@code {
    [Parameter]
    public string Slug { get; set; } = string.Empty;

    private BlogPost? post;
    private string renderedContent = string.Empty;
    private bool isLoading = true;

    protected override async Task OnInitializedAsync()
    {
        await LoadPost();
    }

    protected override async Task OnParametersSetAsync()
    {
        await LoadPost();
    }

    private async Task LoadPost()
    {
        isLoading = true;
        try
        {
            post = await Http.GetFromJsonAsync<BlogPost>($"api/blog/posts/{Slug}");

            if (post != null)
            {
                var pipeline = new MarkdownPipelineBuilder()
                    .UseAdvancedExtensions()
                    .Build();
                renderedContent = Markdown.ToHtml(post.Content, pipeline);
            }
        }
        catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            post = null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading post: {ex.Message}");
            post = null;
        }
        finally
        {
            isLoading = false;
        }
    }

    private void NavigateToList()
    {
        Navigation.NavigateTo("/blog");
    }
}
```

### Step 8: Add CSS Styling

Create blog-specific styles:

```css
/* wwwroot/css/blog.css */
.blog-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.blog-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.blog-card {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.blog-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.blog-card .featured-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.blog-card-content {
    padding: 1.5rem;
}

.blog-card h2 {
    margin: 0 0 1rem;
    font-size: 1.5rem;
    color: #333;
}

.post-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 1rem;
}

.excerpt {
    color: #444;
    line-height: 1.6;
    margin-bottom: 1rem;
}

.tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.tag {
    background: #f0f0f0;
    color: #333;
    padding: 0.25rem 0.75rem;
    border-radius: 16px;
    font-size: 0.75rem;
    font-weight: 500;
}

/* Blog Post Detail */
.blog-post-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
}

.blog-post .hero-image {
    width: 100%;
    height: 400px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 2rem;
}

.blog-post header h1 {
    font-size: 2.5rem;
    color: #333;
    margin-bottom: 1rem;
}

.blog-post .content {
    line-height: 1.8;
    font-size: 1.125rem;
    color: #333;
}

.blog-post .content h2 {
    margin-top: 2rem;
    margin-bottom: 1rem;
    color: #333;
}

.blog-post .content img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 1.5rem 0;
}

.blog-post .content code {
    background: #f5f5f5;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
}

.blog-post .content pre {
    background: #2d2d2d;
    color: #f8f8f8;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
}

.blog-post footer {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid #e0e0e0;
}
```

### Step 9: Update Navigation

Add blog link to main navigation:

```razor
@* Shared/NavMenu.razor or similar *@
<NavLink class="nav-link" href="blog">
    <span class="icon">📝</span> Blog
</NavLink>
```

### Step 10: Configure Local Settings

Add configuration to `local.settings.json` in the API project:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "BlogFileShareName": "blog-content"
  }
}
```

### Step 11: Create Sample Blog Post

Create an example markdown file format for Azure File Share:

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

## Stay Connected

Subscribe to our RSS feed or follow us on social media to get the latest updates.

We're excited to share our knowledge with you!
```

### Step 12: Testing

1. **Test Azure Functions locally:**
   ```bash
   dotnet run --project src/YourProject.Api
   curl http://localhost:7071/api/blog/posts
   ```

2. **Test Blazor Client:**
   ```bash
   swa start
   ```

3. **Integration test:**
   - Navigate to `/blog`
   - Verify posts load
   - Click a post
   - Verify markdown renders correctly

### Step 13: Deploy Configuration

Add environment variables to Azure Static Web App:

```bash
# Using Azure CLI
az staticwebapp appsettings set \
  --name your-app-name \
  --setting-names \
    BlogFileShareName=blog-content \
    AzureWebJobsStorage="<connection-string>"
```

## Expected File Structure

After implementation, you should have:

```
YourProject/
├── src/
│   ├── YourProject.Client/
│   │   ├── Pages/
│   │   │   └── Blog/
│   │   │       ├── Index.razor
│   │   │       └── Post.razor
│   │   └── wwwroot/
│   │       └── css/
│   │           └── blog.css
│   ├── YourProject.Api/
│   │   ├── Functions/
│   │   │   └── BlogFunctions.cs
│   │   ├── Services/
│   │   │   └── BlogStorageService.cs
│   │   └── Program.cs
│   └── YourProject.Shared/
│       └── Models/
│           └── BlogPost.cs
```

## Azure File Share Setup

1. Create Azure Storage Account
2. Create File Share named `blog-content`
3. Create directory `/blog-posts`
4. Upload markdown files
5. Copy connection string to configuration

## Troubleshooting

**Issue: Posts not loading**
- Check Azure Storage connection string
- Verify File Share name matches configuration
- Check Function logs for errors

**Issue: Markdown not rendering**
- Verify Markdig package is installed
- Check browser console for errors
- Validate markdown syntax

**Issue: 404 on API calls**
- Verify SWA CLI is proxying correctly
- Check Function route configuration
- Review `staticwebapp.config.json`

## Next Steps

- Add pagination for blog posts
- Implement search functionality
- Add RSS feed generation
- Create admin interface for post management
- Add comments system
- Implement post categories
- Add SEO metadata

## Security Considerations

- Implement rate limiting on API endpoints
- Sanitize markdown content
- Add CORS configuration
- Implement caching headers
- Consider CDN for images

---

**Built with**: Blazor WASM, Azure Functions, Azure File Share, Markdown
