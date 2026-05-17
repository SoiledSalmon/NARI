import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Toggle } from '../../components/ui/Toggle';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';
import { SafetyGauge } from '../../components/sensors/SafetyGauge';
import { SignalCard } from '../../components/sensors/SignalCard';
import { PulseChart } from '../../components/sensors/PulseChart';
import { StatusBackground } from '../../components/layout/StatusBackground';
import { useSensorStore } from '../../stores/sensorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { dataProvider } from '../../../dataConfig';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

const STATUS_COPY = {
  safe: 'Safe',
  alert: 'Elevated',
  danger: 'Danger',
};

export default function StatusScreen() {
  const { t } = useTranslation();
  const status = useSensorStore((s) => s.status);
  const isLoading = useSensorStore((s) => s.isLoading);
  const error = useSensorStore((s) => s.error);
  const setStatus = useSensorStore((s) => s.setStatus);
  const silentMode = useSettingsStore((s) => s.silentMode);
  const setSilentMode = useSettingsStore((s) => s.setSilentMode);
  const [waitingTooLong, setWaitingTooLong] = useState(false);

  useEffect(() => {
    const unsubscribe = dataProvider.subscribeToStatus(setStatus);
    return unsubscribe;
  }, [setStatus]);

  const sensors = status?.sensors;
  const connectivity = status?.connectivity;
  const score = status?.score ?? 0;
  const level = status?.level ?? 'safe';
  const statusLabel = STATUS_COPY[level];
  const bangleOffline = connectivity?.ble === false;
  const cloudOffline = connectivity?.net === false;
  const staleReadings = bangleOffline || cloudOffline;
  const activeSignalCount = sensors
    ? [
        !bangleOffline && sensors.heartRate,
        !bangleOffline && sensors.motion,
        sensors.audioEnv,
        !cloudOffline && sensors.stress,
      ].filter(Boolean).length
    : 0;

  useEffect(() => {
    if (!isLoading || sensors) {
      setWaitingTooLong(false);
      return undefined;
    }

    const timer = setTimeout(() => setWaitingTooLong(true), 10000);
    return () => clearTimeout(timer);
  }, [isLoading, sensors]);

  return (
    <StatusBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.kicker}>Current risk</Text>
            <Text style={styles.title}>{statusLabel}</Text>
          </View>
          <View style={styles.toggleCluster}>
            <Text style={styles.toggleLabel}>{t('status.technicalView')}</Text>
            <Toggle
              value={silentMode}
              onValueChange={setSilentMode}
              accessibilityLabel={t('status.technicalView')}
            />
          </View>
        </View>

        <View style={styles.gaugeSection}>
          <SafetyGauge score={score} level={level} size={210} technical={silentMode} />
          <Text style={styles.monitoringText}>
            NARI is monitoring {activeSignalCount} signals
          </Text>
        </View>

        {(bangleOffline || cloudOffline) && (
          <Card style={styles.warningCard}>
            <Text style={styles.warningTitle}>
              {cloudOffline
                ? "Cloud analysis unavailable. Local monitoring active."
                : "Can't reach your bangle. Showing last known readings."}
            </Text>
            <Text style={styles.warningText}>
              Keep the bangle charged and nearby. SOS remains available.
            </Text>
          </Card>
        )}

        {error && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {waitingTooLong && !sensors && (
          <Card style={styles.warningCard}>
            <Text style={styles.warningTitle}>Waiting for bangle signal</Text>
            <Text style={styles.warningText}>
              NARI will resume live readings as soon as the bangle reconnects.
            </Text>
          </Card>
        )}

        {isLoading && !sensors && (
          <View style={styles.sensorGrid}>
            <SkeletonCard style={styles.skeletonCard} />
            <SkeletonCard style={styles.skeletonCard} />
            <SkeletonCard style={styles.skeletonCard} />
            <SkeletonCard style={styles.skeletonCard} />
          </View>
        )}

        {sensors && (
          <>
            <View style={styles.sensorGrid}>
              <SignalCard
                icon="♡"
                title={t('status.heartRate')}
                reading={sensors.heartRate}
                isOffline={bangleOffline}
                isStale={staleReadings}
                technical={silentMode}
              />
              <SignalCard
                icon="↗"
                title={t('status.motion')}
                reading={sensors.motion}
                isOffline={bangleOffline}
                isStale={staleReadings}
                technical={silentMode}
              />
              <SignalCard
                icon="≋"
                title={t('status.audioEnv')}
                reading={sensors.audioEnv}
                isStale={staleReadings}
                technical={silentMode}
              />
              <SignalCard
                icon="◎"
                title={t('status.stress')}
                reading={sensors.stress}
                isOffline={cloudOffline}
                isStale={staleReadings}
                technical={silentMode}
              />
            </View>

            <Card style={styles.calibrationCard}>
              <View style={styles.calibrationHeader}>
                <Text style={styles.calibrationTitle}>{t('status.calibration')}</Text>
                <Text style={styles.calibrationPercent}>100%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
              </View>
            </Card>

            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t('status.trend24h')}</Text>
              <PulseChart
                data={sensors.heartRate.trend}
                label={t('status.heartRate')}
                unit={sensors.heartRate.unit}
                color={colors.status.safe}
              />
            </Card>
          </>
        )}
      </ScrollView>
    </StatusBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing['3xl'],
  },
  kicker: {
    ...typography.captionMedium,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
    fontSize: 34,
    lineHeight: 40,
    color: colors.neutral[900],
  },
  toggleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  toggleLabel: {
    ...typography.captionMedium,
    color: colors.neutral[700],
    letterSpacing: 0.4,
  },
  gaugeSection: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  monitoringText: {
    ...typography.body,
    color: colors.neutral[700],
    textAlign: 'center',
    marginTop: spacing['2xl'],
    maxWidth: 310,
    lineHeight: 25,
  },
  errorCard: {
    marginBottom: spacing['2xl'],
    backgroundColor: colors.status.dangerLight,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.status.danger,
  },
  warningCard: {
    marginBottom: spacing['2xl'],
    backgroundColor: colors.status.alertLight,
  },
  warningTitle: {
    ...typography.bodySemibold,
    color: colors.status.alert,
    marginBottom: spacing.xs,
  },
  warningText: {
    ...typography.bodySmall,
    color: colors.neutral[700],
    lineHeight: 21,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginBottom: spacing['3xl'],
  },
  skeletonCard: {
    width: '47%',
    flexGrow: 1,
    minHeight: 154,
  },
  calibrationCard: {
    marginBottom: spacing['3xl'],
    backgroundColor: colors.brand.linen,
  },
  calibrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  calibrationTitle: {
    ...typography.bodySemibold,
    color: colors.neutral[900],
  },
  calibrationPercent: {
    ...typography.mono,
    color: colors.status.safe,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.neutral[200],
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    borderRadius: radii.full,
    backgroundColor: colors.status.safe,
  },
  chartCard: {
    marginBottom: spacing['2xl'],
    backgroundColor: colors.neutral[0],
  },
  chartTitle: {
    ...typography.h3,
    fontSize: 20,
    lineHeight: 26,
    color: colors.neutral[900],
    marginBottom: spacing.lg,
  },
});
