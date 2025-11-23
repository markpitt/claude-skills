# Identity & Access Management - Microsoft Graph API

This resource covers identity protection, conditional access, authentication methods, and identity governance.

## Base Endpoints

- Identity Protection: `https://graph.microsoft.com/v1.0/identityProtection`
- Conditional Access: `https://graph.microsoft.com/v1.0/identity/conditionalAccess`
- Authentication Methods: `https://graph.microsoft.com/v1.0/users/{id}/authentication`

## Identity Protection

### Risk Detections

#### List Risk Detections
```http
GET /identityProtection/riskDetections
GET /identityProtection/riskDetections?$filter=riskLevel eq 'high'
```

**Risk levels:** `low`, `medium`, `high`, `hidden`, `none`, `unknownFutureValue`

**Risk types:**
- `unfamiliarFeatures` - Unfamiliar sign-in properties
- `anonymizedIPAddress` - Anonymous IP address
- `maliciousIPAddress` - Malicious IP address
- `leakedCredentials` - Leaked credentials
- `impossibleTravel` - Atypical travel
- `malwareInfectedIPAddress` - Malware linked IP address
- `suspiciousIPAddress` - Suspicious IP address
- `unfamiliarLocation` - Unfamiliar location
- `mcasImpossibleTravel` - Cloud App Security impossible travel
- And more...

#### Get Risk Detection
```http
GET /identityProtection/riskDetections/{detection-id}
```

### Risky Users

#### List Risky Users
```http
GET /identityProtection/riskyUsers
GET /identityProtection/riskyUsers?$filter=riskLevel eq 'high'
```

#### Get Risky User
```http
GET /identityProtection/riskyUsers/{user-id}
```

#### Dismiss User Risk
```http
POST /identityProtection/riskyUsers/dismiss
{
  "userIds": ["{user-id-1}", "{user-id-2}"]
}
```

#### Confirm User Compromised
```http
POST /identityProtection/riskyUsers/confirmCompromised
{
  "userIds": ["{user-id}"]
}
```

#### Get Risk History
```http
GET /identityProtection/riskyUsers/{user-id}/history
```

### Risky Service Principals

#### List Risky Service Principals
```http
GET /identityProtection/riskyServicePrincipals
```

#### Confirm Service Principal Compromised
```http
POST /identityProtection/riskyServicePrincipals/confirmCompromised
{
  "servicePrincipalIds": ["{sp-id}"]
}
```

### Sign-in Risk

#### List Risky Sign-ins (beta)
```http
GET /identityProtection/riskySignIns
```

---

## Conditional Access

### Policies

#### List Policies
```http
GET /identity/conditionalAccess/policies
```

#### Get Policy
```http
GET /identity/conditionalAccess/policies/{policy-id}
```

#### Create Policy
```http
POST /identity/conditionalAccess/policies
{
  "displayName": "Require MFA for Admins",
  "state": "enabled",
  "conditions": {
    "users": {
      "includeRoles": ["62e90394-69f5-4237-9190-012177145e10"]
    },
    "applications": {
      "includeApplications": ["All"]
    }
  },
  "grantControls": {
    "operator": "OR",
    "builtInControls": ["mfa"]
  }
}
```

**Required Permissions:** `Policy.Read.All`, `Policy.ReadWrite.ConditionalAccess`

**Built-in controls:**
- `block` - Block access
- `mfa` - Require MFA
- `compliantDevice` - Require compliant device
- `domainJoinedDevice` - Require domain-joined device
- `approvedApplication` - Require approved app
- `compliantApplication` - Require app protection policy

#### Update Policy
```http
PATCH /identity/conditionalAccess/policies/{policy-id}
{
  "state": "disabled"
}
```

**State values:** `enabled`, `disabled`, `enabledForReportingButNotEnforced`

#### Delete Policy
```http
DELETE /identity/conditionalAccess/policies/{policy-id}
```

### Named Locations

#### List Named Locations
```http
GET /identity/conditionalAccess/namedLocations
```

#### Create IP Named Location
```http
POST /identity/conditionalAccess/namedLocations
{
  "@odata.type": "#microsoft.graph.ipNamedLocation",
  "displayName": "Office IP Ranges",
  "isTrusted": true,
  "ipRanges": [
    {
      "@odata.type": "#microsoft.graph.iPv4CidrRange",
      "cidrAddress": "203.0.113.0/24"
    }
  ]
}
```

#### Create Country Named Location
```http
POST /identity/conditionalAccess/namedLocations
{
  "@odata.type": "#microsoft.graph.countryNamedLocation",
  "displayName": "Blocked Countries",
  "countriesAndRegions": ["CN", "RU"],
  "includeUnknownCountriesAndRegions": false
}
```

