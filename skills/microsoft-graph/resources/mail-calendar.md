# Mail & Calendar - Microsoft Graph API

This resource covers all endpoints related to email, messages, mailboxes, calendar events, meeting scheduling, and email management.

## Base Endpoints

- Messages: `https://graph.microsoft.com/v1.0/me/messages`
- Mail Folders: `https://graph.microsoft.com/v1.0/me/mailFolders`
- Send Mail: `https://graph.microsoft.com/v1.0/me/sendMail`
- Calendar: `https://graph.microsoft.com/v1.0/me/calendar`
- Events: `https://graph.microsoft.com/v1.0/me/events`

---

# Email Operations

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

## Message Search & Filtering

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

# Calendar Operations

## Events

### List Events

#### Get All Events
```http
GET /me/events
GET /me/calendar/events
GET /users/{id}/events
```

#### Get Events from Specific Calendar
```http
GET /me/calendars/{calendar-id}/events
```

#### Query Parameters
```http
# Select specific properties
GET /me/events?$select=subject,start,end,location

# Filter by date range
GET /me/events?$filter=start/dateTime ge '2024-01-01T00:00:00Z' and end/dateTime le '2024-01-31T23:59:59Z'

# Order by start time
GET /me/events?$orderby=start/dateTime

# Limit results
GET /me/events?$top=25
```

### Get Calendar View (Date Range)
```http
GET /me/calendar/calendarView?startDateTime=2024-01-01T00:00:00Z&endDateTime=2024-01-31T23:59:59Z
```

**Important:** Calendar view automatically expands recurring events into instances.

### Get Specific Event
```http
GET /me/events/{event-id}
```

### Create Event
```http
POST /me/events
Content-Type: application/json

{
  "subject": "Team Meeting",
  "body": {
    "contentType": "HTML",
    "content": "<p>Discuss project status</p>"
  },
  "start": {
    "dateTime": "2024-01-15T14:00:00",
    "timeZone": "Pacific Standard Time"
  },
  "end": {
    "dateTime": "2024-01-15T15:00:00",
    "timeZone": "Pacific Standard Time"
  },
  "location": {
    "displayName": "Conference Room A"
  },
  "attendees": [
    {
      "emailAddress": {
        "address": "attendee@example.com",
        "name": "Attendee Name"
      },
      "type": "required"
    }
  ]
}
```

**Required Permissions:** `Calendars.ReadWrite`

### Update Event
```http
PATCH /me/events/{event-id}
Content-Type: application/json

{
  "subject": "Updated Meeting Title",
  "location": {
    "displayName": "Conference Room B"
  }
}
```

### Delete Event
```http
DELETE /me/events/{event-id}
```

### Cancel Event (with message)
```http
POST /me/events/{event-id}/cancel
Content-Type: application/json

{
  "comment": "Meeting cancelled due to scheduling conflict."
}
```

---

## Recurring Events

### Create Recurring Event
```http
POST /me/events
Content-Type: application/json

{
  "subject": "Weekly Team Standup",
  "start": {
    "dateTime": "2024-01-08T09:00:00",
    "timeZone": "Pacific Standard Time"
  },
  "end": {
    "dateTime": "2024-01-08T09:30:00",
    "timeZone": "Pacific Standard Time"
  },
  "recurrence": {
    "pattern": {
      "type": "weekly",
      "interval": 1,
      "daysOfWeek": ["monday"]
    },
    "range": {
      "type": "endDate",
      "startDate": "2024-01-08",
      "endDate": "2024-12-31"
    }
  }
}
```

### Recurrence Patterns

**Daily:**
```json
{
  "pattern": {
    "type": "daily",
    "interval": 1
  }
}
```

**Weekly (specific days):**
```json
{
  "pattern": {
    "type": "weekly",
    "interval": 1,
    "daysOfWeek": ["monday", "wednesday", "friday"]
  }
}
```

