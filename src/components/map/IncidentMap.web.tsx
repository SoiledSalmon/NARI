import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapIncident } from '../../data/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface IncidentMapProps {
  incident: MapIncident;
}

export function IncidentMap({ incident }: IncidentMapProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>PIN</Text>
      <Text style={styles.label}>{incident.locationLabel}</Text>
      <Text style={styles.coords}>
        {incident.location.latitude.toFixed(4)},{' '}
        {incident.location.longitude.toFixed(4)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  icon: {
    ...typography.bodySemibold,
    color: colors.status.danger,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
    marginBottom: 4,
  },
  coords: {
    ...typography.monoSmall,
    color: colors.neutral[500],
  },
});
