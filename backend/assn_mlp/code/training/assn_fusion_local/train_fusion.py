"""
train_fusion.py — Train the ASSN Fusion MLP locally.

Uses Keras CNN-BiLSTM for motion branch (Option A).

Usage:
    python train_fusion.py \
        --lstm_path        checkpoints/lstm_best.pt \
        --motion_path      checkpoints/motion_embedding_model.keras \
        --yamnet_path      checkpoints/yamnet_best.pt \
        --motion_proj_path checkpoints/motion_projection.pt

Outputs:
    checkpoints/fusion_best.pt     — fusion MLP weights
    checkpoints/context_best.pt    — context branch weights
    checkpoints/assn_bundle.pt     — complete inference bundle
"""

import os
import argparse
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.metrics import f1_score, classification_report
from sklearn.model_selection import train_test_split

# TensorFlow for Keras motion model
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import tensorflow as tf

from models import (
    LSTMClassifier, YAMNetClassifier,
    ContextBranch, FusionMLP
)


# ── Motion branch wrapper ──────────────────────────────────────────────────

class MotionBranch(nn.Module):
    """
    Wraps the Keras CNN-BiLSTM embedding model with a PyTorch
    projection layer to output 64-dim embeddings for fusion.

    Keras model:    (batch, 200, N_channels) → (batch, 128)
    Projection:     (batch, 128) → (batch, 64)
    """
    def __init__(self, keras_model_path, proj_path=None):
        super().__init__()
        print(f'  Loading Keras motion model: {keras_model_path}')
        full_model = tf.keras.models.load_model(keras_model_path)
        # Extract the 128-dim embedding from the 'dense' layer
        # (the layer before the final Dense(1) classification head)
        self.keras_model = tf.keras.Model(
            inputs=full_model.input,
            outputs=full_model.get_layer('dense').output
        )
        self.keras_model.trainable = False

        self.projection = nn.Sequential(
            nn.Linear(128, 64),
            nn.ReLU()
        )
        if proj_path and os.path.exists(proj_path):
            self.load_state_dict(
                torch.load(proj_path, map_location='cpu'),
                strict=False
            )
            print(f'  Motion projection loaded: {proj_path}')

    def get_embedding(self, x_numpy: np.ndarray) -> torch.Tensor:
        """
        x_numpy: (batch, 200, N_channels) numpy array
        Returns: (batch, 64) torch tensor
        """
        emb_128 = self.keras_model.predict(x_numpy, verbose=0)
        emb_t   = torch.tensor(emb_128, dtype=torch.float32)
        with torch.no_grad():
            return self.projection(emb_t)   # (batch, 64)


# ── Dataset ────────────────────────────────────────────────────────────────

class FusionDataset(Dataset):
    def __init__(self, lstm, tcn, audio, ctx, y):
        self.lstm  = torch.tensor(lstm,  dtype=torch.float32)
        self.tcn   = torch.tensor(tcn,   dtype=torch.float32)
        self.audio = torch.tensor(audio, dtype=torch.float32)
        self.ctx   = torch.tensor(ctx,   dtype=torch.float32)
        self.y     = torch.tensor(y,     dtype=torch.long)

    def __len__(self):
        return len(self.y)

    def __getitem__(self, i):
        return (self.lstm[i], self.tcn[i],
                self.audio[i], self.ctx[i], self.y[i])


# ── Real embedding generator ──────────────────────────────────────────────

