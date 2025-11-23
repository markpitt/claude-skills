# Home Assistant Entity Types Reference

This document provides detailed information about common Home Assistant entity types, their states, attributes, and services.

## Table of Contents

- [Light](#light)
- [Switch](#switch)
- [Climate](#climate)
- [Cover](#cover)
- [Lock](#lock)
- [Media Player](#media-player)
- [Sensor](#sensor)
- [Binary Sensor](#binary-sensor)
- [Camera](#camera)
- [Fan](#fan)
- [Alarm Control Panel](#alarm-control-panel)
- [Person](#person)
- [Device Tracker](#device-tracker)
- [Input Helpers](#input-helpers)

---

## Light

**Entity ID Pattern**: `light.*`

### States
- `on` - Light is on
- `off` - Light is off
- `unavailable` - Light is unreachable

### Common Attributes
- `brightness` (0-255) - Current brightness level
- `color_temp` (int) - Color temperature in mireds
- `rgb_color` ([r, g, b]) - RGB color values (0-255)
- `xy_color` ([x, y]) - CIE 1931 color space coordinates
- `hs_color` ([h, s]) - Hue (0-360) and saturation (0-100)
- `effect` (string) - Current light effect
- `supported_features` (int) - Bitmask of supported features
- `friendly_name` (string) - Display name
- `supported_color_modes` (list) - Available color modes
- `color_mode` (string) - Current color mode

### Services

**turn_on**
```json
{
  "entity_id": "light.kitchen",
  "brightness": 200,
  "rgb_color": [255, 128, 0],
  "transition": 2
}
```

Parameters:
- `entity_id` - Target light(s)
- `brightness` (0-255) - Brightness level
- `brightness_pct` (0-100) - Brightness percentage
- `rgb_color` - RGB values
- `color_temp` - Color temperature
- `kelvin` - Color temperature in Kelvin
- `hs_color` - Hue and saturation
- `xy_color` - XY color
- `color_name` - Named color (e.g., "red", "blue")
- `transition` - Transition time in seconds
- `effect` - Light effect name
- `flash` - Flash mode ("short" or "long")

**turn_off**
```json
{
  "entity_id": "light.kitchen",
  "transition": 2
}
```

**toggle**
```json
{
  "entity_id": "light.kitchen"
}
```

---

## Switch

**Entity ID Pattern**: `switch.*`

### States
- `on` - Switch is on
- `off` - Switch is off
- `unavailable` - Switch is unreachable

### Common Attributes
- `friendly_name` (string) - Display name
- `icon` (string) - Icon identifier
- `assumed_state` (bool) - Whether state is assumed
- `device_class` (string) - Type of switch (outlet, switch)

### Services

**turn_on**, **turn_off**, **toggle**
```json
{
  "entity_id": "switch.coffee_maker"
}
```

---

## Climate

**Entity ID Pattern**: `climate.*`

### States
- `off` - Climate device is off
- `heat` - Heating mode
- `cool` - Cooling mode
- `heat_cool` - Auto heating/cooling
- `auto` - Automatic mode
- `dry` - Dehumidification mode
- `fan_only` - Fan only mode
- `unavailable` - Device is unreachable

### Common Attributes
- `current_temperature` (float) - Current temperature
- `temperature` (float) - Target temperature
- `target_temp_high` (float) - High target for heat_cool mode
- `target_temp_low` (float) - Low target for heat_cool mode
- `current_humidity` (float) - Current humidity percentage
- `humidity` (float) - Target humidity
- `fan_mode` (string) - Current fan mode
- `fan_modes` (list) - Available fan modes
- `hvac_action` (string) - Current action (heating, cooling, idle, off)
- `hvac_modes` (list) - Available HVAC modes
- `preset_mode` (string) - Current preset
- `preset_modes` (list) - Available presets
- `swing_mode` (string) - Current swing setting
- `swing_modes` (list) - Available swing modes
- `min_temp` (float) - Minimum settable temperature
- `max_temp` (float) - Maximum settable temperature

### Services

**set_temperature**
```json
{
  "entity_id": "climate.living_room",
  "temperature": 22,
  "target_temp_high": 24,
  "target_temp_low": 20,
  "hvac_mode": "heat_cool"
}
```

**set_hvac_mode**
```json
{
  "entity_id": "climate.living_room",
  "hvac_mode": "heat"
}
```

**set_preset_mode**
```json
{
  "entity_id": "climate.living_room",
  "preset_mode": "away"
}
```

**set_fan_mode**
```json
{
  "entity_id": "climate.living_room",
  "fan_mode": "auto"
}
```

**set_humidity**
```json
{
  "entity_id": "climate.living_room",
  "humidity": 50
}
```

---

## Cover

**Entity ID Pattern**: `cover.*`

### States
- `open` - Cover is open
- `opening` - Cover is opening
- `closed` - Cover is closed
- `closing` - Cover is closing
- `unavailable` - Cover is unreachable

### Common Attributes
- `current_position` (0-100) - Current position percentage
- `current_tilt_position` (0-100) - Current tilt percentage
- `supported_features` (int) - Bitmask of features
- `device_class` (string) - Type (blind, curtain, damper, door, garage, gate, shade, shutter, window)

### Services

**open_cover**, **close_cover**, **stop_cover**
```json
{
  "entity_id": "cover.garage_door"
}
```

**set_cover_position**
```json
{
  "entity_id": "cover.living_room_blinds",
  "position": 50
}
```

**set_cover_tilt_position**
```json
{
  "entity_id": "cover.bedroom_blinds",
  "tilt_position": 45
}
```

---

## Lock

**Entity ID Pattern**: `lock.*`

### States
- `locked` - Lock is locked
- `unlocked` - Lock is unlocked
- `locking` - Lock is locking
- `unlocking` - Lock is unlocking
- `jammed` - Lock is jammed
- `unavailable` - Lock is unreachable

### Common Attributes
- `code_format` (string) - Regular expression for valid codes
- `changed_by` (string) - Who last changed the lock
- `lock_low_battery` (bool) - Low battery indicator

### Services

**lock**
```json
{
  "entity_id": "lock.front_door",
  "code": "1234"
}
```

**unlock**
```json
{
  "entity_id": "lock.front_door",
  "code": "1234"
}
```

**open** (for locks with latch)
```json
{
  "entity_id": "lock.smart_lock",
  "code": "1234"
}
```

---

## Media Player

**Entity ID Pattern**: `media_player.*`

### States
- `off` - Device is off
- `on` - Device is on
- `playing` - Currently playing
- `paused` - Playback paused
- `idle` - Device is idle
- `buffering` - Content is buffering
- `unavailable` - Device is unreachable

### Common Attributes
- `volume_level` (0.0-1.0) - Current volume
- `is_volume_muted` (bool) - Mute status
- `media_content_id` (string) - Current media ID
- `media_content_type` (string) - Type of media
- `media_duration` (int) - Total duration in seconds
- `media_position` (int) - Current position in seconds
- `media_title` (string) - Title of current media
- `media_artist` (string) - Artist name
- `media_album_name` (string) - Album name
- `media_album_art` (string) - URL to album art
- `source` (string) - Current input source
- `source_list` (list) - Available input sources
- `sound_mode` (string) - Current sound mode
- `sound_mode_list` (list) - Available sound modes
- `shuffle` (bool) - Shuffle status
- `repeat` (string) - Repeat mode

### Services

**turn_on**, **turn_off**, **toggle**
```json
{
  "entity_id": "media_player.living_room_tv"
}
```

**play_media**
```json
{
  "entity_id": "media_player.speaker",
  "media_content_id": "https://example.com/music.mp3",
  "media_content_type": "music"
}
```

**media_play**, **media_pause**, **media_stop**
```json
{
  "entity_id": "media_player.speaker"
}
```

**media_next_track**, **media_previous_track**
```json
{
  "entity_id": "media_player.speaker"
}
```

**volume_set**
```json
{
  "entity_id": "media_player.speaker",
  "volume_level": 0.5
}
```

**volume_mute**
```json
{
  "entity_id": "media_player.speaker",
  "is_volume_muted": true
}
```

**select_source**
```json
{
  "entity_id": "media_player.receiver",
  "source": "HDMI 1"
}
```

---

## Sensor

**Entity ID Pattern**: `sensor.*`

### States
Varies by sensor type (numeric values, strings, etc.)

### Common Attributes
- `unit_of_measurement` (string) - Unit (°C, %, W, etc.)
- `device_class` (string) - Type of sensor
- `friendly_name` (string) - Display name
- `icon` (string) - Icon identifier
- `state_class` (string) - measurement, total, total_increasing

### Device Classes
- `temperature` - Temperature sensors
- `humidity` - Humidity sensors
- `pressure` - Pressure sensors
- `battery` - Battery level
- `power` - Power consumption
- `energy` - Energy consumption
- `current` - Electrical current
- `voltage` - Voltage
- `illuminance` - Light level
- `pm25` - Particulate matter 2.5µm
- `pm10` - Particulate matter 10µm
- `co2` - CO2 concentration
- `timestamp` - Timestamp
- `monetary` - Money/cost
- `signal_strength` - Signal strength (dBm, %)

### No Services
Sensors are read-only and have no controllable services.

---

## Binary Sensor

**Entity ID Pattern**: `binary_sensor.*`

### States
- `on` - Sensor is triggered/detected
- `off` - Sensor is clear/not detected
- `unavailable` - Sensor is unreachable

### Common Attributes
- `device_class` (string) - Type of binary sensor
- `friendly_name` (string) - Display name

### Device Classes
- `battery` - Battery status (low/normal)
- `battery_charging` - Charging status
- `cold` - Cold detected
- `connectivity` - Connected/disconnected
- `door` - Door open/closed
- `garage_door` - Garage door open/closed
- `gas` - Gas detected
- `heat` - Heat detected
- `light` - Light detected
- `lock` - Locked/unlocked
- `moisture` - Moisture detected
- `motion` - Motion detected
- `moving` - Device moving
- `occupancy` - Occupancy detected
- `opening` - Opening detected
- `plug` - Plugged in/unplugged
- `power` - Power on/off
- `presence` - Presence detected
- `problem` - Problem detected
- `running` - Running/not running
- `safety` - Unsafe/safe
- `smoke` - Smoke detected
- `sound` - Sound detected
- `tamper` - Tampered
- `update` - Update available
- `vibration` - Vibration detected
- `window` - Window open/closed

### No Services
Binary sensors are read-only.

---

## Camera

**Entity ID Pattern**: `camera.*`

### States
- `idle` - Camera is idle
- `recording` - Camera is recording
- `streaming` - Camera is streaming
- `unavailable` - Camera is unreachable

### Common Attributes
- `access_token` - Token for accessing camera stream
- `entity_picture` - URL to snapshot
- `brand` - Camera brand
- `model` - Camera model
- `motion_detection` - Motion detection enabled
- `frontend_stream_type` - Stream type (hls, web_rtc)

### Services

**enable_motion_detection**, **disable_motion_detection**
```json
{
  "entity_id": "camera.front_door"
}
```

**snapshot**
```json
{
  "entity_id": "camera.front_door",
  "filename": "/config/www/snapshots/front_door.jpg"
}
```

**play_stream**
```json
{
  "entity_id": "camera.front_door",
  "media_player": "media_player.living_room_tv"
}
```

---

## Fan

**Entity ID Pattern**: `fan.*`

### States
- `on` - Fan is on
- `off` - Fan is off
- `unavailable` - Fan is unreachable

### Common Attributes
- `percentage` (0-100) - Fan speed percentage
- `preset_mode` (string) - Current preset
- `preset_modes` (list) - Available presets
- `oscillating` (bool) - Oscillation status
- `direction` (string) - forward or reverse
- `supported_features` (int) - Bitmask of features

### Services

**turn_on**
```json
{
  "entity_id": "fan.bedroom",
  "percentage": 75,
  "preset_mode": "auto"
}
```

**turn_off**
```json
{
  "entity_id": "fan.bedroom"
}
```

**set_percentage**
```json
{
  "entity_id": "fan.bedroom",
  "percentage": 50
}
```

**set_preset_mode**
```json
{
  "entity_id": "fan.bedroom",
  "preset_mode": "sleep"
}
```

**oscillate**
```json
{
  "entity_id": "fan.living_room",
  "oscillating": true
}
```

**set_direction**
```json
{
  "entity_id": "fan.ceiling",
  "direction": "reverse"
}
```

---

## Alarm Control Panel

**Entity ID Pattern**: `alarm_control_panel.*`

### States
- `disarmed` - Alarm is disarmed
- `armed_home` - Armed in home mode
- `armed_away` - Armed in away mode
- `armed_night` - Armed in night mode
- `armed_vacation` - Armed in vacation mode
- `armed_custom_bypass` - Armed with custom bypass
- `pending` - Pending state (arming/disarming)
- `arming` - Currently arming
- `disarming` - Currently disarming
- `triggered` - Alarm has been triggered

### Common Attributes
- `code_format` (string) - Required code format
- `changed_by` (string) - User who made last change
- `code_arm_required` (bool) - Code required to arm
- `supported_features` (int) - Bitmask of features

### Services

**alarm_disarm**
```json
{
  "entity_id": "alarm_control_panel.home",
  "code": "1234"
}
```

**alarm_arm_home**, **alarm_arm_away**, **alarm_arm_night**
```json
{
  "entity_id": "alarm_control_panel.home",
  "code": "1234"
}
```

**alarm_trigger**
```json
{
  "entity_id": "alarm_control_panel.home"
}
```

---

## Person

**Entity ID Pattern**: `person.*`

### States
- `home` - Person is home
- `not_home` - Person is away
- `<zone_name>` - Person is in a named zone
- `unavailable` - Location unknown

### Common Attributes
- `source` (string) - Entity providing location
- `latitude` (float) - Current latitude
- `longitude` (float) - Current longitude
- `gps_accuracy` (int) - GPS accuracy in meters
- `friendly_name` (string) - Person's name
- `entity_picture` (string) - Profile picture URL

### No Services
Person entities are managed through device trackers.

---

## Device Tracker

**Entity ID Pattern**: `device_tracker.*`

### States
- `home` - Device is home
- `not_home` - Device is away
- `<zone_name>` - Device is in a named zone

### Common Attributes
- `source_type` (string) - gps, router, bluetooth, etc.
- `latitude` (float) - Current latitude
- `longitude` (float) - Current longitude
- `gps_accuracy` (int) - GPS accuracy
- `battery` (int) - Battery level percentage

### Services

**see** (for some device trackers)
```json
{
  "dev_id": "my_phone",
  "location_name": "home",
  "gps": [51.5074, -0.1278],
  "gps_accuracy": 50,
  "battery": 85
}
```

---

## Input Helpers

### Input Boolean

**Entity ID Pattern**: `input_boolean.*`

States: `on`, `off`

Services: `turn_on`, `turn_off`, `toggle`

### Input Number

**Entity ID Pattern**: `input_number.*`

States: Numeric value within min/max range

Services:
- `set_value` - Set to specific value
- `increment` - Increase by step
- `decrement` - Decrease by step

### Input Text

**Entity ID Pattern**: `input_text.*`

States: Text string

Services: `set_value`

### Input Select

**Entity ID Pattern**: `input_select.*`

States: Currently selected option

Services:
- `select_option` - Select specific option
- `select_next` - Select next option in list
- `select_previous` - Select previous option
- `set_options` - Update available options

### Input Datetime

**Entity ID Pattern**: `input_datetime.*`

States: Date and/or time value

Services: `set_datetime`

---

## Additional Resources

For the most up-to-date entity information:
- Check `GET /api/states` for real-time entity data
- Use `GET /api/services` to discover all available services
- Refer to Home Assistant documentation for integration-specific entities
