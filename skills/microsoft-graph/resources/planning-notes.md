# Planning & Tasks - Microsoft Graph API

This resource covers task management across Microsoft 365: Planner (team planning), To Do (personal tasks), and OneNote (note taking).

## Base Endpoints

- Planner: `https://graph.microsoft.com/v1.0/planner`
- To Do: `https://graph.microsoft.com/v1.0/me/todo`
- OneNote: `https://graph.microsoft.com/v1.0/me/onenote`

---

# Microsoft Planner - Team Task Management

Planner is for collaborative team-based project planning backed by Microsoft 365 Groups.

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

## Buckets (Stages/Categories)

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

## Planner Tasks

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
- `description` - Task description (HTML support)
- `checklist` - Subtasks/checklist items
- `references` - Links/attachments
- `previewType` - Preview type (automatic, checklist, description)

---

## Planner Task Assignments

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

## Planner Categories & Priority

### Update Task Categories (Labels)
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

### Set Task Priority
```http
PATCH /planner/tasks/{task-id}
{
  "priority": 5
}
```

**Priority values:** 0-10 (0 = Urgent, 5 = Important, 10 = Low)

---

## Planner Progress & Dates

### Task Properties
- `percentComplete` - 0, 25, 50, 75, 100
- `startDateTime` - Start date/time
- `dueDateTime` - Due date/time
- `completedDateTime` - Completion date/time (read-only)

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

## Planner Ordering

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

## Planner Best Practices

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

# Microsoft To Do - Personal Task Management

To Do is for personal task lists (non-collaborative).

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

## To Do Tasks

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

## To Do Task Properties

### Core Properties
- `title` - Task title (required)
- `status` - `notStarted`, `inProgress`, `completed`, `waitingOnOthers`, `deferred`
- `importance` - `low`, `normal`, `high`
- `isReminderOn` - Boolean for reminder
- `reminderDateTime` - Reminder date/time
- `dueDateTime` - Due date/time
- `completedDateTime` - Completion date/time (read-only)
- `createdDateTime` - Creation date/time (read-only)
- `lastModifiedDateTime` - Last modified date/time (read-only)

### Task Body
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

## To Do Checklist Items

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

## To Do Linked Resources

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

## To Do Filtering & Querying

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

### Get Today's Tasks
```http
GET /me/todo/lists/{list-id}/tasks?$filter=dueDateTime/dateTime ge '{today-start}' and dueDateTime/dateTime le '{today-end}'
```

### Get Overdue Tasks
```http
GET /me/todo/lists/{list-id}/tasks?$filter=dueDateTime/dateTime lt '{now}' and status ne 'completed'
```

---

## To Do Best Practices

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

# Microsoft OneNote - Note Taking

OneNote is for creating and organizing digital notes with text, images, and tables.

## Notebooks

### List Notebooks
```http
GET /me/onenote/notebooks
GET /users/{user-id}/onenote/notebooks
GET /groups/{group-id}/onenote/notebooks
GET /sites/{site-id}/onenote/notebooks
```

### Get Notebook
```http
GET /me/onenote/notebooks/{notebook-id}
```

### Create Notebook
```http
POST /me/onenote/notebooks
{
  "displayName": "Project Notes"
}
```

**Required Permissions:** `Notes.Create`, `Notes.ReadWrite`

---

## Sections

### List Sections
```http
GET /me/onenote/sections
GET /me/onenote/notebooks/{notebook-id}/sections
```

### Get Section
```http
GET /me/onenote/sections/{section-id}
```

### Create Section
```http
POST /me/onenote/notebooks/{notebook-id}/sections
{
  "displayName": "Meeting Notes"
}
```

### Section Groups

#### List Section Groups
```http
GET /me/onenote/sectionGroups
GET /me/onenote/notebooks/{notebook-id}/sectionGroups
```

#### Create Section Group
```http
POST /me/onenote/notebooks/{notebook-id}/sectionGroups
{
  "displayName": "Q1 2024"
}
```

---

## Pages

### List Pages
```http
GET /me/onenote/pages
GET /me/onenote/sections/{section-id}/pages
```

### Get Page
```http
GET /me/onenote/pages/{page-id}
```

### Get Page Content
```http
GET /me/onenote/pages/{page-id}/content
```

Returns HTML content of the page.

### Create Page

#### Simple Page
```http
POST /me/onenote/sections/{section-id}/pages
Content-Type: text/html

<!DOCTYPE html>
<html>
  <head>
    <title>Page Title</title>
  </head>
  <body>
    <h1>Meeting Notes - January 15, 2024</h1>
    <p>Attendees: John, Jane, Bob</p>
    <ul>
      <li>Discussed Q1 goals</li>
      <li>Reviewed project timeline</li>
    </ul>
  </body>
</html>
```

#### Page with Image
```http
POST /me/onenote/sections/{section-id}/pages
Content-Type: multipart/form-data; boundary=MyBoundary

--MyBoundary
Content-Disposition: form-data; name="Presentation"
Content-Type: text/html

<!DOCTYPE html>
<html>
  <head><title>Page with Image</title></head>
  <body>
    <h1>Screenshot</h1>
    <img src="name:image1" alt="Screenshot" />
  </body>
</html>

--MyBoundary
Content-Disposition: form-data; name="image1"
Content-Type: image/png

[Binary image data]

--MyBoundary--
```

### Update Page
```http
PATCH /me/onenote/pages/{page-id}/content
Content-Type: application/json

[
  {
    "target": "body",
    "action": "append",
    "content": "<p>New content added to page</p>"
  }
]
```

