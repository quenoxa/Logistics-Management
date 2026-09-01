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
      success('SHIFT STATUS COMMITTED', `Driver availability updated to ${newStatus}.`);
      fetchData(false);
    } catch (err: any) {
      error('Update Failed', err.response?.data?.error || 'Failed to update driver status.');
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await driversApi.create(newDriver as any);
      success('DRIVER ONBOARDED', `Driver ${created.firstName} ${created.lastName} (${created.driverCode || created.code}) enrolled.`);
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
      success('DRIVER REMOVED', `Driver ${deleteTarget.firstName} ${deleteTarget.lastName} purged from roster.`);
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
      header: 'DRIVER CODE & NAME',
      accessor: 'driverCode',
      sortable: true,
      render: (d) => (
        <div>
          <span className="font-semibold text-white">{d.firstName} {d.lastName}</span>
          <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{d.driverCode || d.code}</div>
        </div>
      ),
    },
    {
      header: 'CONTACT TELEMETRY',
      accessor: 'phone',
      render: (d) => (
        <div className="text-xs font-mono">
          <div className="text-ops-text">{d.phone}</div>
          <div className="text-[10px] text-ops-dim font-sans">{d.email}</div>
        </div>
      ),
    },
    {
      header: 'CDL ENDORSEMENTS',
      render: (d) => (
        <div className="text-xs font-mono">
          <span className="font-bold text-white">{d.licenseNumber}</span>
          <div className="text-[10px] text-ops-dim">{d.licenseClass} &bull; Valid {d.licenseExpiry}</div>
        </div>
      ),
    },
    {
      header: 'PERFORMANCE SLA',
      render: (d) => (
        <div className="text-xs font-mono">
          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{d.rating || 4.9}</span>
          </div>
          <div className="text-[10px] text-ops-dim">{d.totalDeliveries || 0} completed trips</div>
        </div>
      ),
    },
    {
      header: 'SHIFT CLEARANCE',
      accessor: 'status',
      sortable: true,
      render: (d) => <StatusBadge status={d.status} type="driver" />,
    },
    {
      header: 'DUTY TOGGLE',
      render: (d) => (
        <div className="font-mono">
          {d.status === 'AVAILABLE' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus(d.id, 'OFF_DUTY');
              }}
              className="px-2.5 py-1 rounded text-[10px] font-bold bg-ops-panel hover:bg-ops-panelHover text-ops-dim hover:text-ops-text border border-ops-border transition-all"
            >
              GO OFF-DUTY
            </button>
          ) : d.status === 'OFF_DUTY' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus(d.id, 'AVAILABLE');
              }}
              className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 hover:bg-emerald-900/60 shadow-glow-emerald/20 transition-all"
            >
              SET AVAILABLE
            </button>
          ) : (
            <span className="text-[10px] font-bold text-cyan-400">ON TRIP</span>
          )}
        </div>
      ),
    },
    {
      header: 'ACTIONS',
      className: 'text-right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1.5 font-mono">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDriver(d);
              setIsDetailsOpen(true);
            }}
            className="px-2.5 py-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-ops-panel hover:bg-ops-panelHover border border-ops-border rounded transition-all shadow-panel"
          >
            DOSSIER
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(d);
            }}
            className="p-1 text-ops-dim hover:text-rose-400 rounded transition-colors"
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
      {/* Page Command Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ops-border pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold font-mono tracking-tight text-white uppercase flex items-center gap-2">
              <span className="w-2 h-4 bg-cyan-400 rounded-xs"></span>
              Commercial Driver Roster
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-ops-surface border border-ops-border text-ops-muted text-xs font-mono font-bold">
              {drivers.length} DRIVERS
            </span>
          </div>
          <p className="text-xs text-ops-muted mt-1 font-sans">
            CDL licensure verification, driver shift availability, performance ratings, and emergency contacts
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchData(true)}
            className="p-2 rounded-md bg-ops-surface hover:bg-ops-panel border border-ops-border text-ops-muted hover:text-ops-text transition-colors shadow-panel"
            title="Refresh driver roster"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-glow-cyan transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>ONBOARD DRIVER</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-lg bg-ops-surface border border-ops-border shadow-panel">
        <div className="flex items-center space-x-1.5 text-xs text-ops-dim mr-2 font-mono">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-ops-text uppercase">FILTERS:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-ops-bg border border-ops-border rounded-md text-xs font-mono font-medium text-ops-text focus:border-cyan-500"
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
          className="px-2.5 py-1.5 bg-ops-bg border border-ops-border rounded-md text-xs font-mono font-medium text-ops-text focus:border-cyan-500"
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
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-1"
          >
            [RESET FILTERS]
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
        <form onSubmit={handleCreateDriver} className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">
                Driver Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newDriver.code}
                onChange={(e) => setNewDriver({ ...newDriver, code: e.target.value.toUpperCase() })}
                placeholder="e.g., DRV-111"
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">
                First Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newDriver.firstName}
                onChange={(e) => setNewDriver({ ...newDriver, firstName: e.target.value })}
                placeholder="e.g., Sunil"
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">
                Last Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newDriver.lastName}
                onChange={(e) => setNewDriver({ ...newDriver, lastName: e.target.value })}
                placeholder="e.g., Joshi"
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                value={newDriver.email}
                onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                placeholder="e.g., sunil.j@fleetops.io"
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">
                Mobile Phone <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newDriver.phone}
                onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                placeholder="e.g., +91 98200 99881"
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">
                CDL License Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newDriver.licenseNumber}
                onChange={(e) => setNewDriver({ ...newDriver, licenseNumber: e.target.value.toUpperCase() })}
                placeholder="e.g., MH-14-2019-00918"
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">License Class</label>
              <select
                value={newDriver.licenseClass}
                onChange={(e) => setNewDriver({ ...newDriver, licenseClass: e.target.value })}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              >
                <option value="CDL_A">CDL Class A (Heavy Combination)</option>
                <option value="CDL_B">CDL Class B (Straight Commercial)</option>
                <option value="CDL_C">CDL Class C (Light / HazMat)</option>
                <option value="LMV">LMV Commercial Transport</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">License Expiry Date</label>
              <input
                type="date"
                required
                value={newDriver.licenseExpiry}
                onChange={(e) => setNewDriver({ ...newDriver, licenseExpiry: e.target.value })}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-1.5 bg-ops-panel hover:bg-ops-panelHover border border-ops-border text-ops-muted hover:text-ops-text rounded-md font-mono font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-mono font-bold rounded-md uppercase tracking-wider shadow-glow-cyan"
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
          title={`Driver Dossier — ${selectedDriver.firstName} ${selectedDriver.lastName}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs font-sans">
            <div className="flex items-center space-x-3 p-3 bg-ops-bg border border-ops-border rounded-lg">
              <div className="w-10 h-10 rounded-full bg-ops-panel text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-sm">
                {selectedDriver.firstName[0]}{selectedDriver.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white">
                  {selectedDriver.firstName} {selectedDriver.lastName}
                </h4>
                <p className="text-ops-dim font-mono text-[11px]">{selectedDriver.driverCode || selectedDriver.code}</p>
              </div>
              <StatusBadge status={selectedDriver.status} type="driver" />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-ops-bg border border-ops-border rounded-lg font-mono">
              <div>
                <span className="text-[10px] text-ops-dim block uppercase">License Number</span>
                <span className="font-bold text-white">{selectedDriver.licenseNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-ops-dim block uppercase">License Class</span>
                <span className="font-bold text-cyan-400">{selectedDriver.licenseClass}</span>
              </div>
              <div>
                <span className="text-[10px] text-ops-dim block uppercase">Valid Through</span>
                <span className="font-bold text-white">{selectedDriver.licenseExpiry}</span>
              </div>
              <div>
                <span className="text-[10px] text-ops-dim block uppercase">Completed Trips</span>
                <span className="font-bold text-emerald-400">{selectedDriver.totalDeliveries || 0} completed</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-ops-border">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(selectedDriver);
                }}
                className="text-xs font-mono text-rose-400 hover:text-rose-300 font-bold uppercase inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>PURGE DRIVER</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-3.5 py-1.5 bg-ops-panel hover:bg-ops-panelHover border border-ops-border text-ops-muted hover:text-ops-text rounded-md font-mono font-semibold"
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
        title="Purge Driver from Roster"
        message={`Are you sure you want to remove driver ${deleteTarget?.firstName} ${deleteTarget?.lastName} (${deleteTarget?.driverCode || deleteTarget?.code})?`}
        confirmText="Purge Driver"
        isDangerous={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
