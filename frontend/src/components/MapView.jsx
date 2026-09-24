import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix default marker icons (Leaflet + bundlers quirk)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const ambulanceIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [30, 46],
  className: 'ambulance-marker'
});

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], map.getZoom());
  }, [lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/**
 * markers: [{ lat, lng, label, type: 'patient' | 'hospital' | 'ambulance' }]
 * showRoute: draws a line between patient and ambulance if both are present
 */
export default function MapView({ markers = [], height = '360px', zoom = 13 }) {
  const center = markers[0] ? [markers[0].lat, markers[0].lng] : [17.385, 78.4867];
  const patient = markers.find((m) => m.type === 'patient');
  const ambulance = markers.find((m) => m.type === 'ambulance');

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-slate-200">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m, idx) => (
          <Marker key={idx} position={[m.lat, m.lng]} icon={m.type === 'ambulance' ? ambulanceIcon : undefined}>
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
        {patient && ambulance && (
          <Polyline positions={[[patient.lat, patient.lng], [ambulance.lat, ambulance.lng]]} color="#c8102e" dashArray="6 8" />
        )}
        {markers[0] && <Recenter lat={markers[0].lat} lng={markers[0].lng} />}
      </MapContainer>
    </div>
  );
}
