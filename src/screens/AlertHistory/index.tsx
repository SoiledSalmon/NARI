/**
 * AlertHistory — List of all past alerts.
 * Navigable from Settings → Alert History.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SettingsStackParamList, ROUTES } from '../../navigation/routes';
import { TopBar } from '../../components/layout/TopBar';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAlertStore } from '../../stores/alertStore';
import { dataProvider } from '../../../dataConfig';
import { Alert } from '../../data/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows } from '../../theme/spacing';

type Props = NativeStackScreenProps<SettingsStackParamList, 'AlertHistory'>;

export default function AlertHistoryScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { allAlerts, setAllAlerts, isLoading, setLoading } = useAlertStore();

  useEffect(() => {
    setLoading(true);
    dataProvider.getAllAlerts().then((alerts) => {
      setAllAlerts(alerts);
      setLoading(false);
    });
  }, [setAllAlerts, setLoading]);

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderAlert = ({ item }: { item: Alert }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate(ROUTES.SETTINGS_STACK.ALERT_DETAIL, {
          alertId: item.id,
        })
      }
    >
      <Card style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <View style={styles.alertInfo}>
            <Text style={styles.alertTitle}>{item.title}</Text>
            <Text style={styles.alertDate}>{formatDate(item.timestamp)}</Text>
          </View>
          <Badge
            label={
              item.outcome === 'resolved'
                ? t('alertHistory.resolved')
                : t('alertHistory.falseAlarm')
            }
            preset={item.outcome === 'resolved' ? 'resolved' : 'falseAlarm'}
          />
        </View>
        <Text style={styles.alertDesc} numberOfLines={2}>
          {item.description}
        </Text>
        {item.locationLabel ? (
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{item.locationLabel}</Text>
          </View>
        ) : null}
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TopBar title={t('alertHistory.title')} showBack />
      <Text style={styles.subtitle}>{t('alertHistory.subtitle')}</Text>

      <FlatList
        data={allAlerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlert}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No alerts yet</Text>
            <Text style={styles.emptySubtitle}>
              Past safety events will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.cream,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
    gap: spacing.md,
  },
  alertCard: {
    // default Card style
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  alertInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  alertTitle: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
    marginBottom: 2,
  },
  alertDate: {
    ...typography.caption,
    color: colors.neutral[500],
  },
  alertDesc: {
    ...typography.bodySmall,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationIcon: {
    fontSize: 12,
  },
  locationText: {
    ...typography.caption,
    color: colors.neutral[500],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing['6xl'],
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
});
