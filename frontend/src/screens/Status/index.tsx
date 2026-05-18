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

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const API_KEY = process.env.EXPO_PUBLIC_API_SECRET_KEY || 'your-secret-key-here';

const STATUS_COPY: Record<string, string> = {
  safe: 'Safe',
  alert: 'Elevated',
  danger: 'Danger',
};

interface DebugSnapshot {
  lstm_buffer_fill: number;
  tcn_buffer_fill: number;
  lstm_last_latency_ms: number;
  tcn_last_latency_ms: number;
  lstm_logits: number[] | null;
  tcn_logits: number[] | null;
  connected: boolean;
}

export default function StatusScreen() {
  const { t } = useTranslation();
  const status = useSensorStore((s) => s.status);
  const isLoading = useSensorStore((s) => s.isLoading);
  const error = useSensorStore((s) => s.error);
  const setStatus = useSensorStore((s) => s.setStatus);
  const technicalView = useSettingsStore((s) => s.silentMode); // currently overloaded
  const setTechnicalView = useSettingsStore((s) => s.setSilentMode);
  const [waitingTooLong, setWaitingTooLong] = useState(false);
  const [debugData, setDebugData] = useState<DebugSnapshot | null>(null);

  useEffect(() => {
    const unsubscribe = dataProvider.subscribeToStatus(setStatus);
    return unsubscribe;
  }, [setStatus]);

  useEffect(() => {
    if (!technicalView) return;
    let interval = setInterval(async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/status/debug`, {
          headers: { 'X-API-Key': API_KEY },
        });
        if (response.ok) {
          const data: DebugSnapshot = await response.json();
          setDebugData(data);
        }
      } catch (err) {
        console.warn('Debug fetch failed', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [technicalView]);

  const sensors = status?.sensors;
  const connectivity = status?.connectivity;
  const score = status?.score ?? 0;
  const level = status?.level ?? 'safe';
  const beltOffline = connectivity?.ble === false;
  const cloudOffline = connectivity?.net === false;
  const staleReadings = beltOffline || cloudOffline;

  let displayStatus = STATUS_COPY[level] || 'Unknown';
  if (beltOffline) {
    displayStatus = 'N/A';
  } else if (score === 0 && sensors) {
    displayStatus = 'Calibrating...';
  }
  const activeSignalCount = sensors
    ? [
        !beltOffline && sensors.heartRate,
        !beltOffline && sensors.motion,
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
            <Text style={styles.title}>{displayStatus}</Text>
          </View>
          <View style={styles.toggleCluster}>
            <Text style={styles.toggleLabel}>Technical View</Text>
            <Toggle
              value={technicalView}
              onValueChange={setTechnicalView}
              accessibilityLabel="Technical View"
            />
          </View>
        </View>

        {technicalView ? (
          <View style={styles.debugSection}>
            <Text style={styles.debugSectionTitle}>System Telemetry</Text>
            
            <Card style={styles.debugCard}>
              <Text style={styles.debugCardTitle}>TCN Pipeline (Motion)</Text>
              <Text style={styles.debugText}>Buffer: {debugData?.tcn_buffer_fill.toFixed(1) ?? 0}%</Text>
              <Text style={styles.debugText}>Latency: {debugData?.tcn_last_latency_ms ?? 0}ms</Text>
              <Text style={styles.debugText}>Logits: {debugData?.tcn_logits ? debugData.tcn_logits.map(v => v.toFixed(2)).join(', ') : 'N/A'}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${debugData?.tcn_buffer_fill ?? 0}%`, backgroundColor: colors.status.alert }]} />
              </View>
            </Card>

            <Card style={styles.debugCard}>
              <Text style={styles.debugCardTitle}>LSTM Pipeline (Stress)</Text>
              <Text style={styles.debugText}>Buffer: {debugData?.lstm_buffer_fill.toFixed(1) ?? 0}%</Text>
              <Text style={styles.debugText}>Latency: {debugData?.lstm_last_latency_ms ?? 0}ms</Text>
              <Text style={styles.debugText}>Logits: {debugData?.lstm_logits ? debugData.lstm_logits.map(v => v.toFixed(2)).join(', ') : 'N/A'}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${debugData?.lstm_buffer_fill ?? 0}%`, backgroundColor: colors.utility.info }]} />
              </View>
            </Card>
            
            <Card style={styles.debugCard}>
              <Text style={styles.debugCardTitle}>Connection State</Text>
              <Text style={styles.debugText}>Backend: {debugData?.connected ? 'Online' : 'Offline'}</Text>
              <Text style={styles.debugText}>Belt: {beltOffline ? 'Disconnected' : 'Connected'}</Text>
            </Card>
          </View>
        ) : (
          <>
            <View style={styles.gaugeSection}>
              <SafetyGauge score={score} level={level as any} size={210} technical={technicalView} />
              <Text style={styles.monitoringText}>
                NARI is monitoring {activeSignalCount} signals
              </Text>
            </View>

            {(beltOffline || cloudOffline) && (
              <Card style={styles.warningCard}>
                <Text style={styles.warningTitle}>
                  {cloudOffline
                    ? "Cloud analysis unavailable. Local monitoring active."
                    : "Can't reach your belt. Showing last known readings."}
                </Text>
                <Text style={styles.warningText}>
                  Keep the belt charged and nearby. SOS remains available.
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
                <Text style={styles.warningTitle}>Waiting for belt signal</Text>
                <Text style={styles.warningText}>
                  NARI will resume live readings as soon as the belt reconnects.
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
                    isOffline={beltOffline}
                    isStale={staleReadings}
                    technical={technicalView}
                  />
                  <SignalCard
                    icon="↗"
                    title={t('status.motion')}
                    reading={sensors.motion}
                    isOffline={beltOffline}
                    isStale={staleReadings}
                    technical={technicalView}
                  />
                  <SignalCard
                    icon="≋"
                    title={t('status.audioEnv')}
                    reading={sensors.audioEnv}
                    isStale={staleReadings}
                    technical={technicalView}
                  />
                  {/* Removed standalone stress card as per instructions */}
                </View>

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
  progressTrack: {
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.neutral[200],
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.full,
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
  debugSection: {
    marginBottom: spacing['3xl'],
  },
  debugSectionTitle: {
    ...typography.h3,
    color: colors.neutral[900],
    marginBottom: spacing.lg,
  },
  debugCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[200],
    borderWidth: 1,
  },
  debugCardTitle: {
    ...typography.bodySemibold,
    color: colors.neutral[900],
    marginBottom: spacing.sm,
  },
  debugText: {
    ...typography.mono,
    fontSize: 12,
    color: colors.neutral[700],
    marginBottom: spacing.xs,
  },
});
