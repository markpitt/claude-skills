# Mail - Microsoft Graph API

This resource covers all endpoints related to email, messages, mailboxes, and mail management.

## Base Endpoints

- Messages: `https://graph.microsoft.com/v1.0/me/messages`
- Mail Folders: `https://graph.microsoft.com/v1.0/me/mailFolders`
- Send Mail: `https://graph.microsoft.com/v1.0/me/sendMail`

## Messages

### List Messages

#### Get All Messages
```http
GET /me/messages
GET /users/{id}/messages
```

#### Get Messages from Specific Folder
```http
GET /me/mailFolders/{folder-id}/messages
GET /me/mailFolders/inbox/messages
```

**Well-known folder names:** `inbox`, `drafts`, `sentitems`, `deleteditems`, `junkemail`

#### Query Parameters
```http
# Select specific properties
GET /me/messages?$select=subject,from,receivedDateTime,isRead

# Filter messages
GET /me/messages?$filter=isRead eq false
GET /me/messages?$filter=from/emailAddress/address eq 'sender@example.com'

# Order by date
GET /me/messages?$orderby=receivedDateTime desc

# Limit results
GET /me/messages?$top=25

# Search messages
GET /me/messages?$search="subject:meeting"
```

### Get Specific Message
```http
GET /me/messages/{message-id}
GET /me/messages/{message-id}?$select=subject,body,from,toRecipients
```

### Create Draft
```http
POST /me/messages
Content-Type: application/json

{
  "subject": "Draft email",
  "body": {
    "contentType": "HTML",
    "content": "<h1>Draft</h1><p>This is a draft email.</p>"
  },
  "toRecipients": [
    {
      "emailAddress": {
        "address": "recipient@example.com",
        "name": "Recipient Name"
      }
    }
  ]
}
```

### Update Message
```http
PATCH /me/messages/{message-id}
Content-Type: application/json

{
  "isRead": true,
  "categories": ["Important", "Work"]
}
```

### Delete Message
```http
DELETE /me/messages/{message-id}
```

Moves to Deleted Items folder.

---

## Send Mail

### Send Message Immediately
```http
POST /me/sendMail
Content-Type: application/json

{
  "message": {
    "subject": "Meeting Tomorrow",
    "body": {
      "contentType": "HTML",
      "content": "<p>Let's meet tomorrow at 2 PM.</p>"
    },
    "toRecipients": [
      {
        "emailAddress": {
          "address": "colleague@example.com",
          "name": "Colleague Name"
        }
      }
    ],
    "ccRecipients": [
      {
        "emailAddress": {
          "address": "manager@example.com"
        }
      }
    ]
  },
  "saveToSentItems": true
}
```

**Required Permissions:** `Mail.Send`

### Send with Attachments
```http
POST /me/sendMail
Content-Type: application/json

{
  "message": {
    "subject": "Document Attached",
    "body": {
      "contentType": "Text",
      "content": "Please review the attached document."
    },
    "toRecipients": [
      {
        "emailAddress": {"address": "recipient@example.com"}
      }
    ],
    "attachments": [
      {
        "@odata.type": "#microsoft.graph.fileAttachment",
        "name": "document.pdf",
        "contentType": "application/pdf",
        "contentBytes": "BASE64_ENCODED_CONTENT"
      }
    ]
  }
}
```

### Send from Draft
```http
POST /me/messages/{draft-id}/send
```

### Reply to Message
```http
POST /me/messages/{message-id}/reply
Content-Type: application/json

{
  "comment": "Thank you for your email."
}
```

### Reply All
```http
POST /me/messages/{message-id}/replyAll
Content-Type: application/json

{
  "comment": "Replying to all recipients."
}
```

### Forward Message
```http
POST /me/messages/{message-id}/forward
Content-Type: application/json

{
  "comment": "FYI",
  "toRecipients": [
    {
      "emailAddress": {"address": "forward@example.com"}
    }
  ]
}
```

---

## Attachments

### List Attachments
```http
GET /me/messages/{message-id}/attachments
```

### Get Attachment
```http
GET /me/messages/{message-id}/attachments/{attachment-id}
```

### Add Attachment to Draft
```http
POST /me/messages/{message-id}/attachments
Content-Type: application/json

{
  "@odata.type": "#microsoft.graph.fileAttachment",
  "name": "report.xlsx",
  "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "contentBytes": "BASE64_ENCODED_CONTENT"
}
```

### Add Large Attachment (> 3 MB)
Use upload sessions for files > 3 MB:

```http
# 1. Create upload session
POST /me/messages/{message-id}/attachments/createUploadSession
Content-Type: application/json

{
  "AttachmentItem": {
    "attachmentType": "file",
    "name": "largefile.zip",
    "size": 50000000
  }
}

# Response includes uploadUrl

# 2. Upload bytes in chunks
PUT {uploadUrl}
Content-Range: bytes 0-49999/50000000
Content-Type: application/octet-stream

[First 50KB of data]

# 3. Continue until complete
PUT {uploadUrl}
Content-Range: bytes 50000-99999/50000000

[Next 50KB of data]
```

