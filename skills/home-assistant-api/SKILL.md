---
name: home-assistant-api
description: Comprehensive skill for interacting with the Home Assistant REST API. Covers all endpoints including states, services, events, history, configuration, templates, error logs, webhooks, and camera proxies. Use when building integrations, automating smart home devices, querying entity states, calling services, or managing Home Assistant instances programmatically.
version: 1.0
---

# Home Assistant REST API

This skill provides comprehensive coverage of the Home Assistant REST API for managing and interacting with Home Assistant instances programmatically.

## Overview

The Home Assistant REST API allows you to:
- Query and update entity states
- Call services to control devices
- Retrieve configuration and system information
- Access historical data
- Render templates
- Fire events
- Access error logs and debug information
- Proxy camera streams

## Authentication

All API requests require authentication using a Long-Lived Access Token.

### Getting an Access Token

1. In Home Assistant UI, go to your profile (click your name in sidebar)
2. Scroll to "Long-Lived Access Tokens"
3. Click "Create Token"
4. Give it a name and copy the token

### Using the Token

Include the token in the `Authorization` header:

```bash
Authorization: Bearer YOUR_LONG_LIVED_ACCESS_TOKEN
```

All requests should also include:

```bash
Content-Type: application/json
```

## Base URL Format

```
http://YOUR_HOME_ASSISTANT_IP:8123/api/ENDPOINT
```

Or for HTTPS:

```
https://YOUR_DOMAIN:8123/api/ENDPOINT
```

## API Endpoints

### 1. API Status

