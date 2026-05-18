import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../navigation/routes';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<SettingsStackParamList, 'AboutNari'>;

export default function AboutNariScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.logo}>NARI</Text>
      <Text style={styles.title}>About NARI</Text>
      <Text style={styles.version}>Version 1.0.0</Text>

      <Text style={styles.description}>
        NARI is a personal safety platform combining wearable sensor technology with 
        intelligent monitoring. The NARI Belt tracks heart rate, motion, and environmental 
        audio to detect potential danger and alert your trusted contacts and authorities.
      </Text>

      <View style={styles.row}><Text style={styles.rowLabel}>Licenses</Text><Text style={styles.rowValue}>→</Text></View>
      <View style={styles.row}><Text style={styles.rowLabel}>Terms of Service</Text><Text style={styles.rowValue}>→</Text></View>
      <View style={styles.row}><Text style={styles.rowLabel}>Privacy Policy</Text><Text style={styles.rowValue}>→</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand.cream },
  content: { paddingHorizontal: spacing['2xl'], paddingTop: spacing['3xl'], paddingBottom: spacing['4xl'] },
  backButton: { marginBottom: spacing['2xl'] },
  backText: { ...typography.bodyMedium, color: colors.brand.primary },
  logo: { ...typography.h1, color: colors.brand.primary, letterSpacing: 4, marginBottom: spacing.lg },
  title: { ...typography.h1, color: colors.neutral[900], marginBottom: spacing.sm },
  version: { ...typography.bodySmall, color: colors.neutral[500], marginBottom: spacing['3xl'] },
  description: { ...typography.body, color: colors.neutral[700], lineHeight: 24, marginBottom: spacing['3xl'] },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.neutral[200],
  },
  rowLabel: { ...typography.body, color: colors.neutral[900] },
  rowValue: { ...typography.bodyMedium, color: colors.neutral[500] },
});
