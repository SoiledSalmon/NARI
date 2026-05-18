import { IDataProvider } from './DataProvider';
import * as Location from 'expo-location';
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
import { MockDataProvider } from './MockDataProvider';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const API_KEY = process.env.EXPO_PUBLIC_API_SECRET_KEY || 'your-secret-key-here';

export class LiveDataProvider implements IDataProvider {
  private statusListeners: Array<(snapshot: StatusSnapshot) => void> = [];
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private lastKnownGoodStatus: StatusSnapshot | null = null;
  
  // We use MockDataProvider as a fallback for methods not yet supported by the backend or Firebase
  private mockProvider = new MockDataProvider();

  /* ── Status & Sensors ── */

  subscribeToStatus(callback: (snapshot: StatusSnapshot) => void): () => void {
    this.statusListeners.push(callback);

    if (this.statusListeners.length === 1) {
      this.startTicking();
    }

    this.emitStatus();

    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== callback);
      if (this.statusListeners.length === 0) {
        this.stopTicking();
      }
    };
  }

  async getLatestStatus(): Promise<StatusSnapshot> {
    try {
      const response = await fetch(`${BACKEND_URL}/status`, {
        headers: {
          'X-API-Key': API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const snapshot: StatusSnapshot = await response.json();
      this.lastKnownGoodStatus = snapshot;
      return snapshot;
    } catch (error) {
      console.warn('Failed to fetch live status, returning last known good or mock', error);
      if (this.lastKnownGoodStatus) {
        // Return last known good but with net=false
        return {
          ...this.lastKnownGoodStatus,
          connectivity: {
            ...this.lastKnownGoodStatus.connectivity,
            net: false,
          },
        };
      }
      // If we don't have a last known good, fall back to mock
      return this.mockProvider.getLatestStatus();
    }
  }

  async getSensorBundle(): Promise<SensorBundle> {
    const status = await this.getLatestStatus();
    return status.sensors;
  }

  async getConnectivity(): Promise<ConnectivityStatus> {
    const status = await this.getLatestStatus();
    return status.connectivity;
  }

  /* ── Calibration ── */

  async getCalibrationState(): Promise<CalibrationState> {
    return this.mockProvider.getCalibrationState();
  }

  /* ── Alerts ── */

  async getRecentAlerts(limit?: number): Promise<Alert[]> {
    return this.mockProvider.getRecentAlerts(limit);
  }

  async getAllAlerts(): Promise<Alert[]> {
    return this.mockProvider.getAllAlerts();
  }

  async getAlertById(id: string): Promise<Alert | null> {
    return this.mockProvider.getAlertById(id);
  }

  async deleteAlert(id: string): Promise<void> {
    return this.mockProvider.deleteAlert(id);
  }

  /* ── Map / Incidents ── */

  async getNearbyIncidents(
    center: LocationPoint,
    radiusKm: number,
  ): Promise<MapIncident[]> {
    return this.mockProvider.getNearbyIncidents(center, radiusKm);
  }

  async getIncidentById(id: string): Promise<MapIncident | null> {
    return this.mockProvider.getIncidentById(id);
  }

  /* ── Device / Belt ── */

  async getDeviceState(): Promise<DeviceState> {
    return this.mockProvider.getDeviceState();
  }

  async scanForDevices(): Promise<string[]> {
    return this.mockProvider.scanForDevices();
  }

  async connectToDevice(deviceName: string): Promise<boolean> {
    return this.mockProvider.connectToDevice(deviceName);
  }

  async disconnectDevice(): Promise<void> {
    return this.mockProvider.disconnectDevice();
  }

  /* ── Contacts ── */

  async getTrustedContacts(): Promise<TrustedContact[]> {
    return this.mockProvider.getTrustedContacts();
  }

  /* ── Location ── */

  async getCurrentLocation(): Promise<LocationPoint> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission denied, using mock location');
        return this.mockProvider.getCurrentLocation();
      }

      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.warn('Failed to get location, using mock location', error);
      return this.mockProvider.getCurrentLocation();
    }
  }

  /* ── Internal ── */

  private startTicking(): void {
    // Poll the backend every 3 seconds
    this.tickInterval = setInterval(() => {
      this.emitStatus();
    }, 3000);
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
