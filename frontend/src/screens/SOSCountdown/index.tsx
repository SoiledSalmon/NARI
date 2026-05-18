import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, ROUTES } from '../../navigation/routes';
import { CountdownRing } from '../../components/sos/CountdownRing';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'SOSCountdown'>;

const COUNTDOWN_SECONDS = 10;

export default function SOSCountdownScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (remaining <= 0) return;

    const timer = setTimeout(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [remaining]);

  const handleComplete = useCallback(() => {
    navigation.replace(ROUTES.OVERLAY.SOS_ACTIVE);
  }, [navigation]);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.ringContainer}>
        <CountdownRing duration={COUNTDOWN_SECONDS} onComplete={handleComplete} />
      </View>

      <Text style={styles.title}>{t('sos.countdownTitle')}</Text>
      <Text style={styles.subtitle}>
        {t('sos.countdownSubtitle', { seconds: remaining })}
      </Text>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={handleCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel SOS"
      >
        <Text style={styles.cancelText}>{t('sos.countdownCancel')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.status.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  ringContainer: {
    marginBottom: spacing['4xl'],
  },
  title: {
    ...typography.h1,
    color: colors.brand.cream,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.status.dangerLight,
    textAlign: 'center',
    marginBottom: spacing['5xl'],
  },
  cancelButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['3xl'],
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.status.dangerLight,
    backgroundColor: colors.status.dangerLight,
  },
  cancelText: {
    ...typography.bodySemibold,
    color: colors.status.danger,
  },
});
