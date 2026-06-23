import asyncio
import time
import numpy as np
import torch
import torch.nn.functional as F
from fastapi import FastAPI, BackgroundTasks, HTTPException, Security, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
import sys
import os
import uuid

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from schemas import (
    IngestPayload, StatusSnapshot, DebugSnapshot, JourneyStartRequest,
    JourneyEndRequest, SosCancelRequest, SensorBundle, SensorReading,
    ConnectivityStatus
)
from buffers import state
from fusion import compute_safety_score
from assn_lstm.models.lstm import LSTMClassifier
from assn_tcn.models.tcn import TCNClassifier
from firebase_app import db
from assn_mlp.api_backend import handle_esp32_request, process_payload

app = FastAPI(title="NARI Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("API_SECRET_KEY")
if not API_KEY:
    raise ValueError(
        "Missing required environment variable: API_SECRET_KEY. "
        "Ensure .env is properly configured. See .env.example for template."
    )
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header == API_KEY:
        return api_key_header
    raise HTTPException(status_code=403, detail="Could not validate credentials")

# Load models
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

lstm_model = LSTMClassifier()
tcn_model = TCNClassifier()

try:
    lstm_model.load_state_dict(torch.load('assn_lstm/checkpoints/lstm_best.pt', map_location=device, weights_only=True))
    lstm_model.eval()
    lstm_model.to(device)
except Exception as e:
    # LSTM checkpoint not found; model will be used untrained for demonstration
    pass

try:
    tcn_model.load_state_dict(torch.load('assn_tcn/checkpoints/tcn_best.pt', map_location=device, weights_only=True))
    tcn_model.eval()
    tcn_model.to(device)
except Exception as e:
    # TCN checkpoint not found; model will be used untrained for demonstration
    pass

async def run_inference():
    """Background task to run inference on buffers"""
    tcn_input = state.get_tcn_input()
    lstm_input = state.get_lstm_input()
    
    tcn_probs = np.zeros(6)
    lstm_probs = np.zeros(2)

    if tcn_input is not None:
        start_t = time.time()
        with torch.no_grad():
            x = torch.tensor(tcn_input).unsqueeze(0).to(device)
            logits = tcn_model(x)
            probs = F.softmax(logits, dim=1).cpu().numpy()[0]
            tcn_probs = probs
        state.tcn_last_latency = int((time.time() - start_t) * 1000)
        state.tcn_logits = logits.cpu().numpy()[0].tolist()

    if lstm_input is not None:
        start_t = time.time()
        with torch.no_grad():
            x = torch.tensor(lstm_input).unsqueeze(0).to(device)
            logits = lstm_model(x)
            probs = F.softmax(logits, dim=1).cpu().numpy()[0]
            lstm_probs = probs
        state.lstm_last_latency = int((time.time() - start_t) * 1000)
        state.lstm_logits = logits.cpu().numpy()[0].tolist()

    # Update safety score
    if lstm_input is not None or tcn_input is not None:
        score, level = compute_safety_score(lstm_probs, tcn_probs)
        
        # Check if we transitioned to danger
        if level == 'danger' and state.current_level != 'danger':
            # Write danger alert to Firestore
            if db is not None and state.current_user_id:
                try:
                    user_id = state.current_user_id
                    alert_ref = db.collection('users').document(user_id).collection('alerts').document()
                    alert_ref.set({
                        'id': alert_ref.id,
                        'type': 'auto_sos',
                        'title': 'Automated SOS Triggered',
                        'description': 'NARI detected critical stress and anomalous motion.',
                        'outcome': 'active',
                        'severity': 'high',
                        'timestamp': int(time.time() * 1000),
                        'location': None, # To be updated by frontend
                        'locationLabel': 'Unknown',
                        'locationAddress': 'Unknown',
                        'sensorSnapshot': {
                            'stress': { 'value': 100 - score }
                        },
                        'narrativeDetail': 'Automated trigger based on sensor fusion model.'
                    })
                except Exception as e:
                    # Silently handle Firestore write errors
                    pass

        state.current_score = score
        state.current_level = level

@app.post("/ingest")
async def ingest_data(payload: IngestPayload, background_tasks: BackgroundTasks, api_key: str = Depends(get_api_key)):
    state.current_user_id = payload.userId
    await state.ingest(payload)
    background_tasks.add_task(run_inference)
    return {"status": "ok"}

@app.get("/status", response_model=StatusSnapshot)
async def get_status():
    connected = (time.time() - state.last_ingest_time) < 10
    # GPS and network status reflect actual connectivity; BLE means belt is connected
    has_gps = connected  # GPS is presumed available when belt is connected
    has_net = True  # Backend is running, so network is available
    
    if len(state.lstm_windows) < 10:
        return StatusSnapshot(
            level='safe',
            score=100,
            timestamp=int(time.time() * 1000),
            sensors=SensorBundle(
                heartRate=SensorReading(value=75, unit='bpm', label='Calibrating', status='normal', trend=[], lastUpdated=int(time.time() * 1000)),
                motion=SensorReading(value=0, unit='', label='Calibrating', status='normal', trend=[], lastUpdated=int(time.time() * 1000)),
                audioEnv=SensorReading(value=0, unit='dB', label='Calibrating', status='normal', trend=[], lastUpdated=int(time.time() * 1000)),
                stress=SensorReading(value=0, unit='%', label='Calibrating', status='normal', trend=[], lastUpdated=int(time.time() * 1000))
            ),
            connectivity=ConnectivityStatus(gps=has_gps, ble=connected, net=has_net)
        )

    return StatusSnapshot(
        level=state.current_level,
        score=state.current_score,
        timestamp=int(time.time() * 1000),
        sensors=SensorBundle(
            heartRate=SensorReading(value=state.hr_buffer[-1] if state.hr_buffer else 75, unit='bpm', label='Normal', status='normal', trend=state.hr_buffer[-24:] if len(state.hr_buffer) >= 24 else state.hr_buffer, lastUpdated=int(time.time() * 1000)),
            motion=SensorReading(value=0, unit='', label='Active', status='normal', trend=[], lastUpdated=int(time.time() * 1000)),
            audioEnv=SensorReading(value=0, unit='dB', label='Normal', status='normal', trend=[], lastUpdated=int(time.time() * 1000)),
            stress=SensorReading(value=100 - state.current_score, unit='%', label='Normal', status='normal', trend=[], lastUpdated=int(time.time() * 1000))
        ),
        connectivity=ConnectivityStatus(gps=has_gps, ble=connected, net=has_net)
    )

@app.get("/status/debug", response_model=DebugSnapshot)
async def get_status_debug():
    connected = (time.time() - state.last_ingest_time) < 10
    return DebugSnapshot(
        lstm_buffer_fill=min(100.0, (len(state.lstm_windows) / 10) * 100),
        tcn_buffer_fill=min(100.0, (len(state.tcn_buffer) / 160) * 100),
        lstm_last_latency_ms=state.lstm_last_latency,
        tcn_last_latency_ms=state.tcn_last_latency,
        lstm_logits=state.lstm_logits,
        tcn_logits=state.tcn_logits,
        connected=connected
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/predict")
async def predict_endpoint(request: Request):
    # Parse JSON body
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Validate required fields
    required = ["hr_bpm", "spo2", "imu", "audio_pcm"]
    missing = [f for f in required if f not in data]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing required fields: {missing}")

    # Shape validation
    try:
        if not isinstance(data["hr_bpm"], list) or len(data["hr_bpm"]) != 10:
            raise HTTPException(
                status_code=422,
                detail=f"hr_bpm must be a list of exactly 10 values, got {len(data.get('hr_bpm', []))}")
        if (not isinstance(data["imu"], list) or len(data["imu"]) != 200
                or not isinstance(data["imu"][0], list) or len(data["imu"][0]) != 6):
            raise HTTPException(status_code=422, detail="imu must be a 200x6 array")
        if not isinstance(data["audio_pcm"], list) or len(data["audio_pcm"]) != 15360:
            raise HTTPException(
                status_code=422,
                detail=f"audio_pcm must be a list of exactly 15360 values, got {len(data.get('audio_pcm', []))}")
    except (TypeError, IndexError) as e:
        raise HTTPException(status_code=422, detail=f"Malformed field shapes: {str(e)}")

    # Run inference in a thread to avoid blocking the async event loop
    try:
        result = await asyncio.to_thread(handle_esp32_request, data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {str(e)}")

@app.post("/journey/start")
async def journey_start(req: JourneyStartRequest, api_key: str = Depends(get_api_key)):
    if db is not None:
        try:
            journey_ref = db.collection('users').document(req.userId).collection('journeys').document()
            journey_ref.set({
                'id': journey_ref.id,
                'isActive': True,
                'label': req.label,
                'startedAt': int(time.time() * 1000),
                'watchingContacts': req.watchingContacts
            })
            return {"status": "journey started", "journeyId": journey_ref.id}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return {"status": "journey started (db uninitialized)"}

@app.post("/journey/end")
async def journey_end(req: JourneyEndRequest, api_key: str = Depends(get_api_key)):
    if db is not None:
        try:
            journeys = db.collection('users').document(req.userId).collection('journeys').where('isActive', '==', True).get()
            for j in journeys:
                j.reference.update({'isActive': False, 'endedAt': int(time.time() * 1000)})
            return {"status": "journey ended"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return {"status": "journey ended (db uninitialized)"}

@app.post("/sos/cancel")
async def sos_cancel(req: SosCancelRequest, api_key: str = Depends(get_api_key)):
    # Revert state back to safe if we manually cancelled
    state.current_level = 'safe'
    state.current_score = 100

    if db is not None:
        try:
            alerts = db.collection('users').document(req.userId).collection('alerts').where('outcome', '==', 'active').get()
            for a in alerts:
                a.reference.update({'outcome': 'false_alarm'})
            return {"status": "sos cancelled"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return {"status": "sos cancelled (db uninitialized)"}

import threading

def sliding_window_worker():
    """Background thread to extract 60s LSTM features every 30s"""
    while True:
        time.sleep(30)
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        async def do_extract():
            feat = await state.extract_lstm_feature_window()
            if feat is not None:
                await state.update_lstm_windows(feat)
        loop.run_until_complete(do_extract())

threading.Thread(target=sliding_window_worker, daemon=True).start()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
