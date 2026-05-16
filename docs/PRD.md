# NARI — Product Requirements Document

**Version**: 3.0  
**Phase**: 2 (production-ready UI, simulated data pipeline)  
**Platform**: React Native, Android + iOS  
**Language support**: English, ಕನ್ನಡ (Kannada)

This document is the functional source of truth. Every screen, flow, state, and copy rule defined here is frozen. Do not deviate from the flows or states described. Visual execution is defined separately in DESIGN.md.

---

## 1. App Architecture Overview

### 1.1 Navigation Structure

```
Bottom Tab Bar (4 tabs):
  [ Home ]  [ Status ]  [ Map ]  [ Settings ]

Floating above tab bar (persistent, always visible except on SOS screens):
  [ SOS Button ]
```

The SOS button is never hidden except on SOS Countdown and SOS Active screens. On those screens, the tab bar and SOS button are both hidden — full-screen takeover.

### 1.2 Screen Groups

| Group | Screens | Nav type |
|---|---|---|
| Auth / Onboarding | Splash, Language, Sign Up, OTP Verify, Sign In, Add Contacts, Permissions, Device Pairing*, Calibration Intro* | Linear stack, outside tab nav |
| Home Tab | Home Dashboard | Single screen |
| Status Tab | Status (with Calibration sub-section) | Single screen with internal sub-nav |
| Map Tab | Safety Map, Incident Detail | Stack |
| Settings Tab | Settings root, Alert History, Alert Detail | Stack |
| Overlays | SOS Countdown, SOS Active, Journey Mode Active, Alert Received (incoming) | Full-screen modals |

*Device Pairing and Calibration Intro have skip options. Not mandatory to reach Home.

### 1.3 Data Provider Abstraction

**This is the most important architectural constraint.** Every data source is accessed through a `DataProvider` interface. A single config object (`dataConfig.ts` or equivalent) controls whether each source returns live or simulated data. No UI component accesses hardware, BLE, or APIs directly.

| Source | Phase 2 (simulated) | Production |
|---|---|---|
| Heart Rate | Sine wave 65–85 bpm, scripted spikes on Demo Mode trigger | BLE characteristic from MAX30102 via ESP32 |
| Motion / IMU | Random walk in normal range, scripted struggle events | BLE from MPU-6050 via ESP32 |
| LSTM output (stress) | Pre-set label sequence cycling through Low/Elevated/High | Cloud API — URL TBD |
| TCN output (motion) | Pre-set label sequence cycling through Still/Active/Abnormal | Cloud API — URL TBD |
| Fusion safety score | Derived from simulated HR + motion using a simple weighted function | Fusion MLP — hosting TBD |
| GPS / Location | Real device GPS — always live, no simulation | Real device GPS |
| Safety heatmap | Seeded synthetic incident coordinates clustered near real GPS location | Community + crime API data |
| SMS/WhatsApp alerts | Log to console only; send to one configurable test number if flag set | Twilio / Fast2SMS / WhatsApp Business API |
| Auth / Backend | Firebase Auth (phone OTP) | TBD — swappable via auth provider abstraction |
| BLE connection | Simulated as connected by default; real BLE if hardware present | Real BLE from ESP32 |

Switching any source from simulated to live requires changing one boolean in the config. Zero UI changes required.

---

## 2. Onboarding Flow

Progressive onboarding. Critical path is 5 steps to Home. Everything else surfaces contextually after login.

### 2.1 Splash
- NARI wordmark + bangle silhouette icon
- Auto-proceeds after 1.5 seconds
- On load: check auth token. If valid → skip to Home. If not → Language screen.

### 2.2 Language Selection
- Two large buttons only: **English** / **ಕನ್ನಡ**
- Nothing else on screen
- Sets app-wide locale. All strings, notifications, error messages use selected language from this point.
- Changeable later in Settings → Language.

### 2.3 Sign Up / Sign In
- Primary: phone number + OTP. India default country code (+91).
- Sign In link for returning users.
- No social login on this screen.
- OTP screen: 6-digit input, auto-advance on last digit, resend after 30 seconds.

