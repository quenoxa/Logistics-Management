import React, { useState, useEffect } from 'react';
import { issuesApi, deliveriesApi } from '../services/api';
import { AlertCircle, Plus, CheckCircle2, Clock, ShieldAlert, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MetricCard } from '../components/common/MetricCard';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';

export const Issues: React.FC = () => {
  const { user, can } = useAuth();
  const { success, error } = useToast();
  const [issues, setIssues] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [deliveryId, setDeliveryId] = useState('');
  const [type, setType] = useState('TRAFFIC');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [issData, delData] = await Promise.all([
        issuesApi.getAll({ status: statusFilter, priority: priorityFilter }),
        deliveriesApi.getAll(),
      ]);
      setIssues(issData);
      setDeliveries(delData);
    } catch (err: any) {
      error('Error', 'Failed to load issues');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      error('Validation', 'Description is required');
      return;
    }
    try {
      await issuesApi.create({
        deliveryId: deliveryId || undefined,
        type,
        description,
        priority,
      });
      success('Created', 'Incident reported successfully');
      setIsModalOpen(false);
      setDescription('');
      loadData();
    } catch (err: any) {
      error('Error', 'Failed to report incident');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await issuesApi.resolve(id);
      success('Resolved', 'Issue marked as resolved');
      loadData();
    } catch (err: any) {
      error('Error', 'Failed to resolve issue');
    }
  };

  const totalIssues = issues.length;
  const openIssues = issues.filter(i => i.status === 'OPEN').length;
  const urgentIssues = issues.filter(i => i.priority === 'HIGH' || i.priority === 'CRITICAL').length;
  const resolvedIssues = issues.filter(i => i.status === 'RESOLVED').length;

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Incident & Issue Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time delivery exceptions, driver reported incidents, and resolution tracking
          </p>
        </div>

        {can('issues:report') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-rose-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Report Incident</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Total Incidents" value={totalIssues} icon={<AlertCircle className="w-4 h-4" />} variant="default" />
        <MetricCard label="Open Unresolved" value={openIssues} icon={<Clock className="w-4 h-4" />} variant="amber" />
        <MetricCard label="Urgent Attention" value={urgentIssues} icon={<ShieldAlert className="w-4 h-4" />} variant="rose" />
        <MetricCard label="Resolved Incidents" value={resolvedIssues} icon={<CheckCircle2 className="w-4 h-4" />} variant="emerald" />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 text-xs text-slate-500 mr-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-slate-700 uppercase tracking-wider">Filters:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
        >
          <option value="ALL">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Issues Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Tracking # / Order</th>
                <th className="py-3 px-4">Incident Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reported At</th>
                {can('issues:resolve') && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={can('issues:resolve') ? 7 : 6} className="py-12 text-center text-slate-400">Loading issues...</td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={can('issues:resolve') ? 7 : 6} className="py-12 text-center text-slate-400">No issues reported.</td>
                </tr>
              ) : (
                issues.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                      {i.delivery ? `#${i.delivery.trackingNumber}` : 'General / Fleet'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {i.type ? i.type.replace(/_/g, ' ') : 'Incident'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {i.description}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={i.priority} type="priority" />
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        i.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : i.status === 'IN_PROGRESS'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {i.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(i.createdAt).toLocaleString()}
                    </td>
                    {can('issues:resolve') && (
                      <td className="py-3 px-4 text-right">
                        {i.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleResolve(i.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Issue Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Report Incident / Delivery Exception">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Related Delivery (Optional)</label>
            <select
              value={deliveryId}
              onChange={(e) => setDeliveryId(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
            >
              <option value="">-- None / General Operational Exception --</option>
              {deliveries.map((d) => (
                <option key={d.id} value={d.id}>#{d.trackingNumber} - {d.order?.customerName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Incident Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              >
                <option value="MECHANICAL">Mechanical Breakdown</option>
                <option value="TRAFFIC">Traffic Congestion</option>
                <option value="WEATHER">Severe Weather</option>
                <option value="RECIPIENT_UNAVAILABLE">Recipient Unavailable</option>
                <option value="DAMAGED">Cargo Damage</option>
                <option value="OTHER">Other Exception</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Detailed Description *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe incident, location, delay impact..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-600/20"
            >
              Submit Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
