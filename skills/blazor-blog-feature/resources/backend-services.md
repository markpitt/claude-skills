# Backend Services & Azure Functions Implementation

## Required NuGet Packages

Add these packages to your Api project:

```bash
# In the Api project directory
dotnet add package Azure.Storage.Files.Shares
dotnet add package YamlDotNet
dotnet add package Markdig
```

These provide:
- **Azure.Storage.Files.Shares**: Azure File Share client library for C#
- **YamlDotNet**: Parse YAML frontmatter from markdown files
- **Markdig**: Markdown processing (optional for backend, required for client)

## BlogStorageService: File Share Integration

Create the core service for interacting with Azure File Share:

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

## Azure Functions Implementation

### GetBlogPosts Function
Lists all blog posts with metadata (for blog index page):

```csharp
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
```

### GetBlogPost Function
Retrieves a single blog post by slug (for blog detail page):

```csharp
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
```

### Complete BlogFunctions Class
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

## Dependency Injection Configuration

Update `Program.cs` in the API project to register the blog service:

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

## Key Implementation Details

### Frontmatter Parsing
- Uses YAML frontmatter format: `--- metadata --- content`
- Properties: title, slug, author, publishedDate, excerpt, tags, featuredImage, readTimeMinutes
- Automatically extracts from markdown between `---` delimiters

### File Share Integration
- Connects via connection string
- Reads from `blog-posts/` directory
- Filters `.md` files only
- Orders by publication date (newest first)
- Handles 404 gracefully when post not found

### Error Handling
- Logs all operations with request information
- Returns 404 when post not found
- Returns 500 on unexpected errors
- Provides meaningful error messages to client

### Performance Considerations
- `GetAllPostMetadataAsync` fetches metadata only (smaller payloads)
- `GetPostBySlugAsync` fetches full content on demand
- Metadata caching can be added in future (see Next Steps)
- Connection string loaded from configuration once at startup

## Testing Locally

Test Azure Functions locally:

```bash
# Start the functions runtime
dotnet run --project src/YourProject.Api

# Test GetBlogPosts endpoint
curl http://localhost:7071/api/blog/posts

# Test GetBlogPost endpoint
curl http://localhost:7071/api/blog/posts/getting-started
```

Expected responses:
- `GetBlogPosts`: Returns array of BlogPostMetadata objects
- `GetBlogPost`: Returns single BlogPost object with full content

## Next Steps

1. Implement frontend components in `frontend-components.md`
2. Configure Azure environment in `azure-configuration.md`
3. Add sample content using `sample-content-troubleshooting.md`
