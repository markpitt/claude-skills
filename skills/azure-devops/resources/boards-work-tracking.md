# Azure Boards - Work Item Tracking

Azure Boards provides comprehensive work item management including tasks, bugs, user stories, and custom work item types. This resource covers work items, queries, iterations, and area/iteration paths.

## Work Items - Core Operations

Work items are the fundamental units of tracking in Azure DevOps (bugs, tasks, features, stories, etc.).

### Create Work Item
```http
POST /{organization}/{project}/_apis/wit/workitems/${type}?api-version=7.1
Content-Type: application/json-patch+json

[
  {
    "op": "add",
    "path": "/fields/System.Title",
    "value": "New bug report"
  },
  {
    "op": "add",
    "path": "/fields/System.Description",
    "value": "Detailed description"
  },
  {
    "op": "add",
    "path": "/fields/System.AssignedTo",
    "value": "user@example.com"
  },
  {
    "op": "add",
    "path": "/fields/Microsoft.VSTS.Common.Priority",
    "value": 1
  }
]
```

### Get Work Item
```http
GET /{organization}/{project}/_apis/wit/workitems/{id}?api-version=7.1
```

### Update Work Item
```http
PATCH /{organization}/{project}/_apis/wit/workitems/{id}?api-version=7.1
Content-Type: application/json-patch+json

[
  {
    "op": "replace",
    "path": "/fields/System.State",
    "value": "Active"
  },
  {
    "op": "replace",
    "path": "/fields/System.Title",
    "value": "Updated title"
  }
]
```

### Delete Work Item
```http
DELETE /{organization}/{project}/_apis/wit/workitems/{id}?api-version=7.1
```

### Batch Get Work Items
```http
GET /{organization}/_apis/wit/workitemsbatch?ids=1,2,3,4,5&api-version=7.1
```

## Work Item Queries

Run queries to find work items matching specific criteria using WIQL (Work Item Query Language).

### Run WIQL Query
```http
POST /{organization}/{project}/_apis/wit/wiql?api-version=7.1
Content-Type: application/json

{
  "query": "SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.WorkItemType] = 'Bug' AND [System.State] = 'Active'"
}
```

### Run Stored Query
```http
GET /{organization}/{project}/_apis/wit/wiql/{queryId}?api-version=7.1
```

### WIQL Query Examples

**Active bugs assigned to current user:**
```sql
SELECT [System.Id], [System.Title], [System.State]
FROM WorkItems
WHERE [System.WorkItemType] = 'Bug'
  AND [System.State] = 'Active'
  AND [System.AssignedTo] = @Me
ORDER BY [System.ChangedDate] DESC
```

**High-priority work in current sprint:**
```sql
SELECT [System.Id], [System.Title], [System.WorkItemType]
FROM WorkItems
WHERE [System.TeamProject] = @Project
  AND [System.Iteration] = @CurrentIteration
  AND [Microsoft.VSTS.Common.Priority] <= 1
ORDER BY [System.Priority] ASC
```

**Recently closed work items:**
```sql
SELECT [System.Id], [System.Title], [System.State], [System.ChangedDate]
FROM WorkItems
WHERE [System.State] = 'Closed'
  AND [System.ChangedDate] > @Today - 7
ORDER BY [System.ChangedDate] DESC
```

## Boards & Backlogs

Manage team boards, sprints/iterations, and capacity planning.

### Get Boards
```http
GET /{organization}/{project}/{team}/_apis/work/boards?api-version=7.1
```

### Get Backlog Items
```http
GET /{organization}/{project}/{team}/_apis/work/backlogs/{backlogId}/workItems?api-version=7.1
```

### Get Team Iterations
```http
GET /{organization}/{project}/{team}/_apis/work/teamsettings/iterations?api-version=7.1
```

### Get Iteration Capacity
Get team member capacity for an iteration:
```http
GET /{organization}/{project}/{team}/_apis/work/teamsettings/iterations/{iterationId}/capacities?api-version=7.1
```

