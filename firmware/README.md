# NARI Firmware

The ESP32-S3 firmware responsible for reading biometric and motion data, evaluating local safety thresholds, and streaming data to the backend.

## 🚀 Setup & Flashing

1. Open `nari_firmware/nari_firmware.ino` in the Arduino IDE.
2. Install the **ESP32 Board Support Package**.
3. Install the required libraries via the Arduino Library Manager:
   - `SparkFun MAX3010x Pulse and Proximity Sensor Library` (for MAX30105.h)
   - `MPU9250_WE` (by Wolfgang Ewald, provides MPU6500_WE.h)
   - `ArduinoJson` (**IMPORTANT:** Must be version 6.x, not v7).
4. Configure Wi-Fi credentials in the source code (or move to a local uncommitted `secrets.h`).
5. Select your ESP32-S3 board and upload.

## 🔌 Sensor Wiring (ESP32-S3 WROOM-1)

Sensors communicate via a shared I2C bus:
- **SDA Pin:** GPIO 8
- **SCL Pin:** GPIO 9
- **MAX30102 (HR/SpO2):** Address `0x57`
- **MPU6500 (IMU):** Address `0x68`
- **Microphone (Analog):** GPIO 4

## 📡 Data Flow & Payload

The firmware samples the IMU at 50Hz and accumulates data into batches of 10 samples (representing 200ms).
Once a batch is complete, it fires an HTTP POST request to the backend.

**Payload Format:**
```json
{
  "userId": "string",
  "hr": 75.0,
  "ibi": 800.0,
  "imu": [
    { "ax": 0.0, "ay": 0.0, "az": 1.0, "gx": 0.0, "gy": 0.0, "gz": 0.0 }
    // ... 10 samples total
  ]
}
```

## 🚨 Local Emergency Detection

In addition to cloud analysis, the firmware runs local hardcoded thresholds for immediate detection:
- **Free Fall:** Total acceleration < 0.4g
- **Impact:** Total acceleration > 2.5g
- **Shake/Struggle:** Gyroscope rotation > 3.5
- **Scream/Noise:** Audio peak-to-peak amplitude exceeding thresholds.
