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
      success('Status Updated', `Delivery advanced to ${nextStatus.replace(/_/g, ' ')}.`);
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
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
          <Skeleton className="w-8 h-8 rounded-md" />
          <div className="space-y-1">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-32 h-4" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-80 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'PENDING', label: 'Order Registered' },
    { key: 'DISPATCHED', label: 'Dispatched' },
    { key: 'PICKED_UP', label: 'Picked Up' },
    { key: 'IN_TRANSIT', label: 'In Transit' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' },
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/deliveries')}
            className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition-colors"
            title="Back to Deliveries"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                {delivery.trackingNumber}
              </h1>
              <StatusBadge status={delivery.status} type="delivery" />
              <StatusBadge status={delivery.order?.priority || 'MEDIUM'} type="priority" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Order #{delivery.order?.orderNumber} &bull; Created {new Date(delivery.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
              className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Advance Milestone</span>
            </button>
          )}
        </div>
      </div>

      {/* 6-Stage Progress Stepper */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStatusIndex;
            const isCurrent = idx === currentStatusIndex;
            return (
              <div key={step.key} className="flex flex-col items-center text-center p-2 rounded-md">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-colors ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isCurrent
                      ? 'text-slate-900 font-bold'
                      : isCompleted
                      ? 'text-slate-700'
                      : 'text-slate-400'
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
          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Package className="w-3.5 h-3.5 text-slate-500" />
              <span>Customer & Manifest</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Customer</span>
                <span className="font-semibold text-slate-800">{delivery.order?.customerName}</span>
                <span className="text-slate-500 text-[11px] block">{delivery.order?.customerPhone}</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Origin Facility</span>
                <span className="text-slate-700 font-medium flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{delivery.order?.pickupAddress}</span>
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Destination</span>
                <span className="text-slate-700 font-medium flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{delivery.order?.deliveryAddress}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Cargo Weight</span>
                  <span className="font-semibold text-slate-800">{delivery.order?.weightKg.toLocaleString()} kg</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Volume</span>
                  <span className="font-semibold text-slate-800">{delivery.order?.volumeM3} m³</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Fleet Assets */}
          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Truck className="w-3.5 h-3.5 text-slate-500" />
              <span>Assigned Fleet Assets</span>
            </h3>

            <div className="space-y-3 text-xs">
              {/* Driver Card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                  {delivery.driver ? `${delivery.driver.firstName[0]}${delivery.driver.lastName[0]}` : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-900 block truncate">
                    {delivery.driver ? `${delivery.driver.firstName} ${delivery.driver.lastName}` : 'Unassigned Driver'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {delivery.driver?.driverCode} &bull; {delivery.driver?.phone}
                  </span>
                </div>
              </div>

              {/* Vehicle Card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-3">
                <div className="w-8 h-8 rounded-md bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-900 block truncate">
                    {delivery.vehicle?.model || 'Commercial Carrier'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {delivery.vehicle?.code} &bull; {delivery.vehicle?.licensePlate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Proof of Delivery Card (If Delivered) */}
          {delivery.status === 'DELIVERED' && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg shadow-2xs space-y-2 text-xs">
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Proof of Delivery (POD)</span>
              </h3>
              <p className="text-slate-600 text-[11px]">
                Delivered on{' '}
                {delivery.actualDeliveryTime
                  ? new Date(delivery.actualDeliveryTime).toLocaleString('en-IN')
                  : 'Milestone verified'}
              </p>
              {delivery.recipientSignature && (
                <div className="p-2.5 bg-white border border-emerald-200 rounded text-xs font-mono text-slate-800">
                  <span className="text-[10px] text-slate-400 block">Digital Signature:</span>
                  <span className="font-semibold">{delivery.recipientSignature}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Map & Audit Timeline */}
        <div className="lg:col-span-2 space-y-5">
          {/* Corridor Map */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Corridor Telematics Radar
            </h3>
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
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Milestone Audit Stream ({delivery.timeline?.length || 0} Events)
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {delivery.timeline && delivery.timeline.length > 0 ? (
                delivery.timeline.map((evt, idx) => (
                  <div key={evt.id || idx} className="relative">
                    {/* Event Dot */}
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                    </div>

                    <div className="text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-semibold text-slate-900">
                          {evt.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(evt.timestamp || evt.recordedAt || Date.now()).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs mt-0.5">{evt.notes || 'Status confirmed'}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>Author: {evt.createdBy || 'System'}</span>
                        {evt.locationName && <span>Location: {evt.locationName}</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4">No timeline events recorded yet.</p>
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
        <form onSubmit={handleStatusTransition} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Target Status</label>
            <select
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-900"
            >
              <option value="PICKED_UP">PICKED_UP (Cargo Loaded)</option>
              <option value="IN_TRANSIT">IN_TRANSIT (On Corridor)</option>
              <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (Final Mile)</option>
              <option value="DELIVERED">DELIVERED (Final Receipt)</option>
              <option value="DELAYED">DELAYED (Hold / Traffic)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Author Notes</label>
            <textarea
              rows={2}
              value={transitionNotes}
              onChange={(e) => setTransitionNotes(e.target.value)}
              placeholder="e.g., Cargo verified and signed at pickup depot..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
            ></textarea>
          </div>

          {nextStatus === 'DELIVERED' && (
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Recipient Digital Signature / Confirmation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={recipientSignature}
                onChange={(e) => setRecipientSignature(e.target.value)}
                placeholder="e.g., Signed by: R. Sharma (Receiving Plant Manager)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
          )}

          {nextStatus === 'DELAYED' && (
            <div>
              <label className="block text-slate-700 font-medium mb-1">Delay Root Cause</label>
              <input
                type="text"
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                placeholder="e.g., Highway toll congestion or weather delay..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsTransitionOpen(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-md font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium shadow-2xs disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Confirm Milestone'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
