---
title: State Management
description: Querying, updating, and monitoring entity states
---

# State Management

## Understanding Entity States

Every entity in Home Assistant has:

- **State**: The current value (on, off, 22.5°C, etc.)
- **Attributes**: Additional metadata (brightness, color, friendly name, etc.)
- **Last Changed**: When the state changed
- **Last Updated**: When any attribute changed
- **Context**: Information about who/what triggered the change

### State Object Structure

```json
{
  "entity_id": "light.kitchen",
  "state": "on",
  "attributes": {
    "brightness": 200,
    "color_temp": 400,
    "friendly_name": "Kitchen Light",
    "icon": "mdi:light-on",
    "supported_features": 191
  },
  "last_changed": "2025-01-15T10:30:00.000000+00:00",
  "last_updated": "2025-01-15T10:30:00.000000+00:00",
  "context": {
    "id": "abc123def456",
    "parent_id": null,
    "user_id": "user_123"
  }
}
```

## Querying States

### GET All States

Returns every entity's current state:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/states
```

**Response:** Array of state objects for all entities (~1000s of entities)

**Performance Notes:**
- Returns large JSON (~100KB+ for typical installations)
- Cache results when possible
- Filter results client-side if only checking a few entities

### GET Specific Entity State

Returns state of a single entity:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/states/light.kitchen
```

**Response:**
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

**Error Response (404):**
```json
{
  "error": "Entity not found",
  "message": "No entity found for domain light and name kitchen"
}
```

### Filtering All States

Use `jq` to filter states by domain:

```bash
# Get all lights
curl -s http://localhost:8123/api/states \
  -H "Authorization: Bearer YOUR_TOKEN" | \
  jq '[.[] | select(.entity_id | startswith("light."))]'

# Get all on lights
curl -s http://localhost:8123/api/states \
  -H "Authorization: Bearer YOUR_TOKEN" | \
  jq '[.[] | select(.entity_id | startswith("light.") and .state == "on")]'

# Get lights with specific attribute
curl -s http://localhost:8123/api/states \
  -H "Authorization: Bearer YOUR_TOKEN" | \
  jq '[.[] | select(.attributes.battery_level != null)]'
```

## Updating States

### POST - Update or Create State

Modifies an entity's state directly in Home Assistant's state machine. **Does NOT control actual devices** - use `/api/services/` for device control instead.

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "state": "on",
    "attributes": {
      "brightness": 180,
      "color_temp": 350,
      "friendly_name": "Virtual Light"
    }
  }' \
  http://localhost:8123/api/states/light.virtual_light
```

**Response (201 Created):**
```json
{
  "entity_id": "light.virtual_light",
  "state": "on",
  "attributes": {
    "brightness": 180,
    "color_temp": 350,
    "friendly_name": "Virtual Light"
  },
  "last_changed": "2025-01-15T10:35:00.000000+00:00",
  "last_updated": "2025-01-15T10:35:00.000000+00:00",
  "context": {
    "id": "new_context_id",
    "parent_id": null,
    "user_id": null
  }
}
```

### Valid Use Cases for POST /api/states

- Creating virtual/template entities
- Updating input helpers
- Setting states for custom integrations
- Testing and development
- Updating sensor data from external sources

**Example: Create Custom Sensor**

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "state": "12.5",
    "attributes": {
      "unit_of_measurement": "°C",
      "friendly_name": "External Temperature",
      "icon": "mdi:thermometer"
    }
  }' \
  http://localhost:8123/api/states/sensor.external_temperature
```

**Example: Update Input Number**

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"state": "42.5"}' \
  http://localhost:8123/api/states/input_number.temperature_offset
```

### Partial Updates

You don't need to provide all attributes - only what changed:

```bash
# Update only state
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
  -d '{"state": "off"}' \
  http://localhost:8123/api/states/light.virtual_light

# Update only specific attribute
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
  -d '{"attributes": {"brightness": 100}}' \
  http://localhost:8123/api/states/light.virtual_light
