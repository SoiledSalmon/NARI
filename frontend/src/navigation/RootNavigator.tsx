/**
 * RootNavigator — Top-level navigator.
 *
 * Decides: Auth stack vs App stack based on auth + onboarding state.
 * Also hosts overlay modals (SOS, Journey, AlertReceived)
 * that appear full-screen above the tabs.
 */

import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { RootStackParamList, ROUTES } from './routes';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { useAuthStore } from '../stores/authStore';
import { useAlertStore } from '../stores/alertStore';
import { useContactStore } from '../stores/contactStore';

// Overlay screens
import SOSCountdownScreen from '../screens/SOSCountdown';
import SOSActiveScreen from '../screens/SOSActive';
import JourneyModeActiveScreen from '../screens/JourneyModeActive';
import AlertReceivedScreen from '../screens/AlertReceived';
import IncidentDetailScreen from '../screens/IncidentDetail';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const onboardingComplete = user?.onboardingComplete ?? false;

  const initAuthListener = useAuthStore((s) => s.initAuthListener);
  const initAlertListener = useAlertStore((s) => s.initAlertListener);
  const fetchContacts = useContactStore((s) => s.fetchContacts);

  useEffect(() => {
    const unsubscribeAuth = initAuthListener();
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, [initAuthListener]);

  useEffect(() => {
    let unsubscribeAlerts: (() => void) | undefined;
    if (isAuthenticated && user?.id) {
      fetchContacts(user.id);
      unsubscribeAlerts = initAlertListener(user.id);
    }
    return () => {
      if (unsubscribeAlerts) unsubscribeAlerts();
    };
  }, [isAuthenticated, user?.id, fetchContacts, initAlertListener]);

  const showApp = isAuthenticated && onboardingComplete;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {showApp ? (
          <>
            <Stack.Screen name="App" component={AppNavigator} />

            {/* Overlay modals — rendered above everything */}
            <Stack.Group
              screenOptions={{
                presentation: 'fullScreenModal',
                animation: 'fade',
                gestureEnabled: false,
              }}
            >
              <Stack.Screen
                name={ROUTES.OVERLAY.SOS_COUNTDOWN}
                component={SOSCountdownScreen}
              />
              <Stack.Screen
                name={ROUTES.OVERLAY.SOS_ACTIVE}
                component={SOSActiveScreen}
              />
              <Stack.Screen
                name={ROUTES.OVERLAY.JOURNEY_ACTIVE}
                component={JourneyModeActiveScreen}
              />
              <Stack.Screen
                name={ROUTES.OVERLAY.ALERT_RECEIVED}
                component={AlertReceivedScreen}
              />
              <Stack.Screen
                name={ROUTES.OVERLAY.INCIDENT_DETAIL}
                component={IncidentDetailScreen}
              />
            </Stack.Group>
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
