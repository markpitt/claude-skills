# Applications - Microsoft Graph API

This resource covers app registrations, service principals, OAuth2 permissions, and application management in Azure AD.

## Base Endpoints

- Applications: `https://graph.microsoft.com/v1.0/applications`
- Service Principals: `https://graph.microsoft.com/v1.0/servicePrincipals`
- OAuth2 Permissions: `https://graph.microsoft.com/v1.0/oauth2PermissionGrants`

## Applications

### List Applications
```http
GET /applications
GET /applications?$select=displayName,appId,createdDateTime
```

### Get Application
```http
GET /applications/{application-object-id}
GET /applications(appId='{client-id}')
```

### Create Application
```http
POST /applications
Content-Type: application/json

{
  "displayName": "My Application",
  "signInAudience": "AzureADMyOrg"
}
```

**Required Permissions:** `Application.ReadWrite.All`

**signInAudience values:**
- `AzureADMyOrg` - Single tenant
- `AzureADMultipleOrgs` - Multi-tenant
- `AzureADandPersonalMicrosoftAccount` - Multi-tenant + personal accounts
- `PersonalMicrosoftAccount` - Personal accounts only

### Update Application
```http
PATCH /applications/{id}
{
  "displayName": "Updated App Name",
  "web": {
    "redirectUris": [
      "https://myapp.com/callback"
    ]
  }
}
```

### Delete Application
```http
DELETE /applications/{id}
```

---

## Application Properties

### Configure Redirect URIs
```http
PATCH /applications/{id}
{
  "web": {
    "redirectUris": [
      "https://myapp.com/auth/callback"
    ]
  },
  "spa": {
    "redirectUris": [
      "https://myapp.com/spa-callback"
    ]
  },
  "publicClient": {
    "redirectUris": [
      "https://login.microsoftonline.com/common/oauth2/nativeclient"
    ]
  }
}
```

### Configure API Permissions
```http
PATCH /applications/{id}
{
  "requiredResourceAccess": [
    {
      "resourceAppId": "00000003-0000-0000-c000-000000000000",
      "resourceAccess": [
        {
          "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
          "type": "Scope"
        },
        {
          "id": "df021288-bdef-4463-88db-98f22de89214",
          "type": "Role"
        }
      ]
    }
  ]
}
```

**resourceAppId:**
- Microsoft Graph: `00000003-0000-0000-c000-000000000000`

**type:**
- `Scope` - Delegated permission
- `Role` - Application permission

### Expose API
```http
PATCH /applications/{id}
{
  "identifierUris": [
    "api://{client-id}"
  ],
  "api": {
    "oauth2PermissionScopes": [
      {
        "adminConsentDescription": "Allow the app to access data",
        "adminConsentDisplayName": "Access data",
        "id": "{guid}",
        "isEnabled": true,
        "type": "User",
        "userConsentDescription": "Allow the app to access your data",
        "userConsentDisplayName": "Access your data",
        "value": "access_as_user"
      }
    ]
  }
}
```

### Configure App Roles
```http
PATCH /applications/{id}
{
  "appRoles": [
    {
      "allowedMemberTypes": ["User"],
      "description": "Administrators have full access",
      "displayName": "Administrator",
      "id": "{guid}",
      "isEnabled": true,
      "value": "Admin"
    },
    {
      "allowedMemberTypes": ["User"],
      "description": "Readers can view data",
      "displayName": "Reader",
      "id": "{guid}",
      "isEnabled": true,
      "value": "Reader"
    }
  ]
}
```

---

## Service Principals

Service principals are the local representation of an application in a specific tenant.

### List Service Principals
```http
GET /servicePrincipals
GET /servicePrincipals?$filter=displayName eq 'My App'
```

### Get Service Principal
```http
GET /servicePrincipals/{id}
GET /servicePrincipals(appId='{client-id}')
```

### Create Service Principal
```http
POST /servicePrincipals
{
  "appId": "{client-id}"
}
```

### Update Service Principal
```http
PATCH /servicePrincipals/{id}
{
  "tags": ["WindowsAzureActiveDirectoryIntegratedApp"]
}
```

### Delete Service Principal
```http
DELETE /servicePrincipals/{id}
```

---

## App Role Assignments

### List App Role Assignments
```http
GET /servicePrincipals/{sp-id}/appRoleAssignedTo
```

### Assign App Role to User
```http
POST /servicePrincipals/{sp-id}/appRoleAssignedTo
{
  "principalId": "{user-id}",
  "resourceId": "{sp-id}",
  "appRoleId": "{app-role-id}"
}
```

### Assign App Role to Group
```http
POST /groups/{group-id}/appRoleAssignments
{
  "principalId": "{group-id}",
  "resourceId": "{sp-id}",
  "appRoleId": "{app-role-id}"
}
```

### Remove App Role Assignment
```http
DELETE /servicePrincipals/{sp-id}/appRoleAssignedTo/{assignment-id}
```

---

## OAuth2 Permission Grants

### List Permission Grants
```http
GET /oauth2PermissionGrants
GET /oauth2PermissionGrants?$filter=clientId eq '{sp-id}'
```

### Grant Delegated Permissions
```http
POST /oauth2PermissionGrants
{
  "clientId": "{client-sp-id}",
  "consentType": "AllPrincipals",
  "principalId": null,
  "resourceId": "{resource-sp-id}",
  "scope": "User.Read Mail.Read"
}
```

**consentType:**
- `AllPrincipals` - Admin consent for all users
- `Principal` - User consent for specific user (requires principalId)

