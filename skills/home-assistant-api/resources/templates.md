---
title: Templates & Advanced Queries
description: Server-side template rendering and complex state queries
---

# Templates & Advanced Queries

## Template Endpoint

The template endpoint allows rendering Jinja2 templates using Home Assistant's template engine. This enables server-side computation rather than parsing data on the client.

### Basic Template Query

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"template": "The temperature is {{ states(\"sensor.temperature\") }}°C"}' \
  http://localhost:8123/api/template
```

**Response:**
```json
{
  "result": "The temperature is 22.5°C"
}
```

**Advantages:**
- Computation happens server-side
- Access to Home Assistant's state objects
- No need to fetch all entities
- Efficient for complex queries

## Template Functions & Objects

### State Functions

#### `states(entity_id)`

Get the state of an entity:

```bash
# Get light state
{"template": "{{ states('light.kitchen') }}"}
# Result: "on"

# Use in conditional
{"template": "{% if states('light.kitchen') == 'on' %}Light is on{% else %}Light is off{% endif %}"}
```

#### `state_attr(entity_id, attribute)`

Get a specific attribute of an entity:

```bash
# Get brightness
{"template": "{{ state_attr('light.kitchen', 'brightness') }}"}
# Result: "200"

# Get friendly name
{"template": "{{ state_attr('light.kitchen', 'friendly_name') }}"}
# Result: "Kitchen Light"
```

#### `is_state(entity_id, state)`

Check if entity is in specific state (equivalent to `states(...) == state`):

```bash
{"template": "{{ is_state('light.kitchen', 'on') }}"}
# Result: "True" or "False"
```

#### `is_state_attr(entity_id, attribute, value)`

Check if attribute equals value:

```bash
{"template": "{{ is_state_attr('light.kitchen', 'brightness', 255) }}"}
```

### State Object Access

Access all entities via `states` object:

```bash
# Get first light
{"template": "{{ states.light }}"}

# List entity objects
{"template": "{{ states.light | list }}"}

# Access specific entity
{"template": "{{ states.light.kitchen.state }}"}
```

### Common Filters (Jinja2)

#### `selectattr()` - Filter by Attribute

```bash
# Get all lights that are on
{"template": "{{ states.light | selectattr('state', 'eq', 'on') | map(attribute='entity_id') | list }}"}

# Get all sensors with low battery (< 20%)
{"template": "{{ states.sensor | selectattr('attributes.battery_level', 'defined') | selectattr('attributes.battery_level', '<', 20) | map(attribute='entity_id') | list }}"}
```

#### `rejectattr()` - Filter Out

```bash
# Get all lights that are OFF
{"template": "{{ states.light | rejectattr('state', 'eq', 'on') | map(attribute='entity_id') | list }}"}

# Get entities that DON'T have a battery
{"template": "{{ states | rejectattr('attributes.battery_level', 'defined') | map(attribute='entity_id') | list }}"}
```

#### `map()` - Extract Data

```bash
# Get all light entities
{"template": "{{ states.light | map(attribute='entity_id') | list }}"}

# Get brightness of all on lights
{"template": "{{ states.light | selectattr('state', 'eq', 'on') | map(attribute='attributes.brightness') | list }}"}
```

#### `sum()` - Sum Values

```bash
# Total brightness of all lights
{"template": "{{ states.light | map(attribute='attributes.brightness') | sum }}"}

# Sum power usage
{"template": "{{ states.sensor | selectattr('entity_id', 'search', 'power') | map(attribute='state') | map('float', 0) | sum | round(1) }}"}
```

#### `length` - Count Items

```bash
# Count lights that are on
{"template": "{{ states.light | selectattr('state', 'eq', 'on') | list | length }}"}

# Count unavailable entities
{"template": "{{ states | selectattr('state', 'eq', 'unavailable') | list | length }}"}
```

### Loops

#### Iterate Over Entities

```bash
# Get all light IDs
{"template": "{% for light in states.light %}{{ light.entity_id }}\n{% endfor %}"}

