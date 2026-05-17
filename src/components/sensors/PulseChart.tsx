/**
 * PulseChart — 24-point sparkline chart for sensor trends.
 * Renders as a series of vertical bars with the most recent point highlighted.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

interface PulseChartProps {
  data: number[];
  label: string;
  unit: string;
  color?: string;
  height?: number;
}

export function PulseChart({
  data,
  label,
  unit,
  color = colors.brand.primary,
  height = 80,
}: PulseChartProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const current = data[data.length - 1];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.currentValue, { color }]}>
          {current} {unit}
        </Text>
      </View>

      <View style={[styles.chartArea, { height }]}>
        {data.map((val, i) => {
          const barHeight = Math.max(4, ((val - min) / range) * (height - 8));
          const isLast = i === data.length - 1;
          return (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: barHeight,
                  backgroundColor: isLast ? color : colors.neutral[300],
                  opacity: isLast ? 1 : 0.5 + (i / data.length) * 0.5,
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.rangeRow}>
        <Text style={styles.rangeText}>
          {min} {unit}
        </Text>
        <Text style={styles.rangeText}>
          {max} {unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.brand.linen,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmallMedium,
    color: colors.neutral[700],
  },
  currentValue: {
    ...typography.mono,
    fontWeight: '600',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginBottom: spacing.sm,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 4,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeText: {
    ...typography.monoSmall,
    color: colors.neutral[500],
  },
});
