import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../navigation/routes';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

type Props = NativeStackScreenProps<SettingsStackParamList, 'PersonalInfo'>;

export default function PersonalInfoScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Personal Information</Text>
      <Text style={styles.subtitle}>Manage your profile details.</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={user?.name || ''}
          placeholder="Your name"
          placeholderTextColor={colors.neutral[400]}
          editable={false}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={user?.phone || ''}
          placeholder="+91 XXXXXXXXXX"
          placeholderTextColor={colors.neutral[400]}
          editable={false}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Language</Text>
        <TextInput
          style={styles.input}
          value={user?.language === 'kn' ? 'ಕನ್ನಡ' : 'English'}
          editable={false}
        />
      </View>
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
  fieldGroup: { marginBottom: spacing['2xl'] },
  label: { ...typography.bodySmallMedium, color: colors.neutral[700], marginBottom: spacing.sm },
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
});
