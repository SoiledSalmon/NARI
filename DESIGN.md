# Design

## Visual Language

NARI uses a warm, mobile-first product interface built around calm authority. The Google Stitch references establish cream backgrounds, sage safety surfaces, muted amber warnings, deep red emergency screens, rounded cards, soft shadows, pill controls, and simple icon-led rows. The UI should feel protective and quiet in normal use, then become unmistakably urgent during SOS without using panicked copy.

## Color System

Use safety semantics consistently:

- Safe / normal: deep sage green and soft green tints.
- Warning / elevated risk: warm amber and pale amber tints.
- Danger / active distress / SOS: deep crimson red with off-white text.
- Background and UI chrome: warm cream, linen, sand, and dark warm neutrals.
- Technical or non-critical accents: restrained teal and dusty rose only when they do not compete with safety states.

Do not introduce conflicting semantic colors. Red is reserved for danger, SOS, failed delivery, and critical errors. Amber is for elevated risk and caution. Green is for safe, connected, resolved, and normal readings.

## Typography

Use the existing token intent:

- Large status labels and screen titles: Plus Jakarta Sans, bold or semibold.
- Body, labels, buttons, and settings rows: Manrope.
- Sensor values, timestamps, GPS, confidence values, and technical readouts: JetBrains Mono.

Hierarchy order: safety status, screen title, section header, card title, data value, supporting metadata. Safety labels such as "You're Safe", "Stay Alert", "Danger Detected", "Safe", "Elevated", and "Danger" must be bold, large, and scannable.

## Layout

Primary target is mobile. Use 20px outside margins, a 4px spacing baseline, and consistent card rhythm. The main app uses four tabs: Home, Status, Map, and Settings, with the SOS action floating above the tab bar except on full-screen overlay flows.

Home prioritizes the hero status card, then conditional journey, calibration, device, and alert content as specified in the PRD. Status prioritizes the gauge, signal cards, trend, and calibration. Map prioritizes the map canvas and alert panel. Settings uses grouped sections with clear rows and device health tiles.

Do not remove, rename, or reorder locked PRD features unless the PRD explicitly marks a section conditional.

## Components

- Hero status card: full-width, status-colored, large plain-language label, location/time line, and compact signal dots.
- Signal cards: clear icon or signal cue, plain status label by default, technical values only in Technical View.
- Alert rows: icon, plain label, relative time, and severity or outcome chip.
- Map panel: filter pills and incident list over the map on mobile.
- SOS screens: full-screen red takeover, high-contrast action hierarchy, prominent "Call 112 - Emergency Services", and visible delivery progress.
- Empty states: only where required by PRD. Home recent alerts are absent when empty; map panel can show one-line no-incident copy.

Use rounded cards and pills, but keep readability higher than decorative softness. Shadows should be subtle and tinted enough to separate layers without creating a floating-card pileup.

## Motion

Motion communicates state. Use short transitions for risk changes, SOS pulses, alert arrivals, delivery ticks, and map marker or heatmap fade-in. Avoid decorative page-load choreography. Respect reduced-motion settings where available.

## Copy

Copy is direct, calm, and action-oriented. Default views use plain language, not model or sensor jargon. Technical values belong in Technical View and alert technical sections. Never use gendered pronouns. Use exact PRD labels where specified, including "Call 112 - Emergency Services", "I'm Safe", "I'm Safe Now", and "I've Arrived Safely".

## Accessibility

All status colors must pass 4.5:1 contrast for text. Emergency red screens use off-white text, not pure white. Touch targets must meet 48dp minimum, with the SOS action at least 64dp. Icon-only controls require labels. Text containers must allow wrapping and dynamic text scaling.
