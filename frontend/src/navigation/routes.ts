/**
 * Navigation route constants.
 * Source of truth: docs/NAVIGATION.md
 */

export const ROUTES = {
  // Auth stack
  AUTH: {
    SPLASH: 'Splash' as const,
    LANGUAGE: 'Language' as const,
    SIGNUP: 'SignUp' as const,
    OTP: 'OTPVerify' as const,
    ADD_CONTACTS: 'AddContacts' as const,
    PERMISSIONS: 'Permissions' as const,
  },

  // Main app tab navigator
  APP: {
    TABS: 'AppTabs' as const,
    HOME: 'Home' as const,
    STATUS: 'Status' as const,
    MAP: 'Map' as const,
    SETTINGS: 'Settings' as const,
  },

  // Settings sub-screens (nested stack)
  SETTINGS_STACK: {
    ROOT: 'SettingsRoot' as const,
    ALERT_HISTORY: 'AlertHistory' as const,
    ALERT_DETAIL: 'AlertDetail' as const,
    DEVICE_PAIRING: 'DevicePairing' as const,
    PERSONAL_INFO: 'PersonalInfo' as const,
    EMERGENCY_CONTACTS: 'EmergencyContacts' as const,
    ALERT_PREFERENCES: 'AlertPreferences' as const,
    PRIVACY_SECURITY: 'PrivacySecurity' as const,
    LANGUAGE_SETTINGS: 'LanguageSettings' as const,
    HELP_SUPPORT: 'HelpSupport' as const,
    ABOUT_NARI: 'AboutNari' as const,
    DEVICE_INFO: 'DeviceInfo' as const,
  },

  // Overlay modals (full-screen, no tab bar)
  OVERLAY: {
    SOS_COUNTDOWN: 'SOSCountdown' as const,
    SOS_ACTIVE: 'SOSActive' as const,
    JOURNEY_ACTIVE: 'JourneyActive' as const,
    ALERT_RECEIVED: 'AlertReceived' as const,
    INCIDENT_DETAIL: 'IncidentDetail' as const,
  },
} as const;

/* ── Param list types for type-safe navigation ── */

export type AuthStackParamList = {
  [ROUTES.AUTH.SPLASH]: undefined;
  [ROUTES.AUTH.LANGUAGE]: undefined;
  [ROUTES.AUTH.SIGNUP]: undefined;
  [ROUTES.AUTH.OTP]: { phone: string };
  [ROUTES.AUTH.ADD_CONTACTS]: undefined;
  [ROUTES.AUTH.PERMISSIONS]: undefined;
};

export type AppTabParamList = {
  [ROUTES.APP.HOME]: undefined;
  [ROUTES.APP.STATUS]: undefined;
  [ROUTES.APP.MAP]: undefined;
  [ROUTES.APP.SETTINGS]: { screen?: keyof SettingsStackParamList } | undefined;
};

export type SettingsStackParamList = {
  [ROUTES.SETTINGS_STACK.ROOT]: undefined;
  [ROUTES.SETTINGS_STACK.ALERT_HISTORY]: undefined;
  [ROUTES.SETTINGS_STACK.ALERT_DETAIL]: { alertId: string };
  [ROUTES.SETTINGS_STACK.DEVICE_PAIRING]: undefined;
  [ROUTES.SETTINGS_STACK.PERSONAL_INFO]: undefined;
  [ROUTES.SETTINGS_STACK.EMERGENCY_CONTACTS]: undefined;
  [ROUTES.SETTINGS_STACK.ALERT_PREFERENCES]: undefined;
  [ROUTES.SETTINGS_STACK.PRIVACY_SECURITY]: undefined;
  [ROUTES.SETTINGS_STACK.LANGUAGE_SETTINGS]: undefined;
  [ROUTES.SETTINGS_STACK.HELP_SUPPORT]: undefined;
  [ROUTES.SETTINGS_STACK.ABOUT_NARI]: undefined;
  [ROUTES.SETTINGS_STACK.DEVICE_INFO]: undefined;
};

export type OverlayParamList = {
  [ROUTES.OVERLAY.SOS_COUNTDOWN]: undefined;
  [ROUTES.OVERLAY.SOS_ACTIVE]: undefined;
  [ROUTES.OVERLAY.JOURNEY_ACTIVE]: { label: string };
  [ROUTES.OVERLAY.ALERT_RECEIVED]: { alertId: string };
  [ROUTES.OVERLAY.INCIDENT_DETAIL]: { incidentId: string };
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
} & OverlayParamList;
