# Files (OneDrive & SharePoint) - Microsoft Graph API

This resource covers all endpoints related to file operations, OneDrive, SharePoint sites, drives, and document management.

## Base Endpoints

- User's Drive: `https://graph.microsoft.com/v1.0/me/drive`
- Specific Drive: `https://graph.microsoft.com/v1.0/drives/{drive-id}`
- SharePoint Site: `https://graph.microsoft.com/v1.0/sites/{site-id}`
- Group Drive: `https://graph.microsoft.com/v1.0/groups/{group-id}/drive`

## Drives

### Get User's Default Drive
```http
GET /me/drive
```

### Get Specific Drive
```http
GET /drives/{drive-id}
```

### List User's Drives
```http
GET /me/drives
```

### Get Group Drive
```http
GET /groups/{group-id}/drive
```

### Get Site Drive
```http
GET /sites/{site-id}/drive
```

**Drive properties:**
- `id` - Drive ID
- `driveType` - personal, business, documentLibrary
- `owner` - Drive owner
- `quota` - Storage quota information

---

## Drive Items (Files & Folders)

### Get Root Folder
```http
GET /me/drive/root
GET /me/drive/root/children
```

### Get Item by ID
```http
GET /me/drive/items/{item-id}
```

### Get Item by Path
```http
GET /me/drive/root:/Documents/report.pdf
GET /me/drive/root:/Documents/report.pdf:/content
```

### List Folder Contents
```http
GET /me/drive/items/{folder-id}/children
GET /me/drive/root:/Documents:/children
```

### Query Parameters
```http
# Select specific properties
GET /me/drive/root/children?$select=name,size,lastModifiedDateTime

# Order by name
GET /me/drive/root/children?$orderby=name

# Filter by type
GET /me/drive/root/children?$filter=file ne null

# Expand thumbnails
GET /me/drive/root/children?$expand=thumbnails
```

---

## Upload Files

### Simple Upload (< 4 MB)
```http
PUT /me/drive/root:/Documents/newfile.txt:/content
Content-Type: text/plain

File content here
```

### Upload Binary File
```http
PUT /me/drive/root:/Documents/image.jpg:/content
Content-Type: image/jpeg

[Binary file content]
```

### Upload to Specific Folder
```http
PUT /me/drive/items/{folder-id}:/{filename}:/content
Content-Type: application/octet-stream

[File content]
```

### Large File Upload (> 4 MB)

Use upload sessions for files > 4 MB:

#### 1. Create Upload Session
```http
POST /me/drive/root:/Documents/largefile.zip:/createUploadSession
Content-Type: application/json

{
  "item": {
    "@microsoft.graph.conflictBehavior": "rename",
    "name": "largefile.zip"
  }
}
```

**Response includes uploadUrl**

#### 2. Upload Bytes in Fragments
```http
PUT {uploadUrl}
Content-Range: bytes 0-999999/10000000
Content-Type: application/octet-stream

[First 1 MB chunk]
```

#### 3. Continue Until Complete
```http
PUT {uploadUrl}
Content-Range: bytes 1000000-1999999/10000000

[Next 1 MB chunk]
```

**Recommendations:**
- Fragment size: 5-10 MB
- Upload fragments sequentially
- Handle resume on network failures
- Check upload status with GET to uploadUrl

---

## Download Files

### Download File Content
```http
GET /me/drive/items/{item-id}/content
```

Returns file binary content with redirect.

### Download File by Path
```http
GET /me/drive/root:/Documents/report.pdf:/content
```

### Get Download URL
```http
GET /me/drive/items/{item-id}?$select=@microsoft.graph.downloadUrl
```

**downloadUrl** is short-lived (few minutes), redirect to actual content.

### Download Specific Format (Office files)
```http
GET /me/drive/items/{item-id}/content?format=pdf
```

**Supported formats:** `pdf`, `html` (for Office documents)

---

## Create Folders

### Create Folder
```http
POST /me/drive/root/children
Content-Type: application/json

{
  "name": "New Folder",
  "folder": {}
}
```

### Create Nested Folder
```http
POST /me/drive/root:/Documents:/children
Content-Type: application/json

{
  "name": "Subfolder",
  "folder": {},
  "@microsoft.graph.conflictBehavior": "rename"
}
```

**Conflict behaviors:**
- `rename` - Rename if exists
- `replace` - Replace if exists
- `fail` - Fail if exists (default)

---

## Update Items

### Rename File or Folder
```http
PATCH /me/drive/items/{item-id}
Content-Type: application/json

{
  "name": "NewFileName.txt"
}
```

