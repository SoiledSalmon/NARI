# NARI Frontend

This is the React Native (Expo) mobile application for the NARI personal safety platform.

## 🚀 Setup & Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy the `.env.example` from the project root to `frontend/.env` and fill in your Firebase client credentials.

3. **Start the app:**
   ```bash
   npx expo start
   ```

## 🏗️ Architecture & State Management

### Zustand Stores
State is managed across a set of specialized Zustand stores located in `src/stores/`:
- `authStore.ts`: Authentication, user preferences, and onboarding flows.
- `sensorStore.ts`: Live sensor readings (HR, IMU, etc.) and overall safety status.
- `alertStore.ts`: Active SOS events, historical alerts, and incidents.
- `contactStore.ts`: Emergency contacts management.
- `journeyStore.ts`: Active journey tracking.

### DataProvider Abstraction
The application is entirely decoupled from live APIs/hardware through the `IDataProvider` interface (`src/data/providers/DataProvider.ts`).

- **MockDataProvider**: Simulates sensor readings (sine waves for HR, random walks for IMU) and handles local test alerts.
- **LiveDataProvider**: Connects to the real FastAPI backend and ESP32 hardware via BLE.

To switch between mock and live data, toggle `USE_MOCK_DATA` in `dataConfig.ts`.

## 🧭 Navigation Map
- **Auth Stack**: Login, Phone OTP, Onboarding (Language, Permissions).
- **Main Tabs**: Home (Status Card, Journey), Status (Gauges, Signals), Map (Heatmap, Incidents), Settings.
- **Overlays**: SOS Countdown, Active SOS, Post-Alert Resolution.

## 🎨 UI & Theming
- Uses **NativeWind v4** for layout styling.
- Colors and typography intent are centralized in `src/theme/`.
- The `StatusBackground` component reads global state and seamlessly transitions the screen environment (colors, haptics) between Safe, Warning, and Danger.

## 🛠️ Testing
The UI enforces strict accessibility guidelines:
- Minimum touch targets of 48px.
- 4.5:1 text contrast for all safety state colors.
