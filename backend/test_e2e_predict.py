"""
End-to-End Test for /predict Endpoint.
Starts the FastAPI server in the background, sends the payload.json,
verifies the response schema and values, and shuts down the server.
"""
import subprocess
import time
import requests
import json
import os
import sys

print("=" * 60)
print("  E2E TEST: /predict Endpoint Integration")
print("=" * 60)

# Check if payload.json exists at root or in assn_mlp
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
payload_path = os.path.join(root_dir, "payload.json")
if not os.path.exists(payload_path):
    # Fallback to backend/assn_mlp/payload.json
    payload_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assn_mlp", "payload.json")

print(f"Using payload from: {payload_path}")
with open(payload_path, "r") as f:
    payload_data = json.load(f)

# Find venv python and start uvicorn server in a subprocess
python_exe = os.path.join(root_dir, ".venv", "Scripts", "python.exe")
backend_dir = os.path.dirname(os.path.abspath(__file__))

print("\nStarting NARI FastAPI backend server on port 8000...")
# Start server using -m uvicorn main:app
server_process = subprocess.Popen(
    [python_exe, "-m", "uvicorn", "main:app", "--port", "8000"],
    cwd=backend_dir,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# Wait for server to boot (YAMNet and ASSN ML models take some time to load)
print("Waiting for server to initialize and load models (this can take up to 20-30 seconds)...")
booted = False
for i in range(40):
    time.sleep(1.5)
    try:
        r = requests.get("http://127.0.0.1:8000/health", timeout=2)
        if r.status_code == 200:
            print(f"Server is healthy and running after {i*1.5:.1f} seconds.")
            booted = True
            break
    except requests.exceptions.RequestException:
        pass
    print(".", end="", flush=True)

if not booted:
    print("\nServer failed to start in time. Killing process.")
    server_process.kill()
    out, err = server_process.communicate()
    print("STDOUT logs:\n", out)
    print("STDERR logs:\n", err)
    sys.exit(1)

# Now, fire POST request to /predict
url = "http://127.0.0.1:8000/predict"
print(f"\nSending POST request to {url}...")

try:
    start_time = time.time()
    response = requests.post(url, json=payload_data)
    latency = time.time() - start_time
    print(f"Response Status Code: {response.status_code}")
    print(f"Latency: {latency:.3f} seconds")
    
    if response.status_code != 200:
        print("ERROR: Predict endpoint returned non-200 status code!")
        print("Response Text:", response.text)
        sys.exit(1)
        
    result = response.json()
    print("\nFull Response JSON:")
    print(json.dumps(result, indent=2))
    
    # ── VALIDATION CHECKS ──
    print("\nValidating results:")
    all_pass = True
    
    # Check 1: Response contains all 5 expected fields
    expected_fields = ["prediction", "confidence", "safe_prob", "ambiguous_prob", "distress_prob"]
    for field in expected_fields:
        if field in result:
            print(f"  [PASS] Field '{field}' is present.")
        else:
            print(f"  [FAIL] Field '{field}' is missing!")
            all_pass = False
            
    # Check 2: prediction is one of the valid classes
    valid_predictions = ["safe", "ambiguous", "distress"]
    pred = result.get("prediction")
    if pred in valid_predictions:
        print(f"  [PASS] 'prediction' value '{pred}' is valid (one of {valid_predictions}).")
    else:
        print(f"  [FAIL] 'prediction' value '{pred}' is invalid (must be one of {valid_predictions}).")
        all_pass = False
        
    # Check 3: confidence is a float between 0 and 1
    conf = result.get("confidence")
    if isinstance(conf, (int, float)) and 0.0 <= conf <= 1.0:
        print(f"  [PASS] 'confidence' is a float ({conf}) between 0.0 and 1.0.")
    else:
        print(f"  [FAIL] 'confidence' is not a float between 0.0 and 1.0 (got {conf}).")
        all_pass = False
        
    # Check 4: check individual probability values are between 0 and 1
    probs_ok = True
    for field in ["safe_prob", "ambiguous_prob", "distress_prob"]:
        val = result.get(field)
        if not (isinstance(val, (int, float)) and 0.0 <= val <= 1.0):
            probs_ok = False
            print(f"  [FAIL] '{field}' value {val} is not between 0.0 and 1.0.")
    if probs_ok:
        print("  [PASS] All probability fields are floats between 0.0 and 1.0.")
    else:
        all_pass = False
        
    # Check 5: probabilities sum to approximately 1.0 (within 0.01 tolerance)
    p_safe = result.get("safe_prob", 0.0)
    p_ambig = result.get("ambiguous_prob", 0.0)
    p_distress = result.get("distress_prob", 0.0)
    total_prob = p_safe + p_ambig + p_distress
    
    if abs(total_prob - 1.0) <= 0.01:
        print(f"  [PASS] Probabilities sum to {total_prob:.4f} (within 0.01 tolerance of 1.0).")
    else:
        print(f"  [FAIL] Probabilities sum to {total_prob:.4f} (exceeds tolerance of 1.0 ± 0.01)!")
        all_pass = False

    print("\n" + "=" * 60)
    if all_pass:
        print("  ALL E2E VALIDATION CHECKS PASSED [SUCCESS]")
    else:
        print("  SOME E2E VALIDATION CHECKS FAILED [FAILURE]")
    print("=" * 60)

except Exception as e:
    print(f"\nE2E execution failed with exception: {e}")
    sys.exit(1)

finally:
    # Cleanup
    print("\nTerminating FastAPI backend server process...")
    server_process.terminate()
    try:
        server_process.wait(timeout=5)
        print("FastAPI backend server process exited clean.")
    except subprocess.TimeoutExpired:
        print("FastAPI backend server process did not terminate. Killing...")
        server_process.kill()
        print("FastAPI backend server process killed.")
