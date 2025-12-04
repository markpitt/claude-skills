# Azure DevOps Organization & Security

Covers organization and project management, user and group administration, security policies, identities, and access control.

## Organizations & Projects

Organization and project-level management.

### Organization Management
Azure DevOps organizations are created through the Azure DevOps portal. Key endpoints:

### List Projects
```http
GET /{organization}/_apis/projects?api-version=7.1
```

Query options:
- `?stateFilter=wellFormed` - Only valid projects
- `?includeCapabilities=true` - Include project capabilities
- `?$skip=0&$top=100` - Pagination

### Get Project
```http
GET /{organization}/_apis/projects/{projectId}?api-version=7.1
```

Response includes:
- Project name and description
- Project capabilities (version control, process template)
- Default team
- Visibility (public/private)

### Create Project
```http
POST /{organization}/_apis/projects?api-version=7.1
Content-Type: application/json

{
  "name": "MyProject",
  "description": "Project description",
  "capabilities": {
    "versioncontrol": {
      "sourceControlType": "Git"
    },
    "processTemplate": {
      "templateTypeId": "6b724908-ef14-45cf-84f8-768b5384da45"
    }
  },
  "visibility": "private"
}
```

Process template IDs:
- `6b724908-ef14-45cf-84f8-768b5384da45` - Agile
- `adcc42ab-9882-485e-a3ed-7678f01f66bc` - Scrum
- `27450541-8e31-4150-9947-dc59f998fc01` - CMMI

### Update Project
```http
PATCH /{organization}/_apis/projects/{projectId}?api-version=7.1
Content-Type: application/json

{
  "description": "Updated project description",
  "visibility": "public"
}
```

### Delete Project
```http
DELETE /{organization}/_apis/projects/{projectId}?api-version=7.1
```

## Teams

Organize users into teams within projects.

### List Teams
```http
GET /{organization}/_apis/teams?api-version=7.1
```

Or for specific project:
```http
GET /{organization}/_apis/projects/{projectId}/teams?api-version=7.1
```

### Get Team
```http
GET /{organization}/_apis/projects/{projectId}/teams/{teamId}?api-version=7.1
```

### Create Team
```http
POST /{organization}/_apis/projects/{projectId}/teams?api-version=7.1
Content-Type: application/json

{
  "name": "Backend Team",
  "description": "Team responsible for backend services"
}
```

### Update Team
```http
PATCH /{organization}/_apis/projects/{projectId}/teams/{teamId}?api-version=7.1
Content-Type: application/json

{
  "name": "Updated Team Name",
  "description": "Updated description"
}
```

### Delete Team
```http
DELETE /{organization}/_apis/projects/{projectId}/teams/{teamId}?api-version=7.1
```

## Team Members

Manage team membership.

### Get Team Members
```http
GET /{organization}/_apis/projects/{projectId}/teams/{teamId}/members?api-version=7.1
```

### Add Team Member
```http
PUT /{organization}/_apis/projects/{projectId}/teams/{teamId}/members/{userId}?api-version=7.1
```

### Remove Team Member
```http
DELETE /{organization}/_apis/projects/{projectId}/teams/{teamId}/members/{userId}?api-version=7.1
```

## Users & Groups Management

User and group administration.

### List Users (Graph API)
```http
GET https://vssps.dev.azure.com/{organization}/_apis/graph/users?api-version=7.1-preview.1
```

### Get User
```http
GET https://vssps.dev.azure.com/{organization}/_apis/graph/users/{userDescriptor}?api-version=7.1-preview.1
```

User descriptor format: `aad.{guid}` for Azure AD users

### Create User
```http
POST https://vssps.dev.azure.com/{organization}/_apis/graph/users?api-version=7.1-preview.1
Content-Type: application/json

{
  "principalName": "user@example.com",
  "displayName": "User Name",
  "mailAddress": "user@example.com"
}
```

### Delete User
```http
DELETE https://vssps.dev.azure.com/{organization}/_apis/graph/users/{userDescriptor}?api-version=7.1-preview.1
```

### List Groups
```http
GET https://vssps.dev.azure.com/{organization}/_apis/graph/groups?api-version=7.1-preview.1
```

### Get Group
```http
GET https://vssps.dev.azure.com/{organization}/_apis/graph/groups/{groupDescriptor}?api-version=7.1-preview.1
```

