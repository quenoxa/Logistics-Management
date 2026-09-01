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

  useAutoRefresh(fetchData, { intervalMs: 15000 });

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await vehiclesApi.create(newVehicle as any);
      success('VEHICLE REGISTERED', `Asset ${created.code} (${created.licensePlate}) enrolled into fleet.`);
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
      success('MAINTENANCE LOGGED', `Service event confirmed for ${selectedVehicle.code}.`);
      setIsMaintenanceModalOpen(false);
      fetchData(false);
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
      success('VEHICLE DECOMMISSIONED', `Asset ${deleteTarget.code} purged from fleet inventory.`);
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
      header: 'ASSET CODE / REG',
      accessor: 'code',
      sortable: true,
      render: (v) => (
        <div>
          <span className="font-mono font-bold text-cyan-400">{v.code}</span>
          <div className="text-[10px] text-ops-dim font-mono mt-0.5">{v.licensePlate}</div>
        </div>
      ),
    },
    {
      header: 'CHASSIS & CLASSIFICATION',
      accessor: 'model',
      sortable: true,
      render: (v) => (
        <div>
          <span className="font-semibold text-white">{v.make} {v.model}</span>
          <div className="text-[10px] text-ops-dim font-mono">{v.year} &bull; {v.type.replace(/_/g, ' ')}</div>
        </div>
      ),
    },
    {
      header: 'PAYLOAD SPECS',
      render: (v) => (
        <div className="text-xs font-mono">
          <span className="font-bold text-white">{v.maxPayloadKg.toLocaleString()} kg</span>
          <div className="text-[10px] text-ops-dim">{v.maxVolumeM3} m³ volume</div>
        </div>
      ),
    },
    {
      header: 'FUEL & ODOMETER',
      render: (v) => (
        <div className="text-xs font-mono">
          <div className="flex items-center gap-1 font-bold text-cyan-400">
            <Fuel className="w-3.5 h-3.5 text-cyan-400" />
            <span>{v.currentFuelPercent}% {v.fuelType}</span>
          </div>
          <div className="text-[10px] text-ops-dim">{v.currentMileageKm.toLocaleString()} km</div>
        </div>
      ),
    },
    {
      header: 'STATUS',
      accessor: 'status',
      sortable: true,
      render: (v) => <StatusBadge status={v.status} type="vehicle" />,
    },
    {
      header: 'ACTIONS',
      className: 'text-right',
      render: (v) => (
        <div className="flex items-center justify-end gap-1.5 font-mono">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedVehicle(v);
              setIsDetailsOpen(true);
            }}
            className="px-2.5 py-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-ops-panel hover:bg-ops-panelHover border border-ops-border rounded transition-all shadow-panel"
          >
            SPECS
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(v);
            }}
            className="p-1 text-ops-dim hover:text-rose-400 rounded transition-colors"
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
      {/* Page Command Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ops-border pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold font-mono tracking-tight text-white uppercase flex items-center gap-2">
              <span className="w-2 h-4 bg-cyan-400 rounded-xs"></span>
              Fleet Asset Inventory & Telematics
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-ops-surface border border-ops-border text-ops-muted text-xs font-mono font-bold">
              {vehicles.length} ASSETS
            </span>
          </div>
          <p className="text-xs text-ops-muted mt-1 font-sans">
            Commercial trailers, medium carriers, payload capacities, telemetry health, and depot maintenance logs
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchData(true)}
            className="p-2 rounded-md bg-ops-surface hover:bg-ops-panel border border-ops-border text-ops-muted hover:text-ops-text transition-colors shadow-panel"
            title="Refresh list"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-glow-cyan transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>ENROLL ASSET</span>
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
          <option value="ALL">All Operational Statuses</option>
          <option value="ACTIVE">Active (Available)</option>
          <option value="IN_TRANSIT">In Transit (En Route)</option>
          <option value="MAINTENANCE">Under Maintenance</option>
          <option value="IDLE">Idle at Depot</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-ops-bg border border-ops-border rounded-md text-xs font-mono font-medium text-ops-text focus:border-cyan-500"
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
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-1"
          >
            [RESET FILTERS]
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
        title="Enroll Commercial Vehicle Asset"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">
                Vehicle Fleet Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newVehicle.code}
                onChange={(e) => setNewVehicle({ ...newVehicle, code: e.target.value.toUpperCase() })}
                placeholder="e.g., TRK-105"
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">
                License Plate <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newVehicle.licensePlate}
                onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value.toUpperCase() })}
                placeholder="e.g., MH-12-TR-9921"
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">VIN / Chassis</label>
              <input
                type="text"
                value={newVehicle.vin}
                onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                placeholder="e.g., MAT8271891726354"
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Manufacturer Make</label>
              <input
                type="text"
                required
                value={newVehicle.make}
                onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                placeholder="e.g., Tata Motors"
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Model Name</label>
              <input
                type="text"
                required
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                placeholder="e.g., Prima 5530.S"
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Manufacturing Year</label>
              <input
                type="number"
                required
                value={newVehicle.year}
                onChange={(e) => setNewVehicle({ ...newVehicle, year: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Classification</label>
              <select
                value={newVehicle.type}
                onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              >
                <option value="SEMI_TRAILER">Heavy Duty Semi-Trailer</option>
                <option value="MEDIUM_DUTY">Medium Duty Box Truck</option>
                <option value="LIGHT_COMMERCIAL">Light Commercial Truck</option>
                <option value="SPRINTER_VAN">Sprinter Courier Van</option>
                <option value="REEFER">Refrigerated Reefer</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Max Payload (kg)</label>
              <input
                type="number"
                required
                value={newVehicle.maxPayloadKg}
                onChange={(e) => setNewVehicle({ ...newVehicle, maxPayloadKg: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Max Volume (m³)</label>
              <input
                type="number"
                required
                value={newVehicle.maxVolumeM3}
                onChange={(e) => setNewVehicle({ ...newVehicle, maxVolumeM3: Number(e.target.value) })}
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
              Register Asset
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
          <div className="space-y-4 text-xs font-sans">
            {/* Spec Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-ops-bg border border-ops-border rounded-lg font-mono">
              <div>
                <span className="text-[10px] text-ops-dim block uppercase">Status</span>
                <StatusBadge status={selectedVehicle.status} type="vehicle" />
              </div>
              <div>
                <span className="text-[10px] text-ops-dim block uppercase">Payload Limit</span>
                <span className="font-bold text-white">{selectedVehicle.maxPayloadKg.toLocaleString()} kg</span>
              </div>
              <div>
                <span className="text-[10px] text-ops-dim block uppercase">Odometer</span>
                <span className="font-bold text-cyan-400">{selectedVehicle.currentMileageKm.toLocaleString()} km</span>
              </div>
              <div>
                <span className="text-[10px] text-ops-dim block uppercase">Fuel Level</span>
                <span className="font-bold text-emerald-400">{selectedVehicle.currentFuelPercent}%</span>
              </div>
            </div>

            {/* Maintenance History Section */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-ops-border">
                <h4 className="font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Depot Service & Maintenance History</span>
                </h4>
                <button
                  onClick={() => setIsMaintenanceModalOpen(true)}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-mono font-bold uppercase rounded shadow-glow-cyan transition-all"
                >
                  + RECORD SERVICE
                </button>
              </div>

              <div className="divide-y divide-ops-border/40 max-h-48 overflow-y-auto mt-2">
                {selectedVehicle.maintenanceLogs && selectedVehicle.maintenanceLogs.length > 0 ? (
                  selectedVehicle.maintenanceLogs.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-white block">
                          {log.serviceType.replace(/_/g, ' ')} &bull; ₹{log.cost.toLocaleString()}
                        </span>
                        <span className="text-ops-dim text-[11px]">{log.description || 'Routine scheduled bay service'}</span>
                      </div>
                      <div className="text-right text-[10px] text-ops-dim font-mono">
                        <span>{new Date(log.performedAt || log.createdAt).toLocaleDateString('en-IN')}</span>
                        <span className="block text-cyan-400">{log.odometerKm} km</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-ops-dim text-center py-6 font-mono text-xs">No maintenance logs recorded for this vehicle asset.</p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-ops-border">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(selectedVehicle);
                }}
                className="text-xs font-mono text-rose-400 hover:text-rose-300 font-bold uppercase inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>PURGE ASSET</span>
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

      {/* Record Maintenance Modal */}
      {selectedVehicle && (
        <Modal
          isOpen={isMaintenanceModalOpen}
          onClose={() => setIsMaintenanceModalOpen(false)}
          title={`Log Maintenance — ${selectedVehicle.code}`}
        >
          <form onSubmit={handleAddMaintenance} className="space-y-4 text-xs font-sans">
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Service Type</label>
              <select
                value={newLog.serviceType}
                onChange={(e) => setNewLog({ ...newLog, serviceType: e.target.value })}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
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
                <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Cost (₹ INR)</label>
                <input
                  type="number"
                  required
                  value={newLog.cost}
                  onChange={(e) => setNewLog({ ...newLog, cost: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Odometer (km)</label>
                <input
                  type="number"
                  required
                  value={newLog.odometerKm}
                  onChange={(e) => setNewLog({ ...newLog, odometerKm: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Description / Notes</label>
              <textarea
                rows={2}
                value={newLog.description}
                onChange={(e) => setNewLog({ ...newLog, description: e.target.value })}
                placeholder="e.g., Synthetic engine oil replacement and oil filter change..."
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text focus:border-cyan-500"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
              <button
                type="button"
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="px-3.5 py-1.5 bg-ops-panel hover:bg-ops-panelHover border border-ops-border text-ops-muted hover:text-ops-text rounded-md font-mono font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-mono font-bold rounded-md uppercase tracking-wider shadow-glow-cyan"
              >
                Confirm Service Log
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
        title="Purge Vehicle Asset"
        message={`Are you sure you want to permanently delete vehicle ${deleteTarget?.code} (${deleteTarget?.licensePlate})? This cannot be undone.`}
        confirmText="Purge Vehicle"
        isDangerous={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
