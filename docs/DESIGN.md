\---

name: NARI
colors:
surface: '#fcf9f2'
surface-dim: '#dcdad3'
surface-bright: '#fcf9f2'
surface-container-lowest: '#ffffff'
surface-container-low: '#f6f3ec'
surface-container: '#f0eee7'
surface-container-high: '#ebe8e1'
surface-container-highest: '#e5e2db'
on-surface: '#1c1c18'
on-surface-variant: '#434840'
inverse-surface: '#31312c'
inverse-on-surface: '#f3f0ea'
outline: '#73796f'
outline-variant: '#c3c8bd'
surface-tint: '#496640'
primary: '#334f2b'
on-primary: '#ffffff'
primary-container: '#4a6741'
on-primary-container: '#c2e4b4'
inverse-primary: '#afd0a1'
secondary: '#366667'
on-secondary: '#ffffff'
secondary-container: '#baeced'
on-secondary-container: '#3c6c6d'
tertiary: '#613e41'
on-tertiary: '#ffffff'
tertiary-container: '#7b5558'
on-tertiary-container: '#ffced1'
error: '#ba1a1a'
on-error: '#ffffff'
error-container: '#ffdad6'
on-error-container: '#93000a'
primary-fixed: '#caecbc'
primary-fixed-dim: '#afd0a1'
on-primary-fixed: '#062104'
on-primary-fixed-variant: '#324e2a'
secondary-fixed: '#baeced'
secondary-fixed-dim: '#9ecfd0'
on-secondary-fixed: '#002021'
on-secondary-fixed-variant: '#1b4e4f'
tertiary-fixed: '#ffdadb'
tertiary-fixed-dim: '#ebbabd'
on-tertiary-fixed: '#2f1316'
on-tertiary-fixed-variant: '#603d40'
background: '#fcf9f2'
on-background: '#1c1c18'
surface-variant: '#e5e2db'
typography:
status-display:
fontFamily: plusJakartaSans
fontSize: 40px
fontWeight: '700'
lineHeight: 48px
letterSpacing: -0.02em
headline-lg:
fontFamily: plusJakartaSans
fontSize: 32px
fontWeight: '600'
lineHeight: 40px
headline-md:
fontFamily: plusJakartaSans
fontSize: 24px
fontWeight: '600'
lineHeight: 32px
body-lg:
fontFamily: manrope
fontSize: 18px
fontWeight: '400'
lineHeight: 28px
body-md:
fontFamily: manrope
fontSize: 16px
fontWeight: '400'
lineHeight: 24px
technical-sm:
fontFamily: jetbrainsMono
fontSize: 13px
fontWeight: '500'
lineHeight: 16px
letterSpacing: 0.05em
label-caps:
fontFamily: manrope
fontSize: 12px
fontWeight: '700'
lineHeight: 16px
letterSpacing: 0.1em
rounded:
sm: 0.25rem
DEFAULT: 0.5rem
md: 0.75rem
lg: 1rem
xl: 1.5rem
full: 9999px
spacing:
unit: 4px
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 40px
gutter: 16px
margin-mobile: 20px
margin-desktop: 64px
---

## Brand \& Style

This design system is built on the pillars of **Calm Authority** and **Quiet Confidence**. It functions as a trusted companion rather than a clinical tool, prioritizing emotional safety and clarity during high-stress moments. The visual language avoids the harshness often found in security software, opting instead for a "Soft Humanist" aesthetic that blends **Minimalism** with **Glassmorphism**.

The interface utilizes generous whitespace and a low-contrast hierarchy to reduce cognitive load. Surfaces are treated with subtle frosted glass effects and deep, organic shadows to create a sense of tactile depth and presence, ensuring the user feels supported by an intelligent, warm presence.

## Colors

The color strategy for this design system is state-driven, using environmental palettes to communicate safety levels without inducing panic.

