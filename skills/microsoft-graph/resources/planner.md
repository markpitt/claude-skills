# Planner - Microsoft Graph API

This resource covers Microsoft Planner for task and project management.

## Base Endpoint

`https://graph.microsoft.com/v1.0/planner`

## Plans

### Get Plan
```http
GET /planner/plans/{plan-id}
```

### List Group Plans
```http
GET /groups/{group-id}/planner/plans
```

### Create Plan
```http
POST /planner/plans
{
  "owner": "{group-id}",
  "title": "Project Plan"
}
```

**Required Permissions:** `Group.ReadWrite.All`

### Update Plan
```http
PATCH /planner/plans/{plan-id}
{
  "title": "Updated Plan Name"
}
```

**Note:** Requires `If-Match` header with etag value

### Delete Plan
```http
DELETE /planner/plans/{plan-id}
```

---

## Buckets

### List Plan Buckets
```http
GET /planner/plans/{plan-id}/buckets
```

### Get Bucket
```http
GET /planner/buckets/{bucket-id}
```

### Create Bucket
```http
POST /planner/buckets
{
  "name": "To Do",
  "planId": "{plan-id}",
  "orderHint": " !"
}
```

### Update Bucket
```http
PATCH /planner/buckets/{bucket-id}
{
  "name": "In Progress"
}
```

### Delete Bucket
```http
DELETE /planner/buckets/{bucket-id}
```

---

## Tasks

### List Plan Tasks
```http
GET /planner/plans/{plan-id}/tasks
```

### List Bucket Tasks
```http
GET /planner/buckets/{bucket-id}/tasks
```

### Get User Tasks
```http
GET /me/planner/tasks
GET /users/{user-id}/planner/tasks
```

### Get Task
```http
GET /planner/tasks/{task-id}
```

### Create Task
```http
POST /planner/tasks
{
  "planId": "{plan-id}",
  "bucketId": "{bucket-id}",
  "title": "Implement new feature",
  "assignments": {
    "{user-id}": {
      "@odata.type": "#microsoft.graph.plannerAssignment",
      "orderHint": " !"
    }
  },
  "dueDateTime": "2024-01-31T00:00:00Z"
}
```

### Update Task
```http
PATCH /planner/tasks/{task-id}
{
  "title": "Updated task title",
  "percentComplete": 50
}
```

### Complete Task
```http
PATCH /planner/tasks/{task-id}
{
  "percentComplete": 100
}
```

### Delete Task
```http
DELETE /planner/tasks/{task-id}
```

---

## Task Details

### Get Task Details
```http
GET /planner/tasks/{task-id}/details
```

### Update Task Details
```http
PATCH /planner/tasks/{task-id}/details
{
  "description": "Detailed task description",
  "checklist": {
    "checklist-item-1": {
      "@odata.type": "#microsoft.graph.plannerChecklistItem",
      "title": "Subtask 1",
      "isChecked": false
    }
  }
}
```

**Task details include:**
- `description` - Task description (supports HTML)
- `checklist` - Subtasks/checklist items
- `references` - Links/attachments
- `previewType` - Preview type (automatic, checklist, description)

---

## Assignments

### Assign Task
```http
PATCH /planner/tasks/{task-id}
{
  "assignments": {
    "{user-id}": {
      "@odata.type": "#microsoft.graph.plannerAssignment",
      "orderHint": " !"
    }
  }
}
```

### Unassign Task
```http
PATCH /planner/tasks/{task-id}
{
  "assignments": {
    "{user-id}": null
  }
}
```

---

## Categories (Labels)

### Update Task Categories
```http
PATCH /planner/tasks/{task-id}
{
  "appliedCategories": {
    "category1": true,
    "category2": true
  }
}
```

**Available categories:** `category1` through `category25`

### Configure Category Names
```http
PATCH /planner/plans/{plan-id}/details
{
  "categoryDescriptions": {
    "category1": "High Priority",
    "category2": "Bug",
    "category3": "Feature"
  }
}
```

---

## Progress Tracking

### Task Properties
- `percentComplete` - 0, 25, 50, 75, 100
- `startDateTime` - Start date/time
- `dueDateTime` - Due date/time
- `completedDateTime` - Completion date/time (read-only)

### Priority
```http
PATCH /planner/tasks/{task-id}
{
  "priority": 5
}
```

**Priority values:** 0-10 (0 = Urgent, 5 = Important, 10 = Low)

---

## Ordering

Planner uses `orderHint` for custom ordering:

```http
PATCH /planner/tasks/{task-id}
{
  "orderHint": " !"
}
```

To place between two items, use hints from both:
```http
{
  "orderHint": "{previous-hint} {next-hint}!"
}
```

---

## Plan Details

### Get Plan Details
```http
GET /planner/plans/{plan-id}/details
```

### Update Plan Details
```http
PATCH /planner/plans/{plan-id}/details
{
  "sharedWith": {
    "{user-id}": true
  },
  "categoryDescriptions": {
    "category1": "Priority Level 1"
  }
}
```

---

## Permissions Reference

### Delegated Permissions
- `Tasks.Read` - Read user's tasks
- `Tasks.ReadWrite` - Read and write user's tasks
- `Group.Read.All` - Read all groups (required for plans)
- `Group.ReadWrite.All` - Read and write all groups

### Application Permissions
Not supported for Planner API.

---

## Common Patterns

### Create Complete Project
```http
# 1. Create plan (requires group)
POST /planner/plans
{
  "owner": "{group-id}",
  "title": "Q1 Project"
}

# 2. Create buckets
POST /planner/buckets
{
  "name": "Backlog",
  "planId": "{plan-id}"
}

# 3. Create tasks
POST /planner/tasks
{
  "planId": "{plan-id}",
  "bucketId": "{bucket-id}",
  "title": "Task 1"
}

# 4. Assign tasks
PATCH /planner/tasks/{task-id}
{
  "assignments": {"{user-id}": {...}}
}
```

### Get My Incomplete Tasks
```http
GET /me/planner/tasks?$filter=percentComplete lt 100&$orderby=dueDateTime
```

### Move Task to Different Bucket
```http
PATCH /planner/tasks/{task-id}
{
  "bucketId": "{new-bucket-id}"
}
```

---

## Best Practices

1. **Always include If-Match header** with etag for updates
2. **Use group-based plans** (Planner requires Microsoft 365 Group)
3. **Order tasks** using orderHint
4. **Set due dates** for better tracking
5. **Use categories** for visual organization
6. **Add checklist items** for subtasks
7. **Include task descriptions** for clarity
8. **Use priority field** for importance
9. **Assign tasks** to specific users
10. **Track progress** with percentComplete

---

## Important Notes

- **ETag requirement:** All PATCH/DELETE operations require `If-Match` header
- **Group dependency:** Plans must be owned by Microsoft 365 Group
- **No application permissions:** Only delegated permissions supported
- **Limited queries:** $filter and $orderby support is limited
- **Task limits:** Maximum 50 tasks can be assigned to a single user per plan

---

## Example: Complete Update with ETag

```http
# 1. Get current task to retrieve etag
GET /planner/tasks/{task-id}

# Response includes: "@odata.etag": "{etag-value}"

# 2. Update with etag
PATCH /planner/tasks/{task-id}
If-Match: {etag-value}
{
  "title": "Updated Title"
}
```
