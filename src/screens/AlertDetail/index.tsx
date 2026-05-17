/**
 * AlertDetail — Full detail view for a single past alert.
 * Shows outcome, location, sensor snapshot, narrative, and actions.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert as RNAlert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SettingsStackParamList } from '../../navigation/routes';
import { TopBar } from '../../components/layout/TopBar';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { dataProvider } from '../../../dataConfig';
import { useAlertStore } from '../../stores/alertStore';
import { Alert } from '../../data/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows } from '../../theme/spacing';

type Props = NativeStackScreenProps<SettingsStackParamList, 'AlertDetail'>;

export default function AlertDetailScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const [alert, setAlert] = useState<Alert | null>(null);
  const removeAlert = useAlertStore((s) => s.removeAlert);

  useEffect(() => {
    dataProvider.getAlertById(route.params.alertId).then(setAlert);
  }, [route.params.alertId]);

  const handleDelete = () => {
    RNAlert.alert(
      t('alertDetail.deleteRecord'),
      'This action cannot be undone.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            if (alert) {
              removeAlert(alert.id);
              navigation.goBack();
            }
          },
        },
      ],
    );
  };

  if (!alert) {
    return (
      <View style={styles.container}>
        <TopBar title={t('alertDetail.title')} showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  const formatDateTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })} at ${d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  return (
    <View style={styles.container}>
      <TopBar title={t('alertDetail.title')} showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Outcome badge */}
        <View style={styles.outcomeRow}>
          <Badge
            label={
              alert.outcome === 'resolved'
                ? 'RESOLVED'
                : 'FALSE ALARM'
            }
            preset={alert.outcome === 'resolved' ? 'resolved' : 'falseAlarm'}
          />
          <Text style={styles.dateText}>{formatDateTime(alert.timestamp)}</Text>
        </View>

        {/* Title and description */}
        <Text style={styles.alertTitle}>{alert.title}</Text>

        {/* Location */}
        {alert.locationLabel && (
          <Card style={styles.locationCard}>
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{alert.locationLabel}</Text>
                {alert.locationAddress ? (
                  <Text style={styles.locationAddress}>
                    {alert.locationAddress}
                  </Text>
                ) : null}
              </View>
            </View>
          </Card>
        )}

        {/* Sensor Snapshot */}
        {alert.sensorSnapshot && alert.sensorSnapshot.heartRate && (
          <Card style={styles.sensorCard}>
            <Text style={styles.sectionLabel}>
              {t('alertDetail.technicalData')}
            </Text>
            <View style={styles.sensorRow}>
              <Text style={styles.sensorLabel}>Heart Rate</Text>
              <Text style={styles.sensorValue}>
                {alert.sensorSnapshot.heartRate.value}{' '}
                {alert.sensorSnapshot.heartRate.unit}
              </Text>
            </View>
          </Card>
        )}

        {/* Narrative */}
        <Card style={styles.narrativeCard}>
          <Text style={styles.sectionLabel}>
            {t('alertDetail.resolvedEvent')}
          </Text>
          <Text style={styles.narrativeText}>{alert.narrativeDetail}</Text>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={t('alertDetail.shareReport')}
            onPress={() => {}}
            variant="outlined"
          />
          <Button
            title={t('alertDetail.deleteRecord')}
            onPress={handleDelete}
            variant="text"
            style={{ marginTop: spacing.sm }}
          />
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
  outcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  dateText: {
    ...typography.caption,
    color: colors.neutral[500],
  },
  alertTitle: {
    ...typography.h1,
    color: colors.neutral[900],
    marginBottom: spacing['2xl'],
  },
  locationCard: {
    marginBottom: spacing.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  locationIcon: {
    fontSize: 24,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
  },
  locationAddress: {
    ...typography.caption,
    color: colors.neutral[500],
    marginTop: 2,
  },
  sensorCard: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.captionMedium,
    color: colors.neutral[500],
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sensorLabel: {
    ...typography.bodySmall,
    color: colors.neutral[700],
  },
  sensorValue: {
    ...typography.mono,
    color: colors.status.alert,
    fontWeight: '600',
  },
  narrativeCard: {
    marginBottom: spacing['2xl'],
  },
  narrativeText: {
    ...typography.body,
    color: colors.neutral[700],
    lineHeight: 24,
  },
  actions: {
    gap: spacing.sm,
  },
});
