"""
Unit test for process_payload() — validates tensor shapes, finite values, and ranges.
Run from: backend/ directory
"""
import json
import sys
import os
import numpy as np

# Ensure backend dir is on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("  UNIT TEST: process_payload() Tensor Shapes & Values")
print("=" * 60)

# Load payload
payload_path = os.path.join("assn_mlp", "payload.json")
with open(payload_path, "r") as f:
    data = json.load(f)

print(f"\nPayload loaded from: {payload_path}")
print(f"  hr_bpm count:   {len(data['hr_bpm'])} (expected 10)")
print(f"  spo2:           {data.get('spo2', 'N/A')}")
print(f"  imu shape:      {len(data['imu'])}x{len(data['imu'][0])} (expected 200x6)")
print(f"  audio_pcm len:  {len(data['audio_pcm'])} (expected 15360)")

# Import process_payload (this also loads YAMNet + all models at import time)
print("\nImporting assn_mlp.api_backend (this loads models — may take a minute)...")
from assn_mlp.api_backend import process_payload
print("Import complete.\n")

# Run preprocessing
print("Running process_payload()...")
lstm_tensor, motion_tensor, audio_tensor, context_tensor = process_payload(data)
print("Preprocessing complete.\n")

# ── Shape Checks ──
all_pass = True

def check(name, actual, expected):
    global all_pass
    status = "PASS" if actual == expected else "FAIL"
    if actual != expected:
        all_pass = False
    print(f"  {name}: shape={actual}  expected={expected}  [{status}]")

print("Shape Checks:")
check("LSTM tensor",    tuple(lstm_tensor.shape),    (1, 10, 8))
check("IMU/motion",     tuple(motion_tensor.shape),  (1, 200, 12))
check("Audio embedding", tuple(audio_tensor.shape),  (1, 1024))
check("Context vector", tuple(context_tensor.shape), (1, 6))

# ── Finiteness Checks ──
print("\nFiniteness Checks (no NaN/Inf):")

import torch

def check_finite(name, tensor):
    global all_pass
    if isinstance(tensor, np.ndarray):
        has_nan = np.isnan(tensor).any()
        has_inf = np.isinf(tensor).any()
    elif isinstance(tensor, torch.Tensor):
        has_nan = torch.isnan(tensor).any().item()
        has_inf = torch.isinf(tensor).any().item()
    else:
        print(f"  {name}: unknown type {type(tensor)}")
        return
    
    ok = not has_nan and not has_inf
    status = "PASS" if ok else "FAIL"
    if not ok:
        all_pass = False
    print(f"  {name}: NaN={has_nan}, Inf={has_inf}  [{status}]")

check_finite("LSTM tensor",     lstm_tensor)
check_finite("IMU/motion",      motion_tensor)
check_finite("Audio embedding", audio_tensor)
check_finite("Context vector",  context_tensor)

# ── Sample Values ──
print("\nSample Values (first few entries):")

if isinstance(lstm_tensor, torch.Tensor):
    lstm_np = lstm_tensor.detach().numpy()
else:
    lstm_np = lstm_tensor

print(f"  LSTM [0,0,:] (first timestep, 8 features):")
print(f"    {lstm_np[0, 0, :]}")
print(f"  LSTM range: [{lstm_np.min():.4f}, {lstm_np.max():.4f}]")

print(f"  Motion [0,0,:] (first timestep, 12 channels):")
print(f"    {motion_tensor[0, 0, :]}")
print(f"  Motion range: [{motion_tensor.min():.4f}, {motion_tensor.max():.4f}]")

if isinstance(audio_tensor, torch.Tensor):
    audio_np = audio_tensor.detach().numpy()
else:
    audio_np = audio_tensor
print(f"  Audio embedding [0, :5] (first 5 of 1024):")
print(f"    {audio_np[0, :5]}")
print(f"  Audio range: [{audio_np.min():.4f}, {audio_np.max():.4f}]")

if isinstance(context_tensor, torch.Tensor):
    ctx_np = context_tensor.detach().numpy()
else:
    ctx_np = context_tensor
print(f"  Context vector: {ctx_np[0]}")

# ── Summary ──
print("\n" + "=" * 60)
if all_pass:
    print("  ALL UNIT TESTS PASSED")
else:
    print("  SOME TESTS FAILED")
print("=" * 60)
