import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Wrench,
  Users,
  CheckCircle2,
  Plus,
  RotateCw,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { vehiclesApi, driversApi, reportsApi } from '../services/api';
import { Vehicle, Driver, DashboardKPIs } from '../../shared/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { MetricCard } from '../components/common/MetricCard';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

export const FleetDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { error } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [fleetUtilization, setFleetUtilization] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const [vData, dData, kpiData, utilData] = await Promise.all([
        vehiclesApi.getAll(),
        driversApi.getAll(),
        reportsApi.getKPIs(),
        reportsApi.getFleetUtilization(),
      ]);
      setVehicles(vData);
      setDrivers(dData);
      setKpis(kpiData);
      setFleetUtilization(utilData.summaryByType || []);
    } catch (err: any) {
      console.error('Failed to load fleet dashboard data:', err);
      error('Sync Error', 'Failed to load fleet data from database.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  useAutoRefresh(fetchData, { intervalMs: 15000 });

  const maintenanceVehicles = vehicles.filter((v) => v.status === 'MAINTENANCE');
  const activeVehicles = vehicles.filter((v) => v.status === 'ACTIVE' || v.status === 'IN_TRANSIT');
  const availableDrivers = drivers.filter((d) => d.status === 'AVAILABLE');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ops-border pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold font-mono tracking-tight text-white uppercase flex items-center gap-2">
              <span className="w-2 h-4 bg-cyan-400 rounded-xs"></span>
              Fleet Operations & Asset Health
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-ops-surface border border-ops-border text-ops-muted text-xs font-mono font-bold">
              {vehicles.length} VEHICLES
            </span>
          </div>
          <p className="text-xs text-ops-muted mt-1 font-sans">
            Commercial vehicle inventory, maintenance tracking, driver shifts, and asset availability
          </p>
        </div>

        <div className="flex items-center space-x-2.5 font-mono">
          <button
            onClick={() => fetchData(true)}
            className="p-2 rounded-md bg-ops-surface hover:bg-ops-panel border border-ops-border text-ops-muted hover:text-ops-text shadow-panel transition-colors"
            title="Refresh fleet data"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate('/vehicles')}
            className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-glow-cyan transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>ENROLL ASSET</span>
          </button>
          <button
            onClick={() => navigate('/drivers')}
            className="px-3.5 py-1.5 rounded-md bg-ops-panel hover:bg-ops-panelHover border border-ops-border text-ops-text text-xs font-semibold inline-flex items-center gap-1.5 shadow-panel transition-all"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>DRIVER ROSTER</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {isLoading && !kpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <MetricCard
            label="Total Commercial Fleet"
            value={vehicles.length}
            icon={<Truck className="w-4 h-4 text-cyan-400" />}
            subtext={`${activeVehicles.length} active on road`}
            variant="cyan"
            onClick={() => navigate('/vehicles')}
          />

          <MetricCard
            label="Maintenance Bay"
            value={maintenanceVehicles.length}
            icon={<Wrench className="w-4 h-4 text-rose-400" />}
            subtext="Locked from dispatch"
            variant="rose"
            onClick={() => navigate('/vehicles')}
          />

          <MetricCard
            label="Available Drivers"
            value={availableDrivers.length}
            icon={<Users className="w-4 h-4 text-emerald-400" />}
            subtext={`Out of ${drivers.length} total staff`}
            variant="emerald"
            onClick={() => navigate('/drivers')}
          />

          <MetricCard
            label="Fleet Utilization"
            value={kpis ? `${kpis.fleet.utilizationPercent}%` : '0%'}
            icon={<TrendingUp className="w-4 h-4 text-sky-400" />}
            subtext="Active transport duty"
            variant="accent"
            onClick={() => navigate('/vehicles')}
          />
        </div>
      )}

      {/* Main Grid: Maintenance & Drivers Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Maintenance Bay Queue */}
        <div className="bg-ops-surface border border-ops-border rounded-xl p-4 shadow-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-ops-border">
            <h2 className="text-xs font-mono font-bold text-ops-text uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3 bg-rose-500 rounded-xs"></span>
              Vehicles in Maintenance Bay ({maintenanceVehicles.length})
            </h2>
            <button
              onClick={() => navigate('/vehicles')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              MANAGE BAY
            </button>
          </div>

          <div className="divide-y divide-ops-border/40">
            {maintenanceVehicles.length === 0 ? (
              <div className="py-12 text-center text-ops-dim text-xs font-mono space-y-1.5">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-1" />
                <span className="text-emerald-400 font-bold block">100% OPERATIONAL AVAILABILITY</span>
                <span>Zero vehicles currently grounded in maintenance</span>
              </div>
            ) : (
              maintenanceVehicles.map((v) => (
                <div
                  key={v.id}
                  onClick={() => navigate('/vehicles')}
                  className="py-2.5 flex items-center justify-between hover:bg-ops-panel p-2 rounded-lg cursor-pointer transition-all text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-white block">{v.code} ({v.licensePlate})</span>
                    <span className="text-ops-dim text-[11px] font-sans">{v.make} {v.model} &bull; {v.type.replace(/_/g, ' ')}</span>
                  </div>
                  <StatusBadge status={v.status} type="vehicle" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ready Driver Shift Roster */}
        <div className="bg-ops-surface border border-ops-border rounded-xl p-4 shadow-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-ops-border">
            <h2 className="text-xs font-mono font-bold text-ops-text uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3 bg-emerald-400 rounded-xs"></span>
              Available Drivers Ready for Dispatch ({availableDrivers.length})
            </h2>
            <button
              onClick={() => navigate('/drivers')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              VIEW ROSTER
            </button>
          </div>

          <div className="divide-y divide-ops-border/40">
            {availableDrivers.length === 0 ? (
              <div className="py-12 text-center text-ops-dim text-xs font-mono space-y-1.5">
                <AlertTriangle className="w-7 h-7 text-amber-400 mx-auto mb-1" />
                <span className="text-amber-400 font-bold block">ZERO OPERATORS AVAILABLE</span>
                <span>All drivers currently on road or off duty</span>
              </div>
            ) : (
              availableDrivers.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigate('/drivers')}
                  className="py-2.5 flex items-center justify-between hover:bg-ops-panel p-2 rounded-lg cursor-pointer transition-all text-xs"
                >
                  <div>
                    <span className="font-semibold text-white block">{d.firstName} {d.lastName}</span>
                    <span className="text-ops-dim text-[11px] font-mono">{d.driverCode || d.code} &bull; {d.phone}</span>
                  </div>
                  <StatusBadge status={d.status} type="driver" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
