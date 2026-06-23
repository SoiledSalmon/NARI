# NARI — Personal Safety Platform

**A wearable safety belt + mobile app that detects danger through sensor fusion and sends real-time alerts to trusted contacts.**

NARI combines biometric monitoring, motion analysis, and machine learning to provide immediate safety detection for vulnerable populations. When danger is detected, the system automatically alerts emergency contacts and local authorities with the user's location and vital information.

---

## 🎯 What is NARI?

NARI is an integrated personal safety system composed of three components:

1. **Wearable Belt** (ESP32-S3 + MAX30102 + MPU6500): Continuously samples heart rate, motion, and audio in the user's environment, streaming data to the cloud.

2. **Mobile App** (React Native/Expo): Provides real-time safety monitoring, journey tracking with emergency contact oversight, and manual SOS capability. Shows connectivity status, historical alerts, and incident heatmaps.

3. **Cloud Backend** (FastAPI + Machine Learning): Ingests sensor data, runs deep learning models for stress/motion anomaly detection, fuses predictions into a single safety score, and manages alert routing to emergency contacts via Firebase.

---

## ⚙️ Hardware Component

The **NARI Safety Belt** is a wearable that communicates with the mobile app via BLE and WiFi:

- **Microcontroller**: ESP32-S3 (Wroom-1 variant) with WiFi and configurable GPIO
- **Heart Rate Monitor**: MAX30102 optical sensor (I2C address 0x57) for pulse detection and HRV
- **Motion Sensor**: MPU6500 6-axis IMU (I2C address 0x68) for acceleration and gyroscope data
- **Audio**: Analog microphone on GPIO 4 for ambient sound level detection
- **Data Transmission**: HTTP POST to backend at 5 Hz (10 IMU samples per request, ~200ms batches)
- **Local Detection**: Runs threshold-based emergency detection (free fall, impact, scream) on-device for instant alerts

**Connection Protocol:**
- WiFi for initial setup and data upload
- Frequency: 50 Hz IMU sampling → 5 batches/second → backend ingestion → inference → alert routing

---

## 🧠 ML Pipeline

NARI uses a multimodal deep learning architecture to compute safety:

1. **LSTM (Stress Detection)** — Processes heart rate and HRV features from a 60-second window.
   - Trained on the WESAD dataset to detect physiological signatures of acute stress/panic
   - Outputs probability of stress state: [0] baseline, [1] stress
   - Input: Mean HR, RMSSD, EDA, temperature features (8-dim vector)

2. **TCN (Motion Analysis)** — Processes 6-axis IMU (accelerometer + gyroscope) from a 3.2-second window.
   - Trained on HHAR dataset to classify motion patterns: stationary, walking, running, falling, struggling, other
   - Outputs probability distribution over 6 motion classes
   - Detects abnormal struggling, rapid jerky movements, or falls

3. **Fusion Logic** (Rule-based) — Combines LSTM and TCN outputs.
   - Stress × Stationary → Higher danger (distress while immobile)
   - Stress × Active → Moderate danger (fight/flight response)
   - High stress alone → Alert state
   - Output: Safety Score (0–100) and level (safe, alert, danger)

**Safety Thresholds:**
- **Score >= 80**: Safe
- **Score 50–79**: Alert (elevated risk; notify user and standby contacts)
- **Score < 50**: Danger (auto-trigger SOS, notify emergency contacts immediately)

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js**: >= 18.x
- **Python**: >= 3.10
- **Firebase project** with:
  - Phone Authentication enabled
  - Firestore database initialized
  - Firebase Admin SDK service account key

---

### ⚡ Unified Quick Setup (Recommended)

For convenience, we provide unified setup scripts at the root level to install all dependencies and configure env templates automatically:

**On Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

**On Linux/macOS (Bash):**
```bash
chmod +x ./setup.sh
./setup.sh
```

These scripts will provision the Python `.venv` virtual environment, install backend requirements, install frontend node packages, and create `.env` template files.

---

### Manual Setup

If you prefer to set up components manually, follow these steps:

