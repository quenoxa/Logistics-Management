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
      success('Shift Status Updated', `Driver availability set to ${newStatus}.`);
      fetchData(false);
    } catch (err: any) {
      error('Update Failed', err.response?.data?.error || 'Failed to update driver status.');
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await driversApi.create(newDriver as any);
      success('Driver Onboarded', `Driver ${created.firstName} ${created.lastName} (${created.driverCode}) registered.`);
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
      error('Onboarding Failed', err.response?.data?.error || 'Failed to create driver.');
    }
  };

  const handleDeleteDriver = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await driversApi.delete(deleteTarget.id);
      success('Driver Deleted', `Driver ${deleteTarget.firstName} ${deleteTarget.lastName} removed.`);
      setDeleteTarget(null);
      if (selectedDriver?.id === deleteTarget.id) {
        setIsDetailsOpen(false);
        setSelectedDriver(null);
      }
      fetchData(false);
    } catch (err: any) {
      error('Delete Failed', err.response?.data?.error || 'Cannot delete driver (active trips exist).');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Driver>[] = [
    {
      header: 'Driver Code & Name',
      accessor: 'driverCode',
      sortable: true,
      render: (d) => (
        <div>
          <span className="font-semibold text-slate-900">{d.firstName} {d.lastName}</span>
          <div className="text-[11px] text-slate-500 font-mono">{d.driverCode}</div>
        </div>
      ),
    },
    {
      header: 'Contact Information',
      accessor: 'phone',
      render: (d) => (
        <div className="text-xs">
          <div className="text-slate-800 font-mono">{d.phone}</div>
          <div className="text-[11px] text-slate-500">{d.email}</div>
        </div>
      ),
    },
    {
      header: 'License & Endorsements',
      render: (d) => (
        <div className="text-xs">
          <span className="font-mono font-medium text-slate-800">{d.licenseNumber}</span>
          <div className="text-[11px] text-slate-500">{d.licenseClass} &bull; Valid to {d.licenseExpiry}</div>
        </div>
      ),
    },
    {
      header: 'Performance',
      render: (d) => (
        <div className="text-xs">
          <div className="flex items-center gap-1 text-slate-800 font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{d.rating || 4.9}</span>
          </div>
          <div className="text-[11px] text-slate-500">{d.totalDeliveries || 0} completed trips</div>
        </div>
      ),
    },
    {
      header: 'Operational Status',
      accessor: 'status',
      sortable: true,
      render: (d) => <StatusBadge status={d.status} type="driver" />,
    },
    {
      header: 'Shift Toggle',
      render: (d) => (
        <div>
          {d.status === 'AVAILABLE' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus(d.id, 'OFF_DUTY');
              }}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Go Off-Duty
            </button>
          ) : d.status === 'OFF_DUTY' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus(d.id, 'AVAILABLE');
              }}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              Set Available
            </button>
          ) : (
            <span className="text-[11px] text-blue-600 font-medium">On Trip</span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDriver(d);
              setIsDetailsOpen(true);
            }}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            Profile
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(d);
            }}
            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
            title="Delete driver"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Commercial Driver Roster
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
              {drivers.length} Drivers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            CDL licensure verification, driver shift availability, performance ratings, and emergency contacts
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchData(true)}
            className="p-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 shadow-2xs transition-colors"
            title="Refresh driver roster"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Driver</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-700">Filter By:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
        >
          <option value="ALL">All Shift Statuses</option>
          <option value="AVAILABLE">Available (Ready for Dispatch)</option>
          <option value="ON_DELIVERY">On Delivery (En Route)</option>
          <option value="OFF_DUTY">Off Duty</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        <select
          value={licenseFilter}
          onChange={(e) => setLicenseFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
        >
          <option value="ALL">All License Classes</option>
          <option value="CDL_A">CDL Class A (Heavy Combo)</option>
          <option value="CDL_B">CDL Class B (Straight Truck)</option>
          <option value="CDL_C">CDL Class C (Light / HazMat)</option>
          <option value="LMV">LMV Commercial Carrier</option>
        </select>

        {(statusFilter !== 'ALL' || licenseFilter !== 'ALL') && (
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setLicenseFilter('ALL');
            }}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium px-2 py-1"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Table */}
      <DataTable
        data={drivers}
        columns={columns}
        keyExtractor={(d) => d.id}
        searchPlaceholder="Search by name, driver code, license number, phone..."
        searchFilter={(d, q) => {
          const matchName = `${d.firstName} ${d.lastName}`.toLowerCase().includes(q.toLowerCase());
          const matchCode = (d.driverCode || d.code || '').toLowerCase().includes(q.toLowerCase());
          const matchPhone = d.phone.toLowerCase().includes(q.toLowerCase());
          const matchLic = d.licenseNumber.toLowerCase().includes(q.toLowerCase());
          return matchName || matchCode || matchPhone || matchLic;
        }}
        isLoading={isLoading}
        pageSize={10}
        onRowClick={(d) => {
          setSelectedDriver(d);
          setIsDetailsOpen(true);
        }}
      />

      {/* Onboard Driver Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Onboard Commercial Driver"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateDriver} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Driver Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newDriver.code}
                onChange={(e) => setNewDriver({ ...newDriver, code: e.target.value.toUpperCase() })}
                placeholder="e.g., DRV-111"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newDriver.firstName}
                onChange={(e) => setNewDriver({ ...newDriver, firstName: e.target.value })}
                placeholder="e.g., Sunil"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newDriver.lastName}
                onChange={(e) => setNewDriver({ ...newDriver, lastName: e.target.value })}
                placeholder="e.g., Joshi"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Email Address</label>
              <input
                type="email"
                required
                value={newDriver.email}
                onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                placeholder="e.g., sunil.j@fleetops.io"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Mobile Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newDriver.phone}
                onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                placeholder="e.g., +91 98200 99881"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                CDL License Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newDriver.licenseNumber}
                onChange={(e) => setNewDriver({ ...newDriver, licenseNumber: e.target.value.toUpperCase() })}
                placeholder="e.g., MH-14-2019-00918"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">License Class</label>
              <select
                value={newDriver.licenseClass}
                onChange={(e) => setNewDriver({ ...newDriver, licenseClass: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
              >
                <option value="CDL_A">CDL Class A (Heavy Combination)</option>
                <option value="CDL_B">CDL Class B (Straight Commercial)</option>
                <option value="CDL_C">CDL Class C (Light / HazMat)</option>
                <option value="LMV">LMV Commercial Transport</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">License Expiry Date</label>
              <input
                type="date"
                required
                value={newDriver.licenseExpiry}
                onChange={(e) => setNewDriver({ ...newDriver, licenseExpiry: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-md font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold shadow-2xs"
            >
              Confirm Onboarding
            </button>
          </div>
        </form>
      </Modal>

      {/* Driver Profile Modal */}
      {selectedDriver && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`Driver Profile — ${selectedDriver.firstName} ${selectedDriver.lastName}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm">
                {selectedDriver.firstName[0]}{selectedDriver.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900">
                  {selectedDriver.firstName} {selectedDriver.lastName}
                </h4>
                <p className="text-slate-500 font-mono text-[11px]">{selectedDriver.driverCode}</p>
              </div>
              <StatusBadge status={selectedDriver.status} type="driver" />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-lg">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">License Number</span>
                <span className="font-semibold text-slate-800 font-mono">{selectedDriver.licenseNumber}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">License Class</span>
                <span className="font-semibold text-slate-800">{selectedDriver.licenseClass}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Valid Through</span>
                <span className="font-semibold text-slate-800">{selectedDriver.licenseExpiry}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Total Trips</span>
                <span className="font-semibold text-slate-800">{selectedDriver.totalDeliveries || 0} completed</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(selectedDriver);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Driver</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-md font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteDriver}
        title="Remove Driver from Roster"
        message={`Are you sure you want to remove driver ${deleteTarget?.firstName} ${deleteTarget?.lastName} (${deleteTarget?.driverCode})?`}
        confirmText="Remove Driver"
        isDangerous={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
