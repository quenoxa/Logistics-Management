import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, LogOut, Menu, Radio, Shield, Activity } from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const roleLabelMap: Record<string, { label: string; badge: string }> = {
    ADMIN: { label: 'COMMAND ADMIN', badge: 'bg-rose-950/50 text-rose-300 border-rose-800/40' },
    DISPATCHER: { label: 'CHIEF DISPATCHER', badge: 'bg-cyan-950/50 text-cyan-300 border-cyan-800/40' },
    FLEET_MANAGER: { label: 'FLEET CONTROLLER', badge: 'bg-indigo-950/50 text-indigo-300 border-indigo-800/40' },
    DRIVER: { label: 'COMMERCIAL DRIVER', badge: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40' },
  };

  const roleInfo = roleLabelMap[user?.role || 'DISPATCHER'] || {
    label: user?.role || 'OPERATOR',
    badge: 'bg-slate-800/60 text-slate-300 border-slate-700/50',
  };

  return (
    <header className="h-14 border-b border-ops-border bg-ops-surface/90 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-panel">
      {/* Left Operations Status & Mobile Toggle */}
      <div className="flex items-center space-x-3 md:space-x-5">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 rounded-md text-ops-muted hover:text-ops-text hover:bg-ops-panel transition-colors border border-ops-border"
            title="Open navigation menu"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center space-x-2 px-2.5 py-1 rounded-md bg-ops-bg border border-ops-border">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono tracking-wider text-emerald-400 font-semibold uppercase">
            System Online
          </span>
        </div>

        <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-md bg-ops-panel border border-ops-border text-xs text-ops-muted">
          <Clock className="w-3.5 h-3.5 text-ops-accent" />
          <span className="hidden md:inline text-[11px] uppercase tracking-wider text-ops-dim font-medium">Hub IST:</span>
          <span className="font-mono text-ops-text font-bold tracking-widest">{timeStr}</span>
        </div>
      </div>

      {/* Right User & Controls */}
      <div className="flex items-center space-x-2.5 md:space-x-3">
        {/* Role Pill */}
        <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border shadow-2xs ${roleInfo.badge}`}>
          {roleInfo.label}
        </span>

        {/* User Profile */}
        <div className="flex items-center space-x-2.5 md:space-x-3 pl-2.5 md:pl-3 border-l border-ops-border">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-ops-text leading-none tracking-tight">{user?.name || 'Operator'}</p>
            <p className="text-[10px] font-mono text-ops-dim mt-0.5 truncate max-w-[150px]">{user?.email}</p>
          </div>
          <div className="relative">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt="User avatar"
              className="w-7 h-7 rounded-full border border-ops-accent/40 object-cover ring-1 ring-ops-accent/20"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-ops-surface"></span>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-md hover:bg-rose-950/30 text-ops-dim hover:text-rose-400 hover:border-rose-900/40 border border-transparent transition-all"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
