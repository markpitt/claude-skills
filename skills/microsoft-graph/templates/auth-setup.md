# Microsoft Graph API Authentication Setup

This template provides authentication patterns and setup instructions for Microsoft Graph API.

## Authentication Overview

Microsoft Graph uses OAuth 2.0 and Azure AD for authentication. You need:

1. **Azure AD Tenant** - Your organization's directory
2. **App Registration** - Application identity in Azure AD
3. **Permissions** - Delegated or Application permissions
4. **Access Token** - Bearer token for API requests

## Authentication Flows

### 1. Authorization Code Flow (Web Apps)

**Use when:** User signs in to web application

**Steps:**
1. Redirect user to authorization endpoint
2. User consents to permissions
3. Receive authorization code
4. Exchange code for access token

**Authorization Request:**
```http
GET https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize?
client_id={client-id}
&response_type=code
&redirect_uri={redirect-uri}
&response_mode=query
&scope=https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.Read
&state={state}
```

**Token Request:**
```http
POST https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

client_id={client-id}
&scope=https://graph.microsoft.com/User.Read
&code={authorization-code}
&redirect_uri={redirect-uri}
&grant_type=authorization_code
&client_secret={client-secret}
```

---

### 2. Client Credentials Flow (Daemon/Service)

**Use when:** Application runs without user (background service)

**Token Request:**
```http
POST https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

client_id={client-id}
&scope=https://graph.microsoft.com/.default
&client_secret={client-secret}
&grant_type=client_credentials
```

**Important:** Requires Application permissions (not Delegated)

---

### 3. Device Code Flow (CLI/IoT)

**Use when:** Devices without browser or input limitations

**Device Code Request:**
```http
POST https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/devicecode
Content-Type: application/x-www-form-urlencoded

client_id={client-id}
&scope=https://graph.microsoft.com/User.Read
```

**Response:**
```json
{
  "user_code": "B6F8B943",
  "device_code": "{device-code}",
  "verification_uri": "https://microsoft.com/devicelogin",
  "expires_in": 900,
  "interval": 5
}
```

**Display to user:** "Go to https://microsoft.com/devicelogin and enter code: B6F8B943"

**Poll for token:**
```http
POST https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

client_id={client-id}
&grant_type=urn:ietf:params:oauth:grant-type:device_code
&device_code={device-code}
```

---

### 4. On-Behalf-Of Flow (Middle-tier services)

**Use when:** API needs to call Graph on behalf of user

**Token Request:**
```http
POST https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

client_id={client-id}
&client_secret={client-secret}
&grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
&assertion={user-token}
&scope=https://graph.microsoft.com/User.Read
&requested_token_use=on_behalf_of
```

---

### 5. Implicit Flow (SPAs - Not Recommended)

**Note:** Use Authorization Code Flow with PKCE instead

---

### 6. Authorization Code with PKCE (SPAs, Mobile)

**Use when:** Single-page apps or mobile apps

**Generate PKCE values:**
```javascript
// Code verifier (random string)
const codeVerifier = generateRandomString(43);

// Code challenge (SHA256 hash of verifier, base64url encoded)
const codeChallenge = base64url(sha256(codeVerifier));
```

**Authorization Request:**
```http
GET https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize?
client_id={client-id}
&response_type=code
&redirect_uri={redirect-uri}
&scope=https://graph.microsoft.com/User.Read
&code_challenge={code-challenge}
&code_challenge_method=S256
```

**Token Request:**
```http
POST https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token

client_id={client-id}
&grant_type=authorization_code
&code={authorization-code}
&redirect_uri={redirect-uri}
&code_verifier={code-verifier}
```

No client secret needed!

---

## App Registration Setup

### 1. Register Application

1. Go to Azure Portal → Azure Active Directory → App Registrations
2. Click "New registration"
3. Provide:
   - **Name:** Your application name
   - **Supported account types:**
     - Single tenant (your org only)
     - Multi-tenant (any org)
     - Multi-tenant + personal accounts
   - **Redirect URI:** (optional now, can add later)

### 2. Configure Authentication

1. Go to "Authentication" blade
2. Add platform (Web, SPA, Mobile)
3. Configure redirect URIs
4. Enable tokens if needed (ID tokens, access tokens)

### 3. Add Permissions

1. Go to "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Choose permission type:
   - **Delegated:** User context
   - **Application:** App-only
5. Search and select permissions
6. Click "Grant admin consent" (for application permissions)