### Update Metadata
```http
PATCH /me/drive/items/{item-id}
Content-Type: application/json

{
  "name": "UpdatedName.txt",
  "description": "File description"
}
```

---

## Move and Copy

### Move Item
```http
PATCH /me/drive/items/{item-id}
Content-Type: application/json

{
  "parentReference": {
    "id": "{destination-folder-id}"
  }
}
```

### Move and Rename
```http
PATCH /me/drive/items/{item-id}
{
  "parentReference": {
    "id": "{destination-folder-id}"
  },
  "name": "NewName.txt"
}
```

### Copy Item
```http
POST /me/drive/items/{item-id}/copy
Content-Type: application/json

{
  "parentReference": {
    "id": "{destination-folder-id}"
  },
  "name": "Copy of file.txt"
}
```

**Copy is asynchronous** - returns `Location` header with monitor URL.

#### Monitor Copy Progress
```http
GET {monitor-url}
```

---

## Delete Items

### Delete File or Folder
```http
DELETE /me/drive/items/{item-id}
```

Moves to Recycle Bin (if available).

### Permanent Delete
```http
DELETE /me/drive/items/{item-id}?@microsoft.graph.permanentDelete=true
```

---

## Search

### Search in Drive
```http
GET /me/drive/root/search(q='{search-query}')
GET /me/drive/root/search(q='report')?$select=name,size,webUrl
```

### Search in Specific Folder
```http
GET /me/drive/items/{folder-id}/search(q='{query}')
```

**Search supports:**
- File names
- File content (when indexed)
- Metadata

---

## Sharing

### Create Sharing Link
```http
POST /me/drive/items/{item-id}/createLink
Content-Type: application/json

{
  "type": "view",
  "scope": "anonymous"
}
```

**Link types:**
- `view` - Read-only
- `edit` - Read and write
- `embed` - Embeddable link

**Scopes:**
- `anonymous` - Anyone with the link
- `organization` - Anyone in your organization
- `users` - Specific users (requires recipients)

### Create Link with Password
```http
POST /me/drive/items/{item-id}/createLink
{
  "type": "view",
  "scope": "anonymous",
  "password": "securepassword",
  "expirationDateTime": "2024-12-31T23:59:59Z"
}
```

### Send Sharing Invitation
```http
POST /me/drive/items/{item-id}/invite
Content-Type: application/json

{
  "requireSignIn": true,
  "sendInvitation": true,
  "roles": ["read"],
  "recipients": [
    {"email": "user@example.com"}
  ],
  "message": "Here's the file you requested."
}
```

**Roles:** `read`, `write`, `owner`

### List Permissions
```http
GET /me/drive/items/{item-id}/permissions
```

### Remove Permission
```http
DELETE /me/drive/items/{item-id}/permissions/{permission-id}
```

---

## Special Folders

### Access Special Folders
```http
GET /me/drive/special/{folder-name}
```

**Special folder names:**
- `documents` - Documents
- `photos` - Photos
- `cameraRoll` - Camera Roll
- `approot` - App folder
- `music` - Music
- `downloads` - Downloads

### List Files in Special Folder
```http
GET /me/drive/special/documents/children
```

---

## Thumbnails

### Get Thumbnails
```http
GET /me/drive/items/{item-id}/thumbnails
```

**Returns multiple sizes:**
- `small` - 96x96
- `medium` - 176x176
- `large` - 800x800 (largest dimension)

### Get Specific Thumbnail Size
```http
GET /me/drive/items/{item-id}/thumbnails/0/medium/content
```

### Custom Thumbnail Size
```http
GET /me/drive/items/{item-id}/thumbnails/0/c400x400/content
```

**Format:** `c{width}x{height}` for custom size

---

## Delta Queries (Track Changes)

### Initial Delta Request
```http
GET /me/drive/root/delta
```

**Returns:**
- Changed items
- `@odata.deltaLink` for next query

### Subsequent Delta Requests
```http
GET {deltaLink}
```

**Use cases:**
- Sync files
- Track changes
- Update local cache

---

## Versions

### List File Versions
```http
GET /me/drive/items/{item-id}/versions
```

### Get Specific Version
```http
GET /me/drive/items/{item-id}/versions/{version-id}
```

### Download Version Content
```http
GET /me/drive/items/{item-id}/versions/{version-id}/content
```

### Restore Version
```http
POST /me/drive/items/{item-id}/versions/{version-id}/restoreVersion
```

---

## SharePoint Sites

