/**
 * Chip — Selectable filter pill.
 * Used on the Map screen for severity filters.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { haptic } from '../../services/hapticService';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function Chip({ label, selected = false, onPress, style }: ChipProps) {
  const handlePress = () => {
    haptic.selection();
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected ? styles.chipActive : styles.chipInactive,
        style,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.label, selected ? styles.labelActive : styles.labelInactive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  chipInactive: {
    backgroundColor: colors.brand.linen,
    borderColor: colors.neutral[300],
  },
  label: {
    ...typography.bodySmallMedium,
  },
  labelActive: {
    color: colors.neutral[0],
  },
  labelInactive: {
    color: colors.neutral[700],
  },
});
