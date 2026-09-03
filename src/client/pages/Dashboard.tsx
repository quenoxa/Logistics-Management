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
  Calendar,
  Layers,
} from 'lucide-react';
import { reportsApi, deliveriesApi, trackingApi } from '../services/api';
import { DashboardKPIs, Delivery } from '../../shared/types';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { DeliveryMap } from '../components/map/DeliveryMap';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { can } = useAuth();
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
      success('GPS Simulation Step', `Progressed ${res.updatedCount || (res as any).updated || 0} active freight units along corridors.`);
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
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Page Header Hierarchy */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Overview of your logistics operations, active freight pipeline, and asset telematics
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Date Selector Indicator */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          <button
            onClick={() => fetchDashboardData(true)}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition shadow-sm"
            title="Refresh dashboard metrics"
            aria-label="Refresh metrics"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {can('tracking:simulate') && (
            <button
              onClick={handleStepSimulation}
              disabled={isSimulating}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition shadow-sm disabled:opacity-50"
            >
              <Play className={`w-4 h-4 text-emerald-600 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Advancing...' : 'Simulate GPS Step'}</span>
            </button>
          )}

          {can('deliveries:create') && (
            <button
              onClick={() => navigate('/orders')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Delivery</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      {isLoading && !kpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            label="Total Deliveries"
            value={kpis ? kpis.totalDeliveries : 0}
            icon={<Send className="w-4 h-4" />}
            subtext="All logged orders"
            variant="default"
            onClick={() => navigate('/deliveries')}
          />

          <MetricCard
            label="Active Deliveries"
            value={kpis ? kpis.activeDeliveries : 0}
            icon={<Truck className="w-4 h-4" />}
            subtext="En route corridor"
            variant="emerald"
            onClick={() => navigate('/deliveries')}
          />

          <MetricCard
            label="Pending Deliveries"
            value={kpis ? kpis.pendingOrders : 0}
            icon={<Package className="w-4 h-4" />}
            subtext="Awaiting dispatch"
            variant="amber"
            onClick={() => navigate('/orders')}
          />

          <MetricCard
            label="Delivered Today"
            value={kpis ? kpis.completedDeliveries : 0}
            icon={<CheckCircle2 className="w-4 h-4" />}
            subtext="100% SLA confirmed"
            variant="emerald"
            onClick={() => navigate('/deliveries')}
          />

          <MetricCard
            label="Failed Deliveries"
            value={kpis ? kpis.delayedDeliveries : 0}
            icon={<AlertTriangle className="w-4 h-4" />}
            subtext="Incident flagged"
            variant="rose"
            onClick={() => navigate('/deliveries')}
          />

          <MetricCard
            label="Fleet Utilization"
            value={kpis ? `${kpis.fleet.utilizationPercent}%` : '0%'}
            icon={<TrendingUp className="w-4 h-4" />}
            subtext={`${kpis?.fleet.active || 0} of ${kpis?.fleet.total || 0} active`}
            variant="cyan"
            onClick={() => navigate('/vehicles')}
          />
        </div>
      )}

      {/* Main Grid: Live Radar Map & Active Deliveries Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Route Map */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Active Freight Tracking Map
              </h2>
              <span className="text-xs text-slate-500">({mapVehicles.length} active units tracked)</span>
            </div>
            <button
              onClick={() => navigate('/tracking')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 transition"
            >
              <span>Full Screen Tracking</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <DeliveryMap
            vehicles={mapVehicles}
            height="380px"
          />

          {/* Quick Fleet Status Bar */}
          <div className="grid grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-sky-700 block">In Transit</span>
                <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">{kpis?.fleet.active || 0}</span>
              </div>
              <Truck className="w-5 h-5 text-sky-600" />
            </div>
            <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-orange-700 block">Maintenance</span>
                <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">{kpis?.fleet.maintenance || 0}</span>
              </div>
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-700 block">Available Fleet</span>
                <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">{kpis?.fleet.idle || 0}</span>
              </div>
              <Truck className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Live Active Delivery Pipeline */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recent Shipments ({activeDeliveries.length})
              </h2>
              <button
                onClick={() => navigate('/deliveries')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2 space-y-2 max-h-[390px] overflow-y-auto pr-1">
              {activeDeliveries.length === 0 ? (
                <div className="py-14 text-center text-slate-400 text-xs">
                  No active freight currently en route
                </div>
              ) : (
                activeDeliveries.map((del) => (
                  <div
                    key={del.id}
                    onClick={() => navigate(`/deliveries/${del.id}`)}
                    className="pt-2.5 first:pt-0 cursor-pointer hover:bg-slate-50 p-2.5 rounded-xl transition border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-bold text-emerald-600">
                        #{del.trackingNumber}
                      </span>
                      <StatusBadge status={del.status} type="delivery" />
                    </div>

                    <p className="text-xs text-slate-900 truncate mb-2 font-semibold">
                      {del.order?.customerName} &bull; <span className="text-slate-500 font-normal">{del.order?.deliveryAddress}</span>
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span className="truncate max-w-[140px]">
                          {del.driver ? `${del.driver.firstName} ${del.driver.lastName}` : 'Unassigned'} ({del.vehicle?.code || 'VEH'})
                        </span>
                        <span className="font-bold text-slate-900 font-mono">{del.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
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
            className="w-full mt-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <span>Deliveries Management</span>
            <ArrowRight className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
