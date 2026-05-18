import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../navigation/routes';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<SettingsStackParamList, 'AlertPreferences'>;

export default function AlertPreferencesScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Alert Preferences</Text>
      <Text style={styles.subtitle}>Configure how and when you receive safety alerts.</Text>

      <View style={styles.row}><Text style={styles.rowLabel}>Push Notifications</Text><Text style={styles.rowValue}>On</Text></View>
      <View style={styles.row}><Text style={styles.rowLabel}>Sound Alerts</Text><Text style={styles.rowValue}>On</Text></View>
      <View style={styles.row}><Text style={styles.rowLabel}>Vibration</Text><Text style={styles.rowValue}>On</Text></View>
      <View style={styles.row}><Text style={styles.rowLabel}>Quiet Hours</Text><Text style={styles.rowValue}>Off</Text></View>
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
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.neutral[200],
  },
  rowLabel: { ...typography.body, color: colors.neutral[900] },
  rowValue: { ...typography.bodyMedium, color: colors.neutral[500] },
});