### 4. Create Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Provide description and expiration
4. **Copy the value immediately** (can't view again)

**Or use certificate:**
1. Generate certificate
2. Upload public key (.cer file)
3. Use private key to sign JWT for authentication

---

## Token Handling

### Access Token Structure
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI...
```

### Token Response
```json
{
  "token_type": "Bearer",
  "expires_in": 3599,
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
  "refresh_token": "OAQABAAIAAAD--DLA3VO7QrddgJg7W...",
  "scope": "User.Read Mail.Read"
}
```

### Refresh Token
```http
POST https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

client_id={client-id}
&scope=https://graph.microsoft.com/User.Read
&refresh_token={refresh-token}
&grant_type=refresh_token
&client_secret={client-secret}
```

### Token Expiration
- Access tokens: 60-90 minutes
- Refresh tokens: 90 days (rolling), 14 days (absolute for SPAs)
- Cache tokens, refresh before expiration

---

## Code Examples

### Python (requests library)
```python
import requests
import msal

# Client credentials flow
app = msal.ConfidentialClientApplication(
    client_id="YOUR_CLIENT_ID",
    client_credential="YOUR_CLIENT_SECRET",
    authority=f"https://login.microsoftonline.com/{tenant_id}"
)

result = app.acquire_token_for_client(
    scopes=["https://graph.microsoft.com/.default"]
)

if "access_token" in result:
    access_token = result["access_token"]

    # Call Graph API
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(
        "https://graph.microsoft.com/v1.0/users",
        headers=headers
    )

    users = response.json()
```

### JavaScript (Node.js)
```javascript
const msal = require('@azure/msal-node');
const axios = require('axios');

// Client credentials flow
const config = {
    auth: {
        clientId: 'YOUR_CLIENT_ID',
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientSecret: 'YOUR_CLIENT_SECRET'
    }
};

const cca = new msal.ConfidentialClientApplication(config);

const tokenRequest = {
    scopes: ['https://graph.microsoft.com/.default']
};

async function getToken() {
    const response = await cca.acquireTokenByClientCredential(tokenRequest);
    return response.accessToken;
}

async function callGraph() {
    const token = await getToken();

    const response = await axios.get('https://graph.microsoft.com/v1.0/users', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    return response.data;
}
```

### C# (.NET)
```csharp
using Microsoft.Identity.Client;
using Microsoft.Graph;

// Client credentials flow
var confidentialClient = ConfidentialClientApplicationBuilder
    .Create(clientId)
    .WithClientSecret(clientSecret)
    .WithAuthority(new Uri($"https://login.microsoftonline.com/{tenantId}"))
    .Build();

var authResult = await confidentialClient
    .AcquireTokenForClient(new[] { "https://graph.microsoft.com/.default" })
    .ExecuteAsync();

var graphClient = new GraphServiceClient(
    new DelegateAuthenticationProvider(async (requestMessage) => {
        requestMessage.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", authResult.AccessToken);
    })
);

var users = await graphClient.Users.Request().GetAsync();
```

### PowerShell
```powershell
# Install module
Install-Module Microsoft.Graph -Scope CurrentUser

# Connect with client credentials
$clientId = "YOUR_CLIENT_ID"
$tenantId = "YOUR_TENANT_ID"
$clientSecret = "YOUR_CLIENT_SECRET"

$body = @{
    Grant_Type    = "client_credentials"
    Scope         = "https://graph.microsoft.com/.default"
    Client_Id     = $clientId
    Client_Secret = $clientSecret
}

$connection = Invoke-RestMethod `
    -Uri "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token" `
    -Method POST `
    -Body $body

$token = $connection.access_token

# Call Graph API
$headers = @{
    "Authorization" = "Bearer $token"
}

$users = Invoke-RestMethod `
    -Uri "https://graph.microsoft.com/v1.0/users" `
    -Headers $headers

# Or use Microsoft.Graph module
Connect-MgGraph -ClientId $clientId -TenantId $tenantId -ClientSecret $clientSecret
Get-MgUser -All
```

---

## Security Best Practices

1. **Never commit secrets** to source control
2. **Use environment variables** for secrets
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Use certificates** instead of secrets in production
5. **Request least privilege** permissions
6. **Use managed identities** on Azure (no secrets needed)
7. **Enable conditional access** policies
8. **Monitor sign-ins** and token usage
9. **Implement token caching** properly
10. **Use HTTPS only** for all requests

---

## Managed Identities (Azure)

For Azure-hosted apps, use managed identities (no secrets!):

```python
from azure.identity import DefaultAzureCredential
from msgraph import GraphServiceClient

credential = DefaultAzureCredential()
client = GraphServiceClient(credential)

users = await client.users.get()
```

Azure automatically handles authentication.

---

## Troubleshooting

### Common Errors

**AADSTS65001: No permission**
- Ensure permissions are granted in app registration
- Admin consent may be required

**AADSTS700016: Invalid client secret**
- Secret expired or incorrect
- Create new secret

**AADSTS50105: User not assigned**
- User not assigned to application
- Add user in Enterprise Applications

**AADSTS50126: Invalid credentials**
- Check client ID, secret, tenant ID
- Verify endpoint URL

### Token Validation
Decode token at https://jwt.ms to verify:
- Audience (aud): Should be Graph API
- Scopes/roles: Should include requested permissions
- Expiration (exp): Token not expired
- Issuer (iss): From your tenant

---

## Additional Resources

- **MSAL Libraries:** https://docs.microsoft.com/azure/active-directory/develop/msal-overview
- **Permissions Reference:** https://docs.microsoft.com/graph/permissions-reference
- **OAuth 2.0:** https://oauth.net/2/
- **Azure AD Docs:** https://docs.microsoft.com/azure/active-directory/develop/
