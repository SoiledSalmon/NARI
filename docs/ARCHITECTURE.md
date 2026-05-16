# NARI — Architecture

This document defines the technology stack, folder structure, and key architectural patterns for the NARI app. Where a decision is not specified, use your best judgment for a production-grade React Native app of this complexity.

---

## Tech Stack

### Core
- **React Native** — cross-platform, Android + iOS
- **TypeScript** — strict mode enabled. No `any` types.
- **Expo** (recommended) — managed workflow for Phase 2. Simplifies BLE, notifications, and OTP integration. Eject only if a required native module cannot be handled by Expo.

### Navigation
- **React Navigation v6+** — native stack navigator for auth/onboarding, bottom tab navigator for main app, modal presentation for overlay screens.
- Tab bar is custom-rendered to accommodate the floating SOS button above it.

### State Management
- **Zustand** — preferred for its simplicity and TypeScript ergonomics. One store per domain slice (auth, sensors, alerts, contacts, settings, journey).
- React Query (TanStack Query) for server state — alert history fetching, contact sync.
- Local state (`useState`) for purely UI-level state.

### Styling
- **NativeWind v4** (Tailwind for React Native) — for layout and spacing.
- React Native StyleSheet for component-level styles that require precise control (animations, dynamic color transitions).
- CSS variables not available in RN — use a `theme.ts` constants file for all design tokens (colors, spacing, typography sizes). See `DATA_LAYER.md §theme`.

### Animations
- **React Native Reanimated v3** — required for:
  - SOS countdown ring depletion animation
  - Status color transitions (entire screen environment changes)
  - Sensor value number-roll updates
  - Journey Mode activation state transition on Home
- **React Native Skia** — for the SOS countdown ring (smooth arc depletion). Optional but preferred over SVG for performance.
- Lottie (via `lottie-react-native`) — for the onboarding slide illustrations if vector animations are used.

### Maps
- **React Native Maps** — for Map tab, SOS Active location dot, Journey Mode overlay, Alert Received static thumbnail.
- Heatmap via `react-native-maps` polygon overlays or a GeoJSON layer.

### BLE
- **react-native-ble-plx** — for ESP32 bangle connection. Wrapped entirely inside `BLEDataProvider` (see `DATA_LAYER.md`). No component ever calls BLE directly.

### Auth
- **Firebase Auth** — phone OTP, India (+91) default. `@react-native-firebase/auth`.
- Auth state managed in Zustand `authStore`. Token persisted via `AsyncStorage` (or Expo SecureStore for sensitive values).

### Notifications
- **`@react-native-firebase/messaging`** — push notifications for incoming alerts.
- **`expo-notifications`** or `notifee` — local notifications, custom sounds, notification channels, DND bypass (Android), critical alerts (iOS).
- Notification payload shape defined in `DATA_LAYER.md §NotificationPayload`.

### Internationalisation
- **`i18next` + `react-i18next`** — for English / ಕನ್ನಡ. Translation files in `src/locales/en.json` and `src/locales/kn.json`. Every user-facing string must be in both files. No hardcoded English strings in components.

### Storage
- **`@react-native-async-storage/async-storage`** — non-sensitive persistence (settings, calibration state, alert history cache, Technical View toggle state).
- **`expo-secure-store`** — auth token, user phone number.

### Haptics
- **`expo-haptics`** — for haptic feedback patterns. All haptic calls go through `hapticService.ts` (see `§Services`).

---

## Folder Structure

