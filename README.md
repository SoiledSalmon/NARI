# NARI — Personal Safety Platform

<p align="center">
  <strong>A wearable safety belt + mobile app that detects danger through sensor fusion and alerts your trusted contacts.</strong>
</p>

---

## Architecture

```
┌──────────┐     WiFi/HTTP     ┌──────────────┐     Firestore     ┌─────────────────┐
│ ESP32-S3 │ ──────────────→ │ FastAPI       │ ──────────────→ │ React Native    │
│ Belt     │  sensor data    │ Backend       │  status/alerts  │ Frontend (Expo) │
│          │                 │ (ML scoring)  │                 │                 │
└──────────┘                 └──────────────┘                 └─────────────────┘
```

### Components

| Component | Tech Stack | Purpose |
|-----------|-----------|---------|
| **Frontend** | React Native (Expo 54), TypeScript, Zustand | Mobile app for monitoring, SOS, journey tracking |
| **Backend** | Python, FastAPI, LSTM/TCN models | Sensor data ingestion, ML safety scoring, Firestore writes |
| **Firmware** | Arduino (ESP32-S3), MAX30102, MPU6500, Mic | Wearable sensor data collection and HTTP posting |

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10
- Expo CLI (`npm install -g expo-cli`)
- Firebase project with Phone Auth enabled

### Frontend

```bash
cd frontend
cp ../.env.example .env
# Fill in your Firebase + backend config
npm install
npx expo start
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Firmware

1. Open `firmware/nari_firmware/nari_firmware.ino` in Arduino IDE
2. Install ESP32 board support and required libraries (Wire, WiFi, HTTPClient)
3. Set `WIFI_SSID`, `WIFI_PASS`, and `SERVER_URL` in the firmware
4. Upload to ESP32-S3

---

## Documentation

| Document | Description |
|----------|-------------|
| [Frontend Guide](frontend/README.md) | App architecture, screens, stores, navigation |
| [Backend Guide](backend/README.md) | API endpoints, ML pipeline, deployment |
| [Firmware Guide](firmware/README.md) | Sensor wiring, data format, WiFi provisioning |
| [Contributing](CONTRIBUTING.md) | Development workflow, code style, PR process |

---

## Environment Variables

See [`.env.example`](.env.example) for all required configuration.

> ⚠️ **Never commit `.env` files.** They are already in `.gitignore`.

---

## License

Private project — all rights reserved.
