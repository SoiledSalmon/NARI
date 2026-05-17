import React, { ReactNode, useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSensorStore } from '../../stores/sensorStore';
import { SafetyLevel } from '../../data/types';
import { colors } from '../../theme/colors';

interface StatusBackgroundProps {
  children: ReactNode;
  style?: ViewStyle;
}

const LEVEL_INDEX: Record<SafetyLevel, number> = {
  safe: 0,
  alert: 1,
  danger: 2,
};

export function StatusBackground({ children, style }: StatusBackgroundProps) {
  const level = useSensorStore((s) => s.status?.level ?? 'safe');
  const progress = useSharedValue(LEVEL_INDEX[level]);

  useEffect(() => {
    progress.value = withTiming(LEVEL_INDEX[level], { duration: 350 });
  }, [level, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1, 2],
      [colors.brand.cream, colors.status.alertLight, colors.status.dangerLight],
    ),
  }));

  return <Animated.View style={[styles.container, animatedStyle, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
