# Home Assistant REST API Examples

This document provides practical examples for common Home Assistant REST API operations.

## Table of Contents

- [Lighting Control](#lighting-control)
- [Climate Control](#climate-control)
- [Media Players](#media-players)
- [Sensors and Monitoring](#sensors-and-monitoring)
- [Automations and Scripts](#automations-and-scripts)
- [Notifications](#notifications)
- [Advanced Queries](#advanced-queries)

---

## Lighting Control

### Turn On All Lights in a Room

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": ["light.living_room_1", "light.living_room_2", "light.living_room_3"]}' \
  http://localhost:8123/api/services/light/turn_on
```

### Set Light Scene

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "light.bedroom", "brightness": 100, "color_temp": 400}' \
  http://localhost:8123/api/services/light/turn_on
```

### Gradual Brightness Change

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "light.kitchen", "brightness": 255, "transition": 10}' \
  http://localhost:8123/api/services/light/turn_on
```

### RGB Color Control

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "light.strip", "rgb_color": [255, 0, 128]}' \
  http://localhost:8123/api/services/light/turn_on
```

### Check Light Status with Attributes

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/states/light.kitchen | jq '{state: .state, brightness: .attributes.brightness, color_temp: .attributes.color_temp}'
```

---

## Climate Control

### Set Thermostat Temperature

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "climate.living_room", "temperature": 22}' \
  http://localhost:8123/api/services/climate/set_temperature
```

### Set HVAC Mode

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "climate.living_room", "hvac_mode": "heat"}' \
  http://localhost:8123/api/services/climate/set_hvac_mode
```

Valid HVAC modes: `off`, `heat`, `cool`, `heat_cool`, `auto`, `dry`, `fan_only`

### Set Target Humidity

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "climate.bedroom", "humidity": 50}' \
  http://localhost:8123/api/services/climate/set_humidity
```

### Get Current Climate State

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/states/climate.living_room | jq '{current_temp: .attributes.current_temperature, target_temp: .attributes.temperature, mode: .state}'
```

---

## Media Players

### Play Media

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "media_player.living_room_speaker", "media_content_id": "https://example.com/music.mp3", "media_content_type": "music"}' \
  http://localhost:8123/api/services/media_player/play_media
```

### Control Volume

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "media_player.living_room_speaker", "volume_level": 0.5}' \
  http://localhost:8123/api/services/media_player/volume_set
```

### Playback Control

```bash
# Pause
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "media_player.living_room_speaker"}' \
  http://localhost:8123/api/services/media_player/media_pause

# Next track
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "media_player.living_room_speaker"}' \
  http://localhost:8123/api/services/media_player/media_next_track
```

---

## Sensors and Monitoring

### Get All Temperature Sensors

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/states | jq '[.[] | select(.entity_id | contains("temperature"))]'
```

### Monitor Energy Usage

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/states/sensor.power_consumption | jq '{power: .state, unit: .attributes.unit_of_measurement}'
```

### Check Battery Levels

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8123/api/states | jq '[.[] | select(.attributes.battery_level != null) | {entity: .entity_id, battery: .attributes.battery_level}]'
```

### Get Historical Temperature Data

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  'http://localhost:8123/api/history/period/2025-01-15T00:00:00+00:00?filter_entity_id=sensor.temperature&end_time=2025-01-15T23:59:59+00:00' | jq '.[0] | map({time: .last_changed, temp: .state})'
```

---

## Automations and Scripts

### Trigger an Automation

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "automation.morning_routine"}' \
  http://localhost:8123/api/services/automation/trigger
```

### Enable/Disable Automation

```bash
# Disable
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "automation.evening_lights"}' \
  http://localhost:8123/api/services/automation/turn_off

# Enable
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "automation.evening_lights"}' \
  http://localhost:8123/api/services/automation/turn_on
```

### Run a Script

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "script.bedtime"}' \
  http://localhost:8123/api/services/script/turn_on
```

### Activate a Scene

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "scene.movie_time"}' \
  http://localhost:8123/api/services/scene/turn_on
```

---

## Notifications

### Send Mobile Notification

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Front door opened", "title": "Security Alert"}' \
  http://localhost:8123/api/services/notify/mobile_app_iphone
```

### Notification with Action Buttons

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Someone is at the door",
    "title": "Doorbell",
    "data": {
      "actions": [
        {"action": "open_door", "title": "Open"},
        {"action": "ignore", "title": "Ignore"}
      ]
    }
  }' \
  http://localhost:8123/api/services/notify/mobile_app_iphone
```

### Persistent Notification

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "System update available", "title": "Update"}' \
  http://localhost:8123/api/services/persistent_notification/create
