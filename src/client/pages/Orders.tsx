import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Send,
  Truck,
  Users,
  MapPin,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  RotateCw,
} from 'lucide-react';
import { ordersApi, driversApi, vehiclesApi, deliveriesApi } from '../services/api';
import { Order, Driver, Vehicle } from '../../shared/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

export const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [cargoFilter, setCargoFilter] = useState('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Create Order State
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    pickupAddress: 'Bhiwandi Central Logistics Hub, Sector 18, Thane 421302',
    deliveryAddress: '',
    weightKg: 2500,
    volumeM3: 12.0,
    cargoType: 'GENERAL_FREIGHT' as any,
    priority: 'STANDARD' as any,
    deliveryFee: 14500,
    notes: '',
  });

  // Dispatch Assignment State
  const [dispatchData, setDispatchData] = useState({
    driverId: '',
    vehicleId: '',
    priority: 'STANDARD',
    pickupScheduledAt: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16),
    deliveryEstimatedAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 16),
    notes: '',
  });

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const [oData, dData, vData] = await Promise.all([
        ordersApi.getAll({
          status: statusFilter,
          priority: priorityFilter,
          cargoType: cargoFilter,
        }),
        driversApi.getAll(),
        vehiclesApi.getAll(),
      ]);
      setOrders(oData);
      setDrivers(dData);
      setVehicles(vData);
    } catch (err: any) {
      console.error('Failed to fetch orders data:', err);
      error('Error', 'Failed to load freight orders from database.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, [statusFilter, priorityFilter, cargoFilter]);

  useAutoRefresh(fetchData, { intervalMs: 15000 });

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await ordersApi.create(newOrder as any);
      success('ORDER BOOKED', `Created freight order #${created.orderNumber}.`);
      setIsCreateModalOpen(false);
      fetchData(false);
      setNewOrder({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        pickupAddress: 'Bhiwandi Central Logistics Hub, Sector 18, Thane 421302',
        deliveryAddress: '',
        weightKg: 2500,
        volumeM3: 12.0,
        cargoType: 'GENERAL_FREIGHT',
        priority: 'STANDARD',
        deliveryFee: 14500,
        notes: '',
      });
    } catch (err: any) {
      error('Registration Failed', err.response?.data?.error || 'Could not save order.');
    }
  };

  const handleOpenDispatch = async (order: Order) => {
    setSelectedOrder(order);
    try {
      const [freshDrivers, freshVehicles] = await Promise.all([
        driversApi.getAll(),
        vehiclesApi.getAll(),
      ]);
      setDrivers(freshDrivers);
      setVehicles(freshVehicles);

      const availDriver = freshDrivers.find((d) => d.status === 'AVAILABLE');
      const availVehicle = freshVehicles.find((v) => (v.status === 'ACTIVE' || v.status === 'IDLE') && v.maxPayloadKg >= order.weightKg);

      setDispatchData({
        driverId: availDriver ? availDriver.id : '',
        vehicleId: availVehicle ? availVehicle.id : '',
        priority: order.priority || 'STANDARD',
        pickupScheduledAt: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16),
        deliveryEstimatedAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 16),
        notes: `Dispatched order #${order.orderNumber}`,
      });
    } catch (err) {
      console.error('Failed to sync drivers/vehicles for dispatch:', err);
    }
    setIsDispatchModalOpen(true);
  };

  const handleDispatchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (!dispatchData.driverId) {
      warning('Driver Required', 'Please assign a commercial driver to proceed with dispatch.');
      return;
    }
    if (!dispatchData.vehicleId) {
      warning('Vehicle Required', 'Please assign a vehicle asset to proceed with dispatch.');
      return;
    }

    try {
      const dispatched = await deliveriesApi.create({
        orderId: selectedOrder.id,
        driverId: dispatchData.driverId,
        vehicleId: dispatchData.vehicleId,
        pickupScheduledAt: dispatchData.pickupScheduledAt,
        deliveryEstimatedAt: dispatchData.deliveryEstimatedAt,
        notes: dispatchData.notes,
      });

      success('SHIPMENT DISPATCHED', `Tracking #${dispatched.trackingNumber} is now live.`);
      setIsDispatchModalOpen(false);
      setSelectedOrder(null);
      fetchData(false);
      navigate(`/deliveries/${dispatched.id}`);
    } catch (err: any) {
      error('Dispatch Rejected', err.response?.data?.error || 'Failed to dispatch shipment.');
    }
  };

  const selectedVehicleObj = vehicles.find((v) => v.id === dispatchData.vehicleId);
  const isOverweight = selectedOrder && selectedVehicleObj && selectedOrder.weightKg > selectedVehicleObj.maxPayloadKg;

  const columns: Column<Order>[] = [
    {
      header: 'ORDER NUMBER',
      accessor: 'orderNumber',
      sortable: true,
      render: (o) => (
        <div>
          <span className="font-mono font-bold text-cyan-400">#{o.orderNumber}</span>
          <div className="text-[10px] text-ops-dim font-mono mt-0.5">
            {new Date(o.createdAt).toLocaleDateString('en-IN')}
          </div>
        </div>
      ),
    },
    {
      header: 'CUSTOMER & CONTACT',
      accessor: 'customerName',
      render: (o) => (
        <div className="max-w-xs">
          <div className="font-semibold text-ops-text truncate">{o.customerName}</div>
          <div className="text-[10px] text-ops-dim font-mono truncate">{o.customerPhone}</div>
        </div>
      ),
    },
    {
      header: 'DESTINATION POINT',
      accessor: 'deliveryAddress',
      render: (o) => (
        <div className="text-[11px] text-ops-text flex items-center gap-1.5 truncate max-w-xs">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{o.deliveryAddress}</span>
        </div>
      ),
    },
    {
      header: 'PAYLOAD SPECS',
      render: (o) => (
        <div className="text-xs font-mono">
          <div className="font-bold text-white">{o.weightKg.toLocaleString()} kg</div>
          <div className="text-[10px] text-ops-dim">{o.volumeM3} m³ &bull; {o.cargoType}</div>
        </div>
      ),
    },
    {
      header: 'STATUS',
      accessor: 'status',
      sortable: true,
      render: (o) => <StatusBadge status={o.status} type="order" />,
    },
    {
      header: 'PRIORITY',
      render: (o) => <StatusBadge status={o.priority} type="priority" />,
    },
    {
      header: 'ACTION',
      className: 'text-right',
      render: (o) => (
        <div>
          {o.status === 'PENDING' ? (
            <button
              onClick={() => handleOpenDispatch(o)}
              className="px-3.5 py-1 rounded-md bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-glow-cyan transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>DISPATCH</span>
            </button>
          ) : (
            <span className="text-[10px] font-mono text-ops-dim uppercase font-semibold">ASSIGNED</span>
          )}
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
              Freight Orders & Dispatch Terminal
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-ops-surface border border-ops-border text-ops-muted text-xs font-mono font-bold">
              {orders.length} REGISTERED
            </span>
          </div>
          <p className="text-xs text-ops-muted mt-1 font-sans">
            Customer shipping manifests, weight volume verification, and rapid fleet dispatch
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchData(true)}
            className="p-2 rounded-md bg-ops-surface hover:bg-ops-panel border border-ops-border text-ops-muted hover:text-ops-text transition-colors shadow-panel"
            title="Refresh orders"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-glow-cyan transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>BOOK FREIGHT</span>
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
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending (Ready for dispatch)</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-ops-bg border border-ops-border rounded-md text-xs font-mono font-medium text-ops-text focus:border-cyan-500"
        >
          <option value="ALL">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={cargoFilter}
          onChange={(e) => setCargoFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-ops-bg border border-ops-border rounded-md text-xs font-mono font-medium text-ops-text focus:border-cyan-500"
        >
          <option value="ALL">All Cargo Types</option>
          <option value="GENERAL_FREIGHT">General Freight</option>
          <option value="HAZMAT">HazMat</option>
          <option value="COLD_CHAIN">Cold Chain (Refrigerated)</option>
          <option value="FRAGILE">Fragile Electronics</option>
          <option value="BULK_LIQUID">Bulk Liquid</option>
        </select>

        {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || cargoFilter !== 'ALL') && (
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setPriorityFilter('ALL');
              setCargoFilter('ALL');
            }}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-1"
          >
            [RESET FILTERS]
          </button>
        )}
      </div>

      {/* Main Table */}
      <DataTable
        data={orders}
        columns={columns}
        keyExtractor={(o) => o.id}
        searchPlaceholder="Search by order number, customer, destination..."
        searchFilter={(o, q) => {
          const matchNum = o.orderNumber.toLowerCase().includes(q.toLowerCase());
          const matchCust = o.customerName.toLowerCase().includes(q.toLowerCase());
          const matchAddr = o.deliveryAddress.toLowerCase().includes(q.toLowerCase());
          return matchNum || matchCust || matchAddr;
        }}
        isLoading={isLoading}
        pageSize={12}
      />

      {/* Create Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register New Freight Order"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">
                Customer Name / Entity <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newOrder.customerName}
                onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                placeholder="e.g., Tata Motors Ltd."
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">
                Contact Phone <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newOrder.customerPhone}
                onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                placeholder="e.g., +91 98200 12345"
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Pickup Facility</label>
              <input
                type="text"
                required
                value={newOrder.pickupAddress}
                onChange={(e) => setNewOrder({ ...newOrder, pickupAddress: e.target.value })}
                className="w-full px-3 py-2 bg-ops-panel border border-ops-border rounded-lg text-xs text-ops-muted"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">
                Destination Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newOrder.deliveryAddress}
                onChange={(e) => setNewOrder({ ...newOrder, deliveryAddress: e.target.value })}
                placeholder="e.g., Sanand Industrial Park, Ahmedabad, Gujarat 382110"
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Cargo Weight (kg)</label>
              <input
                type="number"
                required
                min="10"
                max="50000"
                value={newOrder.weightKg}
                onChange={(e) => setNewOrder({ ...newOrder, weightKg: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Volume (m³)</label>
              <input
                type="number"
                step="0.1"
                required
                value={newOrder.volumeM3}
                onChange={(e) => setNewOrder({ ...newOrder, volumeM3: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Classification</label>
              <select
                value={newOrder.cargoType}
                onChange={(e) => setNewOrder({ ...newOrder, cargoType: e.target.value as any })}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              >
                <option value="GENERAL_FREIGHT">General Freight</option>
                <option value="HAZMAT">HazMat (Hazardous)</option>
                <option value="COLD_CHAIN">Cold Chain</option>
                <option value="FRAGILE">Fragile Electronics</option>
                <option value="BULK_LIQUID">Bulk Liquid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Priority Level</label>
              <select
                value={newOrder.priority}
                onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value as any })}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              >
                <option value="STANDARD">Standard</option>
                <option value="HIGH">High Priority</option>
                <option value="CRITICAL">Critical Emergency</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Delivery Fee (₹ INR)</label>
              <input
                type="number"
                required
                value={newOrder.deliveryFee}
                onChange={(e) => setNewOrder({ ...newOrder, deliveryFee: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3.5 py-1.5 bg-ops-panel hover:bg-ops-panelHover border border-ops-border text-ops-muted hover:text-ops-text rounded-md font-mono font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-mono font-bold rounded-md uppercase tracking-wider shadow-glow-cyan"
            >
              Confirm Registration
            </button>
          </div>
        </form>
      </Modal>

      {/* Dispatch Assignment Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isDispatchModalOpen}
          onClose={() => setIsDispatchModalOpen(false)}
          title={`Dispatch Order #${selectedOrder.orderNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleDispatchOrder} className="space-y-4 text-xs font-sans">
            <div className="p-3 bg-ops-bg border border-ops-border rounded-lg space-y-1">
              <div className="flex justify-between font-mono font-bold text-white">
                <span>{selectedOrder.customerName}</span>
                <span className="text-cyan-400">{selectedOrder.weightKg.toLocaleString()} kg</span>
              </div>
              <p className="text-ops-dim text-[11px] truncate font-sans">{selectedOrder.deliveryAddress}</p>
            </div>

            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">
                Assign Commercial Driver <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={dispatchData.driverId}
                onChange={(e) => setDispatchData({ ...dispatchData, driverId: e.target.value })}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              >
                <option value="">-- Select Driver --</option>
                {drivers.map((d) => {
                  const isAvailable = d.status === 'AVAILABLE';
                  return (
                    <option key={d.id} value={d.id} disabled={!isAvailable}>
                      {d.firstName} {d.lastName} ({d.driverCode || d.code}) &bull; {isAvailable ? '✓ Ready for Dispatch' : `(Busy: ${d.status.replace(/_/g, ' ')})`}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">
                Assign Vehicle Asset <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={dispatchData.vehicleId}
                onChange={(e) => setDispatchData({ ...dispatchData, vehicleId: e.target.value })}
                className={`w-full px-3 py-2 bg-ops-bg border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500 ${
                  isOverweight ? 'border-rose-500 bg-rose-950/20 text-rose-300' : 'border-ops-border'
                }`}
              >
                <option value="">-- Select Vehicle --</option>
                {vehicles.map((v) => {
                  const isReady = (v.status === 'ACTIVE' || v.status === 'IDLE');
                  return (
                    <option key={v.id} value={v.id} disabled={!isReady}>
                      {v.code} &bull; {v.model} (Max: {v.maxPayloadKg.toLocaleString()} kg) &bull; {isReady ? '✓ Ready' : `(${v.status.replace(/_/g, ' ')})`}
                    </option>
                  );
                })}
              </select>

              {isOverweight && (
                <p className="text-[11px] text-rose-400 mt-1 font-mono flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  WARNING: Order weight ({selectedOrder.weightKg} kg) exceeds vehicle payload limit ({selectedVehicleObj?.maxPayloadKg} kg).
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div>
                <label className="block text-[11px] font-bold text-ops-dim uppercase mb-1">Scheduled Pickup</label>
                <input
                  type="datetime-local"
                  value={dispatchData.pickupScheduledAt}
                  onChange={(e) => setDispatchData({ ...dispatchData, pickupScheduledAt: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-ops-dim uppercase mb-1">Estimated Delivery</label>
                <input
                  type="datetime-local"
                  value={dispatchData.deliveryEstimatedAt}
                  onChange={(e) => setDispatchData({ ...dispatchData, deliveryEstimatedAt: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(false)}
                className="px-3.5 py-1.5 bg-ops-panel hover:bg-ops-panelHover border border-ops-border text-ops-muted hover:text-ops-text rounded-md font-mono font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={Boolean(isOverweight)}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-mono font-bold rounded-md uppercase tracking-wider shadow-glow-cyan disabled:opacity-40"
              >
                Confirm Dispatch
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
