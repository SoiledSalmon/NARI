# NARI — Data Layer

The DataProvider abstraction is the most important architectural decision in NARI. This document defines every type, interface, and mock implementation pattern the agent needs to build it correctly.

---

## Core Principle

No screen, component, or hook ever accesses hardware, BLE, or cloud APIs directly. Everything goes through `IDataProvider`. The active provider is selected by `dataConfig.ts`. Switching from mock to live requires changing one boolean. Zero UI changes.

---

## 1. All TypeScript Types (`src/data/types.ts`)

```typescript
// ─── Status ──────────────────────────────────────────────────────────────────

export type SafetyStatus = 'safe' | 'low_risk' | 'elevated' | 'high_risk' | 'danger';
export type SignalStatus = 'normal' | 'elevated' | 'abnormal';
export type ConnectionStatus = 'connected' | 'disconnected' | 'searching';
export type CalibrationStatus = 'uncalibrated' | 'partial' | 'calibrated';
export type AlertOutcome = 'resolved' | 'false_alarm' | 'escalated';
export type AlertType = 'auto_ml' | 'manual' | 'journey_checkin' | 'physical_button';
export type ContactDelivery = 'nari_app' | 'sms' | 'whatsapp';
export type Relationship = 'mother' | 'father' | 'sister' | 'brother' | 'friend' | 'partner' | 'other';
export type FalseAlarmReason = 'exercising' | 'running' | 'dancing' | 'other';
export type SensorHealth = 'active' | 'inactive' | 'error';
export type Language = 'en' | 'kn';

// ─── Sensor Readings ─────────────────────────────────────────────────────────

export interface HRReading {
  bpm: number;
  rmssd: number;             // HRV in ms
  zScore: number;            // z-score vs user baseline
  timestamp: number;         // unix ms
}

export interface IMUReading {
  ax: number; ay: number; az: number;   // accelerometer, g
  gx: number; gy: number; gz: number;   // gyroscope, deg/s
  sma: number;                           // Signal Magnitude Area
  activityLabel: 'still' | 'active' | 'abnormal';
  timestamp: number;
}

export interface SensorBundle {
  hr: HRReading;
  imu: IMUReading;
  timestamp: number;
}

// ─── ML Outputs ──────────────────────────────────────────────────────────────

export interface LSTMOutput {
  stressLabel: 'normal' | 'elevated' | 'racing';
  confidence: number;        // 0–1
  timestamp: number;
}

export interface TCNOutput {
  motionLabel: 'still' | 'active' | 'abnormal';
  confidence: number;
  timestamp: number;
}

export interface ContextOutput {
  locationRiskScore: number; // 0–1
  timeOfDayFactor: number;   // 0–1
  speedKmh: number;
  isJourneyMode: boolean;
}

export interface CNNOutput {
  available: false;          // Phase 2: always false. Phase 3+: true when mic active
  distressDetected?: boolean;
  confidence?: number;
  timestamp?: number;
}

export interface FusionOutput {
  safetyScore: number;       // 0–100
  status: SafetyStatus;
  lstmContribution: number;  // 0–1 weight
  tcnContribution: number;
  contextContribution: number;
  timestamp: number;
}

// ─── Full Status Snapshot ─────────────────────────────────────────────────────

export interface StatusSnapshot {
  fusion: FusionOutput;
  lstm: LSTMOutput;
  tcn: TCNOutput;
  context: ContextOutput;
  cnn: CNNOutput;
  sensors: SensorBundle;
  areaName: string;
  timestamp: number;
}

// ─── Location ─────────────────────────────────────────────────────────────────

export interface LocationReading {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number;             // m/s
  timestamp: number;
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export interface AlertEvent {
  id: string;
  type: AlertType;
  triggeredAt: number;       // unix ms
  resolvedAt: number | null;
  outcome: AlertOutcome | null;
  location: LocationReading | null;
  snapshotAtTrigger: StatusSnapshot;
  falseAlarmReason: FalseAlarmReason | null;
  contactsNotified: string[];  // contact IDs
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;             // E.164 format
  relationship: Relationship;
  delivery: ContactDelivery; // resolved at alert time — not stored statically
  hasNariApp: boolean;       // checked periodically
  priority: number;          // 1 = highest
  avatarUri?: string;
}

// ─── Device ───────────────────────────────────────────────────────────────────

export interface DeviceState {
  connectionStatus: ConnectionStatus;
  batteryPercent: number | null;
  batteryHoursRemaining: number | null;
  signalStrength: number | null;  // RSSI dBm
  lastSyncTimestamp: number | null;
  sensorHealth: {
    hr: SensorHealth;
    imu: SensorHealth;
    mic: SensorHealth;
    gps: SensorHealth;
    gsm: SensorHealth;
    sosButton: SensorHealth;
  };
}

// ─── Calibration ─────────────────────────────────────────────────────────────

export interface CalibrationState {
  daysCalibrated: number;    // 0–14
  status: CalibrationStatus;
  hrBaseline: { mean: number; std: number } | null;
  motionBaseline: { mean: number; std: number } | null;
  hrvBaseline: { mean: number; std: number } | null;
  startedAt: number | null;
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────

export interface IncidentPoint {
  id: string;
  lat: number;
  lng: number;
  severity: 'high' | 'medium' | 'low';
  type: 'motion' | 'audio' | 'manual_sos';
  timestamp: number;
  areaName: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface AlertNotificationPayload {
  type: 'sos_incoming';
  triggeredByUserId: string;
  triggeredByName: string;
  triggeredByAvatarUrl?: string;
  alertId: string;
  alertType: AlertType;
  location: LocationReading | null;
  triggeredAt: number;
}

export interface ResolutionNotificationPayload {
  type: 'sos_resolved';
  triggeredByName: string;
  alertId: string;
  resolvedAt: number;
}
```

