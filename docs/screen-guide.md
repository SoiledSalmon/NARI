# Screen Implementation Guide

Implementation-focused reference for every screen. Describes what store slices each screen reads, what components it contains, what states it handles, and any implementation-specific notes. Read alongside PRD.md (what) and DESIGN.md (feel).

---

## AUTH / ONBOARDING

### Splash
- **Store reads**: `authStore.isAuthenticated`, `authStore.isLoading`
- **On mount**: Check auth token. If valid → reset nav to AppNavigator. If not → navigate to Language after 1.5s.
- **Note**: Show NARI wordmark + bangle silhouette. No interactions. Pure animation.

### Language
- **Store writes**: `settingsStore.language`
- **On select**: Set language in i18next + store. Navigate to SignUp.
- **Note**: Two buttons, full screen. No header. First screen a new user meaningfully interacts with — make it feel intentional.

### SignUp / SignIn / OTPVerify
- **Store reads/writes**: `authStore`
- **SignUp**: Single phone input field. Large numpad. "We'll send you a one-time code" subtitle. Country code locked to +91.
- **OTPVerify**: 6-digit input. Auto-advance on last digit. Resend countdown (30s). On verify success → `authStore.setUser` → navigate to AddContacts (new user) or Home (returning).
- **Note**: Handle Firebase Auth errors with plain-language copy from `errors` i18n key.

### AddContacts
- **Store reads/writes**: `contactStore`
- **Components**: `ContactPicker` (opens native contacts), `ContactRow`, `RelationshipPicker`, `DeliveryBadge`
- **On add**: Call `dataProvider.checkContactsHaveNari([phone])` → set `hasNariApp` on contact → render appropriate badge.
- **Validation**: Minimum 1 contact before "Continue" is enabled.
- **Note**: The NARI badge / SMS badge is purely informational here — user doesn't configure it.

### Permissions
- **Services**: `permissions.ts`
- **Flow**: Explain → request system dialog → check result → proceed or show explanation.
- **Required**: Location (always on), Notifications. Block on "Continue" if denied, show "Open Settings" CTA.
- **Optional**: Contacts, Microphone. Skippable.
- **Note**: After this screen, user lands on Home. Do not navigate to DevicePairing as part of critical onboarding.

---

## HOME TAB

### Home
- **Store reads**: `sensorStore.currentSnapshot`, `sensorStore.deviceConnected`, `settingsStore`, `journeyStore.isActive`, `alertStore.recentAlerts`, `calibrationStore`
- **Sections** (render order, top to bottom):
  1. `TopBar` — wordmark, status dot, notification bell
  2. Progressive onboarding items (conditional):
     - `DevicePairingBanner` — shown until device connected
     - `ProfileCompletionPrompt` — shown until name set
  3. `CalibrationBanner` (conditional: `calibrationDays > 0 && <= 14`)
  4. `HeroStatusCard` — always present
  5. `JourneyModeCard` — always present but visually minimal when off
  6. `RecentAlerts` (conditional: `alertHistory.length > 0`, max 2 shown)

**HeroStatusCard**:
- Background color animated from `colors.statusBg[currentStatus]` using Reanimated `useSharedValue` + `withTiming`.
- Three dot indicators at bottom — each reads its signal's `SignalStatus` → maps to `colors.dot.*`.
- Tapping navigates to Status tab.

**JourneyModeCard when active**:
- Home background gets a subtle green tint overlay (Journey Mode is "safe mode activated" — communicates protection).
- Card expands using `LayoutAnimation` or Reanimated layout animation.
- "I've Arrived Safely" calls `journeyStore.deactivate()`.

**States to handle**:
- Device disconnected: Hero card shows disconnected state (see PRD §3.2)
- Location unavailable: area name replaced
- Demo mode active: mock data flows through normally — no special UI change

---

## STATUS TAB

### Status
- **Store reads**: `sensorStore.currentSnapshot`, `settingsStore.technicalViewEnabled`, `calibrationStore`
- **Sub-sections**: gauge, 4 signal cards, trend chart, calibration link

**SafetyGauge**:
- Component: `src/components/sensors/SafetyGauge.tsx`
- Animated ring using React Native Skia (preferred) or SVG.
- Ring fill animates on score change using `withSpring`.
- Displays plain label (primary) + numeric score (secondary).
- Label string from `i18n.t('status.labels.${status}')`.

