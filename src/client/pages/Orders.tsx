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

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await ordersApi.create(newOrder as any);
      success('Order Registered', `Created freight order #${created.orderNumber}.`);
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

  const handleOpenDispatch = (order: Order) => {
    setSelectedOrder(order);
    const availDriver = drivers.find((d) => d.status === 'AVAILABLE');
    const availVehicle = vehicles.find((v) => v.status === 'ACTIVE' && v.maxPayloadKg >= order.weightKg);

    setDispatchData({
      driverId: availDriver ? availDriver.id : '',
      vehicleId: availVehicle ? availVehicle.id : '',
      priority: order.priority || 'STANDARD',
      pickupScheduledAt: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16),
      deliveryEstimatedAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 16),
      notes: `Dispatched order #${order.orderNumber}`,
    });
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

      success('Shipment Dispatched', `Tracking #${dispatched.trackingNumber} is now active.`);
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
      header: 'Order Number',
      accessor: 'orderNumber',
      sortable: true,
      render: (o) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{o.orderNumber}</span>
          <div className="text-[11px] text-slate-500 font-mono">
            {new Date(o.createdAt).toLocaleDateString('en-IN')}
          </div>
        </div>
      ),
    },
    {
      header: 'Customer & Contact',
      accessor: 'customerName',
      render: (o) => (
        <div className="max-w-xs">
          <div className="font-semibold text-slate-900 truncate">{o.customerName}</div>
          <div className="text-[11px] text-slate-500 truncate">{o.customerPhone}</div>
        </div>
      ),
    },
    {
      header: 'Destination',
      accessor: 'deliveryAddress',
      render: (o) => (
        <div className="text-[11px] text-slate-600 flex items-center gap-1 truncate max-w-xs">
          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="truncate">{o.deliveryAddress}</span>
        </div>
      ),
    },
    {
      header: 'Manifest Specs',
      render: (o) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">{o.weightKg.toLocaleString()} kg</div>
          <div className="text-[11px] text-slate-500">{o.volumeM3} m³ &bull; {o.cargoType}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (o) => <StatusBadge status={o.status} type="order" />,
    },
    {
      header: 'Priority',
      render: (o) => <StatusBadge status={o.priority} type="priority" />,
    },
    {
      header: 'Action',
      className: 'text-right',
      render: (o) => (
        <div>
          {o.status === 'PENDING' ? (
            <button
              onClick={() => handleOpenDispatch(o)}
              className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-orange-400" />
              <span>Dispatch</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">Assigned</span>
          )}
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
              Freight Orders & Booking
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
              {orders.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Customer shipping manifests, weight volume verification, and rapid fleet dispatch
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchData(true)}
            className="p-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 shadow-2xs transition-colors"
            title="Refresh orders"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Order</span>
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
          <option value="PENDING">Pending (Ready for dispatch)</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
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
          value={cargoFilter}
          onChange={(e) => setCargoFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
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
            className="text-xs text-orange-600 hover:text-orange-700 font-medium px-2 py-1"
          >
            Reset Filters
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
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Customer Name / Entity <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newOrder.customerName}
                onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                placeholder="e.g., Tata Motors Ltd."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newOrder.customerPhone}
                onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                placeholder="e.g., +91 98200 12345"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Pickup Address / Facility</label>
              <input
                type="text"
                required
                value={newOrder.pickupAddress}
                onChange={(e) => setNewOrder({ ...newOrder, pickupAddress: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Destination Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newOrder.deliveryAddress}
                onChange={(e) => setNewOrder({ ...newOrder, deliveryAddress: e.target.value })}
                placeholder="e.g., Sanand Industrial Park, Ahmedabad, Gujarat 382110"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Cargo Weight (kg)</label>
              <input
                type="number"
                required
                min="10"
                max="50000"
                value={newOrder.weightKg}
                onChange={(e) => setNewOrder({ ...newOrder, weightKg: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Volume (m³)</label>
              <input
                type="number"
                step="0.1"
                required
                value={newOrder.volumeM3}
                onChange={(e) => setNewOrder({ ...newOrder, volumeM3: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Cargo Classification</label>
              <select
                value={newOrder.cargoType}
                onChange={(e) => setNewOrder({ ...newOrder, cargoType: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
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
              <label className="block text-slate-700 font-medium mb-1">Priority Level</label>
              <select
                value={newOrder.priority}
                onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
              >
                <option value="STANDARD">Standard</option>
                <option value="HIGH">High Priority</option>
                <option value="CRITICAL">Critical Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Delivery Fee (₹ INR)</label>
              <input
                type="number"
                required
                value={newOrder.deliveryFee}
                onChange={(e) => setNewOrder({ ...newOrder, deliveryFee: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-md font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold shadow-2xs"
            >
              Confirm Order Registration
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
          <form onSubmit={handleDispatchOrder} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="flex justify-between font-semibold text-slate-900">
                <span>{selectedOrder.customerName}</span>
                <span>{selectedOrder.weightKg.toLocaleString()} kg</span>
              </div>
              <p className="text-slate-500 text-[11px] truncate">{selectedOrder.deliveryAddress}</p>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Assign Commercial Driver <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={dispatchData.driverId}
                onChange={(e) => setDispatchData({ ...dispatchData, driverId: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
              >
                <option value="">-- Select Driver --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName} ({d.driverCode}) &bull; [{d.status}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Assign Vehicle Asset <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={dispatchData.vehicleId}
                onChange={(e) => setDispatchData({ ...dispatchData, vehicleId: e.target.value })}
                className={`w-full px-3 py-2 bg-white border rounded-md text-xs ${
                  isOverweight ? 'border-rose-400 bg-rose-50/20 text-rose-800' : 'border-slate-300'
                }`}
              >
                <option value="">-- Select Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.code} - {v.model} (Max: {v.maxPayloadKg.toLocaleString()} kg) &bull; [{v.status}]
                  </option>
                ))}
              </select>

              {isOverweight && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Warning: Order weight ({selectedOrder.weightKg} kg) exceeds vehicle payload limit ({selectedVehicleObj?.maxPayloadKg} kg).
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Scheduled Pickup</label>
                <input
                  type="datetime-local"
                  value={dispatchData.pickupScheduledAt}
                  onChange={(e) => setDispatchData({ ...dispatchData, pickupScheduledAt: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Estimated Delivery</label>
                <input
                  type="datetime-local"
                  value={dispatchData.deliveryEstimatedAt}
                  onChange={(e) => setDispatchData({ ...dispatchData, deliveryEstimatedAt: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-md font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={Boolean(isOverweight)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold shadow-2xs disabled:opacity-40"
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
