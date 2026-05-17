/**
 * SignalCard — Individual sensor reading card for the Status screen.
 * Shows icon, value, unit, label, and an optional mini-trend bar.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { SensorReading } from '../../data/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface SignalCardProps {
  icon: string;
  title: string;
  reading: SensorReading;
}

const STATUS_COLORS = {
  normal: colors.status.safe,
  elevated: colors.status.alert,
  critical: colors.status.danger,
};

export function SignalCard({ icon, title, reading }: SignalCardProps) {
  const statusColor = STATUS_COLORS[reading.status];

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>
      <Text style={styles.value}>{reading.value}</Text>
      <Text style={styles.unit}>{reading.unit}</Text>
      <Text style={styles.label}>{title}</Text>

      {/* Mini trend bar */}
      {reading.trend.length > 0 && (
        <View style={styles.trendContainer}>
          {reading.trend.slice(-12).map((val, i) => {
            const max = Math.max(...reading.trend);
            const min = Math.min(...reading.trend);
            const range = max - min || 1;
            const height = Math.max(4, ((val - min) / range) * 24);
            return (
              <View
                key={i}
                style={[
                  styles.trendBar,
                  {
                    height,
                    backgroundColor:
                      i === reading.trend.slice(-12).length - 1
                        ? statusColor
                        : colors.neutral[300],
                  },
                ]}
              />
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 22,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  value: {
    ...typography.h2,
    color: colors.neutral[900],
    marginBottom: 2,
  },
  unit: {
    ...typography.monoSmall,
    color: colors.neutral[500],
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.neutral[500],
    marginBottom: spacing.sm,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 28,
    width: '100%',
    justifyContent: 'center',
  },
  trendBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 4,
  },
});
