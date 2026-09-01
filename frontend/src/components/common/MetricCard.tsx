import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'accent' | 'emerald' | 'rose' | 'cyan';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtext,
  trend,
  icon,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 bg-white border border-slate-200 rounded-lg shadow-xs transition-colors ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          {label}
        </span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline space-x-1.5">
        <span className="text-2xl font-semibold text-slate-900 tracking-tight">
          {value}
        </span>
        {unit && <span className="text-xs text-slate-500 font-medium">{unit}</span>}
      </div>

      {(subtext || trend) && (
        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
          {subtext && <span className="truncate">{subtext}</span>}
          {trend && (
            <span
              className={`inline-flex items-center font-medium ml-auto ${
                trend.direction === 'up'
                  ? 'text-emerald-700'
                  : trend.direction === 'down'
                  ? 'text-red-700'
                  : 'text-slate-500'
              }`}
            >
              {trend.direction === 'up' && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
              {trend.direction === 'down' && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {trend.value}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};
