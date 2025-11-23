---
name: azure-swa
description: Comprehensive expertise for Azure Static Web Apps including architecture, configuration, API integration with Azure Functions, authentication, routing, deployment, and CI/CD. Use when building, configuring, deploying, or troubleshooting Azure Static Web Apps projects with frameworks like React, Angular, Vue, Blazor, or vanilla JavaScript.
version: 1.0
allowed-tools: Read, Edit, Write, Bash, Glob, Grep
---

# Azure Static Web Apps (SWA) Skill

Comprehensive guidance for building, configuring, and deploying Azure Static Web Apps - Microsoft's managed platform for modern web applications with serverless APIs.

## Overview

Azure Static Web Apps is a service that automatically builds and deploys full-stack web apps to Azure from a code repository. It provides:

- **Global distribution** via Azure CDN
- **Integrated serverless APIs** via Azure Functions
- **Built-in authentication** with social providers
- **Custom domains and SSL** certificates
- **Automated CI/CD** from GitHub/GitLab/Azure DevOps
- **Preview environments** for pull requests
- **Zero-configuration deployment**

## Supported Frameworks

### Frontend Frameworks
- **React** (Create React App, Next.js, Gatsby)
- **Angular** (Angular CLI)
- **Vue** (Vue CLI, Nuxt.js)
- **Blazor** (Blazor WebAssembly)
- **Svelte** (SvelteKit)
- **Vanilla JavaScript/TypeScript**
- **Static site generators** (Hugo, Jekyll, 11ty)

