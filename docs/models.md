# Machine Learning Models

NARI utilizes a multimodal deep learning pipeline to detect distress by analyzing physiological and behavioral signals.

## 🧠 Multimodal Architecture

The system processes data through specialized branches before fusing them into a final safety score.

### 1. Stress Detection (LSTM)
- **Signal**: Heart Rate (HR) and Heart Rate Variability (HRV) from MAX30102.
- **Dataset**: Trained on the **WESAD (Wearable Stress and Affect Detection)** dataset.
- **Goal**: Identify physiological spikes associated with acute stress or panic.
- **Output**: Stress levels (Normal, Elevated, Racing).

### 2. Motion Analysis (TCN)
- **Signal**: 3-axis Accelerometer and Gyroscope data from MPU-6050.
- **Architecture**: Temporal Convolutional Network (TCN) for effective sequential pattern recognition.
- **Dataset**: Trained on the **HHAR (Heterogeneous Human Activity Recognition)** dataset.
- **Goal**: Detect "abnormal" motion patterns such as struggling, falling, or rapid jerky movements.
- **Output**: Activity labels (Still, Active, Abnormal).

### 3. Environmental Context (Dense)
- **Signal**: GPS location, time of day, and historical safety heatmap data.
- **Goal**: Weigh the sensor signals against environmental risk factors (e.g., being in a high-incident area late at night).
- **Output**: Contextual risk score.

### 4. Safety Fusion (MLP)
- **Input**: Outputs from LSTM, TCN, and Context branches.
- **Architecture**: Multi-Layer Perceptron (MLP) that learns the optimal weighting for each branch.
- **Goal**: Produce a single, unified Safety Score (0–100) that triggers the SOS flow if it drops below a critical threshold.

## 🎤 Future Scope: Audio Analysis (CNN)
- **Goal**: Detect verbal distress or loud anomalies using an onboard MEMS microphone.
- **Status**: Research phase (Phase 3).
