import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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

type Props = NativeStackScreenProps<AuthStackParamList, 'OTPVerify'>;

const OTP_LENGTH = 6;

export default function OTPVerifyScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { verifyOTP, isLoading } = useAuthStore();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance to next input
    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) return;
    const success = await verifyOTP(code);
    if (success) {
      navigation.navigate(ROUTES.AUTH.ADD_CONTACTS);
    }
  };

  const otpFilled = otp.every((d) => d.length === 1);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>NARI</Text>
        <Text style={styles.title}>{t('otp.title')}</Text>
        <Text style={styles.subtitle}>
          {t('otp.subtitle')} {route.params.phone}
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : undefined,
              ]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              accessibilityLabel={`OTP digit ${index + 1}`}
            />
          ))}
        </View>

        <Text style={styles.resend}>
          {resendTimer > 0 ? (
            <>
              {t('otp.resendPrefix')} {resendTimer}s
            </>
          ) : (
            <Text
              style={styles.resendLink}
              onPress={() => setResendTimer(30)}
            >
              {t('otp.resendAction')}
            </Text>
          )}
        </Text>

        <Button
          title={t('otp.verify')}
          onPress={handleVerify}
          loading={isLoading}
          disabled={!otpFilled}
        />
      </View>
    </KeyboardAvoidingView>
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
    paddingTop: 80,
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
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing['3xl'],
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    backgroundColor: colors.brand.linen,
    textAlign: 'center',
    ...typography.h2,
    color: colors.neutral[900],
  },
  otpInputFilled: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.neutral[0],
  },
  resend: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing['3xl'],
  },
  resendLink: {
    color: colors.brand.primary,
    textDecorationLine: 'underline',
  },
});
