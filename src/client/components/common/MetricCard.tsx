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
  variant?: 'default' | 'gold' | 'emerald' | 'rose' | 'blue' | 'amber' | 'accent' | 'cyan';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtext,
  trend,
  icon,
  variant = 'default',
  onClick,
}) => {
  const iconBg =
    variant === 'emerald' || variant === 'gold' || variant === 'accent'
      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
      : variant === 'rose'
      ? 'bg-rose-50 text-rose-600 border-rose-200'
      : variant === 'blue' || variant === 'cyan'
      ? 'bg-sky-50 text-sky-600 border-sky-200'
      : variant === 'amber'
      ? 'bg-amber-50 text-amber-600 border-amber-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <div
      onClick={onClick}
      className={`p-5 bg-white border border-slate-200 rounded-2xl shadow-sm transition-all relative overflow-hidden group hover:shadow-md hover:border-slate-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className={`p-2.5 rounded-xl border ${iconBg} transition-colors`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline space-x-1.5">
        <span className="text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </span>
        {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
      </div>

      {(subtext || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5">
          {subtext && <span className="truncate text-xs text-slate-500">{subtext}</span>}
          {trend && (
            <span
              className={`inline-flex items-center font-semibold text-xs ml-auto ${
                trend.direction === 'up'
                  ? 'text-emerald-600'
                  : trend.direction === 'down'
                  ? 'text-rose-600'
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
