import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { haptic } from '../../services/hapticService';
import { colors } from '../../theme/colors';
import { minTouchable, radii } from '../../theme/spacing';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export function Toggle({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  style,
}: ToggleProps) {
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(value ? 24 : 0, { duration: 180 }) }],
  }));

  const handlePress = () => {
    haptic.selection();
    onValueChange(!value);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={[styles.hitTarget, disabled && styles.disabled, style]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.track, value ? styles.trackOn : styles.trackOff]}>
        <Animated.View style={[styles.knob, knobStyle]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitTarget: {
    minWidth: minTouchable.default,
    minHeight: minTouchable.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: 56,
    height: 32,
    borderRadius: radii.full,
    padding: 3,
  },
  trackOn: {
    backgroundColor: colors.brand.primary,
  },
  trackOff: {
    backgroundColor: colors.neutral[300],
  },
  knob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.neutral[0],
  },
  disabled: {
    opacity: 0.5,
  },
});
