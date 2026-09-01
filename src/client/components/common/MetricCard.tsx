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
  variant?: 'default' | 'accent' | 'emerald' | 'rose' | 'cyan' | 'amber';
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
  const variantGlow: Record<string, string> = {
    default: 'border-ops-border hover:border-ops-borderLight',
    accent: 'border-cyan-900/50 hover:border-cyan-500/50 shadow-glow-cyan',
    cyan: 'border-cyan-900/50 hover:border-cyan-500/50 shadow-glow-cyan',
    emerald: 'border-emerald-900/50 hover:border-emerald-500/50 shadow-glow-emerald',
    amber: 'border-amber-900/50 hover:border-amber-500/50 shadow-glow-amber',
    rose: 'border-rose-900/50 hover:border-rose-500/50 shadow-glow-rose',
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 bg-ops-surface border rounded-lg shadow-panel transition-all relative overflow-hidden group ${
        variantGlow[variant] || variantGlow.default
      } ${onClick ? 'cursor-pointer hover:bg-ops-panel' : ''}`}
    >
      {/* Top subtle glow line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-cyan-400/40 transition-all"></div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-semibold tracking-wider text-ops-dim uppercase">
          {label}
        </span>
        {icon && (
          <div className="p-1.5 rounded-md bg-ops-bg border border-ops-border/60 text-ops-muted group-hover:text-ops-accent transition-colors">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline space-x-1.5">
        <span className="text-2xl font-mono font-bold text-ops-text tracking-tight group-hover:text-white transition-colors">
          {value}
        </span>
        {unit && <span className="text-xs font-mono text-ops-dim font-medium">{unit}</span>}
      </div>

      {(subtext || trend) && (
        <div className="mt-2 flex items-center justify-between text-xs text-ops-dim border-t border-ops-border/40 pt-1.5">
          {subtext && <span className="truncate text-[11px] text-ops-muted font-medium">{subtext}</span>}
          {trend && (
            <span
              className={`inline-flex items-center font-mono text-[11px] font-bold ml-auto ${
                trend.direction === 'up'
                  ? 'text-emerald-400'
                  : trend.direction === 'down'
                  ? 'text-rose-400'
                  : 'text-ops-dim'
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
