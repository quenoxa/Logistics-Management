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
      success('CSV EXPORT READY', 'Operational shipment manifest downloaded.');
    } catch (err: any) {
      error('Export Error', 'Failed to generate CSV export.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ops-border pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold font-mono tracking-tight text-white uppercase flex items-center gap-2">
              <span className="w-2 h-4 bg-cyan-400 rounded-xs"></span>
              Reports & Operational Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-ops-surface border border-ops-border text-ops-muted text-xs font-mono font-bold">
              SQL AGGREGATED
            </span>
          </div>
          <p className="text-xs text-ops-muted mt-1 font-sans">
            Freight volume trends, revenue totals, on-time SLA metrics, and driver leaderboard rankings
          </p>
        </div>

        <div className="flex items-center space-x-2.5 font-mono">
          <button
            onClick={() => fetchAnalytics(true)}
            className="p-2 rounded-md bg-ops-surface hover:bg-ops-panel border border-ops-border text-ops-muted hover:text-ops-text shadow-panel transition-colors"
            title="Refresh analytics"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-glow-cyan transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
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
          <div className="p-4 bg-ops-surface border border-ops-border rounded-xl shadow-panel">
            <span className="text-[10px] font-mono font-bold text-ops-dim uppercase tracking-wider block">
              Realized Freight Revenue
            </span>
            <div className="text-2xl font-bold text-white tracking-tight mt-1 font-mono">
              ₹{kpis ? ((kpis.revenueTotal ?? kpis.totalRevenueUsd) || 0).toLocaleString() : '0'}
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold mt-0.5 block">
              Direct booking tariff realization
            </span>
          </div>

          <div className="p-4 bg-ops-surface border border-ops-border rounded-xl shadow-panel">
            <span className="text-[10px] font-mono font-bold text-ops-dim uppercase tracking-wider block">
              Total Corridor Distance
            </span>
            <div className="text-2xl font-bold text-cyan-400 tracking-tight mt-1 font-mono">
              {kpis ? `${kpis.totalDistanceKm.toFixed(1)}` : '0'} <span className="text-xs text-ops-dim">km</span>
            </div>
            <span className="text-[10px] text-ops-dim font-mono mt-0.5 block">Aggregated across all routes</span>
          </div>

          <div className="p-4 bg-ops-surface border border-ops-border rounded-xl shadow-panel">
            <span className="text-[10px] font-mono font-bold text-ops-dim uppercase tracking-wider block">
              On-Time SLA Performance
            </span>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight mt-1 font-mono">
              {kpis ? `${kpis.onTimeRatePercent}%` : '100%'}
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold mt-0.5 block">Zero SLA compliance breaches</span>
          </div>

          <div className="p-4 bg-ops-surface border border-ops-border rounded-xl shadow-panel">
            <span className="text-[10px] font-mono font-bold text-ops-dim uppercase tracking-wider block">
              Deliveries Managed
            </span>
            <div className="text-2xl font-bold text-white tracking-tight mt-1 font-mono">
              {kpis ? kpis.totalDeliveries : 0}
            </div>
            <span className="text-[10px] text-ops-dim font-mono mt-0.5 block">
              {kpis ? kpis.completedDeliveries : 0} delivered &bull; {kpis ? kpis.activeDeliveries : 0} en route
            </span>
          </div>
        </div>
      )}

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Volume Trend */}
        <div className="p-4 bg-ops-surface border border-ops-border rounded-xl shadow-panel space-y-3">
          <div className="flex items-center justify-between border-b border-ops-border pb-2">
            <h3 className="text-xs font-mono font-bold text-ops-text uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3 bg-cyan-400 rounded-xs"></span>
              7-Day Shipment Volume Trends
            </h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f141d',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    fontSize: '11px',
                    border: '1px solid #1f2937',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px', fontFamily: 'monospace' }} />
                <Bar dataKey="completed" name="Delivered" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dispatched" name="Dispatched" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Driver Leaderboard */}
        <div className="p-4 bg-ops-surface border border-ops-border rounded-xl shadow-panel space-y-3">
          <div className="flex items-center justify-between border-b border-ops-border pb-2">
            <h3 className="text-xs font-mono font-bold text-ops-text uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3 bg-amber-400 rounded-xs"></span>
              Commercial Driver Leaderboard
            </h3>
          </div>

          <div className="divide-y divide-ops-border/40 max-h-64 overflow-y-auto pr-1">
            {driverLeaderboard.length === 0 ? (
              <p className="text-xs font-mono text-ops-dim py-10 text-center">No driver activity recorded.</p>
            ) : (
              driverLeaderboard.map((d, idx) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                        idx === 0
                          ? 'bg-amber-950 text-amber-400 border border-amber-500/40 shadow-glow-amber'
                          : idx === 1
                          ? 'bg-slate-800 text-slate-300 border border-slate-600'
                          : 'bg-ops-bg text-ops-dim border border-ops-border'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <span className="font-semibold text-white block">{d.name}</span>
                      <span className="text-ops-dim font-mono text-[10px]">{d.driverCode}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs font-mono">
                    <span className="font-bold text-cyan-400 block">{d.completedDeliveries} Trips</span>
                    <span className="text-amber-400 text-[10px]">★ {d.rating || 4.9}</span>
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
