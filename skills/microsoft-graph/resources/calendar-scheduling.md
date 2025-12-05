# Calendar & Scheduling - Microsoft Graph API

This resource covers all endpoints related to calendar events, meeting scheduling, attendee management, and calendar operations.

## Base Endpoints

- Calendar: `https://graph.microsoft.com/v1.0/me/calendar`
- Events: `https://graph.microsoft.com/v1.0/me/events`
- OnlineMeetings: `https://graph.microsoft.com/v1.0/me/onlineMeetings`

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
