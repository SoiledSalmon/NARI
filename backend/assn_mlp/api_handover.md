# ASSN Cloud API Handover Document

This document outlines the JSON payload the ESP32 will send, and how the cloud API needs to handle that data to run the machine learning models.

## 1. Expected JSON Payload from ESP32

The ESP32 will send a JSON payload every **10 seconds**. The API should accept this via a `POST` request.

```json
{
  "hr_bpm": [74, 75, 73, 76, 72, 78, 74, 75, 77, 73],
  "spo2": 97,
  "imu": [
    [0.02, -0.98, 0.12, 1.2, -0.5, 0.3], 
    ... // exactly 200 arrays of 6 floats (4 seconds at 50Hz)
  ],
  "audio_pcm": [0.01, -0.02, 0.05, ...], // 15,360 floats (0.96 sec at 16kHz)
  "device_id": "assn_001"
}
```

## 2. Required Preprocessing in the API

The `inference.py` script requires specific tensor shapes. The API needs to map the raw JSON data into the following formats before calling the ML models:

### A. LSTM Features (Shape: `1 x 10 x 8`)
The API needs to build a 10-timestep array with 8 features per step.
1. **HR (bpm)**: Normalise `hr_bpm` values (e.g., `value / 200.0`).
2. **RMSSD (ms)**: Calculate from HR. (Convert HR to RR intervals: `60000 / HR`, then compute Root Mean Square of Successive Differences).
3. **SDNN (ms)**: Standard deviation of the NN (RR) intervals.
4. **pNN50 (%)**: Percentage of successive RR intervals that differ by more than 50ms.
5. **SpO2 (%)**: Use the `spo2` value, normalised (e.g., `value / 100.0`).
6. **Skin Temp**: (Omitted/Neutral - fill with `0.0`).
7. **EDA/GSR**: (Omitted/Neutral - fill with `0.0`).
8. **RR interval**: `60000 / hr_bpm`, normalised.

### B. Motion / IMU Features (Shape: `1 x 200 x 12`)
The JSON contains 6 raw axes (accel x/y/z, gyro x/y/z). The API needs to compute 6 additional engineered features per timestep:
1-6. Raw Accel & Gyro (from JSON)
7. **acc_magnitude**: `sqrt(ax^2 + ay^2 + az^2)`
8. **gyro_magnitude**: `sqrt(gx^2 + gy^2 + gz^2)`
9. **jerk**: `diff(acc_magnitude)`
10. **acc_energy**: Rolling RMS of `acc_magnitude`
11. **gyro_energy**: Rolling RMS of `gyro_magnitude`
12. **SMA (Signal Magnitude Area)**: `|ax| + |ay| + |az|`

### C. Audio Embedding (Shape: `1 x 1024`)
The raw audio from the JSON (`audio_pcm`) is just an array of 15,360 floats (representing 0.96 seconds of audio at 16kHz). 

Before this goes into our PyTorch `YAMNetClassifier`, it **must be encoded** into a 1024-dimensional embedding using Google's pre-trained YAMNet model via TensorFlow Hub:

```python
import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
import torch

# 1. Load the official YAMNet model from TF Hub (do this once on API startup)
yamnet_model = hub.load('https://tfhub.dev/google/yamnet/1')

# 2. Convert incoming JSON audio array to numpy
waveform = np.array(incoming_json["audio_pcm"], dtype=np.float32)

# 3. Pass waveform through YAMNet to get frame embeddings
scores, embeddings, spectrogram = yamnet_model(waveform)

# 4. Average the embeddings across all frames to get a single (1024,) vector
#    (This matches the exact logic from your runner.py!)
emb_1024 = tf.reduce_mean(embeddings, axis=0).numpy()

# 5. Convert to a PyTorch tensor of shape (1, 1024)
audio_embedding = torch.tensor(emb_1024, dtype=torch.float32).unsqueeze(0)
```
This `audio_embedding` is what you pass into `predict()`.

### D. Context Vector (Shape: `1 x 6`)
For now, pass a neutral hardcoded tensor:
```python
context_vector = torch.tensor([[0.5, 0.1, 0.1, 0.47, 0.0, 0.05]])
```

## 3. Running Inference

**Easiest option:** Use the included `api_backend.py` in the root of `assn_mlp/`. It handles all preprocessing and model loading. Your Flask/FastAPI route just needs to call:

```python
from api_backend import handle_esp32_request

# In your POST route:
result = handle_esp32_request(request.json)
# Returns: {"prediction": "safe", "confidence": 0.99, "safe_prob": ..., "ambiguous_prob": ..., "distress_prob": ...}
```

**Manual option:** If you want to call `inference.py` directly, set up the args object like this:

```python
import sys, os
sys.path.insert(0, 'code/training/assn_fusion_local')
from inference import predict, load_all_models

class Args:
    lstm_path   = 'models/lstm/lstm_best.pt'
    motion_path = 'models/tcn/motion_embedding_model_patched.keras'
    yamnet_path = 'models/yamnet/yamnet_best.pt'
    bundle_path = 'models/fusion/assn_bundle.pt'

# Load models once at API startup
lstm_model, motion_model, yamnet_clf, context_model, fusion_mlp = load_all_models(Args())

# Call predict with preprocessed tensors
result = predict(
    lstm_model, motion_model, yamnet_clf, context_model, fusion_mlp,
    lstm_window,      # torch.Tensor (1, 10, 8)
    motion_window,    # numpy.ndarray (1, 200, 12)
    audio_embedding,  # torch.Tensor (1, 1024)
    context_vector    # torch.Tensor (1, 6)
)
```

## 4. Files to hand over
Zip up the entire `assn_mlp` folder. Key files:
- **`api_backend.py`** — Ready-to-use backend (handles preprocessing + inference)
- **`runner.py`** — Standalone YAMNet audio test script
- `code/training/assn_fusion_local/inference.py` — Core inference logic
- `code/training/assn_fusion_local/models.py` — Model architecture definitions
- `models/lstm/lstm_best.pt` — LSTM weights
- `models/tcn/motion_embedding_model_patched.keras` — Patched Keras TCN weights
- `models/yamnet/yamnet_best.pt` — YAMNet classifier weights
- `models/fusion/assn_bundle.pt` — Fusion MLP + Context branch weights (bundled)
