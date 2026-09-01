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
  Radio,
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
      success('SHIFT STATUS COMMITTED', `You are now marked as ${nextStatus.replace(/_/g, ' ')}.`);
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
      success('MILESTONE COMMITTED', `Status advanced to ${nextStatus.replace(/_/g, ' ')}.`);
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
      success('TRIP COMPLETED! 🚀', 'Cryptographic Proof of Delivery recorded in database.');
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
        <Skeleton className="h-20 w-full rounded-lg bg-ops-panel" />
        <Skeleton className="h-64 w-full rounded-lg bg-ops-panel" />
        <Skeleton className="h-48 w-full rounded-lg bg-ops-panel" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Driver Header Profile Bar */}
      <div className="p-4 bg-ops-surface border border-ops-border rounded-xl shadow-panel flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-full bg-ops-panel text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-sm shadow-glow-cyan">
            {driverProfile ? `${driverProfile.firstName[0]}${driverProfile.lastName[0]}` : 'D'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white">
                {driverProfile ? `${driverProfile.firstName} ${driverProfile.lastName}` : 'Commercial Operator'}
              </h2>
              <span className="px-2 py-0.5 rounded bg-ops-bg border border-ops-border font-mono text-[10px] font-bold text-cyan-400">
                {driverProfile?.driverCode || driverProfile?.code || 'DRV-101'}
              </span>
            </div>
            <p className="text-xs text-ops-dim mt-0.5 font-mono">
              CDL CLASS: {driverProfile?.licenseClass || 'CDL-A'} &bull; {driverProfile?.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 font-mono">
          <button
            onClick={() => fetchDriverData(true)}
            className="p-2 rounded-md bg-ops-bg hover:bg-ops-panel border border-ops-border text-ops-muted hover:text-ops-text shadow-panel transition-colors"
            title="Refresh assigned trip"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {driverProfile?.status !== 'ON_DELIVERY' && (
            <button
              onClick={handleToggleAvailability}
              disabled={isUpdating}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-all shadow-panel ${
                driverProfile?.status === 'AVAILABLE'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 shadow-glow-emerald/20'
                  : 'bg-ops-bg hover:bg-ops-panel text-ops-dim hover:text-ops-text border border-ops-border'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{driverProfile?.status === 'AVAILABLE' ? 'ON SHIFT (ONLINE)' : 'OFF DUTY (TAP TO GO ONLINE)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Shipment Section */}
      {activeDelivery ? (
        <div className="p-5 bg-ops-surface border border-cyan-500/40 rounded-xl shadow-glow-cyan/20 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-ops-border">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Current Assigned Dispatch
              </h3>
            </div>
            <StatusBadge status={activeDelivery.status} type="delivery" />
          </div>

          <div>
            <span className="font-mono text-xl font-bold text-cyan-400 block">
              #{activeDelivery.trackingNumber}
            </span>
            <p className="text-xs text-ops-muted mt-1 font-sans">
              Consignee: <span className="font-semibold text-white">{activeDelivery.order?.customerName}</span> ({activeDelivery.order?.customerPhone})
            </p>
          </div>

          {/* Pickup and Dropoff Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-ops-bg border border-ops-border rounded-lg space-y-1">
              <span className="text-[10px] font-mono font-bold text-ops-dim uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>Pickup Origin</span>
              </span>
              <p className="text-ops-text font-sans font-medium">{activeDelivery.order?.pickupAddress}</p>
            </div>

            <div className="p-3 bg-ops-bg border border-ops-border rounded-lg space-y-1">
              <span className="text-[10px] font-mono font-bold text-ops-dim uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Destination Drop-off</span>
              </span>
              <p className="text-ops-text font-sans font-medium">{activeDelivery.order?.deliveryAddress}</p>
            </div>
          </div>

          {/* Cargo Specs */}
          <div className="grid grid-cols-3 gap-2 p-2.5 bg-ops-bg border border-ops-border rounded-lg text-center text-xs font-mono">
            <div>
              <span className="text-[9px] text-ops-dim block uppercase">Payload</span>
              <span className="font-bold text-white">{activeDelivery.order?.weightKg.toLocaleString()} kg</span>
            </div>
            <div>
              <span className="text-[9px] text-ops-dim block uppercase">Volume</span>
              <span className="font-bold text-white">{activeDelivery.order?.volumeM3} m³</span>
            </div>
            <div>
              <span className="text-[9px] text-ops-dim block uppercase">Asset</span>
              <span className="font-bold text-cyan-400">{activeDelivery.vehicle?.code || 'VEH'}</span>
            </div>
          </div>

          {/* Progressive Action Stepper */}
          <div className="pt-2 space-y-2">
            <h4 className="text-[11px] font-mono font-bold text-ops-dim uppercase tracking-wider">
              Required In-Cab Action
            </h4>

            {activeDelivery.status === 'DISPATCHED' && (
              <button
                onClick={() => handleAdvanceStatus('PICKED_UP')}
                disabled={isUpdating}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-black rounded-lg font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-cyan transition-all disabled:opacity-50"
              >
                <Package className="w-4 h-4" />
                <span>1. CONFIRM CARGO LOADED & PICKED UP</span>
              </button>
            )}

            {activeDelivery.status === 'PICKED_UP' && (
              <button
                onClick={() => handleAdvanceStatus('IN_TRANSIT')}
                disabled={isUpdating}
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-black rounded-lg font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-cyan transition-all disabled:opacity-50"
              >
                <Navigation className="w-4 h-4" />
                <span>2. START HIGHWAY CORRIDOR TRANSIT</span>
              </button>
            )}

            {activeDelivery.status === 'IN_TRANSIT' && (
              <button
                onClick={() => handleAdvanceStatus('OUT_FOR_DELIVERY')}
                disabled={isUpdating}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-panel transition-all disabled:opacity-50"
              >
                <Truck className="w-4 h-4" />
                <span>3. ARRIVE IN DESTINATION DROP-OFF ZONE</span>
              </button>
            )}

            {activeDelivery.status === 'OUT_FOR_DELIVERY' && (
              <button
                onClick={() => handleAdvanceStatus('DELIVERED')}
                disabled={isUpdating}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-black rounded-lg font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-emerald transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>4. COMPLETE DELIVERY & SIGN PROOF OF DELIVERY (POD)</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-ops-surface border border-ops-border rounded-xl shadow-panel space-y-3">
          <div className="w-12 h-12 rounded-full bg-ops-panel text-ops-dim flex items-center justify-center mx-auto border border-ops-border">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">No Active Shipments Assigned</h3>
          <p className="text-xs text-ops-muted max-w-sm mx-auto font-sans">
            You are currently online. When dispatch assigns an order to your vehicle, the milestone instructions will appear here instantly.
          </p>
        </div>
      )}

      {/* Completed Trip History */}
      <div className="p-5 bg-ops-surface border border-ops-border rounded-xl shadow-panel space-y-3">
        <h3 className="text-xs font-mono font-bold text-ops-text uppercase tracking-wider border-b border-ops-border pb-2 flex items-center gap-2">
          <span className="w-1.5 h-3 bg-cyan-400 rounded-xs"></span>
          Your Recent Completed Trips ({history.length})
        </h3>

        <div className="divide-y divide-ops-border/40">
          {history.length === 0 ? (
            <p className="text-xs font-mono text-ops-dim py-4 text-center">No past completed trips on record.</p>
          ) : (
            history.slice(0, 5).map((h) => (
              <div key={h.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-cyan-400 block">#{h.trackingNumber}</span>
                  <span className="text-ops-dim text-[11px] truncate max-w-xs block font-sans">
                    {h.order?.customerName} &bull; {h.order?.deliveryAddress}
                  </span>
                </div>
                <div className="text-right text-[11px] font-mono">
                  <StatusBadge status={h.status} type="delivery" />
                  <span className="text-ops-dim block mt-1">
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
        <form onSubmit={handleCompleteDeliveryWithSignature} className="space-y-4 text-xs font-sans">
          <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg space-y-1">
            <span className="text-xs font-mono font-bold text-emerald-300 block uppercase">Final Delivery Verification</span>
            <p className="text-ops-dim text-[11px]">
              Please collect recipient full name and digital confirmation before releasing cargo.
            </p>
          </div>

          <div>
            <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">
              Recipient Name & Role <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g., S. Deshmukh (Receiving Plant Manager)"
              className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Delivery Condition Notes</label>
            <textarea
              rows={2}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g., Cargo inspected, zero seal tampering, verified in full..."
              className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text focus:border-cyan-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
            <button
              type="button"
              onClick={() => setIsSignModalOpen(false)}
              className="px-3.5 py-1.5 bg-ops-panel hover:bg-ops-panelHover border border-ops-border text-ops-muted hover:text-ops-text rounded-md font-mono font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating || !recipientName.trim()}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-mono font-bold rounded-md uppercase tracking-wider shadow-glow-emerald disabled:opacity-50"
            >
              {isUpdating ? 'RECORDING...' : 'CONFIRM DELIVERY & RECORD POD'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
