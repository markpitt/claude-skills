---
title: Core Concepts & Authentication
description: Understanding API fundamentals, authentication methods, and configuration
---

# Core Concepts & Authentication

## Overview

The Home Assistant REST API is a stateless interface for interacting with Home Assistant instances programmatically. It allows you to:

- Query and update entity states
- Call services to control devices
- Retrieve configuration and system information
- Manage events, automations, and scripts
- Access historical data and logs

## Authentication

### Long-Lived Access Tokens (Recommended)

The standard authentication method for REST API access.

#### Getting a Token

1. In Home Assistant UI, click your profile (name in sidebar)
2. Scroll to "Long-Lived Access Tokens"
3. Click "Create Token"
4. Give it a descriptive name (e.g., "API Integration", "Node-RED", "Custom App")
5. Copy the token immediately (you cannot view it again)

#### Using the Token

Include in the `Authorization` header:

```bash
Authorization: Bearer YOUR_LONG_LIVED_ACCESS_TOKEN
```

**Always include** the Content-Type header:

```bash
Content-Type: application/json
```

#### Example Request

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/
```

#### Token Security Best Practices

1. **Never commit tokens** to version control
2. **Use environment variables**: `export HA_TOKEN="your_token"`
3. **Restrict token scope** - use domain-specific or feature-specific tokens when possible
4. **Rotate tokens periodically** (especially if leaked)
5. **Use HTTPS only** in production
6. **Store securely** - treat like passwords
7. **Revoke unused tokens** from Home Assistant UI

### Legacy Authentication (Not Recommended)

API passwords were the original auth method but are deprecated. Use Long-Lived Access Tokens instead.

## Base URL Format

### Local Access

```
http://YOUR_HOME_ASSISTANT_IP:8123/api/ENDPOINT
```

### Remote Access

```
https://YOUR_DOMAIN:8123/api/ENDPOINT
```

Or use Home Assistant Cloud:

```
https://YOUR_HOME_ASSISTANT_NAME.ui.nabu.casa/api/ENDPOINT
```

### URL Parameters & Formatting

- Paths are case-sensitive
- Entity IDs use format: `domain.name`
- Timestamps use ISO 8601 format
- Query parameters use standard URL encoding

## Response Status Codes

| Code | Meaning | When Encountered |
|------|---------|------------------|
| `200` | Success | Request completed successfully |
| `201` | Created | New state created via POST |
| `204` | No Content | Some successful requests return no body |
| `400` | Bad Request | Malformed JSON or missing required parameters |
| `401` | Unauthorized | Missing, invalid, or expired token |
| `404` | Not Found | Entity, endpoint, or service doesn't exist |
| `405` | Method Not Allowed | Wrong HTTP method for endpoint (GET vs POST) |
| `409` | Conflict | State conflict or invalid operation |
| `429` | Too Many Requests | Rate limited - implement backoff |
| `500` | Server Error | Home Assistant internal error |
| `503` | Service Unavailable | Home Assistant starting up or restarting |

### Handling Error Responses

```json
{
  "error": "Unauthorized",
  "message": "Invalid authentication provided"
}
```

Always check status code before processing response:

```python
if response.status_code == 200:
    data = response.json()
elif response.status_code == 401:
    print("Authentication failed - check your token")
elif response.status_code == 404:
    print("Entity not found")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
```

## Entity IDs & Domains

### Entity ID Format

```
<domain>.<name>
```

Examples:
- `light.kitchen` - Light entity in kitchen
- `sensor.temperature_outside` - Sensor entity for outdoor temperature
- `automation.morning_routine` - Automation named morning_routine

### Common Domains

| Domain | Purpose | Example ID |
|--------|---------|-----------|
| `light` | Smart lights | `light.bedroom` |
| `switch` | On/off switches | `switch.coffee_maker` |
| `sensor` | Read-only sensors | `sensor.temperature` |
| `binary_sensor` | On/off sensors | `binary_sensor.motion` |
| `climate` | Thermostats/HVAC | `climate.living_room` |
| `cover` | Blinds, doors, shutters | `cover.garage_door` |
| `lock` | Smart locks | `lock.front_door` |
| `fan` | Smart fans | `fan.ceiling` |
| `camera` | Cameras | `camera.front_door` |
| `media_player` | Media devices | `media_player.tv` |
| `person` | Location tracking | `person.john` |
| `device_tracker` | Device tracking | `device_tracker.john_phone` |
| `automation` | Automations | `automation.evening_lights` |
| `script` | Scripts | `script.bedtime` |
| `scene` | Scenes | `scene.movie_time` |
| `group` | Entity groups | `group.all_lights` |
| `input_boolean` | Input helper (boolean) | `input_boolean.guest_mode` |
| `input_number` | Input helper (number) | `input_number.offset` |
| `input_text` | Input helper (text) | `input_text.status` |
| `input_select` | Input helper (select) | `input_select.mode` |
| `input_datetime` | Input helper (datetime) | `input_datetime.alarm` |
| `timer` | Timers | `timer.laundry` |
| `counter` | Counters | `counter.visitors` |
| `zone` | Geographic zones | `zone.home` |
| `weather` | Weather data | `weather.forecast` |
| `sun` | Sun position | `sun.sun` |

See `resources/entity-types.md` for detailed information about each entity type.

## HTTP Methods

### GET - Retrieve Data

Fetch data without modifying state. Safe and idempotent.

```bash
GET /api/states
GET /api/states/light.kitchen
GET /api/services
GET /api/config
GET /api/history/period/2025-01-15T00:00:00+00:00
```

### POST - Create or Execute

Create new resources or execute actions. May have side effects.

```bash
POST /api/services/light/turn_on
POST /api/states/sensor.custom
POST /api/events/my_event
POST /api/template
```

### DELETE - Remove

Delete or remove resources.

```bash
DELETE /api/states/light.old_light
```

## Request Format

### JSON Body

Most requests use JSON for the request body:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "light.kitchen", "brightness": 200}' \
  http://localhost:8123/api/services/light/turn_on
```

