# NARI — Architecture

NARI is a personal safety system bridging wearable hardware, mobile software, and cloud-based machine learning. This document defines the technology stack, folder structure, and key architectural patterns.

---

## 🛠️ Tech Stack

### Core
- **React Native** — Cross-platform (Android + iOS)
- **TypeScript** — Strict mode enabled. No `any` types.
- **Expo** — Managed workflow (v54+). Handles BLE, notifications, and OTP integration.

### Navigation
- **React Navigation v6+** — Native stack for auth/onboarding, bottom tabs for main app.
- Tab bar is custom-rendered to accommodate the floating SOS button.

### State Management
- **Zustand** — Simple, typed stores for auth, sensors, alerts, contacts, settings, and journey.
- **React Query** — Handles server state (alert history, contact sync).

### UI & Styling
- **NativeWind v4** (Tailwind for React Native) — Layout and spacing.
- **React Native Reanimated v3** — Complex animations (countdown rings, status transitions).
- **React Native Skia** — High-performance graphics for the SOS countdown.
- **Theme Tokens**: Centralized in `src/theme/` (colors, typography, spacing).

### Maps & Location
- **React Native Maps** — Safety heatmap and incident tracking.

### Connectivity
- **BLE (react-native-ble-plx)** — ESP32 bangle connection, wrapped in `BLEDataProvider`.
- **Firebase Auth** — Phone OTP (+91 default).
- **Firebase Messaging** — Push notifications for incoming alerts.

---

## 📡 Key Architectural Patterns

### 1. DataProvider Abstraction
The most critical pattern in the codebase. Every piece of sensor, ML, or external data is accessed through a typed `IDataProvider` interface.
- **Mock vs. Live**: Controlled by a single flag in `dataConfig.ts`.
- **UI Decoupling**: Components subscribe to hooks (e.g., `useSensorData`) and are never aware of the underlying hardware or API state.

### 2. Status as Environment
The current safety status (Safe/Elevated/Danger) is global state. The `StatusBackground` layout component reads this and animates the entire screen environment (colors, haptics) accordingly.

### 3. Progressive Disclosure (Technical View)
Default views use plain, reassuring language. Detailed sensor values (bpm, confidence scores, z-scores) are gated behind a **Technical View** toggle in Settings.

---

## 📂 Folder Structure

```
nari/
├── src/
│   ├── app/            # Root App, Providers
│   ├── navigation/     # Navigators & Route constants
│   ├── screens/        # Screen-specific logic & styles
│   ├── components/     # UI primitives, sensors, maps, layout
│   ├── data/           # Types, Providers (Mock/Live), Simulation data
│   ├── stores/         # Zustand stores (Auth, Sensor, Alert, etc.)
│   ├── services/       # Haptics, Notifications, BLE, Location
│   ├── hooks/          # useSensorData, useSOSState, etc.
│   ├── locales/        # en.json, kn.json (Kannada)
│   └── theme/          # Design tokens
├── assets/             # Fonts, Mockups, Icons
└── dataConfig.ts       # Global data-layer toggle
```

---

## 🔐 Security & SOS Lifecycle

NARI's SOS flow prioritizes speed:
1. **Trigger**: ML-detected distress or manual tap.
2. **Countdown**: 10-second grace period with per-second haptic pulses.
3. **Dispatch**: High-priority push alerts to NARI users; SMS/WhatsApp fallback with Google Maps links.
4. **Resolution**: "I'm Safe" marks the alert resolved for all contacts.
