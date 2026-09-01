import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  MapPin,
  Clock,
  Package,
  CheckCircle2,
  AlertCircle,
  Navigation,
  FileText,
  User,
  ShieldCheck,
  Calendar,
  PenTool,
  Radio,
  Activity,
} from 'lucide-react';
import { deliveriesApi } from '../services/api';
import { Delivery } from '../../shared/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { DeliveryMap } from '../components/map/DeliveryMap';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

export const DeliveryDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitionOpen, setIsTransitionOpen] = useState(false);

  // Transition form state
  const [nextStatus, setNextStatus] = useState('');
  const [transitionNotes, setTransitionNotes] = useState('');
  const [recipientSignature, setRecipientSignature] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDetails = async (showLoading = false) => {
    if (!id) return;
    try {
      if (showLoading) setIsLoading(true);
      const data = await deliveriesApi.getById(id);
      setDelivery(data);
    } catch (err: any) {
      console.error('Failed to load delivery details:', err);
      if (showLoading) error('Error', err.response?.data?.error || 'Failed to load delivery details.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails(true);
  }, [id]);

  useAutoRefresh(fetchDetails, { intervalMs: 15000 });

  const handleStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery || !nextStatus) return;

    try {
      setIsSubmitting(true);
      await deliveriesApi.transitionStatus(delivery.id, {
        nextStatus,
        notes: transitionNotes,
        recipientSignature: nextStatus === 'DELIVERED' ? recipientSignature : undefined,
        delayReason: nextStatus === 'DELAYED' ? delayReason : undefined,
        locationName: nextStatus === 'DELIVERED' ? delivery.order.deliveryAddress : 'Corridor Checkpoint',
      });
      success('MILESTONE VERIFIED', `Shipment advanced to ${nextStatus.replace(/_/g, ' ')}.`);
      setIsTransitionOpen(false);
      setTransitionNotes('');
      setRecipientSignature('');
      setDelayReason('');
      await fetchDetails();
    } catch (err: any) {
      console.error('Transition error:', err);
      error('Transition Failed', err.response?.data?.error || 'Failed to advance delivery stage.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !delivery) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center space-x-3 pb-4 border-b border-ops-border">
          <Skeleton className="w-8 h-8 rounded-md bg-ops-panel" />
          <div className="space-y-1">
            <Skeleton className="w-48 h-6 bg-ops-panel" />
            <Skeleton className="w-32 h-4 bg-ops-panel" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-lg bg-ops-panel" />
            <Skeleton className="h-48 w-full rounded-lg bg-ops-panel" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-80 w-full rounded-lg bg-ops-panel" />
            <Skeleton className="h-48 w-full rounded-lg bg-ops-panel" />
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'PENDING', label: 'Order Confirmed' },
    { key: 'DISPATCHED', label: 'Fleet Dispatched' },
    { key: 'PICKED_UP', label: 'Cargo Loaded' },
    { key: 'IN_TRANSIT', label: 'Corridor Transit' },
    { key: 'OUT_FOR_DELIVERY', label: 'Final Drop-Off' },
    { key: 'DELIVERED', label: 'POD Confirmed' },
  ];

  const currentStatusIndex =
    delivery.status === 'DELIVERED'
      ? 5
      : delivery.status === 'OUT_FOR_DELIVERY'
      ? 4
      : delivery.status === 'IN_TRANSIT'
      ? 3
      : delivery.status === 'PICKED_UP'
      ? 2
      : delivery.status === 'DISPATCHED'
      ? 1
      : 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Bar / Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ops-border pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/deliveries')}
            className="p-2 rounded-md border border-ops-border bg-ops-surface hover:bg-ops-panel text-ops-muted hover:text-ops-text shadow-panel transition-colors"
            title="Back to Deliveries"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight font-mono">
                #{delivery.trackingNumber}
              </h1>
              <StatusBadge status={delivery.status} type="delivery" />
              <StatusBadge status={delivery.order?.priority || 'MEDIUM'} type="priority" />
            </div>
            <p className="text-xs text-ops-dim mt-0.5 font-mono">
              MANIFEST: {delivery.order?.orderNumber} &bull; LOGGED {new Date(delivery.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {delivery.status !== 'DELIVERED' && (
            <button
              onClick={() => {
                setNextStatus(
                  delivery.status === 'DISPATCHED'
                    ? 'PICKED_UP'
                    : delivery.status === 'PICKED_UP'
                    ? 'IN_TRANSIT'
                    : delivery.status === 'IN_TRANSIT'
                    ? 'OUT_FOR_DELIVERY'
                    : 'DELIVERED'
                );
                setIsTransitionOpen(true);
              }}
              className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-glow-cyan transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ADVANCE MILESTONE</span>
            </button>
          )}
        </div>
      </div>

      {/* 6-Stage Progress Stepper */}
      <div className="p-4 bg-ops-surface border border-ops-border rounded-xl shadow-panel">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStatusIndex;
            const isCurrent = idx === currentStatusIndex;
            return (
              <div key={step.key} className="flex flex-col items-center text-center p-2 rounded-lg relative">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold mb-1.5 transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-black shadow-glow-emerald'
                      : 'bg-ops-bg text-ops-dim border border-ops-border'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span
                  className={`text-[11px] font-mono tracking-wider uppercase ${
                    isCurrent
                      ? 'text-cyan-400 font-bold'
                      : isCompleted
                      ? 'text-ops-text font-medium'
                      : 'text-ops-dim'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Shipment & Asset Specs */}
        <div className="space-y-5">
          {/* Customer & Route Card */}
          <div className="p-4 bg-ops-surface border border-ops-border rounded-xl shadow-panel space-y-3.5">
            <h3 className="text-xs font-mono font-bold text-ops-text uppercase tracking-wider flex items-center gap-2 border-b border-ops-border pb-2">
              <span className="w-1.5 h-3 bg-cyan-400 rounded-xs"></span>
              Customer & Cargo Manifest
            </h3>

            <div className="space-y-3 text-xs font-sans">
              <div>
                <span className="text-[10px] font-mono text-ops-dim uppercase block">Consignee Customer</span>
                <span className="font-semibold text-white block">{delivery.order?.customerName}</span>
                <span className="text-ops-muted text-[11px] font-mono block">{delivery.order?.customerPhone}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-ops-dim uppercase block">Origin Facility Depot</span>
                <span className="text-ops-text font-medium flex items-start gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{delivery.order?.pickupAddress}</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-ops-dim uppercase block">Final Drop-Off Point</span>
                <span className="text-ops-text font-medium flex items-start gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{delivery.order?.deliveryAddress}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-ops-border font-mono text-xs">
                <div>
                  <span className="text-[10px] text-ops-dim uppercase block">Payload Weight</span>
                  <span className="font-bold text-white">{delivery.order?.weightKg.toLocaleString()} kg</span>
                </div>
                <div>
                  <span className="text-[10px] text-ops-dim uppercase block">Freight Volume</span>
                  <span className="font-bold text-white">{delivery.order?.volumeM3} m³</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Fleet Assets */}
          <div className="p-4 bg-ops-surface border border-ops-border rounded-xl shadow-panel space-y-3.5">
            <h3 className="text-xs font-mono font-bold text-ops-text uppercase tracking-wider flex items-center gap-2 border-b border-ops-border pb-2">
              <span className="w-1.5 h-3 bg-cyan-400 rounded-xs"></span>
              Assigned Crew & Telematics Asset
            </h3>

            <div className="space-y-3 text-xs">
              {/* Driver Card */}
              <div className="p-3 bg-ops-bg border border-ops-border rounded-lg flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-ops-panel text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-xs">
                  {delivery.driver ? `${delivery.driver.firstName[0]}${delivery.driver.lastName[0]}` : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-white block truncate">
                    {delivery.driver ? `${delivery.driver.firstName} ${delivery.driver.lastName}` : 'Unassigned Driver'}
                  </span>
                  <span className="text-[10px] text-ops-dim font-mono">
                    ID: {delivery.driver?.driverCode || delivery.driver?.code} &bull; {delivery.driver?.phone}
                  </span>
                </div>
              </div>

              {/* Vehicle Card */}
              <div className="p-3 bg-ops-bg border border-ops-border rounded-lg flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-ops-panel text-amber-400 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-white block truncate">
                    {delivery.vehicle?.model || 'Commercial Carrier'}
                  </span>
                  <span className="text-[10px] text-ops-dim font-mono">
                    ASSET: {delivery.vehicle?.code} &bull; {delivery.vehicle?.licensePlate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Proof of Delivery Card (If Delivered) */}
          {delivery.status === 'DELIVERED' && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl shadow-glow-emerald/20 space-y-2.5 text-xs">
              <h3 className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Proof of Delivery (POD)</span>
              </h3>
              <p className="text-ops-dim text-[11px] font-sans">
                Delivered on{' '}
                {delivery.deliveryActualAt
                  ? new Date(delivery.deliveryActualAt).toLocaleString('en-IN')
                  : 'Milestone verified in database'}
              </p>
              {delivery.recipientSignature && (
                <div className="p-2.5 bg-ops-bg border border-emerald-800/50 rounded-lg text-xs font-mono text-emerald-300 shadow-panel">
                  <span className="text-[9px] text-ops-dim uppercase block">CRYPTOGRAPHIC DIGITAL SIGNATURE:</span>
                  <span className="font-bold text-white mt-0.5 block">{delivery.recipientSignature}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Map & Audit Timeline */}
        <div className="lg:col-span-2 space-y-5">
          {/* Corridor Map */}
          <div className="bg-ops-surface border border-ops-border rounded-xl p-4 shadow-panel space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-ops-text uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-3 bg-cyan-400 rounded-xs"></span>
                Corridor Telematics Radar Fix
              </h3>
              <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                COORDINATES: {delivery.currentLat?.toFixed(4)}, {delivery.currentLng?.toFixed(4)}
              </span>
            </div>
            <DeliveryMap
              vehicles={[
                {
                  id: delivery.id,
                  code: delivery.vehicle?.code || 'VEH',
                  lat: delivery.currentLat || 19.076,
                  lng: delivery.currentLng || 72.8777,
                  status: delivery.status,
                  trackingNumber: delivery.trackingNumber,
                  speed: delivery.status === 'IN_TRANSIT' ? 62 : 0,
                },
              ]}
              height="280px"
            />
          </div>

          {/* Chronological Audit Timeline */}
          <div className="bg-ops-surface border border-ops-border rounded-xl p-4 shadow-panel space-y-3">
            <h3 className="text-xs font-mono font-bold text-ops-text uppercase tracking-wider border-b border-ops-border pb-2 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-cyan-400 rounded-xs"></span>
              Milestone Audit Stream ({delivery.timelineEvents?.length || (delivery as any).timeline?.length || 0} Events)
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-ops-border">
              {((delivery.timelineEvents || (delivery as any).timeline) && (delivery.timelineEvents || (delivery as any).timeline).length > 0) ? (
                (delivery.timelineEvents || (delivery as any).timeline).map((evt: any, idx: number) => (
                  <div key={evt.id || idx} className="relative">
                    {/* Event Dot */}
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-ops-surface border-2 border-cyan-400 flex items-center justify-center shadow-glow-cyan">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                    </div>

                    <div className="text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-mono font-bold text-white uppercase tracking-wider">
                          {evt.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-ops-dim font-mono">
                          {new Date(evt.timestamp || evt.recordedAt || Date.now()).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-ops-muted text-xs mt-0.5 font-sans">{evt.description || evt.notes || 'Status confirmed in system'}</p>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-ops-dim mt-1">
                        <span>ACTOR: {evt.recordedBy || evt.createdBy || 'System'}</span>
                        {evt.locationName && <span>LOC: {evt.locationName}</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs font-mono text-ops-dim py-4">No milestone events recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Advance Status Modal */}
      <Modal
        isOpen={isTransitionOpen}
        onClose={() => setIsTransitionOpen(false)}
        title="Advance Delivery Milestone"
      >
        <form onSubmit={handleStatusTransition} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Target Status</label>
            <select
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
              className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono font-bold text-ops-text focus:border-cyan-500"
            >
              <option value="PICKED_UP">PICKED_UP (Cargo Loaded)</option>
              <option value="IN_TRANSIT">IN_TRANSIT (On Corridor)</option>
              <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (Final Mile)</option>
              <option value="DELIVERED">DELIVERED (Final Receipt & POD)</option>
              <option value="DELAYED">DELAYED (Hold / Traffic)</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Author Notes</label>
            <textarea
              rows={2}
              value={transitionNotes}
              onChange={(e) => setTransitionNotes(e.target.value)}
              placeholder="e.g., Cargo verified and signed at pickup depot..."
              className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text focus:border-cyan-500"
            ></textarea>
          </div>

          {nextStatus === 'DELIVERED' && (
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">
                Recipient Digital Signature / Confirmation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={recipientSignature}
                onChange={(e) => setRecipientSignature(e.target.value)}
                placeholder="e.g., Signed by: R. Sharma (Receiving Plant Manager)"
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              />
            </div>
          )}

          {nextStatus === 'DELAYED' && (
            <div>
              <label className="block font-mono text-[11px] font-bold text-ops-dim uppercase mb-1">Delay Root Cause</label>
              <input
                type="text"
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                placeholder="e.g., Highway toll congestion or weather delay..."
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text focus:border-cyan-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
            <button
              type="button"
              onClick={() => setIsTransitionOpen(false)}
              className="px-3.5 py-1.5 bg-ops-panel hover:bg-ops-panelHover border border-ops-border text-ops-muted hover:text-ops-text rounded-md font-mono font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-mono font-bold rounded-md uppercase tracking-wider shadow-glow-cyan disabled:opacity-50"
            >
              {isSubmitting ? 'RECORDING...' : 'CONFIRM MILESTONE'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
