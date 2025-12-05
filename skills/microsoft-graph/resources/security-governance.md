# Security & Governance - Microsoft Graph API

This resource covers security alerts, threat intelligence, identity protection, device management, compliance, reporting, and education endpoints.

## Base Endpoints

- Security: `https://graph.microsoft.com/v1.0/security`
- Identity Protection: `https://graph.microsoft.com/v1.0/identityProtection`
- Device Management: `https://graph.microsoft.com/v1.0/deviceManagement`
- Reports: `https://graph.microsoft.com/v1.0/reports`

---

# Security & Threat Management

## Security Alerts

### List Alerts
```http
GET /security/alerts
GET /security/alerts?$top=10&$orderby=createdDateTime desc
```

### Get Alert
```http
GET /security/alerts/{alert-id}
```

### Filter Alerts
```http
# High severity alerts
GET /security/alerts?$filter=severity eq 'high'

# Alerts from last 7 days
GET /security/alerts?$filter=createdDateTime gt {7-days-ago}

# Unresolved alerts
GET /security/alerts?$filter=status eq 'newAlert'

# Specific category
GET /security/alerts?$filter=category eq 'malware'
```

### Update Alert
```http
PATCH /security/alerts/{alert-id}
{
  "assignedTo": "analyst@example.com",
  "closedDateTime": "2024-01-15T12:00:00Z",
  "comments": ["Investigated and resolved"],
  "feedback": "truePositive",
  "status": "resolved"
}
```

**Status values:** `newAlert`, `inProgress`, `resolved`
**Feedback values:** `unknown`, `truePositive`, `falsePositive`, `benignPositive`

**Required Permissions:** `SecurityEvents.ReadWrite.All`

---

## Incidents

### List Incidents
```http
GET /security/incidents
```

### Get Incident
```http
GET /security/incidents/{incident-id}
```

### Update Incident
```http
PATCH /security/incidents/{incident-id}
{
  "status": "inProgress",
  "assignedTo": "analyst@example.com",
  "classification": "truePositive",
  "determination": "malware"
}
```

**Status:** `active`, `resolved`, `redirected`, `unknownFutureValue`
**Classification:** `unknown`, `falsePositive`, `truePositive`, `informationalExpectedActivity`, `unknownFutureValue`

---

## Secure Score

### Get Current Secure Score
```http
GET /security/secureScores?$top=1
```

### List Secure Score History
```http
GET /security/secureScores
```

### Get Secure Score Control Profiles
```http
GET /security/secureScoreControlProfiles
```

### Get Specific Control Profile
```http
GET /security/secureScoreControlProfiles/{id}
```

### Update Control Profile
```http
PATCH /security/secureScoreControlProfiles/{id}
{
  "assignedTo": "admin@example.com",
  "comment": "Working on implementing this control"
}
```

**Required Permissions:** `SecurityEvents.Read.All`

---

## Threat Indicators

### List Indicators
```http
GET /security/tiIndicators
```

### Get Indicator
```http
GET /security/tiIndicators/{indicator-id}
```

### Create Indicator
```http
POST /security/tiIndicators
{
  "action": "alert",
  "confidence": 75,
  "description": "Malicious IP address",
  "expirationDateTime": "2024-12-31T23:59:59Z",
  "targetProduct": "Microsoft Defender ATP",
  "threatType": "MaliciousUrl",
  "tlpLevel": "amber",
  "networkDestinationIPv4": "192.0.2.1"
}
```

**Required Permissions:** `ThreatIndicators.ReadWrite.OwnedBy`

### Update Indicator
```http
PATCH /security/tiIndicators/{id}
{
  "confidence": 90,
  "description": "Updated description"
}
```

### Delete Indicators
```http
POST /security/tiIndicators/deleteTiIndicators
{
  "value": ["{indicator-id-1}", "{indicator-id-2}"]
}
```

---

## Advanced Hunting

### Run Query
```http
POST /security/runHuntingQuery
{
  "query": "DeviceProcessEvents | where Timestamp > ago(7d) | limit 100"
}
```

**Required Permissions:** `ThreatHunting.Read.All`

---

# Identity Protection & Governance

## Risk Detections

### List Risk Detections
```http
GET /identityProtection/riskDetections
GET /identityProtection/riskDetections?$filter=riskLevel eq 'high'
```

**Risk levels:** `low`, `medium`, `high`, `hidden`, `none`, `unknownFutureValue`

### Get Risk Detection
```http
GET /identityProtection/riskDetections/{detection-id}
```