---

## 2. IDataProvider Interface (`src/data/providers/DataProvider.ts`)

```typescript
export interface IDataProvider {
  // ─── Sensor Streams ────────────────────────────────────────────────────────
  // Subscribe returns an unsubscribe function
  subscribeToSensors(callback: (bundle: SensorBundle) => void): () => void;
  subscribeToLocation(callback: (loc: LocationReading) => void): () => void;
  subscribeToDeviceState(callback: (state: DeviceState) => void): () => void;

  // ─── ML Outputs ────────────────────────────────────────────────────────────
  subscribeToMLOutput(callback: (snapshot: StatusSnapshot) => void): () => void;

  // ─── One-shot reads ────────────────────────────────────────────────────────
  getCurrentSnapshot(): Promise<StatusSnapshot>;
  getDeviceState(): Promise<DeviceState>;
  getCalibrationState(): Promise<CalibrationState>;

  // ─── Heatmap ───────────────────────────────────────────────────────────────
  getNearbyIncidents(lat: number, lng: number, radiusKm: number): Promise<IncidentPoint[]>;

  // ─── Alert dispatch ────────────────────────────────────────────────────────
  dispatchSOS(type: AlertType, location: LocationReading | null): Promise<AlertEvent>;
  resolveAlert(alertId: string): Promise<void>;
  logFalseAlarm(alertId: string, reason: FalseAlarmReason | null): Promise<void>;

  // ─── Contact routing ───────────────────────────────────────────────────────
  checkContactsHaveNari(phones: string[]): Promise<Record<string, boolean>>;

  // ─── Demo Mode ─────────────────────────────────────────────────────────────
  startDemoMode(): void;
  stopDemoMode(): void;
}
```

---

## 3. MockDataProvider (`src/data/providers/MockDataProvider.ts`)

Key implementation notes — agent should build this with the following behavior:

### Sensor subscription
- HR: sine wave. Base 72 bpm, amplitude ±8, period 60s. Add small random noise (±2 bpm).
- IMU: random walk. SMA baseline 0.45g ± 0.15. Activity label mostly 'still', cycles to 'active' for 10s every 2 minutes.
- Updates every 1 second.

### ML output subscription
- LSTM: cycles through 'normal' (80%), 'elevated' (15%), 'racing' (5%) in a weighted random loop.
- TCN: mirrors IMU activity label with 1-2s lag.
- Fusion score: derived formula — `score = 100 - (lstmWeight * 40 + tcnWeight * 40 + contextWeight * 20)`. Default weights are low, giving score 75–90.
- Updates every 3 seconds.

### Device state
- Returns: connected, 78% battery, all sensor health 'active', last sync = now.

### Calibration state
- Returns day 4 of 14, status 'partial', HR baseline { mean: 72, std: 5 }.

### Nearby incidents
- Generates 8–15 `IncidentPoint` objects clustered within 2km of the given lat/lng.
- Mix: 50% motion, 30% manual_sos, 20% audio.
- Mix: 40% low, 40% medium, 20% high severity.
- Timestamps scattered over the last 30 days.

