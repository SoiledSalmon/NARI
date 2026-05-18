import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../navigation/routes';
import { useContactStore } from '../../stores/contactStore';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

type Props = NativeStackScreenProps<SettingsStackParamList, 'EmergencyContacts'>;

export default function EmergencyContactsScreen({ navigation }: Props) {
  const contacts = useContactStore((s) => s.contacts);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Emergency Contacts</Text>
      <Text style={styles.subtitle}>
        These people will be notified during an SOS or Journey.
      </Text>

      {contacts.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No contacts added yet</Text>
          <Text style={styles.emptyText}>
            Add trusted contacts so they can be alerted when you need help.
          </Text>
        </Card>
      ) : (
        contacts.map((contact, i) => (
          <Card key={contact.name + i} style={styles.contactCard}>
            <View style={styles.contactAvatar}>
              <Text style={styles.avatarText}>{contact.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
            </View>
          </Card>
        ))
      )}
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
  emptyCard: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  emptyTitle: { ...typography.h3, color: colors.neutral[700], marginBottom: spacing.sm },
  emptyText: { ...typography.bodySmall, color: colors.neutral[500], textAlign: 'center', lineHeight: 21 },
  contactCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.lg },
  contactAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.brand.sand,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...typography.h3, color: colors.brand.primary },
  contactInfo: { flex: 1, minWidth: 0 },
  contactName: { ...typography.bodyMedium, color: colors.neutral[900] },
  contactPhone: { ...typography.caption, color: colors.neutral[500], marginTop: 2 },
});
