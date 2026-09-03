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
        locationName: nextStatus === 'DELIVERED' ? (delivery.order?.deliveryAddress || delivery.deliveryAddress) : 'Corridor Checkpoint',
      });
      success('Milestone Logged', `Shipment advanced to ${nextStatus.replace(/_/g, ' ')}.`);
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
      <div className="space-y-6 pb-12 font-sans text-slate-800">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
          <Skeleton className="w-8 h-8 rounded-xl bg-white" />
          <div className="space-y-1">
            <Skeleton className="w-48 h-6 bg-white" />
            <Skeleton className="w-32 h-4 bg-white" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  // Workflow Timeline Stages
  const stages = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'ASSIGNED', label: 'Assigned' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'PICKED_UP', label: 'Picked Up' },
    { key: 'IN_TRANSIT', label: 'In Transit' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === delivery.status);

  // Map markers
  const mapVehicles = delivery.currentLat && delivery.currentLng
    ? [
        {
          id: delivery.id,
          code: delivery.vehicle?.code || 'VEH',
          lat: delivery.currentLat,
          lng: delivery.currentLng,
          status: delivery.status,
          trackingNumber: delivery.trackingNumber,
          speed: delivery.status === 'IN_TRANSIT' ? 62 : 35,
        },
      ]
    : [];

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/deliveries')}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition shadow-sm"
            title="Back to deliveries"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                #{delivery.trackingNumber}
              </h1>
              <StatusBadge status={delivery.status} type="delivery" />
            </div>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Consignee: <span className="font-bold text-slate-900">{delivery.order?.customerName || delivery.customerName}</span> &bull; Created {new Date(delivery.createdAt).toLocaleDateString('en-US')}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setNextStatus('IN_TRANSIT');
            setIsTransitionOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Update Status Milestone</span>
        </button>
      </div>

      {/* Visual Status Timeline Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Milestone Progression Pipeline
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
          {stages.map((st, idx) => {
            const isCompleted = currentStageIndex >= idx;
            const isCurrent = currentStageIndex === idx;

            return (
              <div
                key={st.key}
                className={`p-3 rounded-xl border transition ${
                  isCurrent
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm font-bold'
                    : isCompleted
                    ? 'bg-slate-50 border-slate-200 text-emerald-700 font-semibold'
                    : 'bg-white border-slate-100 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  )}
                </div>
                <span>{st.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer & Route Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-3">
              Customer & Route Manifest
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 font-bold uppercase block">Pickup Origin</span>
                <p className="text-slate-900 font-semibold">{delivery.order?.pickupAddress || delivery.pickupAddress}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 font-bold uppercase block">Destination Drop-off</span>
                <p className="text-slate-900 font-semibold">{delivery.order?.deliveryAddress || delivery.deliveryAddress}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-center">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Cargo Weight</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{(delivery.order?.weightKg || delivery.packageWeight || 1000).toLocaleString()} kg</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Distance</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{delivery.routeDistanceKm || 145} km</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Priority</span>
                <span className="font-bold text-emerald-600 mt-0.5 block">{delivery.priority}</span>
              </div>
            </div>
          </div>

          {/* Route Map */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Corridor Telematics Map
            </h3>
            <DeliveryMap vehicles={mapVehicles} height="320px" />
          </div>
        </div>

        {/* Right Column: Assigned Driver & Vehicle Cards */}
        <div className="space-y-6">
          {/* Driver Card */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-3">
              Assigned Commercial Driver
            </h3>

            {delivery.driver ? (
              <div className="flex items-center space-x-3 text-xs">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center border border-emerald-200">
                  {delivery.driver.firstName[0]}{delivery.driver.lastName[0]}
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">{delivery.driver.firstName} {delivery.driver.lastName}</span>
                  <span className="text-slate-500 font-mono">{delivery.driver.phone}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2">No driver assigned</p>
            )}
          </div>

          {/* Vehicle Card */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-3">
              Assigned Fleet Asset
            </h3>

            {delivery.vehicle ? (
              <div className="text-xs space-y-1">
                <span className="font-mono font-bold text-emerald-600 text-sm block">{delivery.vehicle.code}</span>
                <span className="text-slate-900 font-medium block">{delivery.vehicle.make || delivery.vehicle.manufacturer} {delivery.vehicle.model}</span>
                <span className="text-slate-500 font-mono text-[11px] block">{delivery.vehicle.licensePlate}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2">No vehicle assigned</p>
            )}
          </div>

          {/* Recipient POD Signature if Delivered */}
          {delivery.recipientSignature && (
            <div className="p-6 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase block flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Proof of Delivery (POD)
              </span>
              <p className="text-xs font-mono font-bold text-slate-900">{delivery.recipientSignature}</p>
            </div>
          )}
        </div>
      </div>

      {/* Transition Modal */}
      <Modal isOpen={isTransitionOpen} onClose={() => setIsTransitionOpen(false)} title="Update Milestone Stage">
        <form onSubmit={handleStatusTransition} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Next Status Stage *</label>
            <select
              required
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold"
            >
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="PICKED_UP">PICKED UP</option>
              <option value="IN_TRANSIT">IN TRANSIT</option>
              <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
              <option value="DELIVERED">DELIVERED (Final POD)</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {nextStatus === 'DELIVERED' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Recipient Name Signature *</label>
              <input
                type="text"
                required
                value={recipientSignature}
                onChange={(e) => setRecipientSignature(e.target.value)}
                placeholder="Signed by: S. Deshmukh"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Milestone Notes</label>
            <textarea
              rows={2}
              value={transitionNotes}
              onChange={(e) => setTransitionNotes(e.target.value)}
              placeholder="Operational log notes..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsTransitionOpen(false)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Commit Status Stage'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
