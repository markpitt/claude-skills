# Azure Configuration & Deployment

## Local Development Settings

Create or update `local.settings.json` in your API project:

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

**Configuration Properties:**
- `AzureWebJobsStorage`: Connection string for storage (development uses emulator)
- `FUNCTIONS_WORKER_RUNTIME`: Must be "dotnet-isolated" for .NET 10
- `BlogFileShareName`: Name of the file share containing blog posts

## Azure File Share Setup

### Step 1: Create Storage Account

1. Go to Azure Portal
2. Create new Storage Account
3. Note the connection string for configuration
4. Choose geographically close to your users for latency

### Step 2: Create File Share

1. In Storage Account → File shares
2. Create new file share (name: `blog-content` or your preference)
3. Record the share name

### Step 3: Create Blog Directory Structure

Using Azure Storage Explorer or Azure CLI:

```bash
# Create blog-posts directory in file share
# This is where all markdown files will be stored
```

Or programmatically via Azure Storage Explorer:
1. Connect to storage account
2. Navigate to file share
3. Create folder `blog-posts`
4. Create subfolder `blog-posts/images` for featured images

### Step 4: Get Connection String

1. Go to Storage Account → Access keys
2. Copy connection string (under key1)
3. Store securely (never commit to git)

## Azure Static Web App Configuration

### Environment Variables

Add these configuration variables to your Azure Static Web App:

```bash
# Using Azure CLI
az staticwebapp appsettings set \
  --name your-app-name \
  --setting-names \
    BlogFileShareName=blog-content \
    AzureWebJobsStorage="<your-connection-string>"
```

Or via Azure Portal:
1. Go to Static Web App → Configuration
2. Add Application settings:
   - Name: `BlogFileShareName`
   - Value: `blog-content`
   - Name: `AzureWebJobsStorage`
   - Value: `<your-connection-string>`

### staticwebapp.config.json

Optional: Add routing configuration for blog URLs:

```json
{
  "routes": [
    {
      "route": "/blog/*",
      "serve": "/index.html",
      "statusCode": 200
    },
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated", "anonymous"]
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/*.{json,jpg,gif,png,webp,css,js,svg,eot,ttf,woff,woff2}"]
  }
}
```

This ensures:
- Blog routes are handled by Blazor SPA (for client-side routing)
- API routes are passed through to Azure Functions
- Static assets are served correctly

## Local Development Workflow

### Prerequisites

1. Install Azure Storage Emulator or use Azurite
2. Start the emulator/Azurite

### Running Locally

```bash
# Terminal 1: Start Azure Functions
cd src/YourProject.Api
func start

# Terminal 2: Start Blazor WASM with SWA CLI
swa start http://localhost:3000 --api-location api
```

Then navigate to: `http://localhost:3000/blog`

### Testing Endpoints

```bash
# Test backend API directly
curl http://localhost:7071/api/blog/posts
curl http://localhost:7071/api/blog/posts/your-post-slug

# Test through SWA CLI
curl http://localhost:3000/api/blog/posts
```

## File Share Content Format

### Markdown File Structure

Store markdown files in Azure File Share at `blog-posts/{slug}.md`:

```markdown
---
title: "Post Title"
slug: "post-slug"
author: "Your Name"
publishedDate: 2025-01-15T10:00:00Z
excerpt: "Brief summary for listings"
tags:
  - tag1
  - tag2
featuredImage: "/images/blog/featured.jpg"
readTimeMinutes: 5
---

# Post Title

Your markdown content here.

## Section 2

More content...
```

**Required YAML Properties:**
- `title`: Blog post title
- `slug`: URL-friendly identifier (must match filename without .md)
- `author`: Author name
- `publishedDate`: ISO 8601 datetime
- `excerpt`: Summary for blog listings (50-150 chars)
- `tags`: Array of category tags
- `featuredImage`: URL to featured image
- `readTimeMinutes`: Estimated reading time

**Optional YAML Properties:**
- `updatedDate`: Last modification date

### Image Management

1. Upload images to `blog-posts/images/` directory
2. Reference in markdown: `![Alt text](/images/blog/featured.jpg)`
3. Use relative paths from web root

## Deployment Checklist

Before deploying to production:

- [ ] Connection string configured in Static Web App settings
- [ ] Blog file share created and accessible
- [ ] Sample blog posts uploaded to file share
- [ ] Environment variable `BlogFileShareName` set correctly
- [ ] API routes proxied in `staticwebapp.config.json`
- [ ] Blazor SPA routing configured for `/blog/*`
- [ ] CORS configured if needed (usually not for same-origin)
- [ ] SSL/TLS certificate valid (Azure SWA handles this)
- [ ] Functions runtime version matches .NET SDK

## Monitoring & Troubleshooting

### Azure Portal Monitoring

1. Go to Static Web App → Settings → Functions
2. Check function app logs
3. Review Application Insights (if enabled)

### Common Issues

**Issue: 403 Forbidden accessing file share**
- Verify connection string is correct
- Check storage account firewall settings
- Ensure managed identity has access (if using)

**Issue: Blog posts not loading (404)**
- Verify file share and blog-posts directory exist
- Check markdown file naming (use slug format)
- Verify connection string in configuration

**Issue: Markdown not rendering**
- Check Markdig package is installed in Client
- Verify markdown syntax is valid
- Look for console errors in browser dev tools

**Issue: Featured images not loading**
- Verify image URLs are correct
- Check image files exist in `blog-posts/images/`
- Use CDN for better performance (future enhancement)

### Local Debugging

Use Azure Storage Explorer to:
1. Connect to your storage account
2. Browse file share contents
3. Verify markdown file structure
4. Check frontmatter YAML syntax
5. View file modification times

## Security Considerations

### Authentication & Authorization
- Blog endpoints are currently anonymous (AuthorizationLevel.Anonymous)
- For admin functions (create/update posts), add higher auth level
- Consider Azure AD for content management UI

### Connection String Security
- Never commit connection string to git
- Use Azure Key Vault in production
- Use managed identities for Azure-hosted applications
- Store locally in user secrets (dev)

### Content Security
- Sanitize user-generated content if accepting comments
- Validate image uploads if adding image management
- Implement rate limiting on API endpoints
- Use Content Security Policy headers

## Performance Optimization

### Caching Strategy

**Frontend:**
- Cache blog list for 5-10 minutes
- Cache individual posts for 1-2 hours
- Invalidate on new post upload

**Backend:**
- Add response caching headers
- Consider Redis cache layer for frequent posts
- Cache file share directory listing

### CDN Optimization

1. Use Azure CDN for static assets (images, CSS, JS)
2. Set appropriate cache headers
3. Enable gzip compression
4. Optimize featured image sizes

## Scaling Considerations

**Current Architecture:**
- Single file share (auto-scales)
- Serverless Azure Functions (auto-scales)
- Static hosting via SWA (auto-scales)

**Future Enhancements:**
- Add pagination for blog listings
- Implement search functionality
- Add caching layer
- Consider database for metadata (if thousands of posts)

## Deployment Pipelines

### GitHub Actions Example

```yaml
name: Deploy Blog Feature
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/src/YourProject.Client"
          api_location: "src/YourProject.Api"
          output_location: "wwwroot"
```

## Next Steps

1. Create sample blog posts using `sample-content-troubleshooting.md`
2. Deploy and validate in staging environment
3. Monitor logs and performance metrics
4. Plan content management workflow
