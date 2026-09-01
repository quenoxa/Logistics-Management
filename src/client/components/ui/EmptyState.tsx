import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no active entries matching your current filters.',
  icon = <PackageOpen className="w-8 h-8 text-slate-400" />,
  action,
  className = '',
}) => {
  return (
    <div className={`p-10 text-center flex flex-col items-center justify-center bg-white border border-dashed border-slate-300 rounded-lg ${className}`}>
      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-800 tracking-tight">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-xs"
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};
