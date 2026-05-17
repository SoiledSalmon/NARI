import { create } from 'zustand';
import { Alert } from '../data/types';

interface AlertState {
  recentAlerts: Alert[];
  allAlerts: Alert[];
  isLoading: boolean;

  setRecentAlerts: (alerts: Alert[]) => void;
  setAllAlerts: (alerts: Alert[]) => void;
  removeAlert: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  recentAlerts: [],
  allAlerts: [],
  isLoading: false,

  setRecentAlerts: (recentAlerts) => set({ recentAlerts }),
  setAllAlerts: (allAlerts) => set({ allAlerts }),

  removeAlert: (id) => {
    const { allAlerts, recentAlerts } = get();
    set({
      allAlerts: allAlerts.filter((a) => a.id !== id),
      recentAlerts: recentAlerts.filter((a) => a.id !== id),
    });
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
