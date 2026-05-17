# Hardware Specifications

The NARI wearable is an ESP32-based safety bangle designed for low power consumption and reliable signal acquisition.

## 📦 Bill of Materials (BOM)

| Component | Purpose | Model |
|-----------|---------|-------|
| **Microcontroller** | System control and BLE | ESP32-WROOM-32 |
| **Heart Rate Sensor** | HR and SpO2 monitoring | MAX30102 |
| **IMU Sensor** | 6-axis motion tracking | MPU-6050 |
| **Battery** | Power supply | 500mAh LiPo |
| **Charging IC** | Battery management | TP4056 |
| **SOS Button** | Manual override | Momentary Tactile Switch |
| **Microphone** | Audio distress (Future) | MEMS Microphone |

## 🔌 Wiring & Pinout

The sensors communicate with the ESP32 via the I2C protocol.

- **I2C SDA**: GPIO 21
- **I2C SCL**: GPIO 22
- **SOS Button**: GPIO 4 (Internal Pull-up)

### Power Management
The system is optimized for long battery life:
- **BLE Long Range**: Used for reliable communication with the phone.
- **Deep Sleep**: The ESP32 enters deep sleep during inactivity and wakes up via accelerometer interrupt or SOS button press.

## 📐 Mechanical Design
The prototype is housed in a 3D-printed ergonomic bangle casing. The sensors are positioned on the inner wrist for optimal contact with the skin.
