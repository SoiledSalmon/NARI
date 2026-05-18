import { create } from 'zustand';
import { Alert } from '../data/types';
import { firebaseService } from '../services/firebaseService';

interface AlertState {
  recentAlerts: Alert[];
  allAlerts: Alert[];
  isLoading: boolean;

  setLoading: (loading: boolean) => void;
  initAlertListener: (userId: string) => () => void;
  setRecentAlerts: (alerts: Alert[]) => void;
  setAllAlerts: (alerts: Alert[]) => void;
  removeAlert: (id: string) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  recentAlerts: [],
  allAlerts: [],
  isLoading: false,

  setLoading: (isLoading) => set({ isLoading }),

  initAlertListener: (userId: string) => {
    set({ isLoading: true });
    return firebaseService.subscribeToAlerts(userId, (alerts) => {
      set({
        allAlerts: alerts,
        recentAlerts: alerts.slice(0, 3),
        isLoading: false
      });
    });
  },

  setRecentAlerts: (recentAlerts) => set({ recentAlerts }),
  setAllAlerts: (allAlerts) => set({ allAlerts }),
  removeAlert: (id) => set((state) => ({
    allAlerts: state.allAlerts.filter(a => a.id !== id),
    recentAlerts: state.recentAlerts.filter(a => a.id !== id)
  }))
}));
