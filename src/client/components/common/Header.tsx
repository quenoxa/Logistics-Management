import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, LogOut, Menu } from 'lucide-react';

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
    ADMIN: { label: 'Administrator', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
    DISPATCHER: { label: 'Dispatcher', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    FLEET_MANAGER: { label: 'Fleet Manager', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
    DRIVER: { label: 'Driver', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  };

  const roleInfo = roleLabelMap[user?.role || 'DISPATCHER'] || {
    label: user?.role || 'User',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left Operations Status & Mobile Toggle */}
      <div className="flex items-center space-x-3 md:space-x-5">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
            title="Open navigation menu"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"></span>
          <span className="text-xs font-medium text-slate-600">
            Operations active
          </span>
        </div>

        <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Hub time (IST):</span>
          <span className="font-mono text-slate-800 font-semibold">{timeStr}</span>
        </div>
      </div>

      {/* Right User & Controls */}
      <div className="flex items-center space-x-2.5 md:space-x-3">
        {/* Role Pill */}
        <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${roleInfo.badge}`}>
          {roleInfo.label}
        </span>

        {/* User Profile */}
        <div className="flex items-center space-x-2.5 md:space-x-3 pl-2.5 md:pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-slate-900 leading-none">{user?.name || 'Operator'}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[150px]">{user?.email}</p>
          </div>
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt="User avatar"
            className="w-7 h-7 rounded-full border border-slate-200 object-cover"
          />
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
