import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../navigation/routes';
import { ROUTES } from '../../navigation/routes';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useContactStore } from '../../stores/contactStore';
import { dataProvider } from '../../../dataConfig';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows } from '../../theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'AddContacts'>;

export default function AddContactsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { contacts, setContacts } = useContactStore();

  useEffect(() => {
    // Load mock contacts
    dataProvider.getTrustedContacts().then(setContacts);
  }, [setContacts]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>NARI</Text>
        <Text style={styles.title}>{t('contacts.title')}</Text>
        <Text style={styles.subtitle}>{t('contacts.subtitle')}</Text>

        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.contactRow}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: item.avatarColor },
                ]}
              >
                <Text style={styles.avatarText}>{item.avatarInitial}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactRelation}>
                  {item.relationship}
                </Text>
              </View>
              <Badge
                label={item.isNariUser ? t('contacts.badgeNari') : t('contacts.badgeSms')}
                preset={item.isNariUser ? 'nari' : 'sms'}
              />
            </View>
          )}
          ListFooterComponent={
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addIcon}>+</Text>
              <Text style={styles.addText}>{t('contacts.addNew')}</Text>
            </TouchableOpacity>
          }
          contentContainerStyle={styles.listContent}
        />
      </View>

      <View style={styles.footer}>
        <Button
          title={t('contacts.continue')}
          onPress={() => navigation.navigate(ROUTES.AUTH.PERMISSIONS)}
        />
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
    marginBottom: spacing['3xl'],
  },
  listContent: {
    gap: spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.linen,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    ...shadows.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.bodySemibold,
    color: colors.neutral[700],
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
  },
  contactRelation: {
    ...typography.caption,
    color: colors.neutral[500],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    borderStyle: 'dashed',
    marginTop: spacing.sm,
  },
  addIcon: {
    ...typography.h2,
    color: colors.brand.primary,
    marginRight: spacing.sm,
  },
  addText: {
    ...typography.bodyMedium,
    color: colors.brand.primary,
  },
  footer: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['4xl'],
    paddingTop: spacing.lg,
  },
});
