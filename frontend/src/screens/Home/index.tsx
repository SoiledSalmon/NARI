import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../../navigation/routes';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useSensorStore } from '../../stores/sensorStore';
import { useAlertStore } from '../../stores/alertStore';
import { useJourneyStore } from '../../stores/journeyStore';
import { useAuthStore } from '../../stores/authStore';
import { useContactStore } from '../../stores/contactStore';
import { dataProvider } from '../../../dataConfig';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows, minTouchable } from '../../theme/spacing';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const API_KEY = process.env.EXPO_PUBLIC_API_SECRET_KEY || 'your-secret-key-here';

const STATUS_CONFIG = {
  safe: {
    bg: colors.status.safe,
    fg: colors.brand.cream,
    mutedFg: colors.brand.cream,
    accent: colors.status.safe,
    icon: '✓',
  },
  alert: {
    bg: colors.status.alert,
    fg: colors.brand.cream,
    mutedFg: colors.status.alertLight,
    accent: colors.status.alert,
    icon: '!',
  },
  danger: {
    bg: colors.status.danger,
    fg: colors.brand.cream,
    mutedFg: colors.status.dangerLight,
    accent: colors.status.danger,
    icon: '!',
  },
};

const SIGNALS = [
  { key: 'heartRate', label: 'HR' },
  { key: 'motion', label: 'Motion' },
] as const;

const SIGNAL_COLORS: Record<string, string> = {
  normal: colors.status.safe,
  elevated: colors.status.alert,
  critical: colors.status.danger,
};