def generate_real_embeddings(
    lstm_model, motion_model, yamnet_clf,
    n_samples=15000, seed=42, batch_size=64
):
    """
    Generate synthetic RAW sensor data, pass through frozen encoders
    to collect REAL embeddings, then train the FusionMLP on those.

    This ensures the FusionMLP learns the actual output distribution
    of the base models instead of idealized synthetic embeddings.

    Sensor signal design (research-backed):
    ──────────────────────────────────────
    LSTM (HR/HRV — 10 timesteps × 8 features):
      Safe:     resting HR ~65-75 bpm → normalised ~0.15-0.25
      Ambiguous: elevated HR ~90-110 → normalised ~0.45-0.65
      Distress: panic HR ~120-180   → normalised ~0.70-0.95
      (Ref: Healey & Picard 2005, WESAD Schmid et al. 2018)

    Motion (200 timesteps × 12 channels):
      Safe:     gentle walking/stationary → low magnitude ~0.05-0.20
      Ambiguous: brisk movement/stumble  → moderate ~0.30-0.50
      Distress: violent shaking/fall     → high magnitude ~0.60-0.95
      (Ref: Weiss et al. 2019 smartphone HAR, Micucci et al. 2017)

    Audio (1024-dim YAMNet embedding):
      Safe:     ambient noise / silence  → low activation
      Ambiguous: raised voice / crowd    → moderate activation
      Distress: scream / shout / alarm   → high activation
      (Ref: Laffitte et al. 2019 urban sound, Giannakopoulos 2015)

    Context (6 features: time_of_day, isolation_score,
             crime_risk, hr_baseline_ratio, journey_active, speed_norm):
      Safe:     daytime, populated, low crime, normal HR, low speed
      Ambiguous: evening, moderate isolation, some risk factors
      Distress: late night, isolated, high crime area, elevated HR
    """
    np.random.seed(seed)
    all_emb_lstm, all_emb_motion, all_emb_audio = [], [], []
    all_ctx, all_y = [], []
    n = n_samples // 3

    print(f'  Generating {n_samples:,} samples through frozen encoders...')
    print(f'  (this may take a few minutes for the Keras motion model)')

    for label, count in [(0, n), (1, n), (2, n_samples - 2*n)]:
        for start in range(0, count, batch_size):
            bs = min(batch_size, count - start)

            # ── Generate raw sensor windows per class ──────────
            if label == 0:  # SAFE
                # Calm HR: low, steady signal
                hr_raw = np.random.normal(0.18, 0.08, (bs, 10, 8)).clip(0, 1).astype(np.float32)
                # Stationary / gentle walk
                mot_raw = np.random.normal(0.10, 0.06, (bs, 200, 12)).clip(0, 1).astype(np.float32)
                # Quiet ambient audio embedding
                aud_raw = np.random.normal(0.05, 0.04, (bs, 1024)).clip(0, 1).astype(np.float32)
                # Daytime, populated, low crime
                ctx = np.column_stack([
                    np.random.uniform(0.3, 0.7, bs),   # time_of_day (daytime)
                    np.random.uniform(0.0, 0.25, bs),  # isolation_score (low)
                    np.random.uniform(0.0, 0.20, bs),  # crime_risk (low)
                    np.random.uniform(0.40, 0.55, bs),  # hr_baseline_ratio (~1:1)
                    np.random.choice([0.0], bs),        # journey_active (off)
                    np.random.uniform(0.0, 0.15, bs),  # speed_norm (low)
                ]).astype(np.float32)

            elif label == 1:  # AMBIGUOUS
                # Elevated HR
                hr_raw = np.random.normal(0.50, 0.15, (bs, 10, 8)).clip(0, 1).astype(np.float32)
                # Moderate movement
                mot_raw = np.random.normal(0.40, 0.15, (bs, 200, 12)).clip(0, 1).astype(np.float32)
                # Some raised-voice audio patterns
                aud_raw = np.random.normal(0.30, 0.15, (bs, 1024)).clip(0, 1).astype(np.float32)
                # Evening, moderate isolation
                ctx = np.column_stack([
                    np.random.uniform(0.7, 0.95, bs),  # time_of_day (evening/night)
                    np.random.uniform(0.3, 0.65, bs),  # isolation_score (moderate)
                    np.random.uniform(0.3, 0.60, bs),  # crime_risk (moderate)
                    np.random.uniform(0.55, 0.72, bs),  # hr_baseline_ratio (elevated)
                    np.random.choice([0.0, 1.0], bs),  # journey_active (mixed)
                    np.random.uniform(0.1, 0.40, bs),  # speed_norm (moderate)
                ]).astype(np.float32)

            else:  # DISTRESS
                # Panic HR: high, erratic
                hr_raw = np.random.normal(0.82, 0.10, (bs, 10, 8)).clip(0, 1).astype(np.float32)
                # Violent shaking / fall
                mot_raw = np.random.normal(0.75, 0.12, (bs, 200, 12)).clip(0, 1).astype(np.float32)
                # Scream / shout audio patterns
                aud_raw = np.random.normal(0.70, 0.15, (bs, 1024)).clip(0, 1).astype(np.float32)
                # Late night, isolated, high crime
                ctx = np.column_stack([
                    np.random.uniform(0.0, 0.15, bs),  # time_of_day (late night)
                    np.random.uniform(0.7, 1.0, bs),   # isolation_score (high)
                    np.random.uniform(0.6, 1.0, bs),   # crime_risk (high)
                    np.random.uniform(0.75, 0.95, bs),  # hr_baseline_ratio (very high)
                    np.random.choice([1.0], bs),        # journey_active (on)
                    np.random.uniform(0.0, 0.10, bs),  # speed_norm (stopped / zero)
                ]).astype(np.float32)

            # ── Pass through frozen encoders ───────────────────
            hr_tensor  = torch.tensor(hr_raw)
            aud_tensor = torch.tensor(aud_raw)

            with torch.no_grad():
                emb_l = lstm_model.get_embedding(hr_tensor).numpy()
                emb_a = yamnet_clf.get_embedding(aud_tensor).numpy()
            emb_m = motion_model.get_embedding(mot_raw).numpy()

            all_emb_lstm.append(emb_l)
            all_emb_motion.append(emb_m)
            all_emb_audio.append(emb_a)
            all_ctx.append(ctx)
            all_y.extend([label] * bs)

        class_name = ['safe', 'ambiguous', 'distress'][label]
        print(f'    {class_name}: {count} samples encoded')

    X_l = np.concatenate(all_emb_lstm)
    X_t = np.concatenate(all_emb_motion)
    X_a = np.concatenate(all_emb_audio)
    X_c = np.concatenate(all_ctx)
    y   = np.array(all_y, dtype=np.int64)

    # Shuffle
    idx = np.random.permutation(len(y))
    return X_l[idx], X_t[idx], X_a[idx], X_c[idx], y[idx]


