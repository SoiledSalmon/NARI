# NARI Technical Architecture & Decision Records

This document describes the technical architecture of the NARI Personal Safety Platform and documents key architectural decisions (ADRs) made during the system audit.

---

## 1. System Overview

NARI integrates low-power hardware telemetry, real-time machine learning inference, and mobile notification routing into an active personal safety shield.

```
┌─────────────────┐           WiFi (HTTP JSON)          ┌──────────────────┐
│   ESP32-S3      ├────────────────────────────────────>│  FastAPI Backend │
│   Wearable      │            /ingest 5Hz              │  (Torch / TF)    │
└────────┬────────┘                                     └────────┬─────────┘
         │                                                       │
         │ Local Alert Checks                                    │ Firestore API
         ▼                                                       ▼
 ┌──────────────┐             BLE Status (Future)       ┌──────────────────┐
 │ Pulse / IMU /│<......................................>│    Cloud DB      │
 │ Ambient Mic  │                                       │   (Firestore)    │
 └──────────────┘                                       └────────┬─────────┘
                                                                 │
                                                                 ▼
                                                        ┌──────────────────┐
                                                        │  React Native    │
                                                        │  Mobile App      │
                                                        └──────────────────┘
```

---

## 2. Component Architecture

### 2.1 Telemetry Collector (Firmware)
- **Controller**: ESP32-S3 (Wroom-1)
- **Biometrics**: MAX30102 pulse sensor (Heart Rate, HRV, SpO2)
- **Motion**: MPU6500 6-axis Accelerometer & Gyroscope
- **Acoustics**: Ambient analog microphone
- **Data Transmission**: WiFi HTTP POST requests containing 200ms sensor batches (10 IMU samples + latest pulse/oxygen readings) sent at 5Hz to the `/ingest` endpoint.

### 2.2 Inference Pipeline (FastAPI Backend)
- **LSTM (Stress Model)**: Analyzes 60-second windows of physiological features (mean heart rate, RMSSD, HRV, default temperature, default EDA) to produce stress state probability.
- **TCN (Motion Model)**: Classifies raw and engineered motion signals (acceleration/gyro magnitudes, jerk, rolling energy, Signal Magnitude Area) from a 3.2-second window to detect falls or physical struggle.
- **Late Fusion Model**: Combines LSTM and TCN branch embeddings into a final multi-class prediction (Safe, Ambiguous, Distress) and calculates a safety score (0–100).
- **Database Synchronization**: Automatically writes elevated alerts to Firebase Firestore under the user's document structure.

### 2.3 User Interface (React Native / Expo)
- State management via Zustand.
- Real-time updates driven by Firestore listeners and periodic health check polling.
- Features SOS countdown triggers, safety heatmaps, and contact list alerts.

---

## 3. Architecture Decision Records (ADRs)

### ADR-001: Watchdog-Friendly Error Traps in Firmware
- **Context**: During initial device setup, if the MPU6500 IMU failed to connect over the I2C bus, the firmware would execute `while(1);` in `setup()`. In the ESP32 framework, this blocks the background task scheduler, triggering task watchdog resets (WDT) and forcing the board into an infinite crash/reboot loop.
- **Decision**: Replace the busy-wait trap with a polling loop that prints diagnostic messages to UART and yields using a substantial `delay(5000);`.
- **Consequences**: Feeds the hardware watchdog timer correctly, stops serial log flooding, and lets the board sit stably in a safe error state during installation faults.
- **Alternatives Considered**: Proceeding without MPU6500 (rejected, as movement telemetry is essential to late fusion inference).

### ADR-002: Physiological Preprocessing Safeguards
- **Context**: When the MAX30102 sensor has no contact (e.g. finger off), heart rate telemetry returns `0.0` bpm. The backend preprocessor calculated the inter-beat interval using `rr_intervals = 60000.0 / hr_bpm`, resulting in a division-by-zero that yields `inf` and cascades `NaN` errors throughout the network.
- **Decision**: Replace `0.0` heart rate values with a standard resting baseline of `75.0` bpm during window feature extraction.
- **Consequences**: Restores mathematical sanity, prevents runtime NaN crashes, and ensures model inputs remain within expected normalized bounds when the wearable is removed.
- **Alternatives Considered**: Dropping batches with zero pulse (rejected, as IMU motion tracking must run continuously regardless of pulse readings).

### ADR-003: Model Exclusions in Repository Tracking
- **Context**: Large machine learning weights (`*.pt`, `*.keras`, `*.pkl`) were stored in local directories. Storing binary weights inside Git repositories leads to repository bloat and bandwidth bottlenecks.
- **Decision**: Implement comprehensive global ignore patterns in `.gitignore` for all major ML model serialization formats and sample payload files.
- **Consequences**: Keeps Git footprint compact and ensures model weights are kept outside of standard code commits.
- **Alternatives Considered**: Using Git LFS (rejected, to minimize setup complexity for lightweight client environments).
