/**
 * SettingsNavigator — Nested stack inside the Settings tab.
 * Root → AlertHistory → AlertDetail
 *      → DevicePairing
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList, ROUTES } from './routes';
import SettingsRootScreen from '../screens/Settings';
import AlertHistoryScreen from '../screens/AlertHistory';
import AlertDetailScreen from '../screens/AlertDetail';
import DevicePairingScreen from '../screens/DevicePairing';

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
    </Stack.Navigator>
  );
}
