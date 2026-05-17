import { MapIncident } from '../types';

/**
 * Seeded map incidents for heatmap demo.
 * Source: docs/MOCK_DATA.md — incident cluster seed.
 */
export const MOCK_INCIDENTS: MapIncident[] = [
  {
    id: 'inc-001',
    type: 'Suspicious Activity',
    severity: 'high',
    location: { latitude: 47.6085, longitude: -122.3356 },
    locationLabel: 'Downtown Core',
    description: 'Suspicious activity reported',
    reportedAt: Date.now() - 2 * 60 * 1000, // 2 min ago
    narrativeDetail:
      'Multiple reports of loud noises and erratic behavior near the secondary trail entrance. Area has been flagged for increased monitoring. No immediate threat detected on primary routes.',
  },
  {
    id: 'inc-002',
    type: 'Large Gathering',
    severity: 'moderate',
    location: { latitude: 47.6120, longitude: -122.3280 },
    locationLabel: 'Westside Park',
    description: 'Large gathering, path obstructed',
    reportedAt: Date.now() - 15 * 60 * 1000, // 15 min ago
    narrativeDetail:
      'A large group has gathered near the west entrance, partially blocking the pedestrian pathway. Alternative routes are available via the north gate.',
  },
  {
    id: 'inc-003',
    type: 'Poor Lighting',
    severity: 'low',
    location: { latitude: 47.6050, longitude: -122.3400 },
    locationLabel: 'Waterfront Trail',
    description: 'Streetlight outage reported',
    reportedAt: Date.now() - 45 * 60 * 1000, // 45 min ago
    narrativeDetail:
      'Two consecutive streetlights are reported non-functional along the waterfront trail between markers 14 and 16. City maintenance has been notified.',
  },
  {
    id: 'inc-004',
    type: 'Verbal Harassment',
    severity: 'high',
    location: { latitude: 47.6100, longitude: -122.3310 },
    locationLabel: 'Transit Hub',
    description: 'Verbal harassment reported near bus stop',
    reportedAt: Date.now() - 8 * 60 * 1000, // 8 min ago
    narrativeDetail:
      'A report of verbal harassment near the main transit hub bus stop. Security personnel have been dispatched to the area.',
  },
];
