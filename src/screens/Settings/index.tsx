import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Toggle } from '../../components/ui/Toggle';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { useContactStore } from '../../stores/contactStore';
import { dataProvider } from '../../../dataConfig';
import { SettingsStackParamList, ROUTES } from '../../navigation/routes';
import { useDemoMode } from '../../hooks/useDemoMode';
import { haptic } from '../../services/hapticService';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows } from '../../theme/spacing';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<SettingsStackParamList>>();
  const {
    device,
    setDevice,
    locationSharing,
    setLocationSharing,
    silentMode,
    setSilentMode,
  } = useSettingsStore();
  const contactCount = useContactStore((s) => s.contacts.length);
  const logout = useAuthStore((s) => s.logout);
  const demoTapCount = useRef(0);
  const demoMode = useDemoMode();
  const deviceConnected = device?.isConnected === true;
  const deviceDisconnected = device?.isConnected === false;
  const deviceStatusLabel = device
    ? deviceConnected
      ? t('settings.deviceConnected')
      : 'Not paired'
    : 'Checking';

  useEffect(() => {
    dataProvider.getDeviceState().then(setDevice);
  }, [setDevice]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.title}>{t('settings.title')}</Text>
      <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>

      {/* Device Section */}
      <Text style={styles.sectionLabel}>{t('settings.deviceSection')}</Text>
      <Card style={[styles.deviceCard, deviceDisconnected && styles.deviceCardDisconnected]}>
        <View style={styles.deviceRow}>
          <View style={[styles.deviceIcon, deviceDisconnected && styles.deviceIconDisconnected]}>
            <Text style={styles.deviceEmoji}>⌚</Text>
          </View>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName} numberOfLines={2}>
              {device?.name ?? t('settings.deviceName')}
            </Text>
            <View style={styles.deviceMeta}>
              <Badge
                label={deviceStatusLabel}
                preset={deviceConnected ? 'resolved' : 'falseAlarm'}
              />
              <Text style={styles.deviceBattery} numberOfLines={1}>
                {t('settings.deviceBattery', {
                  percent: device?.batteryPercent ?? '--',
                })}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(ROUTES.SETTINGS_STACK.DEVICE_PAIRING)
            }
            accessibilityRole="button"
            accessibilityLabel="Manage NARI bangle"
          >
            <Text style={styles.manageText}>{t('settings.deviceManage')}</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Account & Safety */}
      <Text style={styles.sectionLabel}>{t('settings.accountSection')}</Text>
      <SettingsRow
        title={t('settings.profile')}
        subtitle={t('settings.profileSubtitle')}
      />
      <SettingsRow
        title={t('settings.emergencyContacts')}
        subtitle={t('settings.emergencyContactsSubtitle', {
          count: contactCount,
        })}
      />
      <SettingsRow
        title={t('settings.alertPreferences')}
        subtitle={t('settings.alertPreferencesSubtitle')}
        rightAccessory={
          <Toggle
            value={silentMode}
            onValueChange={setSilentMode}
            accessibilityLabel={t('settings.alertPreferences')}
          />
        }
      />

      {/* App Settings */}
      <Text style={styles.sectionLabel}>{t('settings.appSection')}</Text>
      <SettingsRow
        title={t('settings.privacy')}
        subtitle={t('settings.privacySubtitle')}
        rightAccessory={
          <Toggle
            value={locationSharing}
            onValueChange={setLocationSharing}
            accessibilityLabel={t('settings.privacy')}
          />
        }
      />
      <SettingsRow
        title={t('settings.language')}
        subtitle={t('settings.languageSubtitle')}
      />
      <SettingsRow
        title={t('settings.help')}
        subtitle={t('settings.helpSubtitle')}
      />
      <SettingsRow
        title={t('settings.alertHistory')}
        subtitle={t('settings.alertHistorySubtitle')}
        onPress={() => navigation.navigate(ROUTES.SETTINGS_STACK.ALERT_HISTORY)}
      />
      <SettingsRow
        title={t('settings.about')}
        subtitle={t('settings.aboutSubtitle', { version: '1.0.0' })}
        onPress={() => {
          demoTapCount.current += 1;
          if (demoTapCount.current >= 5) {
            demoTapCount.current = 0;
            haptic.success();
            demoMode.start();
          }
        }}
      />

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={logout}
        accessibilityRole="button"
        accessibilityLabel={t('settings.logOut')}
      >
        <Text style={styles.logoutText}>{t('settings.logOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ── Settings Row component ── */

function SettingsRow({
  title,
  subtitle,
  onPress,
  rightAccessory,
}: {
  title: string;
  subtitle: string;
  onPress?: () => void;
  rightAccessory?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.settingsRow}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? title : undefined}
    >
      <View style={styles.settingsRowContent}>
        <Text style={styles.settingsRowTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.settingsRowSubtitle} numberOfLines={3}>
          {subtitle}
        </Text>
      </View>
      {rightAccessory ?? <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
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
    paddingBottom: 100,
  },
  title: {
    ...typography.h1,
    color: colors.neutral[900],
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    marginBottom: spacing['3xl'],
  },
  sectionLabel: {
    ...typography.captionMedium,
    color: colors.neutral[500],
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    marginTop: spacing['2xl'],
  },
  deviceCard: {
    marginBottom: spacing.md,
  },
  deviceCardDisconnected: {
    backgroundColor: colors.brand.linen,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  deviceIconDisconnected: {
    backgroundColor: colors.neutral[200],
  },
  deviceEmoji: {
    fontSize: 22,
  },
  deviceInfo: {
    flex: 1,
    minWidth: 0,
  },
  deviceName: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
    marginBottom: 4,
  },
  deviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  deviceBattery: {
    ...typography.caption,
    color: colors.neutral[500],
  },
  manageText: {
    ...typography.bodySmallMedium,
    color: colors.brand.primary,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.linen,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  settingsRowContent: {
    flex: 1,
    minWidth: 0,
  },
  settingsRowTitle: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
    marginBottom: 2,
  },
  settingsRowSubtitle: {
    ...typography.caption,
    color: colors.neutral[500],
  },
  chevron: {
    ...typography.h2,
    color: colors.neutral[400],
  },
  logoutButton: {
    marginTop: spacing['3xl'],
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  logoutText: {
    ...typography.bodySemibold,
    color: colors.status.danger,
  },
});
