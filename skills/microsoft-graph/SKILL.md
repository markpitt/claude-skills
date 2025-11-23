---
name: microsoft-graph
description: Comprehensive skill for working with Microsoft Graph API across all services including users, groups, mail, calendar, files (OneDrive/SharePoint), Teams, security, applications, and more. Use when implementing Graph API integrations, querying Microsoft 365 data, or building applications that interact with Azure AD and Microsoft services.
version: 1.0
---

# Microsoft Graph API Skill

This skill provides comprehensive guidance for working with the Microsoft Graph API, Microsoft's unified API endpoint for accessing data across Microsoft 365, Windows, and Enterprise Mobility + Security.

## Overview

Microsoft Graph API is a RESTful web API that enables you to access Microsoft Cloud service resources. The API uses a single endpoint: `https://graph.microsoft.com`

**Base URL:** `https://graph.microsoft.com/{version}/{resource}`
- **Versions:** `v1.0` (production) or `beta` (preview features)
- **Authentication:** OAuth 2.0 (Azure AD)

## Quick Start

### Authentication Requirements
Before making Graph API calls, you need:
1. **App Registration** in Azure AD
2. **Permissions** (delegated or application)
3. **Access Token** via OAuth 2.0

For detailed authentication setup, see `resources/templates/auth-setup.md`

### Common Request Pattern
```http
GET https://graph.microsoft.com/v1.0/{resource}
Authorization: Bearer {access-token}
Content-Type: application/json
```

## Resource Categories

The Graph API is organized into major resource areas. When working on a specific task, reference the appropriate resource file for detailed endpoints and examples:

### Core Identity & Access
- **Users & Groups** → `resources/users-groups.md`
  - User management, profiles, photos
  - Group management, memberships
  - Directory objects, organizational contacts
  - Presence and profile data

- **Identity & Security** → `resources/identity.md`
  - Identity protection, risk detection
  - Conditional access policies
  - Authentication methods
  - Identity governance

### Communication & Collaboration
- **Mail** → `resources/mail.md`
  - Messages, mailboxes, mail folders
  - Send mail, attachments
  - Mail search, filtering, rules
  - Focused inbox, message flags

- **Calendar** → `resources/calendar.md`
  - Events, calendars, calendar groups
  - Meeting rooms, scheduling
  - Event attendees, reminders
  - Time zones, recurring events

- **Teams** → `resources/teams.md`
  - Teams, channels, tabs
  - Chats, messages, @mentions
  - Calls, meetings, online meetings
  - Team templates, apps

### Files & Content
- **Files (OneDrive & SharePoint)** → `resources/files.md`
  - Drive items, file operations
  - Sharing, permissions
  - Search, thumbnails
  - Delta queries for changes
  - SharePoint sites, lists

### Productivity & Planning
- **Planner** → `resources/planner.md`
  - Plans, buckets, tasks
  - Task assignments, progress
  - Plan details, categories

- **To-Do** → `resources/todo.md`
  - Task lists, tasks
  - Linked resources
  - Task completion

- **OneNote** → `resources/onenote.md`
  - Notebooks, sections, pages
  - Content operations
  - Page content HTML

### Applications & Services
- **Applications** → `resources/applications.md`
  - App registrations
  - Service principals
  - OAuth2 permissions
  - App roles, credentials

- **Security & Compliance** → `resources/security.md`
  - Security alerts, incidents
  - Threat intelligence
  - Secure scores
  - eDiscovery, compliance

### Devices & Management
- **Devices** → `resources/devices.md`
  - Device management (Intune)
  - Mobile device management
  - App management
  - Device compliance, configuration

### Reporting & Analytics
- **Reports** → `resources/reports.md`
  - Usage reports (Microsoft 365)
  - Activity reports
  - Security reports
  - User activity

### Education
- **Education** → `resources/education.md`
  - Classes, assignments
  - Students, teachers
  - Submissions, grading
  - Education organizations

## Common Operations

### Pagination
Graph API uses `@odata.nextLink` for pagination:
```json
{
  "value": [...],
  "@odata.nextLink": "https://graph.microsoft.com/v1.0/users?$skip=20"
}
```

Always check for `@odata.nextLink` and follow it to get all results.

### Query Parameters
- `$select` - Choose specific properties: `?$select=displayName,mail`
- `$filter` - Filter results: `?$filter=startsWith(displayName,'A')`
- `$orderby` - Sort results: `?$orderby=displayName`
- `$top` - Limit results: `?$top=10`
- `$skip` - Skip results: `?$skip=20`
- `$expand` - Include related resources: `?$expand=members`
- `$count` - Include count: `?$count=true`
- `$search` - Search: `?$search="displayName:John"`

### Batch Requests
Combine multiple requests into one HTTP call:
```json
POST https://graph.microsoft.com/v1.0/$batch
{
  "requests": [
    {
      "id": "1",
      "method": "GET",
      "url": "/me"
    },
    {
      "id": "2",
      "method": "GET",
      "url": "/me/messages?$top=5"
    }
  ]
}
```