```

---

## Advanced Queries

### Complex Template Query

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "{% set lights = states.light | selectattr(\"state\", \"eq\", \"on\") | list %}{{ lights | length }} lights are on. Total brightness: {{ lights | sum(attribute=\"attributes.brightness\") | int }}"
  }' \
  http://localhost:8123/api/template
```

### Count Entities by State

```bash
# Count how many lights are on
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"template": "{{ states.light | selectattr(\"state\", \"eq\", \"on\") | list | length }}"}' \
  http://localhost:8123/api/template
```

### Get Entities by Attribute

```bash
# Get all entities with low battery
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"template": "{{ states | selectattr(\"attributes.battery_level\", \"defined\") | selectattr(\"attributes.battery_level\", \"lt\", 20) | map(attribute=\"entity_id\") | list }}"}' \
  http://localhost:8123/api/template
```

### Calculate Average Temperature

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"template": "{{ (states.sensor | selectattr(\"entity_id\", \"search\", \"temperature\") | map(attribute=\"state\") | map(\"float\") | sum / (states.sensor | selectattr(\"entity_id\", \"search\", \"temperature\") | list | length)) | round(1) }}"}' \
  http://localhost:8123/api/template
```

---

## Python Integration Example

```python
import requests
from typing import Optional, Dict, Any, List

class HomeAssistant:
    def __init__(self, url: str, token: str):
        self.url = url.rstrip('/')
        self.token = token
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def get_entities_by_domain(self, domain: str) -> List[Dict]:
        """Get all entities for a specific domain"""
        response = requests.get(f"{self.url}/api/states", headers=self.headers)
        response.raise_for_status()
        states = response.json()
        return [s for s in states if s['entity_id'].startswith(f"{domain}.")]

    def get_lights_on(self) -> List[str]:
        """Get list of all lights that are currently on"""
        lights = self.get_entities_by_domain("light")
        return [light['entity_id'] for light in lights if light['state'] == 'on']

    def turn_off_all_lights(self):
        """Turn off all lights"""
        lights_on = self.get_lights_on()
        if lights_on:
            return requests.post(
                f"{self.url}/api/services/light/turn_off",
                headers=self.headers,
                json={"entity_id": lights_on}
            ).json()

    def set_scene_by_time(self):
        """Set lighting scene based on time of day"""
        template = """
        {% set hour = now().hour %}
        {% if hour < 6 %}night
        {% elif hour < 12 %}morning
        {% elif hour < 18 %}day
        {% else %}evening
        {% endif %}
        """
        response = requests.post(
            f"{self.url}/api/template",
            headers=self.headers,
            json={"template": template}
        )
        scene = response.json()

        return requests.post(
            f"{self.url}/api/services/scene/turn_on",
            headers=self.headers,
            json={"entity_id": f"scene.{scene}"}
        ).json()

    def get_low_battery_devices(self, threshold: int = 20) -> List[Dict]:
        """Get all devices with battery below threshold"""
        response = requests.get(f"{self.url}/api/states", headers=self.headers)
        response.raise_for_status()
        states = response.json()

        low_battery = []
        for state in states:
            battery = state.get('attributes', {}).get('battery_level')
            if battery is not None and battery < threshold:
                low_battery.append({
                    'entity_id': state['entity_id'],
                    'battery': battery,
                    'friendly_name': state['attributes'].get('friendly_name', state['entity_id'])
                })

        return low_battery

# Usage
ha = HomeAssistant("http://localhost:8123", "YOUR_TOKEN")

# Turn off all lights
ha.turn_off_all_lights()

# Get low battery devices
low_battery = ha.get_low_battery_devices(threshold=15)
for device in low_battery:
    print(f"{device['friendly_name']}: {device['battery']}%")

# Set scene based on time
ha.set_scene_by_time()
```

---

## Bash Script Example

```bash
#!/bin/bash

