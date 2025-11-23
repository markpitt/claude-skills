# Teams - Microsoft Graph API

This resource covers Microsoft Teams endpoints including teams, channels, chats, messages, meetings, and collaboration features.

## Base Endpoints

- Teams: `https://graph.microsoft.com/v1.0/teams`
- User's Teams: `https://graph.microsoft.com/v1.0/me/joinedTeams`
- Chats: `https://graph.microsoft.com/v1.0/chats`
- Online Meetings: `https://graph.microsoft.com/v1.0/me/onlineMeetings`

## Teams

### List User's Joined Teams
```http
GET /me/joinedTeams
```

### Get Specific Team
```http
GET /teams/{team-id}
```

### Create Team

#### Create from Group
```http
PUT /groups/{group-id}/team
Content-Type: application/json

{
  "memberSettings": {
    "allowCreateUpdateChannels": true
  },
  "messagingSettings": {
    "allowUserEditMessages": true,
    "allowUserDeleteMessages": true
  },
  "funSettings": {
    "allowGiphy": true,
    "giphyContentRating": "moderate"
  }
}
```

#### Create New Team
```http
POST /teams
Content-Type: application/json

{
  "template@odata.bind": "https://graph.microsoft.com/v1.0/teamsTemplates('standard')",
  "displayName": "Engineering Team",
  "description": "Team for engineering department",
  "members": [
    {
      "@odata.type": "#microsoft.graph.aadUserConversationMember",
      "roles": ["owner"],
      "user@odata.bind": "https://graph.microsoft.com/v1.0/users('{user-id}')"
    }
  ]
}
```

**Required Permissions:** `Team.Create`

### Update Team
```http
PATCH /teams/{team-id}
Content-Type: application/json

{
  "displayName": "Updated Team Name",
  "description": "Updated description",
  "memberSettings": {
    "allowCreateUpdateChannels": false
  }
}
```

### Archive Team
```http
POST /teams/{team-id}/archive
```

### Unarchive Team
```http
POST /teams/{team-id}/unarchive
```

### Delete Team
```http
DELETE /groups/{group-id}
```

(Teams are backed by Microsoft 365 Groups)

---

## Channels

### List Channels
```http
GET /teams/{team-id}/channels
```

### Get Channel
```http
GET /teams/{team-id}/channels/{channel-id}
```

### Create Channel
```http
POST /teams/{team-id}/channels
Content-Type: application/json

{
  "displayName": "Project Updates",
  "description": "Channel for project status updates",
  "membershipType": "standard"
}
```

**Membership types:**
- `standard` - All team members can access
- `private` - Only specific members can access
- `shared` - Can be shared across teams (beta)

### Create Private Channel
```http
POST /teams/{team-id}/channels
{
  "displayName": "Private Channel",
  "description": "For leadership only",
  "membershipType": "private",
  "members": [
    {
      "@odata.type": "#microsoft.graph.aadUserConversationMember",
      "roles": ["owner"],
      "user@odata.bind": "https://graph.microsoft.com/v1.0/users('{user-id}')"
    }
  ]
}
```

### Update Channel
```http
PATCH /teams/{team-id}/channels/{channel-id}
{
  "displayName": "Updated Channel Name",
  "description": "Updated description"
}
```

### Delete Channel
```http
DELETE /teams/{team-id}/channels/{channel-id}
```

---

## Messages (Channel)

### List Channel Messages
```http
GET /teams/{team-id}/channels/{channel-id}/messages
```

### Get Message
```http
GET /teams/{team-id}/channels/{channel-id}/messages/{message-id}
```

### Send Message to Channel
```http
POST /teams/{team-id}/channels/{channel-id}/messages
Content-Type: application/json

{
  "body": {
    "content": "Hello team! Here's the weekly update."
  }
}
```

**Required Permissions:** `ChannelMessage.Send`

### Send Message with Mentions
```http
POST /teams/{team-id}/channels/{channel-id}/messages
{
  "body": {
    "contentType": "html",
    "content": "Hey <at id=\"0\">John</at>, can you review this?"
  },
  "mentions": [
    {
      "id": 0,
      "mentionText": "John",
      "mentioned": {
        "user": {
          "id": "{user-id}",
          "displayName": "John Doe"
        }
      }
    }
  ]
}
```

### Reply to Message
```http
POST /teams/{team-id}/channels/{channel-id}/messages/{message-id}/replies
{
  "body": {
    "content": "Thanks for the update!"
  }
}
```

### List Replies
```http
GET /teams/{team-id}/channels/{channel-id}/messages/{message-id}/replies
```

### Update Message
```http
PATCH /teams/{team-id}/channels/{channel-id}/messages/{message-id}
{
  "body": {
    "content": "Updated message content"
  }
}
```

**Note:** Only message sender can update their messages

### Delete Message
```http
DELETE /teams/{team-id}/channels/{channel-id}/messages/{message-id}
```

---

## Chats

### List Chats
```http
GET /me/chats
GET /chats
```

### Get Chat
```http
GET /chats/{chat-id}
```

