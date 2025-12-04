---
title: System & Configuration Endpoints
description: Configuration queries, system management, and administrative endpoints
---

# System & Configuration Endpoints

## Configuration Endpoints

### GET Configuration

Retrieve the current Home Assistant configuration:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/config
```

**Response:**
```json
{
  "latitude": 51.5074,
  "longitude": -0.1278,
  "elevation": 30,
  "unit_system": {
    "length": "km",
    "mass": "kg",
    "temperature": "°C",
    "volume": "L"
  },
  "location_name": "Home",
  "time_zone": "Europe/London",
  "components": [
    "homeassistant",
    "api",
    "http",
    "websocket_api",
    "light",
    "switch",
    "climate",
    "automation",
    "script"
  ],
  "version": "2025.1.0",
  "config_dir": "/config",
  "whitelist_external_dirs": [
    "/media",
    "/tmp"
  ],
  "allowlist_external_dirs": [
    "/media",
    "/tmp"
  ],
  "allowlist_external_urls": []
}
```

**Use Cases:**
- Get Home Assistant location
- Determine timezone
- Check loaded components
- Get HA version
- Access unit system settings

### Check Configuration Validity

Validate Home Assistant configuration files:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/config/core/check_config
```

**Success Response (200):**
```json
{
  "result": "valid",
  "errors": null
}
```

**Error Response (200 with errors):**
```json
{
  "result": "invalid",
  "errors": [
    "Error in automation.yaml line 5: unknown integration 'bad_domain'"
  ]
}
```

**Use Cases:**
- Validate configuration before restart
- Check if recent config changes are valid
- Identify configuration syntax errors

## API Status & Information

### GET API Status

Check if API is running and get version info:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/
```

**Response:**
```json
{
  "message": "API running."
}
```

**Use Cases:**
- Verify API connectivity
- Basic health check
- Confirm authentication works

## System Management Services

### Restart Home Assistant

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/services/homeassistant/restart
```

**Important Notes:**
- Blocks until restart completes
- Request may timeout if restart takes > 30 seconds
- Use with care in production
- All connections will be terminated

### Stop Home Assistant

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/services/homeassistant/stop
```

**Warning:** Stops Home Assistant entirely. Will need manual restart.

### Reload Core Configuration

Reload `configuration.yaml` without restarting:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/services/homeassistant/reload_core_config
```

**Reloads:**
- Core YAML settings (zones, automation, script, groups, etc.)
- Automations
- Scripts
- Groups
- Input helpers

**Does NOT reload:**
- Custom integrations
- Some platform configurations

### Reload Config Entry

Reload a specific integration without restarting:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entry_id": "config_entry_id"}' \
  http://localhost:8123/api/services/homeassistant/reload_config_entry
```

To find `entry_id`, use the UI or check the config database.

### Update Entity

Update entity metadata without restarting:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "sensor.my_sensor",
    "name": "New Name",
    "icon": "mdi:temperature-celsius",
    "disabled_by": null
  }' \
  http://localhost:8123/api/services/homeassistant/update_entity
```

**Updateable Fields:**
- `name` - Display name
- `icon` - Mdi icon name
- `disabled_by` - `"user"` to disable, `null` to enable

### Set Location

Update Home Assistant's location:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 51.5074,
    "longitude": -0.1278,
    "elevation": 30
  }' \
  http://localhost:8123/api/services/homeassistant/set_location
```

## Components & Services Discovery

### GET Loaded Components

List all loaded integrations:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/components
```

**Response:**
```json
[
  "homeassistant",
  "api",
  "http",
  "websocket_api",
  "light",
  "switch",
  "climate",
  "cover",
  "automation",
  "script",
  "scene",
  "group",
  "history",
  "logbook",
  "system_log",
  "config"
]
```

**Use Cases:**
- Check if integration is loaded
- Verify all expected integrations loaded
- Build conditional logic based on loaded components

### GET Available Services

