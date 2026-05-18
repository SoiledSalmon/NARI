/**
 * AlertReceived — Responder view when a trusted contact receives an SOS.
 * Shows sender info, location, distance, battery, and action buttons.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../navigation/routes';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ReceivedAlert } from '../../data/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows } from '../../theme/spacing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '../../services/hapticService';

type Props = NativeStackScreenProps<RootStackParamList, 'AlertReceived'>;

// Demo mock data for the responder view
const MOCK_RECEIVED_ALERT: ReceivedAlert = {
  senderName: 'Maria Garcia',
  alertType: 'manual_sos',
  location: { latitude: 12.9716, longitude: 77.5946 },
  locationAddress: 'MG Road, Bangalore',
  distance: '0.8 mi',
  batteryPercent: 72,
  signalStrength: 'strong',
  timestamp: Date.now() - 120000, // 2 min ago
};

export default function AlertReceivedScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [alert] = useState<ReceivedAlert>(MOCK_RECEIVED_ALERT);

  useEffect(() => {
    haptic.heavy();
  }, []);

  const handleCall = () => {
    Linking.openURL('tel:112');
  };

  const handleMarkSafe = () => {
    haptic.success();
    navigation.goBack();
  };

  const signalColor =
    alert.signalStrength === 'strong'
      ? colors.status.safe
      : alert.signalStrength === 'weak'
        ? colors.status.alert
        : colors.status.danger;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
      ]}
    >
      {/* Danger header */}
      <View style={styles.dangerHeader}>
        <Text style={styles.alertIcon}>🚨</Text>
        <Text style={styles.alertTitle}>{t('alertReceived.title')}</Text>
        <Text style={styles.alertSubtitle}>
          {t('alertReceived.subtitle', { name: alert.senderName })}
        </Text>
      </View>

      {/* Info cards */}
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {t('alertReceived.currentLocation')}
          </Text>
          <Text style={styles.infoValue}>{alert.locationAddress}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('alertReceived.distance')}</Text>
          <Text style={styles.infoValue}>{alert.distance}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('alertReceived.battery')}</Text>
          <Text style={styles.infoValue}>{alert.batteryPercent}%</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('alertReceived.signal')}</Text>
          <View style={styles.signalRow}>
            <View
              style={[styles.signalDot, { backgroundColor: signalColor }]}
            />
            <Text style={[styles.infoValue, { color: signalColor }]}>
              {alert.signalStrength === 'strong'
                ? t('alertReceived.signalStrong')
                : t('alertReceived.signalWeak')}
            </Text>
          </View>
        </View>
      </Card>

      {/* Map placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapEmoji}>📍</Text>
        <Text style={styles.mapText}>{alert.locationAddress}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title={t('alertReceived.call', { name: alert.senderName })}
          onPress={handleCall}
          variant="danger"
          style={styles.callButton}
        />
        <Button
          title={t('alertReceived.navigate')}
          onPress={() => {}}
          variant="outlined"
        />
        <Button
          title={t('alertReceived.markSafe')}
          onPress={handleMarkSafe}
          variant="text"
          style={styles.markSafeButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.status.dangerLight,
    paddingHorizontal: spacing.xl,
  },
  dangerHeader: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  alertIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  alertTitle: {
    ...typography.h1,
    color: colors.status.danger,
    marginBottom: spacing.sm,
  },
  alertSubtitle: {
    ...typography.body,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.neutral[0],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
  infoValue: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.neutral[200],
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
    ...shadows.sm,
  },
  mapEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  mapText: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
  actions: {
    gap: spacing.md,
  },
  callButton: {
    backgroundColor: colors.status.danger,
  },
  markSafeButton: {
    marginTop: spacing.xs,
  },
});
