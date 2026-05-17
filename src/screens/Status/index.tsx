import React, { useEffect } from 'react';
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
import { spacing } from '../../theme/spacing';

export default function StatusScreen() {
  const { t } = useTranslation();
  const status = useSensorStore((s) => s.status);
  const isLoading = useSensorStore((s) => s.isLoading);
  const error = useSensorStore((s) => s.error);
  const setStatus = useSensorStore((s) => s.setStatus);
  const silentMode = useSettingsStore((s) => s.silentMode);
  const setSilentMode = useSettingsStore((s) => s.setSilentMode);

  useEffect(() => {
    const unsubscribe = dataProvider.subscribeToStatus(setStatus);
    return unsubscribe;
  }, [setStatus]);

  const sensors = status?.sensors;
  const score = status?.score ?? 0;
  const level = status?.level ?? 'safe';

  return (
    <StatusBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('status.title')}</Text>
          <Toggle
            value={silentMode}
            onValueChange={setSilentMode}
            accessibilityLabel={t('status.technicalView')}
          />
        </View>

        <Card style={styles.gaugeCard}>
          <SafetyGauge score={score} level={level} />
          <Text style={styles.monitoringText}>
            NARI is monitoring {sensors ? 4 : 0} signals
          </Text>
        </Card>

        {error && (
          <Card style={styles.chartCard}>
            <Text style={styles.errorText}>{error}</Text>
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
                icon="HR"
                title={t('status.heartRate')}
                reading={sensors.heartRate}
              />
              <SignalCard
                icon="MV"
                title={t('status.motion')}
                reading={sensors.motion}
              />
              <SignalCard
                icon="AU"
                title={t('status.audioEnv')}
                reading={sensors.audioEnv}
              />
              <SignalCard
                icon="ST"
                title={t('status.stress')}
                reading={sensors.stress}
              />
            </View>

            <Card style={styles.chartCard}>
              <Text style={styles.techTitle}>{t('status.trend24h')}</Text>
              <PulseChart
                data={sensors.heartRate.trend}
                label={t('status.heartRate')}
                unit={sensors.heartRate.unit}
                color={colors.status.safe}
              />
            </Card>

            <Card style={styles.chartCard}>
              <Text style={styles.techTitle}>{t('status.calibration')}</Text>
              <Text style={styles.techSubtitle}>
                {t('status.calibrationSubtitle')}
              </Text>
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
    paddingTop: 60,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['2xl'],
  },
  title: {
    ...typography.h1,
    color: colors.neutral[900],
  },
  gaugeCard: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    marginBottom: spacing['2xl'],
  },
  monitoringText: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    marginTop: spacing.lg,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  chartCard: {
    marginBottom: spacing['2xl'],
  },
  skeletonCard: {
    width: '48%',
    flexGrow: 1,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.status.danger,
  },
  techTitle: {
    ...typography.h3,
    color: colors.neutral[900],
    marginBottom: spacing.md,
  },
  techSubtitle: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
});
