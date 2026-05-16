# NARI — Build Task Tracker

## Phase 1: Project Scaffold & Foundation
- [ ] Initialize Expo project in NARI directory
- [ ] Install all dependencies
- [ ] Configure tsconfig.json (strict mode)
- [ ] Set up NativeWind v4
- [ ] Create theme/ tokens (colors.ts, typography.ts, spacing.ts)
- [ ] Create src/locales/en.json (all strings)
- [ ] Create src/locales/kn.json (placeholder strings)
- [ ] Set up i18next + react-i18next
- [ ] Create src/navigation/routes.ts

## Phase 2: Data Layer & Stores
- [ ] Create src/data/types.ts (all TypeScript types)
- [ ] Create src/data/providers/DataProvider.ts (IDataProvider interface)
- [ ] Create src/data/providers/MockDataProvider.ts
- [ ] Create src/data/mockData/heatmapSeed.ts
- [ ] Create src/data/mockData/demoModeScript.ts
- [ ] Create dataConfig.ts (root level)
- [ ] Create src/stores/authStore.ts
- [ ] Create src/stores/sensorStore.ts
- [ ] Create src/stores/alertStore.ts
- [ ] Create src/stores/contactStore.ts
- [ ] Create src/stores/settingsStore.ts
- [ ] Create src/stores/journeyStore.ts

## Phase 3: Navigation
- [ ] Create RootNavigator.tsx
- [ ] Create AuthNavigator.tsx
- [ ] Create AppNavigator.tsx (tab bar + floating SOS)
- [ ] Create custom TabBar.tsx
- [ ] Create OverlayNavigator.tsx (full screen modals)

## Phase 4: Shared Components
- [ ] ui/Button.tsx
- [ ] ui/Card.tsx
- [ ] ui/Badge.tsx (NARI badge, SMS badge)
- [ ] ui/Chip.tsx (filter chips, outcome chips)
- [ ] ui/Toggle.tsx
- [ ] ui/SkeletonLoader.tsx
- [ ] layout/TopBar.tsx
- [ ] layout/StatusBackground.tsx
- [ ] layout/TabBar.tsx
- [ ] sensors/SafetyGauge.tsx (animated arc dial)
- [ ] sensors/SignalCard.tsx (4 types, expandable)
- [ ] sensors/PulseChart.tsx (24h trend)
- [ ] sos/SOSButton.tsx (64dp, long-press)
- [ ] sos/CountdownRing.tsx
- [ ] contacts/ContactRow.tsx
- [ ] contacts/DeliveryBadge.tsx
- [ ] map/HeatmapLayer.tsx
- [ ] map/IncidentPin.tsx
- [ ] map/LocationDot.tsx

## Phase 5: Auth/Onboarding Screens
- [ ] screens/Splash/index.tsx
- [ ] screens/Language/index.tsx
- [ ] screens/SignUp/index.tsx
- [ ] screens/OTPVerify/index.tsx
- [ ] screens/AddContacts/index.tsx
- [ ] screens/Permissions/index.tsx

## Phase 6: Home Screen
- [ ] screens/Home/index.tsx
- [ ] HeroStatusCard component
- [ ] JourneyModeCard component (on/off states)
- [ ] DevicePairingBanner component
- [ ] CalibrationBanner component
- [ ] RecentAlerts section

## Phase 7: Status Screen
- [ ] screens/Status/index.tsx
- [ ] SafetyGauge integration
- [ ] 4x SignalCard integration
- [ ] TechnicalView toggle
- [ ] 24h trend chart
- [ ] CalibrationSection sub-section

## Phase 8: SOS Flow
- [ ] screens/SOSCountdown/index.tsx
- [ ] CountdownRing animation
- [ ] Haptic pulse per second
- [ ] screens/SOSActive/index.tsx
- [ ] Contact notification status list
- [ ] Pulsing location dot animation
- [ ] Call 112 button
- [ ] False alarm bottom sheet

## Phase 9: Map & Incident
- [ ] screens/Map/index.tsx
- [ ] HeatmapLayer with OSM tiles
- [ ] AlertPanel bottom sheet
- [ ] Filter strip (Today/7d/30d, All/Motion/Audio/SOS)
- [ ] screens/Map/IncidentDetail/index.tsx

## Phase 10: Settings Stack
- [ ] screens/Settings/index.tsx (all sections)
- [ ] DevicePairing modal (full BLE scan mock)
- [ ] screens/Settings/AlertHistory/index.tsx
- [ ] screens/Settings/AlertDetail/index.tsx

## Phase 11: Overlay Screens
- [ ] screens/JourneyModeActive/index.tsx
- [ ] screens/AlertReceived/index.tsx

## Phase 12: Services & Hooks
- [ ] src/services/hapticService.ts
- [ ] src/services/notificationService.ts
- [ ] src/services/locationService.ts
- [ ] src/hooks/useSensorData.ts
- [ ] src/hooks/useSOSState.ts
- [ ] src/hooks/useJourneyMode.ts
- [ ] src/hooks/useCalibration.ts

## Phase 13: Polish (after core done)
- [ ] Skeleton loaders on all loading states
- [ ] Error states on all screens
- [ ] Reanimated status background color transitions
- [ ] Demo Mode (low priority)
