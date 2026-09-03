import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'delivery' | 'vehicle' | 'driver' | 'order' | 'priority' | 'cargo';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'delivery', size = 'sm' }) => {
  const norm = (status || '').toUpperCase();

  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-500';
  let isPulse = false;
  let label = norm.charAt(0) + norm.slice(1).toLowerCase().replace(/_/g, ' ');

  if (type === 'delivery') {
    switch (norm) {
      case 'IN_TRANSIT':
        badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';
        dotColor = 'bg-sky-500';
        isPulse = true;
        label = 'In Transit';
        break;
      case 'OUT_FOR_DELIVERY':
        badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';
        dotColor = 'bg-sky-500';
        isPulse = true;
        label = 'Out for Delivery';
        break;
      case 'PICKED_UP':
        badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';
        dotColor = 'bg-sky-500';
        label = 'Picked Up';
        break;
      case 'DISPATCHED':
        badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';
        dotColor = 'bg-sky-500';
        label = 'Dispatched';
        break;
      case 'DELIVERED':
        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        dotColor = 'bg-emerald-500';
        label = 'Delivered';
        break;
      case 'PENDING':
        badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
        dotColor = 'bg-amber-500';
        label = 'Pending';
        break;
      case 'ASSIGNED':
        badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
        dotColor = 'bg-blue-500';
        label = 'Assigned';
        break;
      case 'ACCEPTED':
        badgeStyle = 'bg-teal-50 text-teal-700 border-teal-200';
        dotColor = 'bg-teal-500';
        label = 'Accepted';
        break;
      case 'DELAYED':
        badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
        dotColor = 'bg-amber-500';
        isPulse = true;
        label = 'Delayed';
        break;
      case 'FAILED':
      case 'CANCELLED':
        badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
        dotColor = 'bg-rose-500';
        label = norm === 'FAILED' ? 'Failed' : 'Cancelled';
        break;
    }
  } else if (type === 'vehicle') {
    switch (norm) {
      case 'ACTIVE':
      case 'AVAILABLE':
        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        dotColor = 'bg-emerald-500';
        label = norm === 'ACTIVE' ? 'Active' : 'Available';
        break;
      case 'ASSIGNED':
      case 'IN_TRANSIT':
        badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';
        dotColor = 'bg-sky-500';
        isPulse = norm === 'IN_TRANSIT';
        label = norm === 'ASSIGNED' ? 'Assigned' : 'In Transit';
        break;
      case 'MAINTENANCE':
        badgeStyle = 'bg-orange-50 text-orange-700 border-orange-200';
        dotColor = 'bg-orange-500';
        isPulse = true;
        label = 'Maintenance';
        break;
      case 'IDLE':
      case 'INACTIVE':
        badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
        dotColor = 'bg-slate-400';
        label = norm === 'IDLE' ? 'Idle' : 'Inactive';
        break;
    }
  } else if (type === 'driver') {
    switch (norm) {
      case 'AVAILABLE':
        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        dotColor = 'bg-emerald-500';
        label = 'Available';
        break;
      case 'ON_DELIVERY':
        badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';
        dotColor = 'bg-sky-500';
        isPulse = true;
        label = 'On Delivery';
        break;
      case 'OFF_DUTY':
        badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
        dotColor = 'bg-slate-400';
        label = 'Off Duty';
        break;
      case 'SUSPENDED':
        badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
        dotColor = 'bg-rose-500';
        label = 'Suspended';
        break;
    }
  } else if (type === 'order') {
    switch (norm) {
      case 'PENDING':
        badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
        dotColor = 'bg-amber-500';
        label = 'Pending';
        break;
      case 'ASSIGNED':
        badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';
        dotColor = 'bg-sky-500';
        label = 'Assigned';
        break;
      case 'DELIVERED':
        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        dotColor = 'bg-emerald-500';
        label = 'Delivered';
        break;
      case 'CANCELLED':
        badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
        dotColor = 'bg-rose-500';
        label = 'Cancelled';
        break;
    }
  } else if (type === 'priority') {
    switch (norm) {
      case 'CRITICAL':
      case 'URGENT':
        badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
        dotColor = 'bg-rose-500';
        isPulse = true;
        label = norm === 'URGENT' ? 'Urgent' : 'Critical';
        break;
      case 'HIGH':
        badgeStyle = 'bg-orange-50 text-orange-700 border-orange-200';
        dotColor = 'bg-orange-500';
        label = 'High';
        break;
      case 'MEDIUM':
      case 'STANDARD':
        badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
        dotColor = 'bg-slate-500';
        label = norm === 'STANDARD' ? 'Standard' : 'Medium';
        break;
      case 'LOW':
        badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
        dotColor = 'bg-slate-400';
        label = 'Low';
        break;
    }
  } else if (type === 'cargo') {
    badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
    dotColor = 'bg-slate-400';
    label = norm.replace(/_/g, ' ');
  }

  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs font-semibold' : 'px-3 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-sans border ${sizeClasses} ${badgeStyle}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {isPulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor}`}></span>
      </span>
      <span>{label}</span>
    </span>
  );
};
