import React, { useState, useEffect } from 'react';
import {
  Truck,
  Wrench,
  Plus,
  BatteryCharging,
  Fuel,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Edit,
  Trash2,
  Filter,
  RotateCw,
  Gauge,
  ShieldCheck,
} from 'lucide-react';
import { vehiclesApi, driversApi } from '../services/api';
import { Vehicle, Driver, MaintenanceLog } from '../../shared/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { MetricCard } from '../components/common/MetricCard';

export const Vehicles: React.FC = () => {
  const { success, error } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Selected vehicle for details / maintenance
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Vehicle Form State
  const [newVehicle, setNewVehicle] = useState({
    code: '',
    vin: '',
    make: 'Tata Motors',
    model: 'Signa 2823',
    year: new Date().getFullYear(),
    licensePlate: '',
    type: 'SEMI_TRAILER',
    status: 'ACTIVE',
    maxPayloadKg: 20000,
    maxVolumeM3: 85,
    fuelType: 'DIESEL',
    currentFuelPercent: 100,
    currentMileageKm: 0,
    notes: '',
  });

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const [vData, dData] = await Promise.all([
        vehiclesApi.getAll({
          status: statusFilter,
          type: typeFilter,
        }),
        driversApi.getAll(),
      ]);
      setVehicles(vData);
      setDrivers(dData);
    } catch (err: any) {
      console.error('Failed to fetch vehicles:', err);
      error('Error', 'Failed to load vehicle inventory from database.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, [statusFilter, typeFilter]);

  useAutoRefresh(fetchData, { intervalMs: 15000 });

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await vehiclesApi.create(newVehicle as any);
      success('Vehicle Registered', `Asset ${created.code} (${created.licensePlate}) added to fleet.`);
      setIsAddModalOpen(false);
      fetchData(false);
    } catch (err: any) {
      error('Registration Failed', err.response?.data?.error || 'Failed to create vehicle.');
    }
  };

  const handleDeleteVehicle = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await vehiclesApi.delete(deleteTarget.id);
      success('Vehicle Removed', `Asset ${deleteTarget.code} deleted.`);
      setDeleteTarget(null);
      fetchData(false);
    } catch (err: any) {
      error('Delete Error', err.response?.data?.error || 'Failed to remove vehicle.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (vehicleId: string, status: string) => {
    try {
      await vehiclesApi.updateStatus(vehicleId, status);
      success('Status Updated', `Vehicle status updated to ${status}.`);
      fetchData(false);
    } catch (err: any) {
      error('Update Failed', err.response?.data?.error || 'Failed to update vehicle status.');
    }
  };

  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status === 'ACTIVE' || v.status === 'AVAILABLE').length;
  const inTransitVehicles = vehicles.filter((v) => v.status === 'IN_TRANSIT' || v.status === 'ASSIGNED').length;
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'MAINTENANCE').length;

  const columns: Column<Vehicle>[] = [
    {
      header: 'Vehicle Code / Plate',
      accessor: 'code',
      sortable: true,
      render: (v) => (
        <div>
          <span className="font-mono font-bold text-emerald-600 block text-sm">{v.code}</span>
          <span className="font-mono text-xs text-slate-900 font-bold mt-0.5 block">{v.licensePlate}</span>
        </div>
      ),
    },
    {
      header: 'Make / Model',
      accessor: 'model',
      sortable: true,
      render: (v) => (
        <div>
          <span className="font-bold text-slate-900 block">{v.manufacturer || v.make} {v.model}</span>
          <span className="text-xs text-slate-500 font-mono">Year {v.year}</span>
        </div>
      ),
    },
    {
      header: 'Type & Capacity',
      accessor: 'type',
      render: (v) => (
        <div className="text-xs">
          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-semibold text-slate-700 block max-w-max">
            {v.type.replace(/_/g, ' ')}
          </span>
          <span className="text-slate-500 block mt-1 font-mono text-[11px]">
            {(v.maxPayloadKg || v.capacity || 1000).toLocaleString()} kg max
          </span>
        </div>
      ),
    },
    {
      header: 'Fuel & Mileage',
      render: (v) => (
        <div className="text-xs font-mono space-y-0.5">
          <div className="text-emerald-600 font-bold flex items-center gap-1">
            <Fuel className="w-3.5 h-3.5" />
            <span>{v.currentFuelPercent || 100}% {v.fuelType}</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            {(v.currentMileageKm || v.mileage || 0).toLocaleString()} km
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (v) => <StatusBadge status={v.status} type="vehicle" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (v) => (
        <div className="flex items-center justify-end space-x-2">
          <select
            value={v.status}
            onChange={(e) => handleToggleStatus(v.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(v);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
            title="Delete vehicle"
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
              Vehicles Inventory
            </h1>
            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
              {totalVehicles} Assets
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Commercial fleet vehicles, payload capacities, fuel telematics, and maintenance statuses
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchData(true)}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition shadow-sm"
            title="Refresh fleet list"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Total Vehicles" value={totalVehicles} icon={<Truck className="w-4 h-4" />} variant="default" />
        <MetricCard label="Available" value={activeVehicles} icon={<CheckCircle2 className="w-4 h-4" />} variant="emerald" />
        <MetricCard label="In Transit" value={inTransitVehicles} icon={<Gauge className="w-4 h-4" />} variant="blue" />
        <MetricCard label="Maintenance" value={maintenanceVehicles} icon={<Wrench className="w-4 h-4" />} variant="rose" />
      </div>

      {/* Main Table */}
      <DataTable
        data={vehicles}
        columns={columns}
        keyExtractor={(v) => v.id}
        searchPlaceholder="Search vehicle code, plate, model..."
        searchFilter={(v, q) => {
          const matchCode = v.code.toLowerCase().includes(q.toLowerCase());
          const matchPlate = v.licensePlate.toLowerCase().includes(q.toLowerCase());
          const matchModel = `${v.make || ''} ${v.model}`.toLowerCase().includes(q.toLowerCase());
          return matchCode || matchPlate || matchModel;
        }}
        isLoading={isLoading}
        pageSize={10}
        onRowClick={(v) => {
          setSelectedVehicle(v);
          setIsDetailsOpen(true);
        }}
      />

      {/* Vehicle Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedVehicle ? `Asset Details: ${selectedVehicle.code}` : 'Asset Details'}
      >
        {selectedVehicle && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-500 font-bold block">Vehicle Code</span>
                <span className="font-mono text-lg font-bold text-emerald-600">
                  {selectedVehicle.code}
                </span>
              </div>
              <StatusBadge status={selectedVehicle.status} type="vehicle" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 block">License Plate</span>
                <span className="font-mono font-bold text-slate-900">{selectedVehicle.licensePlate}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 block">Make & Model</span>
                <span className="font-mono font-bold text-slate-900">{selectedVehicle.make || selectedVehicle.manufacturer} {selectedVehicle.model}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 block font-bold">Max Payload Capacity</span>
              <p className="text-slate-900 font-semibold font-mono mt-0.5">{(selectedVehicle.maxPayloadKg || selectedVehicle.capacity || 1000).toLocaleString()} kg</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Commercial Vehicle"
      >
        <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Vehicle Code *</label>
              <input
                type="text"
                required
                value={newVehicle.code}
                onChange={(e) => setNewVehicle({ ...newVehicle, code: e.target.value })}
                placeholder="FL-9021"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">License Plate *</label>
              <input
                type="text"
                required
                value={newVehicle.licensePlate}
                onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
                placeholder="MH-12-PQ-8821"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Manufacturer / Make</label>
              <input
                type="text"
                value={newVehicle.make}
                onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                placeholder="Tata Motors"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Model Name</label>
              <input
                type="text"
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                placeholder="Signa 2823"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Vehicle Type</label>
              <select
                value={newVehicle.type}
                onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              >
                <option value="SEMI_TRAILER">Semi-Trailer Truck</option>
                <option value="BOX_TRUCK">Box Truck</option>
                <option value="SPRINTER_VAN">Sprinter Van</option>
                <option value="REEFER_TRUCK">Reefer Cold Chain Truck</option>
                <option value="EV_VAN">Electric Cargo Van</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Max Payload (kg)</label>
              <input
                type="number"
                value={newVehicle.maxPayloadKg}
                onChange={(e) => setNewVehicle({ ...newVehicle, maxPayloadKg: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
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
              Add Vehicle
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteVehicle}
        title="Delete Vehicle Asset"
        message={`Are you sure you want to delete vehicle ${deleteTarget?.code} (${deleteTarget?.licensePlate})?`}
        isLoading={isDeleting}
      />
    </div>
  );
};
