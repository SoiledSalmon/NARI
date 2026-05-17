import React from 'react';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { LocationPoint, MapIncident } from '../../data/types';
import { IncidentPin } from './IncidentPin';
import { LocationDot } from './LocationDot';

interface SafetyMapProps {
  center: LocationPoint;
  incidents: MapIncident[];
  onIncidentPress: (incident: MapIncident) => void;
}

export function SafetyMap({
  center,
  incidents,
  onIncidentPress,
}: SafetyMapProps) {
  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      <UrlTile
        urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maximumZ={19}
      />
      <Marker coordinate={center}>
        <LocationDot />
      </Marker>
      {incidents.map((incident) => (
        <Marker
          key={incident.id}
          coordinate={incident.location}
          onPress={() => onIncidentPress(incident)}
        >
          <IncidentPin severity={incident.severity} />
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
});
