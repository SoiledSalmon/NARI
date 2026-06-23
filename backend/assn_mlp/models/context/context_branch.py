"""
Dense Context Branch for ASSN Fusion MLP.

Input:  (batch, 6)   — [hour, day_risk, location_risk,
                         hr_baseline, journey_mode, speed]
Output: (batch, 16)  — embedding for fusion MLP

No pre-training needed — weights learned during fusion MLP training.
Safe get_embedding() never crashes even on bad input.
"""

import torch
import torch.nn as nn


class ContextBranch(nn.Module):
    def __init__(
        self,
        input_dim:     int   = 6,
        embedding_dim: int   = 16,
        dropout:       float = 0.2,
    ):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, embedding_dim),
            nn.ReLU(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.encoder(x)

    def get_embedding(self, x: torch.Tensor) -> torch.Tensor:
        """
        Safe embedding extraction.
        Returns neutral zero vector if input is invalid.
        Never crashes — model continues without context if needed.
        """
        try:
            # Replace NaN/Inf with neutral values
            x = torch.nan_to_num(x, nan=0.5, posinf=1.0, neginf=0.0)
            # Clamp to valid feature range
            x = torch.clamp(x, 0.0, 1.0)
            return self.encoder(x)
        except Exception:
            # Return neutral embedding — fusion MLP still runs
            batch_size = x.shape[0] if x.dim() > 0 else 1
            return torch.zeros(batch_size, 16)


def build_context_tensor(feature_list: list) -> torch.Tensor:
    """
    Convert a Python list of 6 floats to a PyTorch tensor.
    Handles None values by replacing with 0.5.

    Args:
        feature_list: output of build_context_vector()

    Returns:
        tensor: (1, 6) float32
    """
    # Replace any None values with neutral 0.5
    safe_features = [
        float(f) if f is not None else 0.5
        for f in feature_list
    ]
    return torch.tensor([safe_features], dtype=torch.float32)


if __name__ == "__main__":
    model  = ContextBranch()
    dummy  = torch.randn(32, 6)
    output = model(dummy)
    print(f"Input:     {dummy.shape}")
    print(f"Output:    {output.shape}")
    params = sum(p.numel() for p in model.parameters())
    print(f"Params:    {params}")
    print("ContextBranch working correctly.")
