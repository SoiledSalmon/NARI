# NARI — Safety Companion App

Women's personal safety app paired with a wearable bangle (ESP32, BLE). Monitors physiological and motion signals via an ML pipeline to detect distress and dispatch emergency alerts.

**Phase 2**: Production-ready UI with simulated data pipeline. All features visible and functional. Data sources swap to live with a single config flag per source.

---

## Documentation Index

| Document | What it covers | Who needs it |
|---|---|---|
| `README.md` | This file. Project overview and doc map. | Everyone |
| `PRD.md` | All screens, user flows, states, copy rules. The frozen functional spec. | Agent — read first |
| `DESIGN.md` | Visual tone, constraints, accessibility requirements, typography rules. | Agent — read second |
| `ARCHITECTURE.md` | Tech stack, folder structure, key patterns. | Agent — read third |
| `DATA_LAYER.md` | DataProvider interface, all TypeScript types, mock implementations. | Agent — critical reference |
| `NAVIGATION.md` | Complete route tree, screen params, navigation patterns. | Agent — reference during build |
| `SCREENS.md` | Screen-by-screen implementation notes, props, states, key components. | Agent — reference during build |
| `MOCK_DATA.md` | Simulated data shapes, Demo Mode sequence, config flags. | Agent — reference during build |

**Reading order for a new agent**: PRD → DESIGN → ARCHITECTURE → DATA_LAYER → NAVIGATION → SCREENS → MOCK_DATA.

---

## Project Summary

**App name**: NARI  
**Platform**: React Native, cross-platform Android + iOS  
**Languages**: English, ಕನ್ನಡ (Kannada)  
**Auth**: Firebase Auth, phone OTP  
**Hardware**: ESP32 bangle with MAX30102 (HR), MPU-6050 (IMU), MEMS mic, GPS (Phase 3+)  
**ML models**: TCN (motion/HHAR), LSTM (stress/WESAD), Dense context layer, Fusion MLP. CNN audio branch coming in Phase 3.  
**Phase 2 data**: All sensor and ML data is simulated. GPS is real. Everything else is swappable via `dataConfig.ts`.

---

## Navigation at a Glance

```
Splash
  └─ Language
       └─ Sign Up / Sign In
            └─ Add Contacts
                 └─ Permissions
                      └─ Home ──────────────────────────────────────────────┐
                                                                             │
Tab Bar:  [ Home ] [ Status ] [ Map ] [ Settings ]                          │
          ─────────────────────────────────────────                         │
          Home                                                               │
          Status (+ Calibration sub-section)                                │
          Map ─── Incident Detail                                           │
          Settings ─── Alert History ─── Alert Detail                      │
                                                                             │
Floating (always): [ SOS Button ]                                           │
                                                                             │
Overlays (full-screen modal):                                               │
  SOS Countdown                                                             │
  SOS Active                                                                │
  Journey Mode Active                                                        │
  Alert Received (incoming from another user's SOS)                        │
```

---

## Key Constraints

1. **DataProvider abstraction is non-negotiable.** No component touches hardware, BLE, or cloud APIs directly. Everything goes through `DataProvider`. See `DATA_LAYER.md`.

2. **SOS tap → countdown immediately.** No intermediate confirmation dialog. The countdown IS the grace period. See `PRD.md §6`.

3. **SOS screens are full-screen takeover.** Tab bar and floating button hidden. Screen must appear above device lock screen. See `PRD.md §6.2`.

4. **Call 112 is hardcoded and India-specific.** Exact button label: "Call 112 — Emergency Services". See `PRD.md §6.3`.

5. **No gendered pronouns anywhere.** Always use the person's name. See `PRD.md §10`.

6. **Both languages fully implemented.** Not a cosmetic toggle. Every string translated. See `PRD.md §9.1`.

7. **Accessibility minimums are hard requirements.** 4.5:1 contrast, 48dp tap targets, relative font sizing. See `DESIGN.md` and `PRD.md §11`.
