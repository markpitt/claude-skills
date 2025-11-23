# OneNote - Microsoft Graph API

This resource covers OneNote notebooks, sections, and pages via Microsoft Graph.

## Base Endpoint

`https://graph.microsoft.com/v1.0/me/onenote`

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
  <head>
    <title>Page with Image</title>
  </head>
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

## Search

### Search Pages
```http
GET /me/onenote/pages?$search=meeting notes
```

---

## Page Preview

### Get Page Preview
```http
GET /me/onenote/pages/{page-id}/preview
```

Returns text preview of page content.

---

## Resources

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

## HTML Elements Support

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

**Attributes:**
- `data-tag` - Tags (to-do, important, question, etc.)
- `data-id` - Element IDs for updates

### Example with Tags
```html
<p data-tag="to-do">Complete project proposal</p>
<p data-tag="important">Review budget before meeting</p>
<p data-tag="question">Who is leading the presentation?</p>
```

---

## Permissions Reference

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

## Common Patterns

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
      <tr>
        <th>Task</th>
        <th>Owner</th>
        <th>Status</th>
      </tr>
      <tr>
        <td>Backend API</td>
        <td>John</td>
        <td>In Progress</td>
      </tr>
      <tr>
        <td>Frontend UI</td>
        <td>Jane</td>
        <td>Complete</td>
      </tr>
    </table>
  </body>
</html>
```

---

## Best Practices

1. **Use semantic HTML** - h1, h2, p, etc.
2. **Include page titles** in HTML head
3. **Use data-tag** for task tracking
4. **Organize with sections** and section groups
5. **Search capabilities** - make content searchable
6. **Multipart for media** - use multipart/form-data for images
7. **Handle async operations** - page creation returns 201, copy operations are async
8. **Preview before display** - use preview endpoint
9. **Resource references** - reference embedded resources by name
10. **Update incrementally** - use PATCH for appending content

---

## Limitations

- OneNote API is in maintenance mode
- Limited to existing features (no new features planned)
- Some OneNote desktop features not available via API
- Formatting may differ from desktop app
- Maximum page size limits apply
- Rate limits for creation operations

---

## Migration Note

Microsoft is focusing on other note-taking solutions. For new projects, consider:
- Microsoft Loop (via Graph API when available)
- Microsoft Lists
- SharePoint pages
- Microsoft To Do for task tracking

OneNote API remains supported but is not receiving new features.
