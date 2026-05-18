import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../navigation/routes';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows } from '../../theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'Permissions'>;

interface PermissionItem {
  key: string;
  titleKey: string;
  descKey: string;
  tagKey: string;
  required: boolean;
}

const PERMISSIONS: PermissionItem[] = [
  { key: 'location', titleKey: 'permissions.location', descKey: 'permissions.locationDesc', tagKey: 'permissions.locationTag', required: true },
  { key: 'notifications', titleKey: 'permissions.notifications', descKey: 'permissions.notificationsDesc', tagKey: 'permissions.notificationsTag', required: true },
  { key: 'contacts', titleKey: 'permissions.contactsPermission', descKey: 'permissions.contactsDesc', tagKey: 'permissions.contactsTag', required: false },
  { key: 'microphone', titleKey: 'permissions.microphone', descKey: 'permissions.microphoneDesc', tagKey: 'permissions.microphoneTag', required: false },
];

export default function PermissionsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    location: true,
    notifications: true,
    contacts: false,
    microphone: false,
  });

  const handleToggle = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = () => {
    completeOnboarding();
    // Navigation to App stack is handled by RootNavigator
    // when onboardingComplete becomes true
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.logo}>NARI</Text>
        <Text style={styles.title}>{t('permissions.title')}</Text>
        <Text style={styles.subtitle}>{t('permissions.subtitle')}</Text>

        <View style={styles.permissionsList}>
          {PERMISSIONS.map((perm) => (
            <View key={perm.key} style={styles.permRow}>
              <View style={styles.permInfo}>
                <View style={styles.permHeader}>
                  <Text style={styles.permTitle}>{t(perm.titleKey)}</Text>
                  <Badge
                    label={t(perm.tagKey)}
                    preset={perm.required ? 'required' : 'optional'}
                  />
                </View>
                <Text style={styles.permDesc}>{t(perm.descKey)}</Text>
              </View>
              <Switch
                value={toggles[perm.key]}
                onValueChange={() => handleToggle(perm.key)}
                trackColor={{
                  false: colors.neutral[300],
                  true: colors.brand.accent,
                }}
                thumbColor={
                  toggles[perm.key]
                    ? colors.brand.primary
                    : colors.neutral[400]
                }
              />
            </View>
          ))}
        </View>

        <Text style={styles.note}>{t('permissions.laterNote')}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t('permissions.continue')}
          onPress={handleContinue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.cream,
  },
  scrollContent: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: 80,
    paddingBottom: spacing.lg,
  },
  logo: {
    ...typography.h2,
    color: colors.brand.primary,
    letterSpacing: 4,
    marginBottom: spacing['4xl'],
  },
  title: {
    ...typography.h1,
    color: colors.neutral[900],
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    marginBottom: spacing['3xl'],
    lineHeight: 22,
  },
  permissionsList: {
    gap: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.linen,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    ...shadows.sm,
  },
  permInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  permHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  permTitle: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
  },
  permDesc: {
    ...typography.caption,
    color: colors.neutral[500],
    lineHeight: 18,
  },
  note: {
    ...typography.caption,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['4xl'],
    paddingTop: spacing.lg,
  },
});
