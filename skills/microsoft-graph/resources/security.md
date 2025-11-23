# Security & Compliance - Microsoft Graph API

This resource covers security alerts, threat intelligence, secure score, eDiscovery, and compliance endpoints.

## Base Endpoints

- Security: `https://graph.microsoft.com/v1.0/security`
- Alerts: `https://graph.microsoft.com/v1.0/security/alerts`
- Secure Score: `https://graph.microsoft.com/v1.0/security/secureScores`

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

## Threat Intelligence

### Threat Indicators

#### List Indicators
```http
GET /security/tiIndicators
```

#### Get Indicator
```http
GET /security/tiIndicators/{indicator-id}
```

#### Create Indicator
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

#### Update Indicator
```http
PATCH /security/tiIndicators/{id}
{
  "confidence": 90,
  "description": "Updated description"
}
```

#### Delete Indicators
```http
POST /security/tiIndicators/deleteTiIndicators
{
  "value": ["{indicator-id-1}", "{indicator-id-2}"]
}
```

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

## Attack Simulation

### List Simulations
```http
GET /security/attackSimulation/simulations
```

### Get Simulation
```http
GET /security/attackSimulation/simulations/{simulation-id}
```

### Create Simulation
```http
POST /security/attackSimulation/simulations
{
  "displayName": "Phishing Test Campaign",
  "payload": {...},
  "launchDateTime": "2024-01-20T09:00:00Z"
}
```

---

## eDiscovery

### Cases

#### List Cases
```http
GET /security/cases/ediscoveryCases
```

#### Get Case
```http
GET /security/cases/ediscoveryCases/{case-id}
```

#### Create Case
```http
POST /security/cases/ediscoveryCases
{
  "displayName": "Legal Investigation 2024",
  "description": "Investigation for case #12345"
}
```

#### Close Case
```http
POST /security/cases/ediscoveryCases/{case-id}/close
```

### Custodians

#### List Custodians
```http
GET /security/cases/ediscoveryCases/{case-id}/custodians
```

#### Add Custodian
```http
POST /security/cases/ediscoveryCases/{case-id}/custodians
{
  "email": "custodian@example.com"
}
```

### Review Sets

#### List Review Sets
```http
GET /security/cases/ediscoveryCases/{case-id}/reviewSets
```

#### Create Review Set
```http
POST /security/cases/ediscoveryCases/{case-id}/reviewSets
{
  "displayName": "Review Set 1"
}
```

#### Query Review Set
```http
POST /security/cases/ediscoveryCases/{case-id}/reviewSets/{reviewset-id}/queries
{
  "displayName": "Emails from 2024",
  "query": "received>=2024-01-01"
}
```

---

## Advanced Hunting (Defender)

### Run Query
```http
POST /security/runHuntingQuery
{
  "query": "DeviceProcessEvents | where Timestamp > ago(7d) | limit 100"
}
```

**Required Permissions:** `ThreatHunting.Read.All`

---

## Information Protection

### Sensitivity Labels

#### List Labels
```http
GET /security/informationProtection/sensitivityLabels
```

#### Get Label
```http
GET /security/informationProtection/sensitivityLabels/{label-id}
```

### Label Policies

#### List Policies
```http
GET /security/informationProtection/labelPolicies
```

### Extract Label
```http
POST /security/informationProtection/policy/labels/extractLabel
{
  "contentInfo": {
    "format": "default",
    "identifier": null,
    "metadata": [],
    "state": "rest"
  }
}
```

### Evaluate Label
```http
POST /security/informationProtection/policy/labels/evaluateApplication
{
  "contentInfo": {...},
  "labelingOptions": {...}
}
```

---

## Data Loss Prevention (DLP)

### DLP Policies

#### List Policies
```http
GET /security/informationProtection/dlpPolicies
```

### DLP Events

#### List Events
```http
GET /security/dataLossPrevention/events
```

---

## Cloud App Security

### Alerts

#### List Cloud App Security Alerts
```http
GET /security/alerts?$filter=vendorInformation/provider eq 'MCAS'
```

---

## Identity Protection

### Risk Detections

#### List Risk Detections
```http
GET /identityProtection/riskDetections
```

#### Get Risk Detection
```http
GET /identityProtection/riskDetections/{detection-id}
```

### Risky Users

#### List Risky Users
```http
GET /identityProtection/riskyUsers
```

#### Get Risky User
```http
GET /identityProtection/riskyUsers/{user-id}
```

#### Dismiss Risk
```http
POST /identityProtection/riskyUsers/dismiss
{
  "userIds": ["{user-id}"]
}
```

#### Confirm Compromised
```http
POST /identityProtection/riskyUsers/confirmCompromised
{
  "userIds": ["{user-id}"]
}
```

### Risk History

#### Get User Risk History
```http
GET /identityProtection/riskyUsers/{user-id}/history
```

---

## Defender for Endpoint

### Machines

#### List Machines
```http
GET /security/microsoft.graph.security.runHuntingQuery
```

Use Advanced Hunting queries for detailed machine information.

---

## Permissions Reference

### Delegated Permissions
- `SecurityEvents.Read.All` - Read security events
- `SecurityEvents.ReadWrite.All` - Read and write security events
- `ThreatIndicators.Read.All` - Read threat indicators
- `ThreatIndicators.ReadWrite.OwnedBy` - Manage owned threat indicators
- `ThreatHunting.Read.All` - Run hunting queries
- `eDiscovery.Read.All` - Read eDiscovery data
- `eDiscovery.ReadWrite.All` - Read and write eDiscovery data

### Application Permissions
- `SecurityEvents.Read.All` - Read all security events
- `SecurityEvents.ReadWrite.All` - Read and write all security events
- `ThreatIndicators.ReadWrite.OwnedBy` - Manage owned threat indicators
- `ThreatHunting.Read.All` - Run hunting queries

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

### Investigate User Risk
```http
# 1. Get risky users
GET /identityProtection/riskyUsers?$filter=riskLevel eq 'high'

# 2. Get risk detection details
GET /identityProtection/riskyUsers/{user-id}/history

# 3. Take action (dismiss or confirm)
POST /identityProtection/riskyUsers/dismiss
```

---

## Best Practices

1. **Automate alert triage** - use filters and status updates
2. **Monitor secure score** regularly
3. **Implement SOAR** (Security Orchestration) with webhooks
4. **Use threat indicators** for proactive blocking
5. **Regular eDiscovery** policy reviews
6. **Correlate alerts** across products
7. **Document investigations** in alert comments
8. **Set up change notifications** for real-time alerts
9. **Use advanced hunting** for threat hunting
10. **Review risky users** daily
