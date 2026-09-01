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
  X,
  Trash2,
} from 'lucide-react';
import { driversApi, vehiclesApi } from '../api/client';
import { Driver, Vehicle } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';

export const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [licenseFilter, setLicenseFilter] = useState('ALL');

  // Modals
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [dData, vData] = await Promise.all([
        driversApi.getAll({
          status: statusFilter,
          licenseClass: licenseFilter,
        }),
        vehiclesApi.getAll(),
      ]);
      setDrivers(dData);
      setVehicles(vData);
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, licenseFilter]);

  const handleToggleStatus = async (driverId: string, newStatus: string) => {
    try {
      await driversApi.toggleStatus(driverId, newStatus);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await driversApi.create(newDriver as any);
      setIsAddModalOpen(false);
      fetchData();
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
      alert(err.response?.data?.error || 'Failed to create driver');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove driver ${name}?`)) return;
    try {
      await driversApi.delete(id);
      if (selectedDriver?.id === id) {
        setIsDetailsOpen(false);
        setSelectedDriver(null);
      }
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete driver');
    }
  };

  const openDetails = (d: Driver) => {
    setSelectedDriver(d);
    setIsDetailsOpen(true);
  };

  const columns: Column<Driver>[] = [
    {
      header: 'Driver Code',
      accessor: 'code',
      sortable: true,
      render: (d) => (
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-mono font-bold text-slate-900">{d.code}</span>
        </div>
      ),
    },
    {
      header: 'Driver Name',
      accessor: 'lastName',
      sortable: true,
      render: (d) => (
        <div>
          <span className="text-slate-900 font-bold block">{d.firstName} {d.lastName}</span>
          <span className="text-[10px] text-slate-500">{d.email}</span>
        </div>
      ),
    },
    {
      header: 'Contact Phone',
      accessor: 'phone',
      render: (d) => (
        <span className="font-mono text-xs text-slate-700">{d.phone}</span>
      ),
    },
    {
      header: 'License Number',
      accessor: 'licenseNumber',
      render: (d) => (
        <div>
          <span className="font-mono text-xs text-slate-800 font-semibold block">{d.licenseNumber}</span>
          <span className="text-[10px] text-slate-400 font-mono">Exp: {new Date(d.licenseExpiry).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      header: 'Current Status',
      accessor: 'status',
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={d.status} type="driver" />
          {/* Quick status switcher */}
          <select
            value={d.status}
            onChange={(e) => handleToggleStatus(d.id, e.target.value)}
            disabled={d.status === 'ON_DELIVERY'}
            title={d.status === 'ON_DELIVERY' ? 'Driver is actively en route' : 'Quick toggle shift availability'}
            className="p-1 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-700 focus:outline-none focus:border-orange-500 disabled:opacity-40 shadow-xs"
          >
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="OFF_DUTY">OFF DUTY</option>
            <option value="ON_LEAVE">ON LEAVE</option>
          </select>
        </div>
      ),
    },
    {
      header: 'Rating & Deliveries',
      accessor: 'rating',
      sortable: true,
      render: (d) => (
        <div className="font-mono text-xs">
          <div className="flex items-center text-orange-600 font-bold gap-1">
            <Star className="w-3.5 h-3.5 fill-orange-500" />
            <span>{d.rating.toFixed(2)}</span>
            <span className="text-slate-500 font-normal text-[11px]">({d.totalDeliveries} done)</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold">{d.onTimeRatePercent}% on-time</div>
        </div>
      ),
    },
    {
      header: 'Assigned Vehicle',
      render: (d) => (
        <div className="font-mono text-xs">
          {d.currentVehicle ? (
            <span className="text-slate-800 font-bold flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-orange-500" />
              {d.currentVehicle.code} ({d.currentVehicle.model})
            </span>
          ) : (
            <span className="text-slate-400 italic">No vehicle assigned</span>
          )}
        </div>
      ),
    },
    {
      header: 'Action',
      render: (d) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openDetails(d);
          }}
          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-mono font-bold transition-colors"
        >
          Profile
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
            Drivers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Commercial driver credentials, shift availability, and assignments
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add driver</span>
        </button>
      </div>

      {/* Drivers Data Table */}
      <DataTable
        data={drivers}
        columns={columns}
        keyExtractor={(d) => d.id}
        searchPlaceholder="Search Driver Code, Name, Email, Phone, License..."
        searchFilter={(d, q) =>
          d.code.toLowerCase().includes(q.toLowerCase()) ||
          d.firstName.toLowerCase().includes(q.toLowerCase()) ||
          d.lastName.toLowerCase().includes(q.toLowerCase()) ||
          d.email.toLowerCase().includes(q.toLowerCase()) ||
          d.phone.toLowerCase().includes(q.toLowerCase()) ||
          d.licenseNumber.toLowerCase().includes(q.toLowerCase())
        }
        filtersSlot={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-mono focus:outline-none focus:border-orange-500 shadow-sm"
            >
              <option value="ALL">Status: All</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="ON_DELIVERY">ON DELIVERY</option>
              <option value="OFF_DUTY">OFF DUTY</option>
              <option value="ON_LEAVE">ON LEAVE</option>
            </select>

            <select
              value={licenseFilter}
              onChange={(e) => setLicenseFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-mono focus:outline-none focus:border-orange-500 shadow-sm"
            >
              <option value="ALL">License: All</option>
              <option value="CDL_A">Heavy Commercial</option>
              <option value="CDL_B">Medium Commercial</option>
              <option value="STANDARD">Light Commercial</option>
            </select>
          </div>
        }
        isLoading={isLoading}
        onRowClick={openDetails}
      />

      {/* Add Driver Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="ONBOARD NEW COMMERCIAL DRIVER"
        subtitle="Register driver license credentials and assign default fleet asset"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateDriver} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Driver Code (e.g. DRV-115)</label>
              <input
                required
                type="text"
                value={newDriver.code}
                onChange={(e) => setNewDriver({ ...newDriver, code: e.target.value.toUpperCase() })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">First Name</label>
              <input
                required
                type="text"
                value={newDriver.firstName}
                onChange={(e) => setNewDriver({ ...newDriver, firstName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Last Name</label>
              <input
                required
                type="text"
                value={newDriver.lastName}
                onChange={(e) => setNewDriver({ ...newDriver, lastName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Email Address</label>
              <input
                required
                type="email"
                value={newDriver.email}
                onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value.toLowerCase() })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Phone Number</label>
              <input
                required
                type="text"
                placeholder="+91 98200 12345"
                value={newDriver.phone}
                onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Driver License Number</label>
              <input
                required
                type="text"
                placeholder="DL-MH-2022-00912"
                value={newDriver.licenseNumber}
                onChange={(e) => setNewDriver({ ...newDriver, licenseNumber: e.target.value.toUpperCase() })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">License Type</label>
              <select
                value={newDriver.licenseClass}
                onChange={(e) => setNewDriver({ ...newDriver, licenseClass: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              >
                <option value="CDL_A">Heavy Commercial Vehicle</option>
                <option value="CDL_B">Medium Commercial Vehicle</option>
                <option value="STANDARD">Light Commercial Vehicle</option>
              </select>
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">License Expiry Date</label>
              <input
                type="date"
                value={newDriver.licenseExpiry}
                onChange={(e) => setNewDriver({ ...newDriver, licenseExpiry: e.target.value })}
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
              Confirm Driver Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* Driver Profile Drawer */}
      {isDetailsOpen && selectedDriver && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white h-full border-l border-slate-200 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono text-base font-bold text-slate-900">
                    {selectedDriver.firstName} {selectedDriver.lastName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">Code: {selectedDriver.code}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDelete(selectedDriver.id, `${selectedDriver.firstName} ${selectedDriver.lastName}`)}
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

            {/* Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6 font-mono text-xs">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 font-bold uppercase">Duty Shift Status</span>
                <StatusBadge status={selectedDriver.status} type="driver" size="md" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 font-bold uppercase block mb-1">Phone Contact</span>
                  <span className="text-slate-900 font-bold">{selectedDriver.phone}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 font-bold uppercase block mb-1">License Credentials</span>
                  <span className="text-slate-900 font-bold">{selectedDriver.licenseNumber}</span>
                  <span className="text-[10px] text-slate-500 block">Class: {selectedDriver.licenseClass}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 font-bold uppercase block mb-1">Safety Rating</span>
                  <span className="text-orange-600 font-bold text-sm">★ {selectedDriver.rating.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 font-bold uppercase block mb-1">Lifetime Shipments</span>
                  <span className="text-slate-900 font-bold text-sm">{selectedDriver.totalDeliveries} Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
