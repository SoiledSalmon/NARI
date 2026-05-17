import { create } from 'zustand';
import {
  StatusSnapshot,
  SensorBundle,
  ConnectivityStatus,
  CalibrationState,
  SafetyLevel,
} from '../data/types';

interface SensorState {
  status: StatusSnapshot | null;
  isLoading: boolean;
  error: string | null;

  setStatus: (status: StatusSnapshot) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Derived getters (computed from status)
  getLevel: () => SafetyLevel;
  getScore: () => number;
  getSensors: () => SensorBundle | null;
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
