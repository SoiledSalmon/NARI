import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useSensorStore } from '../../stores/sensorStore';
import { useAlertStore } from '../../stores/alertStore';
import { useAuthStore } from '../../stores/authStore';
import { useJourneyStore } from '../../stores/journeyStore';
import { dataProvider } from '../../../dataConfig';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows } from '../../theme/spacing';

const STATUS_CONFIG = {
  safe: {
    bg: colors.status.safeLight,
    accent: colors.status.safe,
    icon: '✓',
  },
  alert: {
    bg: colors.status.alertLight,
    accent: colors.status.alert,
    icon: '⚠',
  },
  danger: {
    bg: colors.status.dangerLight,
    accent: colors.status.danger,
    icon: '!',
  },
};

export default function HomeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const status = useSensorStore((s) => s.status);
  const setStatus = useSensorStore((s) => s.setStatus);
  const { recentAlerts, setRecentAlerts } = useAlertStore();
  const journeyActive = useJourneyStore((s) => s.isActive);

  // Subscribe to status updates
  useEffect(() => {
    const unsubscribe = dataProvider.subscribeToStatus(setStatus);
    return unsubscribe;
  }, [setStatus]);

  // Load recent alerts
  useEffect(() => {
    dataProvider.getRecentAlerts(3).then(setRecentAlerts);
  }, [setRecentAlerts]);

  const level = status?.level ?? 'safe';
  const config = STATUS_CONFIG[level];
  const connectivity = status?.connectivity;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {t('home.greeting', { name: user?.name ?? 'User' })}
        </Text>
        <View style={styles.connectivityDots}>
          <View style={[styles.dot, { backgroundColor: connectivity?.gps ? colors.connectivity.gps : colors.connectivity.inactive }]} />
          <Text style={styles.dotLabel}>{t('home.gps')}</Text>
          <View style={[styles.dot, { backgroundColor: connectivity?.ble ? colors.connectivity.ble : colors.connectivity.inactive }]} />
          <Text style={styles.dotLabel}>{t('home.ble')}</Text>
          <View style={[styles.dot, { backgroundColor: connectivity?.net ? colors.connectivity.net : colors.connectivity.inactive }]} />
          <Text style={styles.dotLabel}>{t('home.net')}</Text>
        </View>
      </View>

      {/* Hero Status Card */}
      <Card style={[styles.heroCard, { backgroundColor: config.bg }]}>
        <View style={styles.heroRow}>
          <View style={[styles.heroIcon, { backgroundColor: config.accent }]}>
            <Text style={styles.heroIconText}>{config.icon}</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={[styles.heroTitle, { color: config.accent }]}>
              {t(`home.${level}Status`)}
            </Text>
            <Text style={styles.heroSubtitle}>
              {t(`home.${level}Subtitle`)}
            </Text>
          </View>
        </View>
        {status && (
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreLabel, { color: config.accent }]}>
              Safety Score
            </Text>
            <Text style={[styles.scoreValue, { color: config.accent }]}>
              {status.score}/100
            </Text>
          </View>
        )}
      </Card>

      {/* Journey Card */}
      {!journeyActive ? (
        <Card style={styles.journeyCard}>
          <Text style={styles.journeyTitle}>{t('home.journeyTitle')}</Text>
          <Text style={styles.journeySubtitle}>
            {t('home.journeySubtitle')}
          </Text>
          <TouchableOpacity style={styles.journeyButton}>
            <Text style={styles.journeyButtonText}>Start →</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <Card style={[styles.journeyCard, { backgroundColor: colors.status.safeLight }]}>
          <Badge label={t('home.journeyActive')} preset="nari" />
        </Card>
      )}

      {/* Device Banner */}
      <Card style={styles.deviceBanner}>
        <Text style={styles.deviceTitle}>{t('home.deviceBanner')}</Text>
        <Text style={styles.deviceSubtitle}>
          {t('home.deviceBannerSubtitle')}
        </Text>
      </Card>

      {/* Recent Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.recentAlerts')}</Text>
        {recentAlerts.length === 0 ? (
          <Card>
            <Text style={styles.emptyTitle}>{t('home.noAlerts')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('home.noAlertsSubtitle')}
            </Text>
          </Card>
        ) : (
          recentAlerts.map((alert) => (
            <Card key={alert.id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Badge
                  label={alert.outcome === 'resolved' ? 'RESOLVED' : 'FALSE ALARM'}
                  preset={alert.outcome === 'resolved' ? 'resolved' : 'falseAlarm'}
                />
              </View>
              <Text style={styles.alertDesc}>{alert.description}</Text>
              <Text style={styles.alertTime}>
                {new Date(alert.timestamp).toLocaleDateString()}
              </Text>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.cream,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: 100, // space above tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  greeting: {
    ...typography.h1,
    color: colors.neutral[900],
    flex: 1,
  },
  connectivityDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotLabel: {
    ...typography.monoSmall,
    color: colors.neutral[500],
    marginRight: 6,
  },
  heroCard: {
    marginBottom: spacing.lg,
    padding: spacing.xl,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  heroIconText: {
    fontSize: 22,
    color: colors.neutral[0],
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    ...typography.h2,
    marginBottom: 2,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: colors.neutral[700],
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[300],
  },
  scoreLabel: {
    ...typography.captionMedium,
  },
  scoreValue: {
    ...typography.mono,
    fontWeight: '700',
  },
  journeyCard: {
    marginBottom: spacing.lg,
  },
  journeyTitle: {
    ...typography.h3,
    color: colors.neutral[900],
    marginBottom: 4,
  },
  journeySubtitle: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    marginBottom: spacing.lg,
  },
  journeyButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.full,
  },
  journeyButtonText: {
    ...typography.bodySmallMedium,
    color: colors.neutral[0],
  },
  deviceBanner: {
    marginBottom: spacing.lg,
    backgroundColor: colors.brand.sand,
  },
  deviceTitle: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
    marginBottom: 4,
  },
  deviceSubtitle: {
    ...typography.caption,
    color: colors.neutral[500],
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.neutral[900],
    marginBottom: spacing.lg,
  },
  alertCard: {
    marginBottom: spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  alertTitle: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
    flex: 1,
  },
  alertDesc: {
    ...typography.bodySmall,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  alertTime: {
    ...typography.caption,
    color: colors.neutral[500],
  },
  emptyTitle: {
    ...typography.bodyMedium,
    color: colors.neutral[700],
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});
