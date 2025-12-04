# Configuration & Routing

## staticwebapp.config.json

The `staticwebapp.config.json` file controls routing, authentication, and other runtime behaviors.

**Location:** Root of repository or output directory

### Basic Example

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

## Routes Section

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

### Route Properties

| Property | Type | Description |
|----------|------|-------------|
| `route` | string | URL pattern to match |
| `allowedRoles` | string[] | Allowed user roles |
| `serve` | string | File to serve (for routing) |
| `statusCode` | number | HTTP status for response |
| `headers` | object | Route-specific headers |
| `methods` | string[] | Allowed HTTP methods |
| `redirect` | string | Redirect URL |

## Navigation Fallback (SPA Support)

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

**Use when:**
- Building React, Angular, or Vue apps
- Need client-side routing to handle
- Want all non-matching routes to serve index.html

**Exclude patterns:**
- API routes (already handled by `/api/*` route)
- Static file extensions
- Binary assets

## Response Overrides

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

**Common status codes:**
- `401` - Authentication required
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Server error

## Global Headers

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

### Security Headers Explained

| Header | Purpose | Example |
|--------|---------|---------|
| `X-Frame-Options` | Prevent clickjacking | `DENY` or `SAMEORIGIN` |
| `X-Content-Type-Options` | Prevent MIME sniffing | `nosniff` |
| `X-XSS-Protection` | XSS attack protection | `1; mode=block` |
| `Referrer-Policy` | Control referrer info | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | Restrict resource loading | `default-src 'self'` |
| `Strict-Transport-Security` | Force HTTPS | `max-age=31536000; includeSubDomains` |

## Route-Specific Headers

Apply headers to specific routes:

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
    },
    {
      "route": "/images/*",
      "headers": {
        "Cache-Control": "public, max-age=86400"
      }
    }
  ]
}
```

### Cache-Control Directives

| Directive | Purpose |
|-----------|---------|
| `no-cache` | Revalidate before use |
| `no-store` | Don't cache |
| `public` | Can be cached by any cache |
| `private` | Only client can cache |
| `max-age=<seconds>` | Cache validity duration |
| `immutable` | Resource never changes |

## Redirects

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

### Redirect Status Codes

| Code | Usage |
|------|-------|
| `301` | Permanent redirect (SEO-friendly) |
| `302` | Temporary redirect |

## MIME Types

Specify content types for files:

```json
{
  "mimeTypes": {
    ".json": "application/json",
    ".wasm": "application/wasm",
    ".webmanifest": "application/manifest+json"
  }
}
```

## Complete Configuration Example

```json
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated"],
      "headers": {
        "Cache-Control": "no-cache"
      }
    },
    {
      "route": "/admin/*",
      "allowedRoles": ["admin"]
    },
    {
      "route": "/static/*",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    },
    {
      "route": "/old-path",
      "redirect": "/new-path",
      "statusCode": 301
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": [
      "/api/*",
      "/*.{css,scss,js,png,gif,ico,jpg,svg,woff,woff2,ttf,eot}"
    ]
  },
  "responseOverrides": {
    "401": {
      "redirect": "/.auth/login/github",
      "statusCode": 302
    },
    "404": {
      "rewrite": "/404.html"
    }
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self'; script-src 'self' 'unsafe-inline'",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block"
  }
}
```

