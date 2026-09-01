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
} from 'lucide-react';
import { ordersApi, driversApi, vehiclesApi, deliveriesApi } from '../api/client';
import { Order, Driver, Vehicle } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';

export const Orders: React.FC = () => {
  const navigate = useNavigate();
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

  const fetchData = async () => {
    try {
      setIsLoading(true);
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
    } catch (err) {
      console.error('Failed to fetch orders data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter, cargoFilter]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ordersApi.create(newOrder as any);
      setIsCreateModalOpen(false);
      fetchData();
      setNewOrder({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        pickupAddress: 'Central Terminal A, Port Hub, Sector 18',
        deliveryAddress: '',
        weightKg: 2500,
        volumeM3: 12.0,
        cargoType: 'GENERAL_FREIGHT',
        priority: 'STANDARD',
        deliveryFee: 850,
        notes: '',
      });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create order');
    }
  };

  const openDispatchModal = (order: Order) => {
    setSelectedOrder(order);
    const availableD = drivers.find((d) => d.status === 'AVAILABLE');
    const availableV = vehicles.find((v) => v.status === 'ACTIVE' || v.status === 'IDLE');

    setDispatchData({
      driverId: availableD ? availableD.id : drivers[0]?.id || '',
      vehicleId: availableV ? availableV.id : vehicles[0]?.id || '',
      priority: order.priority,
      pickupScheduledAt: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16),
      deliveryEstimatedAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 16),
      notes: `Dispatch for order ${order.orderNumber}`,
    });
    setIsDispatchModalOpen(true);
  };

  const handleCreateDeliveryDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const created = await deliveriesApi.create({
        orderId: selectedOrder.id,
        driverId: dispatchData.driverId,
        vehicleId: dispatchData.vehicleId,
        priority: dispatchData.priority,
        pickupScheduledAt: dispatchData.pickupScheduledAt,
        deliveryEstimatedAt: dispatchData.deliveryEstimatedAt,
        notes: dispatchData.notes,
      });

      setIsDispatchModalOpen(false);
      navigate(`/deliveries/${created.id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create delivery dispatch');
    }
  };

  const columns: Column<Order>[] = [
    {
      header: 'Order #',
      accessor: 'orderNumber',
      sortable: true,
      render: (o) => (
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          <span className="font-mono font-bold text-slate-900">{o.orderNumber}</span>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      sortable: true,
      render: (o) => (
        <div>
          <span className="text-slate-900 font-bold block">{o.customerName}</span>
          <span className="text-[10px] font-mono text-slate-500">{o.customerEmail}</span>
        </div>
      ),
    },
    {
      header: 'Cargo Specs',
      accessor: 'cargoType',
      render: (o) => (
        <div>
          <StatusBadge status={o.cargoType} type="cargo" />
          <span className="text-[11px] font-mono text-slate-600 block mt-0.5">
            {o.weightKg.toLocaleString()} kg &bull; {o.volumeM3} m³
          </span>
        </div>
      ),
    },
    {
      header: 'Delivery Address',
      accessor: 'deliveryAddress',
      render: (o) => (
        <div className="text-xs max-w-xs truncate font-mono text-slate-700">
          <MapPin className="w-3 h-3 text-emerald-600 inline mr-1" />
          {o.deliveryAddress}
        </div>
      ),
    },
    {
      header: 'Priority',
      accessor: 'priority',
      sortable: true,
      render: (o) => <StatusBadge status={o.priority} type="priority" />,
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (o) => (
        <span
          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
            o.status === 'PENDING'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : o.status === 'ASSIGNED'
              ? 'bg-sky-50 text-sky-700 border border-sky-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {o.status}
        </span>
      ),
    },
    {
      header: 'Dispatch Action',
      render: (o) => (
        <div>
          {o.delivery ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/deliveries/${o.delivery!.id}`);
              }}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-mono font-bold"
            >
              #{o.delivery.trackingNumber}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openDispatchModal(o);
              }}
              className="px-2.5 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white text-xs font-mono font-bold flex items-center gap-1 shadow-sm"
            >
              <Send className="w-3 h-3" />
              <span>Dispatch</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Freight bookings, customer manifests, and dispatch assignment
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New order</span>
        </button>
      </div>

      {/* Orders Table */}
      <DataTable
        data={orders}
        columns={columns}
        keyExtractor={(o) => o.id}
        searchPlaceholder="Search Order Number, Customer, Address, Email..."
        searchFilter={(o, q) =>
          o.orderNumber.toLowerCase().includes(q.toLowerCase()) ||
          o.customerName.toLowerCase().includes(q.toLowerCase()) ||
          o.customerEmail.toLowerCase().includes(q.toLowerCase()) ||
          o.deliveryAddress.toLowerCase().includes(q.toLowerCase())
        }
        filtersSlot={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-mono focus:outline-none focus:border-orange-500 shadow-sm"
            >
              <option value="ALL">Status: All</option>
              <option value="PENDING">PENDING (Ready to dispatch)</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="DELIVERED">DELIVERED</option>
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
              value={cargoFilter}
              onChange={(e) => setCargoFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-mono focus:outline-none focus:border-orange-500 shadow-sm"
            >
              <option value="ALL">Cargo: All</option>
              <option value="GENERAL_FREIGHT">General Freight</option>
              <option value="COLD_CHAIN">Cold Chain</option>
              <option value="HAZMAT">Hazmat</option>
              <option value="PERISHABLE">Perishable</option>
              <option value="HIGH_VALUE">High Value</option>
            </select>
          </div>
        }
        isLoading={isLoading}
      />

      {/* Book Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="BOOK NEW CARGO FREIGHT ORDER"
        subtitle="Register customer shipment manifest and cargo parameters"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Customer / Organization</label>
              <input
                required
                type="text"
                placeholder="Apex Retailers Logistics"
                value={newOrder.customerName}
                onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Customer Email</label>
              <input
                required
                type="email"
                placeholder="logistics@apex.com"
                value={newOrder.customerEmail}
                onChange={(e) => setNewOrder({ ...newOrder, customerEmail: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Customer Phone</label>
              <input
                type="text"
                placeholder="+91 98200 12345"
                value={newOrder.customerPhone}
                onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Delivery Freight Fee (₹ INR)</label>
              <input
                type="number"
                value={newOrder.deliveryFee}
                onChange={(e) => setNewOrder({ ...newOrder, deliveryFee: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Origin / Pickup Address</label>
              <input
                required
                type="text"
                value={newOrder.pickupAddress}
                onChange={(e) => setNewOrder({ ...newOrder, pickupAddress: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Delivery Destination Address</label>
              <input
                required
                type="text"
                placeholder="e.g. Whitefield Freight Terminal, Bengaluru 560066"
                value={newOrder.deliveryAddress}
                onChange={(e) => setNewOrder({ ...newOrder, deliveryAddress: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Weight (kg)</label>
              <input
                type="number"
                value={newOrder.weightKg}
                onChange={(e) => setNewOrder({ ...newOrder, weightKg: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Volume (m³)</label>
              <input
                type="number"
                value={newOrder.volumeM3}
                onChange={(e) => setNewOrder({ ...newOrder, volumeM3: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Cargo Class</label>
              <select
                value={newOrder.cargoType}
                onChange={(e) => setNewOrder({ ...newOrder, cargoType: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              >
                <option value="GENERAL_FREIGHT">General Freight</option>
                <option value="COLD_CHAIN">Cold Chain</option>
                <option value="HAZMAT">Hazmat Class</option>
                <option value="PERISHABLE">Perishable Goods</option>
                <option value="HIGH_VALUE">High Value Cargo</option>
              </select>
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Priority</label>
              <select
                value={newOrder.priority}
                onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              >
                <option value="STANDARD">Standard</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent / Critical</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-sm"
            >
              Create Booking Manifest
            </button>
          </div>
        </form>
      </Modal>

      {/* Dispatch Assignment Modal */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title="DISPATCH MANIFEST ASSIGNMENT"
        subtitle={`Order: ${selectedOrder?.orderNumber || ''} &bull; ${selectedOrder?.customerName || ''}`}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateDeliveryDispatch} className="space-y-4 font-mono text-xs">
          <div>
            <label className="text-slate-700 font-bold block mb-1">Select Driver</label>
            <select
              required
              value={dispatchData.driverId}
              onChange={(e) => setDispatchData({ ...dispatchData, driverId: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
            >
              <option value="">-- Choose Commercial Driver --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.firstName} {d.lastName} ({d.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1">Select Vehicle Asset</label>
            <select
              required
              value={dispatchData.vehicleId}
              onChange={(e) => setDispatchData({ ...dispatchData, vehicleId: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
            >
              <option value="">-- Choose Fleet Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.code} - {v.make} {v.model} ({v.licensePlate}) [{v.status}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Scheduled Pickup</label>
              <input
                type="datetime-local"
                value={dispatchData.pickupScheduledAt}
                onChange={(e) => setDispatchData({ ...dispatchData, pickupScheduledAt: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Estimated Delivery ETA</label>
              <input
                type="datetime-local"
                value={dispatchData.deliveryEstimatedAt}
                onChange={(e) => setDispatchData({ ...dispatchData, deliveryEstimatedAt: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsDispatchModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Launch Live Delivery</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
