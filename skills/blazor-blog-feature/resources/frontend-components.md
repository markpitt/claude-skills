# Frontend Components & UI Implementation

## Client-Side NuGet Packages

Add this package to your Client project:

```bash
# In the Client project directory
dotnet add package Markdig
```

This provides markdown-to-HTML conversion in the browser.

## Blog Listing Page Component

Create the blog index page that displays all posts:

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

## Blog Post Detail Page Component

Create the blog detail page that displays a single post with markdown rendering:

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

## Navigation Integration

Add blog link to your main navigation component:

```razor
@* Shared/NavMenu.razor or similar *@
<NavLink class="nav-link" href="blog">
    <span class="icon">📝</span> Blog
</NavLink>
```

## CSS Styling

Create comprehensive styling for the blog feature:

```css
/* wwwroot/css/blog.css */

/* Blog Container & Layout */
.blog-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

/* Blog Grid - Listing Page */
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

/* Post Metadata */
.post-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 1rem;
}

.post-meta span {
    display: flex;
    align-items: center;
}

.post-meta .author::before {
    content: "✍️ ";
    margin-right: 0.25rem;
}

.post-meta .date::before {
    content: "📅 ";
    margin-right: 0.25rem;
}

.post-meta .read-time::before {
    content: "⏱️ ";
    margin-right: 0.25rem;
}

.post-meta .updated::before {
    content: "✏️ ";
    margin-right: 0.25rem;
}

/* Excerpt & Tags */
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

/* Blog Post Detail Page */
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

/* Content Rendering */
.blog-post .content {
    line-height: 1.8;
    font-size: 1.125rem;
    color: #333;
}

.blog-post .content h2 {
    margin-top: 2rem;
    margin-bottom: 1rem;
    color: #333;
    font-size: 1.75rem;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 0.5rem;
}

.blog-post .content h3 {
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    color: #444;
    font-size: 1.25rem;
}

.blog-post .content img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 1.5rem 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.blog-post .content p {
    margin-bottom: 1rem;
}

.blog-post .content ul,
.blog-post .content ol {
    margin-bottom: 1rem;
    margin-left: 1.5rem;
}

.blog-post .content li {
    margin-bottom: 0.5rem;
}

.blog-post .content blockquote {
    border-left: 4px solid #007bff;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #666;
    font-style: italic;
}

/* Code Formatting */
.blog-post .content code {
    background: #f5f5f5;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
}

.blog-post .content pre {
    background: #2d2d2d;
    color: #f8f8f8;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    margin-bottom: 1rem;
}

.blog-post .content pre code {
    background: none;
    padding: 0;
    color: inherit;
}

/* State Messages */
.loading {
    text-align: center;
    padding: 3rem 1rem;
    color: #666;
}

.no-posts {
    text-align: center;
    padding: 3rem 1rem;
    background: #f9f9f9;
    border-radius: 8px;
}

.not-found {
    text-align: center;
    padding: 3rem 1rem;
}

.not-found h1 {
    color: #d32f2f;
    margin-bottom: 1rem;
}

/* Buttons */
.btn-primary,
.btn-secondary {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
}

.btn-primary {
    background-color: #007bff;
    color: white;
}

.btn-primary:hover {
    background-color: #0056b3;
}

.btn-secondary {
    background-color: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background-color: #545b62;
}

/* Responsive Design */
@media (max-width: 768px) {
    .blog-container {
        padding: 1rem;
    }

    .blog-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }

    .blog-post-container {
        padding: 1rem;
    }

    .blog-post header h1 {
        font-size: 1.75rem;
    }

    .blog-post .hero-image {
        height: 250px;
    }

    .post-meta {
        flex-direction: column;
        gap: 0.25rem;
    }

    .blog-post .content {
        font-size: 1rem;
    }
}

/* Print Styles */
@media print {
    .blog-container,
    .blog-post-container {
        max-width: none;
    }

    .btn-primary,
    .btn-secondary {
        display: none;
    }

    .blog-card {
        break-inside: avoid;
    }
}
```

## Key Component Features

### Index.razor (Blog Listing)
- Grid layout with responsive design (auto-fill, minmax)
- Loading state with spinner
- Empty state message
- Click navigation to post detail
- Metadata display (author, date, read time)
- Tag display for categorization

### Post.razor (Blog Detail)
- Featured image support
- Markdown-to-HTML rendering
- Back navigation
- 404 handling for missing posts
- Related metadata display
- Responsive typography

### Styling Highlights
- Mobile-responsive grid (mobile: 1 column, desktop: 3 columns)
- Hover effects for interactivity
- Code block styling for technical content
- Print styles for blog archives
- Accessibility-friendly color contrast

## Component Communication Flow

```
User navigates to /blog
    ↓
Index.razor OnInitialized
    ↓
Http.GetFromJsonAsync("api/blog/posts")
    ↓
Backend: GetBlogPosts function
    ↓
BlogStorageService: GetAllPostMetadataAsync
    ↓
Renders blog grid with posts
    ↓
User clicks post card
    ↓
NavigateTo("/blog/{slug}")
    ↓
Post.razor OnInitialized
    ↓
Http.GetFromJsonAsync("api/blog/posts/{slug}")
    ↓
Backend: GetBlogPost function
    ↓
BlogStorageService: GetPostBySlugAsync
    ↓
Renders full post with markdown
```

## Next Steps

1. Configure Azure environment in `azure-configuration.md`
2. Add sample content using `sample-content-troubleshooting.md`
3. Test components locally before deployment
