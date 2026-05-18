import numpy as np

def compute_safety_score(lstm_probs: np.ndarray, tcn_probs: np.ndarray) -> tuple[int, str]:
    """
    Rule-based fusion to produce a safety score (0-100) and level ('safe', 'alert', 'danger').
    
    lstm_probs: [prob_baseline, prob_stress]
    tcn_probs: [prob_activity_0, ..., prob_activity_5]
    """
    score = 100
    
    prob_stress = lstm_probs[1]
    
    if prob_stress > 0.5:
        score -= 40
        
    # Example TCN logic (assume activity 0,1 are stationary, 2,3,4,5 are active)
    # If stationary and high stress -> maybe danger
    # If active and high stress -> maybe just exercise (alert)
    is_stationary = tcn_probs[0] + tcn_probs[1] > 0.5
    
    if prob_stress > 0.7:
        if is_stationary:
            score -= 20
        else:
            score -= 10
            
    # Clip score
    score = max(0, min(100, score))
    
    if score >= 80:
        level = 'safe'
    elif score >= 50:
        level = 'alert'
    else:
        level = 'danger'
        
    return int(score), level