### Create Group
```http
POST https://vssps.dev.azure.com/{organization}/_apis/graph/groups?api-version=7.1-preview.1
Content-Type: application/json

{
  "displayName": "Architecture Team",
  "description": "Team for architecture review"
}
```

### Delete Group
```http
DELETE https://vssps.dev.azure.com/{organization}/_apis/graph/groups/{groupDescriptor}?api-version=7.1-preview.1
```

## Group Memberships

Manage group membership and nesting.

### List Group Memberships
```http
GET https://vssps.dev.azure.com/{organization}/_apis/graph/memberships/{subjectDescriptor}?api-version=7.1-preview.1
```

### Add Member to Group
```http
PUT https://vssps.dev.azure.com/{organization}/_apis/graph/memberships/{subjectDescriptor}/{containerDescriptor}?api-version=7.1-preview.1
```

### Remove Member from Group
```http
DELETE https://vssps.dev.azure.com/{organization}/_apis/graph/memberships/{subjectDescriptor}/{containerDescriptor}?api-version=7.1-preview.1
```

## Access Control Lists (ACLs)

Manage permissions using ACLs and security namespaces.

### List Security Namespaces
Security namespaces define permission categories:
```http
GET /{organization}/_apis/securitynamespaces?api-version=7.1
```

Common namespaces:
- Build namespace
- Git Repositories namespace
- Work Items namespace
- Project namespace
- Analytics namespace

### Query ACLs
```http
GET /{organization}/_apis/accesscontrollists/{securityNamespaceId}?api-version=7.1
```

With filters:
```http
GET /{organization}/_apis/accesscontrollists/{securityNamespaceId}?tokens=repoV2/{projectId}/{repoId}&descriptors={groupDescriptor}&includeExtendedInfo=true&recurse=false&api-version=7.1
```

### Set ACLs (Grant Permissions)
```http
POST /{organization}/_apis/accesscontrollists/{securityNamespaceId}?api-version=7.1
Content-Type: application/json

[
  {
    "token": "repoV2/{projectId}/{repoId}",
    "merge": false,
    "aces": [
      {
        "descriptor": "{groupDescriptor}",
        "allow": 127,
        "deny": 0,
        "extendedInfo": {
          "effectiveAllow": 127,
          "effectiveDeny": 0,
          "inheritedAllow": 0,
          "inheritedDeny": 0
        }
      }
    ]
  }
]
```

Permission bits vary by namespace (see Azure DevOps documentation for specific values).

### Remove ACLs (Deny Permissions)
```http
DELETE /{organization}/_apis/accesscontrollists/{securityNamespaceId}?tokens=repoV2/{projectId}/{repoId}&descriptors={groupDescriptor}&api-version=7.1
```

## Processes

View and manage process templates.

### List Processes
```http
GET /{organization}/_apis/process/processes?api-version=7.1
```

### Get Process
```http
GET /{organization}/_apis/process/processes/{processId}?api-version=7.1
```

### Create Process (Clone)
```http
POST /{organization}/_apis/process/processes?api-version=7.1
Content-Type: application/json

{
  "name": "CustomProcess",
  "description": "Custom process based on Agile",
  "parentProcessTypeId": "6b724908-ef14-45cf-84f8-768b5384da45",
  "type": "inherited"
}
```

## Best Practices

### Organization Management
1. Plan organization structure ahead
2. Use clear naming conventions
3. Document project purposes
4. Implement consistent processes
5. Archive old projects
6. Monitor organization growth
7. Plan capacity

### Team Organization
1. Organize teams by function
2. Keep teams reasonably sized (3-9 people)
3. Assign clear team leads
4. Document team responsibilities
5. Plan cross-team collaboration
6. Review team structure regularly
7. Support team autonomy

### User Management
1. Use Azure AD for authentication
2. Keep users current
3. Remove inactive users
4. Enforce strong passwords
5. Implement MFA
6. Document user roles
7. Audit user access regularly

### Access Control
1. Follow least privilege principle
2. Use groups for permission management
3. Avoid individual user permissions
4. Regularly audit permissions
5. Document permission decisions
6. Use service principals for automation
7. Implement separation of duties

### Security Policies
1. Enforce branch policies
2. Require code review
3. Implement build validation
4. Use status checks
5. Require work item linking
6. Audit sensitive operations
7. Monitor security events

### Governance
1. Implement consistent processes
2. Document standards
3. Enforce naming conventions
4. Require change tracking
5. Plan retention policies
6. Audit compliance regularly
7. Report on metrics
