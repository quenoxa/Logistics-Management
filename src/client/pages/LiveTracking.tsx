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
  const { success, error } = useToast();
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
        success('GPS Fix Advanced', 'Vehicle coordinates stepped along freight corridor.');
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
      success('Fleet Simulated', `Progressed ${res.updatedCount || (res as any).updated || 0} active vehicles.`);
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
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Live Tracking & GPS Simulation
            </h1>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              {activeDeliveries.length} Active Corridors
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time GPS tracking simulation, vehicle telematics, route progression, and telemetry controls
          </p>
        </div>

        {/* Simulation Control Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleSimulateStep(false)}
            disabled={isStepping || !selectedId}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition shadow-sm disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 text-emerald-600 ${isStepping ? 'animate-spin' : ''}`} />
            <span>Step Selected</span>
          </button>

          <button
            onClick={handleSimulateAll}
            disabled={isStepping}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition shadow-sm disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 text-emerald-600 ${isStepping ? 'animate-spin' : ''}`} />
            <span>Step Fleet</span>
          </button>

          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm ${
              isAutoPlaying
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isAutoPlaying ? 'Pause Feed' : 'Start Feed'}</span>
          </button>
        </div>
      </div>

      {/* Telemetry Notice Banner */}
      <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-xs text-emerald-900">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold">GPS Tracking Simulation Active: </span>
          <span>Vehicle coordinates advance along national logistics corridors (NH-48 Mumbai-Delhi / Mumbai-Pune). Use controls to step forward.</span>
        </div>
      </div>

      {/* Main Grid: Left Vehicle Selector + Right Map & Telemetry Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Active Shipments Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              En Route Shipments ({activeDeliveries.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto space-y-2 pr-1">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-2 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-slate-100" />
                  <Skeleton className="h-3 w-1/2 bg-slate-100" />
                </div>
              ))
            ) : activeDeliveries.length === 0 ? (
              <div className="py-14 text-center text-slate-400 text-xs">
                No active shipments currently on road
              </div>
            ) : (
              activeDeliveries.map((del) => {
                const isSelected = del.id === selectedId;
                return (
                  <div
                    key={del.id}
                    onClick={() => setSelectedId(del.id)}
                    className={`pt-2.5 first:pt-0 p-3 rounded-xl cursor-pointer transition border ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`font-mono font-bold text-xs ${isSelected ? 'text-emerald-700' : 'text-slate-900'}`}>
                        #{del.trackingNumber}
                      </span>
                      <StatusBadge status={del.status} type="delivery" />
                    </div>

                    <p className="text-xs truncate font-semibold text-slate-800">
                      {del.order?.customerName || del.customerName}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        {del.driver ? `${del.driver.firstName} ${del.driver.lastName}` : 'Unassigned'} ({del.vehicle?.code || 'VEH'})
                      </span>
                      <span className="font-bold text-emerald-600 font-mono">
                        {del.progressPercent}%
                      </span>
                    </div>

                    {/* Mini Progress */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden mt-1.5 bg-slate-100 border border-slate-200">
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
        <div className="lg:col-span-2 space-y-5">
          {/* Leaflet Map */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Live Route Visualizer
              </span>
              {selectedDelivery && (
                <span className="text-xs font-mono text-emerald-700 font-semibold">
                  GPS: {selectedDelivery.currentLat?.toFixed(4)}, {selectedDelivery.currentLng?.toFixed(4)}
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
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2.5 flex items-center gap-2">
                <span>Telematics Dashboard &bull; {selectedDelivery.vehicle?.code || 'Asset'}</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-sky-600" />
                    <span>Speed</span>
                  </span>
                  <span className="text-xl font-bold text-slate-900 font-mono mt-1.5 block">
                    {selectedDelivery.status === 'IN_TRANSIT' ? '62 km/h' : '0 km/h'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <BatteryCharging className="w-4 h-4 text-emerald-600" />
                    <span>Fuel Level</span>
                  </span>
                  <span className="text-xl font-bold text-emerald-600 font-mono mt-1.5 block">
                    {selectedDelivery.vehicle?.currentFuelPercent || 92}%
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-cyan-600" />
                    <span>Cargo Temp</span>
                  </span>
                  <span className="text-xl font-bold text-slate-900 font-mono mt-1.5 block">
                    {selectedDelivery.order?.cargoType === 'COLD_CHAIN' ? '-18.4 °C' : '24.5 °C'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-amber-600" />
                    <span>Heading</span>
                  </span>
                  <span className="text-xl font-bold text-slate-900 font-mono mt-1.5 block">
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
