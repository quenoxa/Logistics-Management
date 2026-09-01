import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Truck,
  Users,
  Package,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  TrendingUp,
  RotateCw,
  Plus,
  Radio,
  Activity,
  Compass,
} from 'lucide-react';
import { reportsApi, deliveriesApi, trackingApi } from '../services/api';
import { DashboardKPIs, Delivery } from '../../shared/types';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { DeliveryMap } from '../components/map/DeliveryMap';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const [kpiData, delivData] = await Promise.all([
        reportsApi.getKPIs(),
        deliveriesApi.getAll({ status: 'IN_TRANSIT,DISPATCHED,PICKED_UP,OUT_FOR_DELIVERY' }),
      ]);
      setKpis(kpiData);
      setActiveDeliveries(delivData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      error('Failed to load dashboard', 'Could not sync latest operations data from hub server.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
  }, []);

  useAutoRefresh(fetchDashboardData, { intervalMs: 15000 });

  const handleStepSimulation = async () => {
    try {
      setIsSimulating(true);
      const res = await trackingApi.simulateAll();
      success('GPS STEP ADVANCED', `Progressed ${res.updatedCount || (res as any).updated || 0} active freight units along corridors.`);
      await fetchDashboardData(false);
    } catch (err: any) {
      console.error('Simulation error:', err);
      error('Simulation failed', err.response?.data?.error || 'Failed to update vehicle coordinates.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Map markers for active deliveries
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
    <div className="space-y-6 pb-12">
      {/* Page Command Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ops-border pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold font-mono tracking-tight text-white uppercase flex items-center gap-2">
              <span className="w-2 h-4 bg-cyan-400 rounded-xs"></span>
              Fleet Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-glow-cyan/20">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              LIVE RADAR FEED
            </span>
          </div>
          <p className="text-xs text-ops-muted mt-1 font-sans">
            Real-time tactical overview of active freight corridors, asset telematics, and SLA delivery compliance
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchDashboardData(true)}
            className="p-2 rounded-md bg-ops-surface hover:bg-ops-panel border border-ops-border text-ops-muted hover:text-ops-text transition-colors shadow-panel"
            title="Refresh dashboard metrics"
            aria-label="Refresh metrics"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleStepSimulation}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-md bg-ops-panel hover:bg-ops-panelHover border border-ops-borderLight text-ops-text text-xs font-mono font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-panel"
          >
            <Play className={`w-3.5 h-3.5 text-cyan-400 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'ADVANCING...' : 'STEP GPS SIMULATION'}</span>
          </button>

          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-glow-cyan transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>BOOK FREIGHT</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {isLoading && !kpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <MetricCard
            label="Active Shipments"
            value={kpis ? kpis.activeDeliveries : 0}
            icon={<Send className="w-4 h-4 text-sky-400" />}
            subtext="In freight pipeline"
            variant="cyan"
            onClick={() => navigate('/deliveries')}
          />

          <MetricCard
            label="Pending Orders"
            value={kpis ? kpis.pendingOrders : 0}
            icon={<Package className="w-4 h-4 text-amber-400" />}
            subtext="Awaiting dispatch"
            variant="amber"
            onClick={() => navigate('/orders')}
          />

          <MetricCard
            label="Completed Trips"
            value={kpis ? kpis.completedDeliveries : 0}
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            subtext="SLA 100% on-time"
            variant="emerald"
            onClick={() => navigate('/deliveries')}
          />

          <MetricCard
            label="Delayed Flagged"
            value={kpis ? kpis.delayedDeliveries : 0}
            icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
            subtext="Traffic / inspection"
            variant="rose"
            onClick={() => navigate('/deliveries')}
          />

          <MetricCard
            label="Available Fleet"
            value={kpis ? `${kpis.fleet.idle || 0}` : 0}
            icon={<Truck className="w-4 h-4 text-cyan-400" />}
            subtext="Ready for dispatch"
            variant="default"
            onClick={() => navigate('/vehicles')}
          />

          <MetricCard
            label="Fleet Utilization"
            value={kpis ? `${kpis.fleet.utilizationPercent}%` : '0%'}
            icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
            subtext={`${kpis?.fleet.active || 0} active / ${kpis?.fleet.total || 0} total`}
            variant="emerald"
            onClick={() => navigate('/vehicles')}
          />
        </div>
      )}

      {/* Main Grid: Live Radar Map & Active Deliveries Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Live Route Map */}
        <div className="lg:col-span-2 bg-ops-surface border border-ops-border rounded-xl p-4 shadow-panel space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-3 bg-cyan-400 rounded-xs"></span>
              <h2 className="text-xs font-mono font-bold text-ops-text uppercase tracking-wider">
                Freight Corridor Radar Map
              </h2>
              <span className="text-[10px] font-mono text-ops-dim">({mapVehicles.length} active units tracked)</span>
            </div>
            <button
              onClick={() => navigate('/tracking')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>TELEMATICS ROOM</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <DeliveryMap
            vehicles={mapVehicles}
            height="380px"
          />

          {/* Quick Fleet Status Bar */}
          <div className="grid grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-800/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-semibold text-sky-300 block uppercase">In Transit</span>
                <span className="text-lg font-mono font-bold text-white">{kpis?.fleet.active || 0}</span>
              </div>
              <Truck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-semibold text-rose-300 block uppercase">Maintenance Bay</span>
                <span className="text-lg font-mono font-bold text-white">{kpis?.fleet.maintenance || 0}</span>
              </div>
              <Truck className="w-4 h-4 text-rose-400" />
            </div>
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-semibold text-emerald-300 block uppercase">Available Fleet</span>
                <span className="text-lg font-mono font-bold text-white">{kpis?.fleet.idle || 0}</span>
              </div>
              <Truck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Live Active Delivery Pipeline */}
        <div className="bg-ops-surface border border-ops-border rounded-xl p-4 shadow-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-ops-border">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-3 bg-cyan-400 rounded-xs"></span>
                <h2 className="text-xs font-mono font-bold text-ops-text uppercase tracking-wider">
                  Active Pipeline ({activeDeliveries.length})
                </h2>
              </div>
              <button
                onClick={() => navigate('/deliveries')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                VIEW ALL
              </button>
            </div>

            <div className="divide-y divide-ops-border/40 mt-2 space-y-2 max-h-[390px] overflow-y-auto pr-1">
              {activeDeliveries.length === 0 ? (
                <div className="py-14 text-center text-ops-dim font-mono text-xs">
                  NO ACTIVE FREIGHT EN ROUTE
                </div>
              ) : (
                activeDeliveries.map((del) => (
                  <div
                    key={del.id}
                    onClick={() => navigate(`/deliveries/${del.id}`)}
                    className="pt-2.5 first:pt-0 cursor-pointer hover:bg-ops-panel/60 p-2.5 rounded-lg transition-all border border-transparent hover:border-ops-border"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        #{del.trackingNumber}
                      </span>
                      <StatusBadge status={del.status} type="delivery" />
                    </div>

                    <p className="text-xs text-ops-text truncate mb-2 font-sans font-medium">
                      {del.order?.customerName} &bull; <span className="text-ops-dim">{del.order?.deliveryAddress}</span>
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-ops-dim">
                        <span className="truncate max-w-[140px] text-ops-muted">
                          {del.driver ? `${del.driver.firstName} ${del.driver.lastName}` : 'Unassigned'} ({del.vehicle?.code || 'VEH'})
                        </span>
                        <span className="font-bold text-ops-text">{del.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-ops-bg h-1.5 rounded-full overflow-hidden border border-ops-border/80">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-glow-cyan"
                          style={{ width: `${del.progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/deliveries')}
            className="w-full mt-3 py-2.5 bg-ops-panel hover:bg-ops-panelHover border border-ops-border rounded-lg text-xs font-mono font-bold text-ops-text uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-panel"
          >
            <span>DISPATCH SHIPMENT MANIFEST</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