export default function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const status = useSensorStore((s) => s.status);
  const setStatus = useSensorStore((s) => s.setStatus);
  const { recentAlerts, setRecentAlerts } = useAlertStore();
  const journeyActive = useJourneyStore((s) => s.isActive);
  const startJourney = useJourneyStore((s) => s.startJourney);
  const user = useAuthStore((s) => s.user);
  const contacts = useContactStore((s) => s.contacts);

  useEffect(() => {
    const unsubscribe = dataProvider.subscribeToStatus(setStatus);
    return unsubscribe;
  }, [setStatus]);

  useEffect(() => {
    dataProvider.getRecentAlerts(3).then(setRecentAlerts);
  }, [setRecentAlerts]);

  const level = status?.level ?? 'safe';
  const config = STATUS_CONFIG[level as keyof typeof STATUS_CONFIG];
  const connectivity = status?.connectivity;
  const sensors = status?.sensors;
  const connected = Boolean(connectivity?.ble);
  const hasLocation = connectivity?.gps !== false;
  const heroTitle = connected ? t(`home.${level}Status`) : t('home.deviceBanner');
  const heroSubtitle = connected
    ? hasLocation
      ? 'JP Nagar · 11:42 PM'
      : 'Location unavailable'
    : t('home.deviceBannerSubtitle');

  const handleStartJourney = async () => {
    const label = 'Walking Home';
    const watchingContacts = contacts.length > 0
      ? contacts.map((c) => c.name)
      : ['No contacts added'];
    startJourney(label, watchingContacts);
    navigation.navigate(ROUTES.OVERLAY.JOURNEY_ACTIVE, { label });

    if (user?.id) {
      try {
        await fetch(`${BACKEND_URL}/journey/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
          },
          body: JSON.stringify({
            userId: user.id,
            label,
            watchingContacts,
          }),
        });
      } catch (err) {
        console.warn('Failed to start journey on backend', err);
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={styles.wordmarkRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: connected ? colors.status.safe : colors.neutral[400] },
            ]}
          />
          <Text style={styles.wordmark}>{t('common.appName')}</Text>
        </View>
        <TouchableOpacity
          style={styles.bellButton}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={() => navigation.navigate(ROUTES.APP.SETTINGS)}
        >
          <Text style={styles.bellText}>⚙</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        activeOpacity={0.9} 
        accessibilityRole="button" 
        accessibilityLabel={heroTitle}
        onPress={() => navigation.navigate(ROUTES.APP.STATUS)}
      >
        <Card
          style={[
            styles.heroCard,
            { backgroundColor: connected ? config.bg : colors.neutral[700] },
          ]}
        >
          <View style={styles.heroIconWrap}>
            <View style={styles.heroIcon}>
              <Text style={styles.heroIconText}>{connected ? config.icon : '⌁'}</Text>
            </View>
          </View>
          <Text
            style={[styles.heroTitle, { color: connected ? config.fg : colors.brand.cream }]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {heroTitle}
          </Text>
          <Text
            style={[styles.heroSubtitle, { color: connected ? config.mutedFg : colors.brand.cream }]}
            numberOfLines={3}
          >
            {heroSubtitle}
          </Text>

          <View style={styles.signalRow}>
            {SIGNALS.map((signal) => {
              const reading = sensors?.[signal.key as keyof typeof sensors];
              const dotColor = reading ? SIGNAL_COLORS[reading.status] : colors.neutral[400];
              return (
                <View key={signal.key} style={styles.signalPill}>
                  <View style={[styles.signalDot, { backgroundColor: dotColor }]} />
                  <Text
                    style={[styles.signalLabel, { color: connected ? config.fg : colors.brand.cream }]}
                    numberOfLines={1}
                  >
                    {signal.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>
      </TouchableOpacity>

      {!connected && (
        <Card style={styles.deviceBanner}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerIcon}>
              <Text style={styles.bannerIconText}>⌁</Text>
            </View>
            <View style={styles.bannerText}>
              <Text style={styles.deviceTitle} numberOfLines={2}>
                {t('home.deviceBanner')}
              </Text>
              <Text style={styles.deviceSubtitle} numberOfLines={3}>
                {t('home.deviceBannerSubtitle')}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {!journeyActive ? (
        <Card style={styles.journeyCard}>
          <View style={styles.journeyAccent} />
          <View style={styles.journeyContent}>
            <View style={styles.journeyIcon}>
              <Text style={styles.journeyIconText}>↗</Text>
            </View>
            <View style={styles.journeyText}>
              <Text style={styles.journeyTitle} numberOfLines={2}>
                {t('home.journeyTitle')}
              </Text>
              <Text style={styles.journeySubtitle} numberOfLines={4}>
                {t('home.journeySubtitle')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.journeyButton}
              accessibilityRole="button"
              accessibilityLabel="Start Journey"
              onPress={handleStartJourney}
            >
              <Text style={styles.journeyButtonLabel}>Start</Text>
              <Text style={styles.journeyButtonText}>→</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ) : (
        <Card style={[styles.journeyCard, styles.journeyActiveCard]}>
          <View style={styles.journeyActiveTop}>
            <Badge label={t('home.journeyActive')} preset="nari" />
            <Text style={styles.journeyActiveTime}>12 min</Text>
          </View>
          <Text style={styles.journeyTitle} numberOfLines={2}>
            Journey mode is active
          </Text>
          <Text style={styles.journeySubtitle} numberOfLines={4}>
            {t('home.journeyWatching', { contacts: contacts.length > 0 ? contacts.map(c => c.name).join(', ') : 'No contacts' })}
          </Text>
          <TouchableOpacity
            style={styles.arrivedButton}
            accessibilityRole="button"
            accessibilityLabel="I've Arrived Safely"
            onPress={() => navigation.navigate(ROUTES.OVERLAY.JOURNEY_ACTIVE, { label: 'Walking Home' })}
          >
            <Text style={styles.arrivedButtonText}>View Journey</Text>
          </TouchableOpacity>
        </Card>
      )}

      {recentAlerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.recentAlerts')}</Text>
            <TouchableOpacity 
              accessibilityRole="button" 
              accessibilityLabel="View all alerts"
              onPress={() => navigation.navigate(ROUTES.APP.SETTINGS, { screen: ROUTES.SETTINGS_STACK.ALERT_HISTORY })}
            >
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          {recentAlerts.slice(0, 2).map((alert) => (
            <Card key={alert.id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <View style={styles.alertIcon}>
                  <Text style={styles.alertIconText}>!</Text>
                </View>
                <View style={styles.alertText}>
                  <Text style={styles.alertTitle} numberOfLines={2}>
                    {alert.title}
                  </Text>
                  <Text style={styles.alertDesc} numberOfLines={2}>
                    {alert.description}
                  </Text>
                </View>
                <Text style={styles.alertTime}>
                  {new Date(alert.timestamp).toLocaleDateString()}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      <View style={styles.connectivityPanel}>
        <Text style={styles.panelTitle}>Signal status</Text>
        <View style={styles.connectivityDots}>
          <View style={styles.connectivityItem}>
            <View
              style={[
                styles.dot,
                { backgroundColor: connectivity?.gps ? colors.connectivity.gps : colors.connectivity.inactive },
              ]}
            />
            <Text style={styles.dotLabel}>{t('home.gps')}</Text>
          </View>
          <View style={styles.connectivityItem}>
            <View
              style={[
                styles.dot,
                { backgroundColor: connectivity?.ble ? colors.connectivity.ble : colors.connectivity.inactive },
              ]}
            />
            <Text style={styles.dotLabel}>{t('home.ble')}</Text>
          </View>
          <View style={styles.connectivityItem}>
            <View
              style={[
                styles.dot,
                { backgroundColor: connectivity?.net ? colors.connectivity.net : colors.connectivity.inactive },
              ]}
            />
            <Text style={styles.dotLabel}>{t('home.net')}</Text>
          </View>
        </View>
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
    paddingTop: spacing['3xl'],
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  wordmark: {
    ...typography.h1,
    fontSize: 32,
    lineHeight: 38,
    color: colors.neutral[900],
    letterSpacing: 1,
  },
  bellButton: {
    width: minTouchable.default,
    height: minTouchable.default,
    borderRadius: minTouchable.default / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.linen,
  },
  bellText: {
    ...typography.h3,
    color: colors.brand.primary,
  },
  heroCard: {
    minHeight: 330,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['4xl'],
    ...shadows.lg,
  },
  heroIconWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay.white40,
    marginBottom: spacing['2xl'],
  },
  heroIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay.white40,
  },
  heroIconText: {
    fontSize: 34,
    color: colors.brand.cream,
    fontWeight: '700',
  },
  heroTitle: {
    ...typography.hero,
    fontSize: 42,
    lineHeight: 50,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  heroSubtitle: {
    ...typography.body,
    opacity: 0.86,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    lineHeight: 26,
  },
  signalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  signalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: 'rgba(26,26,26,0.24)',
    gap: spacing.sm,
  },
  signalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.overlay.white80,
  },
  signalLabel: {
    ...typography.captionMedium,
    letterSpacing: 0.7,
  },
  deviceBanner: {
    marginBottom: spacing['2xl'],
    backgroundColor: colors.brand.sand,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[200],
  },
  bannerIconText: {
    ...typography.h3,
    color: colors.neutral[700],
  },
  bannerText: {
    flex: 1,
    minWidth: 0,
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
  journeyCard: {
    marginBottom: spacing['2xl'],
    padding: 0,
  },
  journeyAccent: {
    position: 'absolute',
    right: -42,
    top: -54,
    width: 142,
    height: 142,
    borderRadius: 71,
    backgroundColor: colors.utility.infoLight,
  },
  journeyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing['2xl'],
    gap: spacing.md,
  },
  journeyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.utility.infoLight,
  },
  journeyIconText: {
    ...typography.h2,
    color: colors.brand.primary,
  },
  journeyText: {
    flex: 1,
    minWidth: 0,
  },
  journeyTitle: {
    ...typography.h3,
    fontSize: 20,
    lineHeight: 26,
    color: colors.neutral[900],
    marginBottom: 4,
  },
  journeySubtitle: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    lineHeight: 21,
  },
  journeyButton: {
    minWidth: 56,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.sand,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  journeyButtonLabel: {
    ...typography.caption,
    color: colors.brand.primary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  journeyButtonText: {
    ...typography.h2,
    color: colors.brand.primary,
  },
  journeyActiveCard: {
    backgroundColor: colors.status.safeLight,
    padding: spacing['2xl'],
  },
  journeyActiveTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  journeyActiveTime: {
    ...typography.mono,
    color: colors.status.safe,
    fontVariant: ['tabular-nums'],
  },
  arrivedButton: {
    minHeight: 52,
    borderRadius: radii.full,
    backgroundColor: colors.status.safe,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  arrivedButtonText: {
    ...typography.bodySemibold,
    color: colors.brand.cream,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 23,
    lineHeight: 30,
    color: colors.neutral[900],
  },
  viewAllText: {
    ...typography.captionMedium,
    color: colors.brand.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  alertCard: {
    marginBottom: spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  alertIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.alertLight,
  },
  alertIconText: {
    ...typography.h3,
    color: colors.status.alert,
  },
  alertText: {
    flex: 1,
    minWidth: 0,
  },
  alertTitle: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
    lineHeight: 23,
  },
  alertDesc: {
    ...typography.bodySmall,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  alertTime: {
    ...typography.caption,
    color: colors.neutral[500],
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  connectivityPanel: {
    marginTop: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[200],
  },
  panelTitle: {
    ...typography.captionMedium,
    color: colors.neutral[500],
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  connectivityDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  connectivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotLabel: {
    ...typography.monoSmall,
    color: colors.neutral[500],
    flexShrink: 1,
  },
});
