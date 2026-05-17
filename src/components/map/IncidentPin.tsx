import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AlertSeverity } from '../../data/types';
import { colors } from '../../theme/colors';

interface IncidentPinProps {
  severity: AlertSeverity;
}

const SEVERITY_COLORS: Record<AlertSeverity, { bg: string; fg: string }> = {
  high: { bg: colors.status.danger, fg: colors.brand.cream },
  moderate: { bg: colors.status.alert, fg: colors.brand.cream },
  low: { bg: colors.status.safe, fg: colors.brand.cream },
};

export function IncidentPin({ severity }: IncidentPinProps) {
  const severityColor = SEVERITY_COLORS[severity];
  const appear = useSharedValue(0);

  useEffect(() => {
    appear.value = withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.quad),
    });
  }, [appear]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [{ scale: 0.86 + appear.value * 0.14 }],
  }));

  return (
    <Animated.View style={[styles.pin, { backgroundColor: severityColor.bg }, animatedStyle]}>
      <Text style={[styles.label, { color: severityColor.fg }]}>!</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.brand.cream,
  },
  label: {
    fontWeight: '800',
  },
});
