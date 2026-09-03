import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Navigation,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Filter,
  RotateCw,
  Plus,
  Truck,
} from 'lucide-react';
import { deliveriesApi, driversApi, vehiclesApi } from '../services/api';
import { Delivery, Driver, Vehicle } from '../../shared/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataTable, Column } from '../components/common/DataTable';
import { useToast } from '../context/ToastContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

export const Deliveries: React.FC = () => {
  const navigate = useNavigate();
  const { error } = useToast();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [driverFilter, setDriverFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const [delData, drvData, vehData] = await Promise.all([
        deliveriesApi.getAll({
          status: statusFilter,
          priority: priorityFilter,
          driverId: driverFilter,
          vehicleId: vehicleFilter,
        }),
        driversApi.getAll(),
        vehiclesApi.getAll(),
      ]);
      setDeliveries(delData);
      setDrivers(drvData);
      setVehicles(vehData);
    } catch (err: any) {
      console.error('Failed to fetch deliveries:', err);
      error('Error loading deliveries', err.response?.data?.error || 'Could not fetch delivery manifests.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, [statusFilter, priorityFilter, driverFilter, vehicleFilter]);

  useAutoRefresh(fetchData, { intervalMs: 15000 });

  const columns: Column<Delivery>[] = [
    {
      header: 'Tracking ID',
      accessor: 'trackingNumber',
      sortable: true,
      render: (d) => (
        <div>
          <span className="font-mono font-bold text-emerald-600 hover:text-emerald-700 transition">
            #{d.trackingNumber}
          </span>
          <div className="text-xs text-slate-500 font-mono mt-0.5">Order: {d.order?.orderNumber || 'ORD-9021'}</div>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: 'orderId',
      render: (d) => (
        <div className="max-w-xs">
          <div className="font-bold text-slate-900 truncate">{d.order?.customerName || d.customerName}</div>
          <div className="text-xs text-slate-500 truncate">{d.order?.customerPhone || d.customerPhone}</div>
        </div>
      ),
    },
    {
      header: 'Route',
      render: (d) => (
        <div className="max-w-xs text-xs">
          <div className="text-slate-900 font-medium truncate flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="truncate">{d.order?.pickupAddress || d.pickupAddress}</span>
          </div>
          <div className="text-slate-500 truncate flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">{d.order?.deliveryAddress || d.deliveryAddress}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (d) => <StatusBadge status={d.status} type="delivery" />,
    },
    {
      header: 'Driver',
      render: (d) => (
        <div className="text-xs">
          <div className="text-slate-900 font-medium">
            {d.driver ? `${d.driver.firstName} ${d.driver.lastName}` : <span className="text-slate-400">Unassigned</span>}
          </div>
        </div>
      ),
    },
    {
      header: 'Vehicle',
      render: (d) => (
        <div className="text-xs">
          <div className="text-slate-900 font-medium">
            {d.vehicle ? `${d.vehicle.code}` : <span className="text-slate-400">Unassigned</span>}
          </div>
          <div className="text-xs text-slate-500 font-mono">{d.vehicle?.licensePlate || ''}</div>
        </div>
      ),
    },
    {
      header: 'ETA',
      render: (d) => (
        <div className="text-xs font-mono text-slate-700">
          {d.estimatedDeliveryTime
            ? new Date(d.estimatedDeliveryTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : 'Pending'}
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (d) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/deliveries/${d.id}`);
          }}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition"
          title="Open delivery details"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
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
              Deliveries
            </h1>
            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
              {deliveries.length} Shipments
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage and monitor shipments, driver assignments, vehicle allocation, and delivery status history
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchData(true)}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition shadow-sm"
            title="Refresh list"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Delivery</span>
          </button>
        </div>
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
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="PICKED_UP">Picked Up</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={driverFilter}
          onChange={(e) => setDriverFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Drivers</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.firstName} {d.lastName} ({d.driverCode || d.code})
            </option>
          ))}
        </select>

        <select
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Vehicles</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.code} - {v.licensePlate}
            </option>
          ))}
        </select>

        {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || driverFilter !== 'ALL' || vehicleFilter !== 'ALL') && (
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setPriorityFilter('ALL');
              setDriverFilter('ALL');
              setVehicleFilter('ALL');
            }}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold px-2 py-1"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Table */}
      <DataTable
        data={deliveries}
        columns={columns}
        keyExtractor={(d) => d.id}
        searchPlaceholder="Search tracking number, customer, driver..."
        searchFilter={(d, q) => {
          const matchTrack = d.trackingNumber.toLowerCase().includes(q.toLowerCase());
          const matchCust = (d.order?.customerName || d.customerName || '').toLowerCase().includes(q.toLowerCase());
          const matchDriver = d.driver ? `${d.driver.firstName} ${d.driver.lastName}`.toLowerCase().includes(q.toLowerCase()) : false;
          return matchTrack || matchCust || matchDriver;
        }}
        isLoading={isLoading}
        pageSize={12}
        onRowClick={(d) => navigate(`/deliveries/${d.id}`)}
      />
    </div>
  );
};
