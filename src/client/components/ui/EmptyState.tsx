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
  icon = <PackageOpen className="w-8 h-8 text-[#71839A]" />,
  action,
  className = '',
}) => {
  return (
    <div className={`p-10 text-center flex flex-col items-center justify-center bg-[#162238] border border-dashed border-[#263852] rounded-xl ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-[#111A2B] border border-[#263852] flex items-center justify-center mb-3 text-[#71839A]">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-[#F8FAFC] font-sans">{title}</h3>
      <p className="text-sm text-[#A9B7C9] mt-1 max-w-sm font-sans leading-normal">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 rounded-lg bg-[#D4A84F] hover:bg-[#E5BC68] text-[#0B1220] text-sm font-semibold inline-flex items-center gap-2 transition-all shadow-sm"
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};
