"""
models.py — All ASSN model class definitions.
Import from this file in main.py and inference.py.
"""

import torch
import torch.nn as nn
from torch.nn.utils import weight_norm


# ── LSTM Branch ────────────────────────────────────────────────────────────

class LSTMEncoder(nn.Module):
    def __init__(self, input_size=8, hidden_size=64, num_layers=2,
                 dropout=0.3, embedding_dim=32, bidirectional=True):
        super().__init__()
        self.directions = 2 if bidirectional else 1
        self.lstm = nn.LSTM(
            input_size=input_size, hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout if num_layers > 1 else 0.0,
            bidirectional=bidirectional, batch_first=True
        )
        self.dropout    = nn.Dropout(dropout)
        self.layer_norm = nn.LayerNorm(hidden_size * self.directions)
        self.projection = nn.Sequential(
            nn.Linear(hidden_size * self.directions, embedding_dim),
            nn.ReLU()
        )

    def forward(self, x):
        out, _ = self.lstm(x)
        last    = self.layer_norm(out[:, -1, :])
        return self.projection(self.dropout(last))   # (batch, 32)


class LSTMClassifier(nn.Module):
    def __init__(self, input_size=8, hidden_size=64, num_layers=2,
                 dropout=0.3, embedding_dim=32,
                 bidirectional=True, num_classes=2):
        super().__init__()
        self.encoder = LSTMEncoder(
            input_size, hidden_size, num_layers,
            dropout, embedding_dim, bidirectional
        )
        self.classifier = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(embedding_dim, 16), nn.ReLU(),
            nn.Linear(16, num_classes)
        )

    def forward(self, x):
        return self.classifier(self.encoder(x))

    def get_embedding(self, x):
        return self.encoder(x)   # (batch, 32)


# ── TCN Branch ─────────────────────────────────────────────────────────────

class CausalConv1d(nn.Module):
    def __init__(self, in_ch, out_ch, kernel_size, dilation):
        super().__init__()
        self.padding = (kernel_size - 1) * dilation
        self.conv    = weight_norm(
            nn.Conv1d(in_ch, out_ch, kernel_size=kernel_size,
                      padding=self.padding, dilation=dilation)
        )

    def forward(self, x):
        out = self.conv(x)
        return out[:, :, :-self.padding] if self.padding > 0 else out


class TCNResidualBlock(nn.Module):
    def __init__(self, in_ch, out_ch, kernel_size, dilation, dropout=0.2):
        super().__init__()
        self.conv1 = CausalConv1d(in_ch,  out_ch, kernel_size, dilation)
        self.conv2 = CausalConv1d(out_ch, out_ch, kernel_size, dilation)
        self.relu  = nn.ReLU()
        self.drop  = nn.Dropout(dropout)
        self.skip  = nn.Conv1d(in_ch, out_ch, 1) if in_ch != out_ch else None
        self.conv1.conv.weight.data.normal_(0, 0.01)
        self.conv2.conv.weight.data.normal_(0, 0.01)

    def forward(self, x):
        res = self.skip(x) if self.skip else x
        out = self.drop(self.relu(self.conv1(x)))
        out = self.drop(self.relu(self.conv2(out)))
        return self.relu(out + res)


class TCNEncoder(nn.Module):
    def __init__(self, input_channels=6, num_channels=[32,32,64,64],
                 kernel_size=5, dropout=0.2, embedding_dim=64):
        super().__init__()
        layers, in_ch = [], input_channels
        for i, out_ch in enumerate(num_channels):
            layers.append(
                TCNResidualBlock(in_ch, out_ch, kernel_size, 2**i, dropout)
            )
            in_ch = out_ch
        self.network    = nn.Sequential(*layers)
        self.pool       = nn.AdaptiveAvgPool1d(1)
        self.projection = nn.Linear(num_channels[-1], embedding_dim)
        self.relu       = nn.ReLU()

    def forward(self, x):
        x   = x.permute(0, 2, 1)
        out = self.network(x)
        out = self.pool(out).squeeze(-1)
        return self.relu(self.projection(out))   # (batch, 64)


class TCNClassifier(nn.Module):
    def __init__(self, input_channels=6, num_channels=[32,32,64,64],
                 kernel_size=5, dropout=0.2,
                 embedding_dim=64, num_classes=2):
        super().__init__()
        self.encoder = TCNEncoder(
            input_channels, num_channels,
            kernel_size, dropout, embedding_dim
        )
        self.classifier = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(embedding_dim, 32), nn.ReLU(),
            nn.Linear(32, num_classes)
        )

    def forward(self, x):
        return self.classifier(self.encoder(x))

    def get_embedding(self, x):
        return self.encoder(x)   # (batch, 64)


# ── YAMNet Branch ──────────────────────────────────────────────────────────

class YAMNetClassifier(nn.Module):
    def __init__(self, input_dim=1024, embedding_dim=32,
                 num_classes=2, dropout=0.3):
        super().__init__()
        self.attention = nn.Sequential(
            nn.Linear(input_dim, input_dim),
            nn.Sigmoid()
        )
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 512), nn.BatchNorm1d(512),
            nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(512, 128), nn.BatchNorm1d(128),
            nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(128, embedding_dim)
        )
        self.classifier = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(embedding_dim, num_classes)
        )

    def forward(self, x):
        attn = self.attention(x)
        return self.classifier(self.encoder(x * attn))

    def get_embedding(self, x):
        attn = self.attention(x)
        return self.encoder(x * attn)   # (batch, 32)


# ── Context Branch ─────────────────────────────────────────────────────────

class ContextBranch(nn.Module):
    def __init__(self, input_dim=6, embedding_dim=16, dropout=0.2):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 32), nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, embedding_dim), nn.ReLU()
        )

    def forward(self, x):
        return self.encoder(x)   # (batch, 16)

    def get_embedding(self, x):
        return self.encoder(x)


# ── Fusion MLP ─────────────────────────────────────────────────────────────

class FusionMLP(nn.Module):
    """
    Late fusion model for ASSN.

    Input:  concatenation of all 4 branch embeddings
            32 (LSTM) + 64 (TCN) + 32 (audio) + 16 (context) = 144-dim

    Output: 3-class logits
            0 = Safe
            1 = Ambiguous  (haptic prompt + 10s confirm window)
            2 = Distress   (SOS chain fires)
    """
    def __init__(self, lstm_dim=32, tcn_dim=64, audio_dim=32,
                 context_dim=16, hidden_dim=128,
                 num_classes=3, dropout=0.3):
        super().__init__()
        fusion_dim = lstm_dim + tcn_dim + audio_dim + context_dim  # 144

        self.fusion = nn.Sequential(
            nn.Linear(fusion_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(hidden_dim, 64),
            nn.BatchNorm1d(64), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(64, num_classes)
        )

    def forward(self, emb_lstm, emb_tcn, emb_audio, emb_context):
        fused = torch.cat(
            [emb_lstm, emb_tcn, emb_audio, emb_context], dim=1
        )   # (batch, 144)
        return self.fusion(fused)   # (batch, 3)
