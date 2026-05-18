/**
 * Button — Primary CTA component.
 * Variants: primary (dark green), outlined, text, danger.
 * Uses Reanimated spring scale + haptic feedback (per playbook Pattern 5).
 */

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { haptic } from '../../services/hapticService';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radii, shadows, minTouchable } from '../../theme/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'outlined' | 'text' | 'danger' | 'emergency';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    haptic.light();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const variantStyles = VARIANT_STYLES[variant];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.base,
        variantStyles.container,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyles.textStyle.color as string}
          size="small"
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.text,
              variantStyles.textStyle,
              icon ? { marginLeft: 8 } : undefined,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}

/* ── Variant styles ── */

const VARIANT_STYLES: Record<
  ButtonVariant,
  { container: ViewStyle; textStyle: TextStyle }
> = {
  primary: {
    container: {
      backgroundColor: colors.brand.primary,
      ...shadows.md,
    },
    textStyle: {
      color: colors.brand.cream,
    },
  },
  outlined: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.brand.primary,
    },
    textStyle: {
      color: colors.brand.primary,
    },
  },
  text: {
    container: {
      backgroundColor: 'transparent',
    },
    textStyle: {
      color: colors.brand.primary,
    },
  },
  danger: {
    container: {
      backgroundColor: colors.status.danger,
      ...shadows.md,
    },
    textStyle: {
      color: colors.brand.cream,
    },
  },
  emergency: {
    container: {
      backgroundColor: colors.brand.cream,
      ...shadows.md,
    },
    textStyle: {
      color: colors.status.danger,
    },
  },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchable.default,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: radii.full,
  },
  text: {
    ...typography.bodySemibold,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