```
nari/
├── src/
│   ├── app/                    # Root app component, providers, global setup
│   │   ├── App.tsx
│   │   └── providers.tsx       # Zustand, i18n, Firebase, DataProvider
│   │
│   ├── navigation/             # All navigation config
│   │   ├── RootNavigator.tsx   # Auth vs App stack decision
│   │   ├── AppNavigator.tsx    # Tab bar + floating SOS
│   │   ├── AuthNavigator.tsx   # Onboarding stack
│   │   └── routes.ts           # Route name constants (never magic strings)
│   │
│   ├── screens/                # One folder per screen
│   │   ├── Splash/
│   │   ├── Language/
│   │   ├── SignUp/
│   │   ├── OTPVerify/
│   │   ├── AddContacts/
│   │   ├── Permissions/
│   │   ├── DevicePairing/
│   │   ├── Home/
│   │   ├── Status/
│   │   │   └── CalibrationSection/
│   │   ├── Map/
│   │   │   └── IncidentDetail/
│   │   ├── Settings/
│   │   │   ├── AlertHistory/
│   │   │   └── AlertDetail/
│   │   ├── SOSCountdown/
│   │   ├── SOSActive/
│   │   ├── JourneyModeActive/
│   │   └── AlertReceived/
│   │
│   ├── components/             # Shared components
│   │   ├── ui/                 # Primitive UI: Button, Card, Badge, Chip, etc.
│   │   ├── sensors/            # SignalCard, SafetyGauge, PulseChart
│   │   ├── sos/                # SOSButton, CountdownRing
│   │   ├── map/                # HeatmapLayer, IncidentPin, LocationDot
│   │   ├── contacts/           # ContactRow, ContactPicker, DeliveryBadge
│   │   └── layout/             # TabBar (custom), TopBar, StatusBackground
│   │
│   ├── data/                   # Data layer — most important folder
│   │   ├── providers/
│   │   │   ├── DataProvider.ts         # Interface definition
│   │   │   ├── MockDataProvider.ts     # Phase 2 simulation
│   │   │   ├── LiveDataProvider.ts     # Production (stubs in Phase 2)
│   │   │   └── BLEDataProvider.ts      # BLE-specific provider
│   │   ├── dataConfig.ts               # Feature flags — mock vs live per source
│   │   ├── mockData/
│   │   │   ├── sensorSequences.ts      # Scripted sensor data sequences
│   │   │   ├── demoModeScript.ts       # 90-second Demo Mode sequence
│   │   │   └── heatmapSeed.ts          # Synthetic incident data
│   │   └── types.ts                    # All shared TypeScript types
│   │
│   ├── stores/                 # Zustand stores
│   │   ├── authStore.ts
│   │   ├── sensorStore.ts      # Live sensor readings, ML outputs
│   │   ├── alertStore.ts       # Active alert state, alert history
│   │   ├── contactStore.ts     # Emergency contacts
│   │   ├── settingsStore.ts    # All user preferences
│   │   └── journeyStore.ts     # Journey Mode state
│   │
│   ├── services/               # Side effects, external integrations
│   │   ├── notificationService.ts
│   │   ├── hapticService.ts
│   │   ├── smsService.ts
│   │   ├── locationService.ts
│   │   └── bleService.ts
│   │
│   ├── hooks/                  # Custom hooks
│   │   ├── useSensorData.ts    # Subscribes to DataProvider, exposes typed readings
│   │   ├── useSOSState.ts      # SOS countdown logic, dispatch
│   │   ├── useJourneyMode.ts
│   │   ├── useCalibration.ts
│   │   └── useDemoMode.ts
│   │
│   ├── locales/
│   │   ├── en.json             # All English strings
│   │   └── kn.json             # All Kannada strings — must mirror en.json exactly
│   │
│   ├── theme/
│   │   ├── colors.ts           # Semantic + brand color tokens
│   │   ├── typography.ts       # Font families, sizes, line heights
│   │   ├── spacing.ts          # Spacing scale
│   │   └── index.ts            # Single export
│   │
│   └── utils/
│       ├── formatters.ts       # Time, distance, score formatters
│       ├── permissions.ts      # Permission request helpers
│       └── contactUtils.ts     # NARI-installed check, routing decision
│
├── assets/
│   ├── fonts/                  # Custom font files
│   ├── icons/                  # SVG icons
│   └── images/                 # Onboarding illustrations, splash
│
├── __tests__/
├── app.json                    # Expo config
├── dataConfig.ts               # Feature flags (root level for visibility)
└── tsconfig.json
```

---

## Key Architectural Patterns

### Pattern 1: DataProvider

The most important pattern in the codebase. Every piece of sensor, ML, or external data is accessed through a typed `IDataProvider` interface. Components call hooks (`useSensorData`, `useMLOutput`, etc.) which internally call the active provider. The active provider is selected by `dataConfig.ts`.

```typescript
// Component never does this:
const hr = await BLE.readCharacteristic('hr');

// Component always does this:
const { heartRate } = useSensorData();
```

Full interface and types in `DATA_LAYER.md`.

### Pattern 2: Status as environment

The current safety status (safe / alert / danger) is global state in `sensorStore`. The `StatusBackground` layout component reads this and sets the background color of the entire screen using an Animated value. Every screen that cares about status wraps its content in `StatusBackground`. The transition is animated — not an instant switch.

```typescript
// StatusBackground.tsx wraps screen content
// It reads sensorStore.currentStatus and animates backgroundColor
```

### Pattern 3: Conditional home sections

Home screen sections are conditionally rendered based on app state. They are not placeholders with empty states — they are absent when their condition is not met.

```typescript
// In Home screen:
const showCalibrationBanner = calibrationDay > 0 && calibrationDay <= 14;
const showRecentAlerts = alertHistory.length > 0;
// Render only when condition true — no empty state cards
```

### Pattern 4: Two-layer content (default vs technical)

Status tab and Alert Detail both show plain-language content by default, with technical data surfacing when Technical View is toggled. Use `settingsStore.technicalViewEnabled` to gate technical content throughout. Do not gate by passing props down — read the store directly in components that need it.

### Pattern 5: Overlay screens via modal stack

SOS Countdown, SOS Active, Journey Mode Active, and Alert Received are modal screens in a separate stack overlay. They appear above all tab content. The tab bar and floating SOS button are hidden when any of these are active. Use React Navigation's `presentation: 'fullScreenModal'` and manage tab bar visibility via a custom tab bar component that reads `navigationState`.

### Pattern 6: Haptic language

All haptic calls go through `hapticService.ts`. Never call `expo-haptics` directly in a component. This ensures:
- Every haptic has a defined pattern name ("sosPulse", "confirmSingle", "journeyWave")
- Patterns can be easily changed in one place
- Visual alternatives can be triggered alongside haptics in the same service call

---

## Environment Variables

```bash
# .env (Expo via app.config.ts)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_ML_API_BASE_URL=          # TBD — cloud endpoint for ML inference
EXPO_PUBLIC_MAPS_API_KEY=             # Google Maps
EXPO_PUBLIC_TEST_CONTACT_NUMBER=      # For Phase 2 SMS test sends
```

All accessed via `process.env.EXPO_PUBLIC_*`. Never commit `.env` to version control.

---

## Phase 2 vs Production Toggle

The root-level `dataConfig.ts` is the single file that controls the entire data layer:

```typescript
// dataConfig.ts
export const dataConfig = {
  useRealHR: false,
  useRealIMU: false,
  useRealLSTM: false,
  useRealTCN: false,
  useRealFusion: false,
  useRealHeatmap: false,
  useRealSMS: false,
  useRealBLE: false,
  // GPS is always real:
  useRealGPS: true,
};
```

When `useRealHR` is `false`, `DataProvider` returns mock HR data. When `true`, it reads from BLE. No other file changes.
