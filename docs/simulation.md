# NARI — Mock Data & Simulation

Defines what simulated data looks like, how the Demo Mode script works, and exactly what each `dataConfig` flag controls. Every Phase 2 simulation is designed to be visually representative of production behavior.

---

## dataConfig.ts (root level)

```typescript
// dataConfig.ts — the single file that controls the entire data layer.
// Change any flag from false to true to use real data for that source.
// No other file should need to change.

const dataConfig = {
  // Sensor data from ESP32 bangle via BLE
  useRealHR:       false,   // → BLE MAX30102 characteristic
  useRealIMU:      false,   // → BLE MPU-6050 characteristic
  useRealBLE:      false,   // → enables BLE scanning and connection

  // ML inference from cloud API
  useRealLSTM:     false,   // → POST /api/infer/lstm
  useRealTCN:      false,   // → POST /api/infer/tcn
  useRealFusion:   false,   // → POST /api/infer/fusion

  // Map data
  useRealHeatmap:  false,   // → crime/community API

  // Messaging
  useRealSMS:      false,   // → Twilio / Fast2SMS API

  // GPS is always real — no simulation needed
  useRealGPS:      true,

  // Phase 2 test helpers
  TEST_SMS_ENABLED:          false,   // send real SMS to TEST_CONTACT_NUMBER only
  MOCK_NARI_CONTACT_NUMBER:  '',      // phone number to simulate as having NARI installed
} as const;

export default dataConfig;
```

---

## Simulated Sensor Sequences

### Heart Rate (`MockDataProvider.subscribeToSensors`)

Update interval: 1000ms

```
bpm:   72 + 8 * sin(t * 2π / 60) + random(-2, 2)
         where t = seconds since session start

rmssd: 45 - (bpm - 72) * 0.8 + random(-3, 3)
       clamped to [10, 80]

zScore: (bpm - 72) / 8
```

**Scripted spike** (triggered by Demo Mode or manual test):
- Over 15 seconds, ramp bpm from current to 128
- rmssd drops to 12
- zScore rises to 3.5
- After spike event: ramp back to baseline over 20 seconds

### IMU (`MockDataProvider.subscribeToSensors`)

Update interval: 1000ms

```
Normal state (90% of time):
  ax, ay, az: random walk ±0.05g per step, clamped to [-0.3g, 0.3g]
  gx, gy, gz: random walk ±2°/s, clamped to [-15°/s, 15°/s]
  sma: 0.42 + random(-0.08, 0.08)
  activityLabel: 'still'

Active state (cycles: 10s every 2 minutes):
  ax, ay: higher amplitude walk ±0.2g
  sma: 1.2 + random(-0.2, 0.2)
  activityLabel: 'active'

Abnormal state (only during Demo Mode or scripted events):
  sma: 2.4 + random(-0.3, 0.3)
  gx, gy, gz: spike to ±180°/s
  activityLabel: 'abnormal'
```

### ML Outputs (`MockDataProvider.subscribeToMLOutput`)

Update interval: 3000ms (ML runs on 10s windows, but we update UI every 3s for demo responsiveness)

```typescript
// Weighted random for LSTM stress label
const LSTM_WEIGHTS = {
  'normal':   0.80,
  'elevated': 0.15,
  'racing':   0.05,
};

// LSTM confidence: 0.75 + random(0, 0.20)
// TCN label: mirrors current IMU activityLabel with 2s lag
// TCN confidence: 0.70 + random(0, 0.25)

// Fusion score formula:
const lstmScore   = { normal: 0, elevated: 50, racing: 90 }[lstmLabel];
const tcnScore    = { still: 0, active: 30, abnormal: 85 }[tcnLabel];
const ctxScore    = locationRiskScore * 100;
const rawScore    = lstmScore * 0.4 + tcnScore * 0.4 + ctxScore * 0.2;
const safetyScore = Math.round(100 - rawScore);

// Status mapping:
// 80–100 → 'safe'
// 60–79  → 'low_risk'
// 40–59  → 'elevated'
// 20–39  → 'high_risk'
// 0–19   → 'danger'
```

### Device State (static mock)

```typescript
const MOCK_DEVICE_STATE: DeviceState = {
  connectionStatus:     'connected',
  batteryPercent:       78,
  batteryHoursRemaining: 14,
  signalStrength:       -62,  // dBm
  lastSyncTimestamp:    Date.now(),
  sensorHealth: {
    hr:        'active',
    imu:       'active',
    mic:       'inactive',   // Phase 2 — mic not integrated
    gps:       'active',
    gsm:       'active',
    sosButton: 'active',
  }
};
```

### Calibration State (static mock)

```typescript
const MOCK_CALIBRATION: CalibrationState = {
  daysCalibrated: 4,
  status:         'partial',
  hrBaseline:     { mean: 72, std: 8 },
  motionBaseline: { mean: 0.44, std: 0.15 },
  hrvBaseline:    { mean: 44, std: 10 },
  startedAt:      Date.now() - (4 * 24 * 60 * 60 * 1000),
};
```

---

## Seeded Heatmap Data (`src/data/mockData/heatmapSeed.ts`)

