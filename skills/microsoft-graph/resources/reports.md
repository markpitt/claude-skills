# Reports - Microsoft Graph API

This resource covers Microsoft 365 usage reports, activity reports, and analytics.

## Base Endpoint

`https://graph.microsoft.com/v1.0/reports`

## Microsoft 365 Usage Reports

### Microsoft 365 Active Users
```http
GET /reports/getOffice365ActiveUserDetail(period='D7')
GET /reports/getOffice365ActiveUserDetail(period='D30')
GET /reports/getOffice365ActiveUserDetail(period='D90')
GET /reports/getOffice365ActiveUserDetail(period='D180')
```

**Periods:** `D7`, `D30`, `D90`, `D180`

### Office 365 Activations
```http
GET /reports/getOffice365ActivationsUserDetail
GET /reports/getOffice365ActivationCounts
GET /reports/getOffice365ActivationsUserCounts
```

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

## Skype for Business Reports

### Activity Reports
```http
GET /reports/getSkypeForBusinessActivityUserDetail(period='D7')
GET /reports/getSkypeForBusinessActivityCounts(period='D7')
GET /reports/getSkypeForBusinessActivityUserCounts(period='D7')
```

### Device Usage
```http
GET /reports/getSkypeForBusinessDeviceUsageUserDetail(period='D7')
GET /reports/getSkypeForBusinessDeviceUsageUserCounts(period='D7')
```

### Participant Activity
```http
GET /reports/getSkypeForBusinessParticipantActivityCounts(period='D7')
GET /reports/getSkypeForBusinessParticipantActivityUserCounts(period='D7')
```

---

## Yammer Reports

### Activity Reports
```http
GET /reports/getYammerActivityUserDetail(period='D7')
GET /reports/getYammerActivityCounts(period='D7')
GET /reports/getYammerActivityUserCounts(period='D7')
```

### Device Usage
```http
GET /reports/getYammerDeviceUsageUserDetail(period='D7')
GET /reports/getYammerDeviceUsageDistributionUserCounts(period='D7')
GET /reports/getYammerDeviceUsageUserCounts(period='D7')
```

### Groups Activity
```http
GET /reports/getYammerGroupsActivityDetail(period='D7')
GET /reports/getYammerGroupsActivityGroupCounts(period='D7')
GET /reports/getYammerGroupsActivityCounts(period='D7')
```

---

## Microsoft Forms Reports

### Forms Activity
```http
GET /reports/getFormsUserActivityUserDetail(period='D7')
GET /reports/getFormsUserActivityCounts(period='D7')
GET /reports/getFormsUserActivityUserCounts(period='D7')
```

---

## Security & Compliance Reports

### DLP Reports (beta)
```http
GET /reports/getM365AppUserDetail(period='D7')
```

---

## Application Sign-in Reports

### Credential User Registration Details
```http
GET /reports/credentialUserRegistrationDetails
```

### Authentication Methods Usage
```http
GET /reports/authenticationMethods/userRegistrationDetails
```

---

## Azure AD Reports

### Sign-in Activity
```http
GET /auditLogs/signIns
GET /auditLogs/signIns?$top=10&$orderby=createdDateTime desc
```

### Directory Audit Logs
```http
GET /auditLogs/directoryAudits
```

### Provisioning Logs
```http
GET /auditLogs/provisioning
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

## Custom Period Reports

Some reports support specific dates instead of periods:

```http
GET /reports/getEmailActivityUserDetail(date=2024-01-15)
```

**Date format:** `YYYY-MM-DD`

---

## Permissions Reference

### Delegated Permissions
- `Reports.Read.All` - Read all usage reports

### Application Permissions
- `Reports.Read.All` - Read all usage reports

**Note:** Most reports require application permissions and work better with service accounts.

---

## Common Patterns

### Monthly Active Users Report
```http
GET /reports/getOffice365ActiveUserDetail(period='D30')
```

### Teams Adoption Metrics
```http
# User activity
GET /reports/getTeamsUserActivityUserDetail(period='D30')

# Device breakdown
GET /reports/getTeamsDeviceUsageDistributionUserCounts(period='D30')
```

### Email Usage Analysis
```http
# Activity details
GET /reports/getEmailActivityUserDetail(period='D30')

# App usage
GET /reports/getEmailAppUsageUserDetail(period='D30')
```

### Storage Usage Monitoring
```http
# OneDrive storage
GET /reports/getOneDriveUsageStorage(period='D30')

# SharePoint storage
GET /reports/getSharePointSiteUsageStorage(period='D30')
```

---

## Best Practices

1. **Use application permissions** for automated reporting
2. **Schedule regular exports** of reports
3. **Monitor license utilization** with active user reports
4. **Track adoption** with activity reports
5. **Use longest period** (D180) for trend analysis
6. **Export to CSV** for easier processing
7. **Combine multiple reports** for complete picture
8. **Monitor storage trends** to plan capacity
9. **Review security reports** regularly
10. **Automate report delivery** via email or storage

---

## Rate Limits

- Reports typically have lower rate limits than other endpoints
- Limit: 10 requests per 10 minutes per app
- Use caching for frequently accessed reports
- Schedule batch exports during off-peak hours

---

## Report Availability

- Reports are generally available within 48 hours
- Some reports update daily at midnight UTC
- Real-time data not available (use specific endpoints for real-time)
- Historical data retained varies by report type