### Search Sites
```http
GET /sites?search={query}
GET /sites?search=Engineering
```

### Get Root Site
```http
GET /sites/root
```

### Get Site by Path
```http
GET /sites/{hostname}:/{site-path}
GET /sites/contoso.sharepoint.com:/sites/engineering
```

### Get Site by ID
```http
GET /sites/{site-id}
```

### List Site Drives
```http
GET /sites/{site-id}/drives
```

### Get Site Document Library
```http
GET /sites/{site-id}/drive
```

---

## SharePoint Lists

### List Site Lists
```http
GET /sites/{site-id}/lists
```

### Get Specific List
```http
GET /sites/{site-id}/lists/{list-id}
```

### List Items
```http
GET /sites/{site-id}/lists/{list-id}/items
GET /sites/{site-id}/lists/{list-id}/items?$expand=fields
```

### Create List Item
```http
POST /sites/{site-id}/lists/{list-id}/items
Content-Type: application/json

{
  "fields": {
    "Title": "New Item",
    "Description": "Item description"
  }
}
```

### Update List Item
```http
PATCH /sites/{site-id}/lists/{list-id}/items/{item-id}/fields
Content-Type: application/json

{
  "Title": "Updated Title"
}
```

### Delete List Item
```http
DELETE /sites/{site-id}/lists/{list-id}/items/{item-id}
```

---

## Item Properties

### Core Properties
- `id` - Item ID
- `name` - File/folder name
- `size` - Size in bytes
- `createdDateTime` - Creation time
- `lastModifiedDateTime` - Last modified time
- `webUrl` - Web URL to item
- `parentReference` - Parent folder reference
- `file` - File facet (if file)
- `folder` - Folder facet (if folder)
- `package` - Package facet (if package)
- `image` - Image metadata (if image)
- `photo` - Photo metadata (if photo)
- `video` - Video metadata (if video)

### File Facet
```json
{
  "file": {
    "mimeType": "application/pdf",
    "hashes": {
      "sha1Hash": "...",
      "quickXorHash": "..."
    }
  }
}
```

### Folder Facet
```json
{
  "folder": {
    "childCount": 5
  }
}
```

---

## Permissions Reference

### Delegated Permissions
- `Files.Read` - Read user files
- `Files.ReadWrite` - Read and write user files
- `Files.Read.All` - Read all files user can access
- `Files.ReadWrite.All` - Read and write all files user can access
- `Sites.Read.All` - Read items in all site collections
- `Sites.ReadWrite.All` - Read and write items in all site collections

### Application Permissions
- `Files.Read.All` - Read files in all site collections
- `Files.ReadWrite.All` - Read and write files in all site collections
- `Sites.Read.All` - Read items in all site collections
- `Sites.ReadWrite.All` - Read and write items in all site collections

---

## Common Patterns

### Upload and Share File
```http
# 1. Upload file
PUT /me/drive/root:/Documents/report.pdf:/content
Content-Type: application/pdf

[File content]

# 2. Create sharing link
POST /me/drive/root:/Documents/report.pdf:/createLink
{
  "type": "view",
  "scope": "organization"
}
```

### Sync Folder
```http
# 1. Get initial state
GET /me/drive/root:/Documents:/delta

# 2. Process items

# 3. Store deltaLink

# 4. Get changes
GET {deltaLink}
```

### Download All Files in Folder
```http
# 1. List folder contents
GET /me/drive/items/{folder-id}/children

# 2. For each item, download content
GET /me/drive/items/{item-id}/content
```

---

## Best Practices

1. **Use upload sessions** for files > 4 MB
2. **Implement delta queries** for sync scenarios
3. **Handle conflicts** appropriately (rename, replace, fail)
4. **Cache thumbnails** instead of regenerating
5. **Use batch requests** for multiple operations
6. **Respect rate limits** - implement retry logic
7. **Validate file types** before upload
8. **Use @microsoft.graph.downloadUrl** for downloads
9. **Monitor async operations** (copy, large uploads)
10. **Handle quota limits** - check before upload

---

## Rate Limits

- Typical limit: Variable based on file size and operation
- Large uploads: Use upload sessions
- Monitor `Retry-After` header on 429 responses
- Batch operations have separate limits

---

## Error Handling

Common errors:
- `itemNotFound` - Item doesn't exist
- `resourceModified` - Item changed (use etag)
- `unauthenticated` - Authentication required
- `accessDenied` - Insufficient permissions
- `quotaLimitReached` - Storage quota exceeded
- `nameAlreadyExists` - Name conflict
