import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/routes';
import { ROUTES } from '../../navigation/routes';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace(ROUTES.AUTH.LANGUAGE);
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>NARI</Text>
      <Text style={styles.tagline}>Safety, redefined.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    ...typography.hero,
    color: colors.neutral[0],
    fontSize: 48,
    letterSpacing: 6,
    marginBottom: 12,
  },
  tagline: {
    ...typography.bodySmall,
    color: colors.overlay.white60,
    letterSpacing: 1,
  },
});
