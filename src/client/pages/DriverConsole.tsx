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
  AlertTriangle,
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
      setActiveDelivery(currentData?.delivery || null);
      setDriverProfile(currentData?.driver || null);
      setHistory(historyData?.history || []);
    } catch (err: any) {
      console.error('Driver Console sync error:', err?.response?.status, err?.response?.data || err?.message);
      if (showLoading) {
        error(
          'Driver Console Sync',
          err.response?.data?.error || 'Unable to connect to dispatch hub.'
        );
      }
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
      success('Shift Status Committed', `You are now marked as ${nextStatus.replace(/_/g, ' ')}.`);
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
        locationName: nextStatus === 'PICKED_UP' ? (activeDelivery.order?.pickupAddress || activeDelivery.pickupAddress) : 'En Route Highway Corridor',
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
        locationName: activeDelivery.order?.deliveryAddress || activeDelivery.deliveryAddress,
      });
      success('Trip Completed!', 'Digital Proof of Delivery verified & recorded.');
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
      <div className="max-w-3xl mx-auto space-y-5 pb-16 font-sans text-slate-800">
        <Skeleton className="h-20 w-full rounded-2xl bg-white" />
        <Skeleton className="h-64 w-full rounded-2xl bg-white" />
        <Skeleton className="h-48 w-full rounded-2xl bg-white" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 font-sans text-slate-800">
      {/* Driver Header Profile Bar */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold text-lg">
            {driverProfile ? `${driverProfile.firstName[0]}${driverProfile.lastName[0]}` : 'D'}
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-lg font-bold text-slate-900">
                {driverProfile ? `${driverProfile.firstName} ${driverProfile.lastName}` : 'Commercial Operator'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-mono text-xs font-bold text-slate-700">
                {driverProfile?.driverCode || driverProfile?.code || 'DRV-101'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              CDL Class: {driverProfile?.licenseClass || 'CDL-A'} &bull; <span className="font-mono">{driverProfile?.phone}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchDriverData(true)}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition shadow-sm"
            title="Refresh assigned trip"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {driverProfile?.status !== 'ON_DELIVERY' && (
            <button
              onClick={handleToggleAvailability}
              disabled={isUpdating}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition shadow-sm ${
                driverProfile?.status === 'AVAILABLE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{driverProfile?.status === 'AVAILABLE' ? 'On Shift (Online)' : 'Off Duty (Tap to Go Online)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Shipment Section */}
      {activeDelivery ? (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Current Assigned Dispatch
              </h3>
            </div>
            <StatusBadge status={activeDelivery.status} type="delivery" />
          </div>

          <div>
            <span className="font-mono text-2xl font-bold text-emerald-600 block">
              #{activeDelivery.trackingNumber}
            </span>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Customer: <span className="font-bold text-slate-900">{activeDelivery.order?.customerName || activeDelivery.customerName}</span> ({activeDelivery.order?.customerPhone || activeDelivery.customerPhone})
            </p>
          </div>

          {/* Pickup and Dropoff Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-600" />
                <span>Pickup Origin</span>
              </span>
              <p className="text-slate-900 font-semibold">{activeDelivery.order?.pickupAddress || activeDelivery.pickupAddress}</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Destination Drop-off</span>
              </span>
              <p className="text-slate-900 font-semibold">{activeDelivery.order?.deliveryAddress || activeDelivery.deliveryAddress}</p>
            </div>
          </div>

          {/* Cargo Specs */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Weight</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{(activeDelivery.order?.weightKg || activeDelivery.packageWeight || 1000).toLocaleString()} kg</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Priority</span>
              <span className="font-bold text-emerald-600 mt-0.5 block">{activeDelivery.priority}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Asset</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{activeDelivery.vehicle?.code || 'VEH'}</span>
            </div>
          </div>

          {/* Progressive Action Stepper */}
          <div className="pt-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Required Milestone Action
            </h4>

            {(activeDelivery.status === 'ASSIGNED' || activeDelivery.status === 'DISPATCHED') && (
              <button
                onClick={() => handleAdvanceStatus('ACCEPTED')}
                disabled={isUpdating}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>ACCEPT DELIVERY</span>
              </button>
            )}

            {activeDelivery.status === 'ACCEPTED' && (
              <button
                onClick={() => handleAdvanceStatus('PICKED_UP')}
                disabled={isUpdating}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
              >
                <Package className="w-5 h-5" />
                <span>START PICKUP & MARK PICKED UP</span>
              </button>
            )}

            {activeDelivery.status === 'PICKED_UP' && (
              <button
                onClick={() => handleAdvanceStatus('IN_TRANSIT')}
                disabled={isUpdating}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
              >
                <Navigation className="w-5 h-5" />
                <span>START DELIVERY & IN TRANSIT</span>
              </button>
            )}

            {activeDelivery.status === 'IN_TRANSIT' && (
              <button
                onClick={() => handleAdvanceStatus('OUT_FOR_DELIVERY')}
                disabled={isUpdating}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
              >
                <Truck className="w-5 h-5" />
                <span>OUT FOR DELIVERY</span>
              </button>
            )}

            {activeDelivery.status === 'OUT_FOR_DELIVERY' && (
              <button
                onClick={() => handleAdvanceStatus('DELIVERED')}
                disabled={isUpdating}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-base flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>MARK DELIVERED & RECORD POD</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
            <Truck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Active Shipment Assigned</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You are currently online. When dispatch assigns an order to your vehicle, the milestone instructions will appear here instantly.
          </p>
        </div>
      )}

      {/* Completed Trip History */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-3">
          Your Trip History ({history.length})
        </h3>

        <div className="divide-y divide-slate-100">
          {history.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No past completed trips on record.</p>
          ) : (
            history.slice(0, 5).map((h) => (
              <div key={h.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-emerald-600 block text-sm">#{h.trackingNumber}</span>
                  <span className="text-slate-600 text-xs truncate max-w-xs block mt-0.5 font-medium">
                    {h.order?.customerName || h.customerName} &bull; {h.order?.deliveryAddress || h.deliveryAddress}
                  </span>
                </div>
                <div className="text-right text-xs">
                  <StatusBadge status={h.status} type="delivery" />
                  <span className="text-slate-400 block mt-1 font-mono text-[11px]">
                    {new Date(h.updatedAt || h.createdAt || Date.now()).toLocaleDateString('en-US')}
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
        <form onSubmit={handleCompleteDeliveryWithSignature} className="space-y-4 text-sm font-sans">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <span className="text-xs font-bold text-emerald-700 block uppercase">Final Verification</span>
            <p className="text-slate-600 text-xs">
              Please enter recipient name and notes before completing delivery.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Recipient Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g., S. Deshmukh (Receiving Mgr)"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Delivery Notes</label>
            <textarea
              rows={2}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g., Cargo verified intact..."
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsSignModalOpen(false)}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating || !recipientName.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {isUpdating ? 'Recording...' : 'Confirm Delivery & Record POD'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
