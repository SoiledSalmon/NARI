/**
 * MockDataProvider — Simulated data for Phase 2 development.
 * Source of truth: docs/MOCK_DATA.md
 *
 * Generates realistic sensor values using sine-wave oscillation,
 * seeds 3 heatmap incidents, and provides the demo mode script hooks.
 */

import { IDataProvider } from './DataProvider';
import {
  StatusSnapshot,
  SensorBundle,
  SensorReading,
  ConnectivityStatus,
  CalibrationState,
  Alert,
  MapIncident,
  DeviceState,
  LocationPoint,
  TrustedContact,
  SafetyLevel,
} from '../types';
import { MOCK_ALERTS } from '../mockData/alertSeed';
import { MOCK_INCIDENTS } from '../mockData/incidentSeed';
import { MOCK_CONTACTS } from '../mockData/contactSeed';

/* ── Helpers ── */

/** Oscillating value centered at `base` with amplitude `amp` and period `periodMs` */
function oscillate(base: number, amp: number, periodMs: number): number {
  const t = Date.now() / periodMs;
  return base + amp * Math.sin(2 * Math.PI * t);
}

/** Clamp a value between min and max */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/** Generate a 24-point trend array (each point = 1 hour) */
function generateTrend(base: number, variance: number): number[] {
  return Array.from({ length: 24 }, (_, i) => {
    const noise = (Math.random() - 0.5) * variance;
    const wave = Math.sin((i / 24) * Math.PI * 2) * (variance * 0.5);
    return Math.round(base + wave + noise);
  });
}

/** Determine safety level from composite score */
function scoreToLevel(score: number): SafetyLevel {
  if (score >= 70) return 'safe';
  if (score >= 40) return 'alert';
  return 'danger';
}

/* ── Mock Provider ── */

export class MockDataProvider implements IDataProvider {
  private statusListeners: Array<(snapshot: StatusSnapshot) => void> = [];
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private currentScore = 85;

  /* ── Status & Sensors ── */

  subscribeToStatus(callback: (snapshot: StatusSnapshot) => void): () => void {
    this.statusListeners.push(callback);

    // Start ticking if this is the first subscriber
    if (this.statusListeners.length === 1) {
      this.startTicking();
    }

    // Immediately emit current state
    this.emitStatus();

    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== callback);
      if (this.statusListeners.length === 0) {
        this.stopTicking();
      }
    };
  }

  async getLatestStatus(): Promise<StatusSnapshot> {
    const sensors = await this.getSensorBundle();
    const connectivity = await this.getConnectivity();
    return {
      level: scoreToLevel(this.currentScore),
      score: Math.round(this.currentScore),
      timestamp: Date.now(),
      sensors,
      connectivity,
    };
  }

  async getSensorBundle(): Promise<SensorBundle> {
    const hr = clamp(Math.round(oscillate(72, 8, 30000)), 55, 120);
    const motion = clamp(oscillate(0.3, 0.2, 45000), 0, 1);
    const audio = clamp(oscillate(35, 10, 60000), 20, 90);
    const stress = clamp(oscillate(0.25, 0.15, 50000), 0, 1);

    return {
      heartRate: {
        value: hr,
        unit: 'BPM',
        label: hr > 100 ? 'Elevated' : 'Normal',
        status: hr > 100 ? 'elevated' : 'normal',
        trend: generateTrend(72, 15),
        lastUpdated: Date.now(),
      },
      motion: {
        value: Math.round(motion * 100),
        unit: '%',
        label: motion > 0.6 ? 'Elevated' : 'Normal',
        status: motion > 0.6 ? 'elevated' : 'normal',
        trend: generateTrend(30, 20),
        lastUpdated: Date.now(),
      },
      audioEnv: {
        value: Math.round(audio),
        unit: 'dB',
        label: audio > 60 ? 'Loud' : 'Quiet',
        status: audio > 60 ? 'elevated' : 'normal',
        trend: generateTrend(35, 15),
        lastUpdated: Date.now(),
      },
      stress: {
        value: Math.round(stress * 100),
        unit: '%',
        label: stress > 0.6 ? 'High' : stress > 0.3 ? 'Medium' : 'Low',
        status: stress > 0.6 ? 'critical' : stress > 0.3 ? 'elevated' : 'normal',
        trend: generateTrend(25, 15),
        lastUpdated: Date.now(),
      },
    };
  }

  async getConnectivity(): Promise<ConnectivityStatus> {
    return { gps: true, ble: true, net: true };
  }

  /* ── Calibration ── */

  async getCalibrationState(): Promise<CalibrationState> {
    return {
      isCalibrating: false,
      progress: 100,
      startedAt: null,
      estimatedCompletion: null,
    };
  }

  /* ── Alerts ── */

  async getRecentAlerts(limit = 3): Promise<Alert[]> {
    return MOCK_ALERTS.slice(0, limit);
  }

  async getAllAlerts(): Promise<Alert[]> {
    return MOCK_ALERTS;
  }

  async getAlertById(id: string): Promise<Alert | null> {
    return MOCK_ALERTS.find((a) => a.id === id) ?? null;
  }

  async deleteAlert(id: string): Promise<void> {
    // In mock, this is a no-op (store handles local deletion)
  }

  /* ── Map / Incidents ── */

  async getNearbyIncidents(
    _center: LocationPoint,
    _radiusKm: number,
  ): Promise<MapIncident[]> {
    return MOCK_INCIDENTS;
  }

  async getIncidentById(id: string): Promise<MapIncident | null> {
    return MOCK_INCIDENTS.find((i) => i.id === id) ?? null;
  }

  /* ── Device / Belt ── */

  async getDeviceState(): Promise<DeviceState> {
    return {
      isConnected: true,
      name: 'NARI Belt Pro',
      batteryPercent: 84,
      sensors: {
        hrm: true,
        gps: true,
        accel: true,
        gyro: true,
        temp: false, // simulate one sensor with issues
        sync: true,
      },
      firmwareVersion: '2.1.4',
    };
  }

  async scanForDevices(): Promise<string[]> {
    // Simulate 2-second BLE scan
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return ['NARI Belt Pro'];
  }

  async connectToDevice(_deviceName: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return true;
  }

  async disconnectDevice(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  /* ── Contacts ── */

  async getTrustedContacts(): Promise<TrustedContact[]> {
    return MOCK_CONTACTS;
  }

  /* ── Location ── */

  async getCurrentLocation(): Promise<LocationPoint> {
    // Mock: downtown Seattle area
    return {
      latitude: 47.6062 + (Math.random() - 0.5) * 0.002,
      longitude: -122.3321 + (Math.random() - 0.5) * 0.002,
    };
  }

  /* ── Internal ── */

  private startTicking(): void {
    this.tickInterval = setInterval(() => {
      // Slowly drift the score with noise
      this.currentScore = clamp(
        this.currentScore + (Math.random() - 0.5) * 2,
        20,
        98,
      );
      this.emitStatus();
    }, 3000); // Every 3 seconds
  }

  private stopTicking(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  private async emitStatus(): Promise<void> {
    const snapshot = await this.getLatestStatus();
    this.statusListeners.forEach((cb) => cb(snapshot));
  }
}