---

## Risky Users

### List Risky Users
```http
GET /identityProtection/riskyUsers
GET /identityProtection/riskyUsers?$filter=riskLevel eq 'high'
```

### Get Risky User
```http
GET /identityProtection/riskyUsers/{user-id}
```

### Dismiss User Risk
```http
POST /identityProtection/riskyUsers/dismiss
{
  "userIds": ["{user-id-1}", "{user-id-2}"]
}
```

### Confirm User Compromised
```http
POST /identityProtection/riskyUsers/confirmCompromised
{
  "userIds": ["{user-id}"]
}
```

### Get Risk History
```http
GET /identityProtection/riskyUsers/{user-id}/history
```

---

## Conditional Access

### List Policies
```http
GET /identity/conditionalAccess/policies
```

### Get Policy
```http
GET /identity/conditionalAccess/policies/{policy-id}
```

### Create Policy
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

### Update Policy
```http
PATCH /identity/conditionalAccess/policies/{policy-id}
{
  "state": "disabled"
}
```

**State values:** `enabled`, `disabled`, `enabledForReportingButNotEnforced`

### Delete Policy
```http
DELETE /identity/conditionalAccess/policies/{policy-id}
```

---

## Named Locations

### List Named Locations
```http
GET /identity/conditionalAccess/namedLocations
```

### Create IP Named Location
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

### Create Country Named Location
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

# Device Management (Intune)

## Managed Devices

### List Managed Devices
```http
GET /deviceManagement/managedDevices
```

### Get Managed Device
```http
GET /deviceManagement/managedDevices/{device-id}
```

### Get User's Managed Devices
```http
GET /users/{user-id}/managedDevices
```

### Filter Managed Devices
```http
# By operating system
GET /deviceManagement/managedDevices?$filter=operatingSystem eq 'iOS'

# Non-compliant devices
GET /deviceManagement/managedDevices?$filter=complianceState eq 'noncompliant'

# By management state
GET /deviceManagement/managedDevices?$filter=managementState eq 'managed'
```

### Remote Actions

#### Retire Device
```http
POST /deviceManagement/managedDevices/{device-id}/retire
```

Removes company data, keeps personal data.

#### Wipe Device
```http
POST /deviceManagement/managedDevices/{device-id}/wipe
{
  "keepEnrollmentData": false,
  "keepUserData": false
}
```

Factory resets the device.

#### Lock Device
```http
POST /deviceManagement/managedDevices/{device-id}/remoteLock
```

#### Reboot Device
```http
POST /deviceManagement/managedDevices/{device-id}/rebootNow
```

#### Sync Device
```http
POST /deviceManagement/managedDevices/{device-id}/syncDevice
```

#### Reset Passcode
```http
POST /deviceManagement/managedDevices/{device-id}/resetPasscode
```

#### Locate Device
```http
POST /deviceManagement/managedDevices/{device-id}/locateDevice
```

**Required Permissions:** `DeviceManagementManagedDevices.ReadWrite.All`

---

## Device Compliance

### List Compliance Policies
```http
GET /deviceManagement/deviceCompliancePolicies
```

### Get Compliance Policy
```http
GET /deviceManagement/deviceCompliancePolicies/{policy-id}
```

### Create Compliance Policy
```http
POST /deviceManagement/deviceCompliancePolicies
{
  "@odata.type": "#microsoft.graph.androidCompliancePolicy",
  "displayName": "Android Compliance",
  "passwordRequired": true,
  "passwordMinimumLength": 8,
  "deviceThreatProtectionEnabled": true,
  "deviceThreatProtectionRequiredSecurityLevel": "secured"
}
```

### Get Device Compliance Status
```http
GET /deviceManagement/managedDevices/{device-id}/deviceCompliancePolicyStates
```

---

# eDiscovery

## Cases

### List Cases
```http
GET /security/cases/ediscoveryCases
```

### Get Case
```http
GET /security/cases/ediscoveryCases/{case-id}
```

### Create Case
```http
POST /security/cases/ediscoveryCases
{
  "displayName": "Legal Investigation 2024",
  "description": "Investigation for case #12345"
}
```

### Close Case
```http
POST /security/cases/ediscoveryCases/{case-id}/close
```

---

## Custodians

### List Custodians
```http
GET /security/cases/ediscoveryCases/{case-id}/custodians
```

### Add Custodian
```http
POST /security/cases/ediscoveryCases/{case-id}/custodians
{
  "email": "custodian@example.com"
}
```

