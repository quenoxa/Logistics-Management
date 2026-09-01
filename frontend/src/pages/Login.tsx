import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Lock, Mail, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('dispatcher@fleetops.io');
  const [password, setPassword] = useState('dispatch123');
  const [selectedDemoRole, setSelectedDemoRole] = useState('DISPATCHER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const demoAccounts: Record<string, { email: string; pass: string; label: string }> = {
    ADMIN: { email: 'admin@fleetops.io', pass: 'admin123', label: 'Administrator (Rajesh Sharma)' },
    DISPATCHER: { email: 'dispatcher@fleetops.io', pass: 'dispatch123', label: 'Dispatcher (Priya Nair)' },
    FLEET_MANAGER: { email: 'ops@fleetops.io', pass: 'ops123', label: 'Fleet Operations Manager (Anand Verma)' },
    DRIVER: { email: 'driver@fleetops.io', pass: 'driver123', label: 'Commercial Driver (Vikram Singh)' },
  };

  const handleSelectDemo = (role: string) => {
    setSelectedDemoRole(role);
    const account = demoAccounts[role];
    if (account) {
      setEmail(account.email);
      setPassword(account.pass);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your work email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 text-slate-900 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {/* Brand Header */}
        <div className="pt-8 pb-6 px-8 text-center border-b border-slate-100">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-slate-900 text-white mb-3 shadow-xs">
            {/* Minimal Geometric Logistics Logo: Route & Hub Nodes */}
            <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19V5h4v14H4z" />
              <path d="M12 12h8" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="20" cy="12" r="2" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            LOGISTICS ONE
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Logistics Management Platform
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-md transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Signing in...' : 'Sign in'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Compact Demo Role Selector (Secondary) */}
          <div className="pt-5 border-t border-slate-200 space-y-2">
            <label className="block text-xs font-medium text-slate-500">
              Demo account
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedDemoRole}
                onChange={(e) => handleSelectDemo(e.target.value)}
                className="flex-1 py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:border-slate-400"
              >
                <option value="ADMIN">Administrator (admin@fleetops.io)</option>
                <option value="DISPATCHER">Dispatcher (dispatcher@fleetops.io)</option>
                <option value="FLEET_MANAGER">Fleet Manager (ops@fleetops.io)</option>
                <option value="DRIVER">Commercial Driver (driver@fleetops.io)</option>
              </select>
              <button
                type="button"
                onClick={() => handleSelectDemo(selectedDemoRole)}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
              >
                Fill
              </button>
            </div>
          </div>
        </div>

        {/* Clean Footer */}
        <div className="px-8 py-3.5 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
          Protected operations workspace
        </div>
      </div>
    </div>
  );
};
