# MQTT Topics

# Format: classroom/<deviceId>/<topic>

# Topics:

# telemetry 📊
# ESP32 → Serveur (10s)
# {"deviceId":"esp32-03","tempC":21.39,"humPct":41.4,"batteryPct":50}

# events 🔔
# ESP32 → Serveur
# {"deviceId":"esp32-03","event":"button_pressed","data":{"button":"A"}}

# cmd 📡
# Serveur → ESP32
# {"deviceId":"esp32-03","cmd":"led_toggle"}

# status ✅
# ESP32 → Serveur
# {"deviceId":"esp32-03","status":"online","batteryPct":50}

# Devices:
# esp32-01: Labo     esp32-02: Amphi
# esp32-03: Salle A  esp32-04: Salle B
# esp32-05: Extérieur esp32-06: Couloir
# esp32-07: Bureau
