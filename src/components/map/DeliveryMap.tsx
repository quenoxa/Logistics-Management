import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom icons using inline SVG
const createCustomIcon = (color: string, iconType: 'truck' | 'origin' | 'destination') => {
  let svgContent = '';
  if (iconType === 'truck') {
    svgContent = `
      <div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.25);">
        <svg style="width: 16px; height: 16px; fill: white;" viewBox="0 0 24 24">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      </div>
    `;
  } else if (iconType === 'origin') {
    svgContent = `
      <div style="background-color: #2563eb; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(37,99,235,0.4);">
        <svg style="width: 14px; height: 14px; fill: white;" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `;
  } else {
    svgContent = `
      <div style="background-color: #16a34a; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(22,163,74,0.4);">
        <svg style="width: 14px; height: 14px; fill: white;" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      </div>
    `;
  }

  return L.divIcon({
    html: svgContent,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const vehicleIcon = createCustomIcon('#ea580c', 'truck');
const originIcon = createCustomIcon('#2563eb', 'origin');
const destinationIcon = createCustomIcon('#16a34a', 'destination');

// Map auto-fit bounds helper
const FitBoundsHandler: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [points, map]);
  return null;
};

interface DeliveryMapProps {
  origin?: { lat: number; lng: number; label?: string };
  destination?: { lat: number; lng: number; label?: string };
  currentPosition?: { lat: number; lng: number };
  waypoints?: [number, number][];
  vehicles?: Array<{
    id: string;
    code: string;
    lat: number;
    lng: number;
    status: string;
    trackingNumber?: string;
    speed?: number;
  }>;
  height?: string;
}

export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  origin,
  destination,
  currentPosition,
  waypoints = [],
  vehicles = [],
  height = '420px',
}) => {
  const defaultCenter: [number, number] = [19.2967, 73.0631];
  const allPoints: [number, number][] = [];

  if (origin) allPoints.push([origin.lat, origin.lng]);
  if (destination) allPoints.push([destination.lat, destination.lng]);
  if (currentPosition) allPoints.push([currentPosition.lat, currentPosition.lng]);
  vehicles.forEach((v) => allPoints.push([v.lat, v.lng]));
  waypoints.forEach((p) => allPoints.push(p));

  const center: [number, number] = allPoints.length > 0 ? allPoints[0] : defaultCenter;

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-slate-200 relative shadow-sm">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {allPoints.length > 1 && <FitBoundsHandler points={allPoints} />}

        {/* Origin Marker */}
        {origin && (
          <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
            <Popup>
              <div className="font-mono text-xs">
                <span className="text-blue-600 font-bold block mb-0.5">ORIGIN / PICKUP HUB</span>
                <p className="text-slate-700">{origin.label || `${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}`}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <div className="font-mono text-xs">
                <span className="text-emerald-700 font-bold block mb-0.5">DELIVERY DESTINATION</span>
                <p className="text-slate-700">{destination.label || `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Single Current Position Marker */}
        {currentPosition && (
          <Marker position={[currentPosition.lat, currentPosition.lng]} icon={vehicleIcon}>
            <Popup>
              <div className="font-mono text-xs">
                <span className="text-orange-600 font-bold block mb-0.5">ACTIVE VEHICLE POSITION</span>
                <p className="text-slate-700">GPS: {currentPosition.lat.toFixed(5)}, {currentPosition.lng.toFixed(5)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Multiple Fleet Vehicles */}
        {vehicles.map((v) => (
          <Marker key={v.id} position={[v.lat, v.lng]} icon={vehicleIcon}>
            <Popup>
              <div className="font-mono text-xs space-y-1">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1">
                  <span className="text-orange-600 font-bold">{v.code}</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">{v.status}</span>
                </div>
                {v.trackingNumber && (
                  <p className="text-slate-600">Tracking: <span className="text-slate-900 font-bold">{v.trackingNumber}</span></p>
                )}
                {v.speed !== undefined && (
                  <p className="text-slate-500 text-[11px]">Speed: <span className="text-emerald-700 font-bold">{v.speed} km/h</span></p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route Polyline */}
        {waypoints.length > 1 && (
          <>
            <Polyline
              positions={waypoints}
              pathOptions={{
                color: '#ea580c',
                weight: 4,
                opacity: 0.9,
              }}
            />
            <Polyline
              positions={waypoints}
              pathOptions={{
                color: '#ea580c',
                weight: 8,
                opacity: 0.2,
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
};
