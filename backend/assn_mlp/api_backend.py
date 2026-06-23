"""
api_backend.py — Processes raw ESP32 JSON payloads and runs ASSN fusion inference.

Usage:
    1. Save the ESP32 JSON output to 'payload.json' in the assn_mlp folder
    2. Run: python api_backend.py

    Or import handle_esp32_request() from your Flask/FastAPI app.
"""

import json
import torch
import numpy as np
import os
import sys

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import tensorflow as tf
import tensorflow_hub as hub

# Add the correct path so we can import inference.py and models.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'code', 'training', 'assn_fusion_local'))

from inference import predict, load_all_models, print_result

# ── 1. GLOBAL MODEL LOADING ──────────────────────────────────────────────────
print("Loading official YAMNet from TF Hub...")
yamnet_hub = hub.load('https://tfhub.dev/google/yamnet/1')
print("YAMNet Hub model loaded.")

# Build args that match what inference.py expects
class Args:
    pass

args = Args()
BASE = os.path.dirname(__file__)
args.lstm_path   = os.path.join(BASE, 'models', 'lstm', 'lstm_best.pt')
args.motion_path = os.path.join(BASE, 'models', 'tcn', 'motion_embedding_model_patched.keras')
args.yamnet_path = os.path.join(BASE, 'models', 'yamnet', 'yamnet_best.pt')
args.bundle_path = os.path.join(BASE, 'models', 'fusion', 'assn_bundle.pt')

print("Loading ASSN ML models...")
lstm_model, motion_model, yamnet_clf, context_model, fusion_mlp = load_all_models(args)
print("All models loaded and ready!\n")


# ── 2. PREPROCESSING: Raw ESP32 JSON → Model Tensors ─────────────────────────

def rolling_rms(arr, window=5):
    """Rolling root-mean-square for energy features."""
    padded = np.pad(arr, (window - 1, 0), mode='edge')
    rms = np.zeros(len(arr))
    for i in range(len(arr)):
        rms[i] = np.sqrt(np.mean(padded[i:i + window] ** 2))
    return rms


def process_payload(data):
    """
    Convert raw ESP32 JSON into the exact tensor formats
    that inference.py's predict() function expects.
    """

    # ── A. LSTM Features: (1, 10, 8) ──────────────────────────────────────
    hr_bpm = np.array(data['hr_bpm'], dtype=np.float64)
    # Guard against division by zero by replacing 0.0 heart rate (sensor disconnected) with a baseline of 75.0 bpm
    hr_bpm = np.where(hr_bpm == 0.0, 75.0, hr_bpm)
    rr_intervals = 60000.0 / hr_bpm                      # ms
    diffs = np.diff(rr_intervals)
    rmssd = np.sqrt(np.mean(diffs ** 2)) if len(diffs) > 0 else 0.0
    sdnn  = np.std(rr_intervals)
    pnn50 = (np.sum(np.abs(diffs) > 50) / len(diffs) * 100) if len(diffs) > 0 else 0.0
    spo2  = float(data.get('spo2', 97))

    lstm_features = []
    for i in range(len(hr_bpm)):
        feat = [
            hr_bpm[i] / 200.0,          # 0: HR normalised
            rmssd / 100.0,               # 1: RMSSD normalised
            sdnn / 100.0,                # 2: SDNN normalised
            pnn50 / 100.0,               # 3: pNN50 normalised
            spo2 / 100.0,                # 4: SpO2 normalised
            0.0,                         # 5: Skin temperature (not available)
            0.0,                         # 6: EDA/GSR (not available)
            rr_intervals[i] / 1000.0,    # 7: RR interval normalised
        ]
        lstm_features.append(feat)
    lstm_window = torch.tensor([lstm_features], dtype=torch.float32)  # (1, 10, 8)

    # ── B. IMU / Motion Features: numpy (1, 200, 12) ──────────────────────
    imu_raw = np.array(data['imu'], dtype=np.float32)  # (200, 6)
    acc  = imu_raw[:, 0:3]   # accelerometer x, y, z
    gyro = imu_raw[:, 3:6]   # gyroscope x, y, z

    acc_mag  = np.linalg.norm(acc, axis=1)
    gyro_mag = np.linalg.norm(gyro, axis=1)
    jerk     = np.concatenate(([0.0], np.diff(acc_mag)))
    acc_energy  = rolling_rms(acc_mag)
    gyro_energy = rolling_rms(gyro_mag)
    sma = np.sum(np.abs(acc), axis=1)  # Signal Magnitude Area

    motion_window = np.zeros((1, 200, 12), dtype=np.float32)
    motion_window[0, :, 0:6]  = imu_raw        # raw 6-axis
    motion_window[0, :, 6]    = acc_mag
    motion_window[0, :, 7]    = gyro_mag
    motion_window[0, :, 8]    = jerk
    motion_window[0, :, 9]    = acc_energy
    motion_window[0, :, 10]   = gyro_energy
    motion_window[0, :, 11]   = sma

    # ── C. Audio Embedding: (1, 1024) ─────────────────────────────────────
    # Exactly matches runner.py logic:
    #   scores, embeddings, _ = yamnet_model(waveform)
    #   emb_1024 = tf.reduce_mean(embeddings, axis=0).numpy()
    waveform = np.array(data['audio_pcm'], dtype=np.float32)
    scores, embeddings, _ = yamnet_hub(waveform)
    emb_1024 = tf.reduce_mean(embeddings, axis=0).numpy()
    audio_embedding = torch.tensor(emb_1024, dtype=torch.float32).unsqueeze(0)  # (1, 1024)

    # ── D. Context Vector: (1, 6) — neutral for now ──────────────────────
    context_vector = torch.tensor(
        [[0.5, 0.1, 0.1, 0.47, 0.0, 0.05]], dtype=torch.float32
    )

    return lstm_window, motion_window, audio_embedding, context_vector


# ── 3. MAIN INFERENCE FUNCTION ───────────────────────────────────────────────

def handle_esp32_request(json_data):
    """
    Takes a dict (parsed JSON from ESP32) and returns prediction result.
    This is the function your friend's Flask/FastAPI route should call.
    """
    # Preprocess raw sensor data into model-ready tensors
    lstm_win, motion_win, audio_emb, ctx = process_payload(json_data)

    # Run the full fusion inference pipeline
    result = predict(
        lstm_model, motion_model, yamnet_clf, context_model, fusion_mlp,
        lstm_win, motion_win, audio_emb, ctx
    )

    return result


# ── 4. LOCAL TEST ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    payload_path = os.path.join(os.path.dirname(__file__), 'payload.json')

    if not os.path.exists(payload_path):
        print("=" * 50)
        print("No payload.json found!")
        print("Save the ESP32 JSON output to 'payload.json'")
        print(f"Expected location: {payload_path}")
        print("=" * 50)
        sys.exit(1)

    print("Found payload.json — running full inference pipeline...\n")
    with open(payload_path, 'r') as f:
        data = json.load(f)

    # Quick sanity checks on the payload
    print(f"HR readings:    {len(data['hr_bpm'])} (expected 10)")
    print(f"IMU rows:       {len(data['imu'])} (expected 200)")
    print(f"IMU cols/row:   {len(data['imu'][0])} (expected 6)")
    print(f"Audio samples:  {len(data['audio_pcm'])}")
    print(f"SpO2:           {data.get('spo2', 'N/A')}")
    print()

    result = handle_esp32_request(data)

    print("=" * 50)
    print("  ESP32 LIVE PREDICTION RESULT")
    print("=" * 50)
    print_result(result)
    print("=" * 50)
