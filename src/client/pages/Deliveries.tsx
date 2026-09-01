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
      header: 'TRACKING # / ORDER',
      accessor: 'trackingNumber',
      sortable: true,
      render: (d) => (
        <div>
          <span className="font-mono font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
            #{d.trackingNumber}
          </span>
          <div className="text-[10px] text-ops-dim font-mono mt-0.5">ORD: {d.order?.orderNumber}</div>
        </div>
      ),
    },
    {
      header: 'CUSTOMER & DESTINATION',
      accessor: 'orderId',
      render: (d) => (
        <div className="max-w-xs">
          <div className="font-semibold text-ops-text truncate">{d.order?.customerName}</div>
          <div className="text-[11px] text-ops-dim flex items-center gap-1 truncate mt-0.5">
            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{d.order?.deliveryAddress}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'ASSIGNED CREW & ASSET',
      render: (d) => (
        <div className="text-xs font-mono">
          <div className="text-ops-text font-medium">
            {d.driver ? `${d.driver.firstName} ${d.driver.lastName}` : <span className="text-ops-dim">Unassigned</span>}
          </div>
          <div className="text-[10px] text-ops-dim">
            {d.vehicle ? `${d.vehicle.code} (${d.vehicle.licensePlate})` : 'No asset linked'}
          </div>
        </div>
      ),
    },
    {
      header: 'ROUTE PROGRESS',
      accessor: 'progressPercent',
      sortable: true,
      render: (d) => (
        <div className="w-28 space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-ops-dim">
            <span>{d.status === 'DELIVERED' ? '100% COMPLETE' : `${d.progressPercent}%`}</span>
          </div>
          <div className="w-full bg-ops-bg h-1.5 rounded-full overflow-hidden border border-ops-border">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                d.status === 'DELIVERED'
                  ? 'bg-emerald-500 shadow-glow-emerald'
                  : d.status === 'DELAYED'
                  ? 'bg-amber-500 shadow-glow-amber'
                  : 'bg-cyan-500 shadow-glow-cyan'
              }`}
              style={{ width: `${d.progressPercent}%` }}
            ></div>
          </div>
        </div>
      ),
    },
    {
      header: 'STATUS',
      accessor: 'status',
      sortable: true,
      render: (d) => <StatusBadge status={d.status} type="delivery" />,
    },
    {
      header: 'PRIORITY',
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
          className="p-1.5 rounded-md hover:bg-ops-panel text-ops-dim hover:text-cyan-400 border border-transparent hover:border-ops-border transition-colors"
          title="Open delivery details"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
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
              Shipment Manifests & Trips
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-ops-surface border border-ops-border text-ops-muted text-xs font-mono font-bold">
              {deliveries.length} RECORDED
            </span>
          </div>
          <p className="text-xs text-ops-muted mt-1 font-sans">
            End-to-end shipment lifecycle tracking, assigned vehicles, drivers, and digital proof of delivery
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
            onClick={() => navigate('/orders')}
            className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-glow-cyan transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>DISPATCH SHIPMENT</span>
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
          className="px-2.5 py-1.5 bg-ops-bg border border-ops-border rounded-md text-xs font-mono font-medium text-ops-text focus:outline-hidden focus:border-cyan-500"
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
          className="px-2.5 py-1.5 bg-ops-bg border border-ops-border rounded-md text-xs font-mono font-medium text-ops-text focus:outline-hidden focus:border-cyan-500"
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
          className="px-2.5 py-1.5 bg-ops-bg border border-ops-border rounded-md text-xs font-mono font-medium text-ops-text focus:outline-hidden focus:border-cyan-500"
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
          className="px-2.5 py-1.5 bg-ops-bg border border-ops-border rounded-md text-xs font-mono font-medium text-ops-text focus:outline-hidden focus:border-cyan-500"
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
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-1"
          >
            [RESET FILTERS]
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
