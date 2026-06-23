# NARI Cleanup Log

This log documents all files removed, ignored, or refactored during the project cleanup phase.

## Ignored Model Weights and Assets
- Added global rules to `.gitignore` to prevent committing model weights or large binary files:
  - `*.pt` (PyTorch model weights)
  - `*.pth` (PyTorch model weights)
  - `*.ckpt` (PyTorch checkpoints)
  - `*.h5` (Keras/HDF5 models)
  - `*.keras` (Keras models)
  - `*.bin` (Binary model files)
  - `*.onnx` (ONNX model files)
  - `*.pb` (TensorFlow protobuf models)
  - `*.safetensors` (SafeTensors model weights)
  - `*.npz` (NumPy arrays)
  - `*.pkl` (Pickled model files)
  - `*.joblib` (Joblib serialized models)
  - `payload.json` (Sample payload JSON data dumps)

## Deleted / Cleaned Up Files
- `README_NEW.md` (Stale copy of README from previous revision; staged deletion in Git)

## General Hygiene
- Globally ignored all `__pycache__/`, `*.pyc`, and `*.pyo` files across the repository to ensure compiler artifacts are never tracked.
