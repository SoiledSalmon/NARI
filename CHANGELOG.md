# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-23

### Automated Audit, Cleanup & Documentation Sweep
*Audit performed by Antigravity (automated agent)*

#### Verified
- Ran physiological preprocessing equations, tensor shape formats, and late fusion logic.
- Executed unit tests (`test_process_payload.py`) and E2E integration tests (`test_e2e_predict.py`) verifying health checks and predictions.

#### Removed / Cleaned Up
- Removed python compiler caches (`__pycache__/`, `*.pyc`, `*.pyo`) recursively.
- Staged the deletion of stale file `README_NEW.md`.
- Cleared duplicate payload files and cleaned up developer workspace.

#### Refactored / Fixed
- **Preprocessing Guard**: Guarded against division by zero in heart rate processing by mapping `0.0` bpm pulse inputs to a standard resting baseline of `75.0` bpm.
- **Firmware Reliability**: Replaced the blocking infinite loop in firmware setup (`while(1);`) with a watchdog-friendly delay loop to prevent hardware watchdog resets.
- **Test Runner Fix**: Corrected path resolution inside `backend/assn_mlp/runner.py` to load `yamnet_best.pt` relative to the script location.
- **API Docstrings**: Added PEP-257 docstrings outlining parameters, outputs, and side effects for core functions in `main.py`, `buffers.py`, and `fusion.py`.
- **Dependencies**: Appended the missing audio testing dependencies (`librosa`, `sounddevice`, `soundfile`) to the backend environment specifications.

#### Updated Docs
- Modified root `README.md` to document new test suites, test coverage status, and system limitations.
- Generated `docs/architecture.md` detailing system topology and documenting Architecture Decision Records (ADRs).
- Expanded `.gitignore` with global ignore rules for ML binaries and data logs.

## [0.1.0] - 2026-05-17

### Added
- Initial project structure for NARI Safety Companion.
- Multimodal ML pipeline design (LSTM, TCN, Fusion MLP).
- React Native mobile application with simulated data layer.
- `DataProvider` abstraction for switching between mock and live sensor data.
- UI mockups for 16 key screens including SOS, Journey Mode, and Status Monitoring.
- Support for English and Kannada (ಕನ್ನಡ) languages.
- Hardware integration plan for ESP32 with MAX30102 and MPU-6050.
- Documentation suite covering architecture, design, and data layer.
