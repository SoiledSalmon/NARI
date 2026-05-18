import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../navigation/routes';
import { ROUTES } from '../../navigation/routes';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows } from '../../theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'Language'>;

export default function LanguageScreen({ navigation }: Props) {
  const { i18n, t } = useTranslation();
  const setLanguage = useAuthStore((s) => s.setLanguage);

  const selectLanguage = (lang: 'en' | 'kn') => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
    navigation.navigate(ROUTES.AUTH.SIGNUP);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>NARI</Text>
        <Text style={styles.title}>{t('language.title')}</Text>
        <Text style={styles.subtitle}>{t('language.subtitle')}</Text>

        <View style={styles.options}>
          <TouchableOpacity
            style={styles.languageCard}
            onPress={() => selectLanguage('en')}
            accessibilityRole="button"
            accessibilityLabel="Select English"
          >
            <Text style={styles.languageText}>English</Text>
            <Text style={styles.languageCheck}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.languageCard}
            onPress={() => selectLanguage('kn')}
            accessibilityRole="button"
            accessibilityLabel="Select Kannada"
          >
            <Text style={styles.languageText}>ಕನ್ನಡ</Text>
            <Text style={styles.languageCheck}>→</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: spacing['2xl'],
    paddingTop: 100,
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
    marginBottom: spacing['4xl'],
  },
  options: {
    gap: spacing.lg,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.brand.linen,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing['2xl'],
    borderRadius: radii.xl,
    ...shadows.sm,
  },
  languageText: {
    ...typography.h3,
    color: colors.neutral[900],
  },
  languageCheck: {
    ...typography.h3,
    color: colors.brand.primary,
  },
});