### 2.4 Add Emergency Contacts
- Header copy: "Who should NARI contact if you need help?"
- Opens phone contacts picker.
- User assigns relationship label: Mother, Father, Sister, Brother, Friend, Partner, Other.
- App silently checks if each contact has NARI installed:
  - Has NARI → small NARI badge → will receive in-app push alert
  - No NARI → SMS/WhatsApp icon → will receive message
- User does not configure routing — the system handles it automatically.
- Minimum 1 contact required to proceed. Maximum 5.
- Contacts are reorderable by drag (priority order).

### 2.5 Permissions
- One screen. Each permission explained in plain language before system dialog fires.
- **Required** (must grant to proceed):
  - Location (always on): "So NARI knows where you are if something happens"
  - Notifications: "So alerts reach you instantly"
- **Optional** (skippable):
  - Contacts: "To check if your contacts have NARI installed"
  - Microphone: "For voice distress detection — you can enable this later"
- If required permissions denied: plain-language explanation + "Open Settings" shortcut. Do not block with a wall of text.

**After step 2.5 → user lands on Home.**

### 2.6 Progressive Onboarding Items (appear on Home, not during onboarding)
- **Device pairing banner**: persistent at top of Home until bangle connected. Tapping opens BLE scan → found → pair → success. Skip always visible.
- **Profile completion prompt**: small prompt until name/photo set. Tapping opens Profile in Settings.
- **Calibration intro card**: appears when bangle first connects. Explains 14-day learning period. Dismissible.

---

## 3. Home Tab

### 3.1 Layout — 4 sections, all conditional except Hero

**Top bar**
- NARI wordmark (left)
- Status dot next to wordmark: green (bangle connected) / grey (disconnected). Tapping → Settings → Device.
- Notification bell with unread badge (right)

**Hero Status Card** (always present)
- Full-width card. Background color = current status color (deep green / amber / deep red).
- Large plain-language status label (primary): **"You're Safe"** / **"Stay Alert"** / **"Danger Detected"**
- Secondary line: area name + current time. Example: "JP Nagar · 11:42 PM"
- Bottom of card: three colored dot indicators — HR dot, Motion dot, Stress dot. Colors match individual signal status. No numbers in default view.
- Tapping card → Status tab.

**Journey Mode card** (conditional)
- Off: small, low-contrast, near bottom of screen. Copy: "Travelling alone? Enable journey mode." Single toggle.
- On: full-width, prominent, near top of screen (below Hero). Shows: watching contacts (names), elapsed time, large **"I've Arrived Safely"** button. Home screen visually shifts — not just this card.

**Calibration banner** (conditional — first 14 days post-bangle-pairing only)
- Small banner below Hero card. Copy: "Day [X] of 14 · Learning your baseline." Progress bar.
- Tapping → Status tab → Calibration sub-section.
- Disappears permanently after day 14.

**Recent Alerts** (conditional — only if ≥1 alert in history)
- Last 2 events. Each: icon + plain label + relative time. Example: "Unusual motion detected · 3 hours ago"
- "View all" → Settings → Alert History
- If no alerts exist: section absent entirely. No placeholder.

### 3.2 Empty / Error States

| Condition | Behavior |
|---|---|
| Bangle not connected | Hero card shows "Bangle not connected" in neutral grey. Copy: "Connect your bangle to start monitoring." Tapping → Settings → Device. SOS button remains fully functional. |
| No location permission | Hero card area name replaced with "Location unavailable". |

---

## 4. Status Tab

### 4.1 Default View

**Safety Gauge**
- Large circular dial, 0–100.
- Plain-language label is primary: **"Safe"** / **"Low Risk"** / **"Elevated"** / **"High Risk"** / **"Danger"**
- Numeric score secondary (smaller, below label).
- Gauge ring color = current status color.
- Below gauge: "NARI is monitoring [N] signals"

**Signal Cards** (4 cards)

| Card | Default display |
|---|---|
| Heartbeat (LSTM) | "Normal" / "Elevated" / "Racing" + animated pulse line |
| Movement (TCN) | "Still" / "Active" / "Unusual Movement Detected" |
| Surroundings (Dense/Context) | "Low risk area" / "Moderate risk area" / "High risk area, stay aware" |
| Voice (CNN) | Greyed out. Label: "Coming soon — voice detection" |

