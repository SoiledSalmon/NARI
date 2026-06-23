# NARI — Personal Safety Platform

**A wearable safety belt + mobile app that detects danger through sensor fusion and sends real-time alerts to trusted contacts.**

NARI combines biometric monitoring, motion analysis, and machine learning to provide instantaneous safety detection for vulnerable populations. When danger is detected, the system automatically alerts emergency contacts and local authorities with the user's location and vital information.

---

## 🎯 What is NARI?

NARI is an integrated personal safety system composed of three components:

1. **Wearable Belt** (ESP32-S3 + MAX30102 + MPU6500): Continuously samples heart rate, motion, and audio in the user's environment, streaming data to the cloud.

2. **Mobile App** (React Native/Expo): Provides real-time safety monitoring, journey tracking with emergency contact oversight, and manual SOS capability. Shows connectivity status, historical alerts, and incident heatmaps.

3. **Cloud Backend** (FastAPI + Machine Learning): Ingests sensor data, runs deep learning models for stress/motion anomaly detection, fuses predictions into a unified safety score, and manages alert routing to emergency contacts via Firebase.

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

3. **Fusion MLP** (Rule-based, future: neural fusion) — Combines LSTM and TCN outputs.
   - Stress × Stationary → Higher danger (distress while immobile)
   - Stress × Active → Moderate danger (fight/flight response)
   - High stress alone → Alert state
   - Output: Safety Score (0–100) and level (safe, alert, danger)

**Safety Thresholds:**
- **Score ≥ 80**: Safe
- **Score 50–79**: Alert (elevated risk; notify user and standby contacts)
- **Score < 50**: Danger (auto-trigger SOS, notify emergency contacts immediately)

---

## 🚀 Setup & Installation

### Prerequisites

- **Device**: iPhone or Android phone with iOS 12+ or Android 6+
- **Node.js**: ≥ 18.x
- **Python**: ≥ 3.10 (for backend)
- **ESP32-S3 hardware** (if setting up the belt from scratch)
- **Firebase project** with:
  - Phone Authentication enabled
  - Firestore database initialized
  - Firebase Admin SDK service account key

### Frontend Setup

```bash
cd frontend
cp ../.env.example .env
# Fill in Firebase credentials and backend URL
npm install
npx expo start
```

**Environment Variables (`.env`):**
```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_BACKEND_URL=http://your-backend-ip:8000
EXPO_PUBLIC_API_SECRET_KEY=<your-secret-key>
```

**Running the App:**
- **Development**: `npx expo start` → scan QR code in Expo Go app
- **Android Build**: `eas build --platform android`
- **iOS Build**: `eas build --platform ios`

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env
# Fill in Firebase credentials and API key
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Environment Variables:**
```
FIREBASE_CREDENTIALS_PATH=./service-account-key.json
API_SECRET_KEY=<your-secret-key>  # Same as frontend
```

### Firmware Setup (ESP32-S3 Belt)

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

## 📱 Features & Screens

### Authentication
- **Splash**: Intro and app branding
- **Language Selection**: Choose English or Kannada for the session
- **Phone Sign-Up**: Collect name, phone number, consent
- **OTP Verification**: Firebase Phone Auth
- **Add Contacts**: Bulk import trusted emergency contacts
- **Permissions**: Request GPS, location background access

### Main App
- **Home**: Real-time safety status, belt connection, recent alerts, journey mode, signal status
- **Status**: Detailed safety score gauge, sensor readings, stress/motion/audio metrics, technical debug view
- **Map**: Community incident heatmap, nearby alerts, distance and severity filters
- **Settings**: 
  - Alert history (grouped by month, searchable)
  - Device pairing (scan and reconnect belt)
  - Personal info (name, phone, language)
  - Emergency contacts (add/remove/edit)
  - Alert preferences (sensitivity, delivery method)
  - Privacy & security (location sharing, data retention)
  - Help & support
  - About & device info

### Emergency Modes
- **SOS Countdown**: 10-second countdown before sending alerts; can cancel
- **SOS Active**: Shows contact delivery status, call 112 button, false alarm option
- **Journey Mode**: User starts supervised journey; contacts receive real-time location link; user signals safe arrival
- **Alert Received**: Responder view when contacted by emergency alert (includes location, vitals, distance)

---

## 🔒 Security & Privacy

- **No Data Logging**: Debug logging is disabled in production builds
- **Encrypted Credentials**: All secrets (API keys, WiFi credentials) stored in environment variables; never committed
- **Phone Auth Only**: No username/password; Firebase Phone Authentication
- **Firestore Rules**: User data is siloed; users can only access their own alerts/contacts/journeys
- **Location Sharing**: Optional toggle; off by default
- **Data Retention**: Alerts retained for 6 months; then archived

---

## 📊 Known Limitations & Incomplete Features

- **ML Models Untrained**: LSTM and TCN models are bundled but require training on WESAD and HHAR datasets; currently return dummy probabilities for demo
- **No Direct BLE**: Currently using HTTP over WiFi; true BLE sync not yet implemented
- **Incident Heatmap**: Community incident data is mocked; real integration with municipal incident databases would enhance threat detection
- **Audio Analysis**: Microphone captures ambient sound levels but does not run ML; true audio anomaly detection requires speech recognition model
- **GPS Not Validated**: Backend assumes GPS available when belt connected; true device GPS state not queried
- **Alert Routing**: Emergency contacts receive notifications; SMS/WhatsApp/Nari app routing is mocked for demo
- **Accessibility**: Primarily tested on portrait mobile; tablet/landscape modes not fully optimized

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

## 🔗 Additional Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Data flow, state management, database schema, BLE protocol, ML safety score |
| [SCREENS.md](./SCREENS.md) | Detailed screen-by-screen feature documentation |
| [frontend/README.md](./frontend/README.md) | Frontend architecture, component library, store design |
| [backend/README.md](./backend/README.md) | API endpoints, ML pipeline, Firebase integration |
| [firmware/README.md](./firmware/README.md) | Sensor wiring, data format, local emergency detection |

---

## 🛠️ Development Workflow

1. **Branches**: Feature branches off `main`; PR reviews required
2. **Linting**: `npm run lint` (frontend)
3. **Testing**: Unit tests for stores and services; integration tests for API endpoints
4. **Deployment**:
   - **Frontend**: EAS Build (Expo Application Services)
   - **Backend**: Docker containerization; deploy to cloud provider (AWS/GCP/Azure)
   - **Firmware**: Arduino IDE upload to ESP32-S3

---

## 📞 Support & Feedback

For questions, bug reports, or feature requests, please open an issue on GitHub or contact the team at: **[contact email]**

---

## 📜 License

This project is **private**. All rights reserved. Unauthorized copying, modification, or distribution is prohibited.

---

**Last Updated**: June 2026
**Status**: Presentation-Ready for Academic Evaluation