---

## Authentication Methods

### List User's Authentication Methods
```http
GET /users/{user-id}/authentication/methods
```

### Phone Authentication

#### List Phone Methods
```http
GET /users/{user-id}/authentication/phoneMethods
```

#### Add Phone Method
```http
POST /users/{user-id}/authentication/phoneMethods
{
  "phoneNumber": "+1 555-0100",
  "phoneType": "mobile"
}
```

**Phone types:** `mobile`, `alternateMobile`, `office`

### Email Authentication

#### Get Email Methods
```http
GET /users/{user-id}/authentication/emailMethods
```

#### Add Email Method
```http
POST /users/{user-id}/authentication/emailMethods
{
  "emailAddress": "backup@example.com"
}
```

### FIDO2 Security Keys

#### List FIDO2 Methods
```http
GET /users/{user-id}/authentication/fido2Methods
```

### Microsoft Authenticator

#### List Authenticator Methods
```http
GET /users/{user-id}/authentication/microsoftAuthenticatorMethods
```

### Temporary Access Pass

#### Create TAP
```http
POST /users/{user-id}/authentication/temporaryAccessPassMethods
{
  "lifetimeInMinutes": 60,
  "isUsableOnce": true
}
```

**Returns:** One-time password

### Password Methods

#### Reset Password
```http
POST /users/{user-id}/authentication/passwordMethods/{method-id}/resetPassword
{
  "newPassword": "NewP@ssw0rd!"
}
```

---

## Identity Governance

### Access Reviews

#### List Access Reviews
```http
GET /identityGovernance/accessReviews/definitions
```

#### Create Access Review
```http
POST /identityGovernance/accessReviews/definitions
{
  "displayName": "Quarterly Access Review",
  "scope": {
    "@odata.type": "#microsoft.graph.accessReviewQueryScope",
    "query": "/groups/{group-id}/members",
    "queryType": "MicrosoftGraph"
  },
  "reviewers": [
    {
      "query": "/users/{reviewer-id}",
      "queryType": "MicrosoftGraph"
    }
  ],
  "schedule": {
    "pattern": {
      "type": "absoluteMonthly",
      "interval": 3,
      "month": 1,
      "dayOfMonth": 1
    },
    "range": {
      "type": "noEnd",
      "startDate": "2024-01-01"
    }
  }
}
```

#### List Review Instances
```http
GET /identityGovernance/accessReviews/definitions/{definition-id}/instances
```

#### Record Decision
```http
POST /identityGovernance/accessReviews/definitions/{def-id}/instances/{inst-id}/decisions/{dec-id}
{
  "decision": "approve",
  "justification": "User still requires access"
}
```

**Decisions:** `approve`, `deny`, `dontKnow`, `notReviewed`

### Entitlement Management

#### List Access Packages
```http
GET /identityGovernance/entitlementManagement/accessPackages
```

#### Get Access Package
```http
GET /identityGovernance/entitlementManagement/accessPackages/{package-id}
```

#### Create Access Package
```http
POST /identityGovernance/entitlementManagement/accessPackages
{
  "displayName": "Sales Team Access",
  "description": "Access package for sales team members",
  "catalog": {
    "id": "{catalog-id}"
  }
}
```

#### List Assignment Requests
```http
GET /identityGovernance/entitlementManagement/assignmentRequests
```

#### Request Access
```http
POST /identityGovernance/entitlementManagement/assignmentRequests
{
  "requestType": "userAdd",
  "accessPackageAssignment": {
    "targetId": "{user-id}",
    "assignmentPolicyId": "{policy-id}",
    "accessPackageId": "{package-id}"
  }
}
```

### Privileged Identity Management (PIM)

#### List Role Assignments
```http
GET /roleManagement/directory/roleAssignments
```

#### Create Eligible Role Assignment
```http
POST /roleManagement/directory/roleEligibilityScheduleRequests
{
  "action": "adminAssign",
  "justification": "Assign eligible role",
  "roleDefinitionId": "{role-definition-id}",
  "directoryScopeId": "/",
  "principalId": "{user-id}",
  "scheduleInfo": {
    "startDateTime": "2024-01-01T00:00:00Z",
    "expiration": {
      "type": "afterDuration",
      "duration": "PT8H"
    }
  }
}
```

