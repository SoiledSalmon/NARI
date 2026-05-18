/**
 * CustomTabBar — PRD Option A: 4 tabs + floating SOS button above center gap.
 * Source: docs/NAVIGATION.md, implementation_plan.md
 *
 * Layout: [Home] [Status] <SOS FAB> [Map] [Settings]
 * The SOS button hovers above the tab bar center.
 */

import React, { useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { shadows, spacing, radii } from '../../theme/spacing';
import { ROUTES } from '../routes';
import { haptic } from '../../services/hapticService';

const TAB_ICONS: Record<string, string> = {
  [ROUTES.APP.HOME]: '🏠',
  [ROUTES.APP.STATUS]: '📊',
  [ROUTES.APP.MAP]: '🗺️',
  [ROUTES.APP.SETTINGS]: '⚙️',
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface CustomTabBarProps extends BottomTabBarProps {
  onSOSPress: () => void;
}

export function CustomTabBar({
  state,
  descriptors,
  navigation,
  onSOSPress,
}: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const sosScale = useSharedValue(1);

  const sosAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sosScale.value }],
  }));

  const handleSOSPress = useCallback(() => {
    haptic.warning();
    sosScale.value = withSequence(
      withSpring(0.9, { damping: 10, stiffness: 300 }),
      withSpring(1.05, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 250 }),
    );
    onSOSPress();
  }, [onSOSPress, sosScale]);

  // Split tabs into left (Home, Status) and right (Map, Settings)
  const leftTabs = state.routes.slice(0, 2);
  const rightTabs = state.routes.slice(2, 4);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* SOS Floating Button — positioned above the tab bar */}
      <View style={styles.sosFabContainer}>
        <AnimatedTouchable
          onPress={handleSOSPress}
          style={[styles.sosFab, sosAnimatedStyle]}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="SOS emergency button"
        >
          <Text style={styles.sosText}>SOS</Text>
        </AnimatedTouchable>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {leftTabs.map((route, index) =>
          renderTab(route, index, state, descriptors, navigation),
        )}

        {/* Center spacer for SOS button */}
        <View style={styles.centerSpacer} />

        {rightTabs.map((route, index) =>
          renderTab(route, index + 2, state, descriptors, navigation),
        )}
      </View>
    </View>
  );
}

function renderTab(
  route: BottomTabBarProps['state']['routes'][number],
  index: number,
  state: BottomTabBarProps['state'],
  descriptors: BottomTabBarProps['descriptors'],
  navigation: BottomTabBarProps['navigation'],
) {
  const { options } = descriptors[route.key];
  const rawLabel = options.tabBarLabel ?? options.title ?? route.name;
  const label = typeof rawLabel === 'string' ? rawLabel : route.name;
  const isFocused = state.index === index;

  const onPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <TouchableOpacity
      key={route.key}
      onPress={onPress}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <Text style={styles.tabIcon}>
        {TAB_ICONS[route.name] ?? '•'}
      </Text>
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? colors.brand.primary : colors.neutral[500] },
        ]}
      >
        {label}
      </Text>
      {isFocused && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: colors.neutral[0],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[200],
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 60,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 11,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.brand.primary,
  },
  centerSpacer: {
    width: 72, // space for the SOS button
  },
  sosFabContainer: {
    position: 'absolute',
    top: -28,
    left: '50%',
    marginLeft: -32,
    zIndex: 10,
  },
  sosFab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.status.danger,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sos,
  },
  sosText: {
    ...typography.bodySemibold,
    color: colors.neutral[0],
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
