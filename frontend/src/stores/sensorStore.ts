import { create } from 'zustand';
import {
  StatusSnapshot,
  SensorBundle,
  ConnectivityStatus,
  CalibrationState,
  SafetyLevel,
} from '../data/types';

/**
 * Real-time sensor status and safety score state.
 * Stores the current StatusSnapshot polled from the backend every ~3 seconds.
 * Used by Home, Status, and Map screens to display live metrics.
 */
interface SensorState {
  status: StatusSnapshot | null;
  isLoading: boolean;
  error: string | null;

  /** Update status with new StatusSnapshot from backend */
  setStatus: (status: StatusSnapshot) => void;
  
  /** Set loading state (used during backend /status poll) */
  setLoading: (loading: boolean) => void;
  
  /** Set error message if status fetch failed */
  setError: (error: string | null) => void;

  // Derived getters (computed from status)
  
  /** Get current safety level: 'safe' | 'alert' | 'danger' */
  getLevel: () => SafetyLevel;
  
  /** Get current safety score (0-100) */
  getScore: () => number;
  
  /** Get current sensor readings: HR, motion, audio, connectivity */
  getSensors: () => SensorBundle | null;
  
  /** Get current connectivity status: GPS, BLE, network */
  getConnectivity: () => ConnectivityStatus | null;
}

const DEFAULT_CONNECTIVITY: ConnectivityStatus = {
  gps: false,
  ble: false,
  net: false,
};

export const useSensorStore = create<SensorState>((set, get) => ({
  status: null,
  isLoading: true,
  error: null,

  setStatus: (status) => set({ status, isLoading: false, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),

  getLevel: () => get().status?.level ?? 'safe',
  getScore: () => get().status?.score ?? 0,
  getSensors: () => get().status?.sensors ?? null,
  getConnectivity: () => get().status?.connectivity ?? DEFAULT_CONNECTIVITY,
}));
