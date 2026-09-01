import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  MapPin,
  CheckCircle2,
  Clock,
  RotateCw,
  ShieldCheck,
  Smartphone,
  Navigation,
  ArrowRight,
  User,
  Power,
  Calendar,
} from 'lucide-react';
import { deliveriesApi, driversApi } from '../services/api';
import { Delivery, Driver } from '../../shared/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

export const DriverConsole: React.FC = () => {
  const { success, error } = useToast();
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [driverProfile, setDriverProfile] = useState<Driver | null>(null);
  const [history, setHistory] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // POD signature modal state
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const fetchDriverData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const [currentData, historyData] = await Promise.all([
        deliveriesApi.getDriverCurrent(),
        deliveriesApi.getDriverHistory(),
      ]);
      setActiveDelivery(currentData.delivery);
      setDriverProfile(currentData.driver);
      setHistory(historyData.history || []);
    } catch (err: any) {
      console.error('Failed to load driver console data:', err);
      error('Sync Error', 'Failed to load assigned trips from hub dispatch.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData(true);
  }, []);

  useAutoRefresh(fetchDriverData, { intervalMs: 15000 });

  const handleToggleAvailability = async () => {
    if (!driverProfile) return;
    const nextStatus = driverProfile.status === 'AVAILABLE' ? 'OFF_DUTY' : 'AVAILABLE';
    try {
      setIsUpdating(true);
      await driversApi.updateStatus(driverProfile.id, nextStatus);
      success('Shift Status Updated', `You are now marked as ${nextStatus.replace(/_/g, ' ')}.`);
      await fetchDriverData(false);
    } catch (err: any) {
      error('Shift Update Failed', err.response?.data?.error || 'Failed to update shift status.');
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
        notes: `Driver milestone update: ${nextStatus}`,
        locationName: nextStatus === 'PICKED_UP' ? activeDelivery.order.pickupAddress : 'En Route Highway Corridor',
      });
      success('Milestone Logged', `Status advanced to ${nextStatus.replace(/_/g, ' ')}.`);
      await fetchDriverData(false);
    } catch (err: any) {
      error('Update Failed', err.response?.data?.error || 'Failed to advance delivery milestone.');
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
      success('Trip Completed! 🎉', 'Digital Proof of Delivery verified & recorded.');
      setIsSignModalOpen(false);
      setRecipientName('');
      setDeliveryNotes('');
      await fetchDriverData(false);
    } catch (err: any) {
      error('Completion Error', err.response?.data?.error || 'Failed to record Proof of Delivery.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading && !driverProfile) {
    return (
      <div className="max-w-3xl mx-auto space-y-5 pb-16">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Driver Header Profile Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {driverProfile ? `${driverProfile.firstName[0]}${driverProfile.lastName[0]}` : 'D'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">
                {driverProfile ? `${driverProfile.firstName} ${driverProfile.lastName}` : 'Commercial Operator'}
              </h2>
              <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-semibold text-slate-700">
                {driverProfile?.driverCode || 'DRV-101'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              CDL Class: {driverProfile?.licenseClass || 'CDL-A'} &bull; {driverProfile?.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchDriverData(true)}
            className="p-2 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 shadow-2xs transition-colors"
            title="Refresh assigned trip"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {driverProfile?.status !== 'ON_DELIVERY' && (
            <button
              onClick={handleToggleAvailability}
              disabled={isUpdating}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs ${
                driverProfile?.status === 'AVAILABLE'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{driverProfile?.status === 'AVAILABLE' ? 'On Shift (Available)' : 'Off Duty (Tap to Go Online)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Shipment Section */}
      {activeDelivery ? (
        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Current Assigned Dispatch
              </h3>
            </div>
            <StatusBadge status={activeDelivery.status} type="delivery" />
          </div>

          <div>
            <span className="font-mono text-lg font-bold text-slate-900 block">
              {activeDelivery.trackingNumber}
            </span>
            <p className="text-xs text-slate-600 mt-0.5">
              Customer: <span className="font-semibold text-slate-800">{activeDelivery.order?.customerName}</span> ({activeDelivery.order?.customerPhone})
            </p>
          </div>

          {/* Pickup and Dropoff Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Pickup Origin</span>
              </span>
              <p className="text-slate-800 font-medium">{activeDelivery.order?.pickupAddress}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Destination Drop-off</span>
              </span>
              <p className="text-slate-800 font-medium">{activeDelivery.order?.deliveryAddress}</p>
            </div>
          </div>

          {/* Cargo Specs */}
          <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Weight</span>
              <span className="font-semibold text-slate-900 font-mono">{activeDelivery.order?.weightKg.toLocaleString()} kg</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Volume</span>
              <span className="font-semibold text-slate-900 font-mono">{activeDelivery.order?.volumeM3} m³</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Vehicle</span>
              <span className="font-semibold text-slate-900 font-mono">{activeDelivery.vehicle?.code || 'VEH'}</span>
            </div>
          </div>

          {/* Progressive Action Stepper */}
          <div className="pt-2 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Required Next Action
            </h4>

            {activeDelivery.status === 'DISPATCHED' && (
              <button
                onClick={() => handleAdvanceStatus('PICKED_UP')}
                disabled={isUpdating}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                <Package className="w-4 h-4 text-orange-400" />
                <span>1. Confirm Cargo Loaded & Picked Up</span>
              </button>
            )}

            {activeDelivery.status === 'PICKED_UP' && (
              <button
                onClick={() => handleAdvanceStatus('IN_TRANSIT')}
                disabled={isUpdating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                <Navigation className="w-4 h-4" />
                <span>2. Start Highway Corridor Transit</span>
              </button>
            )}

            {activeDelivery.status === 'IN_TRANSIT' && (
              <button
                onClick={() => handleAdvanceStatus('OUT_FOR_DELIVERY')}
                disabled={isUpdating}
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                <Truck className="w-4 h-4" />
                <span>3. Arrive in Destination Drop-off Zone</span>
              </button>
            )}

            {activeDelivery.status === 'OUT_FOR_DELIVERY' && (
              <button
                onClick={() => handleAdvanceStatus('DELIVERED')}
                disabled={isUpdating}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>4. Complete Delivery & Sign Proof of Delivery</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Active Shipments Assigned</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You are currently online. When dispatch assigns an order to your vehicle, the milestone instructions will appear here instantly.
          </p>
        </div>
      )}

      {/* Completed Trip History */}
      <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
          Your Recent Completed Trips ({history.length})
        </h3>

        <div className="divide-y divide-slate-100">
          {history.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No past completed trips on record.</p>
          ) : (
            history.slice(0, 5).map((h) => (
              <div key={h.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-slate-900 block">{h.trackingNumber}</span>
                  <span className="text-slate-500 text-[11px] truncate max-w-xs block">
                    {h.order?.customerName} &bull; {h.order?.deliveryAddress}
                  </span>
                </div>
                <div className="text-right text-[11px]">
                  <StatusBadge status={h.status} type="delivery" />
                  <span className="text-slate-400 block mt-1 font-mono">
                    {new Date(h.updatedAt || h.createdAt || Date.now()).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Digital POD Signature Modal */}
      <Modal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        title="Capture Digital Proof of Delivery (POD)"
      >
        <form onSubmit={handleCompleteDeliveryWithSignature} className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1">
            <span className="text-xs font-bold text-emerald-900 block">Final Delivery Verification</span>
            <p className="text-slate-600 text-[11px]">
              Please collect recipient full name and digital confirmation before releasing cargo.
            </p>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Recipient Name & Role <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g., S. Deshmukh (Receiving Plant Manager)"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Delivery Condition Notes</label>
            <textarea
              rows={2}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g., Cargo inspected, zero seal tampering, verified in full..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsSignModalOpen(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-md font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating || !recipientName.trim()}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold shadow-2xs disabled:opacity-50"
            >
              {isUpdating ? 'Recording...' : 'Confirm Delivery & Sign POD'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
