# FreeAgent API Authentication & Setup

## Overview

FreeAgent uses OAuth 2.0 for authentication. All API requests require an Authorization header with a valid access token.

**Base URLs:**
- Production: `https://api.freeagent.com/v2/`
- Sandbox: `https://api.sandbox.freeagent.com/v2/` (for testing)

## OAuth 2.0 Authentication Flow

### Step 1: Create a Developer App

1. Log in to your FreeAgent account
2. Navigate to **Developer Dashboard** at https://dev.freeagent.com/
3. Create a new application
4. Note your **OAuth Client ID** and **Client Secret**
5. Set your **Redirect URI** (where users return after authorization)

### Step 2: Obtain Authorization

Direct users to the authorization endpoint:

```
https://api.freeagent.com/v2/approve_app?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code
```

After the user authorizes, FreeAgent redirects to your `redirect_uri` with an authorization code:

```
YOUR_REDIRECT_URI?code=AUTHORIZATION_CODE&state=YOUR_STATE_VALUE
```

### Step 3: Exchange Authorization Code for Tokens

```bash
curl -X POST \
     -d "grant_type=authorization_code" \
     -d "code=AUTHORIZATION_CODE" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=YOUR_REDIRECT_URI" \
     https://api.freeagent.com/v2/token_endpoint
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

## Token Management

### Access Token

- **Validity**: 1 hour (3600 seconds)
- **Usage**: Include in Authorization header: `Authorization: Bearer YOUR_ACCESS_TOKEN`
- **Scope**: Full access to API based on user permissions

### Refresh Token

- **Validity**: Long-lived (typically 6 months)
- **Purpose**: Obtain new access tokens without user interaction
- **Security**: Store securely, never expose in client-side code

### Refreshing the Access Token

When your access token expires (or preemptively to avoid expiration):

```bash
curl -X POST \
     -d "grant_type=refresh_token" \
     -d "refresh_token=YOUR_REFRESH_TOKEN" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     https://api.freeagent.com/v2/token_endpoint
```

**Python Example:**
```python
import requests
import os

def refresh_access_token():
    token_url = "https://api.freeagent.com/v2/token_endpoint"
    
    data = {
        'grant_type': 'refresh_token',
        'refresh_token': os.getenv('FREEAGENT_REFRESH_TOKEN'),
        'client_id': os.getenv('FREEAGENT_CLIENT_ID'),
        'client_secret': os.getenv('FREEAGENT_CLIENT_SECRET')
    }
    
    response = requests.post(token_url, data=data)
    tokens = response.json()
    
    # Update your stored tokens
    os.environ['FREEAGENT_ACCESS_TOKEN'] = tokens['access_token']
    os.environ['FREEAGENT_REFRESH_TOKEN'] = tokens['refresh_token']
    
    return tokens
```

## Environment Setup

### Recommended Environment Variables

Store these securely (use a `.env` file with a secrets manager, not in version control):

```bash
# OAuth Credentials
export FREEAGENT_CLIENT_ID="your_oauth_client_id"
export FREEAGENT_CLIENT_SECRET="your_oauth_client_secret"

# Access Tokens
export FREEAGENT_ACCESS_TOKEN="your_access_token"
export FREEAGENT_REFRESH_TOKEN="your_refresh_token"

# API Configuration
export FREEAGENT_API_URL="https://api.freeagent.com/v2"
export FREEAGENT_SANDBOX=false

# Optional
export FREEAGENT_TIMEOUT="30"
```

### Loading from .env File

**Bash:**
```bash
set -a
source .env
set +a
```

**Python:**
```python
from dotenv import load_dotenv
import os

load_dotenv()
access_token = os.getenv('FREEAGENT_ACCESS_TOKEN')
```

## Making Your First API Request

### Quick Test with cURL

```bash
curl -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
     -H "Accept: application/json" \
     "https://api.freeagent.com/v2/company"
```

### Quick Test with Python

```python
import requests
import os

headers = {
    'Authorization': f'Bearer {os.getenv("FREEAGENT_ACCESS_TOKEN")}',
    'Accept': 'application/json'
}

response = requests.get('https://api.freeagent.com/v2/company', headers=headers)
company = response.json()['company']

print(f"Company: {company['name']}")
print(f"Currency: {company['currency']}")
```

## Common Headers

### Request Headers

```
Authorization: Bearer YOUR_ACCESS_TOKEN
Accept: application/json
Content-Type: application/json (for POST/PUT)
User-Agent: YourApp/1.0
```

### Response Headers

```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 115
X-RateLimit-Reset: 1737123600
Content-Type: application/json
```

## Rate Limits

- **Per-minute limit**: 120 requests/minute
- **Per-hour limit**: 3600 requests/hour
- **Check headers**: `X-RateLimit-*` headers in every response

**Handling Rate Limits:**

```python
import time

def api_call_with_retry(url, headers, max_retries=3):
    for attempt in range(max_retries):
        response = requests.get(url, headers=headers)
        
        if response.status_code == 429:  # Too Many Requests
            retry_after = int(response.headers.get('Retry-After', 60))
            print(f"Rate limited. Waiting {retry_after} seconds...")
            time.sleep(retry_after)
            continue
        
        response.raise_for_status()
        return response.json()
    
    raise Exception("Failed after max retries")
```

## Authentication Troubleshooting

### 401 Unauthorized

**Causes:**
- Missing Authorization header
- Invalid or expired access token
- Malformed Bearer token format

**Solution:**
```bash
# Verify token format
curl -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
     https://api.freeagent.com/v2/company

# If expired, refresh the token
python3 -c "from examples import refresh_access_token; refresh_access_token()"
```

### 403 Forbidden

**Cause:** Access token valid but user lacks permission for this resource

**Solution:**
- Check user role in FreeAgent account
- Verify token has appropriate scopes
- Request access through FreeAgent admin panel

### Token Expiration Detection

```python
import json
from datetime import datetime, timedelta

def is_token_expired(token_string):
    """Check if JWT token is expired"""
    try:
        payload = token_string.split('.')[1]
        # Add padding if needed
        padding = 4 - len(payload) % 4
        payload += '=' * padding
        
        decoded = json.loads(base64.urlsafe_b64decode(payload))
        exp = datetime.fromtimestamp(decoded['exp'])
        
        return exp < datetime.now()
    except:
        return True  # Assume expired if can't decode
```

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for tokens
3. **Rotate refresh tokens** periodically
4. **Use HTTPS** for all requests
5. **Implement token refresh** before expiration
6. **Log authentication events** (without exposing tokens)
7. **Use secure storage** for refresh tokens (not localStorage in browsers)
8. **Validate SSL certificates** in production

## Testing in Sandbox

FreeAgent provides a sandbox environment for testing:

```bash
# Use sandbox URL
export FREEAGENT_API_URL="https://api.sandbox.freeagent.com/v2"

# Create test OAuth app in sandbox developer portal
# https://dev.sandbox.freeagent.com/
```

**Sandbox Benefits:**
- Test without affecting production data
- Unlimited API calls (no rate limiting)
- Same API structure as production
- Separate data from production environment

See also:
- [Contacts & Organizations](contacts-organizations.md) for querying company data
- [Accounting Objects](accounting-objects.md) for financial data endpoints
- [API Request Template](../templates/api-request-template.sh) for curl examples
