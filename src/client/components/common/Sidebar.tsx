import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Navigation,
  BarChart3,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  Layers,
  Wrench,
  AlertCircle,
  X,
  LogOut,
  Hexagon,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const role = user?.role || 'DISPATCHER';

  interface NavSection {
    title: string;
    visible: boolean;
    items: {
      to: string;
      label: string;
      icon: React.ReactNode;
      visible: boolean;
      badge?: string;
    }[];
  }

  const navSections: NavSection[] = [
    {
      title: 'OPERATIONS',
      visible: role !== 'DRIVER',
      items: [
        {
          to: '/',
          label: 'Dashboard',
          icon: <LayoutDashboard className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/orders',
          label: role === 'VIEWER' ? 'Orders' : 'Orders & Booking',
          icon: <Package className="w-4 h-4" />,
          visible: role !== 'DRIVER',
        },
        {
          to: '/deliveries',
          label: 'Deliveries',
          icon: <Truck className="w-4 h-4" />,
          visible: role !== 'DRIVER',
        },
        {
          to: '/tracking',
          label: 'Live Tracking',
          icon: <Navigation className="w-4 h-4" />,
          visible: role !== 'DRIVER',
          badge: 'LIVE',
        },
        {
          to: '/issues',
          label: role === 'VIEWER' ? 'Incidents' : 'Issues & Incidents',
          icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
          visible: role !== 'DRIVER',
        },
      ],
    },
    {
      title: 'FLEET ASSETS',
      visible: role !== 'DRIVER',
      items: [
        {
          to: '/vehicles',
          label: 'Vehicles',
          icon: <Truck className="w-4 h-4" />,
          visible: role !== 'DRIVER',
        },
        {
          to: '/drivers',
          label: 'Drivers',
          icon: <Users className="w-4 h-4" />,
          visible: role !== 'DRIVER',
        },
        {
          to: '/maintenance',
          label: 'Maintenance',
          icon: <Wrench className="w-4 h-4 text-amber-400" />,
          visible: role !== 'DRIVER',
        },
        {
          to: '/fleet-dashboard',
          label: 'Fleet Health',
          icon: <Layers className="w-4 h-4" />,
          visible: role !== 'DRIVER',
        },
      ],
    },
    {
      title: 'DRIVER TERMINAL',
      visible: role === 'DRIVER', // Admin strictly excluded
      items: [
        {
          to: '/driver',
          label: 'Driver Console',
          icon: <Smartphone className="w-4 h-4" />,
          visible: true,
        },
      ],
    },
    {
      title: 'ANALYTICS',
      visible: role !== 'DRIVER',
      items: [
        {
          to: '/reports',
          label: role === 'VIEWER' ? 'Reports' : 'Reports & Intelligence',
          icon: <BarChart3 className="w-4 h-4" />,
          visible: role !== 'DRIVER',
        },
      ],
    },
    {
      title: 'ADMINISTRATION',
      visible: isAdmin,
      items: [
        {
          to: '/settings',
          label: 'Settings',
          icon: <SettingsIcon className="w-4 h-4" />,
          visible: isAdmin,
        },
        {
          to: '/users',
          label: 'Users & Security',
          icon: <ShieldCheck className="w-4 h-4" />,
          visible: isAdmin,
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-300 select-none border-r border-slate-800">
      {/* LOGISTIX Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between bg-[#0F172A]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-base shadow-sm shadow-emerald-500/20">
            <Hexagon className="w-5 h-5 fill-white stroke-emerald-500" />
          </div>
          <div>
            <span className="font-bold text-base tracking-wider text-white block leading-tight">
              LOGISTIX
            </span>
            <p className="text-[10px] font-sans font-medium text-slate-400 leading-none mt-0.5">
              Logistics Management System
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List by Section */}
      <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {navSections
          .filter((section) => section.visible)
          .map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider">
                {section.title}
              </div>
              {section.items
                .filter((item) => item.visible)
                .map((item, itemIdx) => (
                  <NavLink
                    key={itemIdx}
                    to={item.to}
                    onClick={() => {
                      if (onClose) onClose();
                    }}
                    end={item.to === '/' || item.to === '/fleet-dashboard' || item.to === '/driver'}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-500 text-white font-semibold shadow-sm shadow-emerald-950/20'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <span className="shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
            </div>
          ))}
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3.5 border-t border-slate-800 bg-[#0B132B]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate min-w-0">
              <div className="text-xs font-semibold text-white truncate leading-tight">
                {user?.name || 'User'}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {user?.role || 'User'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col h-screen sticky top-0 z-40 shrink-0 bg-[#0F172A]">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={onClose}
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl animate-in slide-in-from-left duration-200 z-10 bg-[#0F172A]">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