### Delete Attachment
```http
DELETE /me/messages/{message-id}/attachments/{attachment-id}
```

---

## Mail Folders

### List Folders
```http
GET /me/mailFolders
GET /me/mailFolders?$select=displayName,totalItemCount,unreadItemCount
```

### Get Specific Folder
```http
GET /me/mailFolders/{folder-id}
GET /me/mailFolders/inbox
```

### Create Folder
```http
POST /me/mailFolders
Content-Type: application/json

{
  "displayName": "Project X"
}
```

### Create Child Folder
```http
POST /me/mailFolders/{parent-folder-id}/childFolders
Content-Type: application/json

{
  "displayName": "Subfolder"
}
```

### Update Folder
```http
PATCH /me/mailFolders/{folder-id}
Content-Type: application/json

{
  "displayName": "Renamed Folder"
}
```

### Delete Folder
```http
DELETE /me/mailFolders/{folder-id}
```

### Move Message to Folder
```http
POST /me/messages/{message-id}/move
Content-Type: application/json

{
  "destinationId": "{folder-id}"
}
```

### Copy Message to Folder
```http
POST /me/messages/{message-id}/copy
Content-Type: application/json

{
  "destinationId": "{folder-id}"
}
```

---

## Message Rules

### List Rules
```http
GET /me/mailFolders/inbox/messageRules
```

### Get Rule
```http
GET /me/mailFolders/inbox/messageRules/{rule-id}
```

### Create Rule
```http
POST /me/mailFolders/inbox/messageRules
Content-Type: application/json

{
  "displayName": "Move emails from boss to Important",
  "sequence": 1,
  "isEnabled": true,
  "conditions": {
    "senderContains": ["boss@example.com"]
  },
  "actions": {
    "moveToFolder": "{folder-id}",
    "markImportance": "high"
  }
}
```

**Conditions:**
- `senderContains` - Sender email contains
- `subjectContains` - Subject contains
- `bodyContains` - Body contains
- `fromAddresses` - From specific addresses
- `hasAttachments` - Has attachments
- `importance` - Importance level
- `isReadReceiptRequested` - Read receipt requested

**Actions:**
- `moveToFolder` - Move to folder
- `copyToFolder` - Copy to folder
- `delete` - Delete message
- `markAsRead` - Mark as read
- `markImportance` - Set importance
- `forwardTo` - Forward to addresses
- `assignCategories` - Assign categories

### Update Rule
```http
PATCH /me/mailFolders/inbox/messageRules/{rule-id}
Content-Type: application/json

{
  "isEnabled": false
}
```

### Delete Rule
```http
DELETE /me/mailFolders/inbox/messageRules/{rule-id}
```

---

## Focused Inbox

### Get Override
```http
GET /me/inferenceClassification
```

Returns `Focused` or `Other` as default.

### List Overrides
```http
GET /me/inferenceClassification/overrides
```

### Create Override
```http
POST /me/inferenceClassification/overrides
Content-Type: application/json

{
  "classifyAs": "focused",
  "senderEmailAddress": {
    "address": "important@example.com"
  }
}
```

**classifyAs:** `focused` or `other`

---

## Automatic Replies (Out of Office)

### Get Automatic Reply Settings
```http
GET /me/mailboxSettings/automaticRepliesSetting
```

### Set Automatic Replies
```http
PATCH /me/mailboxSettings
Content-Type: application/json

{
  "automaticRepliesSetting": {
    "status": "scheduled",
    "scheduledStartDateTime": {
      "dateTime": "2024-12-20T08:00:00",
      "timeZone": "Pacific Standard Time"
    },
    "scheduledEndDateTime": {
      "dateTime": "2024-12-27T17:00:00",
      "timeZone": "Pacific Standard Time"
    },
    "internalReplyMessage": "I'm out of office until Dec 27.",
    "externalReplyMessage": "I'm currently out of office."
  }
}
```

**Status values:**
- `disabled` - Off
- `alwaysEnabled` - Always on
- `scheduled` - Scheduled period

---

## Message Properties

### Core Properties
- `id` - Message ID
- `subject` - Subject
- `body` - Message body (contentType: Text or HTML)
- `bodyPreview` - First 255 characters
- `from` - Sender
- `toRecipients` - To recipients (array)
- `ccRecipients` - CC recipients (array)
- `bccRecipients` - BCC recipients (array)
- `replyTo` - Reply-to addresses
- `receivedDateTime` - Received date/time
- `sentDateTime` - Sent date/time
- `hasAttachments` - Has attachments (boolean)
- `importance` - low, normal, high
- `isRead` - Read status
- `isDraft` - Draft status
- `categories` - Categories (array)
- `conversationId` - Conversation ID
- `parentFolderId` - Parent folder ID
- `webLink` - Web link to message

### Extended Properties
```http
GET /me/messages/{id}?$expand=extensions
```

