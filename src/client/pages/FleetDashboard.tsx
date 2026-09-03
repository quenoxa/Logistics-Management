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
import { useAuth } from '../context/AuthContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

export const FleetDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { can } = useAuth();
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
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Fleet Operations & Health
            </h1>
            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
              {vehicles.length} Assets
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Commercial vehicle inventory, maintenance tracking, driver shifts, and asset availability
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchData(true)}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition shadow-sm"
            title="Refresh fleet data"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          {can('vehicles:create') && (
            <button
              onClick={() => navigate('/vehicles')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Vehicle</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Total Fleet Assets" value={vehicles.length} icon={<Truck className="w-4 h-4" />} variant="default" onClick={() => navigate('/vehicles')} />
        <MetricCard label="Active En Route" value={activeVehicles.length} icon={<CheckCircle2 className="w-4 h-4" />} variant="emerald" onClick={() => navigate('/vehicles')} />
        <MetricCard label="Available Drivers" value={availableDrivers.length} icon={<Users className="w-4 h-4" />} variant="cyan" onClick={() => navigate('/drivers')} />
        <MetricCard label="In Maintenance" value={maintenanceVehicles.length} icon={<Wrench className="w-4 h-4" />} variant="rose" onClick={() => navigate('/maintenance')} />
      </div>

      {/* Fleet Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicles needing attention */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-600" />
              <span>Vehicles Under Maintenance ({maintenanceVehicles.length})</span>
            </h3>
            <button onClick={() => navigate('/maintenance')} className="text-xs text-emerald-600 font-bold">
              Manage
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
            {maintenanceVehicles.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">All fleet vehicles in service with zero active repairs.</p>
            ) : (
              maintenanceVehicles.map((v) => (
                <div key={v.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-emerald-600 block">{v.code}</span>
                    <span className="text-slate-500">{v.make || v.manufacturer} {v.model} &bull; {v.licensePlate}</span>
                  </div>
                  <StatusBadge status={v.status} type="vehicle" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Drivers Roster Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Commercial Drivers Roster ({drivers.length})</span>
            </h3>
            <button onClick={() => navigate('/drivers')} className="text-xs text-emerald-600 font-bold">
              View Roster
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
            {drivers.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">No drivers enrolled.</p>
            ) : (
              drivers.slice(0, 6).map((d) => (
                <div key={d.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{d.firstName} {d.lastName}</span>
                    <span className="text-slate-500 font-mono">{d.driverCode || d.code} &bull; {d.phone}</span>
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