---

## Review Sets

### List Review Sets
```http
GET /security/cases/ediscoveryCases/{case-id}/reviewSets
```

### Create Review Set
```http
POST /security/cases/ediscoveryCases/{case-id}/reviewSets
{
  "displayName": "Review Set 1"
}
```

### Query Review Set
```http
POST /security/cases/ediscoveryCases/{case-id}/reviewSets/{reviewset-id}/queries
{
  "displayName": "Emails from 2024",
  "query": "received>=2024-01-01"
}
```

---

# Information Protection

## Sensitivity Labels

### List Labels
```http
GET /security/informationProtection/sensitivityLabels
```

### Get Label
```http
GET /security/informationProtection/sensitivityLabels/{label-id}
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

# Reporting

## Microsoft 365 Usage Reports

### Microsoft 365 Active Users
```http
GET /reports/getOffice365ActiveUserDetail(period='D7')
GET /reports/getOffice365ActiveUserDetail(period='D30')
GET /reports/getOffice365ActiveUserDetail(period='D90')
GET /reports/getOffice365ActiveUserDetail(period='D180')
```

**Periods:** `D7`, `D30`, `D90`, `D180`

---

## Email Activity Reports

### Email Activity User Detail
```http
GET /reports/getEmailActivityUserDetail(period='D7')
GET /reports/getEmailActivityUserDetail(date=2024-01-15)
```

### Email Activity Counts
```http
GET /reports/getEmailActivityCounts(period='D7')
```

### Email App Usage
```http
GET /reports/getEmailAppUsageUserDetail(period='D7')
GET /reports/getEmailAppUsageAppsUserCounts(period='D7')
```

---

## OneDrive Usage Reports

### OneDrive Activity
```http
GET /reports/getOneDriveActivityUserDetail(period='D7')
GET /reports/getOneDriveActivityFileCounts(period='D7')
GET /reports/getOneDriveActivityUserCounts(period='D7')
```

### OneDrive Usage
```http
GET /reports/getOneDriveUsageAccountDetail(period='D7')
GET /reports/getOneDriveUsageAccountCounts(period='D7')
GET /reports/getOneDriveUsageFileCounts(period='D7')
GET /reports/getOneDriveUsageStorage(period='D7')
```

---

## SharePoint Usage Reports

### SharePoint Activity
```http
GET /reports/getSharePointActivityUserDetail(period='D7')
GET /reports/getSharePointActivityFileCounts(period='D7')
GET /reports/getSharePointActivityPages(period='D7')
GET /reports/getSharePointActivityUserCounts(period='D7')
```

### SharePoint Site Usage
```http
GET /reports/getSharePointSiteUsageDetail(period='D7')
GET /reports/getSharePointSiteUsageFileCounts(period='D7')
GET /reports/getSharePointSiteUsageSiteCounts(period='D7')
GET /reports/getSharePointSiteUsageStorage(period='D7')
GET /reports/getSharePointSiteUsagePages(period='D7')
```

---

## Teams Usage Reports

### Teams User Activity
```http
GET /reports/getTeamsUserActivityUserDetail(period='D7')
GET /reports/getTeamsUserActivityCounts(period='D7')
GET /reports/getTeamsUserActivityUserCounts(period='D7')
```

### Teams Device Usage
```http
GET /reports/getTeamsDeviceUsageUserDetail(period='D7')
GET /reports/getTeamsDeviceUsageUserCounts(period='D7')
GET /reports/getTeamsDeviceUsageDistributionUserCounts(period='D7')
```

---

## Report Formats

Most reports support multiple formats:

### CSV Format
```http
GET /reports/getEmailActivityUserDetail(period='D7')?$format=text/csv
```

### JSON Format
```http
GET /reports/getEmailActivityUserDetail(period='D7')?$format=application/json
```

Default is CSV if format not specified.

---

## Report Permissions Reference

### Delegated Permissions
- `Reports.Read.All` - Read all usage reports

### Application Permissions
- `Reports.Read.All` - Read all usage reports

**Note:** Most reports require application permissions and work better with service accounts.

---

# Education

## Classes

### List Classes
```http
GET /education/classes
GET /education/me/classes
```

### Get Class
```http
GET /education/classes/{class-id}
```

### Create Class
```http
POST /education/classes
{
  "displayName": "Introduction to Computer Science",
  "description": "CS 101 - Fall 2024",
  "classCode": "CS101-F24",
  "externalName": "Computer Science 101",
  "externalId": "CS101",
  "externalSource": "sis",
  "mailNickname": "cs101-f24"
}
```

**Required Permissions:** `EduRoster.ReadWrite.All`

---

## Class Members

### List Class Members
```http
GET /education/classes/{class-id}/members
```

### List Teachers
```http
GET /education/classes/{class-id}/teachers
```

### List Students
```http
GET /education/classes/{class-id}/members?$filter=primaryRole eq 'student'
```

### Add Member
```http
POST /education/classes/{class-id}/members/$ref
{
  "@odata.id": "https://graph.microsoft.com/v1.0/education/users/{user-id}"
}
```

### Add Teacher
```http
POST /education/classes/{class-id}/teachers/$ref
{
  "@odata.id": "https://graph.microsoft.com/v1.0/education/users/{user-id}"
}
```

### Remove Member
```http
DELETE /education/classes/{class-id}/members/{user-id}/$ref
```

---

## Assignments

### List Class Assignments
```http
GET /education/classes/{class-id}/assignments
```

### Get Assignment
```http
GET /education/classes/{class-id}/assignments/{assignment-id}
```

### Create Assignment
```http
POST /education/classes/{class-id}/assignments
{
  "displayName": "Essay on Shakespeare",
  "instructions": {
    "content": "Write a 500-word essay on Hamlet",
    "contentType": "text"
  },
  "dueDateTime": "2024-01-31T23:59:00Z",
  "assignedDateTime": "2024-01-15T08:00:00Z",
  "status": "draft",
  "allowStudentsToAddResourcesToSubmission": true,
  "grading": {
    "@odata.type": "#microsoft.graph.educationAssignmentPointsGradeType",
    "maxPoints": 100
  }
}
```

**Status values:**
- `draft` - Not published
- `published` - Assigned to students
- `assigned` - Published (synonym)

### Publish Assignment
```http
POST /education/classes/{class-id}/assignments/{assignment-id}/publish
```

---

## Submissions

### List Submissions
```http
GET /education/classes/{class-id}/assignments/{assignment-id}/submissions
```

### Get Student's Submission
```http
GET /education/classes/{class-id}/assignments/{assignment-id}/submissions/{submission-id}
```

### Submit Assignment
```http
POST /education/classes/{class-id}/assignments/{assignment-id}/submissions/{submission-id}/submit
```

### Return Submission (Teacher)
```http
POST /education/classes/{class-id}/assignments/{assignment-id}/submissions/{submission-id}/return
```

### Grade Submission
```http
PATCH /education/classes/{class-id}/assignments/{assignment-id}/submissions/{submission-id}
{
  "grade": {
    "@odata.type": "#microsoft.graph.educationAssignmentPointsGrade",
    "points": 85
  }
}
```

---

## Permissions Reference

### Delegated Permissions
- `SecurityEvents.Read.All` - Read security events
- `SecurityEvents.ReadWrite.All` - Read and write security events
- `IdentityRiskEvent.Read.All` - Read identity risk events
- `Policy.Read.All` - Read policies
- `Policy.ReadWrite.ConditionalAccess` - Manage conditional access
- `DeviceManagementManagedDevices.Read.All` - Read managed devices
- `DeviceManagementManagedDevices.ReadWrite.All` - Manage devices
- `Reports.Read.All` - Read all reports
- `EduRoster.Read.All` - Read education rosters
- `EduRoster.ReadWrite.All` - Read and write rosters
- `EduAssignments.ReadWrite.All` - Read and write assignments

### Application Permissions
- `SecurityEvents.Read.All` - Read all security events
- `Reports.Read.All` - Read all reports
- Similar permissions available for education

---

## Common Patterns

### Monitor High Severity Alerts
```http
GET /security/alerts?$filter=severity eq 'high' and status eq 'newAlert'&$orderby=createdDateTime desc
```

### Track Secure Score Improvements
```http
GET /security/secureScores?$top=30&$orderby=createdDateTime desc
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

1. **Automate alert triage** - use filters and status updates
2. **Monitor secure score** regularly
3. **Enable risk-based policies** - automate responses to risky sign-ins
4. **Use PIM** for just-in-time admin access
5. **Require MFA** for privileged roles
6. **Regular access reviews** - quarterly for sensitive groups
7. **Monitor audit logs** for suspicious activity
8. **Block legacy authentication** via conditional access
9. **Require compliant devices** for corporate data
10. **Document policy changes** in audit trail