**Monthly (specific day of month):**
```json
{
  "pattern": {
    "type": "absoluteMonthly",
    "interval": 1,
    "dayOfMonth": 15
  }
}
```

**Monthly (relative - e.g., first Monday):**
```json
{
  "pattern": {
    "type": "relativeMonthly",
    "interval": 1,
    "daysOfWeek": ["monday"],
    "index": "first"
  }
}
```

**Yearly:**
```json
{
  "pattern": {
    "type": "absoluteYearly",
    "interval": 1,
    "dayOfMonth": 1,
    "month": 1
  }
}
```

### Recurrence Range Types

**End by date:**
```json
{
  "range": {
    "type": "endDate",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

**Number of occurrences:**
```json
{
  "range": {
    "type": "numbered",
    "startDate": "2024-01-01",
    "numberOfOccurrences": 10
  }
}
```

**No end date:**
```json
{
  "range": {
    "type": "noEnd",
    "startDate": "2024-01-01"
  }
}
```

### Get Event Instances
```http
GET /me/events/{recurring-event-id}/instances?startDateTime=2024-01-01&endDateTime=2024-12-31
```

---

## Attendees

### Attendee Types
- `required` - Required attendee
- `optional` - Optional attendee
- `resource` - Resource (e.g., conference room)

### Add Attendees
```http
PATCH /me/events/{event-id}
Content-Type: application/json

{
  "attendees": [
    {
      "emailAddress": {
        "address": "newattendee@example.com"
      },
      "type": "required"
    }
  ]
}
```

### Attendee Response Status
```json
{
  "status": {
    "response": "accepted",
    "time": "2024-01-10T12:00:00Z"
  }
}
```

**Response values:** `none`, `organizer`, `tentativelyAccepted`, `accepted`, `declined`, `notResponded`

---

## Meeting Responses

### Accept Meeting
```http
POST /me/events/{event-id}/accept
Content-Type: application/json

{
  "comment": "I'll be there!",
  "sendResponse": true
}
```

### Tentatively Accept
```http
POST /me/events/{event-id}/tentativelyAccept
Content-Type: application/json

{
  "comment": "I might be able to attend.",
  "sendResponse": true
}
```

### Decline Meeting
```http
POST /me/events/{event-id}/decline
Content-Type: application/json

{
  "comment": "Sorry, I have a conflict.",
  "sendResponse": true
}
```

---

## Calendars

### List Calendars
```http
GET /me/calendars
```

### Get Default Calendar
```http
GET /me/calendar
```

### Create Calendar
```http
POST /me/calendars
Content-Type: application/json

{
  "name": "Project X Calendar",
  "color": "blue"
}
```

**Color values:** `auto`, `lightBlue`, `lightGreen`, `lightOrange`, `lightGray`, `lightYellow`, `lightTeal`, `lightPink`, `lightBrown`, `lightRed`, `maxColor`

### Update Calendar
```http
PATCH /me/calendars/{calendar-id}
Content-Type: application/json

{
  "name": "Updated Calendar Name",
  "color": "lightGreen"
}
```

### Delete Calendar
```http
DELETE /me/calendars/{calendar-id}
```

---

## Free/Busy Schedule

### Get Schedule
```http
POST /me/calendar/getSchedule
Content-Type: application/json

{
  "schedules": [
    "user1@example.com",
    "user2@example.com",
    "room@example.com"
  ],
  "startTime": {
    "dateTime": "2024-01-15T09:00:00",
    "timeZone": "Pacific Standard Time"
  },
  "endTime": {
    "dateTime": "2024-01-15T17:00:00",
    "timeZone": "Pacific Standard Time"
  },
  "availabilityViewInterval": 30
}
```

**Returns:**
- Schedule information for each requested email
- Availability view (0 = free, 1 = tentative, 2 = busy, 3 = OOF, 4 = working elsewhere)

**Required Permissions:** `Calendars.Read` or `Calendars.Read.Shared`

---

## Meeting Rooms

### List Meeting Rooms
```http
GET /me/findRooms
```

### List Rooms in Room List
```http
GET /me/findRooms(RoomList='roomlist@example.com')
```

### List Room Lists
```http
GET /me/findRoomLists
```

### Get Room Availability
Include room email in getSchedule request.

---

## Find Meeting Times

### Suggest Meeting Times
```http
POST /me/findMeetingTimes
Content-Type: application/json

