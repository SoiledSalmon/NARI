/**
 * AppNavigator — Bottom tab layout with custom tab bar.
 * 4 tabs: Home | Status | <SOS FAB> | Map | Settings
 */

import React, { useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AppTabParamList, RootStackParamList, ROUTES } from './routes';
import { CustomTabBar } from './components/CustomTabBar';
import HomeScreen from '../screens/Home';
import StatusScreen from '../screens/Status';
import MapScreen from '../screens/Map';
import { SettingsNavigator } from './SettingsNavigator';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppNavigator() {
  const { t } = useTranslation();
  const rootNav = useNavigation<NavigationProp<RootStackParamList>>();

  const handleSOSPress = useCallback(() => {
    rootNav.navigate(ROUTES.OVERLAY.SOS_COUNTDOWN);
  }, [rootNav]);

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <CustomTabBar {...props} onSOSPress={handleSOSPress} />
      )}
    >
      <Tab.Screen
        name={ROUTES.APP.HOME}
        component={HomeScreen}
        options={{ tabBarLabel: t('tabs.home') }}
      />
      <Tab.Screen
        name={ROUTES.APP.STATUS}
        component={StatusScreen}
        options={{ tabBarLabel: t('tabs.status') }}
      />
      <Tab.Screen
        name={ROUTES.APP.MAP}
        component={MapScreen}
        options={{ tabBarLabel: t('tabs.map') }}
      />
      <Tab.Screen
        name={ROUTES.APP.SETTINGS}
        component={SettingsNavigator}
        options={{ tabBarLabel: t('tabs.settings') }}
      />
    </Tab.Navigator>
  );
}