---

## Advanced Queries

### Search Messages
```http
# Search in subject
GET /me/messages?$search="subject:meeting"

# Search in body
GET /me/messages?$search="body:project"

# Search from sender
GET /me/messages?$search="from:boss@example.com"

# Search with attachments
GET /me/messages?$search="hasAttachments:true"

# Complex search
GET /me/messages?$search="subject:urgent AND from:manager"
```

### Filter Messages
```http
# Unread messages
GET /me/messages?$filter=isRead eq false

# Messages from specific sender
GET /me/messages?$filter=from/emailAddress/address eq 'sender@example.com'

# Important messages
GET /me/messages?$filter=importance eq 'high'

# Messages with attachments
GET /me/messages?$filter=hasAttachments eq true

# Messages in date range
GET /me/messages?$filter=receivedDateTime ge 2024-01-01T00:00:00Z and receivedDateTime lt 2024-02-01T00:00:00Z

# Messages in category
GET /me/messages?$filter=categories/any(c:c eq 'Important')
```

### Delta Queries for Sync
```http
# Initial request
GET /me/mailFolders/inbox/messages/delta

# Response includes @odata.deltaLink

# Subsequent requests for changes only
GET {deltaLink}
```

---

## Categories

### List Categories
```http
GET /me/outlook/masterCategories
```

### Create Category
```http
POST /me/outlook/masterCategories
Content-Type: application/json

{
  "displayName": "Project X",
  "color": "preset2"
}
```

**Preset colors:** `preset0` through `preset24`

### Update Category
```http
PATCH /me/outlook/masterCategories/{category-id}
Content-Type: application/json

{
  "displayName": "Project X - Completed",
  "color": "preset5"
}
```

### Delete Category
```http
DELETE /me/outlook/masterCategories/{category-id}
```

---

## Mailbox Settings

### Get All Settings
```http
GET /me/mailboxSettings
```

### Get Specific Settings
```http
GET /me/mailboxSettings/timeZone
GET /me/mailboxSettings/language
GET /me/mailboxSettings/dateFormat
GET /me/mailboxSettings/timeFormat
```

### Update Settings
```http
PATCH /me/mailboxSettings
Content-Type: application/json

{
  "timeZone": "Pacific Standard Time",
  "language": {
    "locale": "en-US"
  },
  "dateFormat": "MM/dd/yyyy",
  "timeFormat": "hh:mm tt"
}
```

---

## Permissions Reference

### Delegated Permissions
- `Mail.Read` - Read user mail
- `Mail.ReadWrite` - Read and write user mail
- `Mail.Read.Shared` - Read shared mail
- `Mail.ReadWrite.Shared` - Read and write shared mail
- `Mail.Send` - Send mail as user
- `Mail.Send.Shared` - Send mail on behalf of others
- `MailboxSettings.Read` - Read mailbox settings
- `MailboxSettings.ReadWrite` - Read and write mailbox settings

### Application Permissions
- `Mail.Read` - Read mail in all mailboxes
- `Mail.ReadWrite` - Read and write mail in all mailboxes
- `Mail.Send` - Send mail as any user
- `MailboxSettings.Read` - Read all mailbox settings
- `MailboxSettings.ReadWrite` - Read and write all mailbox settings

---

## Common Patterns

### Get Unread Inbox Count
```http
GET /me/mailFolders/inbox?$select=unreadItemCount
```

### Mark All as Read
Use batch request:
```http
POST /$batch
Content-Type: application/json

{
  "requests": [
    {"id": "1", "method": "PATCH", "url": "/me/messages/{id1}", "body": {"isRead": true}},
    {"id": "2", "method": "PATCH", "url": "/me/messages/{id2}", "body": {"isRead": true}}
  ]
}
```

### Send Email with High Priority
```http
POST /me/sendMail
{
  "message": {
    "subject": "Urgent",
    "importance": "high",
    "body": {"contentType": "Text", "content": "Urgent matter"},
    "toRecipients": [{"emailAddress": {"address": "urgent@example.com"}}]
  }
}
```

### Get Today's Messages
```http
GET /me/messages?$filter=receivedDateTime ge {today-start} and receivedDateTime lt {today-end}
```

---

## Best Practices

1. **Use $select** to get only needed properties
2. **Implement pagination** - messages can be large datasets
3. **Use delta queries** for mail sync scenarios
4. **Batch operations** when updating multiple messages
5. **Handle large attachments** with upload sessions (> 3 MB)
6. **Respect rate limits** - implement retry logic
7. **Use search** instead of client-side filtering
8. **Cache folder IDs** to avoid repeated lookups
9. **Handle encoding** properly for attachment content
10. **Use well-known folder names** when possible (inbox, drafts, etc.)

---

## Rate Limits

- Typical limit: 10,000 requests per 10 minutes per user
- Send mail: Lower limits apply
- Attachment uploads: Separate limits
- Monitor `Retry-After` header on 429 responses