# Get entities with values
{"template": "{% for sensor in states.sensor %}{{ sensor.entity_id }}: {{ sensor.state }}\n{% endfor %}"}
```

### Time Functions

#### `now()`

Get current time:

```bash
# Current datetime
{"template": "{{ now() }}"}
# Result: "2025-01-15 10:30:45.123456"

# Current hour
{"template": "{{ now().hour }}"}
# Result: "10"

# Is it morning? (6 AM - 12 PM)
{"template": "{{ 6 <= now().hour < 12 }}"}
```

#### `as_timestamp()`

Convert datetime to Unix timestamp:

```bash
{"template": "{{ as_timestamp(now()) }}"}
```

#### `utcnow()`

Get current UTC time:

```bash
{"template": "{{ utcnow() }}"}
```

## Complex Query Examples

### Count Entities by Domain

```bash
# Count all lights
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"template": "{{ states.light | list | length }}"}' \
  http://localhost:8123/api/template
```

### Find Entities with Specific Attribute

```bash
# Get all devices with low battery
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "{% set devices = states | selectattr(\"attributes.battery_level\", \"defined\") | selectattr(\"attributes.battery_level\", \"<\", 20) | list %}Devices with low battery:\n{% for device in devices %}{{ device.entity_id }}: {{ device.attributes.battery_level }}%\n{% endfor %}"
  }' \
  http://localhost:8123/api/template
```

### Calculate Averages

```bash
# Average temperature from all temperature sensors
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "{{ (states.sensor | selectattr(\"entity_id\", \"search\", \"temperature\") | map(attribute=\"state\") | map(\"float\") | sum / (states.sensor | selectattr(\"entity_id\", \"search\", \"temperature\") | list | length)) | round(1) }}"
  }' \
  http://localhost:8123/api/template
```

### Conditional Logic

```bash
# Set lighting scene based on time of day
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "{% set hour = now().hour %}{% if hour < 6 %}night{% elif hour < 12 %}morning{% elif hour < 18 %}day{% else %}evening{% endif %}"
  }' \
  http://localhost:8123/api/template
```

### Check Multiple Conditions

```bash
# Is anyone home AND is it daytime?
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "{% set anyone_home = states.person | selectattr(\"state\", \"eq\", \"home\") | list | length > 0 %}{% set is_daytime = 6 <= now().hour < 22 %}{{ anyone_home and is_daytime }}"
  }' \
  http://localhost:8123/api/template
```

### Group and Summarize

```bash
# Summary of all domains and entity counts
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "{% set domains = states | groupby(attribute=\"entity_id\") | map(attribute=\"0\") | map(\"regex_replace\", pattern=\"\\..*\", replacement=\"\") | unique | list %}{% for domain in domains | sort %}{{ domain }}: {{ (states | selectattr(\"entity_id\", \"search\", \"^\" ~ domain ~ \"\\.\") | list | length) }}\n{% endfor %}"
  }' \
  http://localhost:8123/api/template
```

## Python Client Examples

### Simple Template Queries

```python
import requests
import json