### Update Permission Grant
```http
PATCH /oauth2PermissionGrants/{grant-id}
{
  "scope": "User.Read Mail.Read Calendars.Read"
}
```

### Revoke Permission Grant
```http
DELETE /oauth2PermissionGrants/{grant-id}
```

---

## Application Credentials

### List Password Credentials
```http
GET /applications/{id}?$select=passwordCredentials
```

### Add Password Credential
```http
POST /applications/{id}/addPassword
{
  "passwordCredential": {
    "displayName": "Client Secret 1"
  }
}
```

**Returns:** New secret (store immediately - cannot retrieve later)

### Remove Password Credential
```http
POST /applications/{id}/removePassword
{
  "keyId": "{credential-key-id}"
}
```

### List Certificate Credentials
```http
GET /applications/{id}?$select=keyCredentials
```

### Add Certificate Credential
```http
POST /applications/{id}/addKey
{
  "keyCredential": {
    "type": "AsymmetricX509Cert",
    "usage": "Verify",
    "key": "BASE64_ENCODED_CERTIFICATE"
  },
  "passwordCredential": null,
  "proof": "{proof-token}"
}
```

---

## Owners

### List Application Owners
```http
GET /applications/{id}/owners
```

### Add Owner
```http
POST /applications/{id}/owners/$ref
{
  "@odata.id": "https://graph.microsoft.com/v1.0/users/{user-id}"
}
```

### Remove Owner
```http
DELETE /applications/{id}/owners/{user-id}/$ref
```

---

## App Templates

### List Application Templates
```http
GET /applicationTemplates
```

### Get Template
```http
GET /applicationTemplates/{template-id}
```

### Instantiate Template
```http
POST /applicationTemplates/{template-id}/instantiate
{
  "displayName": "My App from Template"
}
```

---

## Policies

### Token Lifetime Policies

#### List Policies
```http
GET /policies/tokenLifetimePolicies
```

#### Create Policy
```http
POST /policies/tokenLifetimePolicies
{
  "displayName": "Custom Token Lifetime",
  "definition": [
    "{\"TokenLifetimePolicy\":{\"Version\":1,\"AccessTokenLifetime\":\"4:00:00\"}}"
  ]
}
```

#### Assign Policy to Application
```http
POST /applications/{app-id}/tokenLifetimePolicies/$ref
{
  "@odata.id": "https://graph.microsoft.com/v1.0/policies/tokenLifetimePolicies/{policy-id}"
}
```

### Home Realm Discovery Policies
```http
POST /policies/homeRealmDiscoveryPolicies
{
  "displayName": "HRD Policy",
  "definition": [
    "{\"HomeRealmDiscoveryPolicy\":{\"AccelerateToFederatedDomain\":true}}"
  ]
}
```

---

## Federated Identity Credentials

### List Federated Credentials
```http
GET /applications/{id}/federatedIdentityCredentials
```

### Add Federated Credential
```http
POST /applications/{id}/federatedIdentityCredentials
{
  "name": "GitHubActions",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:org/repo:environment:Production",
  "audiences": ["api://AzureADTokenExchange"]
}
```

Use for workload identity federation (GitHub Actions, Kubernetes, etc.)

---

## Application Extensions

### Define Schema Extension
```http
POST /schemaExtensions
{
  "id": "myapp_customData",
  "description": "Custom data for my app",
  "targetTypes": ["User"],
  "properties": [
    {
      "name": "customField",
      "type": "String"
    }
  ]
}
```

### Use Extension
```http
PATCH /users/{user-id}
{
  "myapp_customData": {
    "customField": "value"
  }
}
```

---

## Synchronization (App Provisioning)

### Get Synchronization Schema
```http
GET /servicePrincipals/{sp-id}/synchronization/jobs/{job-id}/schema
```

### Start Synchronization
```http
POST /servicePrincipals/{sp-id}/synchronization/jobs/{job-id}/start
```

### Pause Synchronization
```http
POST /servicePrincipals/{sp-id}/synchronization/jobs/{job-id}/pause
```

---

## Permissions Reference

### Delegated Permissions
- `Application.Read.All` - Read all applications
- `Application.ReadWrite.All` - Read and write all applications
- `Application.ReadWrite.OwnedBy` - Manage apps the user owns

### Application Permissions
- `Application.Read.All` - Read all applications
- `Application.ReadWrite.All` - Read and write all applications
- `Application.ReadWrite.OwnedBy` - Manage owned applications

---

## Common Patterns

### Register App with Permissions
```http
# 1. Create application
POST /applications
{
  "displayName": "My App",
  "requiredResourceAccess": [...]
}

# 2. Create service principal
POST /servicePrincipals
{
  "appId": "{client-id}"
}

# 3. Grant admin consent
POST /oauth2PermissionGrants
{...}
```

### Rotate Client Secret
```http
# 1. Add new secret
POST /applications/{id}/addPassword
{...}

# 2. Update application to use new secret

# 3. Remove old secret
POST /applications/{id}/removePassword
{...}
```

---

## Best Practices

1. **Use managed identities** when possible (Azure resources)
2. **Rotate secrets regularly** (every 90 days recommended)
3. **Use certificates** instead of secrets for production
4. **Request least privilege** permissions
5. **Use workload identity federation** for CI/CD
6. **Monitor consent grants** regularly
7. **Document custom app roles** clearly
8. **Use schema extensions** sparingly
9. **Implement proper token caching**
10. **Test multi-tenant apps** in multiple tenants
