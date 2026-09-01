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
    make: '',
    model: '',
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

  // Maintenance Form State
  const [newLog, setNewLog] = useState({
    serviceType: 'OIL_CHANGE',
    description: '',
    cost: 500,
    odometerKm: 0,
    performedBy: 'Fleet Central Maintenance Bay',
    status: 'COMPLETED' as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED',
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

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await vehiclesApi.create(newVehicle as any);
      success('Vehicle Registered', `Vehicle asset ${created.code} (${created.licensePlate}) added.`);
      setIsAddModalOpen(false);
      fetchData(false);
      setNewVehicle({
        code: '',
        vin: '',
        make: '',
        model: '',
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
    } catch (err: any) {
      error('Creation Failed', err.response?.data?.error || 'Failed to create vehicle.');
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    try {
      await vehiclesApi.addMaintenanceLog(selectedVehicle.id, newLog);
      success('Maintenance Logged', `Service recorded for ${selectedVehicle.code}.`);
      setIsMaintenanceModalOpen(false);
      fetchData(false);
      // Refresh selected vehicle details
      const updated = await vehiclesApi.getById(selectedVehicle.id);
      setSelectedVehicle(updated);
    } catch (err: any) {
      error('Maintenance Failed', err.response?.data?.error || 'Failed to record maintenance.');
    }
  };

  const handleDeleteVehicle = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await vehiclesApi.delete(deleteTarget.id);
      success('Vehicle Removed', `Vehicle ${deleteTarget.code} deleted from fleet database.`);
      setDeleteTarget(null);
      if (selectedVehicle?.id === deleteTarget.id) {
        setIsDetailsOpen(false);
        setSelectedVehicle(null);
      }
      fetchData(false);
    } catch (err: any) {
      error('Delete Failed', err.response?.data?.error || 'Cannot delete vehicle (it may have active shipments).');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Vehicle>[] = [
    {
      header: 'Vehicle Code',
      accessor: 'code',
      sortable: true,
      render: (v) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{v.code}</span>
          <div className="text-[11px] text-slate-500 font-mono">{v.licensePlate}</div>
        </div>
      ),
    },
    {
      header: 'Make & Model',
      accessor: 'model',
      sortable: true,
      render: (v) => (
        <div>
          <span className="font-semibold text-slate-900">{v.make} {v.model}</span>
          <div className="text-[11px] text-slate-500">{v.year} &bull; {v.type.replace(/_/g, ' ')}</div>
        </div>
      ),
    },
    {
      header: 'Capacity Specs',
      render: (v) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800">{v.maxPayloadKg.toLocaleString()} kg</span>
          <div className="text-[11px] text-slate-500">{v.maxVolumeM3} m³ volume</div>
        </div>
      ),
    },
    {
      header: 'Fuel & Odometer',
      render: (v) => (
        <div className="text-xs">
          <div className="flex items-center gap-1 font-semibold text-slate-800">
            <Fuel className="w-3 h-3 text-slate-500" />
            <span>{v.currentFuelPercent}% {v.fuelType}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">{v.currentMileageKm.toLocaleString()} km</div>
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
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedVehicle(v);
              setIsDetailsOpen(true);
            }}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            Details
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(v);
            }}
            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
            title="Delete vehicle"
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
              Commercial Fleet Inventory
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
              {vehicles.length} Assets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Commercial trailers, medium carriers, payload capacities, telemetry health, and depot maintenance logs
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchData(true)}
            className="p-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 shadow-2xs transition-colors"
            title="Refresh list"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle Asset</span>
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
          <option value="ALL">All Operational Statuses</option>
          <option value="ACTIVE">Active (Available)</option>
          <option value="IN_TRANSIT">In Transit (En Route)</option>
          <option value="MAINTENANCE">Under Maintenance</option>
          <option value="IDLE">Idle at Depot</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
        >
          <option value="ALL">All Vehicle Types</option>
          <option value="SEMI_TRAILER">Heavy Duty Semi-Trailer</option>
          <option value="MEDIUM_DUTY">Medium Duty Box Truck</option>
          <option value="LIGHT_COMMERCIAL">Light Commercial Truck</option>
          <option value="SPRINTER_VAN">Sprinter Courier Van</option>
          <option value="REEFER">Refrigerated Reefer</option>
        </select>

        {(statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setTypeFilter('ALL');
            }}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium px-2 py-1"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Table */}
      <DataTable
        data={vehicles}
        columns={columns}
        keyExtractor={(v) => v.id}
        searchPlaceholder="Search by vehicle code, license plate, make, model..."
        searchFilter={(v, q) => {
          const matchCode = v.code.toLowerCase().includes(q.toLowerCase());
          const matchPlate = v.licensePlate.toLowerCase().includes(q.toLowerCase());
          const matchMake = v.make.toLowerCase().includes(q.toLowerCase());
          const matchModel = v.model.toLowerCase().includes(q.toLowerCase());
          return matchCode || matchPlate || matchMake || matchModel;
        }}
        isLoading={isLoading}
        pageSize={10}
        onRowClick={(v) => {
          setSelectedVehicle(v);
          setIsDetailsOpen(true);
        }}
      />

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Commercial Vehicle Asset"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Vehicle Fleet Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newVehicle.code}
                onChange={(e) => setNewVehicle({ ...newVehicle, code: e.target.value.toUpperCase() })}
                placeholder="e.g., TRK-105"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                License Plate <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newVehicle.licensePlate}
                onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value.toUpperCase() })}
                placeholder="e.g., MH-12-TR-9921"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">VIN / Chassis Number</label>
              <input
                type="text"
                value={newVehicle.vin}
                onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                placeholder="e.g., MAT8271891726354"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Manufacturer Make</label>
              <input
                type="text"
                required
                value={newVehicle.make}
                onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                placeholder="e.g., Tata Motors"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Model Name</label>
              <input
                type="text"
                required
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                placeholder="e.g., Prima 5530.S"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Manufacturing Year</label>
              <input
                type="number"
                required
                value={newVehicle.year}
                onChange={(e) => setNewVehicle({ ...newVehicle, year: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Classification Type</label>
              <select
                value={newVehicle.type}
                onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
              >
                <option value="SEMI_TRAILER">Heavy Duty Semi-Trailer</option>
                <option value="MEDIUM_DUTY">Medium Duty Box Truck</option>
                <option value="LIGHT_COMMERCIAL">Light Commercial Truck</option>
                <option value="SPRINTER_VAN">Sprinter Courier Van</option>
                <option value="REEFER">Refrigerated Reefer</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Max Payload (kg)</label>
              <input
                type="number"
                required
                value={newVehicle.maxPayloadKg}
                onChange={(e) => setNewVehicle({ ...newVehicle, maxPayloadKg: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Max Volume (m³)</label>
              <input
                type="number"
                required
                value={newVehicle.maxVolumeM3}
                onChange={(e) => setNewVehicle({ ...newVehicle, maxVolumeM3: Number(e.target.value) })}
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
              Register Vehicle
            </button>
          </div>
        </form>
      </Modal>

      {/* Vehicle Details & Maintenance Modal */}
      {selectedVehicle && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`Vehicle Specs & Logs — ${selectedVehicle.code}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Spec Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Status</span>
                <StatusBadge status={selectedVehicle.status} type="vehicle" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Payload Limit</span>
                <span className="font-semibold text-slate-900">{selectedVehicle.maxPayloadKg.toLocaleString()} kg</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Odometer</span>
                <span className="font-semibold text-slate-900 font-mono">{selectedVehicle.currentMileageKm.toLocaleString()} km</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Fuel Level</span>
                <span className="font-semibold text-slate-900">{selectedVehicle.currentFuelPercent}%</span>
              </div>
            </div>

            {/* Maintenance History Section */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-slate-500" />
                  <span>Depot Service & Maintenance History</span>
                </h4>
                <button
                  onClick={() => setIsMaintenanceModalOpen(true)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded shadow-2xs transition-colors"
                >
                  + Record Service
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto mt-2">
                {selectedVehicle.maintenanceLogs && selectedVehicle.maintenanceLogs.length > 0 ? (
                  selectedVehicle.maintenanceLogs.map((log) => (
                    <div key={log.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800 block">
                          {log.serviceType.replace(/_/g, ' ')} &bull; ₹{log.cost.toLocaleString()}
                        </span>
                        <span className="text-slate-500 text-[11px]">{log.description || 'Routine service'}</span>
                      </div>
                      <div className="text-right text-[11px] text-slate-400">
                        <span>{new Date(log.performedAt || log.createdAt).toLocaleDateString('en-IN')}</span>
                        <span className="block font-mono">{log.odometerKm} km</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-6">No maintenance logs recorded for this vehicle.</p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(selectedVehicle);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Asset</span>
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

      {/* Record Maintenance Modal */}
      {selectedVehicle && (
        <Modal
          isOpen={isMaintenanceModalOpen}
          onClose={() => setIsMaintenanceModalOpen(false)}
          title={`Log Maintenance — ${selectedVehicle.code}`}
        >
          <form onSubmit={handleAddMaintenance} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Service Type</label>
              <select
                value={newLog.serviceType}
                onChange={(e) => setNewLog({ ...newLog, serviceType: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
              >
                <option value="OIL_CHANGE">Oil & Filter Change</option>
                <option value="BRAKE_INSPECTION">Brake Pad & Drum Inspection</option>
                <option value="TIRE_ROTATION">Tire Rotation / Replacement</option>
                <option value="ENGINE_DIAGNOSTICS">Engine Diagnostics & ECU Tuning</option>
                <option value="ANNUAL_OVERHAUL">Full Annual Overhaul & Fitness Cert</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Cost (₹ INR)</label>
                <input
                  type="number"
                  required
                  value={newLog.cost}
                  onChange={(e) => setNewLog({ ...newLog, cost: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Odometer (km)</label>
                <input
                  type="number"
                  required
                  value={newLog.odometerKm}
                  onChange={(e) => setNewLog({ ...newLog, odometerKm: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Description / Notes</label>
              <textarea
                rows={2}
                value={newLog.description}
                onChange={(e) => setNewLog({ ...newLog, description: e.target.value })}
                placeholder="e.g., Synthetic engine oil replacement and oil filter change..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-md font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold shadow-2xs"
              >
                Confirm Log
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteVehicle}
        title="Delete Vehicle Asset"
        message={`Are you sure you want to permanently delete vehicle ${deleteTarget?.code} (${deleteTarget?.licensePlate})? This cannot be undone.`}
        confirmText="Delete Vehicle"
        isDangerous={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