**24-hour trend chart** — colored area chart (green/amber/red bands). No axis labels or numbers in default view.

### 4.2 Technical View

Toggle in top-right of Status tab. Label: "Technical View". State persists across sessions.

When on, each card expands:

| Card | Technical data |
|---|---|
| Heartbeat | HR bpm (live), RMSSD ms, z-score vs personal baseline, LSTM confidence (monospace) |
| Movement | SMA value, activity label, TCN confidence (monospace) |
| Surroundings | Location risk score (0–1), time-of-day factor, Dense layer outputs (monospace) |
| Voice | CNN confidence when active (monospace); "No mic data" when inactive |

Trend chart in Technical View: proper line chart with labeled axes and numeric values.
Gauge in Technical View: numeric score displayed prominently (not secondary).

### 4.3 Calibration Sub-section

Link below trend chart → opens sub-section.
- Day-by-day 14-day timeline
- Per-signal baseline: HR (mean ± std when learned), Motion, HRV
- Confidence label: Uncalibrated → Partial → Calibrated
- Plain-language explanation of what calibration means and why it matters

### 4.4 Error States

| Condition | Behavior |
|---|---|
| Loading / no data yet | Skeleton loaders on all cards (not spinners). After 10s: "Waiting for bangle signal" |
| Cloud API unreachable | Cards show last known values with "⚠ Last updated [N] mins ago". Banner at top: "Cloud analysis unavailable. Local monitoring active." |
| Bangle disconnected | Same as API unreachable — last known values with staleness indicator |

---

## 5. Map Tab

### 5.1 Main Map
- Full-width heatmap. High Risk = red overlay, Medium = amber, Low = green.
- User location: live pin with small safety score badge.
- "Centre on me" floating button (bottom right).

### 5.2 Alert Panel
- Bottom sheet on phones (draggable, default peek ~200px). Side panel on tablets.
- Header: "Nearby Alerts" + filter icon
- Filter strip: Today / 7 days / 30 days; type: All / Motion / Audio / Manual SOS
- Scrollable incident list: type icon + area name + time + severity chip
- Tapping → Incident Detail

### 5.3 Incident Detail
- Static map pin (zoomed in), time, alert type, severity.
- **No personal data** — fully anonymised and aggregated.

### 5.4 Error States

| Condition | Behavior |
|---|---|
| GPS unavailable | Grey map overlay. "Location unavailable." + "Enable location in Settings" button. Heatmap renders at last known location. |
| No incidents in area | Map renders normally. Panel shows: "No incidents reported in this area recently." One line, no illustration. |

---

## 6. SOS Flow

### 6.1 Floating SOS Button
- **Single tap** → SOS Countdown screen immediately. No intermediate confirmation dialog.
- **Hold 2 seconds** → silent SOS. Dispatches immediately. No screen change. No sound. Bangle: one quiet vibration. For situations where showing the phone is unsafe.

### 6.2 SOS Countdown Screen
Full-screen takeover. Tab bar hidden. SOS button hidden.

- Deep red fills entire screen.
- Large "SOS" label at top.
- **Countdown ring center**: ring depletes as number counts down from 10. Number displayed inside ring. This is the primary visual element.
- Below ring: "NARI will alert your contacts in [N] seconds"
- One button: **"I'm Safe"** — large, centered.
- Haptic: one pulse per second.
- Countdown reaches 0 → dispatches → transitions to SOS Active.
- "I'm Safe" tapped → cancelled → Home → logs false alarm → optional reason card (see 6.5).
- **Lock screen**: screen must appear above lock screen. "I'm Safe" must be functional without unlocking. Android: `FLAG_SHOW_WHEN_LOCKED`. iOS: appropriate entitlement.

### 6.3 SOS Active Screen
Full-screen takeover. Tab bar hidden. SOS button hidden.

- Deep red background.
- Status list ticking off in real time:
  - "Contacting [Name 1]... ✓"
  - "Contacting [Name 2]... ✓"
  - "GPS location shared... ✓"
- Pulsing location dot (expanding rings, not a map).
- **"Call 112 — Emergency Services"**: full-width, large button, upper half of action area. Initiates direct call to 112. Number is hardcoded and India-specific. Exact label required.
- Below, separated by significant space: **"I'm Safe Now"** — smaller, outlined.
- Below that: "All your contacts will be notified you're okay."