**SignalCard** (4 instances):
- Component: `src/components/sensors/SignalCard.tsx`
- Props: `type: 'heartbeat' | 'movement' | 'surroundings' | 'voice'`, `status: SignalStatus`, `snapshot: StatusSnapshot`, `technicalView: boolean`
- Default view: plain label + type-specific visual (pulse line for HR, icon for others)
- Technical view: expands with monospace data. Use `Animated.View` height transition.
- Voice card always greyed out in Phase 2. `available: false` from `CNNOutput`.

**TechnicalView toggle**:
- Reads/writes `settingsStore.technicalViewEnabled`.
- On toggle: all 4 cards animate height simultaneously.

**24h trend chart**:
- Default: colored area bands using a simple charting lib or custom SVG.
- Technical: line chart with axes. Same data, different render.

**Calibration sub-section**:
- Rendered inline below chart when `showCalibration` state is true.
- Activated by: tapping "Calibration" link, OR by navigation param `scrollToCalibration: true`.
- `useEffect` watching route params — if `scrollToCalibration` is true, scroll `ScrollView` to calibration section ref.

**States**:
- Loading: skeleton loaders on all 4 cards. `useEffect` sets a 10s timeout — after 10s without data, show "Waiting for bangle signal" in each card.
- API unavailable: last known values + staleness label + banner. Banner rendered at top of tab.

---

## MAP TAB

### Map
- **Store reads**: `locationStore.current`, `sensorStore.currentSnapshot`
- **Data**: `dataProvider.getNearbyIncidents(lat, lng, 5)` on mount + when location changes significantly (>500m)
- **Components**: `HeatmapLayer`, `LocationPin`, `AlertPanel`

**HeatmapLayer**: overlays `IncidentPoint[]` as polygon/circle overlays grouped by severity.

**AlertPanel**:
- Bottom sheet using `@gorhom/bottom-sheet`.
- Default peek height: 200px. Fully expandable.
- Filter strip state local to component.
- List of `IncidentPoint` filtered by active filter.

**States**: see PRD §5.4

### IncidentDetail
- **Params**: `{ incident: IncidentPoint }`
- Static map (zoom 15, not interactive) centered on incident.
- Plain incident details below map.
- No personal data — only anonymised aggregate fields.

---

## SOS FLOW

### SOSCountdown
- **Params**: `{ triggeredBy: AlertType }`
- **Store writes**: `alertStore` (on dispatch)
- **Back**: disabled (`gestureEnabled: false`)
- **Lock screen**: `FLAG_SHOW_WHEN_LOCKED` (Android), `UIApplicationSupportsIndirectInputEvents` + appropriate entitlement (iOS)

**CountdownRing**:
- Component: `src/components/sos/CountdownRing.tsx`
- Built with React Native Skia: arc path depletes from full circle to empty over `countdownDuration` seconds.
- Number inside updates each second.
- On reach 0: call `handleDispatch()`.

**handleDispatch()**:
1. Call `dataProvider.dispatchSOS(triggeredBy, currentLocation)`
2. Get back `AlertEvent` with `alertId`
3. Navigate: `navigation.replace(Routes.SOS_ACTIVE, { alertId })`

**"I'm Safe" tap**:
1. Stop countdown timer
2. Navigate back to Home
3. Call `dataProvider.logFalseAlarm(alertId, null)`
4. Show false alarm reason bottom sheet (optional, 4s auto-dismiss)

**Haptic**: `hapticService.sosPulse()` every second via `setInterval`.

### SOSActive
- **Params**: `{ alertId: string }`
- **Store reads**: `alertStore.activeAlert`
- **Back**: disabled

**Status list**: animated tick-off as each contact is notified. Uses a `useEffect` that listens to `alertStore.notificationStatuses[alertId]`. Each item transitions from pending → ✓ when status updates.

**Pulsing location dot**: expanding rings animation. Three concentric circles, staggered `withRepeat` + `withDelay` in Reanimated.

**"Call 112" button**: `Linking.openURL('tel:112')`. India-specific. Hardcoded. Full-width, prominent position.

**"I'm Safe Now"**:
1. Call `dataProvider.resolveAlert(alertId)`
2. Navigate to Home (reset, cannot go back to SOS Active)
3. Show post-resolution summary card on Home (brief, dismissible)

### SOSActive — SOS dispatch failure
If `dispatchSOS` throws (network error in production — mock never fails):
- Show error banner inside SOSActive: "⚠ Messages failed to send. Try calling contacts directly."
- List contacts with individual call buttons.
- "Call 112" still prominent.

---

## JOURNEY MODE ACTIVE

