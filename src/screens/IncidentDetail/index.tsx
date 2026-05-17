/**
 * IncidentDetail — Full-screen overlay showing map incident details.
 * Accessed from the Map screen's incident list.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList, ROUTES } from '../../navigation/routes';
import { TopBar } from '../../components/layout/TopBar';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { IncidentMap } from '../../components/map/IncidentMap';
import { dataProvider } from '../../../dataConfig';
import { MapIncident } from '../../data/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows } from '../../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'IncidentDetail'>;

const SEVERITY_COLORS = {
  high: colors.status.danger,
  moderate: colors.status.alert,
  low: colors.brand.accent,
};

const SEVERITY_BG = {
  high: colors.status.dangerLight,
  moderate: colors.status.alertLight,
  low: colors.status.safeLight,
};

export default function IncidentDetailScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const [incident, setIncident] = useState<MapIncident | null>(null);

  useEffect(() => {
    dataProvider.getIncidentById(route.params.incidentId).then(setIncident);
  }, [route.params.incidentId]);

  if (!incident) {
    return (
      <View style={styles.container}>
        <TopBar title={t('map.incidentDetail')} showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  const severityColor = SEVERITY_COLORS[incident.severity];
  const severityBg = SEVERITY_BG[incident.severity];

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ${t('map.ago')}`;
    return `${Math.floor(diff / 60)}h ${t('map.ago')}`;
  };

  return (
    <View style={styles.container}>
      <TopBar title={t('map.incidentDetail')} showBack />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Severity banner */}
        <View style={[styles.severityBanner, { backgroundColor: severityBg }]}>
          <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
          <Text style={[styles.severityText, { color: severityColor }]}>
            {incident.severity.toUpperCase()} SEVERITY
          </Text>
        </View>

        {/* Type and location */}
        <Card style={styles.infoCard}>
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>{t('map.incidentType')}</Text>
            <Text style={styles.fieldValue}>{incident.type}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>{t('map.timeReported')}</Text>
            <Text style={styles.fieldValue}>
              {formatTimeAgo(incident.reportedAt)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>{t('map.locationArea')}</Text>
            <Text style={styles.fieldValue}>{incident.locationLabel}</Text>
          </View>
        </Card>

        {/* Narrative */}
        <Card style={styles.narrativeCard}>
          <Text style={styles.narrativeLabel}>{t('map.reportDetails')}</Text>
          <Text style={styles.narrativeText}>{incident.narrativeDetail}</Text>
        </Card>

        <View style={styles.mapPlaceholder}>
          <IncidentMap incident={incident} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.cream,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.neutral[500],
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  severityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  severityText: {
    ...typography.captionMedium,
    letterSpacing: 1,
    fontWeight: '600',
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  fieldLabel: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
  fieldValue: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing.xs,
  },
  narrativeCard: {
    marginBottom: spacing.lg,
  },
  narrativeLabel: {
    ...typography.captionMedium,
    color: colors.neutral[500],
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  narrativeText: {
    ...typography.body,
    color: colors.neutral[700],
    lineHeight: 24,
  },
  mapPlaceholder: {
    backgroundColor: colors.neutral[100],
    borderRadius: radii.xl,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.sm,
  },
  mapIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  mapText: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
    marginBottom: 4,
  },
  mapCoords: {
    ...typography.monoSmall,
    color: colors.neutral[500],
  },
});
