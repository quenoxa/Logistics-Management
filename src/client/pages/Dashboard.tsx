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
} from 'lucide-react';
import { reportsApi, deliveriesApi, trackingApi } from '../api/client';
import { DashboardKPIs, Delivery } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { DeliveryMap } from '../components/map/DeliveryMap';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [kpiData, delivData] = await Promise.all([
        reportsApi.getKPIs(),
        deliveriesApi.getAll({ status: 'IN_TRANSIT,DISPATCHED,PICKED_UP,OUT_FOR_DELIVERY' }),
      ]);
      setKpis(kpiData);
      setActiveDeliveries(delivData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleStepSimulation = async () => {
    try {
      setIsSimulating(true);
      await trackingApi.simulateAll();
      await fetchDashboardData();
    } catch (err) {
      console.error('Simulation error:', err);
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live overview of deliveries and fleet activity
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleStepSimulation}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 text-slate-600 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Updating...' : 'Simulate GPS step'}</span>
          </button>

          <button
            onClick={() => navigate('/orders')}
            className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <span>New order</span>
          </button>
        </div>
      </div>

      {/* Clean Compact KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          label="Active deliveries"
          value={kpis ? kpis.activeDeliveries : '--'}
          icon={<Send className="w-4 h-4" />}
          onClick={() => navigate('/deliveries')}
        />

        <MetricCard
          label="Pending orders"
          value={kpis ? kpis.pendingOrders : '--'}
          icon={<Package className="w-4 h-4" />}
          onClick={() => navigate('/orders')}
        />

        <MetricCard
          label="Completed"
          value={kpis ? kpis.completedDeliveries : '--'}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          onClick={() => navigate('/deliveries')}
        />

        <MetricCard
          label="Delayed"
          value={kpis ? kpis.delayedDeliveries : '--'}
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          onClick={() => navigate('/deliveries')}
        />

        <MetricCard
          label="Available vehicles"
          value={kpis ? `${kpis.fleet.idle || 0}` : '--'}
          icon={<Truck className="w-4 h-4" />}
          onClick={() => navigate('/vehicles')}
        />

        <MetricCard
          label="Fleet utilization"
          value={kpis ? `${kpis.fleet.utilizationPercent}%` : '--'}
          icon={<Users className="w-4 h-4" />}
          onClick={() => navigate('/vehicles')}
        />
      </div>

      {/* Main Grid: Active Map & Live Deliveries Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Live Radar Fleet Map */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-800">
              Live route map
            </h2>
            <button
              onClick={() => navigate('/tracking')}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
            >
              <span>Full tracking</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <DeliveryMap
            vehicles={mapVehicles}
            height="360px"
          />

          {/* Quick Fleet Status Bar */}
          <div className="grid grid-cols-3 gap-3 pt-1 text-xs text-slate-700">
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">In transit</span>
              <span className="text-base font-semibold text-slate-900">{kpis?.fleet.active || 0}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">In maintenance</span>
              <span className="text-base font-semibold text-slate-900">{kpis?.fleet.maintenance || 0}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">Available</span>
              <span className="text-base font-semibold text-slate-900">{kpis?.fleet.idle || 0}</span>
            </div>
          </div>
        </div>

        {/* Live Active Delivery Pipeline */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-xs font-semibold text-slate-800">
                Active shipments ({activeDeliveries.length})
              </h2>
              <button
                onClick={() => navigate('/deliveries')}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2 space-y-2">
              {activeDeliveries.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No active deliveries en route
                </div>
              ) : (
                activeDeliveries.slice(0, 5).map((del) => (
                  <div
                    key={del.id}
                    onClick={() => navigate(`/deliveries/${del.id}`)}
                    className="pt-2.5 first:pt-0 cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-900">
                        {del.trackingNumber}
                      </span>
                      <StatusBadge status={del.status} type="delivery" />
                    </div>

                    <p className="text-xs text-slate-600 truncate mb-1.5">
                      {del.order?.customerName} &bull; {del.order?.deliveryAddress}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>{del.driver ? `${del.driver.firstName} ${del.driver.lastName}` : 'Unassigned'}</span>
                        <span className="font-medium text-slate-700">{del.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
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
            className="w-full mt-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-700 font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>View all deliveries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