### JourneyModeActive
- **Store reads**: `journeyStore`
- **Back**: disabled
- Map with live location + route trail (breadcrumb of past `LocationReading` points, last 50 stored in `journeyStore.trail`).
- Contact names listed ("Watching: Amma, Preethi").
- Elapsed time from `journeyStore.startedAt`.

**"I've Arrived Safely"**:
1. `journeyStore.deactivate()`
2. `notificationService.sendJourneyResolved(contacts, name)`
3. Navigate back to Home (pop overlay)

---

## ALERT RECEIVED

### AlertReceived
- **Params**: `{ payload: AlertNotificationPayload }`
- **Back**: allowed (contact can dismiss)
- Tinted background: amber for `auto_ml`, red for `manual` / `physical_button`.
- Static map thumbnail — snapshot of location at alert time. Zoom 14, not interactive.
- Distance label computed from `payload.location` and `locationStore.current`.

**"Call [Name]"**: `Linking.openURL('tel:${payload.triggeredByPhone}')`
**"Navigate"**: `Linking.openURL('https://maps.google.com/?daddr=${lat},${lng}')`
**"I'm with them — mark safe"**: calls backend to mark alert resolved. Updates `alertStore` if user is primary user.

**Resolution update**: subscribe to `alertStore.alertResolved$` (or Zustand subscription). When `alertId` resolves, animate screen to green tint + update status text.

---

## SETTINGS TAB

### Settings
- **Store reads/writes**: `contactStore`, `settingsStore`, `calibrationStore`, `authStore`
- Sectioned `ScrollView`. Each section is a separate component.
- `scrollTo` param: use `ScrollView.scrollTo({ y: sectionOffsets[scrollTo] })` on mount if param present.

**Sensor health grid** (in Device section):
- 6 tiles reading from `DeviceState.sensorHealth`.
- Each: colored dot + label. Green/grey/red.

**Federated Learning toggle**:
- Writes `settingsStore.federatedLearning`.
- Phase 2: no backend action. Toggle state persisted to AsyncStorage only.

**Language toggle**:
- On change: show `Alert` dialog with confirm/cancel.
- On confirm: `i18n.changeLanguage(newLang)` → `settingsStore.setLanguage(newLang)` → `RNRestart.Restart()` (via `react-native-restart`).

**Demo Mode** (in About section):
- Track tap count on version number with `useRef`.
- At 5 taps: `hapticService.confirmSingle()` + show toast "Demo mode activated" + `useDemoMode.start()`.

### AlertHistory
- `FlatList` of `AlertEvent[]` from `alertStore.history`.
- Grouped by month using `useMemo`.
- Each item: `AlertHistoryRow` component.

### AlertDetail
- **Params**: `{ alert: AlertEvent }`
- Two-layer content:
  - Top: plain language summary (from `i18n` template with alert data)
  - Bottom: "What triggered this?" — `alert.snapshotAtTrigger` rendered with technical detail. Only visible after tapping "Show technical details" expand button — collapsed by default.

---

## SHARED COMPONENTS

### `SOSButton` (`src/components/sos/SOSButton.tsx`)
- Props: none (reads nav from hook)
- Long press detection: `react-native-gesture-handler` `LongPressGestureHandler`, duration 2000ms → silent SOS dispatch (skip countdown, direct to SOSActive).
- Single tap → `navigation.navigate` to SOSCountdown.
- Accessibility label: `i18n.t('accessibility.sos_button')` = "SOS — Send emergency alert"
- Min size: 64×64dp.

### `StatusBackground` (`src/components/layout/StatusBackground.tsx`)
- Wraps screen content.
- Reads `sensorStore.currentSnapshot.fusion.status`.
- Animates `backgroundColor` between `colors.statusBg.*` values using Reanimated `useAnimatedStyle`.
- Only used on screens where status background makes sense (Home, Status tab, Journey overlay).

### `SignalCard` (`src/components/sensors/SignalCard.tsx`)
- Handles all 4 signal types via `type` prop.
- Reads `settingsStore.technicalViewEnabled` internally — do not pass as prop.
- Animated height expansion for technical view.

### `CountdownRing` (`src/components/sos/CountdownRing.tsx`)
- Props: `duration: number`, `onComplete: () => void`, `onCancel: () => void`
- Self-contained: manages its own timer, animation, haptic scheduling.
- Exposes `cancel()` imperative handle via `useImperativeHandle`.

### `TopBar` (`src/components/layout/TopBar.tsx`)
- Props: none (reads stores internally)
- Wordmark (left), status dot (tappable), notification bell (right).
- Status dot animated color: `colors.dot.green` (connected) / `colors.dot.grey` (disconnected).
