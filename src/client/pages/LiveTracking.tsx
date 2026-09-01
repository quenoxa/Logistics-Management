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
  MapPin,
  Send,
  Info,
  Activity,
} from 'lucide-react';
import { trackingApi } from '../services/api';
import { Delivery } from '../../shared/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { DeliveryMap } from '../components/map/DeliveryMap';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

export const LiveTracking: React.FC = () => {
  const { success, error, info } = useToast();
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRouteData, setSelectedRouteData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isStepping, setIsStepping] = useState(false);

  const fetchActiveDeliveries = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const data = await trackingApi.getActive();
      setActiveDeliveries(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch active tracking data:', err);
      error('Tracking Error', 'Failed to sync live vehicle locations.');
    } finally {
      if (showLoading) setIsLoading(false);
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
    fetchActiveDeliveries(true);
  }, []);

  useAutoRefresh(fetchActiveDeliveries, { intervalMs: 10000 });

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
          await handleSimulateStep(true);
        }
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying, selectedId]);

  const handleSimulateStep = async (silent = false) => {
    if (!selectedId) return;
    try {
      setIsStepping(true);
      await trackingApi.simulateStep(selectedId, 6);
      if (!silent) {
        success('GPS FIX STEPPED', 'Vehicle telematics advanced along national highway corridor.');
      }
      await fetchActiveDeliveries(false);
      await fetchSelectedRoute(selectedId);
    } catch (err: any) {
      console.error('Simulation step failed:', err);
      error('Simulation Error', 'Failed to advance coordinates.');
    } finally {
      setIsStepping(false);
    }
  };

  const handleSimulateAll = async () => {
    try {
      setIsStepping(true);
      const res = await trackingApi.simulateAll();
      success('FLEET STEPPED', `Progressed ${res.updatedCount || (res as any).updated || 0} active vehicles along corridors.`);
      await fetchActiveDeliveries(false);
      if (selectedId) {
        await fetchSelectedRoute(selectedId);
      }
    } catch (err: any) {
      console.error('Simulation all failed:', err);
      error('Error', 'Failed to simulate fleet movement.');
    } finally {
      setIsStepping(false);
    }
  };

  const selectedDelivery = activeDeliveries.find((d) => d.id === selectedId);

  // Map markers
  const mapVehicles = activeDeliveries
    .filter((d) => d.currentLat && d.currentLng)
    .map((d) => ({
      id: d.id,
      code: d.vehicle?.code || 'VEH',
      lat: d.currentLat!,
      lng: d.currentLng!,
      status: d.status,
      trackingNumber: d.trackingNumber,
      speed: d.status === 'IN_TRANSIT' ? 62 : 35,
    }));

  return (
    <div className="space-y-5 pb-12">
      {/* Page Command Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ops-border pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold font-mono tracking-tight text-white uppercase flex items-center gap-2">
              <span className="w-2 h-4 bg-cyan-400 rounded-xs"></span>
              Corridor Telematics & Radar Room
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-glow-cyan/20">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              {activeDeliveries.length} UNITS EN ROUTE
            </span>
          </div>
          <p className="text-xs text-ops-muted mt-1 font-sans">
            Real-time highway corridor positioning, telematics speed, battery health, and waypoint progression
          </p>
        </div>

        {/* Simulation Control Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSimulateStep(false)}
            disabled={isStepping || !selectedId}
            className="px-3 py-1.5 rounded-md bg-ops-surface hover:bg-ops-panel border border-ops-border text-ops-text text-xs font-mono font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-panel"
          >
            <Play className={`w-3.5 h-3.5 text-cyan-400 ${isStepping ? 'animate-spin' : ''}`} />
            <span>STEP SELECTED</span>
          </button>

          <button
            onClick={handleSimulateAll}
            disabled={isStepping}
            className="px-3 py-1.5 rounded-md bg-ops-surface hover:bg-ops-panel border border-ops-border text-ops-text text-xs font-mono font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-panel"
          >
            <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${isStepping ? 'animate-spin' : ''}`} />
            <span>STEP ENTIRE FLEET</span>
          </button>

          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`px-4 py-1.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              isAutoPlaying
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-glow-rose'
                : 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-glow-cyan'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoPlaying ? 'PAUSE AUTO-FEED' : 'START AUTO-FEED'}</span>
          </button>
        </div>
      </div>

      {/* Telemetry Notice Banner */}
      <div className="p-3 bg-ops-surface border border-ops-border rounded-lg flex items-start space-x-2.5 text-xs text-ops-muted shadow-panel">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="font-mono text-[11px]">
          <span className="font-bold text-white uppercase">SIMULATED CORRIDOR TELEMATICS: </span>
          <span className="text-ops-muted font-sans">
            Vehicle positions and coordinates step along verified national logistics corridors (e.g. NH-48 Mumbai-Ahmedabad / Mumbai-Pune).
          </span>
        </div>
      </div>

      {/* Main Grid: Left Vehicle Selector + Right Map & Telemetry Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Side: Active Shipments Queue */}
        <div className="bg-ops-surface border border-ops-border rounded-xl p-4 shadow-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-ops-border">
            <h3 className="text-xs font-mono font-bold text-ops-text uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3 bg-cyan-400 rounded-xs"></span>
              En Route Shipments ({activeDeliveries.length})
            </h3>
          </div>

          <div className="divide-y divide-ops-border/40 max-h-[520px] overflow-y-auto space-y-2 pr-1">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-2 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-ops-panel" />
                  <Skeleton className="h-3 w-1/2 bg-ops-panel" />
                </div>
              ))
            ) : activeDeliveries.length === 0 ? (
              <div className="py-12 text-center text-ops-dim font-mono text-xs">
                NO ACTIVE FREIGHT EN ROUTE
              </div>
            ) : (
              activeDeliveries.map((del) => {
                const isSelected = del.id === selectedId;
                return (
                  <div
                    key={del.id}
                    onClick={() => setSelectedId(del.id)}
                    className={`pt-2.5 first:pt-0 p-3 rounded-lg cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/40 shadow-glow-cyan/20 ring-1 ring-cyan-500/20'
                        : 'bg-ops-bg/60 hover:bg-ops-panel border-ops-border text-ops-text'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-mono font-bold text-xs ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                        #{del.trackingNumber}
                      </span>
                      <StatusBadge status={del.status} type="delivery" />
                    </div>

                    <p className="text-xs truncate font-sans font-medium text-ops-muted">
                      {del.order?.customerName}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-ops-dim">
                        {del.driver ? `${del.driver.firstName} ${del.driver.lastName}` : 'Unassigned'} ({del.vehicle?.code || 'VEH'})
                      </span>
                      <span className="font-bold text-cyan-400">
                        {del.progressPercent}%
                      </span>
                    </div>

                    {/* Mini Progress */}
                    <div className="w-full h-1 rounded-full overflow-hidden mt-1.5 bg-ops-bg border border-ops-border/40">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full shadow-glow-cyan"
                        style={{ width: `${del.progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Map & Telemetry Dashboard */}
        <div className="lg:col-span-2 space-y-4">
          {/* Leaflet Map */}
          <div className="bg-ops-surface border border-ops-border rounded-xl p-4 shadow-panel space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-ops-text uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-3 bg-cyan-400 rounded-xs"></span>
                Spatial Radar View
              </span>
              {selectedDelivery && (
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  LAT: {selectedDelivery.currentLat?.toFixed(4)}, LNG: {selectedDelivery.currentLng?.toFixed(4)}
                </span>
              )}
            </div>

            <DeliveryMap
              vehicles={mapVehicles}
              selectedDeliveryId={selectedId || undefined}
              routeData={selectedRouteData}
              height="380px"
            />
          </div>

          {/* Telemetry Sensor Dashboard */}
          {selectedDelivery && (
            <div className="p-4 bg-ops-surface border border-ops-border rounded-xl shadow-panel space-y-3">
              <h3 className="text-xs font-mono font-bold text-ops-text uppercase tracking-wider border-b border-ops-border pb-2 flex items-center gap-2">
                <span className="w-1.5 h-3 bg-cyan-400 rounded-xs"></span>
                Real-Time Telemetry Telemetry Sensors &bull; {selectedDelivery.vehicle?.code || 'Asset'}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-ops-bg border border-ops-border">
                  <span className="text-[10px] font-mono font-bold text-ops-dim uppercase flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Speed Telemetry</span>
                  </span>
                  <span className="text-lg font-bold text-cyan-400 font-mono mt-1 block">
                    {selectedDelivery.status === 'IN_TRANSIT' ? '62 km/h' : '0 km/h'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-ops-bg border border-ops-border">
                  <span className="text-[10px] font-mono font-bold text-ops-dim uppercase flex items-center gap-1">
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Battery / Health</span>
                  </span>
                  <span className="text-lg font-bold text-emerald-400 font-mono mt-1 block">
                    {selectedDelivery.vehicle?.currentFuelPercent || 92}%
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-ops-bg border border-ops-border">
                  <span className="text-[10px] font-mono font-bold text-ops-dim uppercase flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-sky-400" />
                    <span>Cargo Temp</span>
                  </span>
                  <span className="text-lg font-bold text-sky-400 font-mono mt-1 block">
                    {selectedDelivery.order?.cargoType === 'COLD_CHAIN' ? '-18.4 °C' : '26.1 °C'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-ops-bg border border-ops-border">
                  <span className="text-[10px] font-mono font-bold text-ops-dim uppercase flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>Corridor Heading</span>
                  </span>
                  <span className="text-lg font-bold text-amber-400 font-mono mt-1 block">
                    342° NNW
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