# Configuration
HA_URL="http://localhost:8123"
HA_TOKEN="YOUR_TOKEN"

# Function to call Home Assistant API
ha_api() {
    local method=$1
    local endpoint=$2
    local data=$3

    if [ -z "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $HA_TOKEN" \
            -H "Content-Type: application/json" \
            "$HA_URL/api/$endpoint"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $HA_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$HA_URL/api/$endpoint"
    fi
}

# Get all lights that are on
get_lights_on() {
    ha_api GET "states" | jq -r '.[] | select(.entity_id | startswith("light.")) | select(.state == "on") | .entity_id'
}

# Turn off all lights
turn_off_all_lights() {
    local lights=$(get_lights_on | jq -R . | jq -s .)
    if [ "$lights" != "[]" ]; then
        ha_api POST "services/light/turn_off" "{\"entity_id\": $lights}"
        echo "Turned off all lights"
    else
        echo "No lights are currently on"
    fi
}

# Check if anyone is home
is_anyone_home() {
    local people=$(ha_api GET "states" | jq -r '.[] | select(.entity_id | startswith("person.")) | select(.state == "home") | .entity_id')
    if [ -n "$people" ]; then
        echo "Someone is home"
        return 0
    else
        echo "Nobody is home"
        return 1
    fi
}

# Nighttime routine
nighttime_routine() {
    echo "Running nighttime routine..."

    # Turn off all lights except bedroom
    ha_api POST "services/light/turn_off" '{"entity_id": "all"}'
    ha_api POST "services/light/turn_on" '{"entity_id": "light.bedroom", "brightness": 50}'

    # Lock all doors
    ha_api POST "services/lock/lock" '{"entity_id": "all"}'

    # Set thermostat to night mode
    ha_api POST "services/climate/set_temperature" '{"entity_id": "climate.living_room", "temperature": 18}'

    echo "Nighttime routine complete"
}

# Main
case "$1" in
    lights-off)
        turn_off_all_lights
        ;;
    check-home)
        is_anyone_home
        ;;
    night)
        nighttime_routine
        ;;
    *)
        echo "Usage: $0 {lights-off|check-home|night}"
        exit 1
        ;;
esac
```

---

## Error Handling Examples

### Python with Retry Logic

```python
import requests
import time
from typing import Optional

def ha_api_call_with_retry(url: str, token: str, method: str, endpoint: str,
                           data: Optional[dict] = None, max_retries: int = 3):
    """Make HA API call with exponential backoff retry"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    for attempt in range(max_retries):
        try:
            if method.upper() == "GET":
                response = requests.get(f"{url}/api/{endpoint}", headers=headers, timeout=10)
            else:
                response = requests.post(f"{url}/api/{endpoint}", headers=headers,
                                       json=data, timeout=10)

            response.raise_for_status()
            return response.json()

        except requests.exceptions.HTTPError as e:
            if response.status_code == 401:
                raise Exception("Invalid authentication token")
            elif response.status_code == 404:
                raise Exception(f"Entity not found: {endpoint}")
            elif attempt == max_retries - 1:
                raise
            else:
                wait_time = 2 ** attempt
                print(f"Retry {attempt + 1}/{max_retries} after {wait_time}s...")
                time.sleep(wait_time)

        except requests.exceptions.RequestException as e:
            if attempt == max_retries - 1:
                raise
            else:
                wait_time = 2 ** attempt
                print(f"Connection error, retry {attempt + 1}/{max_retries} after {wait_time}s...")
                time.sleep(wait_time)
```

---

## Multi-Entity Operations

### Turn On Multiple Lights with Different Settings

```bash
# Using multiple API calls
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.kitchen", "brightness": 255}' \
  http://localhost:8123/api/services/light/turn_on

curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.living_room", "brightness": 180, "color_temp": 400}' \
  http://localhost:8123/api/services/light/turn_on

curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.bedroom", "brightness": 100, "rgb_color": [255, 200, 150]}' \
  http://localhost:8123/api/services/light/turn_on
```

### Use Scripts for Complex Multi-Step Operations

Better approach: Create a script in Home Assistant and trigger it via API:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "script.custom_lighting_scene"}' \
  http://localhost:8123/api/services/script/turn_on
```

This is more efficient and maintainable for complex operations.
