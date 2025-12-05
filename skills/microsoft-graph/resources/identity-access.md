# Users & Groups - Microsoft Graph API

This resource covers all endpoints related to users, groups, directory objects, and organizational management.

## Users

### Base Endpoint
`https://graph.microsoft.com/v1.0/users`

### Common User Operations

#### Get Current User
```http
GET /me
```

#### Get Specific User
```http
GET /users/{id | userPrincipalName}
```

#### List All Users
```http
GET /users
GET /users?$select=displayName,mail,userPrincipalName
GET /users?$filter=startsWith(displayName,'John')
GET /users?$top=10&$orderby=displayName
```

#### Create User
```http
POST /users
Content-Type: application/json

{
  "accountEnabled": true,
  "displayName": "John Doe",
  "mailNickname": "johnd",
  "userPrincipalName": "john.doe@contoso.com",
  "passwordProfile": {
    "forceChangePasswordNextSignIn": true,
    "password": "TempP@ssw0rd!"
  }
}
```

**Required Permissions:** `User.ReadWrite.All`

#### Update User
```http
PATCH /users/{id}
Content-Type: application/json

{
  "displayName": "Jane Doe",
  "jobTitle": "Senior Developer",
  "officeLocation": "Building 2, Room 201"
}
```

#### Delete User
```http
DELETE /users/{id}
```

**Required Permissions:** `User.ReadWrite.All`

### User Properties

**Core Properties:**
- `id` - Unique identifier
- `userPrincipalName` - UPN (email-style identifier)
- `displayName` - Display name
- `givenName` - First name
- `surname` - Last name
- `mail` - Email address
- `mobilePhone` - Mobile phone number
- `officeLocation` - Office location
- `jobTitle` - Job title
- `department` - Department
- `companyName` - Company name
- `accountEnabled` - Account status
- `createdDateTime` - Creation date
- `userType` - Member or Guest

**Select specific properties:**
```http
GET /users/{id}?$select=displayName,mail,jobTitle,department
```

### User Photo

#### Get Photo
```http
GET /users/{id}/photo/$value
```

Returns binary image data.

#### Get Photo Metadata
```http
GET /users/{id}/photo
```

Returns height, width, id.

#### Upload Photo
```http
PUT /users/{id}/photo/$value
Content-Type: image/jpeg

[Binary image data]
```

**Supported formats:** JPEG, PNG, GIF
**Max size:** 4 MB (v1.0), 8 MB (beta)

### Manager and Direct Reports

#### Get Manager
```http
GET /users/{id}/manager
```

#### Get Direct Reports
```http
GET /users/{id}/directReports
```

#### Assign Manager
```http
PUT /users/{id}/manager/$ref
Content-Type: application/json

{
  "@odata.id": "https://graph.microsoft.com/v1.0/users/{manager-id}"
}
```

### User Presence

#### Get Presence
```http
GET /users/{id}/presence
```

**Returns:**
- `availability` - Available, Busy, Away, BeRightBack, DoNotDisturb, Offline, etc.
- `activity` - InACall, InAMeeting, Presenting, etc.

**Required Permissions:** `Presence.Read` or `Presence.Read.All`

### User Settings

#### Get User Settings
```http
GET /users/{id}/settings
```

#### Regional Settings
```http
GET /users/{id}/settings/regionalAndLanguageSettings
PATCH /users/{id}/settings/regionalAndLanguageSettings
{
  "defaultTranslationLanguage": "en-US",
  "regionalFormat": "en-US"
}
```

---

## Groups

### Base Endpoint
`https://graph.microsoft.com/v1.0/groups`

### Group Types

**Microsoft 365 Groups (Unified Groups):**
- Email, calendar, files, conversations
- `groupTypes: ["Unified"]`
- `mailEnabled: true`, `securityEnabled: false`

**Security Groups:**
- Access control, permissions
- `groupTypes: []`
- `mailEnabled: false`, `securityEnabled: true`

**Mail-enabled Security Groups:**
- Email + security
- `groupTypes: []`
- `mailEnabled: true`, `securityEnabled: true`

**Distribution Groups:**
- Email only
- `groupTypes: []`
- `mailEnabled: true`, `securityEnabled: false`

