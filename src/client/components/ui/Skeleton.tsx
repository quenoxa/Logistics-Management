import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`animate-pulse bg-ops-panel/80 rounded ${className}`} />;
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-lg bg-ops-surface border border-ops-border shadow-panel space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-4 bg-ops-panel" />
        <Skeleton className="w-8 h-8 rounded-md bg-ops-panel" />
      </div>
      <Skeleton className="w-16 h-7 bg-ops-panel" />
      <Skeleton className="w-32 h-3 bg-ops-panel" />
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-ops-surface border border-ops-border rounded-lg overflow-hidden shadow-panel">
      <div className="h-10 bg-ops-bg border-b border-ops-border px-4 flex items-center justify-between">
        <Skeleton className="w-32 h-4 bg-ops-panel" />
        <Skeleton className="w-24 h-4 bg-ops-panel" />
      </div>
      <div className="divide-y divide-ops-border/40">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between space-x-4 bg-ops-surface">
            <Skeleton className="w-1/4 h-4 bg-ops-panel" />
            <Skeleton className="w-1/4 h-4 bg-ops-panel" />
            <Skeleton className="w-1/6 h-4 bg-ops-panel" />
            <Skeleton className="w-1/6 h-4 bg-ops-panel" />
            <Skeleton className="w-12 h-6 rounded-md bg-ops-panel" />
          </div>
        ))}
      </div>
    </div>
  );
};
