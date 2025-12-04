# Deployment & CI/CD

## GitHub Actions (Automatic)

When you create an Azure Static Web App from the Azure Portal and connect to GitHub, Azure automatically creates a GitHub Actions workflow.

### Example Workflow

**Location:** `.github/workflows/azure-static-web-apps-xxx.yml`

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true

      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/" # App source code path
          api_location: "api" # API source code path
          output_location: "build" # Built app content directory

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "close"
```

### Workflow Configuration Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `app_location` | Frontend source code path | `/` or `/src` |
| `api_location` | API source code path | `api` or `/functions` |
| `output_location` | Build output folder | `build`, `dist`, `wwwroot` |
| `app_build_command` | Custom build command | `npm run build:prod` |
| `api_build_command` | Custom API build | `npm run build` |
| `skip_app_build` | Skip frontend build | `true` (if pre-built) |
| `skip_api_build` | Skip API build | `true` (if pre-built) |

### Framework-Specific Output Locations

| Framework | Output Location |
|-----------|-----------------|
| React (CRA) | `build` |
| Angular | `dist/<app-name>` |
| Vue | `dist` |
| Blazor WASM | `wwwroot` |
| Next.js | `out` (static export) |
| Gatsby | `public` |
| Hugo | `public` |
| Svelte | `public` |

### Custom Build Configuration

**Example with environment-specific builds:**

```yaml
- name: Build And Deploy
  uses: Azure/static-web-apps-deploy@v1
  with:
    azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
    repo_token: ${{ secrets.GITHUB_TOKEN }}
    action: "upload"
    app_location: "/"
    api_location: "api"
    output_location: "build"
    app_build_command: "npm run build:production"
  env:
    REACT_APP_ENV: production
    REACT_APP_API_URL: https://api.myapp.com
```

## Preview Environments

Azure Static Web Apps automatically creates preview environments for pull requests.

### Access URLs

- **Production:** `https://<app-name>.azurestaticapps.net`
- **Preview:** `https://<app-name>-<pr-number>.<region>.azurestaticapps.net`

### Preview Configuration

```json
{
  "routes": [
    {
      "route": "/preview-mode",
      "allowedRoles": ["authenticated"]
    }
  ]
}
```

### Benefits of Preview Environments

- Test PRs before merging
- Share with stakeholders
- Validate integrations
- Automatic cleanup after PR closes
- Same configuration as production

## Manual Deployment with SWA CLI

### Install SWA CLI

```bash
npm install -g @azure/static-web-apps-cli
```

### Local Development

```bash
# Start local emulator
swa start

# With specific folders
swa start ./build --api-location ./api

# With framework
swa start http://localhost:3000 --api-location ./api

# With debugging
swa start http://localhost:3000 --api-location ./api --verbose

# Test authentication
swa start http://localhost:3000 --api-location ./api --auth-tenant-id <tenant-id>
```

### Deploy from CLI

```bash
# Deploy to Azure
swa deploy \
  --app-location ./build \
  --api-location ./api \
  --deployment-token $DEPLOYMENT_TOKEN

# With environment variables
swa deploy \
  --app-location ./build \
  --api-location ./api \
  --deployment-token $DEPLOYMENT_TOKEN \
  --env production
```

## Environment Configuration

### Local Development

**api/local.settings.json:**

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "DATABASE_CONNECTION": "Server=localhost;Database=mydb",
    "API_KEY": "dev-key-12345"
  }
}
```

⚠️ **Important:** Add `local.settings.json` to `.gitignore`

### Azure Configuration

**Via Azure CLI:**

```bash
# Set application setting
az staticwebapp appsettings set \
  --name my-static-app \
  --setting-names \
    DATABASE_CONNECTION="Server=prod.db;Database=mydb" \
    API_KEY="prod-key-xyz"

# List settings
az staticwebapp appsettings list \
  --name my-static-app

# Delete setting
az staticwebapp appsettings delete \
  --name my-static-app \
  --setting-names API_KEY
```

**Via Azure Portal:**

1. Navigate to Static Web App
2. Settings → Configuration
3. Add/Edit Application Settings
4. Save

### Using Environment Variables in Functions

**Node.js:**

```javascript
module.exports = async function (context, req) {
    const dbConnection = process.env.DATABASE_CONNECTION;
    const apiKey = process.env.API_KEY;

    // Use variables
    context.log('Connecting to:', dbConnection);
};
```

**C#:**

```csharp
[FunctionName("GetData")]
public static async Task<IActionResult> Run(
    [HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequest req,
    ILogger log)
{
    string dbConnection = Environment.GetEnvironmentVariable("DATABASE_CONNECTION");
    string apiKey = Environment.GetEnvironmentVariable("API_KEY");

    // Use variables
    return new OkObjectResult($"Connected to: {dbConnection}");
}
```

## Deployment Workflow

1. **Push code** to GitHub/Azure DevOps/GitLab
2. **CI/CD triggered** automatically
3. **Frontend built** and minified
4. **API functions** packaged
5. **Assets deployed** to CDN
6. **New version live** in seconds
7. **Preview environments** created for PRs

## Deployment Protection

### Branch Protection

Configure GitHub branch protection to prevent direct merges:

1. Go to repository Settings
2. Branches → Branch protection rules
3. Require status checks to pass
4. Require pull request reviews

### Staging Environments

Use GitHub environments for multi-stage deployments:

```yaml
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      # Deploy to staging

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment: production
    steps:
      # Deploy to production
```

## Rollback Strategies

### Quick Rollback

```bash
# List deployment history
az staticwebapp deployment-history list \
  --name my-static-app \
  --resource-group my-rg

# Redeploy previous version
az staticwebapp deployment-history promote \
  --name my-static-app \
  --resource-group my-rg \
  --deployment-id <deployment-id>
```

### Manual Rollback

1. Revert commit in Git
2. Push to trigger redeployment
3. SWA redeploys automatically

## CLI Commands Reference

### SWA CLI Commands

```bash
# Initialize new SWA project
swa init

# Start local development
swa start [options]

# Build application
swa build

# Deploy to Azure
swa deploy

# Login to Azure
swa login

# View help
swa --help
```

### Azure CLI Commands

```bash
# Create Static Web App
az staticwebapp create \
  --name my-app \
  --resource-group my-rg \
  --location eastus2 \
  --source https://github.com/user/repo \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --output-location "build"

# List Static Web Apps
az staticwebapp list

# Show details
az staticwebapp show \
  --name my-app \
  --resource-group my-rg

# Delete Static Web App
az staticwebapp delete \
  --name my-app \
  --resource-group my-rg
```

