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
} from 'lucide-react';

export const Sidebar: React.FC = () => {
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
          label: 'Tracking',
          icon: <Navigation className="w-4 h-4" />,
          visible: role !== 'DRIVER',
        },
      ],
    },
    {
      title: 'Fleet',
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
          to: '/vehicles',
          label: 'Maintenance',
          icon: <Wrench className="w-4 h-4" />,
          visible: role !== 'DRIVER',
        },
      ],
    },
    {
      title: 'Driver Portal',
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

  return (
    <aside className="w-56 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 select-none z-40">
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-slate-800 flex items-center bg-slate-900">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
            L1
          </div>
          <div>
            <span className="font-bold text-sm text-white tracking-tight">
              LOGISTICS ONE
            </span>
            <p className="text-[10px] text-slate-400 font-normal leading-none">Operations</p>
          </div>
        </div>
      </div>

      {/* Nav List by Section */}
      <div className="flex-1 py-4 px-2 space-y-4 overflow-y-auto">
        {navSections
          .filter((section) => section.visible)
          .map((section, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400">
                {section.title}
              </div>
              {section.items
                .filter((item) => item.visible)
                .map((item, itemIdx) => (
                  <NavLink
                    key={itemIdx}
                    to={item.to}
                    end={item.to === '/' || item.to === '/fleet-dashboard' || item.to === '/driver-console'}
                    className={({ isActive }) =>
                      `flex items-center space-x-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <span className="text-slate-400">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
            </div>
          ))}
      </div>

      {/* Footer Hub Info */}
      <div className="p-3 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center justify-between text-[11px]">
          <span>Hub:</span>
          <span className="text-slate-200 font-medium">Bhiwandi (MH)</span>
        </div>
      </div>
    </aside>
  );
};
