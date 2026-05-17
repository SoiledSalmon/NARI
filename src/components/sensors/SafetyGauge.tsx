/**
 * SafetyGauge — Circular gauge showing the composite safety score.
 * Uses Reanimated for smooth value transitions.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
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

export function SafetyGauge({ score, level, size = 180 }: SafetyGaugeProps) {
  const animatedScore = useSharedValue(0);
  const gaugeColor = LEVEL_COLORS[level];
  const bgColor = LEVEL_BG[level];

  useEffect(() => {
    animatedScore.value = withTiming(score, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [score, animatedScore]);

  const ringStyle = useAnimatedStyle(() => ({
    borderColor: gaugeColor,
    borderWidth: 8,
    opacity: 0.3 + (animatedScore.value / 100) * 0.7,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
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
          <Text style={[styles.score, { color: gaugeColor }]}>{score}</Text>
          <Text style={styles.label}>Safety Score</Text>
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
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    ...typography.hero,
    fontSize: 48,
    fontWeight: '700',
  },
  label: {
    ...typography.caption,
    color: colors.neutral[500],
    marginTop: 4,
  },
});
