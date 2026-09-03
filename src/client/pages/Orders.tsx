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
      const payload = {
        ...newOrder,
        customerAddress: newOrder.customerAddress || newOrder.deliveryAddress || 'Customer Primary Address',
      };
      const created = await ordersApi.create(payload as any);
      success('Freight Order Manifest Booked', `Order #${created.orderNumber} registered in database.`);
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
      error('Booking Failed', err.response?.data?.error || 'Failed to create order.');
    }
  };

  const openDispatchModal = (order: Order) => {
    setSelectedOrder(order);
    const availableDriver = drivers.find((d) => d.status === 'AVAILABLE');
    const availableVehicle = vehicles.find((v) => v.status === 'AVAILABLE' || v.status === 'ACTIVE');

    setDispatchData({
      driverId: availableDriver ? availableDriver.id : '',
      vehicleId: availableVehicle ? availableVehicle.id : '',
      priority: order.priority || 'STANDARD',
      pickupScheduledAt: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16),
      deliveryEstimatedAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 16),
      notes: '',
    });
    setIsDispatchModalOpen(true);
  };

  const handleDispatchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !dispatchData.driverId || !dispatchData.vehicleId) {
      warning('Assignment Required', 'Please select both an available driver and a vehicle asset.');
      return;
    }

    try {
      const delivery = await deliveriesApi.create({
        orderId: selectedOrder.id,
        driverId: dispatchData.driverId,
        vehicleId: dispatchData.vehicleId,
        priority: dispatchData.priority as any,
        notes: dispatchData.notes,
        estimatedDeliveryTime: dispatchData.deliveryEstimatedAt,
      });

      success('Shipment Dispatched!', `Tracking #${delivery.trackingNumber} dispatched with driver & vehicle.`);
      setIsDispatchModalOpen(false);
      fetchData(false);
      navigate(`/deliveries/${delivery.id}`);
    } catch (err: any) {
      error('Dispatch Rejected', err.response?.data?.error || 'Failed to dispatch shipment.');
    }
  };

  const availableDrivers = drivers.filter((d) => d.status === 'AVAILABLE');
  const availableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE' || v.status === 'ACTIVE');

  const columns: Column<Order>[] = [
    {
      header: 'Order #',
      accessor: 'orderNumber',
      sortable: true,
      render: (o) => (
        <div>
          <span className="font-mono font-bold text-[#10B981] block">#{o.orderNumber}</span>
          <span className="text-[11px] text-slate-500 font-mono">{new Date(o.createdAt).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      header: 'Customer Details',
      accessor: 'customerName',
      sortable: true,
      render: (o) => (
        <div>
          <span className="font-bold text-slate-900 block">{o.customerName}</span>
          <span className="text-xs text-slate-500 font-mono">{o.customerPhone}</span>
        </div>
      ),
    },
    {
      header: 'Destination',
      accessor: 'deliveryAddress',
      render: (o) => (
        <div className="max-w-xs text-xs truncate">
          <span className="text-slate-900 font-medium truncate flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{o.deliveryAddress}</span>
          </span>
        </div>
      ),
    },
    {
      header: 'Cargo Spec',
      render: (o) => (
        <div className="text-xs font-mono">
          <span className="font-bold text-slate-800 block">{o.weightKg.toLocaleString()} kg</span>
          <span className="text-[10px] text-slate-500">{o.cargoType.replace(/_/g, ' ')}</span>
        </div>
      ),
    },
    {
      header: 'Fee (₹)',
      accessor: 'deliveryFee',
      sortable: true,
      render: (o) => (
        <span className="font-mono font-bold text-slate-900 text-xs">₹{(o.deliveryFee || 0).toLocaleString()}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (o) => <StatusBadge status={o.status} type="order" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (o) => (
        <div>
          {o.status === 'PENDING' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openDispatchModal(o);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400 font-medium">Assigned</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Orders & Freight Booking
            </h1>
            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
              {orders.length} Manifests
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Book customer freight orders, assign active drivers & vehicles, and dispatch deliveries
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchData(true)}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition shadow-sm"
            title="Refresh orders list"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Book Freight Order</span>
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
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending (Unassigned)</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="DELIVERED">Delivered</option>
        </select>
      </div>

      {/* Main Table */}
      <DataTable
        data={orders}
        columns={columns}
        keyExtractor={(o) => o.id}
        searchPlaceholder="Search order #, customer, address..."
        searchFilter={(o, q) => {
          const matchNum = o.orderNumber.toLowerCase().includes(q.toLowerCase());
          const matchCust = o.customerName.toLowerCase().includes(q.toLowerCase());
          const matchAddr = o.deliveryAddress.toLowerCase().includes(q.toLowerCase());
          return matchNum || matchCust || matchAddr;
        }}
        isLoading={isLoading}
        pageSize={10}
      />

      {/* Create Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Book Customer Freight Order Manifest"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
            <input
              type="text"
              required
              value={newOrder.customerName}
              onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
              placeholder="Tata Steel Infrastructure"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Customer Phone *</label>
              <input
                type="text"
                required
                value={newOrder.customerPhone}
                onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                placeholder="+91-98200-11299"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Customer Email *</label>
              <input
                type="email"
                required
                value={newOrder.customerEmail}
                onChange={(e) => setNewOrder({ ...newOrder, customerEmail: e.target.value })}
                placeholder="logistics@tatasteel.com"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Pickup Address *</label>
            <input
              type="text"
              required
              value={newOrder.pickupAddress}
              onChange={(e) => setNewOrder({ ...newOrder, pickupAddress: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Destination Delivery Address *</label>
            <input
              type="text"
              required
              value={newOrder.deliveryAddress}
              onChange={(e) => setNewOrder({ ...newOrder, deliveryAddress: e.target.value })}
              placeholder="Plot 42, Chakan Industrial Area, Pune 410501"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cargo Weight (kg)</label>
              <input
                type="number"
                value={newOrder.weightKg}
                onChange={(e) => setNewOrder({ ...newOrder, weightKg: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Freight Fee (₹)</label>
              <input
                type="number"
                value={newOrder.deliveryFee}
                onChange={(e) => setNewOrder({ ...newOrder, deliveryFee: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
            >
              Book Order Manifest
            </button>
          </div>
        </form>
      </Modal>

      {/* Dispatch Modal */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title={selectedOrder ? `Dispatch Shipment for Order #${selectedOrder.orderNumber}` : 'Dispatch Shipment'}
      >
        <form onSubmit={handleDispatchOrder} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Assign Available Driver *</label>
            <select
              required
              value={dispatchData.driverId}
              onChange={(e) => setDispatchData({ ...dispatchData, driverId: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold"
            >
              <option value="">-- Select Commercial Driver --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id} disabled={d.status !== 'AVAILABLE'}>
                  {d.firstName} {d.lastName} ({d.driverCode || d.code}) - [{d.status}]
                </option>
              ))}
            </select>
            {availableDrivers.length === 0 && (
              <p className="text-[11px] text-rose-600 mt-1">Warning: All drivers currently on duty or off-shift.</p>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Assign Fleet Vehicle *</label>
            <select
              required
              value={dispatchData.vehicleId}
              onChange={(e) => setDispatchData({ ...dispatchData, vehicleId: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold"
            >
              <option value="">-- Select Commercial Asset --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} disabled={v.status === 'MAINTENANCE' || v.status === 'INACTIVE'}>
                  {v.code} - {v.licensePlate} [{v.status}]
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsDispatchModalOpen(false)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
            >
              Dispatch Shipment Now
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
