import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('dispatcher@fleetops.io');
  const [password, setPassword] = useState('dispatch123');
  const [selectedDemoRole, setSelectedDemoRole] = useState('DISPATCHER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const demoAccounts: Record<string, { email: string; pass: string; label: string; roleName: string }> = {
    ADMIN: { email: 'admin@fleetops.io', pass: 'admin123', label: 'Rajesh Sharma', roleName: 'Administrator' },
    DISPATCHER: { email: 'dispatcher@fleetops.io', pass: 'dispatch123', label: 'Priya Nair', roleName: 'Dispatcher' },
    FLEET_MANAGER: { email: 'ops@fleetops.io', pass: 'ops123', label: 'Anand Verma', roleName: 'Fleet Manager' },
    DRIVER: { email: 'driver@fleetops.io', pass: 'driver123', label: 'Vikram Singh', roleName: 'Commercial Driver' },
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
      success('Welcome to LOGISTICS ONE', 'Session authenticated successfully.');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Authentication failed. Please verify your credentials.';
      setError(msg);
      toastError('Login Failed', msg);
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
            <span className="font-bold text-sm tracking-tight text-orange-500">L1</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            LOGISTICS ONE
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Logistics & Fleet Operations Platform
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-sm font-semibold transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 shadow-xs"
            >
              <span>{loading ? 'Authenticating...' : 'Sign in to Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Role Selector */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Quick Role Switcher
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(demoAccounts).map(([roleKey, acc]) => (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => handleSelectDemo(roleKey)}
                  className={`p-2 rounded border text-left text-xs transition-colors ${
                    selectedDemoRole === roleKey
                      ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="font-bold block truncate">{acc.roleName}</span>
                  <span className={`text-[10px] block truncate ${selectedDemoRole === roleKey ? 'text-slate-300' : 'text-slate-400'}`}>
                    {acc.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-3 px-8 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Enterprise Security Clearance &bull; ISO 27001 Certified
        </div>
      </div>
    </div>
  );
};
