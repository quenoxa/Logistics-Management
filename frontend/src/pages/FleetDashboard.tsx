import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Wrench,
  Users,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { vehiclesApi, driversApi, reportsApi } from '../api/client';
import { Vehicle, Driver, DashboardKPIs } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { MetricCard } from '../components/common/MetricCard';

export const FleetDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [fleetUtilization, setFleetUtilization] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
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
    } catch (err) {
      console.error('Failed to load fleet dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const maintenanceVehicles = vehicles.filter((v) => v.status === 'MAINTENANCE');
  const activeVehicles = vehicles.filter((v) => v.status === 'ACTIVE' || v.status === 'IN_TRANSIT');
  const availableDrivers = drivers.filter((d) => d.status === 'AVAILABLE');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Fleet Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Vehicle inventory, maintenance tracking, and driver availability
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => navigate('/vehicles')}
            className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add vehicle</span>
          </button>
          <button
            onClick={() => navigate('/drivers')}
            className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <span>Driver roster</span>
          </button>
        </div>
      </div>

      {/* 4 Focused Fleet Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          label="Total vehicles"
          value={vehicles.length}
          subtext={`${activeVehicles.length} in service`}
          icon={<Truck className="w-4 h-4" />}
          onClick={() => navigate('/vehicles')}
        />

        <MetricCard
          label="In maintenance"
          value={maintenanceVehicles.length}
          subtext="Workshop & inspection"
          icon={<Wrench className="w-4 h-4 text-amber-600" />}
          onClick={() => navigate('/vehicles')}
        />

        <MetricCard
          label="Available drivers"
          value={`${availableDrivers.length} / ${drivers.length}`}
          subtext="Ready for dispatch"
          icon={<Users className="w-4 h-4 text-emerald-600" />}
          onClick={() => navigate('/drivers')}
        />

        <MetricCard
          label="Fleet utilization"
          value={kpis ? `${kpis.fleet.utilizationPercent}%` : '75.0%'}
          subtext="Active deployment"
          icon={<CheckCircle2 className="w-4 h-4" />}
          onClick={() => navigate('/reports')}
        />
      </div>

      {/* Main Grid: Vehicles Requiring Attention + Utilization Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Vehicles Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h3 className="text-xs font-semibold text-slate-800">
              Fleet vehicles overview
            </h3>
            <button
              onClick={() => navigate('/vehicles')}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              View all
            </button>
          </div>

          <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Make & Model</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Mileage</th>
                  <th className="py-2.5 px-3">Fuel / Charge</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {vehicles.slice(0, 6).map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{v.code}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900">{v.make} {v.model}</div>
                      <div className="text-[11px] text-slate-500">{v.licensePlate}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={v.status} type="vehicle" />
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{v.currentMileageKm.toLocaleString()} km</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-medium ${v.currentFuelPercent > 30 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {v.currentFuelPercent}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => navigate('/vehicles')}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fleet Breakdown by Vehicle Class */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h3 className="text-xs font-semibold text-slate-800">
              Vehicle category breakdown
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            {fleetUtilization.map((item, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between">
                <div>
                  <span className="text-slate-900 font-medium block">{item.type}</span>
                  <span className="text-[11px] text-slate-500">Total: {item.totalKm.toLocaleString()} km</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-900 block">{item.count} vehicles</span>
                  <span className="text-[11px] text-slate-500">₹{item.maintenanceCost.toLocaleString('en-IN')} maint.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
