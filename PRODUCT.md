# Product

## Register

product

## Users

NARI is for women using a wearable safety bangle and a companion mobile app in India, with trusted contacts who may receive emergency alerts. Users may be in calm daily-use contexts, travelling alone, or under acute stress, so the interface must be glanceable, calm, and operable under pressure.

## Product Purpose

NARI monitors physiological, motion, location, and contextual safety signals to detect risk and dispatch tiered alerts through trusted contacts, nearby responders, and emergency services. Phase 2 must feel production-ready while using a simulated data pipeline for sensors and ML outputs, with GPS live and all data access routed through the DataProvider abstraction.

Success means users can quickly understand their current safety state, see whether the bangle and key signals are active, enter journey mode, review alerts, inspect nearby risk, and trigger or resolve SOS without ambiguity.

## Brand Personality

Calm, protective, and precise. NARI should feel like a trusted companion, not a clinical monitor or a fear-driven security product. The tone is direct, reassuring in neutral states, and firm during emergencies.

## Anti-references

Avoid harsh surveillance aesthetics, panic-heavy emergency language, sterile hospital UI, generic dark cyber dashboards, decorative glass effects that reduce readability, and technical jargon in default user-facing views. Do not use gendered pronouns; use the person's name or "your contact."

## Design Principles

1. Safety state comes first: Safe, Warning, and Danger must be readable at a glance through text, color, and layout.
2. Calm under pressure: copy stays plain and steady while red states, haptics, and motion provide urgency.
3. Production UI, simulated pipeline: every Phase 2 feature should look real and functional, with no demo-shell placeholders except explicitly frozen states.
4. Progressive detail: default screens use plain language, while technical ML and sensor values appear only in Technical View or technical sections.
5. Trust through consistency: tokenized spacing, color semantics, type hierarchy, and component behavior should remain consistent across Home, Status, Map, Settings, SOS, and alert flows.

## Accessibility & Inclusion

Meet the PRD hard requirements: 4.5:1 text contrast minimum, off-white text on emergency red states, 48dp minimum touch targets, 64dp minimum SOS target, icon-only accessibility labels, dynamic text support without fixed-height text containers, and visual equivalents for every haptic event. English and Kannada strings must remain fully supported.
