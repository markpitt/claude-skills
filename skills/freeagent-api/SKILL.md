---
name: freeagent-api
description: Interacts with the FreeAgent accounting API to manage invoices, contacts, projects, expenses, timeslips, and other financial data. Use when the user needs to retrieve, create, update, or analyze FreeAgent accounting information via the API.
allowed-tools: Bash, Read, Write, Edit, WebFetch
version: 1.0
---

# FreeAgent API Skill

This skill helps you interact with the FreeAgent API to manage accounting and invoicing data.

## Overview

FreeAgent is an online accounting system for freelancers and small businesses. The API allows programmatic access to:

- **Contacts** - Clients, suppliers, and other business contacts
- **Invoices** - Sales invoices and credit notes
- **Expenses** - Business expenses and receipts
- **Projects** - Project tracking and billing
- **Timeslips** - Time tracking for billable work
- **Bank Accounts** - Bank transactions and reconciliation
- **Company** - Company information and settings
- **Users** - Team members and permissions

## API Basics

**Base URLs:**
- Production: `https://api.freeagent.com/v2/`
- Sandbox: `https://api.sandbox.freeagent.com/v2/`

**Authentication:** OAuth 2.0
**Data Formats:** JSON (default) or XML
**Rate Limits:** 120 requests/minute, 3600 requests/hour

## Authentication Setup

Before making API requests, the user needs to:

1. **Create a Developer App** at https://dev.freeagent.com/
   - Log in to FreeAgent
   - Navigate to Developer Dashboard
   - Create a new app
   - Note the OAuth Client ID and Client Secret

2. **Obtain Access Tokens:**
   - Authorization URL: `https://api.freeagent.com/v2/approve_app`
   - Token URL: `https://api.freeagent.com/v2/token_endpoint`
   - Use the Developer Dashboard to exchange authorization codes for tokens

3. **Store Credentials Securely:**
   - Save access token and refresh token
   - Never commit credentials to version control
   - Consider using environment variables or a secrets manager

## Making API Requests

All API requests require an Authorization header:

```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Example: Get All Contacts

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Accept: application/json" \
     https://api.freeagent.com/v2/contacts
```

### Example: Create an Invoice

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "invoice": {
         "contact": "https://api.freeagent.com/v2/contacts/123",
         "dated_on": "2025-01-15",
         "payment_terms_in_days": 30,
         "invoice_items": [
           {
             "item_type": "Hours",
             "description": "Consulting services",
             "quantity": 10,
             "price": 150.00
           }
         ]
       }
     }' \
     https://api.freeagent.com/v2/invoices
```

## Common Operations

### List Resources

Most endpoints support GET requests with optional filters:

```bash
# Get invoices updated since a date
GET /v2/invoices?view=recent&updated_since=2025-01-01T00:00:00Z

# Get contacts with filtering
GET /v2/contacts?view=active

