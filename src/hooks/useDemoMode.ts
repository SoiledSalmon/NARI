import { useCallback, useRef } from 'react';
import { useSensorStore } from '../stores/sensorStore';
import { StatusSnapshot } from '../data/types';
import { haptic } from '../services/hapticService';

const makeSnapshot = (
  score: number,
  heartRate: number,
  motion: number,
  stress: number,
): StatusSnapshot => {
  const now = Date.now();
  const level = score >= 70 ? 'safe' : score >= 40 ? 'alert' : 'danger';

  return {
    level,
    score,
    timestamp: now,
    connectivity: { gps: true, ble: true, net: true },
    sensors: {
      heartRate: {
        value: heartRate,
        unit: 'BPM',
        label: heartRate > 105 ? 'Racing' : heartRate > 90 ? 'Elevated' : 'Normal',
        status: heartRate > 105 ? 'critical' : heartRate > 90 ? 'elevated' : 'normal',
        trend: Array.from({ length: 24 }, (_, i) => heartRate - 6 + (i % 6)),
        lastUpdated: now,
      },
      motion: {
        value: motion,
        unit: '%',
        label: motion > 75 ? 'Unusual' : motion > 45 ? 'Active' : 'Still',
        status: motion > 75 ? 'critical' : motion > 45 ? 'elevated' : 'normal',
        trend: Array.from({ length: 24 }, (_, i) => motion - 8 + (i % 8)),
        lastUpdated: now,
      },
      audioEnv: {
        value: 42,
        unit: 'dB',
        label: 'Quiet',
        status: 'normal',
        trend: Array.from({ length: 24 }, (_, i) => 35 + (i % 7)),
        lastUpdated: now,
      },
      stress: {
        value: stress,
        unit: '%',
        label: stress > 75 ? 'High' : stress > 40 ? 'Medium' : 'Low',
        status: stress > 75 ? 'critical' : stress > 40 ? 'elevated' : 'normal',
        trend: Array.from({ length: 24 }, (_, i) => stress - 10 + (i % 10)),
        lastUpdated: now,
      },
    },
  };
};

const DEMO_SEQUENCE = [
  makeSnapshot(86, 72, 22, 20),
  makeSnapshot(62, 92, 54, 42),
  makeSnapshot(28, 118, 83, 78),
  makeSnapshot(8, 132, 91, 88),
  makeSnapshot(82, 78, 24, 25),
];

export function useDemoMode() {
  const setStatus = useSensorStore((s) => s.setStatus);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    haptic.success();
    let index = 0;
    setStatus(DEMO_SEQUENCE[index]);

    intervalRef.current = setInterval(() => {
      index += 1;
      if (index >= DEMO_SEQUENCE.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        return;
      }
      setStatus(DEMO_SEQUENCE[index]);
    }, 5000);
  }, [setStatus]);

  return { start };
}
