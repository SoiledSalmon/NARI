/**
 * SignalCard - Individual sensor reading card for the Status screen.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { SensorReading } from '../../data/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

interface SignalCardProps {
  icon: string;
  title: string;
  reading: SensorReading;
  isOffline?: boolean;
  isStale?: boolean;
  technical?: boolean;
}

const STATUS_COLORS = {
  normal: colors.status.safe,
  elevated: colors.status.alert,
  critical: colors.status.danger,
};

const STATUS_BG = {
  normal: colors.status.safeLight,
  elevated: colors.status.alertLight,
  critical: colors.status.dangerLight,
};

export function SignalCard({
  icon,
  title,
  reading,
  isOffline = false,
  isStale = false,
  technical = false,
}: SignalCardProps) {
  const statusColor = isOffline ? colors.neutral[500] : STATUS_COLORS[reading.status];
  const statusBg = isOffline ? colors.neutral[100] : STATUS_BG[reading.status];
  const minutesAgo = Math.max(1, Math.floor((Date.now() - reading.lastUpdated) / 60000));
  const stateLabel = isOffline
    ? 'Signal offline'
    : isStale
      ? `Last updated ${minutesAgo} min ago`
      : reading.label;

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <Text style={[styles.icon, { color: statusColor }]}>{icon}</Text>
        <View style={[styles.valuePill, { backgroundColor: statusBg }]}>
          <Text style={[styles.valueText, { color: statusColor }]}>
            {reading.value} {reading.unit}
          </Text>
        </View>
      </View>

      <View style={styles.copyBlock}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.label, isOffline && styles.offlineLabel]} numberOfLines={3}>
          {stateLabel}
        </Text>
      </View>

      {technical && !isOffline && (
        <Text style={styles.technicalText} numberOfLines={2}>
          {reading.value} {reading.unit} / {reading.status}
        </Text>
      )}

      {!isOffline && reading.trend.length > 0 && (
        <View style={styles.trendContainer}>
          {reading.trend.slice(-10).map((val, i) => {
            const max = Math.max(...reading.trend);
            const min = Math.min(...reading.trend);
            const range = max - min || 1;
            const height = Math.max(5, ((val - min) / range) * 22);
            return (
              <View
                key={i}
                style={[
                  styles.trendBar,
                  {
                    height,
                    backgroundColor:
                      i === reading.trend.slice(-10).length - 1
                        ? statusColor
                        : colors.neutral[200],
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
    width: '47%',
    flexGrow: 1,
    minHeight: 170,
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.neutral[0],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 26,
  },
  valuePill: {
    minHeight: 34,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    ...typography.monoSmall,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
  },
  copyBlock: {
    marginTop: spacing['2xl'],
  },
  title: {
    ...typography.h3,
    fontSize: 19,
    lineHeight: 25,
    color: colors.neutral[900],
    marginBottom: 2,
  },
  label: {
    ...typography.bodySmall,
    color: colors.neutral[700],
    lineHeight: 21,
  },
  offlineLabel: {
    color: colors.neutral[500],
  },
  technicalText: {
    ...typography.monoSmall,
    color: colors.neutral[500],
    marginTop: spacing.md,
    lineHeight: 17,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 28,
    marginTop: spacing.lg,
  },
  trendBar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 5,
  },
});