List all available services by domain:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/services
```

**Response Structure:**
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
      },
      "turn_off": {
        "name": "Turn off",
        "description": "Turn off one or more lights",
        "fields": {
          "entity_id": {
            "description": "Name(s) of entities",
            "example": "light.kitchen"
          }
        }
      }
    }
  }
]
```

**Use Cases:**
- Discover available services dynamically
- Find parameter names and descriptions
- Build UI from available services
- Validate service exists before calling

## Events Endpoints

### GET Listening Event Types

List all event types the system is listening for:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/events
```

**Response:**
```json
[
  "homeassistant_start",
  "homeassistant_stop",
  "state_changed",
  "service_registered",
  "call_service",
  "service_executed",
  "component_loaded",
  "persistent_notifications_updated",
  "custom_event_1",
  "motion_detected"
]
```

### Fire Custom Event

Trigger a custom event:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"temperature": 22.5, "humidity": 65}' \
  http://localhost:8123/api/events/sensor_update
```

**Use Cases:**
- Trigger automations from external systems
- Send data from webhooks
- Create custom integrations

## Error Log & System Status

### GET Error Log

Retrieve the error log as plain text:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8123/api/error_log
```

**Response:** Plain text log entries

**Use Cases:**
- Check for recent errors
- Diagnose integration issues
- Monitor system health

### GET System Information

Get system CPU and memory info (if system_monitor integration is loaded):

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/states/sensor.processor_use
```

## Logbook Endpoints

### GET Logbook Entries

Retrieve activity log entries:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  'http://localhost:8123/api/logbook/2025-01-15T00:00:00+00:00'
```

**Parameters:**
- `entity` (optional) - Filter by entity ID
- `end_time` (optional) - End timestamp

**Response:**
```json
[
  {
    "entity_id": "light.kitchen",
    "state": "on",
    "last_changed": "2025-01-15T10:30:00.000000+00:00",
    "last_updated": "2025-01-15T10:30:00.000000+00:00"
  },
  {
    "name": "John",
    "message": "turned on light.kitchen",
    "source": "user",
    "when": "2025-01-15T10:30:00.000000+00:00"
  }
]
```

**Use Cases:**
- Track entity history
- See user actions
- Monitor automations
- Audit trails

## Python Examples

### Get Configuration

```python
import requests

def get_ha_config(base_url, token):
    """Get Home Assistant configuration"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(
        f"{base_url}/api/config",
        headers=headers
    )
    response.raise_for_status()
    return response.json()

config = get_ha_config("http://localhost:8123", "token")
print(f"Timezone: {config['time_zone']}")
print(f"HA Version: {config['version']}")
print(f"Location: {config['location_name']}")
```

### Check Configuration Validity

```python
def validate_config(base_url, token):
    """Check if configuration is valid"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        f"{base_url}/api/config/core/check_config",
        headers=headers
    )
    response.raise_for_status()
    
    result = response.json()
    if result['result'] == 'valid':
        print("Configuration is valid")
        return True
    else:
        print("Configuration errors:")
        for error in result['errors']:
            print(f"  - {error}")
        return False

validate_config("http://localhost:8123", "token")
```

### Discover Available Services

```python
def list_available_services(base_url, token):
    """List all available services"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(
        f"{base_url}/api/services",
        headers=headers
    )
    response.raise_for_status()
    
    services = response.json()
    for service_domain in services:
        domain = service_domain['domain']
        services_list = service_domain['services']
        print(f"\n{domain}:")
        for service_name in services_list.keys():
            print(f"  - {service_name}")

list_available_services("http://localhost:8123", "token")
```

### Reload Configuration

```python
def reload_core_config(base_url, token):
    """Reload core configuration without restart"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("Reloading configuration...")
    response = requests.post(
        f"{base_url}/api/services/homeassistant/reload_core_config",
        headers=headers,
        json={}
    )
    response.raise_for_status()
    print("Configuration reloaded")

reload_core_config("http://localhost:8123", "token")
```

---

**Related Resources:**
- `resources/core-concepts.md` - API fundamentals
- `resources/service-reference.md` - Service calls
- `resources/examples.md` - Practical examples