# ── Training ───────────────────────────────────────────────────────────────

def train_epoch(fusion, ctx, loader, optimizer, criterion, device, trainable):
    fusion.train()
    ctx.train()
    loss_sum, correct, total = 0.0, 0, 0

    for l, t, a, c, yb in loader:
        l, t, a, c, yb = (l.to(device), t.to(device),
                           a.to(device), c.to(device), yb.to(device))
        logits = fusion(l, t, a, ctx(c))
        loss   = criterion(logits, yb)

        optimizer.zero_grad()
        loss.backward()
        nn.utils.clip_grad_norm_(trainable, 1.0)
        optimizer.step()

        loss_sum += loss.item() * len(yb)
        correct  += (logits.argmax(1) == yb).sum().item()
        total    += len(yb)

    return loss_sum / total, correct / total


@torch.no_grad()
def evaluate(fusion, ctx, loader, criterion, device):
    fusion.eval()
    ctx.eval()
    loss_sum, correct, total = 0.0, 0, 0
    preds_all, labels_all = [], []

    for l, t, a, c, yb in loader:
        l, t, a, c, yb = (l.to(device), t.to(device),
                           a.to(device), c.to(device), yb.to(device))
        logits = fusion(l, t, a, ctx(c))
        loss_sum += criterion(logits, yb).item() * len(yb)
        p = logits.argmax(1)
        correct += (p == yb).sum().item()
        total   += len(yb)
        preds_all.extend(p.cpu().numpy())
        labels_all.extend(yb.cpu().numpy())

    f1 = f1_score(labels_all, preds_all, average='macro', zero_division=0)
    return loss_sum / total, correct / total, f1, preds_all, labels_all


# ── Main ───────────────────────────────────────────────────────────────────