def render_template(base_url, token, template):
    """Render a Jinja2 template"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        f"{base_url}/api/template",
        headers=headers,
        json={"template": template}
    )
    
    response.raise_for_status()
    return response.json()['result']

# Usage
result = render_template(
    "http://localhost:8123",
    "your_token",
    "{{ states('light.kitchen') }}"
)
print(result)  # "on" or "off"
```

### Count Lights On

```python
def count_lights_on(base_url, token):
    """Count how many lights are currently on"""
    template = "{{ states.light | selectattr('state', 'eq', 'on') | list | length }}"
    result = render_template(base_url, token, template)
    return int(result)

count = count_lights_on("http://localhost:8123", "token")
print(f"{count} lights are on")
```

### Get Low Battery Devices

```python
def get_low_battery_devices(base_url, token, threshold=20):
    """Get list of devices with battery below threshold"""
    template = f"""
    {{% set devices = states | selectattr("attributes.battery_level", "defined") | selectattr("attributes.battery_level", "<", {threshold}) | list %}}
    {{% for device in devices %}}
    ${{{{ device.entity_id }}}}: ${{{{ device.attributes.battery_level }}}}%
    {{% endfor %}}
    """.strip()
    
    result = render_template(base_url, token, template)
    return result.split('\n')

devices = get_low_battery_devices("http://localhost:8123", "token", threshold=15)
for device in devices:
    print(device)
```

### Check If Anyone Home

```python
def is_anyone_home(base_url, token):
    """Check if any person entity is home"""
    template = "{{ states.person | selectattr('state', 'eq', 'home') | list | length > 0 }}"
    result = render_template(base_url, token, template)
    return result.lower() == "true"

if is_anyone_home("http://localhost:8123", "token"):
    print("Someone is home")
else:
    print("Nobody is home")
```

### Calculate Average Temperature

```python
def get_average_temperature(base_url, token):
    """Get average temperature from all temperature sensors"""
    template = """
    {{ (states.sensor | selectattr('entity_id', 'search', 'temperature') | map(attribute='state') | map('float') | sum / (states.sensor | selectattr('entity_id', 'search', 'temperature') | list | length)) | round(1) }}
    """.strip()
    
    result = render_template(base_url, token, template)
    return float(result)

avg_temp = get_average_temperature("http://localhost:8123", "token")
print(f"Average temperature: {avg_temp}°C")
```

### Get Entity Summary

```python
def get_entity_summary(base_url, token):
    """Get count of entities by domain"""
    template = """
    {%- set domains = namespace(list=[]) -%}
    {%- for entity in states -%}
      {%- set domain = entity.entity_id.split('.')[0] -%}
      {%- if domain not in domains.list -%}
        {%- set domains.list = domains.list + [domain] -%}
      {%- endif -%}
    {%- endfor -%}
    {%- for domain in domains.list | sort -%}
      {{ domain }}: {{ (states | selectattr('entity_id', 'search', '^' ~ domain ~ '\\.') | list | length) }}
      {% if not loop.last %}
      {% endif -%}
    {%- endfor -%}
    """
    
    result = render_template(base_url, token, template)
    return result

summary = get_entity_summary("http://localhost:8123", "token")
print(summary)
```

## Performance Considerations

### Efficient vs Inefficient

**❌ Inefficient** - Fetch all states, parse, and filter client-side:
```python
response = requests.get(f"{url}/api/states", headers=headers)
all_states = response.json()
lights_on = [s for s in all_states if s['entity_id'].startswith('light.') and s['state'] == 'on']
```

**✅ Efficient** - Server-side filtering with template:
```python
template = "{{ states.light | selectattr('state', 'eq', 'on') | list | length }}"
result = requests.post(f"{url}/api/template", headers=headers, json={"template": template})
count = int(result.json()['result'])
```

The template approach:
- Transfers less data
- Computes on server (no client CPU)
- Faster for large entity counts
- Simpler logic

### Caching Templates

If you run the same template frequently, cache the results:

```python
from functools import lru_cache
import time

@lru_cache(maxsize=32)
def cached_template(base_url, token, template, cache_time=60):
    """Cache template results for specified duration"""
    result = render_template(base_url, token, template)
    # In production, implement time-based expiry
    return result
```

## Debugging Templates

### Common Errors

**Undefined variable:**
```
UndefinedError: 'states.light.kitchen' is undefined
```
Solution: Use `states('light.kitchen')` function instead of dot notation when entity doesn't exist.

**Type error:**
```
TypeError: Cannot convert float to int
```
Solution: Use filters to convert types: `| float` or `| int`

**String comparison:**
```
# Wrong - comparing string to int
{{ state_attr('light.kitchen', 'brightness') == 255 }}

# Right - convert to int first
{{ state_attr('light.kitchen', 'brightness') | int == 255 }}
```

### Testing Templates

Use the Home Assistant UI Developer Tools > Templates to test:
1. Go to Settings > Developer Tools
2. Click "Templates" tab
3. Paste your template
4. See real-time results and errors

---

**Related Resources:**
- `resources/core-concepts.md` - API basics
- `resources/state-management.md` - State queries
- `resources/examples.md` - Practical examples
- [Home Assistant Template Documentation](https://www.home-assistant.io/docs/configuration/templating/)
