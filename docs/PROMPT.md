# Antigravity Agent Prompt — NARI App

You are building **NARI**, a women's personal safety React Native app. This is a full production build with simulated data for Phase 2. You have two skills available that you must use:

- **sickn33 Antigravity skill** — for all tech stack, architecture, and implementation decisions
- **frontend-design skill** — for all visual, aesthetic, and UI component decisions

**You are in plan mode. Do not write any code yet.**

---

## Step 1: Read All Documentation

Before planning anything, read all documentation files in this order:

1. `README.md` — project overview and constraints summary
2. `PRD.md` — complete functional spec (frozen — do not deviate)
3. `DESIGN.md` — visual and aesthetic brief (your creative territory)
4. `ARCHITECTURE.md` — tech stack and folder structure
5. `DATA_LAYER.md` — TypeScript types, DataProvider interface, theme tokens, i18n structure
6. `NAVIGATION.md` — route tree and screen params
7. `SCREENS.md` — implementation notes per screen
8. `MOCK_DATA.md` — simulation data, Demo Mode, config flags

Do not begin planning until you have read all 8 documents.

---

## Step 2: Understand What Is Frozen vs. What Is Yours

**FROZEN — do not change these:**
- Every user flow and screen described in PRD.md
- All navigation structure from NAVIGATION.md
- All TypeScript types from DATA_LAYER.md
- The DataProvider abstraction pattern — no component touches hardware or APIs directly
- SOS tap behavior — single tap goes directly to countdown, no intermediate dialog
- SOS screens — full-screen takeover, tab bar hidden, back gesture disabled
- "Call 112 — Emergency Services" — exact label, hardcoded number, India-specific
- No gendered pronouns anywhere — always use the person's name
- Both English and Kannada fully implemented — not cosmetic
- All accessibility minimums from DESIGN.md and PRD.md §11

**YOURS — apply the frontend-design skill here:**
- Typography — choose the font pairing (display + body + monospace). No Inter, Roboto, Arial, Space Grotesk, or system fonts.
- Color implementation — you have the semantic token structure from DATA_LAYER.md §colors.ts. The specific shades within each status family are your call, subject to contrast requirements.
- Component visual style — how cards look, surface treatment, border radius, shadows, glassmorphism vs solid vs outlined
- Animation choreography — how the status environment transitions feel, how the countdown ring is built, how cards expand in Technical View
- Onboarding illustration style — pick one direction and commit to it
- Icon style — choose a consistent icon set
- Overall aesthetic tone — pick a clear direction per DESIGN.md. Make it memorable. Avoid generic AI aesthetics.

---

## Step 3: Technology Decisions

Using the sickn33 Antigravity skill, decide and declare your stack choices before planning the build. Address each of these:

1. **Expo managed vs bare workflow** — consider the BLE requirement (Phase 3+) and notification entitlements needed
2. **Navigation** — confirm React Navigation v6+ and the navigator structure matches NAVIGATION.md
3. **State management** — ARCHITECTURE.md suggests Zustand + React Query. Confirm or propose alternative.
4. **Animation library** — Reanimated v3 is specified. Confirm React Native Skia for CountdownRing vs SVG.
5. **Maps** — React Native Maps is specified. Confirm.
6. **Bottom sheet** — `@gorhom/bottom-sheet` is suggested for AlertPanel. Confirm.
7. **Typography loading** — how custom fonts are loaded (Expo Font vs embedded)
8. **i18n** — `i18next` + `react-i18next` is specified. Confirm.

If any specified library conflicts with Antigravity's recommended approach, state the conflict and your resolution before proceeding.

---

## Step 4: Aesthetic Direction

Before the build plan, declare your aesthetic direction using the frontend-design skill's framework:

State in one paragraph:
- What tone you are committing to (from DESIGN.md options)
- Your font pairing choice (display + body + monospace) and why
- Your surface/card treatment approach
- One sentence on what makes this UI unforgettable — the one thing a user will remember

This declaration is your creative contract for the entire build. All component visual decisions should trace back to it.

---

## Step 5: Build Plan

Produce a detailed build plan organized as phases. For each phase, list:
- What screens and components are being built
- What stores are being set up
- What the deliverable state of the app looks like at end of phase

**Suggested phase structure (adjust based on your assessment):**

- **Phase A**: Project scaffolding, navigation skeleton, DataProvider interface + MockDataProvider, all stores, i18n setup (both languages), theme tokens, all route constants. App runs and navigates between empty screens.
- **Phase B**: Onboarding flow — Splash through Permissions. All 5 steps functional. Language selection works. Contacts screen with mock NARI check. Permissions screen.
- **Phase C**: Home screen — complete with all 4 conditional sections, Hero Status Card with animated status transitions, Journey Mode card both states. StatusBackground component.
- **Phase D**: Status tab — SafetyGauge, all 4 SignalCards, Technical View toggle, trend chart, Calibration sub-section. Full default + technical view.
- **Phase E**: SOS flow — SOSButton (floating), SOSCountdown with CountdownRing animation, SOSActive with pulsing dot and real Call 112 button. False alarm flow. Lock screen behavior.
- **Phase F**: Map tab — heatmap with seeded data, AlertPanel bottom sheet, IncidentDetail.
- **Phase G**: Settings tab — all sections: Profile, Contacts (with test alert), Device health grid, Alert Preferences, Data & Privacy (federated learning toggle), Language toggle, Alert History, Alert Detail (two-layer content), About + Demo Mode unlock.
- **Phase H**: Alert Received screen (incoming alert flow). Journey Mode Active overlay.
- **Phase I**: Demo Mode full script (90-second sequence), seeded alert history, final mock data wiring.
- **Phase J**: Accessibility pass — contrast check on all screens, tap target audit, screen reader labels, 200% font scale test. Kannada string completion check.

---

## Step 6: Surface Ambiguities

After reading all documents and forming your plan, list any ambiguities or gaps you have found. For each:
- State what the gap is
- State your proposed resolution
- Mark it as either "I will resolve this myself" or "I need clarification before building"

Only surface genuine ambiguities — do not ask for things already specified in the documentation.

---

## Step 7: Confirm and Begin

When your plan is complete and you have surfaced all ambiguities:

1. Present the plan in full (tech decisions, aesthetic direction, build phases, ambiguities)
2. Wait for confirmation or corrections
3. Once confirmed, begin Phase A

Do not start building until the plan is confirmed.

---

## Non-Negotiables (repeat for emphasis)

These constraints apply throughout the entire build. Check against them at every phase:

- No component touches BLE, cloud API, or hardware directly — DataProvider only
- `dataConfig.ts` is the single toggle point for mock vs live data
- SOS tap = immediate countdown. No "are you sure?" dialog.
- Call 112 button: full-width, prominent, exact label "Call 112 — Emergency Services"
- All strings through i18n — no hardcoded English text in components
- Kannada (`kn.json`) mirrors `en.json` exactly — every key present
- No gendered pronouns — always `{{name}}`
- 48dp minimum tap targets everywhere, 64dp for SOS button
- Off-white text on emergency red screens (not pure white)
- Technical data (bpm values, z-scores, ML confidence) only visible in Technical View and Alert Detail technical section — never in default views
