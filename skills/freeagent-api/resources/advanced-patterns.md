# FreeAgent API: Advanced Patterns & Error Handling

## Overview

Advanced integration patterns for production-grade FreeAgent API implementations, including error handling, rate limiting, retry logic, caching, and optimization strategies.

## Error Handling

### HTTP Status Codes

FreeAgent API uses standard HTTP status codes:

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | OK | Success - parse response |
| 201 | Created | Resource created successfully |
| 204 | No Content | Success (DELETE) - no response body |
| 400 | Bad Request | Invalid request format - fix request |
| 401 | Unauthorized | Invalid/expired token - refresh token |
| 403 | Forbidden | No permission for resource - check access |
| 404 | Not Found | Resource doesn't exist - verify URL/ID |
| 422 | Unprocessable Entity | Validation errors - see error details |
| 429 | Too Many Requests | Rate limited - implement backoff |
| 500 | Server Error | FreeAgent issue - retry later |
| 503 | Service Unavailable | Maintenance - retry later |

### Error Response Format

```json
{
  "errors": [
    {
      "message": "Organisation name can't be blank",
      "field": "organisation_name"
    },
    {
      "message": "Contact doesn't exist",
      "field": "contact"
    }
  ]
}
```

### Python Error Handling

```python
import requests
from time import sleep

class FreeAgentAPIError(Exception):
    """Base exception for FreeAgent API errors"""
    pass

class RateLimitError(FreeAgentAPIError):
    """Rate limit exceeded"""
    pass

class ValidationError(FreeAgentAPIError):
    """Validation error (422)"""
    pass

class UnauthorizedError(FreeAgentAPIError):
    """Authentication error (401)"""
    pass

def handle_api_error(response):
    """Parse and handle API errors"""
    
    try:
        error_data = response.json()
    except:
        error_data = {}
    
    if response.status_code == 429:
        retry_after = int(response.headers.get('Retry-After', 60))
        raise RateLimitError(f"Rate limited. Retry after {retry_after}s")
    
    elif response.status_code == 401:
        raise UnauthorizedError("Invalid or expired access token")
    
    elif response.status_code == 422:
        errors = error_data.get('errors', [])
        error_msg = '; '.join([
            f"{e.get('field', 'unknown')}: {e.get('message', 'error')}"
            for e in errors
        ])
        raise ValidationError(f"Validation error: {error_msg}")
    
    elif response.status_code == 404:
        raise FreeAgentAPIError("Resource not found")
    
    else:
        raise FreeAgentAPIError(
            f"HTTP {response.status_code}: {error_data.get('message', response.reason)}"
        )

def make_request_with_error_handling(method, url, headers, **kwargs):
    """Make request with comprehensive error handling"""
    
    try:
        response = requests.request(method, url, headers=headers, **kwargs, timeout=30)
        
        if not response.ok:
            handle_api_error(response)
        
        return response
    
    except requests.exceptions.Timeout:
        raise FreeAgentAPIError("Request timeout (30s)")
    
    except requests.exceptions.ConnectionError:
        raise FreeAgentAPIError("Connection error - check network")
```

## Rate Limiting

### Understanding Rate Limits

- **Per-minute limit**: 120 requests/minute
- **Per-hour limit**: 3600 requests/hour
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

```bash
# Response headers example
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 115
X-RateLimit-Reset: 1737123600  # Unix timestamp
```

### Retry Strategy with Exponential Backoff

