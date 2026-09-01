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
} from 'lucide-react';
import { deliveriesApi, driversApi, vehiclesApi } from '../services/api';
import { Delivery, Driver, Vehicle } from '../../shared/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataTable, Column } from '../components/common/DataTable';
import { useToast } from '../context/ToastContext';

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

  const columns: Column<Delivery>[] = [
    {
      header: 'Tracking #',
      accessor: 'trackingNumber',
      sortable: true,
      render: (d) => (
        <div>
          <span className="font-mono font-bold text-slate-900 hover:text-orange-600 transition-colors">
            {d.trackingNumber}
          </span>
          <div className="text-[11px] text-slate-500 font-mono">{d.order?.orderNumber}</div>
        </div>
      ),
    },
    {
      header: 'Customer & Destination',
      accessor: 'orderId',
      render: (d) => (
        <div className="max-w-xs">
          <div className="font-semibold text-slate-900 truncate">{d.order?.customerName}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate mt-0.5">
            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">{d.order?.deliveryAddress}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Driver & Vehicle',
      render: (d) => (
        <div className="text-xs">
          <div className="text-slate-900 font-medium">
            {d.driver ? `${d.driver.firstName} ${d.driver.lastName}` : <span className="text-slate-400">Unassigned</span>}
          </div>
          <div className="text-[11px] text-slate-500">
            {d.vehicle ? `${d.vehicle.code} (${d.vehicle.licensePlate})` : 'No vehicle'}
          </div>
        </div>
      ),
    },
    {
      header: 'Progress',
      accessor: 'progressPercent',
      sortable: true,
      render: (d) => (
        <div className="w-28 space-y-1">
          <div className="flex justify-between text-[11px] font-medium text-slate-600">
            <span>{d.status === 'DELIVERED' ? 'Complete' : `${d.progressPercent}%`}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                d.status === 'DELIVERED'
                  ? 'bg-emerald-600'
                  : d.status === 'DELAYED'
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${d.progressPercent}%` }}
            ></div>
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
      header: 'Priority',
      render: (d) => <StatusBadge status={d.order?.priority || 'MEDIUM'} type="priority" />,
    },
    {
      header: '',
      className: 'text-right',
      render: (d) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/deliveries/${d.id}`);
          }}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
          title="Open delivery details"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
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
              Delivery Manifests & Trips
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
              {deliveries.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end shipment lifecycle tracking, assigned vehicles, drivers, and digital proof of delivery
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
            onClick={() => navigate('/orders')}
            className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Dispatch Shipment</span>
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
          <option value="ALL">All Statuses</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="PICKED_UP">Picked Up</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="DELAYED">Delayed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
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
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
        >
          <option value="ALL">All Drivers</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.firstName} {d.lastName} ({d.driverCode})
            </option>
          ))}
        </select>

        <select
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
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
            className="text-xs text-orange-600 hover:text-orange-700 font-medium px-2 py-1"
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
        searchPlaceholder="Search by tracking number, customer, driver..."
        searchFilter={(d, q) => {
          const matchTrack = d.trackingNumber.toLowerCase().includes(q.toLowerCase());
          const matchCust = d.order?.customerName.toLowerCase().includes(q.toLowerCase()) || false;
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
