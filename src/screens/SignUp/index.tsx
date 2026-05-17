import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../navigation/routes';
import { ROUTES } from '../../navigation/routes';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const { sendOTP, isLoading, setUser } = useAuthStore();

  const handleSubmit = async () => {
    if (!phone || phone.length < 10) return;
    const success = await sendOTP(phone);
    if (success) {
      // Set the user profile
      setUser({
        id: 'user-001',
        name: name || 'User',
        phone,
        language: 'en',
        onboardingComplete: false,
        createdAt: Date.now(),
      });
      navigation.navigate(ROUTES.AUTH.OTP, { phone });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>NARI</Text>
        <Text style={styles.title}>{t('signup.title')}</Text>
        <Text style={styles.subtitle}>{t('signup.subtitle')}</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('signup.nameLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('signup.namePlaceholder')}
            placeholderTextColor={colors.neutral[400]}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('signup.phoneLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('signup.phonePlaceholder')}
            placeholderTextColor={colors.neutral[400]}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
        </View>

        <Text style={styles.terms}>
          {t('signup.termsPrefix')}
          <Text style={styles.termsLink}>{t('signup.termsLink')}</Text>
          {t('signup.termsAnd')}
          <Text style={styles.termsLink}>{t('signup.privacyLink')}</Text>
        </Text>

        <Button
          title={t('signup.submit')}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={!phone || phone.length < 10}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.cream,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: 80,
    paddingBottom: spacing['4xl'],
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
  },
  fieldGroup: {
    marginBottom: spacing['2xl'],
  },
  label: {
    ...typography.bodySmallMedium,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.brand.linen,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    color: colors.neutral[900],
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  terms: {
    ...typography.caption,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing['3xl'],
    lineHeight: 20,
  },
  termsLink: {
    color: colors.brand.primary,
    textDecorationLine: 'underline',
  },
});