### API Backends
- **Azure Functions** (JavaScript, TypeScript, Python, C#, Java)
- Managed or Bring Your Own Functions (BYOF)

## Architecture Patterns

### Standard Architecture
```
┌─────────────────────────────────────┐
│   Azure Static Web Apps             │
├─────────────────────────────────────┤
│  Frontend (SPA/Static Site)         │
│  ├─ React/Vue/Angular/Blazor        │
│  ├─ Served via Azure CDN            │
│  └─ Auto-deployed from Git          │
├─────────────────────────────────────┤
│  API (Azure Functions)              │
│  ├─ HTTP Triggered Functions        │
│  ├─ Proxied at /api/*               │
│  └─ Same deployment pipeline        │
├─────────────────────────────────────┤
│  Authentication                     │
│  ├─ Azure AD, GitHub, Twitter       │
│  └─ /.auth/* endpoints              │
└─────────────────────────────────────┘
```

### Key Concepts

1. **Statically Generated Content**
   - HTML, CSS, JavaScript files
   - Built during CI/CD
   - Served from global CDN

2. **API Integration**
   - Azure Functions in `/api` folder
   - Automatically proxied to `/api/*` routes
   - Shares same domain (no CORS issues)

3. **Authentication**
   - Pre-configured providers
   - No code required for basic auth
   - Custom roles and authorization rules

4. **Routing**
   - Defined in `staticwebapp.config.json`
   - Fallback routes for SPAs
   - Custom headers and redirects

## Project Structure

### Typical SWA Project Layout
```
my-swa-project/
├── src/                          # Frontend source
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── api/                          # Azure Functions
│   ├── GetData/
│   │   └── index.js
│   ├── PostData/
│   │   └── index.js
│   └── host.json
├── public/                       # Static assets (optional)
│   └── images/
├── staticwebapp.config.json     # SWA configuration
├── package.json
└── .github/
    └── workflows/
        └── azure-static-web-apps.yml
```

### Configuration File: staticwebapp.config.json

The `staticwebapp.config.json` file controls routing, authentication, and other runtime behaviors.

**Location:** Root of repository or output directory

**Basic Example:**
```json
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated"]
    },
    {
      "route": "/admin/*",
      "allowedRoles": ["admin"]
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*"]
  },
  "responseOverrides": {
    "401": {
      "redirect": "/login",
      "statusCode": 302
    },
    "404": {
      "rewrite": "/404.html",
      "statusCode": 404
    }
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self'",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff"
  },
  "mimeTypes": {
    ".json": "application/json",
    ".wasm": "application/wasm"
  }
}
```

### Configuration Options

#### Routes
Define access control and routing rules:
```json
{
  "routes": [
    {
      "route": "/profile",
      "allowedRoles": ["authenticated"]
    },
    {
      "route": "/admin/*",
      "allowedRoles": ["admin", "superuser"]
    },
    {
      "route": "/public/*",
      "allowedRoles": ["anonymous"]
    }
  ]
}
```

#### Navigation Fallback (SPA Support)
Essential for single-page applications:
```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": [
      "/api/*",
      "/*.{css,scss,js,png,gif,ico,jpg,svg,woff,woff2,ttf,eot}"
    ]
  }
}
```

#### Response Overrides
Custom error pages and redirects:
```json
{
  "responseOverrides": {
    "401": {
      "redirect": "/.auth/login/github",
      "statusCode": 302
    },
    "403": {
      "rewrite": "/forbidden.html",
      "statusCode": 403
    },
    "404": {
      "rewrite": "/404.html",
      "statusCode": 404
    }
  }
}
```

#### Global Headers
Apply headers to all responses:
```json
{
  "globalHeaders": {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=()"
  }
}
```

#### Route-Specific Headers
Headers for specific routes:
```json
{
  "routes": [
    {
      "route": "/api/*",
      "headers": {
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    },
    {
      "route": "/static/*",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    }
  ]
}
```

#### Redirects
```json
{
  "routes": [
    {
      "route": "/old-page",
      "redirect": "/new-page",
      "statusCode": 301
    },
    {
      "route": "/external",
      "redirect": "https://example.com",
      "statusCode": 302
    }
  ]
}
```

## API Integration

### Azure Functions Setup

**Folder Structure:**
```
api/
├── GetUsers/
│   ├── function.json
│   └── index.js
├── CreateUser/
│   ├── function.json
│   └── index.js
├── host.json
└── package.json
```

**Example Function (Node.js):**
```javascript
// api/GetUsers/index.js
module.exports = async function (context, req) {
    context.log('GetUsers function processed a request.');

    // Get query parameters or request body
    const name = req.query.name || (req.body && req.body.name);

    // Example response
    const users = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' }
    ];

    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: users
    };
};
```

**function.json:**
```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

**host.json:**
```json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "maxTelemetryItemsPerSecond": 20
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[3.*, 4.0.0)"
  }
}
```

### Calling APIs from Frontend

**JavaScript/TypeScript:**
```javascript
// API calls are automatically proxied to /api/*
async function getUsers() {
    try {
        const response = await fetch('/api/GetUsers');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const users = await response.json();
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}

// POST example
async function createUser(userData) {
    const response = await fetch('/api/CreateUser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    });
    return response.json();
}
```

**React Example:**
```javascript
import { useEffect, useState } from 'react';

function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/GetUsers')
            .then(res => res.json())
            .then(data => {
                setUsers(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <ul>
            {users.map(user => (
                <li key={user.id}>{user.name} - {user.email}</li>
            ))}
        </ul>
    );
}
```

## Authentication

Azure Static Web Apps provides built-in authentication with zero configuration required.

### Pre-configured Providers
- **Azure Active Directory** (AAD)
- **GitHub**
- **Twitter**
- **Google** (Custom provider)
- **Facebook** (Custom provider)

### Authentication Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/.auth/login/<provider>` | Initiate login |
| `/.auth/logout` | Logout user |
| `/.auth/me` | Get user info |
| `/.auth/purge/<provider>` | Clear cached credentials |

### Login Flow

**HTML Example:**
```html
<!-- Login buttons -->
<a href="/.auth/login/github">Login with GitHub</a>
<a href="/.auth/login/aad">Login with Azure AD</a>
<a href="/.auth/login/twitter">Login with Twitter</a>

<!-- Logout -->
<a href="/.auth/logout">Logout</a>
```

**JavaScript Example:**
```javascript
// Redirect to login
function login(provider) {
    window.location.href = `/.auth/login/${provider}`;
}

// Get user information
async function getUserInfo() {
    try {
        const response = await fetch('/.auth/me');
        const payload = await response.json();
        const { clientPrincipal } = payload;
        return clientPrincipal;
    } catch (error) {
        console.error('Not authenticated');
        return null;
    }
}

// User info structure
/*
{
    "clientPrincipal": {
        "userId": "d75b260a64504067bfc5b2905e3b8182",
        "userRoles": ["anonymous", "authenticated"],
        "claims": [...],
        "identityProvider": "github",
        "userDetails": "username"
    }
}
*/
```

### Custom Authentication Roles

Define custom roles in `staticwebapp.config.json`:

```json
{
  "routes": [
    {
      "route": "/admin/*",
      "allowedRoles": ["admin"]
    }
  ],
  "auth": {
    "identityProviders": {
      "customOpenIdConnectProviders": {
        "myProvider": {
          "registration": {
            "clientIdSettingName": "MY_PROVIDER_CLIENT_ID",
            "clientCredential": {
              "clientSecretSettingName": "MY_PROVIDER_CLIENT_SECRET"
            },
            "openIdConnectConfiguration": {
              "wellKnownOpenIdConfiguration": "https://example.com/.well-known/openid-configuration"
            }
          },
          "login": {
            "nameClaimType": "name",
            "scopes": ["openid", "profile", "email"]
          }
        }
      }
    }
  }
}
```

### Role Assignment

Use Azure Functions to assign custom roles:

```javascript
// api/AssignRole/index.js
module.exports = async function (context, req) {
    const user = req.headers['x-ms-client-principal'];

    if (!user) {
        context.res = {
            status: 401,
            body: 'Not authenticated'
        };
        return;
    }

    // Decode user info
    const userInfo = JSON.parse(
        Buffer.from(user, 'base64').toString('utf-8')
    );

    // Custom logic to determine roles
    const roles = ['authenticated'];
    if (userInfo.userDetails === 'admin@example.com') {
        roles.push('admin');
    }

    context.res = {
        status: 200,
        body: {
            roles: roles
        }
    };
};
```

### Accessing User Info in APIs

**Node.js Function:**
```javascript
module.exports = async function (context, req) {
    // User principal is in header
    const header = req.headers['x-ms-client-principal'];

    if (!header) {
        context.res = {
            status: 401,
            body: 'Not authenticated'
        };
        return;
    }

    const user = JSON.parse(
        Buffer.from(header, 'base64').toString('utf-8')
    );

    context.log('User:', user.userDetails);
    context.log('Roles:', user.userRoles);
    context.log('Provider:', user.identityProvider);

    context.res = {
        status: 200,
        body: {
            message: `Hello, ${user.userDetails}!`,
            roles: user.userRoles
        }
    };
};
```

## Environment Variables

### Configuration Methods

1. **Local Development** - `local.settings.json` (API only)
2. **Azure Portal** - Application Settings
3. **Azure CLI** - `az staticwebapp appsettings`
4. **GitHub Actions** - Secrets and environment variables

### Local Development (API)

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

### Frontend Environment Variables

For frontend build-time variables, use framework-specific methods:

**React (Create React App):**
```bash
# .env
REACT_APP_API_URL=https://api.example.com
REACT_APP_VERSION=1.0.0
```

```javascript
const apiUrl = process.env.REACT_APP_API_URL;
```

**Angular:**
```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://api.example.com'
};
```

**Vue:**
```bash
# .env
VUE_APP_API_URL=https://api.example.com
```

```javascript
const apiUrl = process.env.VUE_APP_API_URL;
```

## Deployment

### GitHub Actions (Automatic)

When you create an Azure Static Web App from the Azure Portal and connect to GitHub, Azure automatically creates a GitHub Actions workflow.

**Example Workflow (.github/workflows/azure-static-web-apps-xxx.yml):**
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

### Workflow Configuration

Key parameters in the deployment action:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `app_location` | Frontend source code | `/` or `/src` |
| `api_location` | API source code | `api` or `/functions` |
| `output_location` | Build output folder | `build`, `dist`, `wwwroot` |
| `app_build_command` | Custom build command | `npm run build:prod` |
| `api_build_command` | Custom API build | `npm run build` |
| `skip_app_build` | Skip frontend build | `true` (if pre-built) |
| `skip_api_build` | Skip API build | `true` (if pre-built) |

### Framework-Specific Output Locations

| Framework | Output Location |
|-----------|----------------|
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

### Preview Environments

Azure Static Web Apps automatically creates preview environments for pull requests.

**Access URLs:**
- Production: `https://<app-name>.azurestaticapps.net`
- Preview: `https://<app-name>-<pr-number>.<region>.azurestaticapps.net`

**Configuration:**
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

### Manual Deployment with SWA CLI

**Install SWA CLI:**
```bash
npm install -g @azure/static-web-apps-cli
```

**Local Development:**
```bash
# Start local emulator
swa start

# With specific folders
swa start ./build --api-location ./api

# With framework
swa start http://localhost:3000 --api-location ./api
```

**Deploy from CLI:**
```bash
# Deploy to Azure
swa deploy \
  --app-location ./build \
  --api-location ./api \
  --deployment-token $DEPLOYMENT_TOKEN
```

## Custom Domains and SSL

### Adding Custom Domain

**Via Azure Portal:**
1. Navigate to Static Web App
2. Settings → Custom domains
3. Click "Add"
4. Enter domain name
5. Follow DNS verification steps

**Via Azure CLI:**
```bash
# Add custom domain
az staticwebapp hostname set \
  --name my-static-app \
  --hostname www.example.com

# List custom domains
az staticwebapp hostname list \
  --name my-static-app

# Delete custom domain
az staticwebapp hostname delete \
  --name my-static-app \
  --hostname www.example.com
```

### DNS Configuration

**For root domain (example.com):**
- Type: `ALIAS` or `ANAME`
- Value: `<app-name>.azurestaticapps.net`

**For subdomain (www.example.com):**
- Type: `CNAME`
- Value: `<app-name>.azurestaticapps.net`

**TXT Record for validation:**
- Type: `TXT`
- Name: `@` (root) or subdomain
- Value: Provided by Azure during setup

### SSL Certificates

SSL certificates are automatically provisioned and renewed by Azure (free).

- **Auto-renewal:** Yes
- **Certificate type:** Managed by Azure
- **HTTPS enforcement:** Available
- **Cost:** Free

### Enforce HTTPS

**In staticwebapp.config.json:**
```json
{
  "routes": [
    {
      "route": "/*",
      "headers": {
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
      }
    }
  ]
}
```

## Monitoring and Diagnostics

### Application Insights Integration

**Enable Application Insights:**
```bash
az staticwebapp appsettings set \
  --name my-static-app \
  --setting-names \
    APPINSIGHTS_INSTRUMENTATIONKEY="your-key"
```

**Custom Telemetry in Functions:**
```javascript
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY);
const client = appInsights.defaultClient;

module.exports = async function (context, req) {
    // Track custom event
    client.trackEvent({
        name: "UserAction",
        properties: {
            action: "getData",
            user: req.headers['x-ms-client-principal-name']
        }
    });

    // Track metric
    client.trackMetric({
        name: "ProcessingTime",
        value: 123
    });

    context.res = {
        status: 200,
        body: "OK"
    };
};
```

### Logging

**Function Logs:**
```bash
# View logs via Azure CLI
az webapp log tail \
  --name <app-name> \
  --resource-group <resource-group>

# Stream logs
az staticwebapp functions stream-logs \
  --name <app-name>
```

**In Azure Portal:**
1. Navigate to Static Web App
2. Monitoring → Application Insights
3. View logs, metrics, and performance

### Health Checks

**Example health endpoint:**
```javascript
// api/health/index.js
module.exports = async function (context, req) {
    const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    };

    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        },
        body: health
    };
};
```

## Best Practices

### Security

1. **Use HTTPS only**
   - Configure HSTS headers
   - Redirect HTTP to HTTPS

2. **Implement proper authentication**
   - Use built-in providers
   - Validate user roles
   - Protect sensitive routes

3. **Set security headers**
   ```json
   {
     "globalHeaders": {
       "X-Frame-Options": "DENY",
       "X-Content-Type-Options": "nosniff",
       "X-XSS-Protection": "1; mode=block",
       "Referrer-Policy": "strict-origin-when-cross-origin",
       "Content-Security-Policy": "default-src 'self'"
     }
   }
   ```

4. **Protect API endpoints**
   - Validate input
   - Implement rate limiting
   - Use API authentication

5. **Secure secrets**
   - Use Azure Key Vault
   - Never commit secrets to Git
   - Rotate keys regularly

### Performance

1. **Optimize build output**
   - Enable minification
   - Use tree-shaking
   - Code splitting

2. **Configure caching**
   ```json
   {
     "routes": [
       {
         "route": "/static/*",
         "headers": {
           "Cache-Control": "public, max-age=31536000, immutable"
         }
       }
     ]
   }
   ```

3. **Use CDN effectively**
   - Static assets are automatically cached
   - Leverage global distribution
   - Optimize images

4. **Optimize API responses**
   - Use compression
   - Implement pagination
   - Cache when appropriate

5. **Monitor performance**
   - Use Application Insights
   - Track key metrics
   - Set up alerts

### Development Workflow

1. **Use SWA CLI for local development**
   ```bash
   swa start http://localhost:3000 --api-location ./api
   ```

2. **Test authentication locally**
   ```bash
   swa start --app-devserver-url=http://localhost:3000 \
             --api-location ./api \
             --auth-tenant-id <tenant-id>
   ```

3. **Leverage preview environments**
   - Test PRs before merging
   - Share with stakeholders
   - Validate integrations

4. **Use environment-specific configs**
   - Separate dev/staging/prod settings
   - Use GitHub environments
   - Protect production deployments

5. **Version control**
   - Include `staticwebapp.config.json`
   - Exclude `local.settings.json`
   - Document configuration changes

### Cost Optimization

1. **Choose appropriate tier**
   - Free: Hobby projects, small apps
   - Standard: Production apps, custom domains

2. **Monitor usage**
   - Track bandwidth
   - Monitor function executions
   - Review costs regularly

3. **Optimize function performance**
   - Reduce cold starts
   - Optimize execution time
   - Use appropriate runtimes

## Troubleshooting

### Common Issues

**Problem: Routes not working (404 errors)**

Solution: Check `staticwebapp.config.json`:
```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/*.{css,js,png,jpg}"]
  }
}
```

**Problem: API calls failing**

Solutions:
- Verify `api_location` in workflow
- Check function.json bindings
- Review API logs in Azure Portal
- Test locally with SWA CLI

**Problem: Authentication not working**

Solutions:
- Check provider configuration
- Verify redirect URLs
- Review allowed roles in config
- Test with `/.auth/me` endpoint

**Problem: Build failing in GitHub Actions**

Solutions:
- Check `app_location` and `output_location`
- Verify Node version compatibility
- Review build logs
- Test build locally

**Problem: Environment variables not available**

Solutions:
- Ensure variables are set in Azure
- Check naming (no `REACT_APP_` prefix in Functions)
- Restart deployment after adding variables
- Verify `local.settings.json` for local dev

**Problem: Custom domain not working**

Solutions:
- Verify DNS propagation (can take 24-48 hours)
- Check CNAME/ALIAS record configuration
- Ensure TXT record for validation
- Review SSL certificate status

### Debugging

**Local API debugging:**
```bash
# Start with debugging
swa start http://localhost:3000 --api-location ./api --verbose

# View detailed logs
swa start --verbose=silly
```

**Production debugging:**
1. Enable Application Insights
2. View live metrics
3. Check function logs
4. Review deployment logs

**Common error codes:**
- `401` - Authentication required
- `403` - Forbidden (role not allowed)
- `404` - Route not found
- `500` - Server error (check function logs)

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

# Manage app settings
az staticwebapp appsettings list --name my-app
az staticwebapp appsettings set --name my-app --setting-names KEY=value
az staticwebapp appsettings delete --name my-app --setting-names KEY

# Manage custom domains
az staticwebapp hostname set --name my-app --hostname www.example.com
az staticwebapp hostname list --name my-app
az staticwebapp hostname delete --name my-app --hostname www.example.com

# Get deployment token
az staticwebapp secrets list --name my-app
```

## Examples

### React + Node.js API

**Project structure:**
```
my-react-app/
├── public/
├── src/
├── api/
│   └── GetMessage/
│       └── index.js
├── package.json
└── staticwebapp.config.json
```

**staticwebapp.config.json:**
```json
{
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated"]
    }
  ]
}
```

### Angular + C# API

**Project structure:**
```
my-angular-app/
├── src/
├── api/
│   ├── GetData.cs
│   └── host.json
├── angular.json
└── staticwebapp.config.json
```

**GitHub Actions config:**
```yaml
app_location: "/"
api_location: "api"
output_location: "dist/my-angular-app"
```

### Blazor WebAssembly

**Project structure:**
```
MyBlazorApp/
├── Client/
│   └── wwwroot/
├── Api/
│   └── Functions/
└── Shared/
```

**GitHub Actions config:**
```yaml
app_location: "Client"
api_location: "Api"
output_location: "wwwroot"
```

## Resources

### Official Documentation
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [SWA CLI Documentation](https://azure.github.io/static-web-apps-cli/)
- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)

### Tools
- [SWA CLI](https://github.com/Azure/static-web-apps-cli)
- [Azure Portal](https://portal.azure.com/)
- [Azure CLI](https://docs.microsoft.com/cli/azure/)

### Community
- [GitHub Discussions](https://github.com/Azure/static-web-apps/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/azure-static-web-apps)
- [Microsoft Q&A](https://docs.microsoft.com/answers/topics/azure-static-web-apps.html)

## Quick Start Checklist

- [ ] Install SWA CLI: `npm install -g @azure/static-web-apps-cli`
- [ ] Create Azure Static Web App in portal
- [ ] Connect to GitHub repository
- [ ] Configure build settings (app_location, api_location, output_location)
- [ ] Add staticwebapp.config.json for routing
- [ ] Set up environment variables
- [ ] Configure authentication if needed
- [ ] Test locally with `swa start`
- [ ] Push to GitHub to trigger deployment
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring with Application Insights
- [ ] Enable production deployment protection

---

**Version:** 1.0
**Last Updated:** January 2025
**Maintained by:** Claude Skills Repository
