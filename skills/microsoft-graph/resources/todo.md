# Microsoft To Do - Microsoft Graph API

This resource covers Microsoft To Do for personal task management.

## Base Endpoint

`https://graph.microsoft.com/v1.0/me/todo`

## Task Lists

### List All Task Lists
```http
GET /me/todo/lists
```

### Get Task List
```http
GET /me/todo/lists/{list-id}
```

### Create Task List
```http
POST /me/todo/lists
{
  "displayName": "Shopping List"
}
```

### Update Task List
```http
PATCH /me/todo/lists/{list-id}
{
  "displayName": "Updated List Name"
}
```

### Delete Task List
```http
DELETE /me/todo/lists/{list-id}
```

**Required Permissions:** `Tasks.ReadWrite`

---

## Tasks

### List Tasks
```http
GET /me/todo/lists/{list-id}/tasks
GET /me/todo/lists/{list-id}/tasks?$filter=status ne 'completed'
```

### Get Task
```http
GET /me/todo/lists/{list-id}/tasks/{task-id}
```

### Create Task
```http
POST /me/todo/lists/{list-id}/tasks
{
  "title": "Buy groceries",
  "importance": "high",
  "dueDateTime": {
    "dateTime": "2024-01-20T00:00:00",
    "timeZone": "UTC"
  },
  "reminderDateTime": {
    "dateTime": "2024-01-20T09:00:00",
    "timeZone": "UTC"
  }
}
```

### Update Task
```http
PATCH /me/todo/lists/{list-id}/tasks/{task-id}
{
  "title": "Updated task title",
  "status": "inProgress"
}
```

### Complete Task
```http
PATCH /me/todo/lists/{list-id}/tasks/{task-id}
{
  "status": "completed",
  "completedDateTime": {
    "dateTime": "2024-01-15T14:30:00",
    "timeZone": "UTC"
  }
}
```

### Delete Task
```http
DELETE /me/todo/lists/{list-id}/tasks/{task-id}
```

---

## Task Properties

### Core Properties
- `title` - Task title (required)
- `status` - `notStarted`, `inProgress`, `completed`, `waitingOnOthers`, `deferred`
- `importance` - `low`, `normal`, `high`
- `isReminderOn` - Boolean for reminder
- `reminderDateTime` - Reminder date/time
- `dueDateTime` - Due date/time
- `completedDateTime` - Completion date/time
- `createdDateTime` - Creation date/time (read-only)
- `lastModifiedDateTime` - Last modified date/time (read-only)

### Body
```http
PATCH /me/todo/lists/{list-id}/tasks/{task-id}
{
  "body": {
    "content": "Task description with details",
    "contentType": "text"
  }
}
```

**contentType:** `text` or `html`

---

## Linked Resources

### List Linked Resources
```http
GET /me/todo/lists/{list-id}/tasks/{task-id}/linkedResources
```

### Add Linked Resource
```http
POST /me/todo/lists/{list-id}/tasks/{task-id}/linkedResources
{
  "webUrl": "https://contoso.sharepoint.com/document.pdf",
  "applicationName": "SharePoint",
  "displayName": "Project Document"
}
```

Linked resources connect tasks to emails, files, or web pages.

### Delete Linked Resource
```http
DELETE /me/todo/lists/{list-id}/tasks/{task-id}/linkedResources/{resource-id}
```

---

## Checklist Items

### List Checklist Items
```http
GET /me/todo/lists/{list-id}/tasks/{task-id}/checklistItems
```

### Add Checklist Item
```http
POST /me/todo/lists/{list-id}/tasks/{task-id}/checklistItems
{
  "displayName": "Subtask 1",
  "isChecked": false
}
```

### Update Checklist Item
```http
PATCH /me/todo/lists/{list-id}/tasks/{task-id}/checklistItems/{item-id}
{
  "isChecked": true
}
```

### Delete Checklist Item
```http
DELETE /me/todo/lists/{list-id}/tasks/{task-id}/checklistItems/{item-id}
```

---

## Attachments

### List Attachments
```http
GET /me/todo/lists/{list-id}/tasks/{task-id}/attachments
```

