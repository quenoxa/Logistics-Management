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
  Wrench,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();
  const role = user?.role || 'DISPATCHER';

  interface NavSection {
    title: string;
    visible: boolean;
    items: {
      to: string;
      label: string;
      icon: React.ReactNode;
      visible: boolean;
    }[];
  }

  const navSections: NavSection[] = [
    {
      title: 'Operations',
      visible: role !== 'DRIVER',
      items: [
        {
          to: role === 'FLEET_MANAGER' ? '/fleet-dashboard' : '/',
          label: 'Dashboard',
          icon: <LayoutDashboard className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/orders',
          label: 'Orders',
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
        },
      ],
    },
    {
      title: 'Fleet Assets',
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
      ],
    },
    {
      title: 'Driver Console',
      visible: role === 'DRIVER' || isAdmin,
      items: [
        {
          to: '/driver-console',
          label: 'Active Trips',
          icon: <Smartphone className="w-4 h-4" />,
          visible: true,
        },
      ],
    },
    {
      title: 'Analytics',
      visible: role !== 'DRIVER',
      items: [
        {
          to: '/reports',
          label: 'Reports',
          icon: <BarChart3 className="w-4 h-4" />,
          visible: role !== 'DRIVER',
        },
      ],
    },
    {
      title: 'Administration',
      visible: isAdmin || role === 'FLEET_MANAGER',
      items: [
        {
          to: '/settings',
          label: 'Settings',
          icon: <SettingsIcon className="w-4 h-4" />,
          visible: isAdmin,
        },
        {
          to: '/admin',
          label: 'Users & Audit',
          icon: <ShieldCheck className="w-4 h-4" />,
          visible: isAdmin || role === 'FLEET_MANAGER',
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded bg-orange-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            L1
          </div>
          <div>
            <span className="font-bold text-sm text-white tracking-tight">
              LOGISTICS ONE
            </span>
            <p className="text-[10px] text-slate-400 font-normal leading-none">Operations</p>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav List by Section */}
      <div className="flex-1 py-4 px-2.5 space-y-4 overflow-y-auto">
        {navSections
          .filter((section) => section.visible)
          .map((section, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="px-3 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
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
                    end={item.to === '/' || item.to === '/fleet-dashboard' || item.to === '/driver-console'}
                    className={({ isActive }) =>
                      `flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-800 text-white font-semibold shadow-xs ring-1 ring-slate-700/50'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <span className="text-slate-400 shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
            </div>
          ))}
      </div>

      {/* Footer Hub Info */}
      <div className="p-3 border-t border-slate-800 text-xs text-slate-400 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Primary Hub:</span>
          <span className="text-slate-200 font-medium">Bhiwandi (MH)</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex w-56 flex-col h-screen sticky top-0 z-40 shrink-0 border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onClose}
          />
          {/* Slide-over Drawer */}
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl animate-in slide-in-from-left duration-200 z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
