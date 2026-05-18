import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../navigation/routes';
import { ROUTES } from '../../navigation/routes';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { firebaseConfig, app } from '../../services/firebaseService';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

type AuthMode = 'create' | 'signin';

export default function SignUpScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('create');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [showRecaptchaLoading, setShowRecaptchaLoading] = useState(false);
  const { sendOTP, isLoading, setUser } = useAuthStore();
  const recaptchaVerifier = React.useRef(null);

  const isSignIn = mode === 'signin';

  const handleSubmit = async () => {
    if (!phone || phone.replace(/\s/g, '').length < 13 || !recaptchaVerifier.current) return;

    setShowRecaptchaLoading(true);
    const cleanPhone = phone.replace(/\s/g, '');
    const success = await sendOTP(cleanPhone, recaptchaVerifier.current as any);
    setShowRecaptchaLoading(false);

    if (success) {
      if (!isSignIn) {
        // Set the user profile for new accounts
        setUser({
          id: 'user-001',
          name: name || 'User',
          phone: cleanPhone,
          language: 'en',
          onboardingComplete: false,
          createdAt: Date.now(),
        });
      }
      navigation.navigate(ROUTES.AUTH.OTP, { phone: cleanPhone });
    }
  };

  const toggleMode = () => {
    setMode(isSignIn ? 'create' : 'signin');
  };

  const phoneDigits = phone.replace(/\D/g, '');
  const isPhoneValid = phoneDigits.length >= 12; // +91 + 10 digits

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          // @ts-ignore
          firebaseConfig={app ? app.options : firebaseConfig}
        />

        {/* reCAPTCHA loading interstitial */}
        <Modal
          visible={showRecaptchaLoading}
          transparent
          animationType="fade"
          statusBarTranslucent
        >
          <View style={styles.recaptchaOverlay}>
            <View style={styles.recaptchaCard}>
              <ActivityIndicator size="large" color={colors.brand.primary} />
              <Text style={styles.recaptchaText}>
                {t('signup.recaptchaLoading')}
              </Text>
            </View>
          </View>
        </Modal>

        <Text style={styles.logo}>NARI</Text>
        <Text style={styles.title}>
          {isSignIn ? t('signup.signInTitle') : t('signup.title')}
        </Text>
        <Text style={styles.subtitle}>
          {isSignIn ? t('signup.signInSubtitle') : t('signup.subtitle')}
        </Text>

        {/* Name field — only for Create Account mode */}
        {!isSignIn && (
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
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('signup.phoneLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 XXXXXXXXXX"
            placeholderTextColor={colors.neutral[400]}
            value={phone}
            onChangeText={(text) => {
              // Ensure +91 prefix stays
              if (!text.startsWith('+91')) {
                setPhone('+91 ');
              } else {
                setPhone(text);
              }
            }}
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
          title={isSignIn ? t('signup.signInSubmit') : t('signup.submit')}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={!isPhoneValid || (!isSignIn && !name.trim())}
        />

        {/* Mode toggle */}
        <TouchableOpacity
          onPress={toggleMode}
          style={styles.modeToggle}
          accessibilityRole="button"
          accessibilityLabel={isSignIn ? 'Switch to create account' : 'Switch to sign in'}
        >
          <Text style={styles.modeToggleText}>
            {isSignIn ? t('signup.switchToCreate') : t('signup.switchToSignIn')}
          </Text>
        </TouchableOpacity>
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
  modeToggle: {
    marginTop: spacing['2xl'],
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  modeToggleText: {
    ...typography.bodySmallMedium,
    color: colors.brand.primary,
  },
  recaptchaOverlay: {
    flex: 1,
    backgroundColor: colors.overlay.black50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recaptchaCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radii.xl,
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing['4xl'],
    alignItems: 'center',
    gap: spacing.lg,
  },
  recaptchaText: {
    ...typography.bodyMedium,
    color: colors.neutral[700],
  },
});