def main(args):
    device = (
        'cuda' if torch.cuda.is_available()
        else 'mps' if torch.backends.mps.is_available()
        else 'cpu'
    )
    print(f'\nDevice: {device}')
    os.makedirs(args.checkpoint_dir, exist_ok=True)

    # ── Load frozen encoders ───────────────────────────────────
    print('\nLoading pretrained encoders...')

    # LSTM — PyTorch
    lstm_model = LSTMClassifier(
        input_size=8, hidden_size=64, num_layers=2,
        dropout=0.3, embedding_dim=32,
        bidirectional=True, num_classes=2
    )
    lstm_model.load_state_dict(
        torch.load(args.lstm_path, map_location='cpu')
    )
    lstm_model.eval()
    for p in lstm_model.parameters():
        p.requires_grad = False
    print(f'  LSTM loaded:   {args.lstm_path}')

    # Motion — Keras CNN-BiLSTM wrapped in PyTorch projection
    motion_model = MotionBranch(
        keras_model_path = args.motion_path,
        proj_path        = args.motion_proj_path
    )
    motion_model.eval()
    # Only projection layer is potentially trainable
    # Keras model is frozen inside MotionBranch
    for p in motion_model.projection.parameters():
        p.requires_grad = False
    print(f'  Motion loaded: {args.motion_path}')

    # YAMNet — PyTorch
    yamnet_clf = YAMNetClassifier(dropout=0.3)
    yamnet_clf.load_state_dict(
        torch.load(args.yamnet_path, map_location='cpu')
    )
    yamnet_clf.eval()
    for p in yamnet_clf.parameters():
        p.requires_grad = False
    print(f'  YAMNet loaded: {args.yamnet_path}')

    # ── Initialize trainable models ────────────────────────────
    context_model = ContextBranch(input_dim=6, embedding_dim=16).to(device)
    fusion_mlp    = FusionMLP(
        lstm_dim=32, tcn_dim=64,
        audio_dim=32, context_dim=16,
        num_classes=3
    ).to(device)

    trainable = (
        list(fusion_mlp.parameters()) +
        list(context_model.parameters())
    )
    print(f'\nTrainable params: {sum(p.numel() for p in trainable):,}')
    print(f'Frozen:           LSTM + Motion(Keras) + YAMNet')

    # ── Generate embeddings through frozen encoders ──────────────
    print('\nGenerating training data through frozen encoders...')
    X_lstm, X_motion, X_audio, X_ctx, y = generate_real_embeddings(
        lstm_model, motion_model, yamnet_clf,
        n_samples=args.n_samples
    )
    print(f'  Total: {len(y):,}  '
          f'(safe={int(np.sum(y==0)):,}  '
          f'ambig={int(np.sum(y==1)):,}  '
          f'distress={int(np.sum(y==2)):,})')

    # ── Split ──────────────────────────────────────────────────
    idx = np.arange(len(y))
    idx_tmp, idx_test = train_test_split(
        idx, test_size=0.15, stratify=y, random_state=42
    )
    idx_train, idx_val = train_test_split(
        idx_tmp, test_size=0.176,
        stratify=y[idx_tmp], random_state=42
    )

    def make_loader(idx, shuffle):
        ds = FusionDataset(
            X_lstm[idx], X_motion[idx],
            X_audio[idx], X_ctx[idx], y[idx]
        )
        return DataLoader(
            ds, batch_size=args.batch_size,
            shuffle=shuffle, drop_last=shuffle
        )

    train_loader = make_loader(idx_train, True)
    val_loader   = make_loader(idx_val,   False)
    test_loader  = make_loader(idx_test,  False)

    print(f'  Train: {len(idx_train):,}  '
          f'Val: {len(idx_val):,}  '
          f'Test: {len(idx_test):,}')

    # ── Training loop ──────────────────────────────────────────
    optimizer = torch.optim.Adam(
        trainable, lr=args.lr, weight_decay=1e-4
    )
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='max', factor=0.5, patience=5
    )
    criterion = nn.CrossEntropyLoss()

    best_f1, no_imp = 0.0, 0
    print(f'\nTraining for up to {args.epochs} epochs...')
    print('-' * 72)

    for epoch in range(1, args.epochs + 1):
        tr_loss, tr_acc = train_epoch(
            fusion_mlp, context_model,
            train_loader, optimizer, criterion, device, trainable
        )
        vl, va, vf, _, _ = evaluate(
            fusion_mlp, context_model,
            val_loader, criterion, device
        )
        scheduler.step(vf)

        print(f'Epoch {epoch:03d} | '
              f'train loss {tr_loss:.4f} acc {tr_acc:.3f} | '
              f'val loss {vl:.4f} acc {va:.3f} F1 {vf:.3f}')

        if vf > best_f1:
            best_f1, no_imp = vf, 0
            torch.save(fusion_mlp.state_dict(),
                       f'{args.checkpoint_dir}/fusion_best.pt')
            torch.save(context_model.state_dict(),
                       f'{args.checkpoint_dir}/context_best.pt')
            print(f'  --> Best F1: {best_f1:.4f}  (saved)')
        else:
            no_imp += 1
            if no_imp >= args.patience:
                print(f'Early stopping at epoch {epoch}')
                break

    print(f'\nTraining complete. Best F1: {best_f1:.4f}')

    # ── Final evaluation ───────────────────────────────────────
    fusion_mlp.load_state_dict(
        torch.load(f'{args.checkpoint_dir}/fusion_best.pt',
                   map_location=device)
    )
    context_model.load_state_dict(
        torch.load(f'{args.checkpoint_dir}/context_best.pt',
                   map_location=device)
    )
    _, _, _, preds, labels = evaluate(
        fusion_mlp, context_model,
        test_loader, criterion, device
    )

    print('\n' + '=' * 55)
    print('FINAL TEST RESULTS')
    print('=' * 55)
    print(classification_report(
        labels, preds,
        target_names=['Safe', 'Ambiguous', 'Distress'],
        zero_division=0
    ))

    # ── Save inference bundle ──────────────────────────────────
    # Bundle contains PyTorch weights only
    # Keras model is loaded separately at inference time
    bundle = {
        'fusion_mlp':     fusion_mlp.state_dict(),
        'context_branch': context_model.state_dict(),
        'config': {
            'lstm_dim':         32,
            'motion_dim':       64,
            'audio_dim':        32,
            'context_dim':      16,
            'num_classes':      3,
            'classes':          ['safe', 'ambiguous', 'distress'],
            'motion_backend':   'keras',
            'motion_model_file':'motion_embedding_model.keras',
            'motion_proj_file': 'motion_projection.pt',
        }
    }
    bundle_path = f'{args.checkpoint_dir}/assn_bundle.pt'
    torch.save(bundle, bundle_path)

    print(f'\nInference bundle saved: {bundle_path}')
    print('\nNote: Keras motion model is NOT inside the bundle.')
    print('Keep motion_embedding_model.keras alongside assn_bundle.pt')
    print('\nFiles in checkpoint dir:')
    for f in sorted(os.listdir(args.checkpoint_dir)):
        size = os.path.getsize(f'{args.checkpoint_dir}/{f}') / 1024
        print(f'  {f}  ({size:.1f} KB)')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Train ASSN Fusion MLP with Keras motion branch'
    )
    parser.add_argument('--lstm_path',
        type=str, required=True,
        help='Path to lstm_best.pt')
    parser.add_argument('--motion_path',
        type=str, required=True,
        help='Path to motion_embedding_model.keras')
    parser.add_argument('--yamnet_path',
        type=str, required=True,
        help='Path to yamnet_best.pt')
    parser.add_argument('--motion_proj_path',
        type=str, default=None,
        help='Path to motion_projection.pt (optional)')
    parser.add_argument('--checkpoint_dir',
        type=str, default='checkpoints')
    parser.add_argument('--n_samples',
        type=int, default=15000)
    parser.add_argument('--batch_size',
        type=int, default=128)
    parser.add_argument('--epochs',
        type=int, default=60)
    parser.add_argument('--lr',
        type=float, default=1e-3)
    parser.add_argument('--patience',
        type=int, default=15)
    args = parser.parse_args()
    main(args)
