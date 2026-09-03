import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom icons using inline SVG with strict palette
const createCustomIcon = (color: string, iconType: 'truck' | 'origin' | 'destination') => {
  let svgContent = '';
  if (iconType === 'truck') {
    svgContent = `
      <div style="background: ${color}; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #0B1220; box-shadow: 0 0 15px rgba(212,168,79,0.5);">
        <svg style="width: 17px; height: 17px; fill: #0B1220;" viewBox="0 0 24 24">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      </div>
    `;
  } else if (iconType === 'origin') {
    svgContent = `
      <div style="background: #5B9CF6; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #0B1220; box-shadow: 0 0 12px rgba(91,156,246,0.5);">
        <svg style="width: 15px; height: 15px; fill: #0B1220;" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `;
  } else {
    svgContent = `
      <div style="background: #31C48D; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #0B1220; box-shadow: 0 0 12px rgba(49,196,141,0.5);">
        <svg style="width: 15px; height: 15px; fill: #0B1220;" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      </div>
    `;
  }

  return L.divIcon({
    html: svgContent,
    className: 'custom-leaflet-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
};

const vehicleIcon = createCustomIcon('#D4A84F', 'truck');
const originIcon = createCustomIcon('#5B9CF6', 'origin');
const destinationIcon = createCustomIcon('#31C48D', 'destination');

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
  selectedDeliveryId?: string;
  routeData?: any;
  height?: string;
}

export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  origin,
  destination,
  currentPosition,
  waypoints = [],
  vehicles = [],
  selectedDeliveryId,
  routeData,
  height = '420px',
}) => {
  const defaultCenter: [number, number] = [19.2967, 73.0631];
  const allPoints: [number, number][] = [];

  if (origin) allPoints.push([origin.lat, origin.lng]);
  if (destination) allPoints.push([destination.lat, destination.lng]);
  if (currentPosition) allPoints.push([currentPosition.lat, currentPosition.lng]);
  vehicles.forEach((v) => allPoints.push([v.lat, v.lng]));
  waypoints.forEach((p) => allPoints.push(p));

  if (routeData?.routePolyline) {
    routeData.routePolyline.forEach((pt: [number, number]) => allPoints.push(pt));
  }

  const center: [number, number] = allPoints.length > 0 ? allPoints[0] : defaultCenter;

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-[#263852] relative shadow-panel bg-[#0B1220]">
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
              <div className="text-xs p-1 font-mono">
                <span className="font-bold text-[#5B9CF6] block uppercase">Hub Pickup</span>
                <span className="text-[#F8FAFC] font-sans">{origin.label || 'Origin Depot'}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <div className="text-xs p-1 font-mono">
                <span className="font-bold text-[#31C48D] block uppercase">Destination Drop-Off</span>
                <span className="text-[#F8FAFC] font-sans">{destination.label || 'Customer Drop-off'}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Vehicle Markers */}
        {vehicles.map((v) => (
          <Marker key={v.id} position={[v.lat, v.lng]} icon={vehicleIcon}>
            <Popup>
              <div className="text-xs p-1 space-y-1 font-mono">
                <span className="font-bold text-[#D4A84F] block">{v.code}</span>
                {v.trackingNumber && <span className="text-[#F8FAFC] block">#{v.trackingNumber}</span>}
                <div className="flex justify-between text-[#A9B7C9] text-[10px] gap-2 pt-1 border-t border-[#263852]">
                  <span>STATUS: {v.status}</span>
                  {v.speed !== undefined && <span className="text-[#31C48D] font-bold">{v.speed} km/h</span>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Current Position Marker if single view */}
        {currentPosition && !vehicles.length && (
          <Marker position={[currentPosition.lat, currentPosition.lng]} icon={vehicleIcon}>
            <Popup>
              <div className="text-xs p-1 font-mono">
                <span className="font-bold text-[#D4A84F] block">Current Telematics Fix</span>
                <span className="text-[#A9B7C9] text-[11px]">
                  {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Polyline */}
        {waypoints.length > 1 && (
          <Polyline
            positions={waypoints}
            pathOptions={{
              color: '#D4A84F',
              weight: 4,
              opacity: 0.8,
              dashArray: '8, 8',
            }}
          />
        )}

        {routeData?.routePolyline && (
          <Polyline
            positions={routeData.routePolyline}
            pathOptions={{
              color: '#5B9CF6',
              weight: 4,
              opacity: 0.9,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};
