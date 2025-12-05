# Core Architecture & Project Setup

## Architecture Overview

The blog feature architecture consists of three main layers:

### Frontend (Blazor WASM)
- Static Web App deployed frontend
- Blog listing page (`Pages/Blog/Index.razor`)
- Blog post detail page (`Pages/Blog/Post.razor`)
- Markdown rendering using Markdig
- Client-side HTTP calls to backend API

### Backend (Azure Functions)
- HTTP-triggered functions for blog operations
- `GetBlogPosts` function - list all posts with metadata
- `GetBlogPost` function - retrieve individual post by slug
- Dependency injection for services
- Logging and error handling

### Storage (Azure File Share)
- Azure Storage account with File Share
- `/blog-posts` directory structure
- Markdown files with YAML frontmatter metadata
- `/blog-posts/images` subdirectory for featured images
- Centralized content management

## Prerequisites

Before implementing the blog feature, ensure you have:

**Development Environment:**
- .NET 10 SDK (or current version)
- VS Code with C# extensions
- Azure Storage Explorer (optional but recommended)
- Git for version control

**Azure Resources:**
- Azure Storage account created
- File Share created (typically named `blog-content`)
- Connection string available
- Static Web Apps resource configured

**Existing Projects:**
- Blazor WASM SWA project (typically `*.Client.csproj`)
- Azure Functions API project (typically `*.Api.csproj`)
- Shared models project (or create DTOs)
- Existing routing patterns in Client project

**Knowledge:**
- Basic Blazor components and pages
- Azure Functions concepts
- Azure Storage basics
- Markdown format understanding

## Project Structure After Implementation

The complete blog implementation will have this structure:

```
YourProject/
├── src/
│   ├── YourProject.Client/
│   │   ├── Pages/
│   │   │   └── Blog/
│   │   │       ├── Index.razor
│   │   │       └── Post.razor
│   │   ├── wwwroot/
│   │   │   └── css/
│   │   │       └── blog.css
│   │   └── Program.cs (with HttpClient config)
│   │
│   ├── YourProject.Api/
│   │   ├── Functions/
│   │   │   └── BlogFunctions.cs
│   │   ├── Services/
│   │   │   ├── IBlogStorageService.cs
│   │   │   └── BlogStorageService.cs
│   │   ├── Models/
│   │   │   └── BlogPost.cs
│   │   ├── Program.cs (with DI setup)
│   │   └── local.settings.json
│   │
│   └── YourProject.Shared/
│       └── Models/
│           ├── BlogPost.cs
│           └── BlogPostMetadata.cs
│
└── staticwebapp.config.json (optional routing config)
```

## Shared Data Models

Define DTOs that will be shared between Client and API projects:

### BlogPost Model
```csharp
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
```

### BlogPostMetadata Model
```csharp
namespace YourProject.Shared.Models;

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

## Architecture Decision Points

**When to use Metadata vs. Full Post:**
- **Metadata Only**: Blog listing page (faster, less data transfer)
- **Full Post**: Detail page (includes markdown content for rendering)

**Why Azure File Share vs. Database:**
- Markdown files are self-contained documents
- Easy to version control separately
- Direct image storage alongside content
- Simpler deployment model for SWA

**Why Separate Frontend and Backend:**
- Static Web App hosting model (frontend static, backend serverless)
- Scalability (frontend via CDN, backend via Functions scale)
- Security (API behind Azure Function authentication)
- Deployment separation (independent CI/CD pipelines)

## Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Frontend | Blazor WASM | .NET 10+ | Interactive UI, markdown rendering |
| Backend | Azure Functions | .NET 10+ isolated | HTTP API, File Share integration |
| Storage | Azure File Share | v2023-11 | Content storage for markdown |
| Hosting | Static Web Apps | Latest | Frontend + serverless backend hosting |
| Markdown | Markdig | 0.34+ | Markdown to HTML conversion |
| YAML Parser | YamlDotNet | 13.7+ | Parse frontmatter metadata |

## Next Steps

1. **Frontend Components:** Implement Index.razor and Post.razor pages
2. **Backend Services:** Create BlogStorageService for File Share integration
3. **Azure Functions:** Implement GetBlogPosts and GetBlogPost functions
4. **Configuration:** Set up local.settings.json and environment variables
5. **Styling:** Apply CSS for responsive blog UI
6. **Content:** Create sample markdown files in Azure File Share
7. **Testing:** Validate locally before deployment

See `backend-services.md` for implementation details.
