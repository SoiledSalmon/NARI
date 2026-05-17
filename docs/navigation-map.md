# NARI — Navigation

Complete route tree, screen params, and navigation patterns. All route name constants live in `src/navigation/routes.ts` — never use magic strings.

---

## Route Constants (`src/navigation/routes.ts`)

```typescript
export const Routes = {
  // Auth / Onboarding stack
  SPLASH:           'Splash',
  LANGUAGE:         'Language',
  SIGN_UP:          'SignUp',
  OTP_VERIFY:       'OTPVerify',
  SIGN_IN:          'SignIn',
  ADD_CONTACTS:     'AddContacts',
  PERMISSIONS:      'Permissions',
  DEVICE_PAIRING:   'DevicePairing',

  // Main app tabs
  HOME:             'Home',
  STATUS:           'Status',
  MAP:              'Map',
  SETTINGS:         'Settings',

  // Map stack
  INCIDENT_DETAIL:  'IncidentDetail',

  // Settings stack
  ALERT_HISTORY:    'AlertHistory',
  ALERT_DETAIL:     'AlertDetail',

  // Overlays (full-screen modals)
  SOS_COUNTDOWN:    'SOSCountdown',
  SOS_ACTIVE:       'SOSActive',
  JOURNEY_ACTIVE:   'JourneyModeActive',
  ALERT_RECEIVED:   'AlertReceived',
} as const;

export type RouteName = typeof Routes[keyof typeof Routes];
```

---

## Navigator Tree

```
RootNavigator (Stack, no header)
  │
  ├── AuthNavigator (Stack) — shown when not authenticated
  │     ├── Splash
  │     ├── Language
  │     ├── SignUp
  │     ├── OTPVerify
  │     ├── SignIn
  │     ├── AddContacts
  │     └── Permissions
  │
  ├── AppNavigator (custom bottom tab + floating SOS)
  │     ├── HomeTab → Home
  │     ├── StatusTab → Status
  │     ├── MapTab (Stack)
  │     │     ├── Map
  │     │     └── IncidentDetail
  │     └── SettingsTab (Stack)
  │           ├── Settings
  │           ├── AlertHistory
  │           └── AlertDetail
  │
  └── OverlayNavigator (Stack, presentation: fullScreenModal)
        ├── SOSCountdown
        ├── SOSActive
        ├── JourneyModeActive
        └── AlertReceived
```

`RootNavigator` renders `AuthNavigator` or `AppNavigator` based on auth state. `OverlayNavigator` is always mounted on top of both.

---

## Screen Params

```typescript
// Typed param list for each navigator

export type AuthStackParams = {
  [Routes.SPLASH]:         undefined;
  [Routes.LANGUAGE]:       undefined;
  [Routes.SIGN_UP]:        undefined;
  [Routes.OTP_VERIFY]:     { phoneNumber: string };
  [Routes.SIGN_IN]:        undefined;
  [Routes.ADD_CONTACTS]:   undefined;
  [Routes.PERMISSIONS]:    undefined;
};

export type AppTabParams = {
  [Routes.HOME]:     undefined;
  [Routes.STATUS]:   { scrollToCalibration?: boolean };
  [Routes.MAP]:      undefined;
  [Routes.SETTINGS]: { scrollTo?: 'device' | 'contacts' | 'language' };
};

export type MapStackParams = {
  [Routes.MAP]:              undefined;
  [Routes.INCIDENT_DETAIL]:  { incident: IncidentPoint };
};

export type SettingsStackParams = {
  [Routes.SETTINGS]:      { scrollTo?: 'device' | 'contacts' | 'language' };
  [Routes.ALERT_HISTORY]: undefined;
  [Routes.ALERT_DETAIL]:  { alert: AlertEvent };
};

export type OverlayParams = {
  [Routes.SOS_COUNTDOWN]:  { triggeredBy: 'tap' | 'auto_ml' | 'journey' };
  [Routes.SOS_ACTIVE]:     { alertId: string };
  [Routes.JOURNEY_ACTIVE]: undefined;
  [Routes.ALERT_RECEIVED]: { payload: AlertNotificationPayload };
};
```

---

## Custom Tab Bar

The bottom tab bar is a custom component (`src/components/layout/TabBar.tsx`) because of the floating SOS button. It renders:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    ┌──────────┐                     │
│                    │  🆘 SOS  │  ← floating button  │
│                    └──────────┘                     │
│  [ Home ]  [ Status ]  [ ── ]  [ Map ] [ Settings ] │
│                         (gap)                       │
└─────────────────────────────────────────────────────┘
```

The SOS button overlaps the tab bar. Center tab slot is intentionally empty/transparent with the SOS button visually sitting above it.

**Hiding the tab bar on overlay screens**: The custom `TabBar` reads the current navigation state. When the active route is `SOSCountdown`, `SOSActive`, `JourneyModeActive`, or `AlertReceived`, it renders `null`. Do not use `tabBarStyle: { display: 'none' }` — use the custom renderer.

---

## Navigation Patterns

### After onboarding complete
```typescript
// In Permissions screen, after all required permissions granted:
navigation.reset({
  index: 0,
  routes: [{ name: 'AppNavigator' }],
});
```

### Opening SOS Countdown (from anywhere)
```typescript
// In SOSButton component:
navigation.navigate('OverlayNavigator', {
  screen: Routes.SOS_COUNTDOWN,
  params: { triggeredBy: 'tap' }
});
```

### Transitioning SOS Countdown → SOS Active
```typescript
// In SOSCountdown, when countdown reaches 0 or confirm tapped:
navigation.replace(Routes.SOS_ACTIVE, { alertId });
// Note: replace not navigate — user cannot back-swipe to countdown
```

### Opening Alert Received from notification tap
```typescript
// In notificationService.ts, on notification open:
navigationRef.navigate('OverlayNavigator', {
  screen: Routes.ALERT_RECEIVED,
  params: { payload: notificationData }
});
```

### Deep link from calibration banner → Status calibration section
```typescript
navigation.navigate(Routes.STATUS, { scrollToCalibration: true });
// Status screen reads this param and scrolls to calibration sub-section on mount
```

### Bangle status dot → Settings Device section
```typescript
navigation.navigate(Routes.SETTINGS, { scrollTo: 'device' });
```

---

## Back Behavior Rules

| Screen | Back behavior |
|---|---|
| SOSCountdown | No back gesture. Only "I'm Safe" button exits. |
| SOSActive | No back gesture. Only "I'm Safe Now" exits. |
| JourneyModeActive | No back gesture. Only "I've Arrived Safely" exits. |
| AlertReceived | Back gesture allowed. Contact can dismiss. |
| OTPVerify | Back allowed → SignUp |
| DevicePairing | Back allowed → returns to Home (skip was used) |
| All other screens | Default React Navigation back behavior |

Disable back gesture on SOS screens using `gestureEnabled: false` in screen options.