**GET /api/**

Check if the API is running and get a welcome message.

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/
```

Response:
```json
{
  "message": "API running."
}
```

---

### 2. Configuration

**GET /api/config**

Returns the current Home Assistant configuration.

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/config
```

Response includes:
- `latitude` / `longitude` - Location
- `elevation` - Elevation above sea level
- `unit_system` - Unit system (metric/imperial)
- `location_name` - Name of location
- `time_zone` - Time zone
- `components` - List of loaded components
- `version` - Home Assistant version
- `config_dir` - Configuration directory path
- `whitelist_external_dirs` - Whitelisted directories
- `allowlist_external_dirs` - Allowed external directories
- `allowlist_external_urls` - Allowed external URLs

---

### 3. Events

**GET /api/events**

Returns a list of all event types that are being listened for.

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/events
```

**POST /api/events/<event_type>**

Fire an event with the specified event type.

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "light.kitchen", "state": "on"}' \
  http://localhost:8123/api/events/my_custom_event
```

---

### 4. Services

**GET /api/services**

Returns a list of all available services grouped by domain.

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/services
```

Response structure:
```json
[
  {
    "domain": "light",
    "services": {
      "turn_on": {
        "name": "Turn on",
        "description": "Turn on one or more lights",
        "fields": {
          "entity_id": {
            "description": "Name(s) of entities",
            "example": "light.kitchen"
          },
          "brightness": {
            "description": "Brightness (0-255)",
            "example": 120
          }
        }
      }
    }
  }
]
```

**POST /api/services/<domain>/<service>**

Call a service within a specific domain. This endpoint communicates with the actual device.

```bash
# Turn on a light
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "light.kitchen"}' \
  http://localhost:8123/api/services/light/turn_on

# Turn on light with brightness and color
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "light.bedroom", "brightness": 200, "rgb_color": [255, 0, 0]}' \
  http://localhost:8123/api/services/light/turn_on

# Set thermostat temperature
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "climate.living_room", "temperature": 22}' \
  http://localhost:8123/api/services/climate/set_temperature
```

**Service with Response Data**

Some services return response data. Add `?return_response=true` to retrieve it:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "sensor.weather"}' \
  'http://localhost:8123/api/services/weather/get_forecast?return_response=true'
```

Common service domains:
- `light` - Control lights (turn_on, turn_off, toggle)
- `switch` - Control switches
- `climate` - Control thermostats and HVAC
- `cover` - Control covers/blinds (open, close, stop)
- `lock` - Control locks
- `media_player` - Control media players
- `scene` - Activate scenes
- `script` - Run scripts
- `automation` - Control automations (trigger, turn_on, turn_off)
- `notify` - Send notifications
- `homeassistant` - System services (restart, stop, reload_config_entry)

---

### 5. States

**GET /api/states**

Returns an array of all entity states.

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/states
```

**GET /api/states/<entity_id>**

Get the state of a specific entity.

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/states/light.kitchen
```

Response:
```json
{
  "entity_id": "light.kitchen",
  "state": "on",
  "attributes": {
    "brightness": 200,
    "friendly_name": "Kitchen Light",
    "supported_features": 1
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

**POST /api/states/<entity_id>**

Update or create a state representation. **Important**: This updates the state in Home Assistant's internal representation only and does NOT communicate with the actual device. To control devices, use `POST /api/services/<domain>/<service>`.

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"state": "on", "attributes": {"brightness": 180}}' \
  http://localhost:8123/api/states/light.virtual_light
```

Use cases for POST /api/states:
- Creating virtual/template entities
- Updating input helpers
- Setting states for custom integrations

**DELETE /api/states/<entity_id>**

Remove an entity from the state machine.

```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/states/sensor.old_sensor
```

---

### 6. History

**GET /api/history/period/<timestamp>**

Query historical state data for entities.

Parameters:
- `<timestamp>` - ISO 8601 timestamp for the start time
- `filter_entity_id` - (optional) Comma-separated list of entity IDs
- `end_time` - (optional) ISO 8601 timestamp for end time
- `minimal_response` - (optional) Return minimal data
- `no_attributes` - (optional) Exclude attributes
- `significant_changes_only` - (optional) Only return significant state changes

```bash
# Get all history since timestamp
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  'http://localhost:8123/api/history/period/2025-01-15T00:00:00+00:00'

# Get history for specific entity
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  'http://localhost:8123/api/history/period/2025-01-15T00:00:00+00:00?filter_entity_id=sensor.temperature'

# Get history with end time
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  'http://localhost:8123/api/history/period/2025-01-15T00:00:00+00:00?end_time=2025-01-15T23:59:59+00:00&filter_entity_id=light.kitchen'
```

Response is an array of entity history arrays:
```json
[
  [
    {
      "entity_id": "sensor.temperature",
      "state": "22.5",
      "attributes": {
        "unit_of_measurement": "°C",
        "friendly_name": "Temperature"
      },
      "last_changed": "2025-01-15T10:00:00+00:00",
      "last_updated": "2025-01-15T10:00:00+00:00"
    }
  ]
]
```

---

### 7. Logbook

**GET /api/logbook/<timestamp>**

Get logbook entries starting from the specified timestamp.

Parameters:
- `<timestamp>` - ISO 8601 timestamp
- `entity` - (optional) Filter by entity ID
- `end_time` - (optional) End timestamp

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  'http://localhost:8123/api/logbook/2025-01-15T00:00:00+00:00'
```

---

### 8. Error Log

**GET /api/error_log**

Retrieve the current error log as plain text.

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8123/api/error_log
```

Returns plain text error log content.

---

### 9. Camera Proxy

**GET /api/camera_proxy/<camera_entity_id>**

Proxy image from a camera entity.

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8123/api/camera_proxy/camera.front_door
```

Returns the camera image data.

---

### 10. Calendars

**GET /api/calendars**

Get list of calendar entities.

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/calendars
```

**GET /api/calendars/<calendar_entity_id>**

Get events for a specific calendar.

Parameters:
- `start` - ISO 8601 start datetime
- `end` - ISO 8601 end datetime

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  'http://localhost:8123/api/calendars/calendar.personal?start=2025-01-15T00:00:00Z&end=2025-01-31T23:59:59Z'
```

---

### 11. Template Rendering

**POST /api/template**

Render a Jinja2 template using Home Assistant's template engine.

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"template": "The temperature is {{ states(\"sensor.temperature\") }}°C"}' \
  http://localhost:8123/api/template
```

Response:
```json
{
  "result": "The temperature is 22.5°C"
}
```

Template examples:
```bash
# Get entity state
{"template": "{{ states('light.kitchen') }}"}

# Get attribute
{"template": "{{ state_attr('light.kitchen', 'brightness') }}"}

# Conditional logic
{"template": "{% if is_state('light.kitchen', 'on') %}Light is on{% else %}Light is off{% endif %}"}

# Math operations
{"template": "{{ states('sensor.temperature') | float + 5 }}"}
```

---

### 12. Configuration Validation

**POST /api/config/core/check_config**

Validate the Home Assistant configuration files.

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/config/core/check_config
```

Response:
```json
{
  "result": "valid",
  "errors": null
}
```

Or if there are errors:
```json
{
  "result": "invalid",
  "errors": "Error in configuration.yaml..."
}
```

---

### 13. Components

**GET /api/components**

Get a list of all loaded components/integrations.

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/components
```

Response is an array of component names:
```json
["homeassistant", "api", "http", "websocket_api", "light", "switch", ...]
```

---

### 14. Intent Handling

**POST /api/intent/handle**

Handle a conversation/intent request. Requires `intent:` in configuration.yaml.

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Turn on the kitchen light"}' \
  http://localhost:8123/api/intent/handle
```

---

### 15. Webhooks

**POST /api/webhook/<webhook_id>**

Trigger a webhook automation or integration.

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"temperature": 22.5, "humidity": 65}' \
  http://localhost:8123/api/webhook/my_webhook_id
```

Note: Webhooks typically don't require authentication tokens.

---

## Common Patterns

### Get All Lights

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/states | jq '[.[] | select(.entity_id | startswith("light."))]'
```

### Turn On All Lights in a Group

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "group.living_room_lights"}' \
  http://localhost:8123/api/services/light/turn_on
```

### Check if Someone is Home

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/states/person.john_doe | jq '.state'
```

### Get Temperature Sensor Reading

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/states/sensor.temperature | jq '.state'
```

### Send a Notification

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Door opened!", "title": "Security Alert"}' \
  http://localhost:8123/api/services/notify/mobile_app_iphone
```

### Run an Automation

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "automation.morning_routine"}' \
  http://localhost:8123/api/services/automation/trigger
```

### Restart Home Assistant

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/services/homeassistant/restart
```

---

## Entity ID Patterns

Common entity ID prefixes:
- `light.*` - Lights
- `switch.*` - Switches
- `sensor.*` - Sensors
- `binary_sensor.*` - Binary sensors (on/off)
- `climate.*` - Climate devices (thermostats, HVAC)
- `cover.*` - Covers (blinds, garage doors)
- `fan.*` - Fans
- `lock.*` - Locks
- `media_player.*` - Media players
- `camera.*` - Cameras
- `alarm_control_panel.*` - Alarm systems
- `automation.*` - Automations
- `script.*` - Scripts
- `scene.*` - Scenes
- `person.*` - Person tracking
- `device_tracker.*` - Device tracking
- `weather.*` - Weather
- `sun.*` - Sun data
- `zone.*` - Zones
- `input_boolean.*` - Input booleans
- `input_number.*` - Input numbers
- `input_text.*` - Input text
- `input_select.*` - Input selects
- `input_datetime.*` - Input datetimes
- `timer.*` - Timers
- `counter.*` - Counters

---

## Response Codes

- `200` - Success
- `201` - Created (for POST /api/states)
- `400` - Bad Request (malformed JSON or missing parameters)
- `401` - Unauthorized (invalid or missing token)
- `404` - Not Found (entity or endpoint doesn't exist)
- `405` - Method Not Allowed (wrong HTTP method)
- `500` - Internal Server Error

---

## Error Handling

Always check the response status code and handle errors appropriately:

```python
import requests

headers = {
    "Authorization": "Bearer YOUR_TOKEN",
    "Content-Type": "application/json"
}

response = requests.get("http://localhost:8123/api/states/light.kitchen", headers=headers)

if response.status_code == 200:
    state = response.json()
    print(f"Light state: {state['state']}")
elif response.status_code == 401:
    print("Authentication failed - check your token")
elif response.status_code == 404:
    print("Entity not found")
else:
    print(f"Error: {response.status_code} - {response.text}")
```

---

## Best Practices

1. **Use Service Calls for Device Control**: Always use `POST /api/services/<domain>/<service>` to control actual devices, not `POST /api/states/<entity_id>`

2. **Cache Service Discovery**: Query `/api/services` once and cache the results rather than calling it repeatedly

3. **Filter History Queries**: Use `filter_entity_id` and time ranges to limit history queries for better performance

4. **Handle Rate Limits**: Implement exponential backoff for failed requests

5. **Use Templates for Complex Queries**: The template endpoint can compute complex values server-side

6. **Validate Configurations**: Use `/api/config/core/check_config` before restarting

7. **Secure Your Token**: Never commit tokens to version control; use environment variables

8. **Use HTTPS**: Always use HTTPS in production environments

9. **Monitor Error Logs**: Regularly check `/api/error_log` for issues

10. **Leverage Webhooks**: For external integrations, webhooks are simpler than polling

---

## Python Example

```python
import requests
import json

class HomeAssistantAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url.rstrip('/')
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def get_states(self):
        """Get all entity states"""
        response = requests.get(f"{self.base_url}/api/states", headers=self.headers)
        return response.json()

    def get_state(self, entity_id):
        """Get state of specific entity"""
        response = requests.get(f"{self.base_url}/api/states/{entity_id}", headers=self.headers)
        return response.json()

    def call_service(self, domain, service, data=None):
        """Call a service"""
        url = f"{self.base_url}/api/services/{domain}/{service}"
        response = requests.post(url, headers=self.headers, json=data or {})
        return response.json()

    def turn_on_light(self, entity_id, brightness=None, rgb_color=None):
        """Turn on a light with optional parameters"""
        data = {"entity_id": entity_id}
        if brightness:
            data["brightness"] = brightness
        if rgb_color:
            data["rgb_color"] = rgb_color
        return self.call_service("light", "turn_on", data)

    def turn_off_light(self, entity_id):
        """Turn off a light"""
        return self.call_service("light", "turn_off", {"entity_id": entity_id})

    def render_template(self, template):
        """Render a Jinja2 template"""
        response = requests.post(
            f"{self.base_url}/api/template",
            headers=self.headers,
            json={"template": template}
        )
        return response.json()

# Usage
ha = HomeAssistantAPI("http://localhost:8123", "YOUR_TOKEN")

# Turn on kitchen light
ha.turn_on_light("light.kitchen", brightness=200)

# Get temperature
temp = ha.get_state("sensor.temperature")
print(f"Temperature: {temp['state']}°C")

# Use template
result = ha.render_template("{{ states('light.kitchen') }}")
print(result)
```

---

## Node.js Example

```javascript
const axios = require('axios');

class HomeAssistantAPI {
    constructor(baseUrl, token) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    async getStates() {
        const response = await axios.get(`${this.baseUrl}/api/states`, { headers: this.headers });
        return response.data;
    }

    async getState(entityId) {
        const response = await axios.get(`${this.baseUrl}/api/states/${entityId}`, { headers: this.headers });
        return response.data;
    }

    async callService(domain, service, data = {}) {
        const response = await axios.post(
            `${this.baseUrl}/api/services/${domain}/${service}`,
            data,
            { headers: this.headers }
        );
        return response.data;
    }

    async turnOnLight(entityId, options = {}) {
        const data = { entity_id: entityId, ...options };
        return this.callService('light', 'turn_on', data);
    }
}

// Usage
const ha = new HomeAssistantAPI('http://localhost:8123', 'YOUR_TOKEN');

// Turn on light
await ha.turnOnLight('light.kitchen', { brightness: 200 });

// Get states
const states = await ha.getStates();
console.log(states);
```

---

## Resources

For additional information, see:
- `resources/examples.md` - More code examples
- `resources/entity-types.md` - Detailed entity type reference
- `resources/service-reference.md` - Common service calls by domain

## Additional References

- [Official REST API Documentation](https://developers.home-assistant.io/docs/api/rest/)
- [Home Assistant API Integration](https://www.home-assistant.io/integrations/api/)
- [WebSocket API](https://developers.home-assistant.io/docs/api/websocket/) - Recommended for real-time updates
- [Home Assistant Community](https://community.home-assistant.io/)

## Notes

- The REST API is stable but not receiving new features; WebSocket API is recommended for new integrations
- All timestamps should be in ISO 8601 format
- Entity IDs are case-sensitive
- Service data parameters vary by domain and service - use `GET /api/services` to discover available parameters
- Some services support response data - add `?return_response=true` to retrieve it
