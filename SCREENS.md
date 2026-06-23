# NARI Screen Documentation

This document describes every screen in the NARI React Native mobile app, including its purpose, data dependencies, user actions, and known limitations.

---

## Table of Contents

### Onboarding & Auth
1. [Language Selection](#1-language-selection)
2. [Phone Verification](#2-phone-verification)
3. [Onboarding Steps](#3-4-5-6-onboarding-steps)

### Main Tabs (After Auth)
7. [Home](#7-home)
8. [Status](#8-status)
9. [Map](#9-map)
10. [Alerts](#10-alerts)
11. [More](#11-more)

### Modal Screens
12. [SOS Countdown](#12-sos-countdown)
13. [SOS Active](#13-sos-active)
14. [Alert Detail](#14-alert-detail)
15. [Journey Setup](#15-journey-setup)
16. [Settings](#16-settings)

### Responder App (Future)
17. [Responder Login](#17-responder-login)
18. [Alert Received](#18-alert-received)
19. [Responder Map](#19-responder-map)

---

## 1. Language Selection

**Route**: `LanguageSelection` (First screen on launch)

**Purpose**: Onboarding step 0 — Select language before creating account.

**Data Read**:
- `useSettingsStore().language` — Current language preference

**User Actions**:
- Tap "English" or "ಕನ್ನಡ" (Kannada) card → `setLanguage()` and navigate to `PhoneVerification`

**Known Issues**:
- Language toggle is only on this screen; no language switcher in settings menu (future enhancement)

---

## 2. Phone Verification

**Route**: `PhoneVerification`

**Purpose**: Onboarding step 1 — Firebase Phone Auth sign-in via OTP.

**Data Read**:
- `useAuthStore().isLoading` — Show loading spinner during OTP send/verify
- `useAuthStore().user` — Redirect to next screen if already authenticated

**Data Write**:
- `useAuthStore().sendOTP(phone)` → Firebase Phone Auth sent
- `useAuthStore().verifyOTP(code)` → Firebase ID token obtained

**User Actions**:
- Enter phone number (10 digits) and tap "Send OTP"
- Receive SMS with 6-digit code
- Enter code and tap "Verify"
- On success, navigate to `AddEmergencyContact` (onboarding step 2)

**Known Issues**:
- No rate-limiting UI (Firebase limits to 5 requests/hour per phone, but no user feedback if exceeded)
- No retry logic if SMS fails silently
- OTP expires after 10 minutes (Firebase default) but UI doesn't show countdown

---

## 3–6. Onboarding Steps

### Step 3: Add Emergency Contact
**Route**: `AddEmergencyContact`

**Purpose**: Onboarding step 2 — Add first trusted emergency contact.

**Data Write**:
- `useContactStore().addContact(name, phone, relationship)` → Write to Firestore

**User Actions**:
- Enter contact name, phone, relationship (Sister, Partner, Doctor, etc.)
- Tap "Add" → Write to Firestore and navigate to next screen

**Known Issues**:
- No validation that phone number is in valid format (accepts anything)
- No duplicate detection (can add same phone twice)

---

### Step 4: Emergency Alert Preference
**Route**: `EmergencyAlertPreference`

**Purpose**: Onboarding step 3 — Set alert sensitivity.

**Data Read/Write**:
- `useSettingsStore().alertSensitivity` ← default 'medium'
- `useSettingsStore().setAlertSensitivity('low' | 'medium' | 'high')`

**User Actions**:
- Tap one of three cards: "Low" (only manual SOS), "Medium" (detect threats), "High" (aggressive)
- Selection persists to Firestore
- Navigate to `LocationSharingPreference`

**Known Issues**:
- Sensitivity levels are defined but not actually used by backend ML (all users get same thresholds)

---

### Step 5: Location Sharing Preference
**Route**: `LocationSharingPreference`

**Purpose**: Onboarding step 4 — Opt into location sharing with contacts.

**Data Read/Write**:
- `useSettingsStore().locationSharing` ← default false
- `useSettingsStore().setLocationSharing(boolean)`

**User Actions**:
- Toggle "Share location with emergency contacts" switch
- Navigate to `SelectTrustedContacts`

**Known Issues**:
- UI shows toggle but location is always placeholder "Current location" in practice (not implemented)

---

### Step 6: Select Trusted Contacts for Watching
**Route**: `SelectTrustedContacts`

**Purpose**: Onboarding step 5 — Choose which contacts will receive journey updates.

**Data Read**:
- `useContactStore().contacts` — List of all added emergency contacts

**Data Write**:
- `useJourneyStore().setWatchingContacts([contact1, contact2])` → Stored in active journey

**User Actions**:
- Check/uncheck contact names
- Tap "Confirm" → Mark onboarding as complete

**Known Issues**:
- No minimum contacts required (can proceed with zero watchers)

---

## 7. Home

**Route**: `Home` (Main tab after auth)

**Purpose**: Dashboard — Real-time safety status, quick access to journey mode and emergency.

**Data Read**:
- `useSensorStore().currentStatus` — StatusSnapshot with safety score, level, live HR
- `useJourneyStore().isActive` — Is user currently on a journey?
- `useJourneyStore().startedAt` — Journey start timestamp
- `useAlertStore().recentAlerts` — Last 3 alerts for recent card
- `useSettingsStore().silentMode`, `technicalView` — Show/hide debug UI
- `useAuthStore().user.location` — Current location (placeholder: "Current location")
- Device time — Show in hero subtitle

**UI Components**:
- **Hero Card**: Large safety status circle with score 0-100, color-coded (green/yellow/red)
  - Subtitle: "Current location · 11:42 PM" (dynamic: shows actual time)
  - Tap to navigate to `Status` screen
- **Recent Alerts Card**: Stack of last 3 alerts with timestamps
  - "No recent alerts" if empty
  - Tap to navigate to `Alerts`
- **Journey Mode Card**: 
  - If inactive: "Start a journey" button (large green CTA)
  - If active: Shows elapsed time (updates real-time), list of watchers, "End journey" button
- **Debug Metrics** (only if `technicalView` enabled):
  - LSTM latency, TCN latency, buffer fill %

**User Actions**:
- Tap hero card → Navigate to `Status`
- Tap "Start a journey" → Navigate to `JourneySetup`
- Tap "End journey" (if active) → Navigate to `JourneyEnd` confirmation
- Tap "Recent Alerts" card → Navigate to `Alerts` tab
- Emergency button (red circle, bottom-right) → Navigate to `SOSCountdown`

**Known Issues**:
- Location always shows "Current location" placeholder (GPS integration not implemented)
- Time is calculated client-side; no server sync if device time drifts
- Hero card doesn't animate on status change (abrupt color change)

---

## 8. Status

**Route**: `Status` (Pushed from Home or Bottom Tab)

**Purpose**: Detailed view of real-time metrics, sensor data, and debug information.

**Data Read**:
- `useSensorStore().currentStatus` → Full StatusSnapshot with all fields
- `useSensorStore().currentStatus.sensorValues.heartRate`, `.motion`, `.audioLevel`
- `useSettingsStore().technicalView` — Show/hide ML debug metrics
- `useSettingsStore().silentMode` — Hide scores and risk levels when true

**UI Components**:
- **Safety Gauge Chart**: Circular gauge 0-100 with needle pointing to current score
- **Stress Level Card**: Shows "Low", "Moderate", "High" based on LSTM probability
- **Activity Card**: Shows activity classification (Stationary, Light Activity, Running, etc.)
- **Heart Rate Card**: Live HR with sparkline chart of last 60 samples
- **Motion Card**: Peak acceleration and peak gyro rotation in last 3s
- **Audio Card**: Current microphone amplitude (0-255 range)
- **Debug Section** (if technicalView):
  - LSTM inference latency (ms)
  - TCN inference latency (ms)
  - Buffer fill: IMU%, HR%, Motion%
  - Last inference timestamp

**User Actions**:
- Swipe down to refresh
- Toggle "Technical View" switch in header (requires password if silentMode active)

**Known Issues**:
- No error state if backend is down (shows stale data or "—" placeholders)
- Debug metrics don't update in real-time (only on /status poll every 3s)
- Sparkline charts don't animate smoothly (re-render on every poll)

---

## 9. Map

**Route**: `Map` (Bottom Tab)

**Purpose**: View community safety incidents on interactive map; incident filtering by severity.

**Data Read**:
- Firebase `incidents` collection (global, ordered by recency)
- `useSensorStore().currentLocation` — User's own location (placeholder)
- Map center initially set to "JP Nagar, Bangalore" (hardcoded)

**UI Components**:
- **MapLibre GL Map**: 
  - Incident pins colored by severity: 🔴 High, 🟡 Moderate, 🟢 Low
  - Tap pin → Show `IncidentDetail` popup with description, reported time, address
- **Severity Filter Chips**: Top of screen, tap to filter by "High", "Moderate", "Low"
- **Distance Counter**: Shows count of incidents within 5 km radius

**User Actions**:
- Pan/zoom map
- Tap incident pin → Show detail popup
- Tap "Report Incident" button (red floating button) → Navigate to `ReportIncident` modal
- Use severity filter chips to hide/show incident types

**Known Issues**:
- User location is always "JP Nagar" hardcoded (not actual GPS)
- No incident clustering (map becomes cluttered with many incidents)
- No distance-based alerts (doesn't warn if dangerous incident nearby)
- OpenStreetMap tiles load slowly on poor connectivity

---

## 10. Alerts

**Route**: `Alerts` (Bottom Tab)

**Purpose**: History of all emergency alerts triggered (auto-SOS or manual), with filtering and detail drill-down.

**Data Read**:
- `useAlertStore().allAlerts` — Subscribed to Firestore in real-time
- `useAlertStore().alertsCount` — Total count
- Firebase `users/{userId}/alerts` (ordered by timestamp desc)

**UI Components**:
- **Alert List**: Cards showing:
  - Alert type icon (Manual SOS, Elevated HR, Fall, etc.)
  - Title and description (first 50 chars)
  - Timestamp ("2 hours ago")
  - Outcome badge (Active, Resolved, False Alarm)
  - Severity color (High, Moderate, Low)
- **Filter Chips**: Top of screen to filter by outcome (Active, Resolved, False Alarm)
- **Empty State**: "No alerts yet" when list empty

**User Actions**:
- Tap alert card → Navigate to `AlertDetail` modal
- Swipe alert left → Delete from UI (not from Firestore, just hide)
- Pull to refresh → Manually sync from Firestore
- Tap "Report as False Alarm" (if alert is marked Active) → Update alert.outcome to 'false_alarm'

**Known Issues**:
- Swipe-to-delete doesn't persist (just UI removal, alert still in Firestore)
- No pagination (shows all alerts; can be 100+ in long-term usage)
- Delete action doesn't require confirmation

---

## 11. More

**Route**: `More` (Bottom Tab)

**Purpose**: Settings, profile, and app information.

**Data Read**:
- `useAuthStore().user` — Name, phone, profile photo
- `useSettingsStore().language` — Current selection
- `useSettingsStore().silentMode`, `technicalView`, `alertSensitivity`

**UI Components**:
- **Profile Card**: Shows user name, phone, edit button
- **Settings Section**:
  - Language (English / ಕನ್ನಡ)
  - Alert Sensitivity (Low, Medium, High)
  - Silent Mode (Toggle) — Hides risk levels in UI
  - Technical View (Toggle) — Shows debug metrics
  - Location Sharing (Toggle)
- **Emergency Contacts Section**: 
  - List of all contacts with edit/delete buttons
  - "Add Contact" button
- **Support & Info Section**:
  - "About NARI" (version, credits)
  - "Privacy Policy" (external link)
  - "Terms of Service" (external link)
  - "Send Feedback" (opens email)
- **Logout Button**: Bottom of screen

**User Actions**:
- Tap "Edit Profile" → Navigate to `EditProfile` modal
- Tap language → Change setting
- Toggle switches → Update settings in Firestore
- Tap contact → Navigate to `EditContact` modal
- Tap "Add Contact" → Navigate to `AddContact` modal
- Tap "Send Feedback" → Open email client
- Tap "Logout" → Clear auth state and navigate to `LanguageSelection`

**Known Issues**:
- No "Sign Out Everywhere" option (device-only logout)
- No backup/export of data (no way to migrate between devices)
- Edit contact doesn't validate duplicate phone numbers

---

## 12. SOS Countdown

**Route**: `SOSCountdown` (Modal, triggered from Home emergency button)

**Purpose**: 10-second countdown before emergency alert is sent; allow user to cancel.

**Data Read**:
- `useSOSState().phase` — Should be 'countdown'
- `useSOSState().secondsLeft` — Countdown value (10 → 0)

**Data Write**:
- `useSOSState().setPhase('active')` → If countdown reaches 0
- `useSOSState().cancel()` → If user taps "Cancel" before timeout

**UI Components**:
- **Large Countdown Timer**: "10" displayed in huge font, updates every second
- **"CANCEL" Button**: Red button below timer
- **Status Text**: "Emergency alert will be sent in X seconds"

**User Actions**:
- Do nothing → Countdown reaches 0, navigate to `SOSActive`
- Tap "Cancel" button → Navigate back to `Home`

**Known Issues**:
- No haptic feedback or sound on countdown
- Tapping outside the modal doesn't cancel (can't accidentally dismiss)
- No visual distinction between active countdown vs expired

---

## 13. SOS Active

**Route**: `SOSActive` (Modal, after countdown expires)

**Purpose**: Emergency mode — Show that alert is being sent and contacts are being notified.

**Data Read**:
- `useSOSState().activeAlert` — Alert object with delivery status per contact
- `useContactStore().contacts` — Dynamically populate contact list

**Data Write**:
- Triggers `POST /sos/trigger` backend endpoint
- Creates alert record in Firestore with status 'active'
- Writes contact delivery logs as alerts are sent

**UI Components**:
- **Header**: Red background, "EMERGENCY ALERT ACTIVE" text
- **Contact List**: Shows each emergency contact with delivery status:
  - ✓ Sent (green checkmark, timestamp)
  - ⟳ Sending (spinner)
  - ✗ Failed (red X, error message)
- **"Mark as False Alarm" Button**: Red button, if user confirms accidental trigger
- **Status Message**: "Contacts have been notified. Help is on the way."

**User Actions**:
- Wait for alert delivery (automatic, triggered by backend)
- Tap "Mark as False Alarm" → Update alert.outcome to 'false_alarm' and navigate back to Home

**Known Issues**:
- Contact delivery status is mocked (all show "Sent" immediately, no real SMS/WhatsApp)
- No way to cancel false alarm once SOS Active screen shown (only "Mark as False Alarm")
- No support for custom emergency message or voice recording

---

## 14. Alert Detail

**Route**: `AlertDetail` (Modal, pushed from Alerts tab or Home recent card)

**Purpose**: View full details of a specific emergency alert.

**Data Read**:
- Alert document from Firestore: `users/{userId}/alerts/{alertId}`
- Alert fields: type, title, description, timestamp, location, sensorSnapshot, outcome, etc.

**UI Components**:
- **Alert Header**: Type icon, title, timestamp ("2 hours ago")
- **Outcome Badge**: Active / Resolved / False Alarm (color-coded)
- **Location Card**: "JP Nagar, Bangalore" (placeholder, address not implemented)
- **Sensor Snapshot**: 
  - Heart Rate: 95 BPM
  - Motion: Running
  - Stress Level: High
- **Alert Description**: Full narrative text
- **Timeline** (future): Show contact delivery timeline
- **"Contact Emergency Services" Button**: Opens dialer with pre-filled emergency number

**User Actions**:
- Swipe up to close detail view
- Tap "Contact Emergency Services" → Open phone dialer

**Known Issues**:
- Sensor snapshot fields are not fully populated by backend (stress level not shown)
- No ability to edit or add notes to historical alerts
- No sharing option (can't send alert details to third party)

---

## 15. Journey Setup

**Route**: `JourneySetup` (Modal, triggered from Home "Start a journey")

**Purpose**: Configure journey mode before activation.

**Data Read**:
- `useContactStore().contacts` — List of available watchers

**Data Write**:
- `useJourneyStore().startJourney(label, watchingContacts)`

**UI Components**:
- **Journey Label Input**: Text field, placeholder "Where are you going?"
- **Select Watchers**: Checkboxes for each contact (can select 0+)
- **"Start Journey" Button**: Blue CTA, enabled only if label is non-empty

**User Actions**:
- Enter journey destination (e.g., "Walking home")
- Check contacts to watch the journey
- Tap "Start Journey" → Write to Firestore and navigate to Home with journey active

**Known Issues**:
- No journey history (can't see past journeys or templates)
- No estimated duration or route preview (no map integration)
- No ability to pause/resume journey (only start/end)

---

## 16. Settings

**Route**: `Settings` (Tab from More or pushed from various screens)

**Purpose**: User-facing settings interface (language, alert sensitivity, toggles).

**Data Read/Write**:
- All `useSettingsStore()` and `useAuthStore()` fields

**UI Components**:
- **Language Picker**: Radio buttons for English / ಕನ್ನಡ
- **Alert Sensitivity Slider**: Low → Medium → High
- **Toggles**:
  - Silent Mode (hides risk levels)
  - Technical View (shows debug metrics)
  - Location Sharing (with contacts)
- **"Save Settings" Button**: Bottom of screen

**User Actions**:
- Adjust settings
- Tap "Save Settings" → Persist to Firestore and close modal

**Known Issues**:
- Settings auto-save on change (redundant "Save" button)
- No "Reset to Default" option
- No undo (changes are immediate)

---

## 17. Responder Login (Future)

**Route**: `ResponderLogin` (Separate app; not implemented)

**Purpose**: Emergency responder authentication via Nari admin dashboard.

**Status**: **NOT IMPLEMENTED** — Responder app is out of scope for current release.

---

## 18. Alert Received (Future)

**Route**: `AlertReceived` (Responder app; future)

**Purpose**: Display incoming emergency alert with sender details, vitals, location.

**Status**: **NOT IMPLEMENTED** — Responder app is out of scope for current release.

---

## 19. Responder Map (Future)

**Route**: `ResponderMap` (Responder app; future)

**Purpose**: Show all active emergencies and responder location.

**Status**: **NOT IMPLEMENTED** — Responder app is out of scope for current release.

---

## Screen Navigation Map

```
LanguageSelection
  ├─► PhoneVerification
  │   ├─► AddEmergencyContact
  │   │   ├─► EmergencyAlertPreference
  │   │   │   ├─► LocationSharingPreference
  │   │   │   │   ├─► SelectTrustedContacts
  │   │   │   │   │   └─► Home (Main Tab Navigator)
  │   │   │   │   │       ├─► Status
  │   │   │   │   │       ├─► Map
  │   │   │   │   │       ├─► Alerts
  │   │   │   │   │       └─► More
  │   │   │   │   │           ├─► EditProfile
  │   │   │   │   │           ├─► AddContact
  │   │   │   │   │           └─► EditContact
  │   │   │   │   │
  │   │   │   │   └─► SOSCountdown (Modal)
  │   │   │   │       └─► SOSActive (Modal)
  │   │   │   │           └─► AlertDetail (Modal)
  │   │   │   │               └─► JourneySetup (Modal)
  │   │   │   │                   └─► JourneyEnd (Modal)
  │   │   │   │
  │   │   │   └─► ReportIncident (Modal from Map)
  │   │   │
  │   │   └─► Settings (Modal)
  │
  └─► (Logout) → LanguageSelection
```

---

## Summary: Completeness vs. Aspirational Features

| Feature | Implemented | Demo-Ready | Notes |
|---------|---|---|---|
| Phone Auth | ✓ | ✓ | Firebase Phone Auth working |
| Real-time Status | ✓ | ✓ | Mock data or backend /status |
| ML Safety Score | ✓ | ✓ | LSTM + TCN (untrained weights) |
| Journey Mode | ✓ | ✓ | Tracks elapsed time |
| Emergency Alerts | ✓ | ⚠️ | Mocked SMS/WhatsApp delivery |
| SOS Contacts | ✓ | ✓ | Drawn from actual Firestore |
| Location Sharing | ✗ | ✗ | UI present, not functional |
| Responder App | ✗ | ✗ | Out of scope for current release |
| Audio ML Detection | ✗ | ✗ | Microphone captures levels only |
| Incident Reporting | ✗ | ✗ | UI skeleton only |
| Backup/Export | ✗ | ✗ | Not implemented |

---

## Known Limitations for Academic Panel Evaluation

1. **Location is always placeholder** — "JP Nagar, Bangalore" or "Current location", no actual GPS
2. **ML models untrained** — Using random weights; production would require WESAD + HHAR datasets
3. **Alert routing is mocked** — No real SMS/WhatsApp; Firestore write is the "send"
4. **BLE not implemented** — Current data flow is WiFi/HTTP only; Bluetooth is future work
5. **Portrait orientation only** — No landscape support (intentional for safety context)
6. **Audio detection is levels-only** — No scream detection ML; just ADC amplitude
7. **Responder app out of scope** — Emergency dispatch is not part of current release

All of the above are explicitly documented in `README.md` in the "Known Limitations" section.
