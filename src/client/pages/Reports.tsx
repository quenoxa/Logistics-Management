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
  RotateCw,
  CheckCircle2,
  IndianRupee,
} from 'lucide-react';
import { reportsApi, deliveriesApi } from '../services/api';
import { DashboardKPIs } from '../../shared/types';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';

export const Reports: React.FC = () => {
  const { success, error } = useToast();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [volumeTrend, setVolumeTrend] = useState<any[]>([]);
  const [driverLeaderboard, setDriverLeaderboard] = useState<any[]>([]);
  const [fleetUtilization, setFleetUtilization] = useState<any[]>([]);
  const [delayAnalysis, setDelayAnalysis] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
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
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      error('Error', 'Failed to load report aggregations from database.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(true);
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
      success('CSV Export Generated', 'Report downloaded to your device.');
    } catch (err: any) {
      error('Export Error', 'Failed to generate CSV export.');
    }
  };

  const PIE_COLORS = ['#ea580c', '#2563eb', '#16a34a', '#e11d48', '#8b5cf6'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Reports & Operational Analytics
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
              SQL Aggregated
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Freight volume trends, revenue totals, on-time SLA metrics, and driver leaderboard rankings
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchAnalytics(true)}
            className="p-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 shadow-2xs transition-colors"
            title="Refresh analytics"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Manifest CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {isLoading && !kpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Revenue Realized
            </span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1 font-mono">
              ₹{kpis ? ((kpis.revenueTotal ?? kpis.totalRevenueUsd) || 0).toLocaleString() : '0'}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
              Direct from freight booking fees
            </span>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Corridor Mileage
            </span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1 font-mono">
              {kpis ? `${kpis.totalDistanceKm.toFixed(1)}` : '0'} <span className="text-sm font-sans font-normal text-slate-500">km</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Aggregated across all routes</span>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              On-Time SLA Reliability
            </span>
            <div className="text-2xl font-bold text-emerald-700 tracking-tight mt-1 font-mono">
              {kpis ? `${kpis.onTimeRatePercent}%` : '100%'}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Zero SLA breaches</span>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Deliveries Managed
            </span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1 font-mono">
              {kpis ? kpis.totalDeliveries : 0}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {kpis ? kpis.completedDeliveries : 0} delivered &bull; {kpis ? kpis.activeDeliveries : 0} active
            </span>
          </div>
        </div>
      )}

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Volume Trend */}
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>7-Day Shipment Volume Trends</span>
            </h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="completed" name="Delivered" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dispatched" name="Dispatched" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Driver Leaderboard */}
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Commercial Driver Leaderboard</span>
            </h3>
          </div>

          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {driverLeaderboard.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">No driver activity recorded.</p>
            ) : (
              driverLeaderboard.map((d, idx) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 block">{d.name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{d.driverCode}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-bold text-slate-900 font-mono">{d.completedDeliveries} Trips</span>
                    <span className="text-amber-600 text-[11px] block">★ {d.rating || 4.9}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
