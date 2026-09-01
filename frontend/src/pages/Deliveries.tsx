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
} from 'lucide-react';
import { deliveriesApi, driversApi, vehiclesApi } from '../api/client';
import { Delivery, Driver, Vehicle } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataTable, Column } from '../components/common/DataTable';

export const Deliveries: React.FC = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [driverFilter, setDriverFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');

  const fetchData = async () => {
    try {
      setIsLoading(true);
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
    } catch (err) {
      console.error('Failed to fetch deliveries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter, driverFilter, vehicleFilter]);

  const columns: Column<Delivery>[] = [
    {
      header: 'Tracking #',
      accessor: 'trackingNumber',
      sortable: true,
      render: (d) => (
        <div className="font-mono">
          <span className="font-bold text-orange-600 tracking-wider hover:underline">{d.trackingNumber}</span>
          <div className="text-[10px] text-slate-400">{d.order?.orderNumber}</div>
        </div>
      ),
    },
    {
      header: 'Customer & Drop-off',
      accessor: 'orderId',
      render: (d) => (
        <div>
          <div className="font-bold text-slate-900">{d.order?.customerName}</div>
          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 truncate max-w-xs">
            <MapPin className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
            <span className="truncate">{d.order?.deliveryAddress}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Driver & Vehicle',
      render: (d) => (
        <div className="font-mono text-xs">
          <div className="text-slate-800 font-semibold">
            {d.driver ? `${d.driver.firstName} ${d.driver.lastName}` : 'Unassigned'}
          </div>
          <div className="text-[10px] text-slate-500">
            {d.vehicle ? `${d.vehicle.code} (${d.vehicle.licensePlate})` : 'No vehicle'}
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
      header: 'Progress',
      accessor: 'progressPercent',
      sortable: true,
      render: (d) => (
        <div className="w-32 space-y-1 font-mono text-xs">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-500">{d.routeDistanceKm} km</span>
            <span className="text-orange-600 font-bold">{d.progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${d.progressPercent}%` }}
            ></div>
          </div>
        </div>
      ),
    },
    {
      header: 'ETA / Schedule',
      accessor: 'deliveryEstimatedAt',
      sortable: true,
      render: (d) => (
        <div className="font-mono text-xs">
          <div className="text-slate-800 font-semibold">
            {d.deliveryEstimatedAt ? new Date(d.deliveryEstimatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
          </div>
          <div className="text-[10px] text-slate-400">
            {d.deliveryEstimatedAt ? new Date(d.deliveryEstimatedAt).toLocaleDateString() : 'Pending'}
          </div>
        </div>
      ),
    },
    {
      header: 'Action',
      render: (d) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/deliveries/${d.id}`);
          }}
          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-mono font-bold flex items-center gap-1 transition-colors"
        >
          <span>Telemetry</span>
          <ArrowRight className="w-3 h-3" />
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
            Deliveries
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active shipments, route progress, and proof of delivery
          </p>
        </div>

        <button
          onClick={() => navigate('/orders')}
          className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Dispatch order</span>
        </button>
      </div>

      {/* Table */}
      <DataTable
        data={deliveries}
        columns={columns}
        keyExtractor={(d) => d.id}
        searchPlaceholder="Search Tracking #, Customer, Address, Driver..."
        searchFilter={(d, q) =>
          d.trackingNumber.toLowerCase().includes(q.toLowerCase()) ||
          (d.order?.customerName || '').toLowerCase().includes(q.toLowerCase()) ||
          (d.order?.deliveryAddress || '').toLowerCase().includes(q.toLowerCase()) ||
          (d.driver ? `${d.driver.firstName} ${d.driver.lastName}` : '').toLowerCase().includes(q.toLowerCase()) ||
          (d.vehicle?.code || '').toLowerCase().includes(q.toLowerCase())
        }
        filtersSlot={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-mono focus:outline-none focus:border-orange-500 shadow-sm"
            >
              <option value="ALL">Status: All</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="PICKED_UP">PICKED UP</option>
              <option value="IN_TRANSIT">IN TRANSIT</option>
              <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="DELAYED">DELAYED</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-mono focus:outline-none focus:border-orange-500 shadow-sm"
            >
              <option value="ALL">Priority: All</option>
              <option value="URGENT">URGENT</option>
              <option value="HIGH">HIGH</option>
              <option value="STANDARD">STANDARD</option>
            </select>

            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-mono focus:outline-none focus:border-orange-500 shadow-sm"
            >
              <option value="ALL">Driver: All</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.firstName} {d.lastName}
                </option>
              ))}
            </select>
          </div>
        }
        isLoading={isLoading}
        onRowClick={(d) => navigate(`/deliveries/${d.id}`)}
      />
    </div>
  );
};
