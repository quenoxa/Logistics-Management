import React, { useState, useEffect } from 'react';
import {
  Radio,
  Play,
  Pause,
  RotateCw,
  Clock,
  BatteryCharging,
  Thermometer,
  Gauge,
  Compass,
  Wifi,
  Truck,
} from 'lucide-react';
import { trackingApi } from '../api/client';
import { Delivery } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { DeliveryMap } from '../components/map/DeliveryMap';

export const LiveTracking: React.FC = () => {
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRouteData, setSelectedRouteData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isStepping, setIsStepping] = useState(false);

  const fetchActiveDeliveries = async () => {
    try {
      const data = await trackingApi.getActive();
      setActiveDeliveries(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch active tracking data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSelectedRoute = async (id: string) => {
    try {
      const data = await trackingApi.getRoute(id);
      setSelectedRouteData(data);
    } catch (err) {
      console.error('Failed to fetch route data:', err);
    }
  };

  useEffect(() => {
    fetchActiveDeliveries();
    const interval = setInterval(fetchActiveDeliveries, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchSelectedRoute(selectedId);
    }
  }, [selectedId]);

  // Auto-play simulation timer
  useEffect(() => {
    let timer: any;
    if (isAutoPlaying) {
      timer = setInterval(async () => {
        if (selectedId) {
          await handleSimulateStep();
        }
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying, selectedId]);

  const handleSimulateStep = async () => {
    if (!selectedId) return;
    try {
      setIsStepping(true);
      await trackingApi.simulateStep(selectedId, 6);
      await fetchActiveDeliveries();
      await fetchSelectedRoute(selectedId);
    } catch (err) {
      console.error('Simulation step failed:', err);
    } finally {
      setIsStepping(false);
    }
  };

  const handleSimulateAll = async () => {
    try {
      setIsStepping(true);
      await trackingApi.simulateAll();
      await fetchActiveDeliveries();
      if (selectedId) {
        await fetchSelectedRoute(selectedId);
      }
    } catch (err) {
      console.error('Simulation all failed:', err);
    } finally {
      setIsStepping(false);
    }
  };

  const selectedDelivery = activeDeliveries.find((d) => d.id === selectedId);

  // Markers for all other active vehicles on the map
  const mapVehicles = activeDeliveries.map((d) => ({
    id: d.id,
    code: d.vehicle?.code || 'VEH',
    lat: d.currentLat || d.order.pickupLat,
    lng: d.currentLng || d.order.pickupLng,
    status: d.status,
    trackingNumber: d.trackingNumber,
    speed: d.status === 'IN_TRANSIT' ? 62 : 35,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Live Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time vehicle locations, corridor routes, and delivery progress
          </p>
        </div>

        {/* Simulation Controls */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 border transition-colors ${
              isAutoPlaying
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-slate-600" />}
            <span>{isAutoPlaying ? 'Pause live stream' : 'Auto simulation'}</span>
          </button>

          <button
            onClick={handleSimulateStep}
            disabled={isStepping || !selectedId}
            className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isStepping ? 'animate-spin' : ''}`} />
            <span>Advance GPS step</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Active Vehicles Selector (Left) + Tactical Map & HUD (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Active Vehicles List */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 lg:col-span-1 h-[680px] flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-orange-500" />
              <span>ACTIVE EN ROUTE ({activeDeliveries.length})</span>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {activeDeliveries.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-mono text-xs">
                No active deliveries en route
              </div>
            ) : (
              activeDeliveries.map((del) => {
                const isSelected = del.id === selectedId;
                return (
                  <div
                    key={del.id}
                    onClick={() => setSelectedId(del.id)}
                    className={`p-3 rounded-lg border cursor-pointer font-mono text-xs transition-all ${
                      isSelected
                        ? 'bg-orange-50/50 border-orange-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-xs">{del.vehicle?.code}</span>
                      <StatusBadge status={del.status} type="delivery" size="sm" />
                    </div>

                    <div className="text-[11px] text-orange-600 font-bold">{del.trackingNumber}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-1">
                      {del.order?.customerName}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Progress</span>
                        <span className="text-slate-900 font-bold">{del.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${del.progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Columns: Map & Tactical HUD */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tactical Telemetry HUD Bar */}
          {selectedRouteData && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-orange-500" />
                  <span>Ground Speed</span>
                </div>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {selectedRouteData.telemetry?.speedKmH || 62}{' '}
                  <span className="text-xs font-normal text-slate-400">km/h</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <Compass className="w-3 h-3 text-sky-600" />
                  <span>Heading</span>
                </div>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {selectedRouteData.telemetry?.headingDeg || 78}°{' '}
                  <span className="text-xs font-normal text-slate-400">ENE</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>Dynamic ETA</span>
                </div>
                <div className="text-lg font-bold text-emerald-700 mt-1">
                  {selectedRouteData.route?.etaMinutesRemaining || 25}{' '}
                  <span className="text-xs font-normal text-slate-400">min</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-blue-600" />
                  <span>Cargo Temp</span>
                </div>
                <div className="text-lg font-bold text-sky-700 mt-1">
                  {selectedRouteData.telemetry?.cargoTempC || 20.5}°C
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <BatteryCharging className="w-3 h-3 text-orange-500" />
                  <span>Fuel / Battery</span>
                </div>
                <div className="text-lg font-bold text-orange-600 mt-1">
                  {selectedRouteData.delivery?.vehicle?.currentFuelPercent || 85}%
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-emerald-600" />
                  <span>5G Telematics</span>
                </div>
                <div className="text-lg font-bold text-emerald-700 mt-1">
                  98%{' '}
                  <span className="text-xs font-normal text-slate-400">LOCKED</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Live Map */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <DeliveryMap
              origin={
                selectedRouteData?.route?.origin
                  ? {
                      lat: selectedRouteData.route.origin.lat,
                      lng: selectedRouteData.route.origin.lng,
                      label: selectedRouteData.route.origin.address,
                    }
                  : undefined
              }
              destination={
                selectedRouteData?.route?.destination
                  ? {
                      lat: selectedRouteData.route.destination.lat,
                      lng: selectedRouteData.route.destination.lng,
                      label: selectedRouteData.route.destination.address,
                    }
                  : undefined
              }
              currentPosition={
                selectedRouteData?.route?.currentPosition
                  ? {
                      lat: selectedRouteData.route.currentPosition.lat,
                      lng: selectedRouteData.route.currentPosition.lng,
                    }
                  : undefined
              }
              waypoints={selectedRouteData?.route?.waypoints || []}
              vehicles={mapVehicles}
              height="520px"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
