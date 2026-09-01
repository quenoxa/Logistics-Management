import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  MapPin,
  CheckCircle2,
  Clock,
  RotateCw,
  ShieldCheck,
} from 'lucide-react';
import { deliveriesApi, driversApi } from '../api/client';
import { Delivery, Driver } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';

export const DriverConsole: React.FC = () => {
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [driverProfile, setDriverProfile] = useState<Driver | null>(null);
  const [history, setHistory] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // POD signature modal state
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const fetchDriverData = async () => {
    try {
      setIsLoading(true);
      const [currentData, historyData] = await Promise.all([
        deliveriesApi.getDriverCurrent(),
        deliveriesApi.getDriverHistory(),
      ]);
      setActiveDelivery(currentData.delivery);
      setDriverProfile(currentData.driver);
      setHistory(historyData.history || []);
    } catch (err) {
      console.error('Failed to load driver console data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, []);

  const handleToggleAvailability = async () => {
    if (!driverProfile) return;
    const nextStatus = driverProfile.status === 'AVAILABLE' ? 'OFF_DUTY' : 'AVAILABLE';
    try {
      setIsUpdating(true);
      await driversApi.updateStatus(driverProfile.id, nextStatus);
      await fetchDriverData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update shift status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdvanceStatus = async (nextStatus: string) => {
    if (!activeDelivery) return;

    if (nextStatus === 'DELIVERED') {
      setIsSignModalOpen(true);
      return;
    }

    try {
      setIsUpdating(true);
      await deliveriesApi.transitionStatus(activeDelivery.id, {
        nextStatus,
        notes: `Driver status advanced to ${nextStatus}`,
        locationName: nextStatus === 'PICKED_UP' ? activeDelivery.order.pickupAddress : 'En Route',
      });
      await fetchDriverData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update delivery milestone');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteDeliveryWithSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDelivery || !recipientName.trim()) return;

    try {
      setIsUpdating(true);
      await deliveriesApi.transitionStatus(activeDelivery.id, {
        nextStatus: 'DELIVERED',
        recipientSignature: `Signed by: ${recipientName.trim()}`,
        notes: deliveryNotes,
        locationName: activeDelivery.order.deliveryAddress,
      });
      setIsSignModalOpen(false);
      setRecipientName('');
      setDeliveryNotes('');
      await fetchDriverData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to confirm delivery');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-500 text-xs">
        <div className="inline-flex items-center gap-2">
          <RotateCw className="w-4 h-4 animate-spin text-slate-400" />
          <span>Loading driver console...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      {/* Driver Header & Shift Status Toggle */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-slate-900">
              {driverProfile ? `${driverProfile.firstName} ${driverProfile.lastName}` : 'Commercial Driver'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({driverProfile?.code || 'DRV-101'})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            License: {driverProfile?.licenseNumber || 'DL-MH-2022-00912'} &bull; Rating: ★ {driverProfile?.rating.toFixed(2) || '4.95'}
          </p>
        </div>

        <button
          onClick={handleToggleAvailability}
          disabled={isUpdating || activeDelivery?.status === 'IN_TRANSIT'}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors border ${
            driverProfile?.status === 'AVAILABLE' || driverProfile?.status === 'ON_DELIVERY'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
          } disabled:opacity-50`}
        >
          <span className={`w-2 h-2 rounded-full ${driverProfile?.status === 'AVAILABLE' || driverProfile?.status === 'ON_DELIVERY' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
          <span>{driverProfile?.status === 'OFF_DUTY' ? 'Off duty (Tap to go online)' : 'Online / Available'}</span>
        </button>
      </div>

      {/* Main Active Delivery Section */}
      {activeDelivery ? (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          {/* Top Info Bar */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Current assigned trip</span>
              <span className="text-base font-semibold text-slate-900">{activeDelivery.trackingNumber}</span>
            </div>
            <StatusBadge status={activeDelivery.status} type="delivery" size="md" />
          </div>

          {/* Assigned Vehicle */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <Truck className="w-4 h-4 text-slate-500" />
              <div>
                <span className="text-slate-900 font-medium block">{activeDelivery.vehicle?.code || 'VEH-401'}</span>
                <span className="text-[11px] text-slate-500">{activeDelivery.vehicle?.make} {activeDelivery.vehicle?.model} ({activeDelivery.vehicle?.licensePlate})</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Fuel / Battery</span>
              <span className="font-medium text-slate-800">{activeDelivery.vehicle?.currentFuelPercent || 85}%</span>
            </div>
          </div>

          {/* Route Card: Pickup to Destination */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-3">
            {/* Pickup */}
            <div className="flex items-start space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5 text-slate-700 text-xs font-semibold">
                A
              </div>
              <div className="flex-1 text-xs">
                <span className="text-[11px] text-slate-500 block">Pickup location</span>
                <p className="text-slate-900 font-medium">{activeDelivery.order.pickupAddress}</p>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="pl-2.5 border-l-2 border-slate-300 ml-2.5 h-3"></div>

            {/* Destination */}
            <div className="flex items-start space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center shrink-0 mt-0.5 text-white text-xs font-semibold">
                B
              </div>
              <div className="flex-1 text-xs">
                <span className="text-[11px] text-slate-500 block">Delivery destination</span>
                <p className="text-slate-900 font-medium">{activeDelivery.order.deliveryAddress}</p>
              </div>
            </div>
          </div>

          {/* Customer & Cargo specs */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-[11px] text-slate-500 block">Customer</span>
              <span className="text-slate-900 font-medium block truncate">{activeDelivery.order.customerName}</span>
              <span className="text-[11px] text-slate-500">{activeDelivery.order.customerPhone || '+91 98200 12345'}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-[11px] text-slate-500 block">Cargo & Route</span>
              <span className="text-slate-900 font-medium block">{activeDelivery.order.weightKg.toLocaleString()} kg</span>
              <span className="text-[11px] text-slate-600">{activeDelivery.routeDistanceKm} km ({activeDelivery.routeDurationMin} min)</span>
            </div>
          </div>

          {/* Status Transitions */}
          <div className="space-y-2 pt-2">
            {activeDelivery.status === 'DISPATCHED' && (
              <button
                onClick={() => handleAdvanceStatus('PICKED_UP')}
                disabled={isUpdating}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Package className="w-4 h-4" />
                <span>1. Confirm cargo pickup</span>
              </button>
            )}

            {activeDelivery.status === 'PICKED_UP' && (
              <button
                onClick={() => handleAdvanceStatus('IN_TRANSIT')}
                disabled={isUpdating}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Truck className="w-4 h-4" />
                <span>2. Start transit</span>
              </button>
            )}

            {activeDelivery.status === 'IN_TRANSIT' && (
              <button
                onClick={() => handleAdvanceStatus('OUT_FOR_DELIVERY')}
                disabled={isUpdating}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <MapPin className="w-4 h-4" />
                <span>3. Arrive in destination area</span>
              </button>
            )}

            {activeDelivery.status === 'OUT_FOR_DELIVERY' && (
              <button
                onClick={() => handleAdvanceStatus('DELIVERED')}
                disabled={isUpdating}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-md shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>4. Complete delivery & sign POD</span>
              </button>
            )}

            {activeDelivery.status === 'DELAYED' && (
              <button
                onClick={() => handleAdvanceStatus('IN_TRANSIT')}
                disabled={isUpdating}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <RotateCw className="w-4 h-4" />
                <span>Resume transit</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Standby state when no delivery is currently active */
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-xs text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No active delivery assigned</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You are currently on standby. The dispatcher will assign your next shipment manifest shortly.
          </p>
        </div>
      )}

      {/* Driver Past Trip History */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
        <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Recent deliveries ({history.length})</span>
        </h4>

        <div className="divide-y divide-slate-100 text-xs">
          {history.length === 0 ? (
            <p className="py-4 text-center text-slate-400 text-xs">No past trip records found</p>
          ) : (
            history.slice(0, 5).map((d) => (
              <div key={d.id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div>
                  <span className="font-medium text-slate-900 block">{d.trackingNumber}</span>
                  <span className="text-[11px] text-slate-500 truncate block max-w-xs">{d.order?.deliveryAddress}</span>
                </div>
                <div className="text-right">
                  <StatusBadge status={d.status} type="delivery" size="sm" />
                  <span className="text-[11px] text-slate-400 block mt-0.5">{d.routeDistanceKm} km</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Proof of Delivery (POD) Signature Modal */}
      <Modal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        title="Confirm Proof of Delivery (POD)"
        subtitle={`Tracking #${activeDelivery?.trackingNumber || ''}`}
        maxWidth="md"
      >
        <form onSubmit={handleCompleteDeliveryWithSignature} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              Recipient name / Authorized signer <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Ramesh Kumar (Store Manager)"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Delivery notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="Cargo received in good condition, seal intact..."
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-500"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-slate-500" />
            <span>Digital POD timestamp and receiver confirmation will be saved.</span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsSignModalOpen(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!recipientName.trim()}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-md shadow-xs disabled:opacity-40"
            >
              Confirm delivery
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
