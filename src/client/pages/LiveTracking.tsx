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
        success('GPS Step Advanced', 'Vehicle location stepped along corridor.');
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
      success('Fleet Stepped', `Updated ${res.updatedCount || (res as any).updated || 0} active vehicles along corridors.`);
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
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Live Fleet Telematics & Radar
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              {activeDeliveries.length} Units En Route
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time highway corridor positioning, telematics speed, battery health, and waypoint progression
          </p>
        </div>

        {/* Simulation Control Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSimulateStep(false)}
            disabled={isStepping || !selectedId}
            className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-2xs"
          >
            <Play className={`w-3.5 h-3.5 text-slate-600 ${isStepping ? 'animate-spin' : ''}`} />
            <span>Step Selected</span>
          </button>

          <button
            onClick={handleSimulateAll}
            disabled={isStepping}
            className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-2xs"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-600 ${isStepping ? 'animate-spin' : ''}`} />
            <span>Step Entire Fleet</span>
          </button>

          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs ${
              isAutoPlaying
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoPlaying ? 'Stop Auto-Feed' : 'Start Auto-Feed'}</span>
          </button>
        </div>
      </div>

      {/* Telemetry Notice Banner */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start space-x-2.5 text-xs text-slate-600">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Simulated Corridor Telematics: </span>
          <span>
            Vehicle positions and coordinates step along verified national logistics corridors (e.g. NH-48 Mumbai-Ahmedabad / Mumbai-Pune).
          </span>
        </div>
      </div>

      {/* Main Grid: Left Vehicle Selector + Right Map & Telemetry Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Side: Active Shipments Queue */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              En Route Shipments ({activeDeliveries.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto space-y-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-2 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : activeDeliveries.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No active deliveries en route
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
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50/50 hover:bg-slate-100/70 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-mono font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {del.trackingNumber}
                      </span>
                      <StatusBadge status={del.status} type="delivery" />
                    </div>

                    <p className={`text-xs truncate ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                      {del.order?.customerName}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>
                        {del.driver ? `${del.driver.firstName} ${del.driver.lastName}` : 'Unassigned'} ({del.vehicle?.code || 'VEH'})
                      </span>
                      <span className={`font-semibold ${isSelected ? 'text-orange-400' : 'text-slate-800'}`}>
                        {del.progressPercent}%
                      </span>
                    </div>

                    {/* Mini Progress */}
                    <div className={`w-full h-1 rounded-full overflow-hidden mt-1.5 ${isSelected ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div
                        className="bg-emerald-500 h-full rounded-full"
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
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Spatial Corridor View
              </span>
              {selectedDelivery && (
                <span className="text-xs font-mono text-slate-500">
                  Lat: {selectedDelivery.currentLat?.toFixed(4)}, Lng: {selectedDelivery.currentLng?.toFixed(4)}
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
            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Real-Time Telemetry Sensors — {selectedDelivery.vehicle?.code || 'Asset'}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-slate-400" />
                    <span>Speed</span>
                  </span>
                  <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                    {selectedDelivery.status === 'IN_TRANSIT' ? '62 km/h' : '0 km/h'}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Battery / Health</span>
                  </span>
                  <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                    {selectedDelivery.vehicle?.currentFuelPercent || 92}%
                  </span>
                </div>

                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cargo Temp</span>
                  </span>
                  <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                    {selectedDelivery.order?.cargoType === 'COLD_CHAIN' ? '-18.4 °C' : '26.1 °C'}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-slate-400" />
                    <span>Corridor Heading</span>
                  </span>
                  <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
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
