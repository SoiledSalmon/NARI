# NARI — Adaptive Women Safety and Risk Detection System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](CONTRIBUTING.md)

NARI is an AI-powered wearable safety system combining multimodal deep learning with an ESP32-based hardware platform to detect distress in real time and trigger emergency alerts.

## 🌍 SDG Alignment

NARI is committed to supporting the United Nations Sustainable Development Goals:
- **SDG 3**: Good Health and Well-being
- **SDG 5**: Gender Equality
- **SDG 10**: Reduced Inequalities

## 🛡️ Problem Statement

Personal safety, particularly for women, remains a significant global challenge. Traditional safety apps often require manual intervention during high-stress situations, which can be difficult or impossible. NARI addresses this by providing an adaptive, autonomous safety companion. Using a combination of heart rate monitoring (LSTM), motion analysis (TCN), and environmental context, the system detects anomalies associated with distress. When distress is identified, NARI initiates an automated SOS flow, notifying emergency contacts and sharing live location data without the user needing to reach for their phone.

## 🚀 Quick Start

Follow these steps to get the NARI dashboard running locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/nari.git
   cd nari
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory. Refer to [Setup Guide](docs/setup.md) for required keys.

4. **Start the application**:
   ```bash
   npx expo start
   ```

## 🏗️ Architecture

NARI follows a modular architecture split between a wearable hardware device (ESP32) and a mobile application (React Native).

- **Hardware**: ESP32 bangle equipped with MAX30102 (HR), MPU-6050 (IMU), and optional GPS/GSM.
- **ML Pipeline**: Multimodal distress detection using LSTM (stress), TCN (motion), and Fusion MLP for final safety scoring.
- **Data Layer**: A strict `DataProvider` abstraction that allows seamless switching between simulated and live sensor data.

For a deep dive into the system design, see [Architecture Documentation](docs/architecture.md).

## 📄 Documentation Map

- [Architecture Deep-Dive](docs/architecture.md) — System design and data patterns.
- [Setup Guide](docs/setup.md) — Local development and hardware flashing.
- [Product Requirements](docs/product-requirements.md) — Detailed user flows and screen specs.
- [ML Models](docs/models.md) — Training, datasets, and inference details.
- [Hardware Specs](docs/hardware.md) — BOM and wiring diagrams.
- [Design System](docs/design-system.md) — Visual pillars and theme tokens.
- [Project Roadmap](docs/roadmap.md) — Past milestones and future scope.
- [Contributing](CONTRIBUTING.md) — How to help improve NARI.

## 👥 Team NARI

Developed with 💚 by **Team NARI**. We are dedicated to building technology that makes the world a safer place.

## ⚖️ License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
