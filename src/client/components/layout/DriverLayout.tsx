import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Hexagon, LogOut, Smartphone, Shield } from 'lucide-react';

export const DriverLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Streamlined Driver Terminal Header */}
      <header className="h-16 bg-[#0F172A] border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm shadow-emerald-500/20">
            <Hexagon className="w-4 h-4 fill-white stroke-emerald-500" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wider text-white flex items-center gap-1.5">
              <span>LOGISTIX</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                DRIVER TERMINAL
              </span>
            </span>
          </div>
        </div>

        {/* Driver Profile & Sign Out */}
        <div className="flex items-center space-x-3">
          <div className="hidden xs:flex flex-col text-right">
            <span className="text-xs font-bold text-white leading-tight">
              {user?.name || 'Driver'}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              Online
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'D'}
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Terminal Viewport */}
      <main className="flex-1 p-3 sm:p-6 max-w-4xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};
