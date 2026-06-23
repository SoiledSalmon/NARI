import { create } from 'zustand';
import { DeviceState } from '../data/types';
import { firebaseService } from '../services/firebaseService';
import { useAuthStore } from './authStore';

interface SettingsState {
  device: DeviceState | null;
  language: 'en' | 'kn';
  alertSensitivity: 'low' | 'medium' | 'high';
  silentMode: boolean;
  locationSharing: boolean;
  technicalView: boolean; // Debug/technical information display

  setDevice: (device: DeviceState) => void;
  setLanguage: (lang: 'en' | 'kn') => void;
  setAlertSensitivity: (s: 'low' | 'medium' | 'high') => void;
  setSilentMode: (silent: boolean) => void;
  setLocationSharing: (sharing: boolean) => void;
  setTechnicalView: (view: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  device: null,
  language: 'en',
  alertSensitivity: 'medium',
  silentMode: false,
  locationSharing: true,
  technicalView: false,

  setDevice: (device) => set({ device }),
  
  setLanguage: (language) => {
    set({ language });
    const user = useAuthStore.getState().user;
    if (user?.id) firebaseService.updateUserProfile(user.id, { language });
  },
  
  setAlertSensitivity: (alertSensitivity) => {
    set({ alertSensitivity });
    const user = useAuthStore.getState().user;
    if (user?.id) {
      firebaseService.updateUserProfile(user.id, { alertSensitivity });
    }
  },
  
  setSilentMode: (silentMode) => {
    set({ silentMode });
    const user = useAuthStore.getState().user;
    if (user?.id) {
      firebaseService.updateUserProfile(user.id, { silentMode });
    }
  },
  
  setLocationSharing: (locationSharing) => {
    set({ locationSharing });
    const user = useAuthStore.getState().user;
    if (user?.id) {
      firebaseService.updateUserProfile(user.id, { locationSharing });
    }
  },

  setTechnicalView: (technicalView) => set({ technicalView }),
}));
