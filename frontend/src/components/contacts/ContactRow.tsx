/**
 * ContactRow — Shared contact display component.
 * Used in AddContacts, Settings → Emergency Contacts, and SOS Active.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DeliveryBadge } from './DeliveryBadge';
import { TrustedContact } from '../../data/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows } from '../../theme/spacing';

interface ContactRowProps {
  contact: TrustedContact;
  onPress?: () => void;
  showRemove?: boolean;
  onRemove?: () => void;
}

export function ContactRow({
  contact,
  onPress,
  showRemove = false,
  onRemove,
}: ContactRowProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        style={[styles.avatar, { backgroundColor: contact.avatarColor }]}
      >
        <Text style={styles.avatarText}>{contact.avatarInitial}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{contact.name}</Text>
        <Text style={styles.relationship}>{contact.relationship}</Text>
      </View>

      <DeliveryBadge deliveryMethod={contact.deliveryMethod} />

      {showRemove && onRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${contact.name}`}
        >
          <Text style={styles.removeIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
  info: {
    flex: 1,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
  },
  relationship: {
    ...typography.caption,
    color: colors.neutral[500],
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  removeIcon: {
    fontSize: 16,
    color: colors.neutral[500],
  },
});
