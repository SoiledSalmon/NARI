from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class SensorReading(BaseModel):
    value: float
    unit: str
    label: str
    status: Literal['normal', 'elevated', 'critical']
    trend: List[float]
    lastUpdated: int

class SensorBundle(BaseModel):
    heartRate: SensorReading
    motion: SensorReading
    audioEnv: SensorReading
    stress: SensorReading

class ConnectivityStatus(BaseModel):
    gps: bool
    ble: bool
    net: bool

class StatusSnapshot(BaseModel):
    level: Literal['safe', 'alert', 'danger']
    score: int
    timestamp: int
    sensors: SensorBundle
    connectivity: ConnectivityStatus

class ImuSample(BaseModel):
    ax: float
    ay: float
    az: float
    gx: float
    gy: float
    gz: float

class IngestPayload(BaseModel):
    userId: str
    imu: List[ImuSample]
    hr: float
    ibi: float

class DebugSnapshot(BaseModel):
    lstm_buffer_fill: float # percentage
    tcn_buffer_fill: float # percentage
    lstm_last_latency_ms: int
    tcn_last_latency_ms: int
    lstm_logits: Optional[List[float]] = None
    tcn_logits: Optional[List[float]] = None
    connected: bool

class JourneyStartRequest(BaseModel):
    userId: str
    label: str
    watchingContacts: List[str]

class JourneyEndRequest(BaseModel):
    userId: str

class SosCancelRequest(BaseModel):
    userId: str
