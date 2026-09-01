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
} from 'lucide-react';
import { vehiclesApi, driversApi } from '../api/client';
import { Vehicle, Driver, MaintenanceLog } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';

export const Vehicles: React.FC = () => {
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

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [vData, dData] = await Promise.all([
        vehiclesApi.getAll({
          status: statusFilter,
          type: typeFilter,
        }),
        driversApi.getAll(),
      ]);
      setVehicles(vData);
      setDrivers(dData);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter]);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vehiclesApi.create(newVehicle as any);
      setIsAddModalOpen(false);
      fetchData();
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
      alert(err.response?.data?.error || 'Failed to create vehicle');
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    try {
      await vehiclesApi.addMaintenanceLog(selectedVehicle.id, newLog);
      setIsMaintenanceModalOpen(false);
      // Refresh selected vehicle
      const updated = await vehiclesApi.getById(selectedVehicle.id);
      setSelectedVehicle(updated);
      fetchData();
      setNewLog({
        serviceType: 'OIL_CHANGE',
        description: '',
        cost: 500,
        odometerKm: updated.currentMileageKm,
        performedBy: 'Fleet Central Maintenance Bay',
        status: 'COMPLETED',
      });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to log maintenance');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to decommission and remove vehicle ${code}?`)) return;
    try {
      await vehiclesApi.delete(id);
      if (selectedVehicle?.id === id) {
        setIsDetailsOpen(false);
        setSelectedVehicle(null);
      }
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete vehicle');
    }
  };

  const openDetails = async (v: Vehicle) => {
    try {
      const full = await vehiclesApi.getById(v.id);
      setSelectedVehicle(full);
      setIsDetailsOpen(true);
      setNewLog((prev) => ({ ...prev, odometerKm: full.currentMileageKm }));
    } catch (err) {
      setSelectedVehicle(v);
      setIsDetailsOpen(true);
    }
  };

  const columns: Column<Vehicle>[] = [
    {
      header: 'Vehicle Code',
      accessor: 'code',
      sortable: true,
      render: (v) => (
        <div className="flex items-center space-x-2">
          <Truck className="w-4 h-4 text-orange-500" />
          <span className="font-mono font-bold text-slate-900">{v.code}</span>
        </div>
      ),
    },
    {
      header: 'Make & Model',
      accessor: 'make',
      sortable: true,
      render: (v) => (
        <div>
          <span className="text-slate-800 font-bold block">{v.make} {v.model}</span>
          <span className="text-[10px] font-mono text-slate-500">{v.licensePlate} &bull; {v.year}</span>
        </div>
      ),
    },
    {
      header: 'Class / Type',
      accessor: 'type',
      sortable: true,
      render: (v) => (
        <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {v.type.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (v) => <StatusBadge status={v.status} type="vehicle" />,
    },
    {
      header: 'Fuel / Batt',
      accessor: 'currentFuelPercent',
      sortable: true,
      render: (v) => (
        <div className="flex items-center space-x-2">
          {v.fuelType === 'ELECTRIC' ? (
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Fuel className="w-3.5 h-3.5 text-orange-500" />
          )}
          <span className={`font-mono text-xs font-bold ${v.currentFuelPercent > 25 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {v.currentFuelPercent}%
          </span>
        </div>
      ),
    },
    {
      header: 'Assigned Driver',
      render: (v) => (
        <div className="text-xs">
          {v.assignedDriver ? (
            <span className="text-emerald-700 font-semibold">
              {v.assignedDriver.firstName} {v.assignedDriver.lastName} ({v.assignedDriver.code})
            </span>
          ) : (
            <span className="text-slate-400 italic">Unassigned (Pool)</span>
          )}
        </div>
      ),
    },
    {
      header: 'Mileage',
      accessor: 'currentMileageKm',
      sortable: true,
      render: (v) => (
        <span className="font-mono text-xs text-slate-700">
          {v.currentMileageKm.toLocaleString()} km
        </span>
      ),
    },
    {
      header: 'Action',
      render: (v) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openDetails(v);
          }}
          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-mono font-bold transition-colors"
        >
          Specs & Logs
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Vehicles
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Commercial vehicle fleet, maintenance records, and driver assignments
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add vehicle</span>
        </button>
      </div>

      {/* Table with Custom Filters */}
      <DataTable
        data={vehicles}
        columns={columns}
        keyExtractor={(v) => v.id}
        searchPlaceholder="Search Code, VIN, Plate, Make, Model..."
        searchFilter={(v, q) =>
          v.code.toLowerCase().includes(q.toLowerCase()) ||
          v.make.toLowerCase().includes(q.toLowerCase()) ||
          v.model.toLowerCase().includes(q.toLowerCase()) ||
          v.licensePlate.toLowerCase().includes(q.toLowerCase()) ||
          v.vin.toLowerCase().includes(q.toLowerCase())
        }
        filtersSlot={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-mono focus:outline-none focus:border-orange-500 shadow-sm"
            >
              <option value="ALL">Status: All</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="IN_TRANSIT">IN TRANSIT</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="IDLE">IDLE</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-mono focus:outline-none focus:border-orange-500 shadow-sm"
            >
              <option value="ALL">Type: All</option>
              <option value="SEMI_TRAILER">Semi Trailer</option>
              <option value="BOX_TRUCK">Box Truck</option>
              <option value="SPRINTER_VAN">Sprinter Van</option>
              <option value="EV_VAN">EV Van</option>
              <option value="REEFER_TRUCK">Reefer Truck</option>
            </select>
          </div>
        }
        isLoading={isLoading}
        onRowClick={openDetails}
      />

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="REGISTER NEW FLEET VEHICLE"
        subtitle="Add a commercial truck, van, or EV to the fleet register"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateVehicle} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Fleet Code (e.g. VEH-401)</label>
              <input
                required
                type="text"
                value={newVehicle.code}
                onChange={(e) => setNewVehicle({ ...newVehicle, code: e.target.value.toUpperCase() })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">VIN / Chassis Number</label>
              <input
                required
                type="text"
                value={newVehicle.vin}
                onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value.toUpperCase() })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Make</label>
              <input
                required
                type="text"
                placeholder="Tata Motors / Ashok Leyland"
                value={newVehicle.make}
                onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Model</label>
              <input
                required
                type="text"
                placeholder="Prima 5530.S"
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Year</label>
              <input
                required
                type="number"
                value={newVehicle.year}
                onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) || 2024 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Registration Plate</label>
              <input
                required
                type="text"
                value={newVehicle.licensePlate}
                onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value.toUpperCase() })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Category / Type</label>
              <select
                value={newVehicle.type}
                onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              >
                <option value="SEMI_TRAILER">Semi-Trailer (Heavy)</option>
                <option value="BOX_TRUCK">Box Truck</option>
                <option value="SPRINTER_VAN">Sprinter Van</option>
                <option value="EV_VAN">EV Van (Electric)</option>
                <option value="REEFER_TRUCK">Reefer Truck (Cold)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Fuel Platform</label>
              <select
                value={newVehicle.fuelType}
                onChange={(e) => setNewVehicle({ ...newVehicle, fuelType: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              >
                <option value="DIESEL">Diesel</option>
                <option value="ELECTRIC">Electric (EV)</option>
                <option value="CNG">CNG</option>
                <option value="PETROL">Petrol</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Max Payload Capacity (kg)</label>
              <input
                type="number"
                value={newVehicle.maxPayloadKg}
                onChange={(e) => setNewVehicle({ ...newVehicle, maxPayloadKg: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Cargo Volume Capacity (m³)</label>
              <input
                type="number"
                value={newVehicle.maxVolumeM3}
                onChange={(e) => setNewVehicle({ ...newVehicle, maxVolumeM3: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-sm"
            >
              Confirm Registration
            </button>
          </div>
        </form>
      </Modal>

      {/* Vehicle Details & Maintenance Drawer */}
      {isDetailsOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white h-full border-l border-slate-200 flex flex-col shadow-2xl">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg border border-orange-200">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono text-base font-bold text-slate-900">{selectedVehicle.code}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMaintenanceModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Log Service</span>
                </button>
                <button
                  onClick={() => handleDelete(selectedVehicle.id, selectedVehicle.code)}
                  className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6 font-mono text-xs">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 font-bold uppercase">Operational Status</span>
                <StatusBadge status={selectedVehicle.status} type="vehicle" size="md" />
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 font-bold uppercase block mb-1">Registration Plate</span>
                  <span className="text-slate-900 font-bold text-sm">{selectedVehicle.licensePlate}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 font-bold uppercase block mb-1">Fuel / Platform</span>
                  <span className="text-slate-900 font-bold text-sm flex items-center gap-1">
                    {selectedVehicle.fuelType} ({selectedVehicle.currentFuelPercent}%)
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 font-bold uppercase block mb-1">Payload Capacity</span>
                  <span className="text-slate-900 font-bold text-sm">{selectedVehicle.maxPayloadKg.toLocaleString()} kg</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 font-bold uppercase block mb-1">Odometer Mileage</span>
                  <span className="text-slate-900 font-bold text-sm">{selectedVehicle.currentMileageKm.toLocaleString()} km</span>
                </div>
              </div>

              {/* Assigned Driver Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="text-slate-400 font-bold uppercase block">Current Assigned Driver</span>
                {selectedVehicle.assignedDriver ? (
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-slate-900 font-bold">
                        {selectedVehicle.assignedDriver.firstName} {selectedVehicle.assignedDriver.lastName}
                      </p>
                      <p className="text-slate-500 text-[11px]">{selectedVehicle.assignedDriver.code} &bull; {selectedVehicle.assignedDriver.phone}</p>
                    </div>
                    <StatusBadge status={selectedVehicle.assignedDriver.status} type="driver" />
                  </div>
                ) : (
                  <p className="text-slate-400 italic pt-1">Vehicle currently unassigned in depot pool</p>
                )}
              </div>

              {/* Maintenance History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-bold text-slate-900 uppercase flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-orange-500" />
                    <span>Maintenance History Log ({selectedVehicle.maintenanceLogs?.length || 0})</span>
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {!selectedVehicle.maintenanceLogs || selectedVehicle.maintenanceLogs.length === 0 ? (
                    <p className="text-slate-400 py-4 text-center">No maintenance records logged</p>
                  ) : (
                    selectedVehicle.maintenanceLogs.map((log: MaintenanceLog) => (
                      <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{log.serviceType.replace(/_/g, ' ')}</span>
                          <span className="text-emerald-700 font-bold">₹{log.cost.toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{log.description}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                          <span>{new Date(log.serviceDate).toLocaleDateString()}</span>
                          <span>Odo: {log.odometerKm} km</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Maintenance Modal */}
      <Modal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        title="LOG VEHICLE SERVICE / REPAIR"
        subtitle={`Asset: ${selectedVehicle?.code || ''}`}
        maxWidth="md"
      >
        <form onSubmit={handleAddMaintenance} className="space-y-4 font-mono text-xs">
          <div>
            <label className="text-slate-700 font-bold block mb-1">Service Type</label>
            <select
              value={newLog.serviceType}
              onChange={(e) => setNewLog({ ...newLog, serviceType: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
            >
              <option value="OIL_CHANGE">Oil & Filter Service</option>
              <option value="BRAKE_INSPECTION">Brake Overhaul & Fluid</option>
              <option value="TIRE_ROTATION">Tire Rotation & Alignment</option>
              <option value="ANNUAL_INSPECTION">Annual RTO Fitness & Inspection</option>
              <option value="ENGINE_OVERHAUL">Engine / Transmission Repair</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1">Work Description & Parts Replaced</label>
            <textarea
              required
              rows={3}
              value={newLog.description}
              onChange={(e) => setNewLog({ ...newLog, description: e.target.value })}
              placeholder="Replaced front brake liners, topped up transmission fluid..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Cost (₹ INR)</label>
              <input
                type="number"
                value={newLog.cost}
                onChange={(e) => setNewLog({ ...newLog, cost: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Odometer (km)</label>
              <input
                type="number"
                value={newLog.odometerKm}
                onChange={(e) => setNewLog({ ...newLog, odometerKm: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsMaintenanceModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-sm"
            >
              Save Service Log
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
