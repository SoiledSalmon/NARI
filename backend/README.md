# NARI Backend

The NARI backend is a FastAPI application responsible for ingesting sensor data, running machine learning models for stress and anomaly detection, and managing cloud storage through Firebase.

## 🚀 Setup & Local Development

1. **Prerequisites:**
   - Python 3.10+
   - Firebase Admin Service Account Key (`service-account-key.json`)

2. **Environment Variables:**
   Create a `.env` file in the root of the project (use `.env.example` as a template). Ensure `FIREBASE_CREDENTIALS_PATH` and `API_SECRET_KEY` are configured.

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the server:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

## 🧠 ML Models

NARI uses a multimodal deep learning pipeline:
- **LSTM (Stress Detection):** Processes Heart Rate (HR) and HRV. Trained on the WESAD dataset to identify physiological spikes associated with panic.
- **TCN (Motion Analysis):** Processes 6-axis IMU data. Trained on the HHAR dataset to detect abnormal struggling, falling, or rapid jerky movements.
- **Fusion:** A rule-based fusion logic (planned for MLP) combines the model outputs to produce a unified Safety Score (0–100) and discrete states (Safe, Alert, Danger).

## 📡 API Endpoints

All endpoints require the `X-API-Key` header for authentication.

- `POST /ingest`: Receives high-frequency sensor batches (IMU, HR, IBI) from the ESP32. Updates buffers and triggers ML inference asynchronously.
- `GET /status`: Retrieves the current computed safety score, sensor snapshot, and connectivity state.
- `GET /status/debug`: Diagnostic endpoint showing internal buffer fills and latency.
- `POST /journey/start`: Initiates a supervised journey mode.
- `POST /journey/end`: Concludes an active journey.
- `POST /sos/cancel`: Downgrades an active SOS alert back to a safe state.

## 🗄️ Firestore Integration

The backend interacts heavily with Firestore (via `firebase-admin`):
- Automatically provisions `alerts` documents when danger is detected.
- Manages `journeys` records based on frontend triggers.
- Centralizes data for push notification triggers on connected devices.
