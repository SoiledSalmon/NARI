/**
 * SafetyGauge — Circular gauge showing the composite safety score.
 * Uses Reanimated for smooth value transitions.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SafetyLevel } from '../../data/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface SafetyGaugeProps {
  score: number;
  level: SafetyLevel;
  size?: number;
  technical?: boolean;
}

const LEVEL_COLORS = {
  safe: colors.status.safe,
  alert: colors.status.alert,
  danger: colors.status.danger,
};

const LEVEL_BG = {
  safe: colors.status.safeLight,
  alert: colors.status.alertLight,
  danger: colors.status.dangerLight,
};

const LEVEL_LABELS = {
  safe: 'Safe',
  alert: 'Elevated',
  danger: 'Danger',
};

export function SafetyGauge({ score, level, size = 180, technical = false }: SafetyGaugeProps) {
  const animatedScore = useSharedValue(0);
  const levelPulse = useSharedValue(1);
  const safePulse = useSharedValue(1);
  const gaugeColor = LEVEL_COLORS[level];
  const bgColor = LEVEL_BG[level];
  const label = LEVEL_LABELS[level];

  useEffect(() => {
    animatedScore.value = withTiming(score, {
      duration: 320,
      easing: Easing.out(Easing.quad),
    });
  }, [score, animatedScore]);

  useEffect(() => {
    levelPulse.value = 1.035;
    levelPulse.value = withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.quad),
    });
  }, [level, levelPulse]);

  useEffect(() => {
    if (level === 'safe') {
      safePulse.value = 0;
      safePulse.value = withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      );
      return;
    }

    safePulse.value = withTiming(1, { duration: 160 });
  }, [level, safePulse]);

  const ringStyle = useAnimatedStyle(() => ({
    borderColor: gaugeColor,
    borderWidth: 8,
    opacity: 0.3 + (animatedScore.value / 100) * 0.7,
    transform: [{ scale: levelPulse.value }],
  }));

  const safePulseStyle = useAnimatedStyle(() => ({
    opacity: 0.16 * (1 - safePulse.value),
    transform: [{ scale: 0.92 + safePulse.value * 0.22 }],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.safePulse,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          safePulseStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.outerRing,
          { width: size, height: size, borderRadius: size / 2 },
          ringStyle,
        ]}
      >
        <View
          style={[
            styles.innerCircle,
            {
              width: size - 20,
              height: size - 20,
              borderRadius: (size - 20) / 2,
              backgroundColor: bgColor,
            },
          ]}
        >
          <Text style={[technical ? styles.score : styles.statusLabel, { color: gaugeColor }]}>
            {technical ? score : label}
          </Text>
          <Text style={styles.label}>
            {technical ? 'Safety Score' : `Score ${score}/100`}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  safePulse: {
    position: 'absolute',
    backgroundColor: colors.status.safe,
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    ...typography.hero,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    textAlign: 'center',
  },
  score: {
    ...typography.hero,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  label: {
    ...typography.captionMedium,
    color: colors.neutral[700],
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
