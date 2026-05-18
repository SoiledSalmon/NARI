import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/routes';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows } from '../../theme/spacing';
import { useAuthStore } from '../../stores/authStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const API_KEY = process.env.EXPO_PUBLIC_API_SECRET_KEY || 'your-secret-key-here';

type Props = NativeStackScreenProps<RootStackParamList, 'SOSActive'>;

interface ContactGroup {
  label: string;
  status: 'sent' | 'sending' | 'pending' | 'failed';
}

const STATUS_ICON: Record<string, string> = {
  sent: '✓',
  sending: '↻',
  pending: '○',
  failed: '✕',
};

const CHIP_STYLE = {
  sent: {
    fg: colors.status.safe,
    bg: colors.status.safeLight,
    border: colors.status.safe,
  },
  sending: {
    fg: colors.status.alert,
    bg: colors.status.alertLight,
    border: colors.status.alert,
  },
  pending: {
    fg: colors.neutral[500],
    bg: colors.neutral[100],
    border: colors.neutral[300],
  },
  failed: {
    fg: colors.status.danger,
    bg: colors.status.dangerLight,
    border: colors.status.danger,
  },
};

export default function SOSActiveScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [showFalseAlarmDialog, setShowFalseAlarmDialog] = useState(false);
  const [contacts, setContacts] = useState<ContactGroup[]>([
    { label: t('sos.emergencyContacts'), status: 'sent' },
    { label: t('sos.localAuthorities'), status: 'sending' },
    { label: t('sos.campusSecurity'), status: 'failed' },
  ]);
  const hasFailedDelivery = contacts.some((group) => group.status === 'failed');
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.38 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 1.15 }],
  }));

  const handleCall112 = () => {
    Linking.openURL('tel:112');
  };

  const handleFalseAlarm = () => {
    setShowFalseAlarmDialog(true);
  };

  const confirmFalseAlarm = async () => {
    setShowFalseAlarmDialog(false);
    if (user?.id) {
      try {
        await fetch(`${BACKEND_URL}/sos/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
          },
          body: JSON.stringify({ userId: user.id }),
        });
      } catch (err) {
        console.warn('Failed to cancel SOS on backend', err);
      }
    }
    navigation.goBack();
  };

  const statusText = (status: string) => {
    if (status === 'sent') return t('sos.contactsSent');
    if (status === 'sending') return t('sos.contactsSending');
    if (status === 'failed') return 'FAILED';
    return t('sos.contactsPending');
  };

  const retryFailedDelivery = () => {
    setContacts((groups) =>
      groups.map((group) =>
        group.status === 'failed' ? { ...group, status: 'sending' } : group,
      ),
    );
  };

  return (
    <View style={styles.container}>
      {/* Custom "I'm Safe" dialog */}
      <ConfirmDialog
        visible={showFalseAlarmDialog}
        title={t('sos.falseAlarmTitle')}
        subtitle={t('sos.falseAlarmSubtitle')}
        confirmText={t('sos.falseAlarmConfirm')}
        cancelText={t('sos.falseAlarmCancel')}
        onConfirm={confirmFalseAlarm}
        onCancel={() => setShowFalseAlarmDialog(false)}
        destructive
      />

      {/* Pulsing SOS indicator */}
      <View style={styles.sosIndicator}>
        <Animated.View style={[styles.sosPulse, pulseStyle]} />
        <View style={styles.sosCircle}>
          <Text style={styles.sosText}>SOS</Text>
        </View>
      </View>

      <Text style={styles.title}>{t('sos.activeTitle')}</Text>
      <Text style={styles.subtitle}>{t('sos.activeSubtitle')}</Text>
      <Text style={styles.locationNote}>{t('sos.activeLocation')}</Text>

      {/* Contact notifications — redesigned chips */}
      <View style={styles.contactsList}>
        {contacts.map((group, index) => (
          <View key={index} style={styles.contactRow}>
            <Text style={styles.contactLabel} numberOfLines={2}>
              {group.label}
            </Text>
            <View
              style={[
                styles.statusChip,
                {
                  backgroundColor: CHIP_STYLE[group.status].bg,
                  borderColor: CHIP_STYLE[group.status].border,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusIcon,
                  { color: CHIP_STYLE[group.status].fg },
                ]}
              >
                {STATUS_ICON[group.status]}
              </Text>
              <Text
                style={[
                  styles.statusText,
                  { color: CHIP_STYLE[group.status].fg },
                ]}
              >
                {statusText(group.status)}
              </Text>
            </View>
          </View>
        ))}
        {hasFailedDelivery && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={retryFailedDelivery}
            accessibilityRole="button"
            accessibilityLabel="Retry failed alert delivery"
          >
            <Text style={styles.retryButtonText}>Retry failed delivery</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Button
          title={t('sos.call112')}
          onPress={handleCall112}
          variant="emergency"
          style={styles.callButton}
        />
        <TouchableOpacity
          style={styles.falseAlarmButton}
          onPress={handleFalseAlarm}
          accessibilityRole="button"
          accessibilityLabel={t('sos.falseAlarm')}
        >
          <Text style={styles.falseAlarmText}>{t('sos.falseAlarm')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.status.danger,
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingTop: 80,
  },
  sosIndicator: {
    marginBottom: spacing['3xl'],
    width: 156,
    height: 156,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosPulse: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: colors.status.dangerLight,
  },
  sosCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.status.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sos,
  },
  sosText: {
    ...typography.h1,
    color: colors.status.danger,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    ...typography.h1,
    color: colors.brand.cream,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.status.dangerLight,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  locationNote: {
    ...typography.bodySmall,
    color: colors.status.dangerLight,
    textAlign: 'center',
    marginBottom: spacing['3xl'],
  },
  contactsList: {
    width: '100%',
    backgroundColor: 'rgba(252,249,242,0.14)',
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing['3xl'],
    ...shadows.md,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  contactLabel: {
    ...typography.bodyMedium,
    color: colors.brand.cream,
    flex: 1,
    minWidth: 0,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    minWidth: 80,
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusText: {
    ...typography.captionMedium,
    letterSpacing: 0.3,
  },
  retryButton: {
    minHeight: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.cream,
    marginTop: spacing.sm,
  },
  retryButtonText: {
    ...typography.bodySemibold,
    color: colors.status.danger,
  },
  actions: {
    width: '100%',
    gap: spacing.lg,
  },
  callButton: {
    width: '100%',
  },
  falseAlarmButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  falseAlarmText: {
    ...typography.bodyMedium,
    color: colors.status.dangerLight,
    textDecorationLine: 'underline',
  },
});