### Query Parameters

Some requests use query strings:

```bash
GET /api/history/period/2025-01-15T00:00:00+00:00?filter_entity_id=light.kitchen&end_time=2025-01-15T23:59:59+00:00
```

## Response Format

All responses are JSON unless otherwise specified (e.g., error logs as text, camera images as binary).

### Success Response

```json
{
  "entity_id": "light.kitchen",
  "state": "on",
  "attributes": {
    "brightness": 200,
    "friendly_name": "Kitchen Light"
  },
  "last_changed": "2025-01-15T10:30:00.000000+00:00",
  "last_updated": "2025-01-15T10:30:00.000000+00:00",
  "context": {
    "id": "abc123",
    "parent_id": null,
    "user_id": null
  }
}
```

### Error Response

```json
{
  "error": "Entity not found",
  "message": "No entity found for domain 'light' and service 'nonexistent'"
}
```

## Common Patterns

### Multiple Entity Selection

Target specific entities by passing arrays:

```json
{
  "entity_id": ["light.kitchen", "light.living_room", "light.bedroom"]
}
```

Target all entities in a domain:

```json
{
  "entity_id": "all"
}
```

### Batch Operations

For complex multi-step operations, use Home Assistant Scripts instead of multiple API calls:

1. Create a script in `automations.yaml`:
```yaml
script:
  movie_mode:
    sequence:
      - service: light.turn_off
        entity_id: group.all_lights
      - service: light.turn_on
        data:
          entity_id: light.projector
          brightness: 50
```

2. Call via API:
```bash
POST /api/services/script/turn_on
{"entity_id": "script.movie_mode"}
```

This is more efficient than multiple sequential API calls.

### Conditional Requests

Use templates to compute values server-side rather than client-side:

```bash
POST /api/template
{
  "template": "{% if states('light.kitchen') == 'on' %}on{% else %}off{% endif %}"
}
```

See `resources/templates.md` for advanced template examples.

## Rate Limiting

Home Assistant does not enforce API rate limits, but best practices:

1. **Cache data** when possible instead of polling frequently
2. **Use WebSocket API** for real-time updates instead of polling
3. **Implement exponential backoff** for failed requests
4. **Batch operations** when possible (multiple entities in one call)

## Timeout & Connection

### Recommended Settings

- **Connection timeout**: 10 seconds
- **Read timeout**: 30 seconds
- **Retry attempts**: 3 with exponential backoff

### Example Python Retry Logic

```python
import requests
import time

def api_call_with_retry(url, method='GET', json=None, max_retries=3):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    for attempt in range(max_retries):
        try:
            if method == 'GET':
                resp = requests.get(url, headers=headers, timeout=10)
            else:
                resp = requests.post(url, json=json, headers=headers, timeout=10)
            
            resp.raise_for_status()
            return resp.json()
        
        except requests.exceptions.RequestException as e:
            if attempt == max_retries - 1:
                raise
            wait = 2 ** attempt  # exponential backoff
            print(f"Retry {attempt + 1} after {wait}s...")
            time.sleep(wait)
```

## Service vs State Calls

### Use `/api/services/` for Device Control

Calls services (controls actual devices):

```bash
POST /api/services/light/turn_on
```

**Advantages:**
- Actually controls devices
- Respects automation rules
- Returns proper response data
- Proper error handling

### Use `/api/states/` for State Modifications

Directly modifies internal state (NOT device control):

```bash
POST /api/states/light.virtual_light
```

**Only use for:**
- Creating virtual entities
- Updating input helpers
- Custom sensor updates
- Testing

**Do NOT use for:**
- Turning on/off real devices
- Changing physical device settings

## Timestamps

### Format

All timestamps are ISO 8601 format with timezone:

```
2025-01-15T10:30:00.000000+00:00
2025-01-15T10:30:00+00:00
2025-01-15T10:30:00Z
```

### Timezone Handling

- UTC timestamps end with `+00:00` or `Z`
- Local timestamps include the timezone offset
- Always be aware of Home Assistant's configured timezone
- Convert client times to UTC for consistency

### Python DateTime Handling

```python
from datetime import datetime, timezone, timedelta

# Get current time in UTC
now_utc = datetime.now(timezone.utc)

# Format for API
timestamp = now_utc.isoformat()  # 2025-01-15T10:30:00+00:00

# Parse from API
response = requests.get(...)
state = response.json()
changed = datetime.fromisoformat(state['last_changed'])
```

## Attributes vs State

Every entity has:

- **State**: Current status (on, off, 22.5, etc.)
- **Attributes**: Additional metadata

```json
{
  "entity_id": "light.kitchen",
  "state": "on",              // Main state
  "attributes": {             // Additional info
    "brightness": 200,
    "color_temp": 400,
    "friendly_name": "Kitchen Light",
    "supported_features": 191
  }
}
```

When querying, access appropriately:

```python
state = response['state']              # "on"
brightness = response['attributes']['brightness']  # 200
```

---

**Next Steps:**
- Choose an entity type → `resources/entity-types.md`
- Discover services → `resources/service-reference.md`
- Call the service → `resources/examples.md`