### Create Chat (1:1)
```http
POST /chats
Content-Type: application/json

{
  "chatType": "oneOnOne",
  "members": [
    {
      "@odata.type": "#microsoft.graph.aadUserConversationMember",
      "roles": ["owner"],
      "user@odata.bind": "https://graph.microsoft.com/v1.0/users('{my-user-id}')"
    },
    {
      "@odata.type": "#microsoft.graph.aadUserConversationMember",
      "roles": ["owner"],
      "user@odata.bind": "https://graph.microsoft.com/v1.0/users('{other-user-id}')"
    }
  ]
}
```

### Create Group Chat
```http
POST /chats
{
  "chatType": "group",
  "topic": "Project Discussion",
  "members": [
    {
      "@odata.type": "#microsoft.graph.aadUserConversationMember",
      "roles": ["owner"],
      "user@odata.bind": "https://graph.microsoft.com/v1.0/users('{user-id-1}')"
    },
    {
      "@odata.type": "#microsoft.graph.aadUserConversationMember",
      "roles": ["owner"],
      "user@odata.bind": "https://graph.microsoft.com/v1.0/users('{user-id-2}')"
    }
  ]
}
```

### List Chat Messages
```http
GET /chats/{chat-id}/messages
```

### Send Chat Message
```http
POST /chats/{chat-id}/messages
{
  "body": {
    "content": "Hello! This is a chat message."
  }
}
```

### Send Chat Message with Attachment
```http
POST /chats/{chat-id}/messages
{
  "body": {
    "contentType": "html",
    "content": "Check out this file: <attachment id=\"1\"></attachment>"
  },
  "attachments": [
    {
      "id": "1",
      "contentType": "reference",
      "contentUrl": "https://contoso.sharepoint.com/sites/site/document.docx",
      "name": "document.docx"
    }
  ]
}
```

---

## Members

### List Team Members
```http
GET /teams/{team-id}/members
```

### Add Member
```http
POST /teams/{team-id}/members
Content-Type: application/json

{
  "@odata.type": "#microsoft.graph.aadUserConversationMember",
  "roles": ["member"],
  "user@odata.bind": "https://graph.microsoft.com/v1.0/users('{user-id}')"
}
```

**Roles:** `owner`, `member`

### Add Owner
```http
POST /teams/{team-id}/members
{
  "@odata.type": "#microsoft.graph.aadUserConversationMember",
  "roles": ["owner"],
  "user@odata.bind": "https://graph.microsoft.com/v1.0/users('{user-id}')"
}
```

### Update Member Role
```http
PATCH /teams/{team-id}/members/{membership-id}
{
  "roles": ["owner"]
}
```

### Remove Member
```http
DELETE /teams/{team-id}/members/{membership-id}
```

### List Channel Members
```http
GET /teams/{team-id}/channels/{channel-id}/members
```

---

## Tabs

### List Tabs
```http
GET /teams/{team-id}/channels/{channel-id}/tabs
```

### Get Tab
```http
GET /teams/{team-id}/channels/{channel-id}/tabs/{tab-id}
```

### Add Tab
```http
POST /teams/{team-id}/channels/{channel-id}/tabs
{
  "displayName": "Project Dashboard",
  "teamsApp@odata.bind": "https://graph.microsoft.com/v1.0/appCatalogs/teamsApps/{app-id}",
  "configuration": {
    "entityId": "entity-id",
    "contentUrl": "https://example.com/content",
    "websiteUrl": "https://example.com",
    "removeUrl": "https://example.com/remove"
  }
}
```

**Common app IDs:**
- OneNote: `0d820ecd-def2-4297-adad-78056cde7c78`
- Word: `com.microsoft.teamspace.tab.file.staticviewer.word`
- Excel: `com.microsoft.teamspace.tab.file.staticviewer.excel`
- PowerPoint: `com.microsoft.teamspace.tab.file.staticviewer.powerpoint`
- PDF: `com.microsoft.teamspace.tab.file.staticviewer.pdf`
- Website: `com.microsoft.teamspace.tab.web`

### Update Tab
```http
PATCH /teams/{team-id}/channels/{channel-id}/tabs/{tab-id}
{
  "displayName": "Updated Tab Name"
}
```

### Delete Tab
```http
DELETE /teams/{team-id}/channels/{channel-id}/tabs/{tab-id}
```

---

## Apps

### List Installed Apps
```http
GET /teams/{team-id}/installedApps
```

### Install App
```http
POST /teams/{team-id}/installedApps
{
  "teamsApp@odata.bind": "https://graph.microsoft.com/v1.0/appCatalogs/teamsApps/{app-id}"
}
```

### Uninstall App
```http
DELETE /teams/{team-id}/installedApps/{installation-id}
```

### List Available Apps
```http
GET /appCatalogs/teamsApps
```

---

## Online Meetings

### Create Online Meeting
```http
POST /me/onlineMeetings
Content-Type: application/json

{
  "startDateTime": "2024-01-15T14:00:00Z",
  "endDateTime": "2024-01-15T15:00:00Z",
  "subject": "Team Sync Meeting"
}
```

