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
  icon = <PackageOpen className="w-7 h-7 text-ops-dim" />,
  action,
  className = '',
}) => {
  return (
    <div className={`p-10 text-center flex flex-col items-center justify-center bg-ops-surface/80 border border-dashed border-ops-border rounded-lg ${className}`}>
      <div className="w-12 h-12 rounded-full bg-ops-panel border border-ops-border flex items-center justify-center mb-3 text-ops-dim shadow-panel">
        {icon}
      </div>
      <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-ops-text">{title}</h3>
      <p className="text-xs text-ops-dim mt-1 max-w-sm font-sans">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-all shadow-glow-cyan"
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};
