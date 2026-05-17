import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertSeverity } from '../../data/types';
import { colors } from '../../theme/colors';

interface IncidentPinProps {
  severity: AlertSeverity;
}

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  high: colors.status.danger,
  moderate: colors.status.alert,
  low: colors.status.safe,
};

export function IncidentPin({ severity }: IncidentPinProps) {
  return (
    <View style={[styles.pin, { backgroundColor: SEVERITY_COLORS[severity] }]}>
      <Text style={styles.label}>!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.neutral[0],
  },
  label: {
    color: colors.neutral[0],
    fontWeight: '800',
  },
});