### 6.4 Alert Dispatch

**Contacts with NARI**: high-priority push notification → Alert Received screen (Section 8).

**Contacts without NARI**: WhatsApp if registered, SMS fallback. Exact message format:
```
🆘 NARI Alert: [Name] may need help.
Last known location: [Google Maps link]
Time: [HH:MM AM/PM]
If you can, please check on them or call 112.
— Sent via NARI Safety App
```

Google Maps link opens a static mobile webpage: location pin + alert time. Updates to "[Name] has marked themselves safe" on resolution.

On resolution (user taps "I'm Safe Now"):
- All contacts: "✓ [Name] has marked themselves safe. ([HH:MM PM])"
- Contacts on Alert Received screen: screen updates in place (amber/red → green)

### 6.5 False Alarm Flow
After "I'm Safe" on countdown:
- Optional reason bottom sheet. Copy: "What were you doing?"
- Options: Exercising, Running, Dancing, Other (free text)
- Auto-dismisses after 4 seconds if no interaction.
- If reason given: logged as labeled negative example for active learning pipeline.
- Returns to Home regardless.

---

## 7. Journey Mode

### 7.1 Activation
From Journey Mode card on Home. Toggle on → optional destination entry → optional contact selection (defaults to all) → active.

### 7.2 Active State
- Alert sensitivity elevated.
- Live location shared with selected contacts.
- Home screen visual state shifts.

### 7.3 Journey Mode Overlay (full screen)
- Live map, current location + route trail.
- Watching contacts listed by name.
- Elapsed time, current speed.
- Large **"I've Arrived Safely"** button → resolves Journey Mode, notifies contacts.

### 7.4 Contact Notification on Activation
- NARI contacts: "[Name] has started a journey. You're watching. Tap to view their location."
- Non-NARI contacts: SMS/WhatsApp with live location link.

### 7.5 Auto-Check-in
User stops moving 5+ minutes at unexpected location:
- Notification: "You've been still for a while — are you okay?"
- 2-minute response window.
- No response → AMBIGUOUS state on Home Hero card.

### 7.6 Deactivation
"I've Arrived Safely" → Journey Mode off → contacts notified → Home returns to normal.

---

## 8. Alert Received Screen (Receiving-end flow)

Full experience for contacts who receive an alert and have NARI installed.

### 8.1 Notification
- Title: "⚠️ [Name] may need help"
- Body: "NARI has detected a possible emergency. Tap to view their location."
- Two notification action buttons: **"Call [Name]"** and **"I'm checking on them"**
- High-priority, bypasses DND on Android. Critical alerts entitlement on iOS.
- Distinct alert sound.

### 8.2 Alert Received Screen
Opens on notification tap.

- Amber/red tinted background (amber = auto-trigger, red = manual SOS).
- Top: name + profile photo of person who triggered.
- Context: "NARI detected unusual activity · [N] minutes ago"
- Location: static map thumbnail + area name + distance from contact's location. Example: "Koramangala 5th Block · 2.3 km from you"
- Three buttons stacked vertically:
  1. **"Call [Name]"** — primary, initiates phone call
  2. **"Navigate to their location"** — opens device maps app
  3. **"I'm with them — mark safe"** — resolves alert from contact side
- Below buttons: "Other contacts have also been notified."

### 8.3 Resolution
Primary user taps "I'm Safe Now" → contact's screen updates in place (tint → green, status → "[Name] has marked themselves safe."). Contacts not on screen receive notification.

### 8.4 Error State
Location unavailable at alert time: map thumbnail replaced with "Location signal was unavailable when alert was sent." All buttons still present.

---

## 9. Settings Tab

### 9.1 Sections (in order)

**Profile**: Avatar, name, phone. Edit button → inline editing.

**Emergency Contacts**:
- Drag-to-reorder list. Each contact: avatar, name, relationship label, delivery method badge.
- Swipe to delete, tap to edit. + Add Contact.
- **Test Alert button**: sends clearly-labeled test notification to all contacts.