### Alert dispatch
- Logs to console: `[MOCK SOS] Alert dispatched: ${type}`.
- Returns a mock `AlertEvent` with generated ID.
- Does NOT send actual SMS. If `dataConfig.TEST_SMS_ENABLED` is true and `EXPO_PUBLIC_TEST_CONTACT_NUMBER` is set, sends a real SMS to that one number only.

### NARI contact check
- Returns `false` for all numbers by default. To test the in-app alert path, set one contact number in `.env` as `EXPO_PUBLIC_MOCK_NARI_NUMBER` and return `true` for that number.

---

## 4. Demo Mode Script (`src/data/mockData/demoModeScript.ts`)

The 90-second scripted sequence triggered by tapping version number 5 times in Settings → About.

```typescript
export interface DemoStep {
  startAt: number;       // seconds from demo start
  duration: number;      // seconds
  sensorOverride: Partial<SensorBundle>;
  mlOverride: Partial<StatusSnapshot>;
  uiEvent?: 'show_ambiguous_banner' | 'trigger_sos_countdown' | 'show_post_alert_card';
}

export const DEMO_SCRIPT: DemoStep[] = [
  // 0–30s: Normal state
  {
    startAt: 0, duration: 30,
    sensorOverride: { hr: { bpm: 72, rmssd: 45, zScore: 0.3 } },
    mlOverride: { fusion: { safetyScore: 85, status: 'safe' }, lstm: { stressLabel: 'normal', confidence: 0.91 } }
  },
  // 30–40s: Elevated motion
  {
    startAt: 30, duration: 10,
    sensorOverride: { imu: { sma: 1.8, activityLabel: 'active' } },
    mlOverride: { fusion: { safetyScore: 62, status: 'elevated' }, tcn: { motionLabel: 'active', confidence: 0.83 } }
  },
  // 40–50s: Stress spike
  {
    startAt: 40, duration: 10,
    sensorOverride: { hr: { bpm: 118, rmssd: 14, zScore: 2.8 }, imu: { sma: 2.4, activityLabel: 'abnormal' } },
    mlOverride: { fusion: { safetyScore: 28, status: 'high_risk' }, lstm: { stressLabel: 'racing', confidence: 0.88 }, tcn: { motionLabel: 'abnormal', confidence: 0.79 } },
    uiEvent: 'show_ambiguous_banner'
  },
  // 50–60s: Distress — trigger SOS countdown
  {
    startAt: 50, duration: 10,
    sensorOverride: { hr: { bpm: 134, rmssd: 11, zScore: 3.6 } },
    mlOverride: { fusion: { safetyScore: 8, status: 'danger' } },
    uiEvent: 'trigger_sos_countdown'
  },
  // 60–90s: User dismisses, post-alert card shown
  {
    startAt: 60, duration: 30,
    sensorOverride: { hr: { bpm: 78, rmssd: 42, zScore: 0.5 } },
    mlOverride: { fusion: { safetyScore: 80, status: 'safe' } },
    uiEvent: 'show_post_alert_card'
  }
];
```

`useDemoMode` hook manages the timer, steps through `DEMO_SCRIPT`, and overrides the store values.

---

## 5. Theme Tokens (`src/theme/colors.ts`)

```typescript
export const colors = {
  // Semantic status — used everywhere status-dependent UI exists
  status: {
    safe:      '#1A7A5E',   // deep confident green
    low_risk:  '#2D9970',
    elevated:  '#D4820A',   // warm amber
    high_risk: '#B85C00',
    danger:    '#C0392B',   // deep red
  },

  // Status backgrounds (full-screen, slightly different from text/icon colors)
  statusBg: {
    safe:     '#0D3D2E',
    elevated: '#3D2200',
    danger:   '#3D0A0A',
  },

  // Brand (resting UI)
  brand: {
    primary:   '#00C896',
    secondary: '#065F52',
    dark:      '#09110F',
  },

  // Surfaces
  surface: {
    bg:       '#09110F',
    card:     '#111C19',
    card2:    '#1A2B27',
    border:   '#1E3530',
  },

  // Text
  text: {
    primary:  '#E8F4F1',
    muted:    '#6B9E95',
    inverse:  '#09110F',
  },

  // SOS emergency
  sos: {
    bg:          '#8B0000',
    text:        '#FFF5F5',   // off-white — passes 4.5:1 on sos.bg
    buttonText:  '#FFF5F5',
    cancelBg:    'rgba(255,245,245,0.15)',
  },

  // Dot indicators (sensor status)
  dot: {
    green:  '#00C896',
    amber:  '#F59E0B',
    red:    '#EF4444',
    grey:   '#4B6B65',
  },
};
```

