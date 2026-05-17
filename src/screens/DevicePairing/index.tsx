/**
 * DevicePairing — BLE device scanning and pairing modal.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SettingsStackParamList } from '../../navigation/routes';
import { TopBar } from '../../components/layout/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useSettingsStore } from '../../stores/settingsStore';
import { dataProvider } from '../../../dataConfig';
import { haptic } from '../../services/hapticService';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows } from '../../theme/spacing';

type Props = NativeStackScreenProps<SettingsStackParamList, 'DevicePairing'>;

type PairingState = 'scanning' | 'found' | 'connecting' | 'connected' | 'error';

export default function DevicePairingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const setDevice = useSettingsStore((s) => s.setDevice);
  const [state, setState] = useState<PairingState>('scanning');
  const [devices, setDevices] = useState<string[]>([]);

  useEffect(() => {
    // Start scanning
    dataProvider.scanForDevices().then((found) => {
      setDevices(found);
      setState(found.length > 0 ? 'found' : 'error');
    });
  }, []);

  const handleConnect = async (deviceName: string) => {
    setState('connecting');
    const success = await dataProvider.connectToDevice(deviceName);
    if (success) {
      haptic.success();
      setState('connected');
      const deviceState = await dataProvider.getDeviceState();
      setDevice(deviceState);
      // Auto-dismiss after 1.5s
      setTimeout(() => navigation.goBack(), 1500);
    } else {
      haptic.error();
      setState('error');
    }
  };

  return (
    <View style={styles.container}>
      <TopBar title={t('devicePairing.title')} showBack />

      <View style={styles.content}>
        {/* Illustration area */}
        <View style={styles.illustration}>
          <Text style={styles.watchIcon}>⌚</Text>
          {state === 'scanning' && (
            <View style={styles.pulseRing}>
              <ActivityIndicator size="large" color={colors.brand.primary} />
            </View>
          )}
          {state === 'connected' && (
            <View style={styles.checkCircle}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
          )}
        </View>

        <Text style={styles.subtitle}>{t('devicePairing.subtitle')}</Text>

        {/* Scanning state */}
        {state === 'scanning' && (
          <Card style={styles.statusCard}>
            <ActivityIndicator color={colors.brand.primary} />
            <Text style={styles.statusText}>{t('devicePairing.scanning')}</Text>
          </Card>
        )}

        {/* Device found */}
        {state === 'found' &&
          devices.map((device) => (
            <Card key={device} style={styles.deviceCard}>
              <View style={styles.deviceRow}>
                <View style={styles.deviceIcon}>
                  <Text style={styles.deviceEmoji}>⌚</Text>
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{device}</Text>
                  <Text style={styles.deviceLabel}>
                    {t('devicePairing.found')}
                  </Text>
                </View>
                <Button
                  title={t('devicePairing.connect')}
                  onPress={() => handleConnect(device)}
                  style={styles.connectButton}
                />
              </View>
            </Card>
          ))}

        {/* Connecting */}
        {state === 'connecting' && (
          <Card style={styles.statusCard}>
            <ActivityIndicator color={colors.brand.primary} />
            <Text style={styles.statusText}>Connecting...</Text>
          </Card>
        )}

        {/* Connected */}
        {state === 'connected' && (
          <Card style={styles.successCard}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>{t('devicePairing.connected')}</Text>
          </Card>
        )}

        {/* Skip button */}
        {state !== 'connected' && (
          <Button
            title={t('devicePairing.skip')}
            onPress={() => navigation.goBack()}
            variant="text"
            style={styles.skipButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.cream,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  illustration: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing['3xl'],
    position: 'relative',
  },
  watchIcon: {
    fontSize: 56,
    zIndex: 1,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.status.safe,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 18,
    color: colors.neutral[0],
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing['3xl'],
  },
  statusCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statusText: {
    ...typography.bodyMedium,
    color: colors.neutral[700],
  },
  deviceCard: {
    width: '100%',
    marginBottom: spacing.lg,
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
  deviceEmoji: {
    fontSize: 22,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
  },
  deviceLabel: {
    ...typography.caption,
    color: colors.status.safe,
  },
  connectButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  successCard: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.status.safeLight,
  },
  successIcon: {
    fontSize: 32,
    color: colors.status.safe,
  },
  successText: {
    ...typography.h3,
    color: colors.status.safe,
  },
  skipButton: {
    marginTop: spacing['2xl'],
  },
});
