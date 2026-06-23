import asyncio
from typing import List, Dict, Any, Optional
import numpy as np
import time

class GlobalState:
    def __init__(self):
        self.tcn_buffer = []  # List of [ax, ay, az, gx, gy, gz]
        self.hr_buffer = []   # List of HR values
        self.ibi_buffer = []  # List of IBI values
        self.acc_buffer = []  # List of [ax, ay, az] for SMA calculation
        
        self.lstm_windows = [] # List of feature vectors (each is 8-dim)
        
        self.current_score = 100
        self.current_level = 'safe'
        self.current_user_id: str | None = None  # Track which user's data is being processed
        
        self.tcn_last_latency = 0
        self.lstm_last_latency = 0
        self.tcn_logits = None
        self.lstm_logits = None
        
        # Sensor statuses
        self.last_ingest_time = 0
        
        self.lock = asyncio.Lock()

    async def ingest(self, payload):
        """
        Appends raw sensor readings from an IngestPayload to the rolling queues.

        Parameters:
            payload (IngestPayload): Received sensor payload containing 10 IMU samples, heart rate, and inter-beat interval.

        Side Effects:
            Appends values to `tcn_buffer`, `acc_buffer`, `hr_buffer`, and `ibi_buffer` and updates `last_ingest_time`. Truncates buffers to maintain rolling window limits.
        """
        async with self.lock:
            # 1. Update TCN and ACC buffer
            for sample in payload.imu:
                # TCN wants [ax, ay, az, gx, gy, gz]
                self.tcn_buffer.append([sample.ax, sample.ay, sample.az, sample.gx, sample.gy, sample.gz])
                self.acc_buffer.append([sample.ax, sample.ay, sample.az])
            
            # Keep only latest 160 for TCN
            if len(self.tcn_buffer) > 160:
                self.tcn_buffer = self.tcn_buffer[-160:]
                
            # Keep 60 seconds of ACC data for LSTM (50Hz * 60 = 3000 samples)
            if len(self.acc_buffer) > 3000:
                self.acc_buffer = self.acc_buffer[-3000:]
                
            # 2. Update HR and IBI buffer for LSTM
            self.hr_buffer.append(payload.hr)
            self.ibi_buffer.append(payload.ibi)
            
            # Keep 60 seconds of HR/IBI. Assume we get 1 payload per 0.2s (10 samples @ 50Hz = 0.2s)
            # 60s / 0.2s = 300 payloads
            if len(self.hr_buffer) > 300:
                self.hr_buffer = self.hr_buffer[-300:]
                self.ibi_buffer = self.ibi_buffer[-300:]
                
            self.last_ingest_time = time.time()
            
    async def extract_lstm_feature_window(self) -> Optional[np.ndarray]:
        """
        Extracts mathematical features over a 60-second physiological window.

        Returns:
            np.ndarray or None: An 8-dimensional feature vector containing:
                [mean_hr, rmssd, mean_eda, eda_slope, mean_temp, temp_delta, sma, hr_std]
                or None if buffers are not yet fully populated (less than 300 HR samples or 3000 ACC samples).

        Side Effects:
            None.
        """
        async with self.lock:
            if len(self.hr_buffer) < 300 or len(self.acc_buffer) < 3000:
                return None  # Not enough data for a 60s window
                
            hr_arr = np.array(self.hr_buffer)
            ibi_arr = np.array(self.ibi_buffer)
            acc_arr = np.array(self.acc_buffer)
            
            mean_hr = float(np.mean(hr_arr))
            
            # RMSSD from IBIs (IBI is in ms or s? usually ms, assuming ms)
            if len(ibi_arr) > 1:
                successive_diffs = np.diff(ibi_arr)
                rmssd = float(np.sqrt(np.mean(successive_diffs ** 2)))
            else:
                rmssd = 45.0
                
            # EDA defaults
            mean_eda = 1.5
            eda_slope = 0.0
            
            # TEMP defaults
            mean_temp = 32.0
            temp_delta = 0.0
            
            # ACC SMA
            n = len(acc_arr)
            sma = float((1/n) * np.sum(np.abs(acc_arr[:, 0]) + np.abs(acc_arr[:, 1]) + np.abs(acc_arr[:, 2])))
            
            # HR std
            hr_std = float(np.std(hr_arr))
            
            return np.array([mean_hr, rmssd, mean_eda, eda_slope, mean_temp, temp_delta, sma, hr_std], dtype=np.float32)

    async def update_lstm_windows(self, feature_vector: np.ndarray):
        """
        Appends a physiological feature vector to the rolling LSTM inputs buffer.

        Parameters:
            feature_vector (np.ndarray): The 8-dimensional feature array to append.

        Side Effects:
            Appends `feature_vector` to `lstm_windows` and clips the history to the latest 10 windows.
        """
        async with self.lock:
            self.lstm_windows.append(feature_vector)
            if len(self.lstm_windows) > 10:
                self.lstm_windows = self.lstm_windows[-10:]

    def get_tcn_input(self) -> Optional[np.ndarray]:
        """
        Constructs the inputs array for TCN motion inference.

        Returns:
            np.ndarray or None: NumPy array of shape (160, 6) or None if buffer has fewer than 160 samples.
        """
        if len(self.tcn_buffer) == 160:
            return np.array(self.tcn_buffer, dtype=np.float32)
        return None
        
    def get_lstm_input(self) -> Optional[np.ndarray]:
        """
        Constructs the inputs array for LSTM stress inference.

        Returns:
            np.ndarray or None: NumPy array of shape (10, 8) or None if buffer has fewer than 10 feature windows.
        """
        if len(self.lstm_windows) == 10:
            return np.stack(self.lstm_windows)
        return None

state = GlobalState()
