# Azure DevOps Advanced Integrations

Covers extensions, webhooks, service hooks, notifications, wiki, search, dashboards, and audit capabilities.

## Service Hooks (Event Subscriptions)

Integrate Azure DevOps with external systems via webhooks.

### List Subscriptions
```http
GET /{organization}/_apis/hooks/subscriptions?api-version=7.1
```

### Get Subscription
```http
GET /{organization}/_apis/hooks/subscriptions/{subscriptionId}?api-version=7.1
```

### Create Subscription
```http
POST /{organization}/_apis/hooks/subscriptions?api-version=7.1
Content-Type: application/json

{
  "publisherId": "tfs",
  "eventType": "git.push",
  "resourceVersion": "1.0",
  "consumerId": "webHooks",
  "consumerActionId": "httpRequest",
  "publisherInputs": {
    "projectId": "{projectId}"
  },
  "consumerInputs": {
    "url": "https://example.com/webhook",
    "httpHeaders": "Authorization:Bearer token",
    "resourceDetailsToSend": "all",
    "detailedMessagesToSend": "all",
    "messagesToSend": "all",
    "basicAuthenticationUsername": "",
    "basicAuthenticationPassword": ""
  }
}
```

### Update Subscription
```http
PATCH /{organization}/_apis/hooks/subscriptions/{subscriptionId}?api-version=7.1
Content-Type: application/json

{
  "status": "enabled"
}
```

### Delete Subscription
```http
DELETE /{organization}/_apis/hooks/subscriptions/{subscriptionId}?api-version=7.1
```

### Common Event Types
- `git.push` - Code pushed to repository
- `git.pullrequest.created` - Pull request created
- `git.pullrequest.updated` - Pull request updated
- `git.pullrequest.merged` - Pull request merged
- `workitem.created` - Work item created
- `workitem.updated` - Work item updated
- `workitem.commented` - Comment added to work item
- `build.complete` - Build completed
- `release.deployment.completion` - Release deployment completed

## Notifications

Create notification subscriptions for user notifications.

### List Subscriptions
```http
GET /{organization}/_apis/notification/subscriptions?api-version=7.1
```

### Get Subscription
```http
GET /{organization}/_apis/notification/subscriptions/{subscriptionId}?api-version=7.1
```

### Create Subscription
```http
POST /{organization}/_apis/notification/subscriptions?api-version=7.1
Content-Type: application/json

{
  "description": "Notify on build failure",
  "filter": {
    "type": "event",
    "criteria": [
      {
        "filterType": "eventType",
        "criteria": "build.complete"
      },
      {
        "filterType": "status",
        "criteria": "failed"
      }
    ]
  },
  "channel": {
    "type": "email"
  },
  "scope": {
    "type": "project",
    "id": "{projectId}"
  }
}
```

## Extensions

Manage installed and available extensions.

### List Installed Extensions
```http
GET /{organization}/_apis/extensionmanagement/installedextensions?api-version=7.1
```

### Get Installed Extension
```http
GET /{organization}/_apis/extensionmanagement/installedextensions/{publisherName}/{extensionName}?api-version=7.1
```

### Install Extension
```http
POST /{organization}/_apis/extensionmanagement/installedextensions?api-version=7.1
Content-Type: application/json

{
  "publisherName": "ms-devlabs",
  "extensionName": "devops-community-extension"
}
```

### Uninstall Extension
```http
DELETE /{organization}/_apis/extensionmanagement/installedextensions/{publisherName}/{extensionName}?api-version=7.1
```

## Wiki

Create and manage project wikis and documentation.

### List Wikis
```http
GET /{organization}/{project}/_apis/wiki/wikis?api-version=7.1
```

### Get Wiki
```http
GET /{organization}/{project}/_apis/wiki/wikis/{wikiId}?api-version=7.1
```

### Create Wiki
```http
POST /{organization}/{project}/_apis/wiki/wikis?api-version=7.1
Content-Type: application/json

{
  "name": "Project Wiki",
  "type": "projectWiki",
  "mappedPath": "/"
}
```

### Get Wiki Page
```http
GET /{organization}/{project}/_apis/wiki/wikis/{wikiId}/pages?path=/Home&api-version=7.1
```

### Create/Update Wiki Page
```http
PUT /{organization}/{project}/_apis/wiki/wikis/{wikiId}/pages?path=/My-Page&api-version=7.1
Content-Type: application/json

{
  "content": "# Page Title\n\nPage content in markdown"
}
```

## Search

Search across work items, code, and wiki.