`getNearbyIncidents(lat, lng, radiusKm)` generates synthetic incidents relative to the real GPS location. Generated once on call, then cached for the session.

```typescript
function generateIncidents(centerLat: number, centerLng: number): IncidentPoint[] {
  const COUNT = 12;
  return Array.from({ length: COUNT }, (_, i) => {
    const angle    = (i / COUNT) * 2 * Math.PI + random(0, 0.5);
    const distance = random(0.2, 4.5);   // km
    const latOffset = (distance / 111) * Math.cos(angle);
    const lngOffset = (distance / (111 * Math.cos(centerLat * π/180))) * Math.sin(angle);

    return {
      id:        `mock_${i}`,
      lat:       centerLat + latOffset,
      lng:       centerLng + lngOffset,
      severity:  weighted(['high','medium','low'], [0.20, 0.40, 0.40]),
      type:      weighted(['motion','manual_sos','audio'], [0.50, 0.30, 0.20]),
      timestamp: Date.now() - random(1, 30) * 24 * 60 * 60 * 1000,
      areaName:  AREA_NAMES[i % AREA_NAMES.length],
    };
  });
}

// Area names (Bengaluru-specific for demo authenticity):
const AREA_NAMES = [
  'Koramangala', 'HSR Layout', 'JP Nagar', 'BTM Layout',
  'Jayanagar', 'Banashankari', 'Electronic City', 'Whitefield',
  'Indiranagar', 'Marathahalli', 'Hebbal', 'Yelahanka'
];
```

---

## Demo Mode Script (`src/data/mockData/demoModeScript.ts`)

Triggered by tapping version number 5 times in Settings → About. Runs via `useDemoMode` hook.

Full 90-second sequence:

| Time | Duration | What happens |
|---|---|---|
| 0s | 30s | Normal state. HR ~72, SMA ~0.44, score ~83. Status: Safe. |
| 30s | 10s | Elevated motion. SMA rises to 1.8, activity → active. Score drops to ~62. Status: Elevated. TCN confidence visible in Technical View. |
| 40s | 10s | Stress spike. HR ramps to 118, rmssd drops to 14, SMA → 2.4, activity → abnormal. Score → 28. Status: High Risk. AMBIGUOUS banner appears on Home screen. |
| 50s | 10s | Distress. HR 134, rmssd 11. Score → 8. Status: Danger. SOS Countdown screen launches automatically (as if triggered by ML pipeline). |
| 60s | 5s | User sees countdown. Taps "I'm Safe". |
| 65s | 5s | False alarm reason sheet. "Exercising" option highlighted. |
| 70s | 20s | Return to normal. Score ramps back to ~80. Post-alert explanation card visible on Home: "What triggered this?" with signal values. |

```typescript
// useDemoMode.ts
export function useDemoMode() {
  const navigation = useNavigation();
  const { overrideSensors, clearOverride } = useSensorStore();

  function start() {
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 1;
      const step = DEMO_SCRIPT.findLast(s => s.startAt <= elapsed);
      if (!step) return;

      overrideSensors(step.sensorOverride, step.mlOverride);

      if (step.uiEvent === 'show_ambiguous_banner' && elapsed === step.startAt) {
        // show non-intrusive banner on home
      }
      if (step.uiEvent === 'trigger_sos_countdown' && elapsed === step.startAt) {
        navigation.navigate(Routes.SOS_COUNTDOWN, { triggeredBy: 'auto_ml' });
      }
      if (step.uiEvent === 'show_post_alert_card' && elapsed === step.startAt) {
        clearOverride();
        // set alertStore.showPostAlertCard = true
      }
      if (elapsed >= 90) {
        clearInterval(interval);
        clearOverride();
      }
    }, 1000);

    return () => clearInterval(interval);
  }

  return { start };
}
```

---

## Alert History Seed (for first launch with no real history)

Pre-populate `alertStore.history` with 3 mock past events so Alert History and Recent Alerts sections on Home are never empty during demos:

```typescript
export const SEEDED_ALERT_HISTORY: AlertEvent[] = [
  {
    id: 'seed_001',
    type: 'auto_ml',
    triggeredAt: Date.now() - 3 * 60 * 60 * 1000,  // 3 hours ago
    resolvedAt:  Date.now() - 3 * 60 * 60 * 1000 + 13 * 60 * 1000,
    outcome:     'false_alarm',
    falseAlarmReason: 'exercising',
    contactsNotified: [],
    // snapshot: use MOCK_SAFE_SNAPSHOT with elevated values
  },
  {
    id: 'seed_002',
    type: 'manual',
    triggeredAt: Date.now() - 2 * 24 * 60 * 60 * 1000,  // 2 days ago
    resolvedAt:  Date.now() - 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000,
    outcome:     'resolved',
    falseAlarmReason: null,
    contactsNotified: ['contact_1'],
  },
  {
    id: 'seed_003',
    type: 'journey_checkin',
    triggeredAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    resolvedAt:  Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000,
    outcome:     'resolved',
    falseAlarmReason: null,
    contactsNotified: ['contact_1', 'contact_2'],
  },
];
```

Only inject seeded history if `alertStore.history.length === 0` AND `dataConfig.useRealBLE === false` (i.e., we are in Phase 2 simulation mode).
