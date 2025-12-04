# Authentication & Authorization

## Built-in Authentication

Azure Static Web Apps provides built-in authentication with zero configuration required.

### Pre-configured Providers

| Provider | Endpoint | Best For |
|----------|----------|----------|
| **Azure Active Directory** | `/.auth/login/aad` | Enterprise applications |
| **GitHub** | `/.auth/login/github` | Developer-focused apps |
| **Twitter** | `/.auth/login/twitter` | Social integration |
| **Google** | `/.auth/login/google` | General consumer apps |
| **Facebook** | `/.auth/login/facebook` | Social-first apps |

### Authentication Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/.auth/login/<provider>` | Initiate login |
| `/.auth/logout` | Logout user |
| `/.auth/me` | Get user info |
| `/.auth/purge/<provider>` | Clear cached credentials |

## Login Flow

### HTML Login Buttons

```html
<!-- Login buttons -->
<a href="/.auth/login/github">Login with GitHub</a>
<a href="/.auth/login/aad">Login with Azure AD</a>
<a href="/.auth/login/twitter">Login with Twitter</a>

<!-- Logout -->
<a href="/.auth/logout">Logout</a>
```

### JavaScript Authentication

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

// User info structure:
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

### React Login Component

```javascript
import { useEffect, useState } from 'react';

function LoginComponent() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetch('/.auth/me')
            .then(res => res.json())
            .then(data => setUser(data.clientPrincipal))
            .catch(() => setUser(null));
    }, []);

    if (!user) {
        return (
            <div>
                <a href="/.auth/login/github">Login with GitHub</a>
            </div>
        );
    }

    return (
        <div>
            <p>Welcome, {user.userDetails}!</p>
            <p>Provider: {user.identityProvider}</p>
            <a href="/.auth/logout">Logout</a>
        </div>
    );
}
```

## Authorization & Roles

### Configuring Role-Based Access

Define which routes require authentication in `staticwebapp.config.json`:

```json
{
  "routes": [
    {
      "route": "/admin/*",
      "allowedRoles": ["admin"]
    },
    {
      "route": "/profile/*",
      "allowedRoles": ["authenticated"]
    },
    {
      "route": "/public/*",
      "allowedRoles": ["anonymous"]
    }
  ]
}
```

### Default Roles

- `anonymous` - Unauthenticated users
- `authenticated` - Any authenticated user
- Custom roles - Application-defined

## Custom Authentication Roles

### Define Custom Roles in Config

```json
{
  "routes": [
    {
      "route": "/admin/*",
      "allowedRoles": ["admin"]
    },
    {
      "route": "/moderator/*",
      "allowedRoles": ["moderator"]
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

### Assign Roles via Azure Functions

Use Azure Functions to determine and assign custom roles:

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

## Accessing User Info in APIs

### User Principal Header

When a user is authenticated, their principal is available in the `x-ms-client-principal` header (Base64 encoded).

### Node.js Function

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

### C# Function

```csharp
[FunctionName("GetUserInfo")]
public static async Task<IActionResult> Run(
    [HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequest req,
    ILogger log)
{
    var principalHeader = req.Headers["x-ms-client-principal"];
    if (string.IsNullOrEmpty(principalHeader))
    {
        return new UnauthorizedResult();
    }

    var base64EncodedBytes = System.Convert.FromBase64String(principalHeader);
    var principalJson = System.Text.Encoding.UTF8.GetString(base64EncodedBytes);
    
    dynamic principal = JsonConvert.DeserializeObject(principalJson);
    
    return new OkObjectResult(new
    {
        message = $"Hello, {principal.userDetails}!",
        roles = principal.userRoles
    });
}
```

### User Principal Structure

```json
{
    "userId": "d75b260a64504067bfc5b2905e3b8182",
    "userRoles": ["anonymous", "authenticated"],
    "claims": [
        {
            "typ": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
            "val": "username"
        }
    ],
    "identityProvider": "github",
    "userDetails": "username"
}
```

## Token Management

### Refresh User Info

```javascript
// Force refresh of user information
async function refreshUser() {
    const response = await fetch('/.auth/me');
    const payload = await response.json();
    return payload.clientPrincipal;
}
```

### Logout and Redirect

```javascript
function logout(redirectUrl = '/') {
    window.location.href = `/.auth/logout?post_logout_redirect_uri=${redirectUrl}`;
}
```

### Clear Authentication Cache

```javascript
// Clear cached credentials for a provider
async function purgeProvider(provider) {
    await fetch(`/.auth/purge/${provider}`, { method: 'POST' });
    // Redirect to login or home
    window.location.href = '/';
}
```

## Protected Route Patterns

### Frontend Protection (React)

```javascript
function ProtectedPage({ requiredRole }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/.auth/me')
            .then(res => res.json())
            .then(data => {
                const user = data.clientPrincipal;
                if (!user || !user.userRoles.includes(requiredRole)) {
                    window.location.href = '/.auth/login/github';
                }
                setUser(user);
            })
            .finally(() => setLoading(false));
    }, [requiredRole]);

    if (loading) return <div>Loading...</div>;
    
    return <div>Welcome, {user.userDetails}!</div>;
}
```

### Server-Side Protection (Azure Functions)

```javascript
// api/AdminOnly/index.js
module.exports = async function (context, req) {
    const header = req.headers['x-ms-client-principal'];
    if (!header) {
        context.res = { status: 401, body: 'Not authenticated' };
        return;
    }

    const user = JSON.parse(Buffer.from(header, 'base64').toString('utf-8'));
    
    // Check for admin role
    if (!user.userRoles.includes('admin')) {
        context.res = { status: 403, body: 'Forbidden' };
        return;
    }

    // Admin-only logic here
    context.res = {
        status: 200,
        body: { message: 'Admin access granted' }
    };
};
```

