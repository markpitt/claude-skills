# Calendar - Microsoft Graph API

This resource covers all endpoints related to calendars, events, scheduling, and meeting management.

## Base Endpoints

- Calendar: `https://graph.microsoft.com/v1.0/me/calendar`
- Events: `https://graph.microsoft.com/v1.0/me/events`
- Calendar Groups: `https://graph.microsoft.com/v1.0/me/calendarGroups`

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

## Calendar Groups

### List Calendar Groups
```http
GET /me/calendarGroups
```

### Create Calendar Group
```http
POST /me/calendarGroups
Content-Type: application/json

{
  "name": "Personal Calendars"
}
```

### List Calendars in Group
```http
GET /me/calendarGroups/{group-id}/calendars
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
Include room email in getSchedule request:
```http
POST /me/calendar/getSchedule
{
  "schedules": ["conferenceroom@example.com"],
  ...
}
```

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

## Event Properties

### Core Properties
- `id` - Event ID
- `subject` - Event title
- `body` - Event description (HTML or text)
- `start` - Start time (dateTime + timeZone)
- `end` - End time (dateTime + timeZone)
- `location` - Location object
- `locations` - Multiple locations (array)
- `attendees` - Attendees (array)
- `organizer` - Organizer
- `isAllDay` - All-day event flag
- `isCancelled` - Cancelled flag
- `isOrganizer` - Current user is organizer
- `responseRequested` - Response requested
- `sensitivity` - normal, personal, private, confidential
- `showAs` - free, tentative, busy, oof, workingElsewhere, unknown
- `categories` - Categories (array)
- `importance` - low, normal, high
- `webLink` - Web link to event

### Time Zone Properties
```json
{
  "start": {
    "dateTime": "2024-01-15T14:00:00",
    "timeZone": "Pacific Standard Time"
  }
}
```

**Use IANA or Windows time zone identifiers**

---

## Reminders

### Event Reminders
```json
{
  "reminderMinutesBeforeStart": 15,
  "isReminderOn": true
}
```

### Default Reminder Settings
```http
GET /me/mailboxSettings

{
  "automaticRepliesSetting": {...},
  "timeZone": "Pacific Standard Time",
  "language": {...},
  "workingHours": {...}
}
```

---

## Working Hours

### Get Working Hours
```http
GET /me/mailboxSettings/workingHours
```

### Set Working Hours
```http
PATCH /me/mailboxSettings
Content-Type: application/json

{
  "workingHours": {
    "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "startTime": "08:00:00",
    "endTime": "17:00:00",
    "timeZone": {
      "name": "Pacific Standard Time"
    }
  }
}
```

---

## Permissions Reference

### Delegated Permissions
- `Calendars.Read` - Read user calendars
- `Calendars.ReadWrite` - Read and write user calendars
- `Calendars.Read.Shared` - Read shared calendars
- `Calendars.ReadWrite.Shared` - Read and write shared calendars

### Application Permissions
- `Calendars.Read` - Read calendars in all mailboxes
- `Calendars.ReadWrite` - Read and write calendars in all mailboxes

---

## Common Patterns

### Get Today's Events
```http
GET /me/calendar/calendarView?startDateTime={today-start}&endDateTime={today-end}
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

### Add Teams Meeting to Event
```http
PATCH /me/events/{event-id}
{
  "isOnlineMeeting": true,
  "onlineMeetingProvider": "teamsForBusiness"
}
```

---

## Best Practices

1. **Use calendarView** instead of filtering events for date ranges
2. **Specify time zones** explicitly in start/end times
3. **Handle recurring events** properly (use instances endpoint)
4. **Respect working hours** when scheduling
5. **Check availability** before creating meetings (getSchedule)
6. **Use findMeetingTimes** for complex scheduling
7. **Include meeting locations** for better UX
8. **Set appropriate reminders**
9. **Handle time zone conversions** on client side
10. **Use delta queries** for calendar sync scenarios

---

## Delta Queries

### Initial Request
```http
GET /me/calendar/events/delta
```

### Subsequent Requests
```http
GET {deltaLink}
```

Use delta queries to efficiently sync calendar changes.
