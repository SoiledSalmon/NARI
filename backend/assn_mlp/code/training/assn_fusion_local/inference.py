"""
inference.py — Run the complete ASSN fusion pipeline.

Usage:
    python inference.py \
        --lstm_path   checkpoints/lstm_best.pt \
        --motion_path checkpoints/motion_embedding_model.keras \
        --yamnet_path checkpoints/yamnet_best.pt \
        --bundle_path checkpoints/assn_bundle.pt
"""

import argparse
import os
import torch
import torch.nn as nn
import numpy as np

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import tensorflow as tf

from models import (
    LSTMClassifier, YAMNetClassifier,
    ContextBranch, FusionMLP
)

CLASS_NAMES  = ['safe', 'ambiguous', 'distress']
CLASS_EMOJIS = ['✅', '⚠️', '🚨']


class MotionBranch(nn.Module):
    def __init__(self, keras_model_path):
        super().__init__()
        full_model = tf.keras.models.load_model(keras_model_path)
        # Extract the 128-dim embedding from the 'dense' layer
        # (the layer before the final Dense(1) classification head)
        self.keras_model = tf.keras.Model(
            inputs=full_model.input,
            outputs=full_model.get_layer('dense').output
        )
        self.keras_model.trainable = False
        self.projection = nn.Sequential(
            nn.Linear(128, 64), nn.ReLU()
        )

    def get_embedding(self, x_numpy):
        emb_128 = self.keras_model.predict(x_numpy, verbose=0)
        emb_t   = torch.tensor(emb_128, dtype=torch.float32)
        with torch.no_grad():
            return self.projection(emb_t)


def load_all_models(args):
    # LSTM
    lstm_model = LSTMClassifier(
        input_size=8, hidden_size=64, num_layers=2,
        dropout=0.3, embedding_dim=32,
        bidirectional=True, num_classes=2
    )
    lstm_model.load_state_dict(
        torch.load(args.lstm_path, map_location='cpu')
    )
    lstm_model.eval()

    # Motion (Keras)
    motion_model = MotionBranch(args.motion_path)
    motion_model.eval()

    # YAMNet
    yamnet_clf = YAMNetClassifier(dropout=0.3)
    yamnet_clf.load_state_dict(
        torch.load(args.yamnet_path, map_location='cpu')
    )
    yamnet_clf.eval()

    # Fusion bundle
    bundle        = torch.load(args.bundle_path, map_location='cpu')
    fusion_mlp    = FusionMLP(lstm_dim=32, tcn_dim=64,
                               audio_dim=32, context_dim=16, num_classes=3)
    context_model = ContextBranch()
    fusion_mlp.load_state_dict(bundle['fusion_mlp'])
    context_model.load_state_dict(bundle['context_branch'])
    fusion_mlp.eval()
    context_model.eval()

    print('All models loaded.')
    return lstm_model, motion_model, yamnet_clf, context_model, fusion_mlp


@torch.no_grad()
def predict(lstm_model, motion_model, yamnet_clf,
            context_model, fusion_mlp,
            lstm_window,      # (1, 10, 8)   — HR feature sequence
            motion_window,    # numpy (1, 200, N_ch) — raw motion window
            audio_embedding,  # (1, 1024)    — YAMNet embedding
            context_vector,   # (1, 6)       — context features
            ) -> dict:

    emb_lstm    = lstm_model.get_embedding(lstm_window)
    emb_motion  = motion_model.get_embedding(motion_window)   # numpy in, tensor out
    emb_audio   = yamnet_clf.get_embedding(audio_embedding)
    emb_context = context_model(context_vector)

    logits = fusion_mlp(emb_lstm, emb_motion, emb_audio, emb_context)
    probs  = torch.softmax(logits, dim=1)[0]
    idx    = probs.argmax().item()

    return {
        'prediction':    CLASS_NAMES[idx],
        'confidence':    float(probs[idx]),
        'safe_prob':     float(probs[0]),
        'ambiguous_prob':float(probs[1]),
        'distress_prob': float(probs[2]),
    }


