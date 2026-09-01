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
} from 'lucide-react';
import { vehiclesApi, driversApi, reportsApi } from '../services/api';
import { Vehicle, Driver, DashboardKPIs } from '../../shared/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { MetricCard } from '../components/common/MetricCard';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';

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

  const maintenanceVehicles = vehicles.filter((v) => v.status === 'MAINTENANCE');
  const activeVehicles = vehicles.filter((v) => v.status === 'ACTIVE' || v.status === 'IN_TRANSIT');
  const availableDrivers = drivers.filter((d) => d.status === 'AVAILABLE');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Fleet Operations & Asset Health
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
              {vehicles.length} Total Vehicles
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Commercial vehicle inventory, maintenance tracking, driver shifts, and asset availability
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchData(true)}
            className="p-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 shadow-2xs transition-colors"
            title="Refresh fleet data"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate('/vehicles')}
            className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
          <button
            onClick={() => navigate('/drivers')}
            className="px-3.5 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span>Driver Roster</span>
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
            icon={<Truck className="w-4 h-4 text-slate-700" />}
            subtext={`${activeVehicles.length} active on road`}
            onClick={() => navigate('/vehicles')}
          />

          <MetricCard
            label="Under Maintenance"
            value={maintenanceVehicles.length}
            icon={<Wrench className="w-4 h-4 text-rose-600" />}
            subtext="Locked from dispatch"
            onClick={() => navigate('/vehicles')}
          />

          <MetricCard
            label="Available Drivers"
            value={availableDrivers.length}
            icon={<Users className="w-4 h-4 text-emerald-600" />}
            subtext={`Out of ${drivers.length} total staff`}
            onClick={() => navigate('/drivers')}
          />

          <MetricCard
            label="Fleet Utilization"
            value={kpis ? `${kpis.fleet.utilizationPercent}%` : '0%'}
            icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
            subtext="Active transport duty"
            onClick={() => navigate('/vehicles')}
          />
        </div>
      )}

      {/* Main Grid: Maintenance & Drivers Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Maintenance Bay Queue */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-rose-500" />
              <span>Vehicles in Maintenance Bay ({maintenanceVehicles.length})</span>
            </h2>
            <button
              onClick={() => navigate('/vehicles')}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {maintenanceVehicles.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5" />
                <span>Zero vehicles currently grounded in maintenance</span>
              </div>
            ) : (
              maintenanceVehicles.map((v) => (
                <div
                  key={v.id}
                  onClick={() => navigate('/vehicles')}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50 p-2 rounded cursor-pointer transition-colors text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-900 block">{v.code} ({v.licensePlate})</span>
                    <span className="text-slate-500 text-[11px]">{v.make} {v.model} &bull; {v.type.replace(/_/g, ' ')}</span>
                  </div>
                  <StatusBadge status={v.status} type="vehicle" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ready Driver Shift Roster */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>Available Drivers Ready for Dispatch ({availableDrivers.length})</span>
            </h2>
            <button
              onClick={() => navigate('/drivers')}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              View roster
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {availableDrivers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <AlertTriangle className="w-7 h-7 text-amber-500 mx-auto mb-1.5" />
                <span>All drivers currently on road or off duty</span>
              </div>
            ) : (
              availableDrivers.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigate('/drivers')}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50 p-2 rounded cursor-pointer transition-colors text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900 block">{d.firstName} {d.lastName}</span>
                    <span className="text-slate-500 text-[11px] font-mono">{d.driverCode} &bull; {d.phone}</span>
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