#### Backend Manual Setup
```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env
# Fill in Firebase credentials and API key in backend/.env
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Frontend Manual Setup
```bash
cd frontend
cp ../.env.example .env
# Fill in Firebase credentials and backend URL in frontend/.env
npm install
npx expo start
```

#### Firmware Manual Setup (ESP32-S3 Belt)
1. Open `firmware/nari_firmware/nari_firmware.ino` in Arduino IDE
2. Install the ESP32 board support package
3. Install libraries via Library Manager:
   - `SparkFun MAX3010x Pulse and Proximity Sensor Library`
   - `MPU9250_WE` (by Wolfgang Ewald)
   - `ArduinoJson` (v6.x only — NOT v7)
4. Create `firmware/nari_firmware/secrets.h` from `secrets.h.example`:
   ```cpp
   const char* WIFI_SSID   = "YOUR_SSID";
   const char* WIFI_PASS   = "YOUR_PASSWORD";
   const char* BACKEND_URL = "http://192.168.x.x:8000/ingest";
   const char* API_KEY     = "<your-api-secret-key>";
   const char* USER_ID     = "<test-user-id>";
   ```
5. Select board: **ESP32-S3 Wroom-1**
6. Upload to device

---

## 🧪 Running Tests

NARI includes a suite of unit, integration, and E2E verification scripts:

### 1. Backend Unit Tests
Validates sensor processing logic, tensor shape transformations, and physiological parameter conversions:
```bash
.\.venv\Scripts\python.exe backend/test_process_payload.py
```

### 2. Backend Integration Tests
Starts the FastAPI server, tests payload format validations, executes model inference pipelines, and verifies API response schemas:
```bash
.\.venv\Scripts\python.exe backend/test_e2e_predict.py
```

### 3. End-to-End (E2E) Verification
Runs the React Native app in web mode, walks through user onboarding flow (splash, language selection, OTP validation, permissions), and simulates sensor streaming to verify real-time status updates:
1. Start the FastAPI backend:
   ```bash
   .\.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --port 8000
   ```
2. Start the frontend web server (on port 8081):
   ```bash
   cd frontend
   npm run web -- --port 8081
   ```
3. Execute the E2E Playwright verification script:
   ```bash
   .\.venv\Scripts\python.exe scratch/e2e_test.py
   ```

> [!NOTE]
> Currently, there are **no native test suites** (like Jest or GoogleTest) inside the `frontend` or `firmware` directories. Adding native unit/component tests for UI components and firmware logic remains a high-priority task.

---

## ⚠️ Known Limitations & Open Issues

1. **Test Coverage Gaps**:
   - **Frontend**: Zero unit or UI testing coverage on components outside of the Playwright script.
   - **Firmware**: No unit tests written for device drivers or edge alert logic.
2. **Hardcoded Physiological Parameters**:
   - Preprocessing assumes default values for missing sensors: electrodermal activity (EDA) is mocked at `1.5` and skin temperature is locked at `32.0`°C.
   - Real-time fusion is rule-based and uses static thresholds (e.g., `stress > 0.5` reduces safety score by 40; stationary status with stress reduces it by another 20).
3. **Firmware Initialization**:
   - If the MPU6500 IMU fails to respond on I2C address `0x68` at boot, the firmware logs an error and halts execution. The device does not feature an offline buzzer or LED warning sequence for hardware faults.
4. **Bluetooth Low Energy (BLE)**:
   - While NARI's design features BLE, the current firmware streams packets via HTTP POST over WiFi. BLE integration remains a work in progress.

---

## 📂 Project Structure

```
NARI/
├── frontend/                       # React Native/Expo mobile app
│   ├── src/
│   │   ├── screens/               # 20+ screen components (Home, Status, Map, Settings, SOS, etc.)
│   │   ├── components/            # Reusable UI elements (Card, Button, Badge, Chart, etc.)
│   │   ├── stores/                # Zustand state management (auth, alert, sensor, journey, etc.)
│   │   ├── services/              # Firebase & haptic services
│   │   ├── navigation/            # React Navigation config & route definitions
│   │   ├── theme/                 # Design tokens (colors, typography, spacing)
│   │   ├── hooks/                 # Custom hooks (useSensorData, useJourneyMode, useSOS)
│   │   ├── locales/               # i18n translations (English + Kannada)
│   │   ├── data/                  # Type definitions & data provider abstraction
│   │   └── assets/                # Fonts, images
│   ├── App.tsx                    # Root component & provider setup
│   ├── package.json               # Dependencies
│   └── .env.example               # Environment template
│
├── backend/                       # FastAPI Python backend
│   ├── main.py                    # FastAPI app, endpoints, inference orchestration
│   ├── schemas.py                 # Pydantic request/response models
│   ├── buffers.py                 # Global state & ringbuffer for sensor data
│   ├── fusion.py                  # Safety score computation logic
│   ├── firebase_app.py            # Firebase Admin SDK initialization
│   ├── assn_lstm/                 # LSTM model (Stress detection)
│   ├── assn_tcn/                  # TCN model (Motion classification)
│   ├── requirements.txt           # Python dependencies
│   └── .env.example               # Environment template
│
├── firmware/                      # ESP32-S3 Arduino firmware
│   ├── nari_firmware/
│   │   ├── nari_firmware.ino      # Main firmware (sampling, local detection, HTTP POST)
│   │   ├── secrets.h.example      # WiFi & backend config template
│   │   └── secrets.h              # (Not committed; from secrets.h.example)
│   └── README.md                  # Hardware wiring & setup
│
├── README.md                      # This file
├── ARCHITECTURE.md                # Data flow, schema, BLE protocol, safety score logic
├── SCREENS.md                     # Screen-level documentation
├── .env.example                   # Unified environment template
├── .gitignore                     # Excludes .env, secrets.h, node_modules, etc.
└── LICENSE                        # Private project license
```

---

## 🛡️ Security & Privacy

- **No Data Logging**: Debug logging is disabled in production builds.
- **Encrypted Credentials**: All secrets stored in environment variables; never committed.
- **Phone Auth Only**: Firebase Phone Authentication for secure access.
- **Firestore Rules**: User data is siloed; users can only access their own alerts/contacts/journeys.
- **Location Sharing**: Optional toggle; off by default.

---

## 📜 License

This project is **private**. All rights reserved. Unauthorized copying, modification, or distribution is prohibited.
