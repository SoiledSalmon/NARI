import torch
import torch.nn as nn
import numpy as np
import librosa
import sounddevice as sd
import soundfile as sf
import os

# ── Model definition (same as notebook) ───────────────────────────────────
class YAMNetClassifier(nn.Module):
    def __init__(self, input_dim=1024, embedding_dim=32,
                 num_classes=2, dropout=0.3):
        super().__init__()

        # Attention gate — learns which of the 1024 YAMNet features
        # matter for distress detection
        self.attention = nn.Sequential(
            nn.Linear(input_dim, input_dim),
            nn.Sigmoid(),
        )

        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(512, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, embedding_dim),
            nn.ReLU(),
        )

        self.classifier = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(embedding_dim, num_classes),
        )

    def forward(self, x):
        # Apply attention gate first
        attn   = self.attention(x)
        x_attn = x * attn              # element-wise gating
        return self.classifier(self.encoder(x_attn))

    def get_embedding(self, x):
        attn   = self.attention(x)
        x_attn = x * attn
        return self.encoder(x_attn)


# ── Load YAMNet locally ────────────────────────────────────────────────────
# YAMNet needs TensorFlow — install it locally too
# pip install tensorflow tensorflow_hub
import tensorflow as tf
import tensorflow_hub as hub

print('Loading YAMNet...')
yamnet_model = hub.load('https://tfhub.dev/google/yamnet/1')
print('YAMNet loaded.')


# ── Load your trained classifier ───────────────────────────────────────────
model = YAMNetClassifier(dropout=0.3)
BASE = os.path.dirname(os.path.abspath(__file__))
yamnet_path = os.path.join(BASE, 'models', 'yamnet', 'yamnet_best.pt')
model.load_state_dict(torch.load(yamnet_path, map_location='cpu'))
model.eval()
print('Classifier loaded.')


# ── Audio functions ────────────────────────────────────────────────────────
def record_audio(duration=4.0, sr=16000):
    """Record from microphone for `duration` seconds."""
    print(f'\nRecording for {duration} seconds... speak now!')
    audio = sd.rec(int(duration * sr), samplerate=sr,
                   channels=1, dtype='float32')
    sd.wait()
    print('Recording done.')
    return audio.flatten()


def load_audio_file(fpath, sr=16000, duration=4.0):
    """Load an existing audio file."""
    waveform, _ = librosa.load(fpath, sr=sr, mono=True)
    target_len  = int(sr * duration)
    if len(waveform) >= target_len:
        waveform = waveform[:target_len]
    else:
        waveform = np.pad(waveform, (0, target_len - len(waveform)))
    mx = np.max(np.abs(waveform))
    if mx > 0:
        waveform = waveform / mx
    return waveform.astype(np.float32)


def predict(waveform, threshold=0.55):
    """Run full inference pipeline on a waveform."""
    # Step 1 — YAMNet embedding
    scores, embeddings, _ = yamnet_model(waveform)
    emb_1024 = tf.reduce_mean(embeddings, axis=0).numpy()  # (1024,)

    # Step 2 — classifier
    x     = torch.tensor(emb_1024, dtype=torch.float32).unsqueeze(0)  # (1, 1024)
    with torch.no_grad():
        logits = model(x)
        probs  = torch.softmax(logits, dim=1)

    distress_prob = float(probs[0, 1])
    prediction    = 'DISTRESS' if distress_prob > threshold else 'safe'

    return distress_prob, prediction


# ── Main test loop ─────────────────────────────────────────────────────────
THRESHOLD = 0.55

print('\n' + '='*50)
print('ASSN Audio Branch — Voice Test')
print('='*50)
print('Commands:')
print('  r  — record from microphone (4 seconds)')
print('  f  — load from audio file')
print('  q  — quit')

while True:
    cmd = input('\nCommand (r/f/q): ').strip().lower()

    if cmd == 'q':
        break

    elif cmd == 'r':
        waveform = record_audio(duration=4.0)
        # Save recording for reference
        sf.write('last_recording.wav', waveform, 16000)
        print('Saved as last_recording.wav')

    elif cmd == 'f':
        fpath = input('File path: ').strip()
        if not os.path.exists(fpath):
            print(f'File not found: {fpath}')
            continue
        waveform = load_audio_file(fpath)

    else:
        print('Unknown command.')
        continue

    # Run prediction
    prob, result = predict(waveform, threshold=THRESHOLD)

    print()
    print('─' * 40)
    print(f'Distress probability: {prob:.3f}')
    print(f'Threshold:            {THRESHOLD}')
    print(f'Result:               {result}')
    print('─' * 40)

    if result == 'DISTRESS':
        print('⚠️  DISTRESS DETECTED')
    else:
        print('✓  Safe — no distress detected')