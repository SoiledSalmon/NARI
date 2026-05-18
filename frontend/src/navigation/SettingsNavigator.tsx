/**
 * SettingsNavigator — Nested stack inside the Settings tab.
 * Root → AlertHistory → AlertDetail
 *      → DevicePairing
 *      → PersonalInfo | EmergencyContacts | AlertPreferences
 *      → PrivacySecurity | LanguageSettings | HelpSupport | AboutNari | DeviceInfo
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList, ROUTES } from './routes';
import SettingsRootScreen from '../screens/Settings';
import AlertHistoryScreen from '../screens/AlertHistory';
import AlertDetailScreen from '../screens/AlertDetail';
import DevicePairingScreen from '../screens/DevicePairing';
import PersonalInfoScreen from '../screens/PersonalInfo';
import EmergencyContactsScreen from '../screens/EmergencyContacts';
import AlertPreferencesScreen from '../screens/AlertPreferences';
import PrivacySecurityScreen from '../screens/PrivacySecurity';
import LanguageSettingsScreen from '../screens/LanguageSettings';
import HelpSupportScreen from '../screens/HelpSupport';
import AboutNariScreen from '../screens/AboutNari';
import DeviceInfoScreen from '../screens/DeviceInfo';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name={ROUTES.SETTINGS_STACK.ROOT}
        component={SettingsRootScreen}
      />
      <Stack.Screen
        name={ROUTES.SETTINGS_STACK.ALERT_HISTORY}
        component={AlertHistoryScreen}
      />
      <Stack.Screen
        name={ROUTES.SETTINGS_STACK.ALERT_DETAIL}
        component={AlertDetailScreen}
      />
      <Stack.Screen
        name={ROUTES.SETTINGS_STACK.DEVICE_PAIRING}
        component={DevicePairingScreen}
      />
      <Stack.Screen
        name={ROUTES.SETTINGS_STACK.PERSONAL_INFO}
        component={PersonalInfoScreen}
      />
      <Stack.Screen
        name={ROUTES.SETTINGS_STACK.EMERGENCY_CONTACTS}
        component={EmergencyContactsScreen}
      />
      <Stack.Screen
        name={ROUTES.SETTINGS_STACK.ALERT_PREFERENCES}
        component={AlertPreferencesScreen}
      />
      <Stack.Screen
        name={ROUTES.SETTINGS_STACK.PRIVACY_SECURITY}
        component={PrivacySecurityScreen}
      />
      <Stack.Screen
        name={ROUTES.SETTINGS_STACK.LANGUAGE_SETTINGS}
        component={LanguageSettingsScreen}
      />
      <Stack.Screen
        name={ROUTES.SETTINGS_STACK.HELP_SUPPORT}
        component={HelpSupportScreen}
      />
      <Stack.Screen
        name={ROUTES.SETTINGS_STACK.ABOUT_NARI}
        component={AboutNariScreen}
      />
      <Stack.Screen
        name={ROUTES.SETTINGS_STACK.DEVICE_INFO}
        component={DeviceInfoScreen}
      />
    </Stack.Navigator>
  );
}
