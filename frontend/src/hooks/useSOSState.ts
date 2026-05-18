/**
 * useSOSState — Hook managing the SOS state machine.
 * idle → countdown → active → resolved
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { SOSPhase, ContactNotification } from '../data/types';
import { haptic } from '../services/hapticService';

const COUNTDOWN_SECONDS = 10;

const INITIAL_NOTIFICATIONS: ContactNotification[] = [
  { id: 'grp-1', label: 'Emergency Contacts', status: 'pending', count: 3 },
  { id: 'grp-2', label: 'Local Authorities', status: 'pending' },
  { id: 'grp-3', label: 'Campus Security', status: 'pending' },
];

export function useSOSState() {
  const [phase, setPhase] = useState<SOSPhase>('idle');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isSilent, setIsSilent] = useState(false);
  const [notifications, setNotifications] =
    useState<ContactNotification[]>(INITIAL_NOTIFICATIONS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start countdown
  const initiateSOS = useCallback((silent = false) => {
    setIsSilent(silent);
    setPhase('countdown');
    setCountdown(COUNTDOWN_SECONDS);
    haptic.warning();
  }, []);

  // Cancel during countdown
  const cancelSOS = useCallback(() => {
    setPhase('idle');
    setCountdown(COUNTDOWN_SECONDS);
    if (intervalRef.current) clearInterval(intervalRef.current);
    haptic.success();
  }, []);

  // Activate SOS (countdown hit 0)
  const activateSOS = useCallback(() => {
    setPhase('active');
    haptic.heavy();

    // Simulate rolling contact notifications
    setNotifications(INITIAL_NOTIFICATIONS);
    setTimeout(() => {
      setNotifications((prev) =>
        prev.map((n, i) => (i === 0 ? { ...n, status: 'sent' as const } : n)),
      );
    }, 1500);
    setTimeout(() => {
      setNotifications((prev) =>
        prev.map((n, i) =>
          i <= 1 ? { ...n, status: 'sent' as const } : n,
        ),
      );
    }, 3500);
    setTimeout(() => {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'sent' as const })),
      );
    }, 5000);
  }, []);

  // Mark as false alarm / resolved
  const resolveSOS = useCallback(() => {
    setPhase('idle');
    setCountdown(COUNTDOWN_SECONDS);
    setNotifications(INITIAL_NOTIFICATIONS);
    haptic.success();
  }, []);

  // Countdown tick
  useEffect(() => {
    if (phase === 'countdown') {
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            activateSOS();
            return 0;
          }
          haptic.light();
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [phase, activateSOS]);

  return {
    phase,
    countdown,
    isSilent,
    notifications,
    initiateSOS,
    cancelSOS,
    activateSOS,
    resolveSOS,
  };
}