#### Activate Role
```http
POST /roleManagement/directory/roleAssignmentScheduleRequests
{
  "action": "selfActivate",
  "principalId": "{user-id}",
  "roleDefinitionId": "{role-definition-id}",
  "directoryScopeId": "/",
  "justification": "Need to perform admin tasks",
  "scheduleInfo": {
    "startDateTime": "2024-01-15T14:00:00Z",
    "expiration": {
      "type": "afterDuration",
      "duration": "PT8H"
    }
  }
}
```

### Terms of Use

#### List Agreements
```http
GET /identityGovernance/termsOfUse/agreements
```

#### Create Agreement
```http
POST /identityGovernance/termsOfUse/agreements
{
  "displayName": "Company Terms of Use",
  "isViewingBeforeAcceptanceRequired": true,
  "files": [
    {
      "fileName": "TOU.pdf",
      "language": "en",
      "isDefault": true,
      "fileData": {
        "data": "BASE64_PDF_CONTENT"
      }
    }
  ]
}
```

#### List User Acceptances
```http
GET /identityGovernance/termsOfUse/agreements/{agreement-id}/acceptances
```

---

## Sign-in Logs

### List Sign-ins
```http
GET /auditLogs/signIns
GET /auditLogs/signIns?$top=10&$orderby=createdDateTime desc
```

### Filter Sign-ins
```http
# Failed sign-ins
GET /auditLogs/signIns?$filter=status/errorCode ne 0

# Specific user
GET /auditLogs/signIns?$filter=userPrincipalName eq 'user@example.com'

# Date range
GET /auditLogs/signIns?$filter=createdDateTime ge 2024-01-01T00:00:00Z
```

**Required Permissions:** `AuditLog.Read.All`, `Directory.Read.All`

---

## Directory Audit Logs

### List Audit Logs
```http
GET /auditLogs/directoryAudits
```

### Filter Audits
```http
# Specific activity
GET /auditLogs/directoryAudits?$filter=activityDisplayName eq 'Add user'

# By initiator
GET /auditLogs/directoryAudits?$filter=initiatedBy/user/userPrincipalName eq 'admin@example.com'

# Category
GET /auditLogs/directoryAudits?$filter=category eq 'UserManagement'
```

---

## Permissions Reference

### Delegated Permissions
- `IdentityRiskEvent.Read.All` - Read identity risk events
- `IdentityRiskyUser.Read.All` - Read risky users
- `IdentityRiskyUser.ReadWrite.All` - Manage risky users
- `Policy.Read.All` - Read policies
- `Policy.ReadWrite.ConditionalAccess` - Manage conditional access
- `UserAuthenticationMethod.Read.All` - Read authentication methods
- `UserAuthenticationMethod.ReadWrite.All` - Manage authentication methods
- `AccessReview.Read.All` - Read access reviews
- `AccessReview.ReadWrite.All` - Manage access reviews
- `EntitlementManagement.Read.All` - Read entitlement management
- `EntitlementManagement.ReadWrite.All` - Manage entitlement management
- `AuditLog.Read.All` - Read audit logs

### Application Permissions
- `IdentityRiskEvent.Read.All` - Read all identity risk events
- `IdentityRiskyUser.Read.All` - Read all risky users
- `Policy.Read.All` - Read all policies
- `UserAuthenticationMethod.Read.All` - Read all authentication methods
- `AuditLog.Read.All` - Read all audit logs

---

## Common Patterns

### Monitor Failed Sign-ins
```http
GET /auditLogs/signIns?$filter=status/errorCode ne 0&$top=50&$orderby=createdDateTime desc
```

### Review High-Risk Users
```http
# 1. Get high-risk users
GET /identityProtection/riskyUsers?$filter=riskLevel eq 'high'

# 2. Review risk detections
GET /identityProtection/riskDetections?$filter=userId eq '{user-id}'

# 3. Take action
POST /identityProtection/riskyUsers/dismiss or confirmCompromised
```

### Enforce MFA for Admins
```http
POST /identity/conditionalAccess/policies
{
  "displayName": "Require MFA for Global Admins",
  "conditions": {
    "users": {
      "includeRoles": ["62e90394-69f5-4237-9190-012177145e10"]
    },
    "applications": {"includeApplications": ["All"]}
  },
  "grantControls": {"builtInControls": ["mfa"]}
}
```

---

## Best Practices

1. **Enable risk-based policies** - automate responses to risky sign-ins
2. **Require MFA** for privileged roles
3. **Use PIM** for just-in-time admin access
4. **Regular access reviews** - quarterly for sensitive groups
5. **Monitor audit logs** for suspicious activity
6. **Block legacy authentication** via conditional access
7. **Require compliant devices** for corporate data
8. **Use named locations** to define trusted networks
9. **Implement TAP** for passwordless onboarding
10. **Document policy changes** in audit trail
