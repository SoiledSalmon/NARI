import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { haptic } from '../../services/hapticService';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface CountdownRingProps {
  duration: number;
  onComplete: () => void;
  size?: number;
}

export function CountdownRing({
  duration,
  onComplete,
  size = 208,
}: CountdownRingProps) {
  const [remaining, setRemaining] = useState(duration);
  const progress = useSharedValue(1);
  const ringSize = useMemo(() => size, [size]);

  useEffect(() => {
    progress.value = withTiming(0, { duration: duration * 1000 });
  }, [duration, progress]);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete();
      return;
    }

    haptic.warning();
    const timer = setTimeout(() => setRemaining((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onComplete]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value }],
    opacity: 0.18 + progress.value * 0.22,
  }));

  return (
    <View style={[styles.outer, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}>
      <Animated.View style={[styles.fill, fillStyle]} />
      <View style={[styles.inner, { width: ringSize - 26, height: ringSize - 26, borderRadius: (ringSize - 26) / 2 }]}>
        <Text style={styles.number} adjustsFontSizeToFit numberOfLines={1}>{remaining}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 8,
    borderColor: colors.status.dangerLight,
    overflow: 'hidden',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.status.dangerLight,
    borderRadius: 999,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.dangerLight,
  },
  number: {
    ...typography.hero,
    fontSize: 72,
    color: colors.status.danger,
    fontWeight: '700',
    textAlign: 'center',
  },
});
