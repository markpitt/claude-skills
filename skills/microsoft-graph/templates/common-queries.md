# Common Microsoft Graph API Queries

This template provides frequently used query patterns and examples for Microsoft Graph API.

## Query Parameters

### $select - Choose Properties
```http
# Get only specific properties
GET /users?$select=displayName,mail,jobTitle

# Fewer properties = faster response
GET /users/{id}?$select=displayName,userPrincipalName
```

### $filter - Filter Results
```http
# Exact match
GET /users?$filter=displayName eq 'John Doe'

# Not equal
GET /users?$filter=accountEnabled ne false

# Greater than/less than
GET /users?$filter=createdDateTime gt 2024-01-01T00:00:00Z

# Starts with
GET /users?$filter=startsWith(displayName,'A')

# Contains (requires ConsistencyLevel header)
GET /users?$filter=contains(displayName,'Smith')
ConsistencyLevel: eventual

# Multiple conditions (AND)
GET /users?$filter=department eq 'Engineering' and accountEnabled eq true

# Multiple conditions (OR)
GET /users?$filter=department eq 'Engineering' or department eq 'Sales'

# Collection filtering (any/all)
GET /groups?$filter=groupTypes/any(c:c eq 'Unified')
```

### $orderby - Sort Results
```http
# Ascending
GET /users?$orderby=displayName

# Descending
GET /users?$orderby=createdDateTime desc

# Multiple fields
GET /users?$orderby=department,displayName
```

### $top - Limit Results
```http
# Get first 10 users
GET /users?$top=10

# Get first 50 messages
GET /me/messages?$top=50
```

### $skip - Skip Results
```http
# Skip first 20 results
GET /users?$skip=20

# Combine with $top for pagination
GET /users?$top=10&$skip=20
```

### $expand - Include Related Resources
```http
# Expand single navigation property
GET /users/{id}?$expand=manager

# Expand multiple properties
GET /users/{id}?$expand=manager,directReports

# Nested expand
GET /users/{id}?$expand=manager($select=displayName)

# Expand collection with select
GET /groups/{id}?$expand=members($select=displayName,mail)
```

### $count - Get Count
```http
# Include count of total items
GET /users?$count=true
ConsistencyLevel: eventual

# Response includes @odata.count property
```

### $search - Search
```http
# Search in displayName
GET /users?$search="displayName:John"
ConsistencyLevel: eventual

# Search multiple fields
GET /messages?$search="from:john OR subject:meeting"
ConsistencyLevel: eventual

# Search with quotes for exact phrase
GET /messages?$search="subject:\"project update\""
ConsistencyLevel: eventual
```

---

## Common User Queries

### Find Users by Department
```http
GET /users?$filter=department eq 'Engineering'&$select=displayName,mail,jobTitle
```

### Get All Admins
```http
GET /directoryRoles/{global-admin-role-id}/members
```

### Find Users Without Manager
```http
GET /users?$filter=manager eq null&$select=displayName,mail
```

### Get Users Created in Last 7 Days
```http
GET /users?$filter=createdDateTime ge {7-days-ago}
```

### Find Guest Users
```http
GET /users?$filter=userType eq 'Guest'
```

### Search Users by Name
```http
GET /users?$search="displayName:John Smith"&$select=displayName,mail
ConsistencyLevel: eventual
```

---

## Common Group Queries

### Find Microsoft 365 Groups
```http
GET /groups?$filter=groupTypes/any(c:c eq 'Unified')
```

### Find Security Groups
```http
GET /groups?$filter=securityEnabled eq true and mailEnabled eq false
```

### Get Group Members
```http
GET /groups/{id}/members?$select=displayName,mail,userPrincipalName
```

### Find Groups User Belongs To
```http
GET /users/{id}/memberOf
GET /users/{id}/transitiveMemberOf
```

### Groups with Specific Owner
```http
GET /users/{owner-id}/ownedObjects?$filter=@odata.type eq '#microsoft.graph.group'
```

---

## Common Mail Queries

### Get Unread Messages
```http
GET /me/messages?$filter=isRead eq false&$orderby=receivedDateTime desc
```

### Get High Priority Messages
```http
GET /me/messages?$filter=importance eq 'high'
```

### Messages from Specific Sender
```http
GET /me/messages?$filter=from/emailAddress/address eq 'boss@example.com'
```

### Messages with Attachments
```http
GET /me/messages?$filter=hasAttachments eq true
```

### Messages in Date Range
```http
GET /me/messages?$filter=receivedDateTime ge 2024-01-01T00:00:00Z and receivedDateTime lt 2024-02-01T00:00:00Z
```

### Search Email by Subject
```http
GET /me/messages?$search="subject:meeting"&$orderby=receivedDateTime desc
```

### Get Inbox Message Count
```http
GET /me/mailFolders/inbox?$select=unreadItemCount,totalItemCount
```

---

## Common Calendar Queries

### Get Today's Events
```http
GET /me/calendar/calendarView?startDateTime={today-start}&endDateTime={today-end}
```

### Get This Week's Events
```http
GET /me/calendar/calendarView?startDateTime={week-start}&endDateTime={week-end}&$orderby=start/dateTime
```

### Find Events by Subject
```http
GET /me/events?$filter=contains(subject,'standup')
```

### Get All-Day Events
```http
GET /me/events?$filter=isAllDay eq true
```

### Events with Specific Attendee
```http
GET /me/events?$filter=attendees/any(a:a/emailAddress/address eq 'colleague@example.com')
```