---

## 6. Localization Structure (`src/locales/en.json` shape)

The `kn.json` file must mirror this structure exactly. Every key present in `en.json` must have a corresponding key in `kn.json`.

```json
{
  "onboarding": {
    "language": { "title": "Choose your language", "english": "English", "kannada": "ಕನ್ನಡ" },
    "welcome": {
      "slide1": { "title": "Your bangle watches, so you don't have to", "body": "..." },
      "slide2": { "title": "Alerts reach your people, instantly", "body": "..." },
      "slide3": { "title": "Smarter the longer you wear it", "body": "..." }
    },
    "contacts": { "header": "Who should NARI contact if you need help?", "minRequired": "Add at least one contact" },
    "permissions": {
      "location": { "label": "Location", "reason": "So NARI knows where you are if something happens" },
      "notifications": { "label": "Notifications", "reason": "So alerts reach you instantly" },
      "contacts": { "label": "Contacts", "reason": "To check if your contacts have NARI installed" },
      "microphone": { "label": "Microphone", "reason": "For voice distress detection — you can enable this later" }
    }
  },
  "home": {
    "status": {
      "safe": "You're Safe",
      "low_risk": "Stay Aware",
      "elevated": "Stay Alert",
      "high_risk": "Be Careful",
      "danger": "Danger Detected"
    },
    "journey": {
      "off": "Travelling alone? Enable journey mode.",
      "arrived": "I've Arrived Safely",
      "watching": "{{names}} watching"
    },
    "calibration": "Day {{day}} of 14 · Learning your baseline",
    "ble_disconnected": "Can't reach your bangle. Make sure it's charged and nearby."
  },
  "status": {
    "labels": {
      "safe": "Safe", "low_risk": "Low Risk", "elevated": "Elevated",
      "high_risk": "High Risk", "danger": "Danger"
    },
    "signals": {
      "heartbeat": { "normal": "Normal", "elevated": "Elevated", "racing": "Racing" },
      "movement": { "still": "Still", "active": "Active", "abnormal": "Unusual Movement Detected" },
      "surroundings": { "low": "Low risk area", "moderate": "Moderate risk area", "high": "High risk area, stay aware" },
      "voice": { "coming_soon": "Coming soon — voice detection" }
    },
    "monitoring": "NARI is monitoring {{n}} signals",
    "technical_view": "Technical View",
    "api_unavailable": "Cloud analysis unavailable. Local monitoring active."
  },
  "sos": {
    "countdown": {
      "heading": "SOS",
      "body": "NARI will alert your contacts in {{n}} seconds",
      "cancel": "I'm Safe"
    },
    "active": {
      "contacting": "Contacting {{name}}...",
      "contacted": "Contacting {{name}}",
      "gps_shared": "GPS location shared",
      "call_112": "Call 112 — Emergency Services",
      "im_safe": "I'm Safe Now",
      "contacts_notified": "All your contacts will be notified you're okay."
    },
    "false_alarm": {
      "prompt": "What were you doing?",
      "exercising": "Exercising",
      "running": "Running",
      "dancing": "Dancing",
      "other": "Other"
    }
  },
  "alert_received": {
    "title": "{{name}} may need help",
    "context": "NARI detected unusual activity · {{n}} minutes ago",
    "call": "Call {{name}}",
    "navigate": "Navigate to their location",
    "im_with_them": "I'm with them — mark safe",
    "others_notified": "Other contacts have also been notified.",
    "resolved": "{{name}} has marked themselves safe.",
    "location_unavailable": "Location signal was unavailable when alert was sent."
  },
  "settings": {
    "test_alert": "Send Test Alert",
    "federated_learning": "Help improve NARI for everyone — share anonymised training signals. No personal data leaves your device.",
    "language_confirm": "Switch to {{language}}? The app will restart.",
    "demo_mode_unlocked": "Demo mode activated"
  },
  "errors": {
    "ble_failed": "Can't reach your bangle. Make sure it's charged and nearby.",
    "api_timeout": "Can't connect to NARI's servers. Local monitoring is still active.",
    "location_off": "Location unavailable.",
    "sms_failed": "⚠ {{name}} — message failed. Try calling directly.",
    "generic": "Something went wrong. Please try again."
  }
}
```
