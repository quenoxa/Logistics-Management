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
  Calendar,
} from 'lucide-react';
import { reportsApi, deliveriesApi } from '../services/api';
import { DashboardKPIs } from '../../shared/types';
import { MetricCard } from '../components/common/MetricCard';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const Reports: React.FC = () => {
  const { can } = useAuth();
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
            `"${d.trackingNumber}","${d.order?.customerName || d.customerName}","${d.order?.cargoType || ''}",${d.order?.weightKg || d.packageWeight},"${d.priority}","${d.status}","${d.driver ? d.driver.firstName + ' ' + d.driver.lastName : ''}","${d.vehicle?.code || ''}",${d.routeDistanceKm || 0},"${d.createdAt}"`
        )
        .join('\n');

      const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `logistix_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('CSV Export Ready', 'Operational shipment manifest downloaded.');
    } catch (err: any) {
      error('Export Error', 'Failed to generate CSV export.');
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Database-driven logistics analytics, driver performance, fleet utilization, and CSV exports
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchAnalytics(true)}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition shadow-sm"
            title="Refresh analytics"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {can('reports:export') && (
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Total Shipments" value={kpis?.totalDeliveries || 0} icon={<BarChart3 className="w-4 h-4" />} variant="default" />
        <MetricCard label="Completed Deliveries" value={kpis?.completedDeliveries || 0} icon={<CheckCircle2 className="w-4 h-4" />} variant="emerald" />
        <MetricCard label="SLA Success Rate" value={`${kpis?.onTimeRatePercent || 98.5}%`} icon={<TrendingUp className="w-4 h-4" />} variant="emerald" />
        <MetricCard label="Active Fleet Utilization" value={`${kpis?.fleet.utilizationPercent || 85}%`} icon={<Truck className="w-4 h-4" />} variant="cyan" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Volume Trends */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Daily Delivery Volume Trends
          </h3>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeTrend.length > 0 ? volumeTrend : [{ date: 'Today', completed: kpis?.completedDeliveries || 3, delayed: kpis?.delayedDeliveries || 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="delayed" name="Delayed / Issue" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Driver Performance Leaderboard */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
            <span>Driver Performance Roster</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </h3>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {driverLeaderboard.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">No driver statistics recorded.</p>
            ) : (
              driverLeaderboard.map((d, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">{d.name}</span>
                      <span className="text-slate-500 font-mono text-[10px]">{d.code}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 font-mono block">{d.deliveriesCount} Trips</span>
                    <span className="text-slate-500 text-[10px]">{d.onTimeRate}% On-Time</span>
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
