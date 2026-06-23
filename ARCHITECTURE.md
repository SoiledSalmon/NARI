# NARI Architecture Documentation

This document describes the technical architecture of the NARI Personal Safety Platform, including data flow, state management, database schema, and the safety score computation pipeline.

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Data Flow](#data-flow)
3. [State Management](#state-management)
4. [Database Schema](#database-schema)
5. [BLE & Sensor Protocol](#ble--sensor-protocol)
6. [Safety Score Computation](#safety-score-computation)
7. [External Services](#external-services)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NARI ECOSYSTEM                               │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐          WiFi/HTTP           ┌─────────────────┐
    │   ESP32-S3       │         (JSON POST)          │   FastAPI       │
    │   Belt           │◄─────────────────────────►   │   Backend       │
    │                  │                              │ (Inference,     │
    │ • MAX30102 (HR)  │   /ingest endpoint           │  Fusion, DB)    │
    │ • MPU6500 (IMU)  │   50 Hz, 10-batch POST      │                 │
    │ • Microphone     │                              └────────┬────────┘
    │                  │                                   │
    └──────────────────┘                                   │
                                                           │ Firestore API
                                                           ▼
    ┌──────────────────┐          BLE/WiFi          ┌─────────────────┐
    │ React Native     │◄────────────────────────►   │   Firestore     │
    │ Mobile App       │   Status/Alerts/            │   Database      │
    │ (Expo)           │   Journeys/Contacts         │                 │
    │                  │                             │ • users/        │
    │ • State Mgmt     │                             │ • alerts/       │
    │   (Zustand)      │                             │ • journeys/     │
    │ • Firebase Auth  │                             │ • contacts/     │
    │ • Real-time UI   │                             │ • incidents     │
    └──────────────────┘                             └─────────────────┘
```

---

## Data Flow

### Sensor → Backend → UI Pipeline

```
┌─ Sensor Data ─────────────────────────────────────────────────────────┐
│                                                                        │
│ 1. ESP32-S3 collects at 50 Hz:                                       │
│    - Accelerometer (ax, ay, az) from MPU6500                         │
│    - Gyroscope (gx, gy, gz) from MPU6500                             │
│    - Heart Rate (HR) from MAX30102                                   │
│    - IBI (Inter-beat interval) from MAX30102                         │
│    - Audio amplitude (peak-to-peak) from microphone                  │
│                                                                        │
│ 2. Every 200ms (BATCH_SIZE=10), ESP32 batches 10 IMU samples        │
│    and sends HTTP POST to /ingest:                                   │
│                                                                        │
│    {                                                                  │
│      "userId": "user-uuid",                                          │
│      "hr": 75.5,          // Last beat's HR                          │
│      "ibi": 800.0,        // Last beat's interval (ms)              │
│      "imu": [             // 10 samples × 6 axes                    │
│        { "ax": 0.1, "ay": 0.0, "az": 0.95, "gx": 0.0, ...}        │
│        ...                                                            │
│      ]                                                                │
│    }                                                                  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

          ▼ HTTP POST /ingest ▼

┌─ Backend Ingestion ───────────────────────────────────────────────────┐
│                                                                        │
│ 3. Backend receives payload in main.py:ingest_data()                │
│                                                                        │
│ 4. State manager (buffers.py) accumulates:                           │
│    - IMU data (keep last 160 samples ≈ 3.2s for TCN)               │
│    - HR/IBI (keep last 300 samples ≈ 60s for LSTM)                 │
│    - Accelerometer (keep last 3000 samples ≈ 60s)                  │
│                                                                        │
│ 5. Background task run_inference() executes:                         │
│    - Extract LSTM window: mean_hr, rmssd, mean_eda, mean_temp      │
│    - Extract TCN window: [ax, ay, az, gx, gy, gz] × 160             │
│    - Run LSTM model → [prob_baseline, prob_stress]                 │
│    - Run TCN model → [prob_cls0, prob_cls1, ..., prob_cls5]        │
│    - Fuse outputs in fusion.py → safety_score, level                │
│    - Write StatusSnapshot to state                                   │
│    - If level=='danger', create alert in Firestore                  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

          ▼ Poll /status endpoint ▼

┌─ Frontend Live Update ────────────────────────────────────────────────┐
│                                                                        │
│ 6. LiveDataProvider subscribes to /status every 3 seconds:          │
│    - Receives current StatusSnapshot                                │
│    - Updates useSensorStore state                                   │
│    - UI components rerender with fresh data                         │
│                                                                        │
│ 7. Firebase Listeners (real-time):                                   │
│    - onSnapshot to users/{userId}/alerts                            │
│    - onSnapshot to incidents (global community heatmap)             │
│    - UI updates instantly when new alerts/incidents written         │
│                                                                        │
│ 8. Display in Home/Status/Map screens                               │
│    - Home: Hero card with safety level + time                       │
│    - Status: Gauge chart, sensor cards, debug metrics               │
│    - Map: Incident pins colored by severity                         │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Emergency Alert Flow (SOS)

```
User Triggers SOS
       │
       ▼
1. Frontend: SOSCountdown screen (10s)
   └─► useSOSState store: phase='countdown'

       ▼
2. User does NOT cancel → SOSActive screen
   └─► useSOSState store: phase='active'

       ▼
3. Backend: /sos/trigger endpoint
   └─► Danger score spike detected OR manual trigger
   └─► Write alert record to Firestore
   └─► Alert status: 'sending' → 'sent'

       ▼
4. Contact Notifications:
   └─► Firebase Cloud Functions route alerts
   └─► Send SMS/WhatsApp/Push to emergency contacts
   └─► Responder app receives AlertReceived screen
   └─► Shows sender name, location, vitals, distance

       ▼
5. User marks false alarm → /sos/cancel
   └─► Alert status: 'active' → 'false_alarm'
   └─► Contacts notified of resolution
```

---

## State Management

NARI uses **Zustand** for all state management. Each store is a single source of truth for its domain.

### Store Architecture

```
Store                   Purpose                         Persists?
────────────────────────────────────────────────────────────────────
authStore              User auth, profile, language      Firestore
sensorStore            Live safety status, sensor data   No (ephemeral)
alertStore             Recent & all alerts              Firestore
journeyStore           Active journey state             Firestore
contactStore           Trusted emergency contacts      Firestore
settingsStore          User preferences                 Firestore
```

### Example: authStore

```typescript
interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  language: 'en' | 'kn';
  onboardingStep: number; // 0=language, 5=done
  
  setUser: (user) => void;
  setLanguage: (lang) => void;
  completeOnboarding: () => void;
  logout: () => void;
  sendOTP: (phone, verifier) => Promise<boolean>;
  verifyOTP: (code) => Promise<boolean>;
  initAuthListener: () => () => void; // Returns unsubscribe
}
```

All setter methods that mutate user profile also sync to Firestore (`firebaseService.updateUserProfile()`).

### Data Flow Through Stores

```
Component
   │
   ├─► useAuthStore() → user object
   ├─► useSensorStore() → safety status + sensors
   ├─► useAlertStore() → recent alerts
   ├─► useJourneyStore() → active journey
   ├─► useContactStore() → trusted contacts
   └─► useSettingsStore() → user preferences
          │
          ▼
      External data sources
   (Firestore, Backend API, GPS)
          │
          ▼
      Store actions trigger updates
   (set, fetch, subscribe)
          │
          ▼
      Components rerender on state change
   (automatic via hooks)
```

---

## Database Schema

### Firestore Structure

```
firestore/
│
├── users/
│   └── {userId}/
│       ├── [doc] Profile data
│       │   ├── id: string
│       │   ├── name: string
│       │   ├── phone: string
│       │   ├── language: 'en' | 'kn'
│       │   ├── onboardingComplete: boolean
│       │   ├── createdAt: timestamp (ms)
│       │   └── settings: {
│       │       ├── alertSensitivity: 'low' | 'medium' | 'high'
│       │       ├── silentMode: boolean
│       │       └── locationSharing: boolean
│       │       }
│       │
│       ├── alerts/ (subcollection)
│       │   └── {alertId}/
│       │       ├── id: string
│       │       ├── type: 'manual_sos' | 'elevated_hr' | 'fall_detected' | ...
│       │       ├── title: string
│       │       ├── description: string
│       │       ├── outcome: 'active' | 'resolved' | 'false_alarm'
│       │       ├── severity: 'high' | 'moderate' | 'low'
│       │       ├── timestamp: timestamp (ms)
│       │       ├── location: { latitude, longitude }
│       │       ├── locationLabel: string
│       │       ├── locationAddress: string
│       │       ├── sensorSnapshot: { heartRate, motion, ... }
│       │       └── narrativeDetail: string
│       │
│       ├── contacts/ (subcollection)
│       │   └── {contactId}/
│       │       ├── id: string
│       │       ├── name: string
│       │       ├── phone: string
│       │       ├── relationship: string ('Sister', 'Partner', etc.)
│       │       ├── deliveryMethod: 'nari' | 'sms' | 'whatsapp'
│       │       ├── avatarInitial: string
│       │       ├── avatarColor: string
│       │       └── isNariUser: boolean
│       │
│       └── journeys/ (subcollection)
│           └── {journeyId}/
│               ├── id: string
│               ├── label: string ('Walking home')
│               ├── isActive: boolean
│               ├── startedAt: timestamp (ms)
│               ├── endedAt: timestamp (ms) [null if active]
│               └── watchingContacts: [name1, name2, ...]
│
├── incidents/ (global, community-wide)
│   └── {incidentId}/
│       ├── id: string
│       ├── type: string ('Suspicious activity', 'Poor lighting', ...)
│       ├── severity: 'high' | 'moderate' | 'low'
│       ├── location: { latitude, longitude }
│       ├── locationLabel: string
│       ├── description: string
│       ├── reportedAt: timestamp (ms)
│       └── narrativeDetail: string
```

### Database Access Patterns

| Operation | Path | Purpose |
|-----------|------|---------|
| Get user profile | `users/{userId}` | Auth state, settings |
| List alerts | `users/{userId}/alerts?orderBy=timestamp desc` | Alert history |
| Subscribe to incidents | `incidents?orderBy=reportedAt desc&limit=50` | Map heatmap |
| Add contact | `users/{userId}/contacts/{contactId}` | Emergency list |
| Start journey | `users/{userId}/journeys/{journeyId}` | Journey tracking |
| Write auto-SOS | `users/{userId}/alerts/{alertId}` | Danger detected |

---

## BLE & Sensor Protocol

### HTTP REST Protocol (Current Implementation)

The ESP32 communicates with the backend via HTTP POST (WiFi). This is not true BLE; future work involves Bluetooth Low Energy.

**Endpoint**: `POST /ingest`

**Authentication**: `X-API-Key: <API_SECRET_KEY>`

**Payload Format**:
```json
{
  "userId": "user-uuid",
  "hr": 75.0,
  "ibi": 800.0,
  "imu": [
    { "ax": 0.1, "ay": 0.05, "az": 0.95, "gx": 0.0, "gy": 0.1, "gz": 0.05 },
    { "ax": 0.12, "ay": 0.07, "az": 0.93, "gx": 0.02, "gy": 0.08, "gz": 0.06 },
    ...
  ]
}
```

**Fields**:
- `userId`: User identifier (string) — used to route inference result to correct user's alerts
- `hr`: Heart rate (beats per minute) — 0.0 if no finger detected
- `ibi`: Inter-beat interval (milliseconds) — 0.0 if no finger detected
- `imu`: Array of 10 IMU samples, each with 6 axes

**Sampling Rate**: 50 Hz IMU → 10 samples per batch → 1 POST request every 200 ms (5 requests/second)

**Response**:
```json
{ "status": "ok" }
```

### Local Emergency Detection (On-Device, ESP32)

The firmware runs threshold-based detection on each batch:

| Threshold | Metric | Trigger | Action |
|-----------|--------|---------|--------|
| < 0.4 g | Total acceleration | Free fall detected | Serial log: `[WARNING] Possible free fall!` |
| > 2.5 g | Total acceleration | Impact detected | Serial log: `[DANGER] Strong impact detected!` |
| > 3.5 rad/s | Total gyro rotation | Shake/struggle | Serial log: `[ALERT] Rapid body/hand movement!` |
| > 250 ADU | Audio peak-to-peak | Scream detected | Serial log: `[ALERT] Possible scream detected!` |
| Impact + Gyro | Combined | Emergency condition | Serial log: `####  EMERGENCY: Possible attack/distress` |

These logs are printed to UART/Serial for debugging; they do **not** trigger SOS directly (that requires backend ML inference).

---

## Safety Score Computation

### Fusion Logic (Rule-Based)

```python
def compute_safety_score(lstm_probs, tcn_probs) -> tuple[int, str]:
    """
    Input:
      lstm_probs: [prob_baseline, prob_stress]  — from LSTM model
      tcn_probs: [prob_activity_0, ..., prob_activity_5]  — from TCN model
    
    Output:
      (score: int 0-100, level: 'safe' | 'alert' | 'danger')
    """
    
    score = 100
    prob_stress = lstm_probs[1]
    
    # If stress detected, reduce score
    if prob_stress > 0.5:
        score -= 40
    
    # If high stress, check motion
    is_stationary = tcn_probs[0] + tcn_probs[1] > 0.5
    
    if prob_stress > 0.7:
        if is_stationary:
            score -= 20  # Stationary + high stress → very dangerous
        else:
            score -= 10  # Active + high stress → moderate danger
    
    # Clip to [0, 100]
    score = max(0, min(100, score))
    
    # Map to levels
    if score >= 80:
        level = 'safe'
    elif score >= 50:
        level = 'alert'
    else:
        level = 'danger'  # Auto-trigger SOS
    
    return score, level
```

### Inference Pipeline (Backend)

```
1. receive /ingest POST
   ├─► Buffers: accumulate IMU, HR, IBI
   
2. run_inference() background task
   ├─► Extract LSTM features (60s window):
   │   ├── mean_hr
   │   ├── rmssd (HRV metric)
   │   ├── mean_eda (electrodermal activity) — mocked as 1.5
   │   ├── eda_slope — mocked as 0.0
   │   ├── mean_temp — mocked as 32°C
   │   ├── temp_slope — mocked as 0.0
   │   └── → 8-dim vector
   │
   ├─► Extract TCN features (3.2s window):
   │   ├── Normalize accel + gyro
   │   ├── Shape: (1, 160, 6)  ← 160 samples × 6 axes
   │   └─► pass to TCN model
   │
   ├─► Run models with torch.no_grad():
   │   ├── lstm_logits = lstm_model(lstm_input)
   │   ├── lstm_probs = softmax(lstm_logits)  → [prob_baseline, prob_stress]
   │   ├── tcn_logits = tcn_model(tcn_input)
   │   ├── tcn_probs = softmax(tcn_logits)  → [prob_cls0, ..., prob_cls5]
   │   └─► record latencies
   │
   ├─► Fuse: score, level = compute_safety_score(lstm_probs, tcn_probs)
   │
   ├─► Update state.current_score, state.current_level
   │
   └─► If level=='danger' and prior != 'danger':
       └─► Write alert to Firestore:
           ├── type: 'auto_sos'
           ├── outcome: 'active'
           ├── severity: 'high'
           └── sensorSnapshot: { stress: { value: 100 - score } }
```

### Safety Score Thresholds

| Score Range | Level | UI Color | Action |
|-------------|-------|----------|--------|
| 80–100 | Safe | 🟢 Green | Normal operation |
| 50–79 | Alert | 🟡 Yellow | Notify user; standby contacts on alert |
| 0–49 | Danger | 🔴 Red | Auto SOS; emergency contacts notified immediately |

---

## External Services

### Firebase (Firestore + Auth + Cloud Functions)

- **Authentication**: Phone sign-in flow via Firebase Auth
- **Database**: Firestore for user profiles, alerts, contacts, journeys
- **Real-time Listeners**: `onSnapshot()` for live alert/incident updates
- **Cloud Functions** (future): Route alerts to SMS/WhatsApp based on contact preferences

### OpenStreetMap / MapLibre

- **Map Tiles**: Community incident heatmap displayed on interactive map
- **Filtering**: Nearby incidents within 5 km radius by severity

### SMS/WhatsApp APIs (Future)

- **Twilio** or equivalent for SMS delivery
- **WhatsApp Business API** for WhatsApp delivery
- **Nari app**: Push notifications via Firebase Cloud Messaging

### HTTP Backend (FastAPI)

- **Endpoints**:
  - `POST /ingest` — Sensor data ingestion
  - `GET /status` — Current safety status (polled every 3s)
  - `GET /status/debug` — ML debug metrics (latency, buffer fill)
  - `POST /journey/start` — Journey mode activation
  - `POST /journey/end` — Journey mode completion
  - `POST /sos/cancel` — False alarm cancellation

---

## Deployment Architecture (Future)

```
┌─────────────────┐
│  CDN (Static)   │  ← Frontend build (web-only)
└────────┬────────┘

┌─────────────────────────────────────────────┐
│  Cloud Provider (AWS/GCP/Azure)             │
├─────────────────────────────────────────────┤
│ • ECS / Cloud Run (FastAPI Backend)         │
│ • Cloud Firestore (Database)                │
│ • Cloud Functions (Alert Routing)           │
│ • Cloud Storage (Logs, Backups)             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Device Layer                               │
├─────────────────────────────────────────────┤
│ • iOS App (TestFlight / App Store)          │
│ • Android App (Play Store)                  │
│ • ESP32 Firmware (OTA Updates)              │
└─────────────────────────────────────────────┘
```

---

## Summary

NARI is a **full-stack safety platform** with:
- **Wearable sensor tier**: Real-time biometric & motion collection
- **Cloud inference tier**: ML-driven threat detection & alert routing
- **Mobile UI tier**: User-centric dashboard, emergency modes, social accountability
- **Database tier**: Firestore for real-time, event-driven architecture

The architecture prioritizes **low latency** (inference in ~100-200ms), **reliability** (fallback to mock data if backend down), and **user privacy** (data siloed per user, location optional).