### Upcoming Events (Next 7 Days)
```http
GET /me/calendar/calendarView?startDateTime={now}&endDateTime={7-days-from-now}&$orderby=start/dateTime
```

---

## Common File Queries

### Recent Files
```http
GET /me/drive/recent
```

### Shared With Me
```http
GET /me/drive/sharedWithMe
```

### Search Files
```http
GET /me/drive/root/search(q='presentation')?$select=name,webUrl,size
```

### Large Files (>100MB)
```http
GET /me/drive/root/children?$filter=size gt 104857600
```

### Files Modified Recently
```http
GET /me/drive/root/children?$filter=lastModifiedDateTime gt {7-days-ago}&$orderby=lastModifiedDateTime desc
```

### Files by Type
```http
GET /me/drive/root/children?$filter=file ne null and endsWith(name,'.pdf')
```

---

## Common Teams Queries

### Get User's Teams
```http
GET /me/joinedTeams
```

### Get Team Channels
```http
GET /teams/{team-id}/channels?$select=displayName,description
```

### Get Recent Channel Messages
```http
GET /teams/{team-id}/channels/{channel-id}/messages?$top=50&$orderby=createdDateTime desc
```

### Find Teams by Name
```http
GET /me/joinedTeams?$filter=displayName eq 'Engineering'
```

---

## Pagination Patterns

### Standard Pagination
```http
# Initial request
GET /users?$top=100

# Response includes @odata.nextLink
{
  "value": [...],
  "@odata.nextLink": "https://graph.microsoft.com/v1.0/users?$top=100&$skip=100"
}

# Follow nextLink for next page
GET {nextLink}
```

### Manual Pagination
```http
# Page 1
GET /users?$top=50&$skip=0

# Page 2
GET /users?$top=50&$skip=50

# Page 3
GET /users?$top=50&$skip=100
```

---

## Delta Query Patterns

### Initial Delta Request
```http
GET /users/delta?$select=displayName,mail,userPrincipalName
```

**Response includes:**
- Current items
- `@odata.deltaLink` for future changes

### Subsequent Delta Requests
```http
GET {deltaLink}
```

**Returns only:**
- Added items
- Modified items
- Deleted items (with @removed annotation)

### Use Cases
- Sync user directory
- Track mailbox changes
- Monitor calendar updates
- File synchronization

---

## Batch Request Patterns

### Multiple Independent Requests
```http
POST https://graph.microsoft.com/v1.0/$batch
Content-Type: application/json

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
    },
    {
      "id": "3",
      "method": "GET",
      "url": "/me/events?$top=5"
    }
  ]
}
```

### Dependent Requests
```http
POST /$batch
{
  "requests": [
    {
      "id": "1",
      "method": "POST",
      "url": "/me/mailFolders",
      "body": {
        "displayName": "New Folder"
      }
    },
    {
      "id": "2",
      "method": "POST",
      "url": "/me/messages/{message-id}/move",
      "dependsOn": ["1"],
      "body": {
        "destinationId": "$1.id"
      }
    }
  ]
}
```

---

## Advanced Filter Examples

### Complex User Filters
```http
# Active engineering users
GET /users?$filter=accountEnabled eq true and department eq 'Engineering'

# Users with mobile phones
GET /users?$filter=mobilePhone ne null

# Users created this year
GET /users?$filter=createdDateTime ge 2024-01-01T00:00:00Z

# Multiple departments
GET /users?$filter=department in ('Engineering', 'Sales', 'Marketing')
```

### Group Filters
```http
# Recently created groups
GET /groups?$filter=createdDateTime ge {30-days-ago}

# Groups with specific visibility
GET /groups?$filter=visibility eq 'Private'

# Mail-enabled security groups
GET /groups?$filter=mailEnabled eq true and securityEnabled eq true
```

### License Filters
```http
# Users with specific license
GET /users?$filter=assignedLicenses/any(l:l/skuId eq '{sku-id}')
```

---

## Performance Optimization

### Use $select to Limit Data
```http
# Bad - returns all properties
GET /users

# Good - returns only needed properties
GET /users?$select=id,displayName,mail
```

### Use $top to Limit Results
```http
# Good - limit initial results
GET /users?$top=100
```

### Use $filter Server-Side
```http
# Bad - client-side filtering (downloads all data)
GET /users
# Then filter client-side

# Good - server-side filtering
GET /users?$filter=department eq 'Engineering'
```

### Combine Query Parameters
```http
# Optimal query
GET /users?$filter=accountEnabled eq true&$select=displayName,mail&$top=50&$orderby=displayName
```

---

## Consistency Levels

Some queries require eventual consistency:

```http
GET /users?$count=true&$search="displayName:John"
ConsistencyLevel: eventual
```

**Required for:**
- $count=true
- $search
- Advanced queries on certain properties

---

## Error Handling

### Check for Errors
```json
{
  "error": {
    "code": "Request_ResourceNotFound",
    "message": "Resource not found",
    "innerError": {
      "request-id": "...",
      "date": "..."
    }
  }
}
```

### Handle Throttling (429)
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
```

Implement exponential backoff.

---

## Best Practices

1. **Always use $select** when you don't need all properties
2. **Use $filter** instead of client-side filtering
3. **Implement pagination** for large result sets
4. **Use delta queries** for synchronization
5. **Batch requests** when making multiple calls
6. **Handle @odata.nextLink** automatically
7. **Set appropriate $top** values (50-100 typical)
8. **Use $search** with ConsistencyLevel header
9. **Cache results** when appropriate
10. **Monitor rate limits** and implement retry logic