{
  "attendees": [
    {
      "emailAddress": {
        "address": "attendee1@example.com"
      },
      "type": "required"
    },
    {
      "emailAddress": {
        "address": "attendee2@example.com"
      },
      "type": "optional"
    }
  ],
  "timeConstraint": {
    "timeslots": [
      {
        "start": {
          "dateTime": "2024-01-15T09:00:00",
          "timeZone": "Pacific Standard Time"
        },
        "end": {
          "dateTime": "2024-01-15T17:00:00",
          "timeZone": "Pacific Standard Time"
        }
      }
    ]
  },
  "meetingDuration": "PT1H",
  "maxCandidates": 5,
  "isOrganizerOptional": false
}
```

**Returns:** Suggested meeting times ranked by confidence

---

## Online Meetings

### Create Online Meeting
```http
POST /me/onlineMeetings
Content-Type: application/json

{
  "startDateTime": "2024-01-15T14:00:00Z",
  "endDateTime": "2024-01-15T15:00:00Z",
  "subject": "Virtual Meeting"
}
```

**Returns:**
- `joinUrl` - Meeting join URL
- `joinWebUrl` - Web join URL
- `audioConferencing` - Dial-in info

### Create Event with Teams Meeting
```http
POST /me/events
Content-Type: application/json

{
  "subject": "Teams Meeting",
  "start": {
    "dateTime": "2024-01-15T14:00:00",
    "timeZone": "UTC"
  },
  "end": {
    "dateTime": "2024-01-15T15:00:00",
    "timeZone": "UTC"
  },
  "isOnlineMeeting": true,
  "onlineMeetingProvider": "teamsForBusiness"
}
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
- `Mail.Send` - Send mail as user
- `Calendars.Read` - Read user calendars
- `Calendars.ReadWrite` - Read and write user calendars

### Application Permissions
- `Mail.Read` - Read mail in all mailboxes
- `Mail.ReadWrite` - Read and write mail in all mailboxes
- `Mail.Send` - Send mail as any user
- `Calendars.Read` - Read calendars in all mailboxes
- `Calendars.ReadWrite` - Read and write calendars

---

## Common Patterns

### Get Today's Messages
```http
GET /me/messages?$filter=receivedDateTime ge {today-start} and receivedDateTime lt {today-end}
```

### Get This Week's Events
```http
GET /me/calendar/calendarView?startDateTime={week-start}&endDateTime={week-end}&$orderby=start/dateTime
```

### Create All-Day Event
```http
POST /me/events
{
  "subject": "All-Day Conference",
  "start": {
    "dateTime": "2024-01-15T00:00:00",
    "timeZone": "UTC"
  },
  "end": {
    "dateTime": "2024-01-16T00:00:00",
    "timeZone": "UTC"
  },
  "isAllDay": true
}
```

### Mark All as Read
Use batch request to update multiple messages.

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

---

## Best Practices

**Email:**
1. Use `$select` to get only needed properties
2. Implement pagination for large message sets
3. Use delta queries for mail sync
4. Batch operations when updating multiple messages
5. Handle large attachments with upload sessions

**Calendar:**
1. Use `calendarView` instead of filtering for date ranges
2. Specify time zones explicitly
3. Handle recurring events properly
4. Use `findMeetingTimes` for complex scheduling
5. Respect working hours when scheduling

**Combined:**
1. Cache folder IDs to avoid repeated lookups
2. Respect rate limits (implement retry logic)
3. Handle encoding properly for attachment content
4. Use well-known folder names when possible
5. Monitor Retry-After header on 429 responses
