import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Truck,
  BarChart3,
  Users,
  Eye,
  EyeOff,
  Hexagon,
  Check,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('dispatcher@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedDemoRole, setSelectedDemoRole] = useState('DISPATCHER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const demoAccounts: Record<string, { email: string; pass: string; label: string; roleName: string }> = {
    DISPATCHER: { email: 'dispatcher@example.com', pass: 'password123', label: 'Priya Dispatcher', roleName: 'Dispatcher' },
    ADMIN: { email: 'admin@example.com', pass: 'password123', label: 'System Admin', roleName: 'System Admin' },
    DRIVER: { email: 'driver1@example.com', pass: 'password123', label: 'Vikram Driver', roleName: 'Commercial Driver' },
    VIEWER: { email: 'viewer@example.com', pass: 'password123', label: 'Sarah Viewer', roleName: 'Operations Viewer' },
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
      setError('Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      success('Access Granted', 'Session verified. Welcome to LOGISTIX.');
      navigate('/');
    } catch (err: any) {
      const raw = err.response?.data?.error || err.response?.data?.message || err.message;
      const msg = typeof raw === 'string' ? raw : (raw?.message || 'Authentication failed. Please verify your credentials.');
      setError(msg);
      toastError('Access Denied', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-6xl bg-white rounded-[24px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[680px]">
        
        {/* Left LOGISTIX Hero Showcase Panel (Reference Design) */}
        <div className="lg:col-span-6 bg-[#0F172A] p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden text-white">
          {/* Background Logistics Operations Image Overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay pointer-events-none transition-transform duration-700 hover:scale-105"
            style={{
              backgroundImage: `url('/assets/logistics-hero-bg.jpg')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/80 to-[#0F172A]/60 pointer-events-none" />

          {/* LOGISTIX Logo */}
          <div className="relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Hexagon className="w-6 h-6 fill-white stroke-emerald-500" />
              </div>
              <div>
                <span className="font-bold text-xl tracking-wider text-white block leading-tight">
                  LOGISTIX
                </span>
                <span className="text-xs font-sans font-medium text-slate-400">
                  Logistics Management System
                </span>
              </div>
            </div>

            {/* Headline */}
            <div className="mt-12 space-y-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Smarter <span className="text-emerald-400">Logistics.</span>
                <br />
                Stronger <span className="text-emerald-400">Deliveries.</span>
              </h1>
              <p className="text-sm text-slate-300 max-w-md leading-relaxed">
                Real-time tracking, efficient operations, and complete visibility across your logistics network.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-md flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Real-time Tracking</div>
                  <div className="text-[11px] text-slate-400">Track shipments in real time</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-md flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Smart Analytics</div>
                  <div className="text-[11px] text-slate-400">Data-driven insights</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-md flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Secure & Reliable</div>
                  <div className="text-[11px] text-slate-400">Enterprise security</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-md flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Team Collaboration</div>
                  <div className="text-[11px] text-slate-400">Seamless communication</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 mt-8 pt-6 border-t border-slate-800/80 flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-300">
              Trusted by <span className="font-bold text-white">500+ logistics companies</span> to deliver excellence every day.
            </p>
          </div>
        </div>

        {/* Right Sign-In Form (Reference Match) */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between bg-white text-slate-900">
          <div>
            {/* Header Lock Icon Badge */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold text-slate-900">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sign in to continue to your account
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{typeof error === 'string' ? error : (error as any)?.message || 'Authentication failed'}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 border-slate-300"
                  />
                  <span className="text-slate-600 font-medium">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Demo Reset Link: Please use default password (password123)')}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Primary Emerald Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md shadow-emerald-600/20 mt-2"
              >
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Social Logins Section */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="text-center text-xs text-slate-400 mb-3">or continue with</div>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectDemo('ADMIN')}
                  className="py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Google
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDemo('DISPATCHER')}
                  className="py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Microsoft
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDemo('DRIVER')}
                  className="py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Slack
                </button>
              </div>
            </div>

            {/* Demo Account Quick Role Switcher */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
                Demo Accounts Quick Switcher
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(demoAccounts).map(([roleKey, acc]) => {
                  const isSelected = selectedDemoRole === roleKey;
                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => handleSelectDemo(roleKey)}
                      className={`p-2 rounded-lg border text-left transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{acc.roleName}</div>
                      <div className="text-[10px] text-slate-500 truncate">{acc.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-slate-500 mt-6">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-emerald-600 hover:text-emerald-700 font-bold ml-1"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