### Common Group Operations

#### List All Groups
```http
GET /groups
GET /groups?$select=displayName,mail,groupTypes
GET /groups?$filter=groupTypes/any(c:c eq 'Unified')
```

#### Get Specific Group
```http
GET /groups/{id}
```

#### Create Microsoft 365 Group
```http
POST /groups
Content-Type: application/json

{
  "description": "Engineering Team",
  "displayName": "Engineering",
  "groupTypes": ["Unified"],
  "mailEnabled": true,
  "mailNickname": "engineering",
  "securityEnabled": false
}
```

**Required Permissions:** `Group.ReadWrite.All`

#### Create Security Group
```http
POST /groups
Content-Type: application/json

{
  "description": "Security group for application access",
  "displayName": "App Access Group",
  "groupTypes": [],
  "mailEnabled": false,
  "mailNickname": "appaccess",
  "securityEnabled": true
}
```

#### Update Group
```http
PATCH /groups/{id}
Content-Type: application/json

{
  "description": "Updated description",
  "displayName": "New Display Name"
}
```

#### Delete Group
```http
DELETE /groups/{id}
```

### Group Membership

#### List Group Members
```http
GET /groups/{id}/members
GET /groups/{id}/members?$select=displayName,mail
```

#### Add Member
```http
POST /groups/{id}/members/$ref
Content-Type: application/json

{
  "@odata.id": "https://graph.microsoft.com/v1.0/users/{user-id}"
}
```

Or add multiple members:
```http
PATCH /groups/{id}
Content-Type: application/json

{
  "members@odata.bind": [
    "https://graph.microsoft.com/v1.0/users/{user-id-1}",
    "https://graph.microsoft.com/v1.0/users/{user-id-2}"
  ]
}
```

#### Remove Member
```http
DELETE /groups/{id}/members/{user-id}/$ref
```

#### Check Membership
```http
POST /users/{user-id}/checkMemberGroups
Content-Type: application/json

{
  "groupIds": ["{group-id-1}", "{group-id-2}"]
}
```

Returns array of group IDs the user is a member of.

#### Get Transitive Members
```http
GET /groups/{id}/transitiveMembers
```

Includes members of nested groups.

### Group Owners

#### List Owners
```http
GET /groups/{id}/owners
```

#### Add Owner
```http
POST /groups/{id}/owners/$ref
Content-Type: application/json

{
  "@odata.id": "https://graph.microsoft.com/v1.0/users/{user-id}"
}
```

#### Remove Owner
```http
DELETE /groups/{id}/owners/{user-id}/$ref
```

### Group Resources

#### Get Group Drive
```http
GET /groups/{id}/drive
GET /groups/{id}/drive/root/children
```

#### Get Group Calendar
```http
GET /groups/{id}/calendar
GET /groups/{id}/events
```

#### Get Group Conversations
```http
GET /groups/{id}/conversations
GET /groups/{id}/conversations/{conversation-id}/threads
```

#### Get Group Site (SharePoint)
```http
GET /groups/{id}/sites/root
```

---

## Directory Objects

### Base Endpoint
`https://graph.microsoft.com/v1.0/directoryObjects`

### Operations

#### Get Directory Object
```http
GET /directoryObjects/{id}
```

#### Get by IDs
```http
POST /directoryObjects/getByIds
Content-Type: application/json

{
  "ids": ["{id-1}", "{id-2}", "{id-3}"],
  "types": ["user", "group"]
}
```

#### Check Member Objects
```http
POST /users/{user-id}/checkMemberObjects
Content-Type: application/json

{
  "ids": ["{group-id-1}", "{group-id-2}"]
}
```

---

## Organization

### Base Endpoint
`https://graph.microsoft.com/v1.0/organization`

### Get Organization Details
```http
GET /organization
GET /organization/{id}
```

**Returns:**
- `displayName` - Organization name
- `verifiedDomains` - Verified domains
- `assignedPlans` - Subscribed services
- `technicalNotificationMails` - Admin emails
- `country` - Country/region
- `createdDateTime` - Tenant creation date

---

## Domains

