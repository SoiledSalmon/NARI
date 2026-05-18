import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../navigation/routes';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores/settingsStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

type Props = NativeStackScreenProps<SettingsStackParamList, 'LanguageSettings'>;

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
];

export default function LanguageSettingsScreen({ navigation }: Props) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Language</Text>
      <Text style={styles.subtitle}>Choose your preferred language.</Text>

      {LANGUAGES.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.langRow,
            currentLang === lang.code && styles.langRowSelected,
          ]}
          onPress={() => handleSelect(lang.code)}
          accessibilityRole="button"
          accessibilityLabel={`Select ${lang.label}`}
        >
          <Text
            style={[
              styles.langLabel,
              currentLang === lang.code && styles.langLabelSelected,
            ]}
          >
            {lang.label}
          </Text>
          {currentLang === lang.code && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand.cream },
  content: { paddingHorizontal: spacing['2xl'], paddingTop: spacing['3xl'], paddingBottom: spacing['4xl'] },
  backButton: { marginBottom: spacing['2xl'] },
  backText: { ...typography.bodyMedium, color: colors.brand.primary },
  title: { ...typography.h1, color: colors.neutral[900], marginBottom: spacing.sm },
  subtitle: { ...typography.bodySmall, color: colors.neutral[500], marginBottom: spacing['3xl'] },
  langRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: spacing.lg,
    borderRadius: radii.lg, marginBottom: spacing.md,
    backgroundColor: colors.brand.linen,
    borderWidth: 1, borderColor: colors.neutral[300],
  },
  langRowSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.neutral[0],
  },
  langLabel: { ...typography.bodyMedium, color: colors.neutral[900] },
  langLabelSelected: { color: colors.brand.primary },
  checkmark: { ...typography.h3, color: colors.brand.primary },
});