### Search Work Items
```http
POST /{organization}/{project}/_apis/search/workitemsearchresults?api-version=7.1
Content-Type: application/json

{
  "searchText": "bug",
  "$skip": 0,
  "$top": 50,
  "filters": {
    "type": ["Bug"],
    "state": ["Active"]
  }
}
```

### Search Code
```http
POST /{organization}/{project}/_apis/search/codesearchresults?api-version=7.1
Content-Type: application/json

{
  "searchText": "function handleClick",
  "$skip": 0,
  "$top": 50,
  "filters": {
    "repository": ["{repositoryId}"],
    "branch": ["main"]
  }
}
```

### Search Wiki
```http
POST /{organization}/{project}/_apis/search/wikisearchresults?api-version=7.1
Content-Type: application/json

{
  "searchText": "architecture",
  "$skip": 0,
  "$top": 50
}
```

## Dashboards

Create and manage team dashboards.

### List Dashboards
```http
GET /{organization}/{project}/{team}/_apis/dashboard/dashboards?api-version=7.1
```

### Get Dashboard
```http
GET /{organization}/{project}/{team}/_apis/dashboard/dashboards/{dashboardId}?api-version=7.1
```

### Create Dashboard
```http
POST /{organization}/{project}/{team}/_apis/dashboard/dashboards?api-version=7.1
Content-Type: application/json

{
  "name": "Project Overview",
  "description": "Main project metrics dashboard"
}
```

### Update Dashboard
```http
PUT /{organization}/{project}/{team}/_apis/dashboard/dashboards/{dashboardId}?api-version=7.1
Content-Type: application/json

{
  "name": "Updated Dashboard Name",
  "description": "Updated description"
}
```

## Widgets

Add and manage widgets on dashboards.

### List Widgets
```http
GET /{organization}/{project}/{team}/_apis/dashboard/dashboards/{dashboardId}/widgets?api-version=7.1
```

### Create Widget
```http
POST /{organization}/{project}/{team}/_apis/dashboard/dashboards/{dashboardId}/widgets?api-version=7.1
Content-Type: application/json

{
  "name": "New Work Item",
  "description": "Create new work item",
  "contributionId": "ms.vss-dashboards-web.Microsoft.VisualStudioOnline.Dashboards.NewWorkItem",
  "position": {
    "row": 1,
    "column": 1
  },
  "size": {
    "rowSpan": 1,
    "columnSpan": 1
  },
  "settings": {}
}
```

## Audit

Query organization audit logs.

### Query Audit Log
```http
GET /{organization}/_apis/audit/auditlog?api-version=7.1-preview.1
```

Query options:
- `?startTime=2025-01-01T00:00:00Z` - Start date
- `?endTime=2025-01-31T23:59:59Z` - End date
- `?skipCount=0&top=100` - Pagination
- `?activityIds=ProjectCollectionAdministrators.Update` - Filter by activity

### Download Audit Log
```http
GET /{organization}/_apis/audit/downloadlog?format=json&startTime=2025-01-01T00:00:00Z&endTime=2025-01-31T23:59:59Z&api-version=7.1-preview.1
```

Formats: `json`, `csv`

## Best Practices

### Service Hooks Integration
1. Use service hooks for event-driven integrations
2. Validate webhook signatures
3. Implement retry logic
4. Log webhook events
5. Monitor webhook failures
6. Keep webhook handlers idempotent
7. Avoid blocking operations in webhooks
8. Test webhook integrations thoroughly

### Notification Management
1. Use group notifications
2. Avoid notification overload
3. Create targeted subscriptions
4. Set up digest notifications
5. Test notification delivery
6. Document notification purposes
7. Review and clean up old subscriptions

### Extension Development
1. Choose extensions from verified publishers
2. Review extension permissions
3. Keep extensions updated
4. Monitor extension usage
5. Remove unused extensions
6. Test extensions in non-prod first
7. Document custom extensions

### Wiki Documentation
1. Keep wiki synchronized with code
2. Use clear page hierarchies
3. Include examples in documentation
4. Link to relevant resources
5. Maintain version history
6. Archive outdated pages
7. Use templates for consistency

### Search Optimization
1. Index code regularly
2. Keep search indexes updated
3. Use filters for better results
4. Document important code locations
5. Tag important artifacts
6. Review search performance
7. Archive old indexes

### Dashboard Usage
1. Create focused dashboards
2. Limit widgets per dashboard
3. Use meaningful widget titles
4. Refresh dashboards regularly
5. Share dashboards with stakeholders
6. Archive unused dashboards
7. Document dashboard purposes

### Audit & Compliance
1. Review audit logs regularly
2. Archive audit logs for retention
3. Monitor sensitive operations
4. Document audit policies
5. Implement alerts for risky activities
6. Use audit logs for compliance
7. Report on audit findings