### Base Endpoint
`https://graph.microsoft.com/v1.0/domains`

### List Domains
```http
GET /domains
```

### Get Domain
```http
GET /domains/{domain-name}
```

### Add Domain
```http
POST /domains
Content-Type: application/json

{
  "id": "contoso.com"
}
```

### Verify Domain
```http
POST /domains/{domain-name}/verify
```

---

## Contacts (Organizational)

### Base Endpoint
`https://graph.microsoft.com/v1.0/contacts`

### List Contacts
```http
GET /contacts
```

### Get Contact
```http
GET /contacts/{id}
```

---

## User Insights

### Get Trending Items
```http
GET /me/insights/trending
```

Returns items trending around the user.

### Get Used Items
```http
GET /me/insights/used
```

Returns items recently used by the user.

### Get Shared Items
```http
GET /me/insights/shared
```

Returns items shared with or by the user.

**Required Permissions:** `Sites.Read.All`

---

## Advanced Queries

### Filter Users by Property
```http
# Users with specific job title
GET /users?$filter=jobTitle eq 'Developer'

# Users in specific department
GET /users?$filter=department eq 'Engineering'

# Users with display name starting with
GET /users?$filter=startsWith(displayName,'John')

# Account enabled/disabled
GET /users?$filter=accountEnabled eq true

# Users created after date
GET /users?$filter=createdDateTime ge 2024-01-01T00:00:00Z
```

### Search Users
```http
GET /users?$search="displayName:John"
Headers: ConsistencyLevel: eventual
```

### Count Users
```http
GET /users?$count=true
Headers: ConsistencyLevel: eventual
```

### Filter Groups
```http
# Microsoft 365 groups only
GET /groups?$filter=groupTypes/any(c:c eq 'Unified')

# Security groups only
GET /groups?$filter=securityEnabled eq true and mailEnabled eq false

# Groups with specific display name
GET /groups?$filter=displayName eq 'Engineering'
```

---

## Permissions Reference

### Delegated Permissions
- `User.Read` - Read signed-in user's profile
- `User.ReadWrite` - Read and update signed-in user's profile
- `User.ReadBasic.All` - Read basic profiles of all users
- `User.Read.All` - Read all users' full profiles
- `User.ReadWrite.All` - Read and write all users' full profiles
- `Group.Read.All` - Read all groups
- `Group.ReadWrite.All` - Read and write all groups
- `Directory.Read.All` - Read directory data
- `Directory.ReadWrite.All` - Read and write directory data
- `Directory.AccessAsUser.All` - Access directory as signed-in user

### Application Permissions
- `User.Read.All` - Read all users' profiles
- `User.ReadWrite.All` - Read and write all users' profiles
- `Group.Read.All` - Read all groups
- `Group.ReadWrite.All` - Read and write all groups
- `Directory.Read.All` - Read directory data
- `Directory.ReadWrite.All` - Read and write directory data

---

## Common Patterns

### Get User with Manager and Direct Reports
```http
GET /users/{id}?$expand=manager,directReports
```

### Get Groups User is Member Of
```http
GET /users/{id}/memberOf
GET /users/{id}/transitiveMemberOf
```

### Get Group with Members
```http
GET /groups/{id}?$expand=members
```

### Batch Request for Multiple Users
```http
POST /$batch
Content-Type: application/json

{
  "requests": [
    {"id": "1", "method": "GET", "url": "/users/user1@contoso.com"},
    {"id": "2", "method": "GET", "url": "/users/user2@contoso.com"},
    {"id": "3", "method": "GET", "url": "/users/user3@contoso.com"}
  ]
}
```

---

## Best Practices

1. **Use $select** to retrieve only needed properties
2. **Use $filter** instead of client-side filtering
3. **Handle pagination** - always check for @odata.nextLink
4. **Cache user data** appropriately (consider delta queries)
5. **Use batch requests** for multiple operations
6. **Respect rate limits** - implement exponential backoff
7. **Use consistent headers** for advanced queries (ConsistencyLevel: eventual)
8. **Validate permissions** before attempting operations
9. **Handle guest users** differently (userType property)
10. **Use transitive queries** for nested group memberships
