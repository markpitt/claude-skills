# API Integration with Azure Functions

## Azure Functions Setup

Azure Functions provide serverless APIs for your Static Web Apps.

### Project Folder Structure

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

### function.json Configuration

Defines the function's triggers and bindings:

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

#### Auth Levels
- `anonymous` - No authentication required
- `function` - Function-level key required
- `admin` - Admin-level key required

### host.json Configuration

Global settings for all functions:

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

## Example Functions

### Node.js Function

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

### C# Function

```csharp
[FunctionName("GetData")]
public static async Task<IActionResult> Run(
    [HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequest req,
    ILogger log)
{
    log.LogInformation("GetData function processed a request.");

    var data = new
    {
        message = "Hello from C#",
        timestamp = DateTime.UtcNow
    };

    return new OkObjectResult(data);
}
```

### Python Function

```python
import azure.functions as func

def main(req: func.HttpRequest) -> func.HttpResponse:
    name = req.params.get('name')
    if not name:
        try:
            req_body = req.get_json()
            name = req_body.get('name')
        except ValueError:
            pass

    if name:
        return func.HttpResponse(f"Hello {name}!")
    else:
        return func.HttpResponse("Hello, world!")
```

## Calling APIs from Frontend

### JavaScript/TypeScript

API calls are automatically proxied to `/api/*`:

```javascript
// GET request
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

// POST request
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

### React Example

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

### Angular Example

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>('/api/GetUsers');
  }

  createUser(userData: any): Observable<any> {
    return this.http.post('/api/CreateUser', userData);
  }
}
```

### Vue Example

```javascript
import { ref } from 'vue';

export default {
  setup() {
    const users = ref([]);
    const loading = ref(true);

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/GetUsers');
        users.value = await response.json();
      } catch (error) {
        console.error('Error:', error);
      } finally {
        loading.value = false;
      }
    };

    return {
      users,
      loading,
      fetchUsers
    };
  }
};
```

## CORS Considerations

**No CORS needed!** Because the API is served on the same domain (`/api/*`), CORS is not required. This is one of SWA's key advantages.

- Frontend and API share the same domain
- Cookies work seamlessly
- No preflight OPTIONS requests
- Simpler authentication flow

## Error Handling

### Error Response Pattern

```javascript
// api/GetData/index.js
module.exports = async function (context, req) {
    try {
        // Validate input
        if (!req.query.id) {
            context.res = {
                status: 400,
                body: { error: 'Missing required parameter: id' }
            };
            return;
        }

        // Business logic
        const data = await fetchDataFromDB(req.query.id);

        // Success response
        context.res = {
            status: 200,
            body: data
        };
    } catch (error) {
        context.log.error('Function error:', error);
        context.res = {
            status: 500,
            body: { error: 'Internal server error' }
        };
    }
};
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| `200` | OK - Successful request |
| `201` | Created - Resource created |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Not authenticated |
| `403` | Forbidden - No permission |
| `404` | Not Found - Resource not found |
| `409` | Conflict - Resource conflict |
| `500` | Server Error - Function error |

## Request/Response Patterns

### Query Parameters

```javascript
// Request: /api/GetUsers?name=Alice&limit=10
const name = req.query.name;
const limit = req.query.limit;
```

### Request Body

```javascript
// POST /api/CreateUser with JSON body
const userData = req.body; // { name: 'Bob', email: 'bob@example.com' }
```

### Response Headers

```javascript
context.res = {
    status: 200,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Custom-Header': 'value'
    },
    body: data
};
```

