import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';
import { IncidentPin } from '../../components/map/IncidentPin';
import { SafetyMap } from '../../components/map/SafetyMap';
import { dataProvider } from '../../../dataConfig';
import { MapIncident, LocationPoint } from '../../data/types';
import { RootStackParamList, ROUTES } from '../../navigation/routes';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows } from '../../theme/spacing';

const FILTERS = ['All', 'High', 'Med', 'Low'] as const;
type Filter = typeof FILTERS[number];

const CENTER: LocationPoint = { latitude: 12.9716, longitude: 77.5946 };

export default function MapScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [incidents, setIncidents] = useState<MapIncident[]>([]);
  const [filter, setFilter] = useState<Filter>('All');
  const [center, setCenter] = useState<LocationPoint>(CENTER);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dataProvider.getCurrentLocation().then(setCenter).catch(() => setCenter(CENTER));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    dataProvider
      .getNearbyIncidents(center, 5)
      .then(setIncidents)
      .catch(() => setError('Location unavailable. Showing last known area.'))
      .finally(() => setIsLoading(false));
  }, [center]);

  const filteredIncidents = incidents.filter((inc) => {
    if (filter === 'All') return true;
    if (filter === 'High') return inc.severity === 'high';
    if (filter === 'Med') return inc.severity === 'moderate';
    if (filter === 'Low') return inc.severity === 'low';
    return true;
  });

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ${t('map.ago')}`;
    return `${Math.floor(diff / 60)}h ${t('map.ago')}`;
  };

  const openIncident = (incident: MapIncident) => {
    navigation.navigate(ROUTES.OVERLAY.INCIDENT_DETAIL, {
      incidentId: incident.id,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('map.title')}</Text>

      <View style={styles.mapFrame}>
        <SafetyMap
          center={center}
          incidents={filteredIncidents}
          onIncidentPress={openIncident}
        />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Chip
            key={f}
            label={t(`map.filter${f}`)}
            selected={filter === f}
            onPress={() => setFilter(f)}
          />
        ))}
      </View>

      {error && (
        <Card style={styles.incidentCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      {isLoading && (
        <>
          <SkeletonCard style={styles.incidentCard} />
          <SkeletonCard style={styles.incidentCard} />
        </>
      )}

      {!isLoading && filteredIncidents.map((inc) => (
        <TouchableOpacity key={inc.id} onPress={() => openIncident(inc)}>
          <Card style={styles.incidentCard}>
            <View style={styles.incidentHeader}>
              <IncidentPin severity={inc.severity} />
              <View style={styles.incidentInfo}>
                <Text style={styles.incidentType}>{inc.type}</Text>
                <Text style={styles.incidentLocation}>
                  {inc.locationLabel} · {formatTimeAgo(inc.reportedAt)}
                </Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.cream,
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
  },
  title: {
    ...typography.h1,
    color: colors.neutral[900],
    marginBottom: spacing.lg,
  },
  mapFrame: {
    height: 260,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    backgroundColor: colors.neutral[100],
    ...shadows.sm,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  incidentCard: {
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.status.danger,
  },
  incidentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  incidentInfo: {
    flex: 1,
  },
  incidentType: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
  },
  incidentLocation: {
    ...typography.caption,
    color: colors.neutral[500],
  },
});