### Delta Queries
Track changes over time:
```http
GET https://graph.microsoft.com/v1.0/users/delta
```

Returns `@odata.deltaLink` for subsequent queries to get only changes.

## Error Handling

Graph API returns standard HTTP status codes:
- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success, no content
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

Error response format:
```json
{
  "error": {
    "code": "InvalidAuthenticationToken",
    "message": "Access token is empty.",
    "innerError": {
      "request-id": "...",
      "date": "..."
    }
  }
}
```

### Rate Limiting
- Respect `Retry-After` header when receiving 429
- Implement exponential backoff
- Default limits vary by resource (typically 2000-10000 requests per 10 seconds)

## Permissions

Graph API uses two permission models:

### Delegated Permissions
User signs in, app acts on behalf of user. Format: `Resource.Permission.Scope`
Examples: `User.Read`, `Mail.Send`, `Files.ReadWrite`

### Application Permissions
App runs without signed-in user (daemon/service). Format: `Resource.Permission.All`
Examples: `User.Read.All`, `Mail.Send`, `Sites.ReadWrite.All`

### Permission Scopes
- **Read** - Read resource data
- **ReadWrite** - Read and modify resource data
- **ReadBasic** - Read basic properties only
- **All** - Access all resources of this type

**Important:** Always request the least privileged permissions needed.

## Best Practices

### Performance
1. Use `$select` to request only needed properties
2. Use `$top` to limit results
3. Implement pagination properly
4. Use delta queries for sync scenarios
5. Cache tokens (respect expiration)
6. Use batch requests for multiple operations

### Security
1. Store tokens securely (never in code or version control)
2. Use HTTPS only
3. Validate permissions needed
4. Implement proper error handling
5. Log security-relevant events
6. Rotate app secrets regularly

### Development
1. Test in `beta` version for new features, deploy to `v1.0`
2. Handle API versioning changes
3. Monitor deprecation notices
4. Use Graph Explorer for testing
5. Check service health status
6. Implement retry logic with backoff

## Tools & Testing

### Microsoft Graph Explorer
Interactive tool to test Graph API calls:
https://developer.microsoft.com/graph/graph-explorer

### SDKs Available
- .NET - `Microsoft.Graph`
- JavaScript/TypeScript - `@microsoft/microsoft-graph-client`
- Python - `msgraph-sdk-python`
- Java - `microsoft-graph`
- PHP - `microsoft-graph`
- PowerShell - `Microsoft.Graph`

### Testing Connection
Use the script in `scripts/test-connection.py` to verify authentication and basic connectivity.

## Common Use Cases

### Reading User Profile
```http
GET https://graph.microsoft.com/v1.0/me
```

### Sending Email
```http
POST https://graph.microsoft.com/v1.0/me/sendMail
{
  "message": {
    "subject": "Test",
    "body": {
      "contentType": "Text",
      "content": "Hello"
    },
    "toRecipients": [
      {"emailAddress": {"address": "user@example.com"}}
    ]
  }
}
```

### Listing Files
```http
GET https://graph.microsoft.com/v1.0/me/drive/root/children
```

### Creating Calendar Event
```http
POST https://graph.microsoft.com/v1.0/me/events
{
  "subject": "Meeting",
  "start": {"dateTime": "2024-01-20T14:00:00", "timeZone": "UTC"},
  "end": {"dateTime": "2024-01-20T15:00:00", "timeZone": "UTC"}
}
```

## Progressive Loading

This skill uses progressive disclosure. The main SKILL.md provides overview and navigation. When working on specific tasks:

1. **Identify the resource area** (Users, Mail, Files, etc.)
2. **Reference the specific resource file** from `resources/` directory
3. **Load only what's needed** for the current task
4. **Use templates** in `templates/` for common patterns

## Reference Links

- **Official Docs:** https://docs.microsoft.com/graph/
- **API Reference:** https://docs.microsoft.com/graph/api/overview
- **Graph Explorer:** https://developer.microsoft.com/graph/graph-explorer
- **Permissions Reference:** https://docs.microsoft.com/graph/permissions-reference
- **Changelog:** https://docs.microsoft.com/graph/changelog
- **Known Issues:** https://docs.microsoft.com/graph/known-issues

## Getting Help

When implementing Graph API features:
1. Check if the resource has a dedicated file in `resources/`
2. Review authentication requirements in `templates/auth-setup.md`
3. Check common query patterns in `templates/common-queries.md`
4. Test with Graph Explorer before implementing
5. Verify required permissions in Azure AD
6. Check API version (v1.0 vs beta)

## Notes

- This skill covers the full Microsoft Graph API surface area
- Resource files contain detailed endpoints, examples, and use cases
- Always check official documentation for latest changes
- Some beta endpoints may not be in production (v1.0)
- Permission requirements vary by endpoint
- Rate limits vary by resource type
