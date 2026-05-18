import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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
import { haptic } from '../../services/hapticService';

const FILTERS = ['All', 'High', 'Med', 'Low'] as const;
type Filter = typeof FILTERS[number];

const CENTER: LocationPoint = { latitude: 12.9716, longitude: 77.5946 };

const SEVERITY_STYLE = {
  high: {
    bg: colors.status.dangerLight,
    fg: colors.status.danger,
  },
  moderate: {
    bg: colors.status.alertLight,
    fg: colors.status.alert,
  },
  low: {
    bg: colors.status.safeLight,
    fg: colors.status.safe,
  },
};

const SEVERITY_ORDER = {
  high: 0,
  moderate: 1,
  low: 2,
};

export default function MapScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [incidents, setIncidents] = useState<MapIncident[]>([]);
  const [filter, setFilter] = useState<Filter>('All');
  const [center, setCenter] = useState<LocationPoint>(CENTER);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gpsUnavailable, setGpsUnavailable] = useState(false);

  useEffect(() => {
    dataProvider
      .getCurrentLocation()
      .then((location) => {
        setCenter(location);
        setGpsUnavailable(false);
      })
      .catch(() => {
        setCenter(CENTER);
        setGpsUnavailable(true);
      });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    dataProvider
      .getNearbyIncidents(center, 5)
      .then(setIncidents)
      .catch(() => setError('Location unavailable. Showing your last known area.'))
      .finally(() => setIsLoading(false));
  }, [center]);

  const filteredIncidents = incidents
    .filter((inc) => {
      if (filter === 'All') return true;
      if (filter === 'High') return inc.severity === 'high';
      if (filter === 'Med') return inc.severity === 'moderate';
      if (filter === 'Low') return inc.severity === 'low';
      return true;
    })
    .sort((a, b) => {
      const severityDelta = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      return severityDelta || b.reportedAt - a.reportedAt;
    });

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ${t('map.ago')}`;
    return `${Math.floor(diff / 60)}h ${t('map.ago')}`;
  };

  const openIncident = (incident: MapIncident) => {
    haptic.medium();
    navigation.navigate(ROUTES.OVERLAY.INCIDENT_DETAIL, {
      incidentId: incident.id,
    });
  };

  const centerOnMe = () => {
    setError(null);
    dataProvider
      .getCurrentLocation()
      .then((location) => {
        setCenter(location);
        setGpsUnavailable(false);
      })
      .catch(() => {
        setGpsUnavailable(true);
        setError('Location unavailable. Enable location in Settings.');
      });
  };

  const reportCountText =
    filteredIncidents.length === 1
      ? '1 report near your area'
      : `${filteredIncidents.length} reports near your area`;

  return (
    <View style={styles.container}>
      <View style={styles.mapLayer}>
        <SafetyMap
          center={center}
          incidents={filteredIncidents}
          onIncidentPress={openIncident}
        />
      </View>

      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>{t('map.title')}</Text>
        </View>
        <TouchableOpacity
          style={styles.centerButton}
          accessibilityRole="button"
          accessibilityLabel="Centre on my current location"
          onPress={centerOnMe}
        >
          <Text style={styles.centerButtonText}>◎</Text>
        </TouchableOpacity>
      </View>

      {gpsUnavailable && (
        <View style={styles.gpsOverlay} pointerEvents="none">
          <Text style={styles.gpsOverlayTitle}>Location unavailable.</Text>
          <Text style={styles.gpsOverlayText}>Showing your last known area.</Text>
        </View>
      )}

      {error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      <View style={styles.panel}>
        <View style={styles.panelHandle} />
        <View style={styles.panelHeader}>
          <View style={styles.panelHeaderText}>
            <Text style={styles.panelTitle}>Nearby alerts</Text>
            <Text style={styles.panelMeta}>{reportCountText}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <Chip
              key={f}
              label={t(`map.filter${f}`)}
              selected={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </ScrollView>

        <View style={styles.listWrapper}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.incidentList}>
            {isLoading && (
              <>
                <SkeletonCard style={styles.incidentCard} />
                <SkeletonCard style={styles.incidentCard} />
              </>
            )}

            {!isLoading && filteredIncidents.length === 0 && (
              <Text style={styles.emptyText} numberOfLines={3}>
                {filter === 'All'
                  ? 'No incidents reported in this area recently.'
                  : 'No incidents match this filter right now.'}
              </Text>
            )}

            {!isLoading && filteredIncidents.map((inc) => (
              <TouchableOpacity
                key={inc.id}
                onPress={() => openIncident(inc)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${inc.type}, ${inc.locationLabel}`}
              >
                <Card style={styles.incidentCard}>
                  <View style={styles.incidentHeader}>
                    <IncidentPin severity={inc.severity} />
                    <View style={styles.incidentInfo}>
                      <Text style={styles.incidentType} numberOfLines={2}>
                        {inc.type}
                      </Text>
                      <Text style={styles.incidentLocation} numberOfLines={2}>
                        {inc.locationLabel} · {formatTimeAgo(inc.reportedAt)}
                      </Text>
                    </View>
                    <View style={[styles.severityChip, { backgroundColor: SEVERITY_STYLE[inc.severity].bg }]}>
                      <Text style={[styles.severityText, { color: SEVERITY_STYLE[inc.severity].fg }]}>
                        {inc.severity}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.cream,
  },
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.brand.sand,
  },
  topBar: {
    position: 'absolute',
    top: spacing['3xl'],
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.overlay.white80,
    ...shadows.sm,
  },
  kicker: {
    ...typography.captionMedium,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    ...typography.h2,
    fontSize: 24,
    lineHeight: 30,
    color: colors.neutral[900],
  },
  centerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[0],
  },
  centerButtonText: {
    ...typography.h2,
    color: colors.brand.primary,
  },
  errorCard: {
    position: 'absolute',
    top: 132,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.status.dangerLight,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.status.danger,
  },
  gpsOverlay: {
    position: 'absolute',
    top: 196,
    left: spacing.xl,
    right: spacing.xl,
    borderRadius: radii.xl,
    padding: spacing.lg,
    backgroundColor: colors.overlay.black50,
  },
  gpsOverlayTitle: {
    ...typography.bodySemibold,
    color: colors.brand.cream,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  gpsOverlayText: {
    ...typography.bodySmall,
    color: colors.brand.cream,
    textAlign: 'center',
    opacity: 0.86,
  },
  panel: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 84,
    maxHeight: '45%',
    flexShrink: 1,
    borderRadius: radii.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.brand.cream,
    overflow: 'hidden',
    ...shadows.lg,
  },
  panelHandle: {
    alignSelf: 'center',
    width: 58,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neutral[300],
    marginBottom: spacing.lg,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  panelHeaderText: {
    flex: 1,
  },
  panelTitle: {
    ...typography.h2,
    fontSize: 24,
    lineHeight: 30,
    color: colors.neutral[900],
  },
  panelMeta: {
    ...typography.caption,
    color: colors.neutral[500],
    marginTop: 2,
    lineHeight: 17,
  },
  filterRow: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  listWrapper: {
    flex: 1,
  },
  incidentList: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  incidentCard: {
    backgroundColor: colors.neutral[0],
  },
  incidentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  incidentInfo: {
    flex: 1,
    minWidth: 0,
  },
  incidentType: {
    ...typography.bodyMedium,
    color: colors.neutral[900],
    lineHeight: 23,
  },
  incidentLocation: {
    ...typography.caption,
    color: colors.neutral[500],
    marginTop: 2,
    lineHeight: 17,
  },
  severityChip: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexShrink: 0,
  },
  severityText: {
    ...typography.captionMedium,
    textTransform: 'capitalize',
    letterSpacing: 0.2,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.neutral[700],
    paddingVertical: spacing['2xl'],
    lineHeight: 21,
  },
});