# Get timeslips for a project
GET /v2/timeslips?project=https://api.freeagent.com/v2/projects/123
```

### Create Resources

Use POST with JSON body:

```bash
POST /v2/contacts
POST /v2/invoices
POST /v2/expenses
POST /v2/timeslips
```

### Update Resources

Use PUT with the resource URL and updated fields:

```bash
PUT /v2/invoices/123
PUT /v2/contacts/456
```

### Delete Resources

Use DELETE with the resource URL:

```bash
DELETE /v2/timeslips/789
```

## Response Format

Successful responses return JSON with the resource wrapped in a root key:

```json
{
  "contact": {
    "url": "https://api.freeagent.com/v2/contacts/123",
    "organisation_name": "Acme Corp",
    "email": "billing@acme.com",
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-15T14:30:00Z"
  }
}
```

List responses include multiple items:

```json
{
  "contacts": [
    { "url": "...", "organisation_name": "..." },
    { "url": "...", "organisation_name": "..." }
  ]
}
```

## Error Handling

The API returns standard HTTP status codes:

- **200 OK** - Request succeeded
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid request format
- **401 Unauthorized** - Missing or invalid access token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource doesn't exist
- **422 Unprocessable Entity** - Validation errors
- **429 Too Many Requests** - Rate limit exceeded
- **500 Server Error** - FreeAgent server error

Error responses include details:

```json
{
  "errors": [
    {
      "message": "Organisation name can't be blank",
      "field": "organisation_name"
    }
  ]
}
```

## Best Practices

1. **Use Sandbox for Testing**
   - Test all integrations in sandbox environment first
   - Sandbox data is separate from production

2. **Handle Rate Limits**
   - Monitor `X-RateLimit-*` headers in responses
   - Implement exponential backoff for 429 errors

3. **Refresh Tokens**
   - Access tokens expire after a period
   - Use refresh tokens to obtain new access tokens
   - Store both tokens securely

4. **Pagination**
   - Use `page` and `per_page` parameters for large result sets
   - Default is usually 100 items per page

5. **Filter Responses**
   - Use `view` and `updated_since` parameters to reduce data transfer
   - Only request the fields you need

6. **Validate Input**
   - Check required fields before making requests
   - Format dates as ISO 8601 (YYYY-MM-DD)
   - Ensure monetary amounts are formatted correctly

## Workflow Steps

When helping users with FreeAgent API tasks:

1. **Verify Authentication**
   - Confirm user has OAuth credentials
   - Check if access token is available
   - Guide through token setup if needed

2. **Identify the Resource**
   - Determine which API endpoint is needed
   - Check resource documentation in resources/endpoints.md

3. **Prepare the Request**
   - Construct the appropriate HTTP method (GET/POST/PUT/DELETE)
   - Build the request URL
   - Format the request body if needed

4. **Execute the Request**
   - Use curl or HTTP library
   - Include proper headers (Authorization, Content-Type, Accept)
   - Handle potential errors

5. **Process the Response**
   - Parse JSON response
   - Extract relevant data
   - Present results to user

6. **Error Recovery**
   - Check for error messages
   - Provide clear explanations
   - Suggest fixes for common issues

## Environment Variables

Recommend users store credentials as environment variables:

```bash
export FREEAGENT_CLIENT_ID="your_client_id"
export FREEAGENT_CLIENT_SECRET="your_client_secret"
export FREEAGENT_ACCESS_TOKEN="your_access_token"
export FREEAGENT_REFRESH_TOKEN="your_refresh_token"
export FREEAGENT_API_URL="https://api.freeagent.com/v2"
```

## Python Example

When writing Python scripts, use the requests library:

```python
import requests
import os

API_URL = os.getenv('FREEAGENT_API_URL', 'https://api.freeagent.com/v2')
ACCESS_TOKEN = os.getenv('FREEAGENT_ACCESS_TOKEN')

headers = {
    'Authorization': f'Bearer {ACCESS_TOKEN}',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
}

# Get all contacts
response = requests.get(f'{API_URL}/contacts', headers=headers)
contacts = response.json()['contacts']

# Create an invoice
invoice_data = {
    'invoice': {
        'contact': 'https://api.freeagent.com/v2/contacts/123',
        'dated_on': '2025-01-15',
        'payment_terms_in_days': 30,
        'invoice_items': [{
            'item_type': 'Hours',
            'description': 'Consulting',
            'quantity': 10,
            'price': 150.00
        }]
    }
}

response = requests.post(
    f'{API_URL}/invoices',
    headers=headers,
    json=invoice_data
)

if response.status_code == 201:
    invoice = response.json()['invoice']
    print(f"Invoice created: {invoice['url']}")
else:
    print(f"Error: {response.json()}")
```

## Additional Resources

For detailed endpoint documentation, refer to:
- `resources/endpoints.md` - Comprehensive endpoint reference
- `resources/examples.md` - Common use case examples
- Official docs: https://dev.freeagent.com/docs

## Important Notes

- Always test in sandbox before production
- Handle authentication token expiry gracefully
- Respect rate limits to avoid being throttled
- Use HTTPS for all API requests
- Keep credentials secure and never log them
- Follow FreeAgent's Terms of Service and API usage guidelines

## Troubleshooting

**401 Unauthorized:**
- Check access token is valid and not expired
- Verify Authorization header format
- Try refreshing the token

**422 Validation Error:**
- Review error messages for specific field issues
- Check required fields are present
- Verify date formats (YYYY-MM-DD)
- Ensure URLs reference valid resources

**429 Rate Limit:**
- Wait before retrying
- Implement exponential backoff
- Check X-RateLimit-Reset header for reset time

**Cannot Find Resource:**
- Verify the resource URL is correct
- Check you have permission to access it
- Ensure it exists in the current environment (sandbox vs production)
