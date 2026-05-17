import { create } from 'zustand';
import { JourneyState, LocationPoint } from '../data/types';

interface JourneyStore extends JourneyState {
  startJourney: (label: string, watchingContacts: string[]) => void;
  endJourney: () => void;
  updateLocation: (location: LocationPoint) => void;
  tick: () => void; // Called every second to increment elapsed
}

export const useJourneyStore = create<JourneyStore>((set, get) => ({
  isActive: false,
  label: '',
  startedAt: null,
  elapsedSeconds: 0,
  watchingContacts: [],
  currentLocation: null,

  startJourney: (label, watchingContacts) =>
    set({
      isActive: true,
      label,
      startedAt: Date.now(),
      elapsedSeconds: 0,
      watchingContacts,
    }),

  endJourney: () =>
    set({
      isActive: false,
      label: '',
      startedAt: null,
      elapsedSeconds: 0,
      watchingContacts: [],
      currentLocation: null,
    }),

  updateLocation: (currentLocation) => set({ currentLocation }),

  tick: () => {
    const { isActive, elapsedSeconds } = get();
    if (isActive) {
      set({ elapsedSeconds: elapsedSeconds + 1 });
    }
  },
}));