**Returns:**
- `joinUrl` - Meeting join link
- `joinWebUrl` - Web join URL
- `audioConferencing` - Dial-in information

### Get Online Meeting
```http
GET /me/onlineMeetings/{meeting-id}
```

### Update Online Meeting
```http
PATCH /me/onlineMeetings/{meeting-id}
{
  "subject": "Updated Meeting Subject"
}
```

### Delete Online Meeting
```http
DELETE /me/onlineMeetings/{meeting-id}
```

---

## Call Records

### Get Call Record
```http
GET /communications/callRecords/{call-id}
```

**Required Permissions:** `CallRecords.Read.All`

### List Sessions
```http
GET /communications/callRecords/{call-id}/sessions
```

**Returns:**
- Call quality metrics
- Participants
- Start/end times
- Network information

---

## Presence

### Get User Presence
```http
GET /users/{user-id}/presence
```

**Returns:**
- `availability` - Available, Busy, DoNotDisturb, Away, Offline, etc.
- `activity` - Available, InACall, InAMeeting, Presenting, etc.

**Required Permissions:** `Presence.Read.All`

### Set Presence
```http
POST /users/{user-id}/presence/setPresence
{
  "sessionId": "{session-id}",
  "availability": "Busy",
  "activity": "InAMeeting",
  "expirationDuration": "PT1H"
}
```

**Required Permissions:** `Presence.ReadWrite`

---

## Team Templates

### List Templates
```http
GET /teamwork/teamTemplates
```

**Common templates:**
- `standard` - Standard team
- `educationClass` - Class team
- `educationStaff` - Staff team
- `educationProfessionalLearningCommunity` - PLC team

---

## Activity Feed

### Send Activity Notification
```http
POST /teams/{team-id}/sendActivityNotification
{
  "topic": {
    "source": "text",
    "value": "New Approval Request",
    "webUrl": "https://example.com/approval/123"
  },
  "activityType": "approvalRequired",
  "previewText": {
    "content": "You have a new approval request"
  },
  "recipient": {
    "@odata.type": "microsoft.graph.aadUserNotificationRecipient",
    "userId": "{user-id}"
  }
}
```

---

## Permissions Reference

### Delegated Permissions
- `Team.ReadBasic.All` - Read team names and descriptions
- `Team.Create` - Create teams
- `TeamSettings.Read.All` - Read team settings
- `TeamSettings.ReadWrite.All` - Read and write team settings
- `Channel.ReadBasic.All` - Read channel names and descriptions
- `Channel.Create` - Create channels
- `ChannelMessage.Read.All` - Read channel messages
- `ChannelMessage.Send` - Send channel messages
- `Chat.Read` - Read user's chats
- `Chat.ReadWrite` - Read and write user's chats
- `ChatMessage.Send` - Send chat messages
- `OnlineMeetings.ReadWrite` - Create and read online meetings

### Application Permissions
- `Team.ReadBasic.All` - Read all team names and descriptions
- `TeamSettings.Read.All` - Read all team settings
- `TeamSettings.ReadWrite.All` - Read and write all team settings
- `Channel.ReadBasic.All` - Read all channel names
- `ChannelMessage.Read.All` - Read all channel messages
- `Chat.Read.All` - Read all chats
- `ChatMessage.Read.All` - Read all chat messages
- `OnlineMeetings.Read.All` - Read all online meetings
- `CallRecords.Read.All` - Read all call records

---

## Common Patterns

### Create Team with Channels
```http
# 1. Create team
POST /teams
{...}

# 2. Create channels
POST /teams/{team-id}/channels
{...}
```

### Post Announcement to Multiple Channels
Use batch requests:
```http
POST /$batch
{
  "requests": [
    {"id": "1", "method": "POST", "url": "/teams/{id}/channels/{ch1}/messages", "body": {...}},
    {"id": "2", "method": "POST", "url": "/teams/{id}/channels/{ch2}/messages", "body": {...}}
  ]
}
```

### Monitor Team Activity
```http
# Subscribe to change notifications
POST /subscriptions
{
  "changeType": "created,updated",
  "notificationUrl": "https://webhook.site/...",
  "resource": "/teams/{team-id}/channels/{channel-id}/messages",
  "expirationDateTime": "2024-01-20T00:00:00Z"
}
```

---

## Best Practices

1. **Use resource-specific consent (RSC)** for Teams apps
2. **Respect rate limits** - especially for message sending
3. **Handle throttling** - implement exponential backoff
4. **Use webhooks** for real-time updates (change notifications)
5. **Batch operations** when possible
6. **Cache team/channel metadata**
7. **Validate permissions** before operations
8. **Use delta queries** for message sync
9. **Handle deleted content** appropriately
10. **Test with private channels** (different permission model)

---

## Rate Limits

- Channel messages: Varies by operation
- Chat messages: Throttled per user
- Team creation: Limited to prevent abuse
- Monitor `Retry-After` header
