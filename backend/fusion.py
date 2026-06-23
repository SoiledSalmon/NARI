import numpy as np

def compute_safety_score(lstm_probs: np.ndarray, tcn_probs: np.ndarray) -> tuple[int, str]:
    """
    Runs rule-based late fusion on biological stress and motion probabilities.

    Parameters:
        lstm_probs (np.ndarray): Probability distribution from LSTM branch of shape (2,) -> [prob_baseline, prob_stress]
        tcn_probs (np.ndarray): Probability distribution from TCN branch of shape (6,) -> [prob_activity_0, ..., prob_activity_5]

    Returns:
        tuple[int, str]: A pair of (safety_score, safety_level):
            - safety_score (int): Range [0, 100], where lower means higher danger.
            - safety_level (str): One of 'safe', 'alert', 'danger'.

    Side Effects:
        None.
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
