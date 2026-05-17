/**
 * useSensorData — Hook that subscribes to the data provider and pipes
 * status snapshots into the Zustand sensor store.
 *
 * Use in any component that needs live sensor data.
 */

import { useEffect } from 'react';
import { useSensorStore } from '../stores/sensorStore';
import { useAlertStore } from '../stores/alertStore';
import { dataProvider } from '../../dataConfig';

export function useSensorData() {
  const setStatus = useSensorStore((s) => s.setStatus);
  const setError = useSensorStore((s) => s.setError);

  useEffect(() => {
    try {
      const unsubscribe = dataProvider.subscribeToStatus(setStatus);
      return unsubscribe;
    } catch (err) {
      setError('Failed to subscribe to sensor data');
    }
  }, [setStatus, setError]);

  return useSensorStore();
}

/** Load recent alerts into the alert store */
export function useAlertData(limit = 3) {
  const { setRecentAlerts, setAllAlerts, setLoading } = useAlertStore();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dataProvider.getRecentAlerts(limit),
      dataProvider.getAllAlerts(),
    ])
      .then(([recent, all]) => {
        setRecentAlerts(recent);
        setAllAlerts(all);
      })
      .finally(() => setLoading(false));
  }, [limit, setRecentAlerts, setAllAlerts, setLoading]);

  return useAlertStore();
}