def print_result(result):
    emoji = CLASS_EMOJIS[CLASS_NAMES.index(result['prediction'])]
    print(f'\n{emoji}  Prediction:  {result["prediction"].upper()}')
    print(f'   Confidence:  {result["confidence"]:.3f}')
    print(f'   Safe:        {result["safe_prob"]:.3f}')
    print(f'   Ambiguous:   {result["ambiguous_prob"]:.3f}')
    print(f'   Distress:    {result["distress_prob"]:.3f}')


def main(args):
    print('Loading models...')
    lstm_model, motion_model, yamnet_clf, context_model, fusion_mlp = \
        load_all_models(args)

    # Motion window shape depends on your Keras model input
    # Default: (1, 200, 12) — 200 timesteps, 12 channels (6 raw + 6 engineered)
    N_MOTION_CH = 12

    print('\n' + '='*55)
    print('ASSN Inference Test')
    print('='*55)

    np.random.seed(123)  # reproducible demo

    # Scenario 1: Safe — resting HR, stationary, quiet, daytime
    print('\nScenario 1: Safe — daytime, calm HR, no motion burst')
    r = predict(
        lstm_model, motion_model, yamnet_clf, context_model, fusion_mlp,
        lstm_window     = torch.tensor(np.random.normal(0.18, 0.08, (1, 10, 8)).clip(0, 1), dtype=torch.float32),
        motion_window   = np.random.normal(0.10, 0.06, (1, 200, N_MOTION_CH)).clip(0, 1).astype(np.float32),
        audio_embedding = torch.tensor(np.random.normal(0.05, 0.04, (1, 1024)).clip(0, 1), dtype=torch.float32),
        context_vector  = torch.tensor([[0.5, 0.1, 0.1, 0.47, 0.0, 0.05]])
    )
    print_result(r)

    # Scenario 2: Ambiguous — elevated HR, moderate motion, evening
    print('\nScenario 2: Ambiguous — elevated HR, moderate motion')
    r = predict(
        lstm_model, motion_model, yamnet_clf, context_model, fusion_mlp,
        lstm_window     = torch.tensor(np.random.normal(0.50, 0.15, (1, 10, 8)).clip(0, 1), dtype=torch.float32),
        motion_window   = np.random.normal(0.40, 0.15, (1, 200, N_MOTION_CH)).clip(0, 1).astype(np.float32),
        audio_embedding = torch.tensor(np.random.normal(0.30, 0.15, (1, 1024)).clip(0, 1), dtype=torch.float32),
        context_vector  = torch.tensor([[0.85, 0.50, 0.45, 0.63, 1.0, 0.25]])
    )
    print_result(r)

    # Scenario 3: Distress — panic HR, violent motion, screaming, late night
    print('\nScenario 3: Distress — all signals elevated')
    r = predict(
        lstm_model, motion_model, yamnet_clf, context_model, fusion_mlp,
        lstm_window     = torch.tensor(np.random.normal(0.82, 0.10, (1, 10, 8)).clip(0, 1), dtype=torch.float32),
        motion_window   = np.random.normal(0.75, 0.12, (1, 200, N_MOTION_CH)).clip(0, 1).astype(np.float32),
        audio_embedding = torch.tensor(np.random.normal(0.70, 0.15, (1, 1024)).clip(0, 1), dtype=torch.float32),
        context_vector  = torch.tensor([[0.05, 0.85, 0.80, 0.88, 1.0, 0.05]])
    )
    print_result(r)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--lstm_path',   type=str, required=True)
    parser.add_argument('--motion_path', type=str, required=True,
                        help='Path to motion_embedding_model.keras')
    parser.add_argument('--yamnet_path', type=str, required=True)
    parser.add_argument('--bundle_path', type=str, required=True)
    args = parser.parse_args()
    main(args)