```

## Deleting States

### DELETE - Remove Entity State

Removes an entity from Home Assistant's state machine:

```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/states/sensor.old_sensor
```

**Response (200 OK):**
```json
{
  "entity_id": "sensor.old_sensor",
  "state": "12.5",
  "attributes": {
    "unit_of_measurement": "°C"
  },
  "last_changed": "2025-01-10T12:00:00.000000+00:00",
  "last_updated": "2025-01-14T12:00:00.000000+00:00",
  "context": {
    "id": "deleted_context",
    "parent_id": null,
    "user_id": null
  }
}
```

**Use Cases:**
- Cleaning up old temporary entities
- Removing entities created for testing
- Removing failed custom sensor integrations

**Note:** Entities managed by integrations will recreate themselves.

## State Attributes Reference

### Common Attributes (All Entities)

```json
{
  "friendly_name": "Entity Display Name",
  "icon": "mdi:icon-name",
  "entity_picture": "https://example.com/image.jpg"
}
```

### Unit Measurements (Sensors)

```json
{
  "unit_of_measurement": "°C",
  "device_class": "temperature",
  "state_class": "measurement"
}
```

Valid `unit_of_measurement` values:
- Temperature: `°C`, `°F`, `K`
- Distance: `m`, `km`, `mi`
- Speed: `m/s`, `km/h`, `mph`
- Energy: `kWh`, `Wh`, `J`
- Power: `W`, `kW`, `mW`
- Pressure: `hPa`, `mbar`, `inHg`, `psi`
- Humidity: `%`
- Concentration: `ppm`, `mg/m³`

### Light Attributes

```json
{
  "brightness": 200,              // 0-255
  "color_temp": 400,              // mireds
  "rgb_color": [255, 128, 0],     // [R, G, B]
  "hs_color": [12.5, 75.5],       // [hue, saturation]
  "xy_color": [0.3, 0.3],         // CIE 1931
  "effect": "colorloop",
  "color_mode": "rgb",
  "supported_color_modes": ["onoff", "brightness", "rgb", "color_temp"],
  "supported_features": 191       // bitmask
}
```

### Climate Attributes

```json
{
  "current_temperature": 22.5,    // actual temp
  "temperature": 22.0,             // target temp
  "target_temp_high": 24.0,        // heat_cool mode
  "target_temp_low": 20.0,         // heat_cool mode
  "current_humidity": 45,
  "humidity": 50,                  // target humidity
  "hvac_mode": "heat",             // current mode
  "hvac_modes": ["off", "heat", "cool", "heat_cool"],
  "hvac_action": "heating",        // actual action
  "fan_mode": "auto",
  "fan_modes": ["off", "low", "medium", "high", "auto"],
  "preset_mode": "home",
  "preset_modes": ["none", "eco", "away", "boost", "comfort", "home", "sleep"],
  "swing_mode": "off",
  "swing_modes": ["off", "on"],
  "min_temp": 5,
  "max_temp": 35
}
```

### Media Player Attributes

```json
{
  "volume_level": 0.5,             // 0.0-1.0
  "is_volume_muted": false,
  "media_content_id": "track_123",
  "media_content_type": "music",
  "media_title": "Song Name",
  "media_artist": "Artist Name",
  "media_album_name": "Album Name",
  "media_album_art": "https://example.com/art.jpg",
  "media_duration": 245,           // seconds
  "media_position": 120,           // seconds
  "source": "Spotify",
  "source_list": ["Spotify", "AirPlay", "Bluetooth"],
  "sound_mode": "surround",
  "sound_mode_list": ["stereo", "surround"],
  "shuffle": false,
  "repeat": "all"                  // off, all, one
}
```

### Lock Attributes

```json
{
  "code_format": "^\\d{4}$",       // regex pattern
  "changed_by": "John",             // last changer
  "lock_low_battery": false
}
```

### Camera Attributes

```json
{
  "access_token": "token_123",
  "entity_picture": "https://...",
  "motion_detection": true,
  "brand": "Nest",
  "model": "Hello",
  "frontend_stream_type": "hls"
}
```

See `resources/entity-types.md` for complete attribute references by entity type.

## State Monitoring Patterns

### Check Light Status

```python
import requests

headers = {"Authorization": f"Bearer {token}"}

# Get light state
response = requests.get(
    "http://localhost:8123/api/states/light.kitchen",
    headers=headers
)
state_obj = response.json()

is_on = state_obj['state'] == 'on'
brightness = state_obj['attributes'].get('brightness', 0)
```

### Monitor Multiple Sensors

```python
import requests

headers = {"Authorization": f"Bearer {token}"}

# Get all states
response = requests.get(
    "http://localhost:8123/api/states",
    headers=headers
)
all_states = response.json()

# Filter for temperature sensors
temps = [
    {
        'id': s['entity_id'],
        'temp': float(s['state']),
        'unit': s['attributes'].get('unit_of_measurement')
    }
    for s in all_states
    if s['entity_id'].startswith('sensor.')
    and 'temperature' in s['entity_id'].lower()
]

for sensor in temps:
    print(f"{sensor['id']}: {sensor['temp']}{sensor['unit']}")
```

### Detect State Changes

```python
import time

def monitor_entity_changes(entity_id, token, interval=5, max_time=300):
    """Monitor an entity for state changes"""
    headers = {"Authorization": f"Bearer {token}"}
    url = f"http://localhost:8123/api/states/{entity_id}"
    
    last_state = None
    last_changed = None
    
    start = time.time()
    while time.time() - start < max_time:
        response = requests.get(url, headers=headers)
        state_obj = response.json()
        
        if state_obj['state'] != last_state:
            print(f"Change detected: {state_obj['state']}")
            print(f"Changed at: {state_obj['last_changed']}")
            last_state = state_obj['state']
            last_changed = state_obj['last_changed']
        
        time.sleep(interval)
```

### Check for Unavailable Entities

```python
def get_unavailable_entities(token):
    """Find all unavailable entities"""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        "http://localhost:8123/api/states",
        headers=headers
    )
    all_states = response.json()
    
    unavailable = [
        {
            'entity_id': s['entity_id'],
            'last_updated': s['last_updated']
        }
        for s in all_states
        if s['state'] == 'unavailable'
    ]
    
    return unavailable
```

---

**Related Resources:**
- `resources/core-concepts.md` - API fundamentals
- `resources/entity-types.md` - Specific entity types
- `resources/service-reference.md` - Controlling devices via services
- `resources/examples.md` - Practical code examples