### Update Iteration Capacity
```http
PATCH /{organization}/{project}/{team}/_apis/work/teamsettings/iterations/{iterationId}/capacities/{userId}?api-version=7.1
Content-Type: application/json

{
  "activities": [
    {
      "name": "Development",
      "capacityPerDay": 8.0
    }
  ]
}
```

## Work Item Types & Fields

Manage the schema of your work items.

### List Work Item Types
```http
GET /{organization}/{project}/_apis/wit/workitemtypes?api-version=7.1
```

### List All Fields
```http
GET /{organization}/{project}/_apis/wit/fields?api-version=7.1
```

### Get Specific Field
```http
GET /{organization}/{project}/_apis/wit/fields/{fieldNameOrRefName}?api-version=7.1
```

### Common System Fields
- `System.Id` - Work item ID
- `System.Title` - Title
- `System.Description` - Description
- `System.State` - Current state (New, Active, Resolved, Closed)
- `System.AssignedTo` - Assigned person
- `System.CreatedDate` - Creation date
- `System.ChangedDate` - Last modified date
- `System.WorkItemType` - Type (Bug, Task, Feature, Story)

### Common Custom Fields
- `Microsoft.VSTS.Common.Priority` - Priority (1-4)
- `Microsoft.VSTS.Common.Severity` - Severity
- `Microsoft.VSTS.Scheduling.Effort` - Story points
- `Microsoft.VSTS.Scheduling.RemainingWork` - Remaining hours

## Area & Iteration Paths

Organize work using area and iteration hierarchies.

### Get Areas
```http
GET /{organization}/{project}/_apis/wit/classificationnodes/areas?api-version=7.1
```

### Get Iterations
```http
GET /{organization}/{project}/_apis/wit/classificationnodes/iterations?api-version=7.1
```

### Create Area
```http
POST /{organization}/{project}/_apis/wit/classificationnodes/areas?api-version=7.1
Content-Type: application/json

{
  "name": "Backend",
  "structureGroup": "areas"
}
```

### Create Iteration
```http
POST /{organization}/{project}/_apis/wit/classificationnodes/iterations?api-version=7.1
Content-Type: application/json

{
  "name": "Sprint 1",
  "attributes": {
    "startDate": "2025-01-01T00:00:00Z",
    "finishDate": "2025-01-14T23:59:59Z"
  }
}
```

## JSON Patch Operations for Work Items

Work item updates use JSON Patch (RFC 6902) format:

### Available Operations
- `add` - Add or set a field value
- `remove` - Remove a field value
- `replace` - Replace field value
- `test` - Test a value (for concurrency)
- `copy` - Copy a value
- `move` - Move a value

### Example: Complete Work Item Update
```json
[
  {
    "op": "add",
    "path": "/fields/System.Title",
    "value": "New title"
  },
  {
    "op": "replace",
    "path": "/fields/System.State",
    "value": "Active"
  },
  {
    "op": "add",
    "path": "/fields/Microsoft.VSTS.Common.Priority",
    "value": 1
  },
  {
    "op": "add",
    "path": "/relations/-",
    "value": {
      "rel": "System.LinkTypes.Hierarchy-Reverse",
      "url": "https://dev.azure.com/{org}/_apis/wit/workItems/123"
    }
  }
]
```

## Best Practices

### Work Item Management
1. Use meaningful titles and descriptions
2. Assign work items promptly
3. Keep state transitions consistent
4. Link related work items
5. Use iterations/sprints for planning
6. Estimate effort when needed
7. Regularly review and close completed work

### Query Performance
1. Use specific field selections
2. Filter by date ranges for historical queries
3. Avoid querying across all projects unnecessarily
4. Cache query results when possible
5. Use pagination for large result sets

### Field Naming Conventions
- Use consistent field naming
- Document custom field purposes
- Use standard system fields where applicable
- Minimize custom field proliferation
