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
} from 'lucide-react';
import { reportsApi, deliveriesApi, trackingApi } from '../services/api';
import { DashboardKPIs, Delivery } from '../../shared/types';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { DeliveryMap } from '../components/map/DeliveryMap';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';

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
    const interval = setInterval(() => fetchDashboardData(false), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleStepSimulation = async () => {
    try {
      setIsSimulating(true);
      const res = await trackingApi.simulateAll();
      success('GPS step simulated', `Advanced ${res.updatedCount || (res as any).updated || 0} active vehicle locations along corridors.`);
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
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Operations Control Center
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status overview of active freight corridors, asset utilization, and shipment SLA
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchDashboardData(true)}
            className="p-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 transition-colors shadow-2xs"
            title="Refresh dashboard metrics"
            aria-label="Refresh metrics"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleStepSimulation}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-2xs"
          >
            <Play className={`w-3.5 h-3.5 text-slate-600 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Updating...' : 'Simulate GPS Step'}</span>
          </button>

          <button
            onClick={() => navigate('/orders')}
            className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <span>+ Book New Order</span>
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
            label="Active Deliveries"
            value={kpis ? kpis.activeDeliveries : 0}
            icon={<Send className="w-4 h-4 text-blue-600" />}
            subtext="In freight pipeline"
            onClick={() => navigate('/deliveries')}
          />

          <MetricCard
            label="Pending Orders"
            value={kpis ? kpis.pendingOrders : 0}
            icon={<Package className="w-4 h-4 text-slate-600" />}
            subtext="Awaiting dispatch"
            onClick={() => navigate('/orders')}
          />

          <MetricCard
            label="Completed Trips"
            value={kpis ? kpis.completedDeliveries : 0}
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            subtext="SLA 100% on-time"
            onClick={() => navigate('/deliveries')}
          />

          <MetricCard
            label="Delayed Flagged"
            value={kpis ? kpis.delayedDeliveries : 0}
            icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
            subtext="Traffic / inspection"
            onClick={() => navigate('/deliveries')}
          />

          <MetricCard
            label="Available Vehicles"
            value={kpis ? `${kpis.fleet.idle || 0}` : 0}
            icon={<Truck className="w-4 h-4 text-slate-600" />}
            subtext="Ready for dispatch"
            onClick={() => navigate('/vehicles')}
          />

          <MetricCard
            label="Fleet Utilization"
            value={kpis ? `${kpis.fleet.utilizationPercent}%` : '0%'}
            icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
            subtext={`${kpis?.fleet.active || 0} active / ${kpis?.fleet.total || 0} total`}
            onClick={() => navigate('/vehicles')}
          />
        </div>
      )}

      {/* Main Grid: Live Radar Map & Active Deliveries Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Live Route Map */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Freight Corridor Radar Map
              </h2>
              <span className="text-[11px] text-slate-400">({mapVehicles.length} active units tracked)</span>
            </div>
            <button
              onClick={() => navigate('/tracking')}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors"
            >
              <span>Full Telematics View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <DeliveryMap
            vehicles={mapVehicles}
            height="370px"
          />

          {/* Quick Fleet Status Bar */}
          <div className="grid grid-cols-3 gap-3 pt-1 text-xs text-slate-700">
            <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-blue-700 font-medium block">In Transit</span>
                <span className="text-lg font-bold text-slate-900">{kpis?.fleet.active || 0}</span>
              </div>
              <Truck className="w-4 h-4 text-blue-500 opacity-80" />
            </div>
            <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-rose-700 font-medium block">In Maintenance</span>
                <span className="text-lg font-bold text-slate-900">{kpis?.fleet.maintenance || 0}</span>
              </div>
              <Truck className="w-4 h-4 text-rose-500 opacity-80" />
            </div>
            <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-700 font-medium block">Available Fleet</span>
                <span className="text-lg font-bold text-slate-900">{kpis?.fleet.idle || 0}</span>
              </div>
              <Truck className="w-4 h-4 text-emerald-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* Live Active Delivery Pipeline */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Active Shipments Pipeline ({activeDeliveries.length})
              </h2>
              <button
                onClick={() => navigate('/deliveries')}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2 space-y-2 max-h-[380px] overflow-y-auto">
              {activeDeliveries.length === 0 ? (
                <div className="py-14 text-center text-slate-400 text-xs">
                  No active deliveries en route
                </div>
              ) : (
                activeDeliveries.map((del) => (
                  <div
                    key={del.id}
                    onClick={() => navigate(`/deliveries/${del.id}`)}
                    className="pt-2.5 first:pt-0 cursor-pointer hover:bg-slate-50 p-2.5 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 tracking-tight">
                        {del.trackingNumber}
                      </span>
                      <StatusBadge status={del.status} type="delivery" />
                    </div>

                    <p className="text-xs text-slate-600 truncate mb-2">
                      {del.order?.customerName} &bull; <span className="text-slate-500">{del.order?.deliveryAddress}</span>
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span className="truncate max-w-[140px]">
                          {del.driver ? `${del.driver.firstName} ${del.driver.lastName}` : 'Unassigned'} ({del.vehicle?.code || 'VEH'})
                        </span>
                        <span className="font-semibold text-slate-800">{del.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/80">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-300"
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
            className="w-full mt-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-700 font-medium flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <span>View Full Dispatch Manifest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