**Device**:
- Connection status + signal strength.
- Battery: circular gauge, percentage, estimated hours.
- Sensor health grid: 6 tiles — HR Sensor, Motion (IMU), Microphone, GPS, GSM, SOS Button. Green / grey / red.
- Reconnect button. Pair new device.

**Alert Preferences**:
- Sensitivity slider: Conservative / Balanced / Sensitive
- Confirmation window: 5s / 10s / 15s
- Journey Mode auto-enable toggle (default 9 PM threshold)
- Audio alerts toggle

**Data & Privacy**:
- Location sharing: Precise / Approximate
- Data retention: 30 days / 90 days / Forever
- **Federated Learning toggle**: "Help improve NARI for everyone — share anonymised training signals. No personal data leaves your device." Off by default.
- Export my data. Delete my data (with confirmation dialog).

**Language**: English / ಕನ್ನಡ toggle. Confirmation dialog on switch: "Switch to [language]? The app will restart." Both languages fully implemented: all strings, error messages, notification copy, onboarding copy.

**Alert History**:
- Chronological list, monthly grouping. Each item: type icon + plain label + time + outcome chip (Resolved / False Alarm / Escalated).
- Tapping → Alert Detail.

**Alert Detail**:
- **Top section (plain language)**: "[Name], NARI detected unusual movement and an elevated heart rate at 9:42 PM on [date]. You marked yourself safe at 9:55 PM."
- **Bottom section (technical)**: "What triggered this?" — which sensors fired, ML branch outputs with confidence scores, fusion MLP result, z-score values. Serves both audiences on one screen.

**About**:
- App version. Team NARI. Acknowledgments.
- **Demo Mode**: tap version number 5 times. Runs scripted 90-second sequence: Safe (30s) → Elevated motion (10s) → Stress spike (10s) → AMBIGUOUS banner on Home → DISTRESS → SOS Countdown → user dismisses → post-alert explanation card. Demonstrates full ML pipeline without hardware.

---

## 10. Copy and Tone Rules

### No gendered pronouns
Always use the person's name. "Call Priya" not "Call her". "[Name] may need help" not "She may need help". Fallback if name unavailable: "your contact". Never a pronoun.

### Plain language in all default views

| Instead of | Use |
|---|---|
| "BLE connection failed" | "Can't reach your bangle. Make sure it's charged and nearby." |
| "API request timeout" | "Can't connect to NARI's servers. Local monitoring is still active." |
| "RMSSD: 18.2ms" (default) | "Heart rate variability: Normal" |
| "TCN confidence: 0.74" (default) | "Movement: Active" |

Technical data only in Technical View (Status tab) and Alert Detail technical section.

### Reassurance in neutral states
"You're Safe" not "No alerts". "NARI is watching" not "Monitoring active".

### Urgency without panic
Alert copy is firm and clear, not alarming in language. Visual state (red, haptic) provides urgency. Copy stays calm: "NARI has detected unusual activity" not "DANGER DETECTED."

---

## 11. Accessibility Requirements (Hard Requirements)

- All text: 4.5:1 minimum contrast ratio
- Emergency screens: off-white text on red (not pure white)
- All interactive elements: 48×48dp minimum tap target
- Floating SOS button: 64×64dp minimum
- All icon-only elements: accessibility labels. SOS button: "SOS — Send emergency alert"
- All text: relative sizing (sp on Android / Dynamic Type on iOS). No broken layouts at 200% font scale.
- No fixed-height containers around text
- Every haptic event has a visual equivalent
- SOS Countdown and "I'm Safe" operable above lock screen

---

## 12. Phase 2 Feature Status

The UI must look and function as if all features are live. No placeholder visual states except where noted.

| Feature | Phase 2 status |
|---|---|
| Voice detection (CNN branch) | Card present, greyed out, "Coming soon" label |
| Real BLE sensor data | Simulated via DataProvider |
| Real ML inference | Simulated via DataProvider |
| Community heatmap | Seeded synthetic data |
| WhatsApp Business API | Console log only / one configurable test number |
| 112 call on SOS Active | Button present and functional — initiates real call |
| Federated learning | Toggle present, no backend action |
| Live location sharing | UI present, link is a placeholder |

Evaluators must see the production app, not a demo shell.