**Actions:**
- `append` - Add after target
- `insert` - Insert before target
- `replace` - Replace target
- `delete` - Delete target

### Copy Page to Section
```http
POST /me/onenote/pages/{page-id}/copyToSection
{
  "id": "{target-section-id}"
}
```

**Returns:** Operation location URL

---

## OneNote Search

### Search Pages
```http
GET /me/onenote/pages?$search=meeting notes
```

---

## Page Resources & Preview

### Get Page Preview
```http
GET /me/onenote/pages/{page-id}/preview
```

Returns text preview of page content.

### List Page Resources
```http
GET /me/onenote/pages/{page-id}/resources
```

Resources are embedded images and files.

### Get Resource
```http
GET /me/onenote/resources/{resource-id}
GET /me/onenote/resources/{resource-id}/content
```

---

## OneNote HTML Elements

OneNote pages support subset of HTML:

**Supported elements:**
- `<h1>` through `<h6>` - Headings
- `<p>` - Paragraphs
- `<ul>`, `<ol>`, `<li>` - Lists
- `<table>`, `<tr>`, `<td>` - Tables
- `<img>` - Images
- `<a>` - Links
- `<b>`, `<i>`, `<u>` - Text formatting
- `<br>` - Line breaks

**Special attributes:**
- `data-tag` - Tags (to-do, important, question, etc.)
- `data-id` - Element IDs for updates

### Example with Tags
```html
<p data-tag="to-do">Complete project proposal</p>
<p data-tag="important">Review budget before meeting</p>
<p data-tag="question">Who is leading the presentation?</p>
```

---

## OneNote Common Patterns

### Create Notebook with Sections and Pages
```http
# 1. Create notebook
POST /me/onenote/notebooks
{
  "displayName": "Project Notebook"
}

# 2. Create section
POST /me/onenote/notebooks/{notebook-id}/sections
{
  "displayName": "Meeting Notes"
}

# 3. Create pages
POST /me/onenote/sections/{section-id}/pages
Content-Type: text/html

<!DOCTYPE html>
<html>
  <head><title>First Meeting</title></head>
  <body>
    <h1>Kickoff Meeting</h1>
    <p>Notes here...</p>
  </body>
</html>
```

### Create To-Do List
```http
POST /me/onenote/sections/{section-id}/pages
Content-Type: text/html

<!DOCTYPE html>
<html>
  <head><title>Task List</title></head>
  <body>
    <h1>Weekly Tasks</h1>
    <p data-tag="to-do">Complete documentation</p>
    <p data-tag="to-do">Review pull requests</p>
    <p data-tag="to-do">Team standup meeting</p>
  </body>
</html>
```

### Append Content to Existing Page
```http
PATCH /me/onenote/pages/{page-id}/content
[
  {
    "target": "body",
    "action": "append",
    "content": "<h2>Follow-up Items</h2><ul><li>Item 1</li><li>Item 2</li></ul>"
  }
]
```

### Create Page with Table
```http
POST /me/onenote/sections/{section-id}/pages
Content-Type: text/html

<!DOCTYPE html>
<html>
  <head><title>Project Status</title></head>
  <body>
    <h1>Project Status Report</h1>
    <table>
      <tr><th>Task</th><th>Owner</th><th>Status</th></tr>
      <tr><td>Backend API</td><td>John</td><td>In Progress</td></tr>
      <tr><td>Frontend UI</td><td>Jane</td><td>Complete</td></tr>
    </table>
  </body>
</html>
```

---

## OneNote Permissions Reference

### Delegated Permissions
- `Notes.Read` - Read user's OneNote notebooks
- `Notes.ReadWrite` - Read and write user's notebooks
- `Notes.Create` - Create user's notebooks
- `Notes.Read.All` - Read all OneNote notebooks user can access
- `Notes.ReadWrite.All` - Read and write all notebooks user can access

### Application Permissions
- `Notes.Read.All` - Read all OneNote notebooks
- `Notes.ReadWrite.All` - Read and write all notebooks

---

## OneNote Best Practices

1. **Use semantic HTML** - h1, h2, p, etc.
2. **Include page titles** in HTML head
3. **Use data-tag** for task tracking
4. **Organize with sections** and section groups
5. **Make content searchable** - use descriptive text
6. **Use multipart for media** - multipart/form-data for images
7. **Handle async operations** - page creation returns 201
8. **Reference embedded resources** by name
9. **Update incrementally** - use PATCH for appending
10. **Preview content** - use preview endpoint

---

## Planner vs To Do vs OneNote

| Feature | Planner | To Do | OneNote |
|---------|---------|-------|---------|
| **Scope** | Team planning | Personal tasks | Note taking |
| **Collaboration** | Full team | Individual only | Shared notebooks |
| **Backed by** | Microsoft 365 Group | User account | OneDrive/SharePoint |
| **Best for** | Projects | Personal lists | Documentation |
| **Permissions Reference** | Required permissions for group-based operations | Delegated permissions | Basic delegated permissions |

---

## Combined Common Patterns

### Team Project Workflow
```http
# 1. Create team plan (Planner)
POST /planner/plans
{...}

# 2. Create reference notebook (OneNote)
POST /me/onenote/notebooks
{...}

# 3. Create personal to-do (To Do)
POST /me/todo/lists
{...}
```

### Track Task with Notes and Links
```http
# 1. Create Planner task
POST /planner/tasks
{...}

# 2. Create OneNote page for details
POST /me/onenote/sections/{section-id}/pages
{...}

# 3. Link To Do task
POST /me/todo/lists/{list-id}/tasks/{task-id}/linkedResources
{...}
```