```python
import time
from typing import Dict, Any, Optional

def make_request_with_retry(
    client,
    method: str,
    endpoint: str,
    data: Optional[Dict] = None,
    params: Optional[Dict] = None,
    max_retries: int = 3,
    initial_backoff: int = 1
) -> Dict[str, Any]:
    """Make API request with exponential backoff retry logic"""
    
    backoff = initial_backoff
    last_error = None
    
    for attempt in range(max_retries):
        try:
            if method == 'GET':
                return client.get(endpoint, params=params)
            elif method == 'POST':
                return client.post(endpoint, data)
            elif method == 'PUT':
                return client.put(endpoint, data)
            elif method == 'DELETE':
                return client.delete(endpoint)
        
        except RateLimitError as e:
            if attempt < max_retries - 1:
                print(f"Rate limited. Waiting {backoff}s before retry {attempt + 1}/{max_retries}")
                time.sleep(backoff)
                backoff *= 2  # Exponential backoff
                continue
            last_error = e
        
        except (ConnectionError, TimeoutError) as e:
            if attempt < max_retries - 1:
                print(f"Connection error. Retrying in {backoff}s...")
                time.sleep(backoff)
                backoff *= 2
                continue
            last_error = e
        
        except ValidationError:
            # Validation errors won't be fixed by retrying
            raise
        
        except FreeAgentAPIError as e:
            last_error = e
            if attempt < max_retries - 1:
                print(f"API error: {e}. Retrying in {backoff}s...")
                time.sleep(backoff)
                backoff *= 2
                continue
    
    if last_error:
        raise last_error
    
    raise FreeAgentAPIError("Request failed after all retries")

# Usage
result = make_request_with_retry(
    client,
    'POST',
    'invoices',
    data={'invoice': invoice_data}
)
```

### Monitor Rate Limit Usage

```python
def monitor_rate_limits(client):
    """Monitor and report rate limit status"""
    
    response = client.get('company')
    
    headers = response.headers  # Assuming client.get returns full response
    
    limit = int(headers.get('X-RateLimit-Limit', 120))
    remaining = int(headers.get('X-RateLimit-Remaining', 0))
    reset_time = int(headers.get('X-RateLimit-Reset', 0))
    
    usage_percent = ((limit - remaining) / limit) * 100
    
    return {
        'limit': limit,
        'remaining': remaining,
        'used': limit - remaining,
        'usage_percent': usage_percent,
        'reset_time': reset_time
    }
```

## Pagination Best Practices

### Fetch All Results

```python
def fetch_all_paginated(client, endpoint, params=None, per_page=100):
    """Fetch all results from a paginated endpoint"""
    
    all_results = []
    page = 1
    
    if params is None:
        params = {}
    
    while True:
        params['page'] = page
        params['per_page'] = per_page
        
        response = client.get(endpoint, params=params)
        
        # Extract the list from response (assumes endpoint_name exists as key)
        items_key = endpoint.rstrip('s')  # Simple heuristic
        items = response.get(endpoint, [])
        
        if not items:
            break
        
        all_results.extend(items)
        
        # If we got fewer items than per_page, we're on the last page
        if len(items) < per_page:
            break
        
        page += 1
    
    return all_results
```

### Cursor-Based Pagination (with updated_since)

```python
def fetch_recent_changes(client, endpoint, since_timestamp, per_page=100):
    """Fetch only recently updated items"""
    
    return client.get(endpoint, params={
        'updated_since': since_timestamp,
        'per_page': per_page
    })
```

## Caching Strategy

### Simple Response Cache

```python
from datetime import datetime, timedelta
import json

class APIResponseCache:
    """Simple in-memory cache for API responses"""
    
    def __init__(self, ttl_minutes=30):
        self.cache = {}
        self.ttl = timedelta(minutes=ttl_minutes)
    
    def get(self, key):
        if key not in self.cache:
            return None
        
        cached_value, timestamp = self.cache[key]
        
        if datetime.now() - timestamp > self.ttl:
            del self.cache[key]
            return None
        
        return cached_value
    
    def set(self, key, value):
        self.cache[key] = (value, datetime.now())
    
    def clear(self):
        self.cache.clear()

# Usage
cache = APIResponseCache(ttl_minutes=15)

def get_contacts_cached(client):
    cache_key = 'contacts:active'
    
    # Check cache first
    cached = cache.get(cache_key)
    if cached:
        print("Using cached contacts")
        return cached
    
    # Fetch from API
    print("Fetching contacts from API")
    contacts = client.get('contacts', params={'view': 'active'})
    
    # Store in cache
    cache.set(cache_key, contacts)
    
    return contacts
```

### Database Cache with SQLite

