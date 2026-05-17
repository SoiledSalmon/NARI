import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert as RNAlert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/routes';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows } from '../../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'SOSActive'>;

interface ContactGroup {
  label: string;
  status: 'sent' | 'sending' | 'pending';
}

export default function SOSActiveScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [contacts] = useState<ContactGroup[]>([
    { label: t('sos.emergencyContacts'), status: 'sent' },
    { label: t('sos.localAuthorities'), status: 'sending' },
    { label: t('sos.campusSecurity'), status: 'pending' },
  ]);

  const handleFalseAlarm = () => {
    RNAlert.alert(t('sos.falseAlarmTitle'), t('sos.falseAlarmSubtitle'), [
      { text: t('sos.falseAlarmCancel'), style: 'cancel' },
      {
        text: t('sos.falseAlarmConfirm'),
        style: 'destructive',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const statusText = (status: string) => {
    if (status === 'sent') return t('sos.contactsSent');
    if (status === 'sending') return t('sos.contactsSending');
    return t('sos.contactsPending');
  };

  const statusColor = (status: string) => {
    if (status === 'sent') return colors.status.safe;
    if (status === 'sending') return colors.status.alert;
    return colors.neutral[500];
  };

  return (
    <View style={styles.container}>
      {/* Pulsing SOS indicator */}
      <View style={styles.sosIndicator}>
        <View style={styles.sosCircle}>
          <Text style={styles.sosText}>SOS</Text>
        </View>
      </View>

      <Text style={styles.title}>{t('sos.activeTitle')}</Text>
      <Text style={styles.subtitle}>{t('sos.activeSubtitle')}</Text>
      <Text style={styles.locationNote}>{t('sos.activeLocation')}</Text>

      {/* Contact notifications */}
      <View style={styles.contactsList}>
        {contacts.map((group, index) => (
          <View key={index} style={styles.contactRow}>
            <Text style={styles.contactLabel}>{group.label}</Text>
            <Text
              style={[
                styles.contactStatus,
                { color: statusColor(group.status) },
              ]}
            >
              {statusText(group.status)}
            </Text>
          </View>
        ))}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Button
          title={t('sos.call112')}
          onPress={() => {}}
          variant="danger"
          style={styles.callButton}
        />
        <TouchableOpacity
          style={styles.falseAlarmButton}
          onPress={handleFalseAlarm}
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
    backgroundColor: colors.status.dangerLight,
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
    paddingTop: 80,
  },
  sosIndicator: {
    marginBottom: spacing['3xl'],
  },
  sosCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.status.danger,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sos,
  },
  sosText: {
    ...typography.h1,
    color: colors.neutral[0],
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    ...typography.h1,
    color: colors.status.danger,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  locationNote: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing['4xl'],
  },
  contactsList: {
    width: '100%',
    backgroundColor: colors.neutral[0],
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing['4xl'],
    ...shadows.md,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactLabel: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
  },
  contactStatus: {
    ...typography.captionMedium,
    letterSpacing: 0.5,
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
    color: colors.neutral[700],
    textDecorationLine: 'underline',
  },
});
