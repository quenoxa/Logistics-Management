import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Download,
  TrendingUp,
  Award,
  AlertTriangle,
  Truck,
} from 'lucide-react';
import { reportsApi, deliveriesApi } from '../api/client';
import { DashboardKPIs } from '../types';

export const Reports: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [volumeTrend, setVolumeTrend] = useState<any[]>([]);
  const [driverLeaderboard, setDriverLeaderboard] = useState<any[]>([]);
  const [fleetUtilization, setFleetUtilization] = useState<any[]>([]);
  const [delayAnalysis, setDelayAnalysis] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const [kpiData, trendData, leaderboardData, fleetData, delaysData] = await Promise.all([
          reportsApi.getKPIs(),
          reportsApi.getVolumeTrend(),
          reportsApi.getDriverLeaderboard(),
          reportsApi.getFleetUtilization(),
          reportsApi.getDelaysBreakdown(),
        ]);
        setKpis(kpiData);
        setVolumeTrend(trendData);
        setDriverLeaderboard(leaderboardData);
        setFleetUtilization(fleetData.summaryByType || []);
        setDelayAnalysis(delaysData.chartData || []);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleExportCSV = async () => {
    try {
      const allDeliveries = await deliveriesApi.getAll();
      const csvHeaders = 'TrackingNumber,Customer,CargoType,WeightKg,Priority,Status,Driver,Vehicle,DistanceKm,CreatedAt\n';
      const csvRows = allDeliveries
        .map(
          (d) =>
            `"${d.trackingNumber}","${d.order?.customerName}","${d.order?.cargoType}",${d.order?.weightKg},"${d.priority}","${d.status}","${d.driver ? d.driver.firstName + ' ' + d.driver.lastName : ''}","${d.vehicle?.code || ''}",${d.routeDistanceKm},"${d.createdAt}"`
        )
        .join('\n');

      const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `logistics_one_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to generate CSV export');
    }
  };

  const PIE_COLORS = ['#ea580c', '#2563eb', '#16a34a', '#e11d48', '#8b5cf6'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational volume, on-time SLA performance, and driver efficiency
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Analytics Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-slate-500 font-medium block">Total revenue</span>
          <span className="text-xl font-semibold text-slate-900 mt-1 block">₹{kpis?.totalRevenueUsd.toLocaleString('en-IN') || '0'}</span>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-slate-500 font-medium block">Total mileage</span>
          <span className="text-xl font-semibold text-slate-900 mt-1 block">{kpis?.totalDistanceKm.toLocaleString() || '0'} km</span>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-slate-500 font-medium block">On-time rate</span>
          <span className="text-xl font-semibold text-emerald-700 mt-1 block">{kpis?.onTimeRatePercent || '98.5'}%</span>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-slate-500 font-medium block">Active fleet</span>
          <span className="text-xl font-semibold text-slate-900 mt-1 block">{kpis?.fleet.active || '0'} / {kpis?.fleet.total || '0'}</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Volume Trend Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span>7-DAY DELIVERY VOLUME & EXCEPTION RATE</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">PAST 7 DAYS</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '12px', fontFamily: 'monospace', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Bar dataKey="completed" name="Delivered On-Time" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dispatched" name="Total Dispatched" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="delayed" name="Delayed Exception" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delay Root Causes Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>DELAY ROOT CAUSES & BOTTLENECK ANALYSIS</span>
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={delayAnalysis}
                  dataKey="count"
                  nameKey="reason"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ reason, percent }: any) => `${reason} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                  fontSize={10}
                >
                  {delayAnalysis.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '12px', fontFamily: 'monospace', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Utilization by Vehicle Class */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-600" />
              <span>FLEET UTILIZATION & MAINTENANCE EXPENSE BY VEHICLE CLASS</span>
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fleetUtilization} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="type" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '12px', fontFamily: 'monospace', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Bar dataKey="totalKm" name="Total Mileage (km)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="maintenanceCost" name="Maintenance Spend ($)" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Driver Scorecard Leaderboard Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-600" />
            <span>COMMERCIAL DRIVER PERFORMANCE LEADERBOARD</span>
          </h3>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                <th className="p-3">Rank</th>
                <th className="p-3">Driver Code & Name</th>
                <th className="p-3">License Class</th>
                <th className="p-3">Assigned Vehicle</th>
                <th className="p-3">Total Deliveries</th>
                <th className="p-3">On-Time SLA %</th>
                <th className="p-3">Safety Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driverLeaderboard.map((drv, idx) => (
                <tr key={drv.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-orange-600">#{idx + 1}</td>
                  <td className="p-3">
                    <span className="font-bold text-slate-900 block">{drv.name}</span>
                    <span className="text-[10px] text-slate-400">{drv.code}</span>
                  </td>
                  <td className="p-3 text-slate-700">{drv.licenseClass}</td>
                  <td className="p-3 text-sky-700 font-semibold">{drv.assignedVehicle}</td>
                  <td className="p-3 font-bold text-slate-900">{drv.totalDeliveries}</td>
                  <td className="p-3 font-bold text-emerald-700">{drv.onTimeRatePercent}%</td>
                  <td className="p-3 text-orange-600 font-bold">★ {drv.rating.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
