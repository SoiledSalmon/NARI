/**
 * NARI — Core Data Types
 * Source of truth: docs/DATA_LAYER.md
 *
 * Every type that crosses a component boundary lives here.
 */

/* ─────────── Safety Status ─────────── */

export type SafetyLevel = 'safe' | 'alert' | 'danger';

export interface StatusSnapshot {
  level: SafetyLevel;
  score: number;           // 0-100 composite safety score
  timestamp: number;       // Unix ms
  sensors: SensorBundle;
  connectivity: ConnectivityStatus;
}

/* ─────────── Sensors ─────────── */

export interface SensorBundle {
  heartRate: SensorReading;
  motion: SensorReading;
  audioEnv: SensorReading;
  stress: SensorReading;
}

export interface SensorReading {
  value: number;
  unit: string;
  label: string;           // Human-readable: "Normal", "Elevated", etc.
  status: 'normal' | 'elevated' | 'critical';
  trend: number[];         // Last 24 data points for sparkline/chart
  lastUpdated: number;     // Unix ms
}

export interface ConnectivityStatus {
  gps: boolean;
  ble: boolean;
  net: boolean;
}

/* ─────────── Calibration ─────────── */

export interface CalibrationState {
  isCalibrating: boolean;
  progress: number;        // 0-100
  startedAt: number | null;
  estimatedCompletion: number | null;
}

/* ─────────── Contacts ─────────── */

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;    // "Sister", "Partner", "Friend", etc.
  deliveryMethod: 'nari' | 'sms' | 'whatsapp';
  avatarInitial: string;   // First character of name
  avatarColor: string;     // Hex color for avatar background
  isNariUser: boolean;
}

/* ─────────── Alerts ─────────── */

export type AlertType = 'manual_sos' | 'elevated_hr' | 'gps_lost' | 'fall_detected' | 'audio_anomaly';
export type AlertOutcome = 'resolved' | 'false_alarm' | 'active';
export type AlertSeverity = 'high' | 'moderate' | 'low';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  outcome: AlertOutcome;
  severity: AlertSeverity;
  timestamp: number;       // Unix ms
  location: LocationPoint | null;
  locationLabel: string;   // "Volunteer Park", "Downtown Core"
  locationAddress: string; // Full address
  sensorSnapshot: Partial<SensorBundle> | null;
  narrativeDetail: string; // Anonymized report text
}

/* ─────────── Map / Incidents ─────────── */

export interface LocationPoint {
  latitude: number;
  longitude: number;
}

export interface MapIncident {
  id: string;
  type: string;            // "Suspicious Activity", "Poor Lighting", etc.
  severity: AlertSeverity;
  location: LocationPoint;
  locationLabel: string;
  description: string;
  reportedAt: number;      // Unix ms
  narrativeDetail: string;
}

/* ─────────── SOS ─────────── */

export type SOSPhase = 'idle' | 'countdown' | 'active' | 'resolved';

export interface SOSState {
  phase: SOSPhase;
  triggeredAt: number | null;
  countdownRemaining: number; // seconds
  isSilent: boolean;
  contactNotifications: ContactNotification[];
}

export interface ContactNotification {
  id: string;
  label: string;           // "Emergency Contacts (3)", "Local Authorities"
  status: 'pending' | 'sending' | 'sent' | 'failed';
  count?: number;          // number of contacts in group
}

/* ─────────── Journey Mode ─────────── */

export interface JourneyState {
  isActive: boolean;
  label: string;           // "Walking Home"
  startedAt: number | null;
  elapsedSeconds: number;
  watchingContacts: string[]; // Contact names
  currentLocation: LocationPoint | null;
}

/* ─────────── Device / Belt ─────────── */

export interface DeviceState {
  isConnected: boolean;
  name: string;            // "NARI Belt Pro"
  batteryPercent: number;
  sensors: DeviceSensorStatus;
  firmwareVersion: string;
}

export interface DeviceSensorStatus {
  hrm: boolean;
  gps: boolean;
  accel: boolean;
  gyro: boolean;
  temp: boolean;
  sync: boolean;
}

/* ─────────── Auth ─────────── */

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  language: 'en' | 'kn';
  onboardingComplete: boolean;
  createdAt: number;
}

/* ─────────── Alert Received (responder view) ─────────── */

export interface ReceivedAlert {
  senderName: string;
  alertType: 'manual_sos' | 'auto_sos';
  location: LocationPoint;
  locationAddress: string;
  distance: string;        // "0.8 mi"
  batteryPercent: number;
  signalStrength: 'strong' | 'weak' | 'none';
  timestamp: number;
}
