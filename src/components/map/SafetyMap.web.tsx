import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LocationPoint, MapIncident } from '../../data/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { LocationDot } from './LocationDot';

interface SafetyMapProps {
  center: LocationPoint;
  incidents: MapIncident[];
  onIncidentPress: (incident: MapIncident) => void;
}

export function SafetyMap({ incidents }: SafetyMapProps) {
  return (
    <View style={styles.container}>
      <LocationDot />
      <Text style={styles.label}>{incidents.length} incidents nearby</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
});
