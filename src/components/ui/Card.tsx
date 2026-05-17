/**
 * Card — Glassmorphism-style surface component.
 * 20px border radius, soft shadow, linen background.
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../../theme/colors';
import { radii, shadows, spacing } from '../../theme/spacing';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'danger';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[styles.base, VARIANT_STYLES[variant], style]}>
      {children}
    </View>
  );
}

const VARIANT_STYLES: Record<string, ViewStyle> = {
  default: {
    backgroundColor: colors.brand.linen,
    ...shadows.sm,
  },
  elevated: {
    backgroundColor: colors.neutral[0],
    ...shadows.md,
  },
  danger: {
    backgroundColor: colors.status.dangerLight,
    ...shadows.sm,
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    overflow: 'hidden',
  },
});