* **Foundations:** The light mode base uses a warm cream (#FCF9F2) to avoid the sterile glare of pure white. Dark mode utilizes a deep navy-charcoal (#1A1C2E) to maintain legibility while being discreet at night.
* **State Semantics:** Safety is represented by a deep Sage Green (#4A6741), providing a grounded, calm atmosphere. Alert states use a warm Amber (#D99141) to signal caution without alarm. Critical Danger/SOS states employ a muted Crimson (#8C2F39), paired exclusively with off-white text for maximum accessibility and urgency.
* **Accents:** Soft Teal and Dusty Rose are used for non-critical interactions, onboarding, and secondary information, maintaining the warm, approachable vibe.

## Typography

Typography in this design system balances approachability with technical precision.

* **Hero \& Status:** **Plus Jakarta Sans** is used for its soft, rounded terminals and optimistic character. It is the primary voice for safety status and large headers.
* **Body \& Interface:** **Manrope** provides a refined, modern sans-serif feel that remains highly legible in both light and dark modes. It handles all instructional and conversational text.
* **Technical/Sensor Data:** **JetBrains Mono** is utilized for timestamps, GPS coordinates, and sensor values. The monospaced nature provides a sense of "technical truth" and reliability, while its modern construction keeps it from feeling overly "coder-like."

## Layout \& Spacing

This design system employs a **Fluid Grid** model with a heavy emphasis on "Generous Whitespace" to promote a sense of calm.

* **Mobile:** A 4-column layout with 20px outside margins and 16px gutters. Elements typically span the full width to maximize touch targets.
* **Tablet/Desktop:** An 8 or 12-column centered grid. Content is contained within a maximum width to prevent eye strain, with larger margins to maintain the minimalist aesthetic.
* **Rhythm:** Spacing follows a 4px baseline shift, but layout blocks primarily use the `lg` (24px) and `xl` (40px) units to create breathing room between functional groups.

## Elevation \& Depth

Depth is achieved through **Tonal Layering** and **Soft Glassmorphism**.

1. **Surfaces:** Backgrounds are solid warm-neutrals. Cards and modals use a semi-transparent blur (Backdrop Filter: blur 20px) with a very thin, low-contrast 1px border (#FFFFFF in light mode, #FFFFFF10 in dark mode).
2. **Shadows:** Shadows are extra-diffused and tinted with the primary or status color. Instead of black shadows, a Sage Green status card will cast a soft Sage shadow (e.g., `box-shadow: 0 10px 30px -5px rgba(74, 103, 65, 0.15)`).
3. **Low-Contrast Outlines:** Buttons and inputs use soft, tonal borders rather than high-contrast strokes to maintain the "quiet" nature of the design.

## Shapes

The shape language is defined by large, inviting radii. The standard radius for primary containers and cards is **20px**.

* **Cards/Buttons:** 20px (`rounded-xl` equivalent).
* **Small Elements (Chips/Toggles):** 12px.
* **Interactive States:** Softening edges even further for active states to suggest a "pressed" or "squishy" tactile feedback.

Sharp corners are strictly avoided to maintain the "Soft/Warm" brand personality.

## Components

### Buttons

Primary buttons are large (min-height 56px), fully rounded, and use high-contrast text against status-driven backgrounds. They should feel substantial and easy to tap under duress.

### Status Indicators

The heart of the app. These are large, animated rings or "pulses" that use soft gradients of the status colors (Sage, Amber, or Crimson). The animation should be a slow, rhythmic "breath" to help regulate the user's heart rate.

### Cards

Low-contrast elevated cards are the primary container. They feature a 20px corner radius and a subtle internal glow (top-left inner shadow) to simulate a physical, soft-touch surface.

### Soft Toggles

Toggles are larger than standard OS components, using the Teal and Rose accents for "On" states. The track has a deep inset shadow to suggest it is carved into the surface.

### Technical Value Readouts

Sensor data (Battery, GPS, Signal) is presented in JetBrains Mono within small, translucent glass chips. This distinguishes "hard data" from "emotional status."

### SOS Trigger

A unique component that requires a long-press or swipe-to-confirm gesture. It uses the Crimson base and an aggressive, expanding backdrop pulse to indicate it is active.

