/**
 * Badge — Small pill-shaped label.
 * Used for: NARI/SMS contact labels, RESOLVED/FALSE ALARM outcome chips.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radii, spacing } from '../../theme/spacing';

type BadgePreset = 'nari' | 'sms' | 'resolved' | 'falseAlarm' | 'required' | 'optional';

interface BadgeProps {
  label: string;
  preset?: BadgePreset;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

export function Badge({
  label,
  preset,
  backgroundColor,
  textColor,
  style,
}: BadgeProps) {
  const presetStyle = preset ? PRESETS[preset] : undefined;
  const bg = backgroundColor ?? presetStyle?.bg ?? colors.neutral[200];
  const fg = textColor ?? presetStyle?.fg ?? colors.neutral[700];

  return (
    <View style={[styles.container, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const PRESETS: Record<BadgePreset, { bg: string; fg: string }> = {
  nari: { bg: colors.badge.nari, fg: colors.badge.nariFg },
  sms: { bg: colors.badge.sms, fg: colors.badge.smsFg },
  resolved: { bg: colors.badge.resolved, fg: colors.badge.resolvedFg },
  falseAlarm: { bg: colors.badge.falseAlarm, fg: colors.badge.falseAlarmFg },
  required: { bg: colors.status.dangerLight, fg: colors.status.danger },
  optional: { bg: colors.neutral[100], fg: colors.neutral[500] },
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.captionMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    lineHeight: 15,
  },
});
