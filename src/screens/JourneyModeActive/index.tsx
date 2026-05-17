/**
 * JourneyModeActive — Full-screen overlay during live walk tracking.
 * Shows elapsed time, watching contacts, and "I've Arrived" action.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../navigation/routes';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useJourneyMode } from '../../hooks/useJourneyMode';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows } from '../../theme/spacing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'JourneyActive'>;

export default function JourneyModeActiveScreen({
  route,
  navigation,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isActive, label, watchingContacts, formattedTime, end } =
    useJourneyMode();

  const handleArrived = () => {
    end();
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Top badge */}
      <View style={styles.activeBadge}>
        <View style={styles.liveIndicator} />
        <Text style={styles.activeBadgeText}>{t('journey.active')}</Text>
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>{label || 'Walking Home'}</Text>
        <Text style={styles.timerValue}>{formattedTime}</Text>
      </View>

      {/* Watching contacts */}
      <Card style={styles.watchingCard}>
        <Text style={styles.watchingLabel}>{t('journey.watching')}</Text>
        {watchingContacts.map((name, i) => (
          <View key={i} style={styles.contactRow}>
            <View style={styles.contactDot} />
            <Text style={styles.contactName}>{name}</Text>
          </View>
        ))}
      </Card>

      {/* Location sharing indicator */}
      <View style={styles.sharingRow}>
        <Text style={styles.sharingIcon}>📍</Text>
        <Text style={styles.sharingText}>{t('journey.locationShared')}</Text>
      </View>

      {/* Map placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapIcon}>🗺️</Text>
        <Text style={styles.mapText}>Live location preview</Text>
      </View>

      {/* Arrived button */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 20 }]}>
        <Button
          title={t('journey.arrived')}
          onPress={handleArrived}
          style={styles.arrivedButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.cream,
    paddingHorizontal: spacing.xl,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.status.safeLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    gap: spacing.sm,
    marginBottom: spacing['3xl'],
  },
  liveIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.status.safe,
  },
  activeBadgeText: {
    ...typography.captionMedium,
    color: colors.status.safe,
    letterSpacing: 1,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  timerLabel: {
    ...typography.bodyMedium,
    color: colors.neutral[700],
    marginBottom: spacing.md,
  },
  timerValue: {
    ...typography.hero,
    fontSize: 56,
    color: colors.neutral[900],
    fontVariant: ['tabular-nums'],
    letterSpacing: 4,
  },
  watchingCard: {
    marginBottom: spacing['2xl'],
  },
  watchingLabel: {
    ...typography.captionMedium,
    color: colors.neutral[500],
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  contactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.safe,
  },
  contactName: {
    ...typography.body,
    color: colors.neutral[900],
  },
  sharingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  sharingIcon: {
    fontSize: 16,
  },
  sharingText: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  mapIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  mapText: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
  bottomActions: {
    paddingTop: spacing['2xl'],
  },
  arrivedButton: {
    backgroundColor: colors.status.safe,
  },
});
