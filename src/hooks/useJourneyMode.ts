/**
 * useJourneyMode — Hook managing live walk / journey tracking.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useJourneyStore } from '../stores/journeyStore';
import { dataProvider } from '../../dataConfig';
import { haptic } from '../services/hapticService';

export function useJourneyMode() {
  const store = useJourneyStore();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(
    (label: string, watchingContacts: string[]) => {
      store.startJourney(label, watchingContacts);
      haptic.success();
    },
    [store],
  );

  const end = useCallback(() => {
    store.endJourney();
    haptic.success();
  }, [store]);

  // Tick elapsed seconds
  useEffect(() => {
    if (store.isActive) {
      tickRef.current = setInterval(() => {
        store.tick();
      }, 1000);

      // Poll location every 10s
      locationRef.current = setInterval(async () => {
        const loc = await dataProvider.getCurrentLocation();
        store.updateLocation(loc);
      }, 10000);

      // Initial location
      dataProvider.getCurrentLocation().then(store.updateLocation);
    }

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (locationRef.current) clearInterval(locationRef.current);
    };
  }, [store.isActive]);

  const formatElapsed = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    ...store,
    start,
    end,
    formattedTime: formatElapsed(store.elapsedSeconds),
  };
}
