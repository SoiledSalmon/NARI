# Setup Guide

This guide will help you set up the NARI development environment for both the mobile application and the wearable hardware.

## 📱 Mobile App Setup

### Prerequisites
- **Node.js** (v18 or later)
- **npm** or **Yarn**
- **Expo Go** app on your physical device (for testing)

> **⚠️ Note on Expo Versions**: As of project initialization, Expo has undergone significant changes. Ensure you are using **v54.0.0** or later. Refer to the [official Expo docs](https://docs.expo.dev/versions/v54.0.0/) for version-specific breaking changes.

### Steps
1.  **Clone and Install**:
    ```bash
    git clone https://github.com/your-username/nari.git
    cd nari
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root directory and add the following keys:
    ```env
    EXPO_PUBLIC_FIREBASE_API_KEY=
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
    EXPO_PUBLIC_FIREBASE_PROJECT_ID=
    EXPO_PUBLIC_ML_API_BASE_URL=        # Cloud endpoint for ML inference
    EXPO_PUBLIC_MAPS_API_KEY=           # Google Maps API
    EXPO_PUBLIC_TEST_CONTACT_NUMBER=    # For Phase 2 SMS test sends
    EXPO_PUBLIC_MOCK_NARI_NUMBER=       # Simulates a contact with NARI installed
    ```

3.  **Run the App**:
    ```bash
    npx expo start
    ```
    Scan the QR code with your phone to open the app in Expo Go.

## 🔌 Hardware Setup (ESP32)

The NARI bangle uses an ESP32 microcontroller to interface with bio-sensors.

### Prerequisites
- **Arduino IDE** (v2.0 or later)
- **ESP32 Board Package**: Install via Boards Manager (`https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`)
- **Required Libraries**:
  - `SparkFun MAX3010x Pulse Proximity Sensor Library`
  - `Adafruit MPU6050`
  - `NimBLE-Arduino` (for optimized BLE)

### Flashing the ESP32
1.  Open the firmware sketch in Arduino IDE.
2.  Select your ESP32 board (e.g., `DOIT ESP32 DEVKIT V1`).
3.  Connect the ESP32 to your computer via USB.
4.  Configure your local Wi-Fi credentials in the `config.h` (if applicable).
5.  Click **Upload**.

## 🛠️ Simulation Mode

If you don't have the hardware yet, you can run the app in **Simulation Mode**:
- Open `dataConfig.ts` in the root directory.
- Ensure `useRealBLE` is set to `false`.
- The app will now use `MockDataProvider` to generate synthetic sensor signals.
