/**
 * IDataProvider — The abstraction layer between UI and data sources.
 * Source of truth: docs/DATA_LAYER.md
 *
 * All sensor, alert, device, and location data flows through this
 * interface. Components NEVER call hardware/API directly.
 *
 * Swap implementations via dataConfig.ts:
 *   - MockDataProvider  (Phase 2: simulated data, demo mode)
 *   - LiveDataProvider  (Phase 3+: real BLE, Firebase, sensors)
 */

import {
  StatusSnapshot,
  SensorBundle,
  ConnectivityStatus,
  CalibrationState,
  Alert,
  MapIncident,
  DeviceState,
  LocationPoint,
  TrustedContact,
} from '../types';

export interface IDataProvider {
  /* ── Status & Sensors ── */

  /** Subscribe to real-time status updates. Returns unsubscribe function. */
  subscribeToStatus(callback: (snapshot: StatusSnapshot) => void): () => void;

  /** Get the latest status snapshot (one-shot). */
  getLatestStatus(): Promise<StatusSnapshot>;

  /** Get the current sensor bundle. */
  getSensorBundle(): Promise<SensorBundle>;

  /** Get connectivity status for GPS, BLE, NET. */
  getConnectivity(): Promise<ConnectivityStatus>;

  /* ── Calibration ── */

  /** Get the current calibration state of the bangle sensors. */
  getCalibrationState(): Promise<CalibrationState>;

  /* ── Alerts ── */

  /** Get recent alerts (for Home screen). */
  getRecentAlerts(limit?: number): Promise<Alert[]>;

  /** Get all alerts, grouped by month (for Alert History screen). */
  getAllAlerts(): Promise<Alert[]>;

  /** Get a single alert by ID (for Alert Detail screen). */
  getAlertById(id: string): Promise<Alert | null>;

  /** Delete an alert record. */
  deleteAlert(id: string): Promise<void>;

  /* ── Map / Incidents ── */

  /** Get nearby incidents for the heatmap. */
  getNearbyIncidents(
    center: LocationPoint,
    radiusKm: number,
  ): Promise<MapIncident[]>;

  /** Get incident details by ID. */
  getIncidentById(id: string): Promise<MapIncident | null>;

  /* ── Device / Bangle ── */

  /** Get device connection and sensor status. */
  getDeviceState(): Promise<DeviceState>;

  /** Initiate BLE scan for the bangle. Returns discovered device names. */
  scanForDevices(): Promise<string[]>;

  /** Connect to a discovered bangle device by name. */
  connectToDevice(deviceName: string): Promise<boolean>;

  /** Disconnect the currently paired bangle. */
  disconnectDevice(): Promise<void>;

  /* ── Contacts ── */

  /** Get all trusted contacts. */
  getTrustedContacts(): Promise<TrustedContact[]>;

  /* ── Location ── */

  /** Get current device location. */
  getCurrentLocation(): Promise<LocationPoint>;
}
