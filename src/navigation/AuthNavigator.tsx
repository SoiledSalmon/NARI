/**
 * AuthNavigator — Auth/Onboarding flow screens.
 * Sequential: Splash → Language → SignUp → OTP → AddContacts → Permissions
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES, AuthStackParamList } from './routes';

// Screen imports
import SplashScreen from '../screens/Splash';
import LanguageScreen from '../screens/Language';
import SignUpScreen from '../screens/SignUp';
import OTPVerifyScreen from '../screens/OTPVerify';
import AddContactsScreen from '../screens/AddContacts';
import PermissionsScreen from '../screens/Permissions';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.AUTH.SPLASH}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name={ROUTES.AUTH.SPLASH} component={SplashScreen} />
      <Stack.Screen name={ROUTES.AUTH.LANGUAGE} component={LanguageScreen} />
      <Stack.Screen name={ROUTES.AUTH.SIGNUP} component={SignUpScreen} />
      <Stack.Screen name={ROUTES.AUTH.OTP} component={OTPVerifyScreen} />
      <Stack.Screen name={ROUTES.AUTH.ADD_CONTACTS} component={AddContactsScreen} />
      <Stack.Screen name={ROUTES.AUTH.PERMISSIONS} component={PermissionsScreen} />
    </Stack.Navigator>
  );
}
