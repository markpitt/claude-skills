# Home Assistant Service Reference

This document provides a quick reference for common service calls organized by domain.

## Table of Contents

- [Homeassistant (System Services)](#homeassistant-system-services)
- [Light](#light)
- [Switch](#switch)
- [Climate](#climate)
- [Cover](#cover)
- [Lock](#lock)
- [Media Player](#media-player)
- [Fan](#fan)
- [Notify](#notify)
- [Scene](#scene)
- [Script](#script)
- [Automation](#automation)
- [Group](#group)
- [Input Helpers](#input-helpers)
- [Persistent Notification](#persistent-notification)
- [System Monitor](#system-monitor)

---

## Homeassistant (System Services)

### restart
Restart Home Assistant

```bash
POST /api/services/homeassistant/restart
```

### stop
Stop Home Assistant

```bash
POST /api/services/homeassistant/stop
```

### reload_config_entry
Reload a config entry

```json
{
  "entry_id": "config_entry_id"
}
```

### reload_core_config
Reload core configuration (configuration.yaml)

```bash
POST /api/services/homeassistant/reload_core_config
```

### check_config
Check configuration validity

```bash
POST /api/services/homeassistant/check_config
```

### update_entity
Update entity attributes

```json
{
  "entity_id": "sensor.my_sensor",
  "name": "New Name",
  "icon": "mdi:temperature-celsius"
}
```

### set_location
Set Home Assistant location

```json
{
  "latitude": 51.5074,
  "longitude": -0.1278,
  "elevation": 30
}
```

---

## Light

### turn_on
Turn on lights with optional parameters

```json
{
  "entity_id": "light.kitchen",
  "brightness": 200,
  "rgb_color": [255, 128, 0],
  "transition": 2,
  "effect": "colorloop"
}
```

**Parameters:**
- `entity_id` - Target entity/entities
- `brightness` (0-255) - Brightness level
- `brightness_pct` (0-100) - Brightness percentage
- `brightness_step` (-255 to 255) - Brightness change
- `brightness_step_pct` (-100 to 100) - Brightness change percentage
- `rgb_color` [r, g, b] - RGB color
- `color_name` - Named color
- `hs_color` [h, s] - Hue and saturation
- `xy_color` [x, y] - XY color
- `color_temp` - Color temperature in mireds
- `kelvin` - Color temperature in Kelvin
- `transition` - Transition time in seconds
- `flash` - Flash mode ("short" or "long")
- `effect` - Light effect name

### turn_off
Turn off lights

```json
{
  "entity_id": "light.living_room",
  "transition": 3
}
```

### toggle
Toggle light state

```json
{
  "entity_id": "light.bedroom"
}
```

---

## Switch

### turn_on
Turn on switch

```json
{
  "entity_id": "switch.coffee_maker"
}
```

### turn_off
Turn off switch

```json
{
  "entity_id": "switch.coffee_maker"
}
```

### toggle
Toggle switch state

```json
{
  "entity_id": "switch.fan"
}
```

---

## Climate

### set_temperature
Set target temperature

```json
{
  "entity_id": "climate.living_room",
  "temperature": 22,
  "target_temp_high": 24,
  "target_temp_low": 20
}
```

### set_hvac_mode
Set HVAC mode

```json
{
  "entity_id": "climate.thermostat",
  "hvac_mode": "heat"
}
```

**Valid modes:** `off`, `heat`, `cool`, `heat_cool`, `auto`, `dry`, `fan_only`

### set_preset_mode
Set preset mode

```json
{
  "entity_id": "climate.thermostat",
  "preset_mode": "away"
}
```

**Common presets:** `none`, `eco`, `away`, `boost`, `comfort`, `home`, `sleep`, `activity`

### set_fan_mode
Set fan mode

```json
{
  "entity_id": "climate.hvac",
  "fan_mode": "auto"
}
```

**Common modes:** `auto`, `low`, `medium`, `high`, `on`, `off`

### set_humidity
Set target humidity

```json
{
  "entity_id": "climate.dehumidifier",
  "humidity": 50
}
```

### set_swing_mode
Set swing mode

```json
{
  "entity_id": "climate.ac",
  "swing_mode": "horizontal"
}
```

### set_aux_heat
Enable/disable auxiliary heating

```json
{
  "entity_id": "climate.thermostat",
  "aux_heat": true
}
```

---

## Cover

### open_cover
Open cover

```json
{
  "entity_id": "cover.garage_door"
}
```

### close_cover
Close cover

```json
{
  "entity_id": "cover.blinds"
}
```

### stop_cover
Stop cover movement

```json
{
  "entity_id": "cover.garage_door"
}
```

### toggle
Toggle cover state

```json
{
  "entity_id": "cover.curtains"
}
```

### set_cover_position
Set cover to specific position

```json
{
  "entity_id": "cover.blinds",
  "position": 50
}
```

**Position:** 0 (closed) to 100 (open)

### set_cover_tilt_position
Set tilt position

```json
{
  "entity_id": "cover.venetian_blinds",
  "tilt_position": 45
}
```

### open_cover_tilt
Open tilt fully

```json
{
  "entity_id": "cover.venetian_blinds"
}
```

### close_cover_tilt
Close tilt fully

```json
{
  "entity_id": "cover.venetian_blinds"
}
```

---

## Lock

### lock
Lock the lock

```json
{
  "entity_id": "lock.front_door",
  "code": "1234"
}
```

### unlock
Unlock the lock

```json
{
  "entity_id": "lock.front_door",
  "code": "1234"
}
```

### open
Open the lock (for locks with latch)

```json
{
  "entity_id": "lock.smart_lock",
  "code": "1234"
}
```

---

## Media Player

### turn_on
Turn on media player

```json
{
  "entity_id": "media_player.tv"
}
```

### turn_off
Turn off media player

```json
{
  "entity_id": "media_player.tv"
}
```

### toggle
Toggle media player power

```json
{
  "entity_id": "media_player.speaker"
}
```

### play_media
Play specific media

```json
{
  "entity_id": "media_player.speaker",
  "media_content_id": "https://example.com/audio.mp3",
  "media_content_type": "music",
  "enqueue": "play"
}
```

**Content types:** `music`, `tvshow`, `video`, `episode`, `channel`, `playlist`

**Enqueue options:** `play` (default), `next`, `add`, `replace`

### media_play
Resume playback

```json
{
  "entity_id": "media_player.spotify"
}
```

### media_pause
Pause playback

```json
{
  "entity_id": "media_player.spotify"
}
```

### media_stop
Stop playback

```json
{
  "entity_id": "media_player.spotify"
}
```

### media_next_track
Skip to next track

```json
{
  "entity_id": "media_player.spotify"
}
```

### media_previous_track
Go to previous track

```json
{
  "entity_id": "media_player.spotify"
}
```

### volume_set
Set volume level

```json
{
  "entity_id": "media_player.speaker",
  "volume_level": 0.5
}
```

**Volume:** 0.0 (mute) to 1.0 (max)

### volume_up
Increase volume

```json
{
  "entity_id": "media_player.speaker"
}
```

### volume_down
Decrease volume

```json
{
  "entity_id": "media_player.speaker"
}
```

### volume_mute
Mute/unmute

```json
{
  "entity_id": "media_player.tv",
  "is_volume_muted": true
}
```

### media_seek
Seek to position

```json
{
  "entity_id": "media_player.tv",
  "seek_position": 120
}
```

**Position:** In seconds

### select_source
Select input source

```json
{
  "entity_id": "media_player.receiver",
  "source": "HDMI 1"
}
```

### select_sound_mode
Select sound mode

```json
{
  "entity_id": "media_player.receiver",
  "sound_mode": "surround"
}
```

### shuffle_set
Enable/disable shuffle

```json
{
  "entity_id": "media_player.spotify",
  "shuffle": true
}
```

### repeat_set
Set repeat mode

```json
{
  "entity_id": "media_player.spotify",
  "repeat": "all"
}
```

**Repeat modes:** `off`, `all`, `one`

---

## Fan

### turn_on
Turn on fan

```json
{
  "entity_id": "fan.bedroom",
  "percentage": 75,
  "preset_mode": "auto"
}
```

### turn_off
Turn off fan

```json
{
  "entity_id": "fan.bedroom"
}
```

### toggle
Toggle fan

```json
{
  "entity_id": "fan.living_room"
}
```

### set_percentage
Set fan speed percentage

```json
{
  "entity_id": "fan.bedroom",
  "percentage": 50
}
```

### set_preset_mode
Set fan preset

```json
{
  "entity_id": "fan.ceiling",
  "preset_mode": "sleep"
}
```

### oscillate
Set oscillation

```json
{
  "entity_id": "fan.tower",
  "oscillating": true
}
```

### set_direction
Set fan direction

```json
{
  "entity_id": "fan.ceiling",
  "direction": "reverse"
}
```

**Directions:** `forward`, `reverse`

---

## Notify

### notify (varies by platform)
Send notification

```json
{
  "message": "The front door is open",
  "title": "Security Alert",
  "data": {
    "priority": "high",
    "ttl": 0,
    "channel": "alarm"
  }
}
```

### mobile_app_{device_name}
Send to specific mobile app

```json
{
  "message": "Laundry is done",
  "title": "Home Assistant",
  "data": {
    "actions": [
      {
        "action": "STOP_ALARM",
        "title": "Stop Alarm"
      }
    ],
    "url": "/lovelace/laundry",
    "clickAction": "/lovelace/laundry"
  }
}
```

**Common data fields:**
- `actions` - Action buttons
- `url` / `clickAction` - URL to open
- `image` - Image URL
- `icon` - Icon URL
- `color` - Notification color
- `tag` - Notification tag (for updates)
- `group` - Group notifications
- `channel` - Android notification channel
- `importance` - Android importance level
- `sound` - Notification sound
- `badge` - iOS badge count
- `push` - Push notification settings
- `ttl` - Time to live

---

## Scene

### turn_on
Activate scene

```json
{
  "entity_id": "scene.movie_time",
  "transition": 2
}
```

### create
Create/update scene

```json
{
  "scene_id": "custom_scene",
  "snapshot_entities": [
    "light.living_room",
    "light.kitchen"
  ]
}
```

### apply
Apply scene without saving

```json
{
  "entities": {
    "light.kitchen": {
      "state": "on",
      "brightness": 200
    },
    "light.bedroom": "off"
  }
}
```

---

## Script

### turn_on
Run script

```json
{
  "entity_id": "script.morning_routine"
}
```

### turn_off
Stop running script

```json
{
  "entity_id": "script.morning_routine"
}
```

### toggle
Toggle script

```json
{
  "entity_id": "script.bedtime"
}
```

### reload
Reload all scripts

```bash
POST /api/services/script/reload
```

---

## Automation

### trigger
Manually trigger automation

```json
{
  "entity_id": "automation.motion_lights",
  "skip_condition": true
}
```

### turn_on
Enable automation

```json
{
  "entity_id": "automation.security_check"
}
```

### turn_off
Disable automation

```json
{
  "entity_id": "automation.evening_lights",
  "stop_actions": true
}
```

### toggle
Toggle automation

```json
{
  "entity_id": "automation.morning_routine"
}
```

### reload
Reload all automations

```bash
POST /api/services/automation/reload
```

---

## Group

### set
Set group members

```json
{
  "object_id": "all_lights",
  "entities": [
    "light.kitchen",
    "light.living_room",
    "light.bedroom"
  ]
}
```

### remove
Remove group

```json
{
  "object_id": "old_group"
}
```

### reload
Reload groups

```bash
POST /api/services/group/reload
```

---

## Input Helpers

### input_boolean.turn_on / turn_off / toggle
Control input boolean

```json
{
  "entity_id": "input_boolean.guest_mode"
}
```

### input_number.set_value
Set input number value

```json
{
  "entity_id": "input_number.temperature_offset",
  "value": 2.5
}
```

### input_number.increment / decrement
Adjust input number

```json
{
  "entity_id": "input_number.counter"
}
```

### input_text.set_value
Set input text

```json
{
  "entity_id": "input_text.status_message",
  "value": "System is armed"
}
```

### input_select.select_option
Select option

```json
{
  "entity_id": "input_select.scene_selector",
  "option": "Movie Time"
}
```

### input_select.select_next / select_previous
Navigate options

```json
{
  "entity_id": "input_select.thermostat_mode"
}
```

### input_datetime.set_datetime
Set datetime value

```json
{
  "entity_id": "input_datetime.alarm_time",
  "datetime": "2025-01-15 07:30:00"
}
```

Or individual components:
```json
{
  "entity_id": "input_datetime.alarm_time",
  "time": "07:30:00",
  "date": "2025-01-15"
}
```

---

## Persistent Notification

### create
Create persistent notification

```json
{
  "message": "Update available for Home Assistant",
  "title": "Update Available",
  "notification_id": "update_notification"
}
```

### dismiss
Dismiss notification

```json
{
  "notification_id": "update_notification"
}
```

---

## System Monitor

### update
Update system monitor sensors

```json
{
  "entity_id": "sensor.processor_use"
}
```

---

## Timer

### start
Start timer

```json
{
  "entity_id": "timer.laundry",
  "duration": "00:45:00"
}
```

### pause
Pause timer

```json
{
  "entity_id": "timer.laundry"
}
```

### cancel
Cancel timer

```json
{
  "entity_id": "timer.laundry"
}
```

### finish
Finish timer immediately

```json
{
  "entity_id": "timer.laundry"
}
```

---

## Counter

### increment
Increment counter

```json
{
  "entity_id": "counter.visitors"
}
```

### decrement
Decrement counter

```json
{
  "entity_id": "counter.visitors"
}
```

### reset
Reset counter to initial value

```json
{
  "entity_id": "counter.visitors"
}
```

### configure
Update counter configuration

```json
{
  "entity_id": "counter.visitors",
  "minimum": 0,
  "maximum": 100,
  "step": 1,
  "initial": 0
}
```

---

## Frontend

### set_theme
Set frontend theme

```json
{
  "name": "dark_mode",
  "mode": "dark"
}
```

### reload_themes
Reload all themes

```bash
POST /api/services/frontend/reload_themes
```

---

## Logbook

### log
Add custom logbook entry

```json
{
  "name": "Security System",
  "message": "System armed by John",
  "entity_id": "alarm_control_panel.home",
  "domain": "alarm_control_panel"
}
```

---

## Quick Reference: Most Common Services

### Turn on/off any entity
```bash
POST /api/services/{domain}/turn_on
POST /api/services/{domain}/turn_off
POST /api/services/{domain}/toggle
```

### System control
```bash
POST /api/services/homeassistant/restart
POST /api/services/homeassistant/reload_core_config
```

### Notifications
```bash
POST /api/services/notify/mobile_app_{device}
```

### Scenes and scripts
```bash
POST /api/services/scene/turn_on
POST /api/services/script/turn_on
POST /api/services/automation/trigger
```

---

## Tips

1. **Discover available services:** `GET /api/services`
2. **Check service parameters:** Services endpoint returns field descriptions
3. **Use `entity_id: all`:** Target all entities in domain
4. **Multiple entities:** Pass array: `["light.1", "light.2"]`
5. **Error handling:** Check HTTP response codes (200=success, 400=bad request, 404=not found)
6. **Return service data:** Add `?return_response=true` to URL for services that return data
