import { create } from 'zustand';
import { DeviceState } from '../data/types';

interface SettingsState {
  device: DeviceState | null;
  language: 'en' | 'kn';
  alertSensitivity: 'low' | 'medium' | 'high';
  silentMode: boolean;
  locationSharing: boolean;

  setDevice: (device: DeviceState) => void;
  setLanguage: (lang: 'en' | 'kn') => void;
  setAlertSensitivity: (s: 'low' | 'medium' | 'high') => void;
  setSilentMode: (silent: boolean) => void;
  setLocationSharing: (sharing: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  device: null,
  language: 'en',
  alertSensitivity: 'medium',
  silentMode: false,
  locationSharing: true,

  setDevice: (device) => set({ device }),
  setLanguage: (language) => set({ language }),
  setAlertSensitivity: (alertSensitivity) => set({ alertSensitivity }),
  setSilentMode: (silentMode) => set({ silentMode }),
  setLocationSharing: (locationSharing) => set({ locationSharing }),
}));
