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
  X,
  Radio,
  Cpu,
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
      badge?: string;
    }[];
  }

  const navSections: NavSection[] = [
    {
      title: 'OPERATIONS',
      visible: role !== 'DRIVER',
      items: [
        {
          to: role === 'FLEET_MANAGER' ? '/fleet-dashboard' : '/',
          label: 'Command Center',
          icon: <LayoutDashboard className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/orders',
          label: 'Orders & Booking',
          icon: <Package className="w-4 h-4" />,
          visible: role !== 'DRIVER',
        },
        {
          to: '/deliveries',
          label: 'Shipment Manifest',
          icon: <Truck className="w-4 h-4" />,
          visible: role !== 'DRIVER',
        },
        {
          to: '/tracking',
          label: 'Corridor Telematics',
          icon: <Navigation className="w-4 h-4" />,
          visible: role !== 'DRIVER',
          badge: 'LIVE',
        },
      ],
    },
    {
      title: 'FLEET ASSETS',
      visible: role !== 'DRIVER',
      items: [
        {
          to: '/vehicles',
          label: 'Vehicle Inventory',
          icon: <Truck className="w-4 h-4" />,
          visible: role !== 'DRIVER',
        },
        {
          to: '/drivers',
          label: 'Commercial Drivers',
          icon: <Users className="w-4 h-4" />,
          visible: role !== 'DRIVER',
        },
        {
          to: '/fleet-dashboard',
          label: 'Fleet Health & Bay',
          icon: <Layers className="w-4 h-4" />,
          visible: role !== 'DRIVER',
        },
      ],
    },
    {
      title: 'IN-CAB TERMINAL',
      visible: role === 'DRIVER' || isAdmin,
      items: [
        {
          to: '/driver-console',
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
          label: 'Operational Reports',
          icon: <BarChart3 className="w-4 h-4" />,
          visible: role !== 'DRIVER',
        },
      ],
    },
    {
      title: 'GOVERNANCE',
      visible: isAdmin || role === 'FLEET_MANAGER',
      items: [
        {
          to: '/settings',
          label: 'System Settings',
          icon: <SettingsIcon className="w-4 h-4" />,
          visible: isAdmin,
        },
        {
          to: '/admin',
          label: 'Security & Audit',
          icon: <ShieldCheck className="w-4 h-4" />,
          visible: isAdmin || role === 'FLEET_MANAGER',
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-ops-surface text-ops-text select-none border-r border-ops-border">
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-ops-border flex items-center justify-between bg-ops-bg/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 text-black flex items-center justify-center font-mono font-extrabold text-xs shadow-glow-cyan">
            L1
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              LOGISTICS ONE
            </span>
            <p className="text-[9px] font-mono tracking-widest text-ops-accent uppercase leading-none mt-0.5">
              Fleet Command
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-ops-muted hover:text-white rounded-md hover:bg-ops-panel border border-ops-border"
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
              <div className="px-3 pb-1 text-[10px] font-mono font-semibold text-ops-dim uppercase tracking-wider">
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
                      `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-cyan-950/40 text-cyan-300 font-semibold border border-cyan-500/30 shadow-panel ring-1 ring-cyan-500/20'
                          : 'text-ops-muted hover:text-ops-text hover:bg-ops-panel/60 border border-transparent'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-950 border border-cyan-700 text-cyan-400">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
            </div>
          ))}
      </div>

      {/* Footer Hub Info */}
      <div className="p-3 border-t border-ops-border text-xs text-ops-dim bg-ops-bg/80">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-ops-dim">DEPOT HUB:</span>
          <span className="text-cyan-400 font-semibold">BHIWANDI (MH)</span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono mt-1 text-ops-dim">
          <span>LATENCY:</span>
          <span className="text-emerald-400 font-medium">12ms (NOMINAL)</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col h-screen sticky top-0 z-40 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
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
