import React, { useState, useEffect } from 'react';
import { maintenanceApi, vehiclesApi } from '../services/api';
import { Vehicle } from '../types';
import { Wrench, Plus, Search, CheckCircle2, AlertTriangle, Clock, Trash2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MetricCard } from '../components/common/MetricCard';
import { Modal } from '../components/common/Modal';

export const Maintenance: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [vehicleId, setVehicleId] = useState('');
  const [type, setType] = useState('PREVENTATIVE');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [status, setStatus] = useState('SCHEDULED');

  const role = user?.role;
  const canEdit = role === 'ADMIN' || role === 'DISPATCHER';

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [recData, vehData] = await Promise.all([
        maintenanceApi.getAll({ status: statusFilter, search: searchQuery }),
        vehiclesApi.getAll(),
      ]);
      setRecords(recData);
      setVehicles(vehData);
    } catch (err: any) {
      error('Error', 'Failed to load maintenance records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !description || !cost) {
      error('Validation Error', 'Please fill required fields');
      return;
    }
    try {
      await maintenanceApi.create({
        vehicleId,
        type,
        description,
        cost: Number(cost),
        nextDueDate: nextDueDate || undefined,
        status,
      });
      success('Success', 'Maintenance record created');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      error('Error', err.response?.data?.message || 'Failed to create record');
    }
  };

  const handleMarkCompleted = async (id: string) => {
    try {
      await maintenanceApi.update(id, { status: 'COMPLETED' });
      success('Updated', 'Maintenance marked as completed');
      loadData();
    } catch (err: any) {
      error('Error', 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await maintenanceApi.delete(id);
      success('Deleted', 'Record deleted successfully');
      loadData();
    } catch (err: any) {
      error('Error', 'Failed to delete record');
    }
  };

  const totalRecords = records.length;
  const overdueRecords = records.filter(r => r.nextDueDate && new Date(r.nextDueDate) < new Date() && r.status !== 'COMPLETED').length;
  const scheduledRecords = records.filter(r => r.status === 'SCHEDULED' || r.status === 'IN_PROGRESS').length;
  const completedRecords = records.filter(r => r.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Vehicle Maintenance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Service schedules, preventative maintenance logs, and vehicle repair compliance
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Maintenance</span>
          </button>
        )}
      </div>

      {/* Compliance Alert Banner */}
      {overdueRecords > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start space-x-3 text-xs text-orange-900">
          <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900">Attention: {overdueRecords} vehicle service items are past due date! </span>
            <span className="text-slate-600">Overdue items prompt compliance warnings during delivery dispatch assignment.</span>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Total Service Logs" value={totalRecords} icon={<Wrench className="w-4 h-4" />} variant="default" />
        <MetricCard label="Overdue Attention" value={overdueRecords} icon={<AlertTriangle className="w-4 h-4" />} variant="rose" />
        <MetricCard label="Scheduled / Active" value={scheduledRecords} icon={<Clock className="w-4 h-4" />} variant="amber" />
        <MetricCard label="Completed Service" value={completedRecords} icon={<CheckCircle2 className="w-4 h-4" />} variant="emerald" />
      </div>

      {/* Records Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search vehicle code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Cost ($)</th>
                <th className="py-3 px-4">Next Due Date</th>
                <th className="py-3 px-4">Status</th>
                {canEdit && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading records...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No maintenance records found.</td>
                </tr>
              ) : (
                records.map((r) => {
                  const isOverdue = r.nextDueDate && new Date(r.nextDueDate) < new Date() && r.status !== 'COMPLETED';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                        {r.vehicle?.code || 'VEH'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {r.type ? r.type.replace(/_/g, ' ') : 'Service'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {r.description}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ₹{(r.cost || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {r.nextDueDate ? (
                          <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                            {new Date(r.nextDueDate).toLocaleDateString()} {isOverdue && '(OVERDUE)'}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          r.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'IN_PROGRESS'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="py-3 px-4 text-right space-x-2">
                          {r.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleMarkCompleted(r.id)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Maintenance Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Vehicle Maintenance">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Vehicle *</label>
            <select
              required
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.code} ({v.licensePlate})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Service Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              >
                <option value="PREVENTATIVE">Preventative Service</option>
                <option value="REPAIR">Engine / Repair</option>
                <option value="INSPECTION">Annual Inspection</option>
                <option value="TIRE_CHANGE">Tire Replacement</option>
                <option value="OIL_CHANGE">Oil Change</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Estimated Cost (₹) *</label>
              <input
                type="number"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="5000"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail service work performed..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Next Due Date</label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
            >
              Save Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
