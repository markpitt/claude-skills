# Azure Static Web Apps - Core Concepts & Architecture

## Overview

Azure Static Web Apps is a service that automatically builds and deploys full-stack web apps to Azure from a code repository. It provides:

- **Global distribution** via Azure CDN
- **Integrated serverless APIs** via Azure Functions
- **Built-in authentication** with social providers
- **Custom domains and SSL** certificates
- **Automated CI/CD** from GitHub/GitLab/Azure DevOps
- **Preview environments** for pull requests
- **Zero-configuration deployment**

## Key Concepts

### 1. Statically Generated Content
- HTML, CSS, JavaScript files
- Built during CI/CD pipeline
- Served from global CDN
- Immutable and cacheable

### 2. API Integration
- Azure Functions in `/api` folder
- Automatically proxied to `/api/*` routes
- Shares same domain (eliminates CORS issues)
- Same deployment pipeline as frontend

### 3. Authentication & Authorization
- Pre-configured providers (Azure AD, GitHub, Twitter)
- Role-based access control (RBAC)
- Custom roles via Azure Functions
- User principal header in API calls

### 4. Routing
- Defined in `staticwebapp.config.json`
- Fallback routes for single-page applications (SPAs)
- Custom headers and response overrides
- Redirect and rewrite rules

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

## Standard Architecture

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

## Typical SWA Project Layout

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

## Service Tiers

### Free Tier
- Hobby projects and small apps
- Single SWA per subscription
- Limited bandwidth
- No custom domain
- Managed SSL only

### Standard Tier
- Production applications
- Multiple SWAs
- Custom domains
- Bring Your Own Functions (BYOF)
- Advanced authentication
- Premium support available

## CDN & Global Distribution

- **Global reach**: Content served from 200+ edge locations
- **Automatic caching**: Static assets cached at edges
- **HTTPS everywhere**: Free SSL certificates
- **Performance**: Sub-100ms latency for most users
- **Purge cache**: Optional manual cache purge

## Deployment Workflow

1. Push code to GitHub/Azure DevOps/GitLab
2. CI/CD pipeline triggered automatically
3. Frontend built and minified
4. API functions packaged
5. Assets deployed to CDN
6. New version available in seconds
7. Preview environments for PRs (if configured)

## Environment Types

### Production
- Deployed from main branch
- Live to public users
- Full monitoring and logging

### Preview/Staging
- Created for pull requests
- Isolated environment
- Same configuration as production
- Automatically cleaned up after PR closes

### Local Development
- SWA CLI emulates Azure environment
- Test authentication locally
- Debug API functions
- No Azure subscription needed for testing

## Best Practices

### Security First
- Use HTTPS-only connections
- Implement proper authentication
- Set security headers
- Protect sensitive routes
- Manage secrets securely

### Performance Optimization
- Minimize bundle size
- Enable code splitting
- Configure cache headers
- Optimize images
- Monitor metrics

### Operational Excellence
- Monitor with Application Insights
- Set up alerts
- Regular cost reviews
- Use preview environments
- Implement deployment protection

