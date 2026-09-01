import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'delivery' | 'vehicle' | 'driver' | 'order' | 'priority' | 'cargo';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'delivery', size = 'sm' }) => {
  const norm = (status || '').toUpperCase();

  let badgeStyle = 'bg-slate-900/60 text-slate-300 border-slate-700/60';
  let dotColor = 'bg-slate-400';
  let isPulse = false;
  let label = norm.replace(/_/g, ' ');

  if (type === 'delivery') {
    switch (norm) {
      case 'IN_TRANSIT':
        badgeStyle = 'bg-sky-950/60 text-sky-300 border-sky-800/50 shadow-glow-cyan/20';
        dotColor = 'bg-sky-400';
        isPulse = true;
        label = 'IN TRANSIT';
        break;
      case 'OUT_FOR_DELIVERY':
        badgeStyle = 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50 shadow-glow-cyan/20';
        dotColor = 'bg-cyan-400';
        isPulse = true;
        label = 'OUT FOR DELIVERY';
        break;
      case 'PICKED_UP':
        badgeStyle = 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50';
        dotColor = 'bg-indigo-400';
        label = 'PICKED UP';
        break;
      case 'DISPATCHED':
        badgeStyle = 'bg-slate-800/60 text-slate-200 border-slate-700/60';
        dotColor = 'bg-slate-400';
        label = 'DISPATCHED';
        break;
      case 'DELIVERED':
        badgeStyle = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50 shadow-glow-emerald/20';
        dotColor = 'bg-emerald-400';
        label = 'DELIVERED';
        break;
      case 'DELAYED':
        badgeStyle = 'bg-amber-950/60 text-amber-300 border-amber-800/50 shadow-glow-amber/20';
        dotColor = 'bg-amber-400';
        isPulse = true;
        label = 'DELAYED';
        break;
      case 'FAILED':
      case 'CANCELLED':
        badgeStyle = 'bg-rose-950/60 text-rose-300 border-rose-800/50';
        dotColor = 'bg-rose-400';
        label = norm === 'FAILED' ? 'FAILED' : 'CANCELLED';
        break;
    }
  } else if (type === 'vehicle') {
    switch (norm) {
      case 'ACTIVE':
        badgeStyle = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50';
        dotColor = 'bg-emerald-400';
        label = 'ACTIVE';
        break;
      case 'IN_TRANSIT':
        badgeStyle = 'bg-sky-950/60 text-sky-300 border-sky-800/50';
        dotColor = 'bg-sky-400';
        isPulse = true;
        label = 'IN TRANSIT';
        break;
      case 'MAINTENANCE':
        badgeStyle = 'bg-rose-950/60 text-rose-300 border-rose-800/50 shadow-glow-rose/20';
        dotColor = 'bg-rose-400';
        isPulse = true;
        label = 'MAINTENANCE';
        break;
      case 'IDLE':
      case 'INACTIVE':
        badgeStyle = 'bg-slate-800/60 text-slate-300 border-slate-700/60';
        dotColor = 'bg-slate-400';
        label = 'IDLE';
        break;
    }
  } else if (type === 'driver') {
    switch (norm) {
      case 'AVAILABLE':
        badgeStyle = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50 shadow-glow-emerald/20';
        dotColor = 'bg-emerald-400';
        label = 'AVAILABLE';
        break;
      case 'ON_DELIVERY':
        badgeStyle = 'bg-sky-950/60 text-sky-300 border-sky-800/50';
        dotColor = 'bg-sky-400';
        isPulse = true;
        label = 'ON DELIVERY';
        break;
      case 'OFF_DUTY':
        badgeStyle = 'bg-slate-800/60 text-slate-400 border-slate-700/60';
        dotColor = 'bg-slate-500';
        label = 'OFF DUTY';
        break;
      case 'SUSPENDED':
        badgeStyle = 'bg-rose-950/60 text-rose-300 border-rose-800/50';
        dotColor = 'bg-rose-400';
        label = 'SUSPENDED';
        break;
    }
  } else if (type === 'order') {
    switch (norm) {
      case 'PENDING':
        badgeStyle = 'bg-amber-950/60 text-amber-300 border-amber-800/50';
        dotColor = 'bg-amber-400';
        label = 'PENDING';
        break;
      case 'ASSIGNED':
        badgeStyle = 'bg-sky-950/60 text-sky-300 border-sky-800/50';
        dotColor = 'bg-sky-400';
        label = 'ASSIGNED';
        break;
      case 'DELIVERED':
        badgeStyle = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50';
        dotColor = 'bg-emerald-400';
        label = 'DELIVERED';
        break;
      case 'CANCELLED':
        badgeStyle = 'bg-rose-950/60 text-rose-300 border-rose-800/50';
        dotColor = 'bg-rose-400';
        label = 'CANCELLED';
        break;
    }
  } else if (type === 'priority') {
    switch (norm) {
      case 'CRITICAL':
        badgeStyle = 'bg-rose-950/70 text-rose-300 border-rose-700/60 shadow-glow-rose/30';
        dotColor = 'bg-rose-400';
        isPulse = true;
        label = 'CRITICAL';
        break;
      case 'HIGH':
        badgeStyle = 'bg-amber-950/60 text-amber-300 border-amber-800/50';
        dotColor = 'bg-amber-400';
        label = 'HIGH';
        break;
      case 'MEDIUM':
        badgeStyle = 'bg-sky-950/60 text-sky-300 border-sky-800/50';
        dotColor = 'bg-sky-400';
        label = 'MEDIUM';
        break;
      case 'LOW':
        badgeStyle = 'bg-slate-800/60 text-slate-400 border-slate-700/60';
        dotColor = 'bg-slate-500';
        label = 'LOW';
        break;
    }
  } else if (type === 'cargo') {
    badgeStyle = 'bg-ops-panel text-ops-muted border-ops-border';
    dotColor = 'bg-ops-dim';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-mono font-bold tracking-wider border shadow-2xs ${sizeClasses} ${badgeStyle}`}
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