```python
import sqlite3
from datetime import datetime, timedelta
import json

class DatabaseCache:
    """Persistent cache using SQLite"""
    
    def __init__(self, db_path='api_cache.db'):
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()
        self.create_table()
    
    def create_table(self):
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS api_cache (
                key TEXT PRIMARY KEY,
                value TEXT,
                timestamp DATETIME
            )
        ''')
        self.conn.commit()
    
    def get(self, key, ttl_minutes=30):
        self.cursor.execute(
            'SELECT value, timestamp FROM api_cache WHERE key = ?',
            (key,)
        )
        result = self.cursor.fetchone()
        
        if not result:
            return None
        
        value, timestamp = result
        cached_time = datetime.fromisoformat(timestamp)
        
        if datetime.now() - cached_time > timedelta(minutes=ttl_minutes):
            self.delete(key)
            return None
        
        return json.loads(value)
    
    def set(self, key, value):
        self.cursor.execute(
            'INSERT OR REPLACE INTO api_cache (key, value, timestamp) VALUES (?, ?, ?)',
            (key, json.dumps(value), datetime.now().isoformat())
        )
        self.conn.commit()
    
    def delete(self, key):
        self.cursor.execute('DELETE FROM api_cache WHERE key = ?', (key,))
        self.conn.commit()
```

## Validation Patterns

### Validate Before Creating

```python
def validate_contact_data(data):
    """Validate contact data before creating"""
    
    errors = []
    
    # Check required fields
    has_name = (
        data.get('organisation_name') or
        (data.get('first_name') and data.get('last_name'))
    )
    
    if not has_name:
        errors.append("Either organisation_name or (first_name + last_name) is required")
    
    # Validate email format
    if 'email' in data and data['email']:
        if '@' not in data['email']:
            errors.append("Email format is invalid")
    
    # Validate phone format (basic check)
    if 'phone_number' in data and data['phone_number']:
        if not data['phone_number'].startswith('+'):
            errors.append("Phone number should include country code (e.g., +44)")
    
    # Validate payment terms
    if 'default_payment_terms_in_days' in data:
        try:
            days = int(data['default_payment_terms_in_days'])
            if days < 0 or days > 365:
                errors.append("Payment terms must be between 0 and 365 days")
        except (TypeError, ValueError):
            errors.append("Payment terms must be a number")
    
    return errors

# Usage
data = {'first_name': 'John', 'email': 'invalid-email'}
errors = validate_contact_data(data)

if errors:
    print("Validation errors:")
    for error in errors:
        print(f"  - {error}")
else:
    contact = client.post('contacts', {'contact': data})
```

## Logging & Audit Trail

```python
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    filename='freeagent_api.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class AuditedAPIClient:
    """API client with audit logging"""
    
    def __init__(self, client):
        self.client = client
    
    def get(self, endpoint, params=None):
        logging.info(f"GET {endpoint} with params {params}")
        result = self.client.get(endpoint, params=params)
        logging.info(f"GET {endpoint} returned {len(result)} items")
        return result
    
    def post(self, endpoint, data):
        logging.info(f"POST {endpoint} with data keys: {data.keys()}")
        result = self.client.post(endpoint, data)
        resource_url = result.get('url', 'unknown')
        logging.info(f"POST {endpoint} created {resource_url}")
        return result
    
    def put(self, endpoint, data):
        logging.info(f"PUT {endpoint} with data keys: {data.keys()}")
        result = self.client.put(endpoint, data)
        logging.info(f"PUT {endpoint} updated successfully")
        return result
    
    def delete(self, endpoint):
        logging.info(f"DELETE {endpoint}")
        self.client.delete(endpoint)
        logging.info(f"DELETE {endpoint} successful")
```

## Connection Pooling

```python
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

def create_session_with_retry():
    """Create requests session with connection pooling and retry logic"""
    
    session = requests.Session()
    
    # Configure retry strategy
    retry_strategy = Retry(
        total=3,
        status_forcelist=[429, 500, 502, 503, 504],
        method_whitelist=["HEAD", "GET", "OPTIONS", "POST", "PUT", "DELETE"],
        backoff_factor=1
    )
    
    # Mount adapter with retry strategy
    adapter = HTTPAdapter(
        max_retries=retry_strategy,
        pool_connections=10,
        pool_maxsize=10
    )
    
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    return session

# Usage
session = create_session_with_retry()
response = session.get('https://api.freeagent.com/v2/company')
```

## Related Resources

See also:
- [Authentication & Setup](authentication-setup.md) for OAuth setup
- [Accounting Objects](accounting-objects.md) for core API endpoints
- [Code Examples](../resources/examples.md) for complete implementations
- [Python Client Template](../templates/python-client.py) for production client