### Add Attachment
```http
POST /me/todo/lists/{list-id}/tasks/{task-id}/attachments
{
  "@odata.type": "#microsoft.graph.taskFileAttachment",
  "name": "document.pdf",
  "contentBytes": "BASE64_ENCODED_CONTENT"
}
```

---

## Filtering and Querying

### Filter by Status
```http
GET /me/todo/lists/{list-id}/tasks?$filter=status eq 'notStarted'
GET /me/todo/lists/{list-id}/tasks?$filter=status ne 'completed'
```

### Filter by Importance
```http
GET /me/todo/lists/{list-id}/tasks?$filter=importance eq 'high'
```

### Filter by Due Date
```http
GET /me/todo/lists/{list-id}/tasks?$filter=dueDateTime/dateTime le '2024-01-31T23:59:59Z'
```

### Order Tasks
```http
GET /me/todo/lists/{list-id}/tasks?$orderby=dueDateTime/dateTime
GET /me/todo/lists/{list-id}/tasks?$orderby=importance desc
```

---

## Extensions

### Create Extended Property
```http
POST /me/todo/lists/{list-id}/tasks
{
  "title": "Task with custom data",
  "singleValueExtendedProperties": [
    {
      "id": "String {guid} Name customProperty",
      "value": "Custom value"
    }
  ]
}
```

---

## Permissions Reference

### Delegated Permissions
- `Tasks.Read` - Read user's tasks
- `Tasks.ReadWrite` - Read and write user's tasks

### Application Permissions
Not supported for To Do API.

---

## Common Patterns

### Create Task with Full Details
```http
POST /me/todo/lists/{list-id}/tasks
{
  "title": "Complete project proposal",
  "body": {
    "content": "Draft and finalize Q1 project proposal",
    "contentType": "text"
  },
  "importance": "high",
  "status": "notStarted",
  "dueDateTime": {
    "dateTime": "2024-01-31T17:00:00",
    "timeZone": "Pacific Standard Time"
  },
  "reminderDateTime": {
    "dateTime": "2024-01-31T09:00:00",
    "timeZone": "Pacific Standard Time"
  },
  "isReminderOn": true
}
```

### Get Today's Tasks
```http
GET /me/todo/lists/{list-id}/tasks?$filter=dueDateTime/dateTime ge '{today-start}' and dueDateTime/dateTime le '{today-end}'
```

### Get Overdue Tasks
```http
GET /me/todo/lists/{list-id}/tasks?$filter=dueDateTime/dateTime lt '{now}' and status ne 'completed'
```

### Task with Checklist
```http
# 1. Create task
POST /me/todo/lists/{list-id}/tasks
{
  "title": "Prepare presentation"
}

# 2. Add checklist items
POST /me/todo/lists/{list-id}/tasks/{task-id}/checklistItems
{
  "displayName": "Create slides"
}

POST /me/todo/lists/{list-id}/tasks/{task-id}/checklistItems
{
  "displayName": "Rehearse presentation"
}
```

---

## Well-known List Names

Microsoft To Do has some special lists:

- **Default list** - User's default task list
- **Flagged emails** - Tasks created from flagged emails

```http
GET /me/todo/lists?$filter=wellknownListName eq 'defaultList'
GET /me/todo/lists?$filter=wellknownListName eq 'flaggedEmails'
```

---

## Best Practices

1. **Use importance** to prioritize tasks
2. **Set reminders** for time-sensitive tasks
3. **Use checklist items** for multi-step tasks
4. **Link resources** to provide context
5. **Filter completed tasks** to focus on active work
6. **Set due dates** for better organization
7. **Use body** for detailed descriptions
8. **Create separate lists** for different projects
9. **Update status** as work progresses
10. **Regular cleanup** of completed tasks

---

## Differences from Planner

- **To Do** is for personal tasks
- **Planner** is for team/group tasks
- To Do supports linked resources
- Planner requires Microsoft 365 Groups
- To Do has simpler permission model
- Planner has buckets and plan-level organization

---

## Integration with Outlook

Tasks can be synchronized with Outlook:
- Flagged emails appear as tasks
- Tasks can have linked email resources
- Both share some common properties
