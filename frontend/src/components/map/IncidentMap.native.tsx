import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { MapIncident } from '../../data/types';
import { IncidentPin } from './IncidentPin';

interface IncidentMapProps {
  incident: MapIncident;
}

export function IncidentMap({ incident }: IncidentMapProps) {
  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: incident.location.latitude,
        longitude: incident.location.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
    >
      <UrlTile
        urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maximumZ={19}
      />
      <Marker coordinate={incident.location}>
        <IncidentPin severity={incident.severity} />
      </Marker>
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 220,
  },
});
