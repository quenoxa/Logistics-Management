import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  MapPin,
  Clock,
  Package,
  CheckCircle2,
  PenTool,
  Navigation,
} from 'lucide-react';
import { deliveriesApi } from '../api/client';
import { Delivery } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { DeliveryMap } from '../components/map/DeliveryMap';

export const DeliveryDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitionOpen, setIsTransitionOpen] = useState(false);

  // Transition form state
  const [nextStatus, setNextStatus] = useState('');
  const [transitionNotes, setTransitionNotes] = useState('');
  const [recipientSignature, setRecipientSignature] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await deliveriesApi.getById(id);
      setDelivery(data);
    } catch (err) {
      console.error('Failed to load delivery details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (isLoading || !delivery) {
    return (
      <div className="py-20 text-center text-slate-500 text-xs">
        <div className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></span>
          <span>Loading delivery details...</span>
        </div>
      </div>
    );
  }

  const handleStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextStatus) return;

    try {
      setIsSubmitting(true);
      await deliveriesApi.transitionStatus(delivery.id, {
        nextStatus,
        notes: transitionNotes,
        recipientSignature: nextStatus === 'DELIVERED' ? recipientSignature : undefined,
        delayReason: nextStatus === 'DELAYED' ? delayReason : undefined,
        locationName: nextStatus === 'DELIVERED' ? delivery.order.deliveryAddress : 'Corridor checkpoint',
      });
      setIsTransitionOpen(false);
      setTransitionNotes('');
      setRecipientSignature('');
      setDelayReason('');
      await fetchDetails();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to advance status transition');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Delivery {delivery.trackingNumber}
              </h1>
              <StatusBadge status={delivery.status} type="delivery" />
              <StatusBadge status={delivery.priority} type="priority" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Order #{delivery.order.orderNumber} &bull; Created {new Date(delivery.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => navigate('/tracking')}
            className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>View on live map</span>
          </button>

          {delivery.status !== 'DELIVERED' && delivery.status !== 'CANCELLED' && (
            <button
              onClick={() => setIsTransitionOpen(true)}
              className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Update status</span>
            </button>
          )}
        </div>
      </div>

      {/* State Machine Step Visualizer */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <h3 className="text-xs font-semibold text-slate-700 mb-3">
          Delivery progress
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStatusIndex;
            const isCurrent = idx === currentStatusIndex;
            return (
              <div
                key={step.key}
                className={`p-2.5 rounded-md border text-xs transition-colors ${
                  isCurrent
                    ? 'bg-slate-900 border-slate-900 text-white font-medium'
                    : isCompleted
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] opacity-75">0{idx + 1}</span>
                  {isCompleted ? (
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-emerald-600'}`} />
                  ) : (
                    <Clock className="w-3.5 h-3.5 opacity-40" />
                  )}
                </div>
                <div className="text-[11px] leading-tight">{step.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Info Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Manifest & Assigned Personnel */}
        <div className="space-y-5">
          {/* Customer & Cargo Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2.5">
              <Package className="w-4 h-4 text-slate-500" />
              <span>Shipment & cargo details</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Customer:</span>
                <span className="text-slate-900 font-medium">{delivery.order.customerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Cargo type:</span>
                <StatusBadge status={delivery.order.cargoType} type="cargo" />
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Total weight:</span>
                <span className="text-slate-900 font-medium">{delivery.order.weightKg.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Volume:</span>
                <span className="text-slate-700">{delivery.order.volumeM3} m³</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Distance / Est. time:</span>
                <span className="text-slate-900 font-medium">{delivery.routeDistanceKm} km ({delivery.routeDurationMin} min)</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block mb-1">Destination:</span>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-800 flex items-start gap-1.5 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>{delivery.order.deliveryAddress}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Driver & Vehicle Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2.5">
              <Truck className="w-4 h-4 text-slate-500" />
              <span>Assigned vehicle & driver</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Driver</span>
                  <span className="font-medium text-slate-700">{delivery.driver.code}</span>
                </div>
                <div className="text-slate-900 font-medium">
                  {delivery.driver.firstName} {delivery.driver.lastName}
                </div>
                <div className="text-[11px] text-slate-500">
                  {delivery.driver.phone} &bull; {delivery.driver.licenseClass}
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Vehicle</span>
                  <span className="font-medium text-slate-700">{delivery.vehicle.code}</span>
                </div>
                <div className="text-slate-900 font-medium">
                  {delivery.vehicle.make} {delivery.vehicle.model}
                </div>
                <div className="text-[11px] text-slate-500">
                  Plate: {delivery.vehicle.licensePlate} &bull; Fuel: {delivery.vehicle.currentFuelPercent}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Route Map & Step Timeline Logs */}
        <div className="lg:col-span-2 space-y-5">
          {/* Route Map */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-slate-500" />
              <span>Route map</span>
            </h3>

            <DeliveryMap
              origin={{
                lat: delivery.order.pickupLat,
                lng: delivery.order.pickupLng,
                label: `Pickup: ${delivery.order.pickupAddress}`,
              }}
              destination={{
                lat: delivery.order.deliveryLat,
                lng: delivery.order.deliveryLng,
                label: `Delivery: ${delivery.order.deliveryAddress}`,
              }}
              currentPosition={
                delivery.currentLat && delivery.currentLng
                  ? { lat: delivery.currentLat, lng: delivery.currentLng }
                  : undefined
              }
              height="280px"
            />
          </div>

          {/* Timestamped Timeline History */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Audit timeline & status history</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              {delivery.timelineEvents && delivery.timelineEvents.length > 0 ? (
                delivery.timelineEvents.map((evt) => (
                  <div key={evt.id} className="relative pl-5 pb-3 border-l-2 border-slate-200 last:border-l-0 last:pb-0">
                    <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-slate-700"></span>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium text-slate-900">{evt.title}</div>
                      <span className="text-[11px] text-slate-400">{new Date(evt.recordedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600 text-xs mt-0.5">{evt.description}</p>
                    <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-3">
                      {evt.locationName && <span>Location: {evt.locationName}</span>}
                      {evt.recordedBy && <span>By: {evt.recordedBy}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-4">No timeline events recorded yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* State Transition Modal */}
      <Modal
        isOpen={isTransitionOpen}
        onClose={() => setIsTransitionOpen(false)}
        title={`Update status: ${delivery.trackingNumber}`}
        subtitle={`Current Status: ${delivery.status}`}
        maxWidth="lg"
      >
        <form onSubmit={handleStatusTransition} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 font-semibold block mb-1">Target next status</label>
            <select
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
              required
              className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-500"
            >
              <option value="">Select Next Status...</option>
              {delivery.status === 'DISPATCHED' && <option value="PICKED_UP">PICKED_UP - Cargo Loaded</option>}
              {delivery.status === 'PICKED_UP' && <option value="IN_TRANSIT">IN_TRANSIT - Departed on Route</option>}
              {delivery.status === 'IN_TRANSIT' && (
                <>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY - Approaching Destination</option>
                  <option value="DELAYED">DELAYED - Traffic / Issue Flagged</option>
                </>
              )}
              {delivery.status === 'DELAYED' && <option value="IN_TRANSIT">IN_TRANSIT - Resume Route</option>}
              {delivery.status === 'OUT_FOR_DELIVERY' && <option value="DELIVERED">DELIVERED - Confirmed POD</option>}
              <option value="CANCELLED">CANCELLED - Abort Dispatch</option>
            </select>
          </div>

          {nextStatus === 'DELIVERED' && (
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Recipient signature / Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Ramesh Kumar (Store Manager)"
                value={recipientSignature}
                onChange={(e) => setRecipientSignature(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-500"
              />
            </div>
          )}

          {nextStatus === 'DELAYED' && (
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Reason for delay <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-500"
              >
                <option value="">Select Reason...</option>
                <option value="TRAFFIC_CONGESTION">Traffic / Highway Congestion</option>
                <option value="WEATHER_CONDITIONS">Heavy Monsoon / Severe Weather</option>
                <option value="VEHICLE_ISSUE">Mechanical / Tire Pressure Check</option>
                <option value="DOCK_DELAY">Receiving Bay Congestion</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Notes & operator comments</label>
            <textarea
              rows={3}
              placeholder="Provide milestone details..."
              value={transitionNotes}
              onChange={(e) => setTransitionNotes(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsTransitionOpen(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !nextStatus}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md shadow-xs disabled:opacity-40"
            >
              {isSubmitting ? 'Updating...' : 'Confirm status change'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
