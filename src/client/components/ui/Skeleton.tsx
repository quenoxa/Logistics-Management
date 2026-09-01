import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`animate-pulse bg-slate-200/80 rounded ${className}`} />;
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-8 h-8 rounded-md" />
      </div>
      <Skeleton className="w-16 h-7" />
      <Skeleton className="w-32 h-3" />
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
      <div className="h-10 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between">
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-24 h-4" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between space-x-4">
            <Skeleton className="w-1/4 h-4" />
            <Skeleton className="w-1/4 h-4" />
            <Skeleton className="w-1/6 h-4" />
            <Skeleton className="w-1/6 h-4" />
            <Skeleton className="w-12 h-6 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
};
