import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Lock, Mail, ArrowRight, ShieldCheck, Activity, Radio, Truck, Cpu } from 'lucide-react';
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
    DISPATCHER: { email: 'dispatcher@fleetops.io', pass: 'dispatch123', label: 'Priya Nair', roleName: 'Chief Dispatcher' },
    ADMIN: { email: 'admin@fleetops.io', pass: 'admin123', label: 'Rajesh Sharma', roleName: 'Command Administrator' },
    FLEET_MANAGER: { email: 'ops@fleetops.io', pass: 'ops123', label: 'Anand Verma', roleName: 'Fleet Controller' },
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
      success('ACCESS GRANTED', 'Session clearance verified. Entering Command Center.');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Authentication failed. Please verify your credentials.';
      setError(msg);
      toastError('Access Denied', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ops-bg flex items-center justify-center p-4 sm:p-6 lg:p-8 text-ops-text font-sans selection:bg-ops-accent selection:text-black">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none"></div>

      <div className="w-full max-w-4xl bg-ops-surface border border-ops-border rounded-2xl shadow-modal overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10 relative">
        
        {/* Left Command Visual Showcase (Desktop) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-ops-bg via-[#0c121c] to-[#0f1724] p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-ops-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-black flex items-center justify-center font-mono font-extrabold text-sm shadow-glow-cyan">
                L1
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white block leading-tight">
                  LOGISTICS ONE
                </span>
                <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
                  Operations Console
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-white leading-snug">
                Mission-critical freight & fleet intelligence.
              </h2>
              <p className="text-xs text-ops-muted leading-relaxed">
                Centralized dispatching, corridor radar tracking, asset maintenance telemetry, and digital chain of custody.
              </p>
            </div>
          </div>

          {/* Telemetry Status Strip */}
          <div className="my-6 p-3.5 rounded-lg bg-ops-surface/80 border border-ops-border/80 space-y-2.5 font-mono text-[11px]">
            <div className="flex items-center justify-between text-ops-dim">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                CORRIDOR RADAR:
              </span>
              <span className="text-cyan-400 font-bold">ONLINE</span>
            </div>
            <div className="flex items-center justify-between text-ops-dim">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                SECURITY PROTOCOL:
              </span>
              <span className="text-emerald-400 font-bold">RBAC LEVEL 4</span>
            </div>
            <div className="flex items-center justify-between text-ops-dim">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                DATABASE FIX:
              </span>
              <span className="text-ops-text font-bold">SQLITE WAL</span>
            </div>
          </div>

          <div className="text-[10px] font-mono text-ops-dim flex items-center justify-between border-t border-ops-border/60 pt-3">
            <span>TERMINAL V1.0.0</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              LIVE OPS
            </span>
          </div>
        </div>

        {/* Right Authentication Form */}
        <div className="lg:col-span-7 p-7 sm:p-9 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-mono font-bold uppercase tracking-wider text-ops-text flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-cyan-400 rounded-xs"></span>
                Operator Sign-In
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-ops-panel border border-ops-border text-ops-dim">
                ENCRYPTED TLS
              </span>
            </div>
            <p className="text-xs text-ops-dim mt-1 font-sans">
              Enter registered credentials or select a verified operator profile.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2.5 font-sans">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            <div>
              <label className="block font-mono text-[11px] font-semibold text-ops-muted uppercase tracking-wider mb-1.5">
                Operator Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ops-dim absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@fleetops.io"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text placeholder:text-ops-dim focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] font-semibold text-ops-muted uppercase tracking-wider mb-1.5">
                Passphrase / Token
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ops-dim absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text placeholder:text-ops-dim focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-black rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-glow-cyan mt-2"
            >
              <span>{loading ? 'AUTHENTICATING CLEARANCE...' : 'AUTHORIZE & ENTER CONSOLE'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Operator Profiles */}
          <div className="pt-3 border-t border-ops-border">
            <p className="text-[10px] font-mono font-bold text-ops-dim uppercase tracking-wider mb-2 text-center">
              Instant Clearance Selection (Demo)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(demoAccounts).map(([roleKey, acc]) => (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => handleSelectDemo(roleKey)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    selectedDemoRole === roleKey
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 shadow-panel ring-1 ring-cyan-500/30'
                      : 'border-ops-border bg-ops-bg/60 hover:bg-ops-panel text-ops-muted hover:text-ops-text'
                  }`}
                >
                  <span className="font-mono font-bold block truncate text-[11px] text-ops-text">{acc.roleName}</span>
                  <span className="text-[10px] font-mono block truncate text-ops-dim">
                    {acc.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 text-center text-[10px] font-mono text-ops-dim">
            SECURE OPERATIONS PLATFORM &bull; ROLE-BASED ACCESS CONTROL (RBAC)
          </div>
        </div>
      </div>
    </div>
  );
};
