import React, { useState, useEffect } from 'react';
import {
  Users,
  Phone,
  Mail,
  Star,
  Plus,
  Truck,
  Calendar,
  Shield,
  Trash2,
  Filter,
  RotateCw,
  Award,
  Clock,
} from 'lucide-react';
import { driversApi, vehiclesApi } from '../services/api';
import { Driver, Vehicle } from '../../shared/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { MetricCard } from '../components/common/MetricCard';

export const Drivers: React.FC = () => {
  const { success, error } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [licenseFilter, setLicenseFilter] = useState('ALL');

  // Modals
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New Driver Form
  const [newDriver, setNewDriver] = useState({
    code: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseClass: 'CDL_A',
    licenseExpiry: '2028-12-31',
    status: 'AVAILABLE',
    emergencyContact: '',
    currentVehicleId: '',
  });

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const [dData, vData] = await Promise.all([
        driversApi.getAll({
          status: statusFilter,
          licenseClass: licenseFilter,
        }),
        vehiclesApi.getAll(),
      ]);
      setDrivers(dData);
      setVehicles(vData);
    } catch (err: any) {
      console.error('Failed to fetch drivers:', err);
      error('Error', 'Failed to load driver roster from database.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, [statusFilter, licenseFilter]);

  useAutoRefresh(fetchData, { intervalMs: 15000 });

  const handleToggleStatus = async (driverId: string, newStatus: string) => {
    try {
      await driversApi.toggleStatus(driverId, newStatus);
      success('Shift Status Committed', `Driver availability updated to ${newStatus}.`);
      fetchData(false);
    } catch (err: any) {
      error('Update Failed', err.response?.data?.error || 'Failed to update driver status.');
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await driversApi.create(newDriver as any);
      success('Driver Enrolled', `Driver ${created.firstName} ${created.lastName} (${created.driverCode || created.code}) added.`);
      setIsAddModalOpen(false);
      fetchData(false);
      setNewDriver({
        code: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        licenseNumber: '',
        licenseClass: 'CDL_A',
        licenseExpiry: '2028-12-31',
        status: 'AVAILABLE',
        emergencyContact: '',
        currentVehicleId: '',
      });
    } catch (err: any) {
      error('Enrollment Failed', err.response?.data?.error || 'Failed to register driver.');
    }
  };

  const handleDeleteDriver = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await driversApi.delete(deleteTarget.id);
      success('Driver Removed', `Driver ${deleteTarget.firstName} ${deleteTarget.lastName} removed.`);
      setDeleteTarget(null);
      fetchData(false);
    } catch (err: any) {
      error('Delete Error', err.response?.data?.error || 'Failed to delete driver record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalDrivers = drivers.length;
  const availableDrivers = drivers.filter((d) => d.status === 'AVAILABLE').length;
  const onDeliveryDrivers = drivers.filter((d) => d.status === 'ON_DELIVERY').length;
  const offDutyDrivers = drivers.filter((d) => d.status === 'OFF_DUTY').length;
  const suspendedDrivers = drivers.filter((d) => d.status === 'SUSPENDED').length;

  const columns: Column<Driver>[] = [
    {
      header: 'Driver Code / Name',
      accessor: 'code',
      sortable: true,
      render: (d) => (
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs shrink-0">
            {d.firstName[0]}
            {d.lastName[0]}
          </div>
          <div>
            <span className="font-bold text-slate-900 block">
              {d.firstName} {d.lastName}
            </span>
            <span className="font-mono text-xs text-emerald-600 font-semibold">{d.driverCode || d.code}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Licensing & Class',
      accessor: 'licenseNumber',
      render: (d) => (
        <div className="text-xs">
          <span className="font-mono font-bold text-slate-800 block">{d.licenseNumber}</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[10px] mt-0.5 inline-block">
            {d.licenseClass || 'CDL-A'}
          </span>
        </div>
      ),
    },
    {
      header: 'Contact Information',
      render: (d) => (
        <div className="text-xs space-y-0.5">
          <div className="text-slate-900 font-medium flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{d.phone}</span>
          </div>
          <div className="text-slate-500 flex items-center gap-1.5 truncate">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{d.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Rating & Trips',
      accessor: 'totalDeliveries',
      sortable: true,
      render: (d) => (
        <div className="text-xs">
          <div className="flex items-center space-x-1 text-amber-500 font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
            <span>{(d.rating || 5.0).toFixed(1)}</span>
          </div>
          <span className="text-slate-500 block text-[11px] mt-0.5">{d.totalDeliveries || 0} Trips</span>
        </div>
      ),
    },
    {
      header: 'Duty Status',
      accessor: 'status',
      sortable: true,
      render: (d) => <StatusBadge status={d.status} type="driver" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (d) => (
        <div className="flex items-center justify-end space-x-2">
          <select
            value={d.status}
            onChange={(e) => handleToggleStatus(d.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ON_DELIVERY">ON DELIVERY</option>
            <option value="OFF_DUTY">OFF DUTY</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(d);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
            title="Delete driver"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Drivers Roster
            </h1>
            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
              {totalDrivers} Operators
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage commercial driver roster, CDL licensure compliance, safety scores, and duty status
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchData(true)}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition shadow-sm"
            title="Refresh driver roster"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Driver</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <MetricCard label="Total Drivers" value={totalDrivers} icon={<Users className="w-4 h-4" />} variant="default" />
        <MetricCard label="Available" value={availableDrivers} icon={<Users className="w-4 h-4" />} variant="emerald" />
        <MetricCard label="On Delivery" value={onDeliveryDrivers} icon={<Truck className="w-4 h-4" />} variant="blue" />
        <MetricCard label="Off Duty" value={offDutyDrivers} icon={<Clock className="w-4 h-4" />} variant="amber" />
        <MetricCard label="Suspended" value={suspendedDrivers} icon={<Shield className="w-4 h-4" />} variant="rose" />
      </div>

      {/* Main Table */}
      <DataTable
        data={drivers}
        columns={columns}
        keyExtractor={(d) => d.id}
        searchPlaceholder="Search driver by name, code, phone, CDL..."
        searchFilter={(d, q) => {
          const matchName = `${d.firstName} ${d.lastName}`.toLowerCase().includes(q.toLowerCase());
          const matchCode = (d.driverCode || d.code || '').toLowerCase().includes(q.toLowerCase());
          const matchPhone = d.phone.toLowerCase().includes(q.toLowerCase());
          return matchName || matchCode || matchPhone;
        }}
        isLoading={isLoading}
        pageSize={10}
        onRowClick={(d) => {
          setSelectedDriver(d);
          setIsDetailsOpen(true);
        }}
      />

      {/* Driver Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedDriver ? `Driver Profile: ${selectedDriver.firstName} ${selectedDriver.lastName}` : 'Driver Profile'}
      >
        {selectedDriver && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-500 font-bold block">Operator Code</span>
                <span className="font-mono text-base font-bold text-emerald-600">
                  {selectedDriver.driverCode || selectedDriver.code}
                </span>
              </div>
              <StatusBadge status={selectedDriver.status} type="driver" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 block">CDL License Number</span>
                <span className="font-mono font-bold text-slate-900">{selectedDriver.licenseNumber}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 block">Class & Expiry</span>
                <span className="font-mono font-bold text-slate-900">{selectedDriver.licenseClass || 'CDL-A'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-500 block font-bold">Contact Phone & Email</span>
              <p className="text-slate-900 font-medium">{selectedDriver.phone} &bull; {selectedDriver.email}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Driver Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enroll Commercial Driver"
      >
        <form onSubmit={handleCreateDriver} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">First Name *</label>
              <input
                type="text"
                required
                value={newDriver.firstName}
                onChange={(e) => setNewDriver({ ...newDriver, firstName: e.target.value })}
                placeholder="Vikram"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={newDriver.lastName}
                onChange={(e) => setNewDriver({ ...newDriver, lastName: e.target.value })}
                placeholder="Singh"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={newDriver.email}
                onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                placeholder="driver@example.com"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={newDriver.phone}
                onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                placeholder="+1-555-0199"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">CDL License Number *</label>
              <input
                type="text"
                required
                value={newDriver.licenseNumber}
                onChange={(e) => setNewDriver({ ...newDriver, licenseNumber: e.target.value })}
                placeholder="DL-8829-X"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">License Class</label>
              <select
                value={newDriver.licenseClass}
                onChange={(e) => setNewDriver({ ...newDriver, licenseClass: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              >
                <option value="CDL_A">CDL Class A</option>
                <option value="CDL_B">CDL Class B</option>
                <option value="CDL_C">CDL Class C</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
            >
              Enroll Driver
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteDriver}
        title="Delete Driver Profile"
        message={`Are you sure you want to remove driver ${deleteTarget?.firstName} ${deleteTarget?.lastName}?`}
        isLoading={isDeleting}
      />
    </div>
  );
};
