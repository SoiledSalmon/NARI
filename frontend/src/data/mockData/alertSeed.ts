import { Alert } from '../types';

/**
 * Seeded alert history for demo / mock mode.
 * Source: docs/MOCK_DATA.md — 3 pre-populated alerts.
 */
export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert-001',
    type: 'manual_sos',
    title: 'Manual SOS Triggered',
    description: 'A manual SOS was triggered via the belt button.',
    outcome: 'resolved',
    severity: 'high',
    timestamp: new Date('2023-10-24T21:45:00').getTime(),
    location: { latitude: 47.6280, longitude: -122.3218 },
    locationLabel: 'Capitol Hill',
    locationAddress: '1420 5th Ave, Seattle, WA',
    sensorSnapshot: null,
    narrativeDetail:
      'Your Nari device detected a manual SOS trigger. Emergency contacts were notified and confirmed your safety within 3 minutes.',
  },
  {
    id: 'alert-002',
    type: 'elevated_hr',
    title: 'Elevated Heart Rate',
    description:
      'Your Nari device detected a sustained elevated heart rate while you were stationary.',
    outcome: 'false_alarm',
    severity: 'moderate',
    timestamp: new Date('2023-10-18T14:20:00').getTime(),
    location: { latitude: 47.6318, longitude: -122.3137 },
    locationLabel: 'Volunteer Park',
    locationAddress: '1247 15th Ave E, Seattle, WA',
    sensorSnapshot: {
      heartRate: {
        value: 118,
        unit: 'BPM',
        label: 'Elevated',
        status: 'elevated',
        trend: [],
        lastUpdated: new Date('2023-10-18T14:20:00').getTime(),
      },
    },
    narrativeDetail:
      'Your Nari device detected a sustained elevated heart rate while you were stationary. An automated check-in was initiated. You marked yourself as "Safe" within 45 seconds.',
  },
  {
    id: 'alert-003',
    type: 'gps_lost',
    title: 'GPS Signal Lost',
    description: 'GPS signal was lost for an extended period.',
    outcome: 'resolved',
    severity: 'low',
    timestamp: new Date('2023-09-05T08:15:00').getTime(),
    location: null,
    locationLabel: 'Unknown',
    locationAddress: '',
    sensorSnapshot: null,
    narrativeDetail:
      'GPS connectivity was lost for approximately 12 minutes while in a parking structure. Signal was automatically restored upon exiting.',
  },
];
