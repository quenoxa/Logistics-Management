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
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('admin@fleetops.io');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedDemoRole, setSelectedDemoRole] = useState('ADMIN');

  const demoAccounts: Record<string, { email: string; pass: string; roleName: string; label: string }> = {
    ADMIN: { email: 'admin@fleetops.io', pass: 'admin123', roleName: 'Admin', label: 'Fleet Director' },
    DISPATCHER: { email: 'dispatcher@fleetops.io', pass: 'dispatch123', roleName: 'Dispatcher', label: 'Freight Controller' },
    DRIVER: { email: 'driver@fleetops.io', pass: 'driver123', roleName: 'Driver', label: 'Commercial CDL' },
    VIEWER: { email: 'viewer@example.com', pass: 'password123', roleName: 'Viewer', label: 'Read-Only Partner' },
  };

  const handleSelectDemo = (roleKey: string) => {
    setSelectedDemoRole(roleKey);
    const acc = demoAccounts[roleKey];
    if (acc) {
      setEmail(acc.email);
      setPassword(acc.pass);
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
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Subtle decorative dot pattern in background corners */}
      <div className="absolute -top-10 -right-10 w-80 h-80 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-60 pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

      {/* Main Login Card - Split Design matching reference */}
      <div className="w-full max-w-5xl bg-white rounded-[28px] sm:rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[660px] border border-slate-100 relative z-10">
        
        {/* Left LOGISTIX Hero Showcase Panel (Reference Design Match) */}
        <div className="lg:col-span-6 bg-[#0B1528] p-6 sm:p-10 lg:p-11 flex flex-col justify-between relative overflow-hidden text-white min-h-[480px] lg:min-h-full">
          
          {/* Real Full Photographic Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
            style={{
              backgroundImage: `url('/assets/logistics-hero-bg.jpg')`,
            }}
          />

          {/* Precision Gradient Overlays: Darker on text areas, crystal clear on truck & environment */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1528]/95 via-[#0B1528]/75 to-[#0B1528]/35 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528]/90 via-transparent to-[#0B1528]/60 pointer-events-none" />

          {/* Top Content Area */}
          <div className="relative z-10">
            {/* LOGISTIX Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                <Hexagon className="w-5 h-5 fill-white stroke-emerald-500" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-wider text-white block leading-tight">
                  LOGISTIX
                </span>
                <span className="text-[11px] font-sans font-medium text-slate-300">
                  Logistics Management System
                </span>
              </div>
            </div>

            {/* Headline */}
            <div className="mt-8 sm:mt-10 space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-[1.15]">
                Smarter <span className="text-emerald-400">Logistics.</span>
                <br />
                Stronger <span className="text-emerald-400">Deliveries.</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 max-w-sm leading-relaxed font-sans">
                Real-time tracking, efficient operations, and complete visibility across your logistics network.
              </p>
            </div>

            {/* Feature Highlights - Single Vertical Stack (Pixel-matched to reference) */}
            <div className="mt-7 space-y-2.5 max-w-sm">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-md flex items-center space-x-3 transition-all hover:bg-slate-900/50">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Real-time Tracking</div>
                  <div className="text-[11px] text-slate-300">Track your shipments in real time</div>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-md flex items-center space-x-3 transition-all hover:bg-slate-900/50">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Smart Analytics</div>
                  <div className="text-[11px] text-slate-300">Data-driven insights & reports</div>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-md flex items-center space-x-3 transition-all hover:bg-slate-900/50">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Secure & Reliable</div>
                  <div className="text-[11px] text-slate-300">Enterprise-grade security</div>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-md flex items-center space-x-3 transition-all hover:bg-slate-900/50">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Team Collaboration</div>
                  <div className="text-[11px] text-slate-300">Seamless communication</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Floating Glass Badge (Pixel-matched to reference) */}
          <div className="relative z-10 mt-6 p-3 rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-md flex items-center space-x-3 max-w-sm">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="text-[11px] text-slate-200 leading-snug font-sans">
              Trusted by <span className="font-bold text-white">500+ logistics companies</span> to deliver excellence every day.
            </p>
          </div>
        </div>

        {/* Right Sign-In Form Panel (Reference Design Match) */}
        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white text-slate-900">
          <div>
            {/* Centered Green Circular Lock Badge */}
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center shadow-sm">
                <Lock className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sign in to continue to your account
              </p>
            </div>

            {/* Error Banner with String Guard (Fixes React Error #31) */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{typeof error === 'string' ? error : (error as any)?.message || 'Authentication failed'}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition font-sans"
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
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition font-sans"
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
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 border-slate-300"
                  />
                  <span className="text-slate-600 font-medium text-xs">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Demo Credentials Active: You can log in directly using the demo buttons below or default passwords (e.g. admin123).')}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold text-xs"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Primary Emerald Gradient Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md shadow-emerald-600/20 mt-2"
              >
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Social Logins Section (Google, Microsoft, Slack matching reference) */}
            <div className="mt-5 pt-3.5 border-t border-slate-100">
              <div className="text-center text-[11px] text-slate-400 mb-2.5">or continue with</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectDemo('ADMIN')}
                  title="Sign in with Google"
                  className="py-2 px-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDemo('DISPATCHER')}
                  title="Sign in with Microsoft"
                  className="py-2 px-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                  <span>Microsoft</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDemo('DRIVER')}
                  title="Sign in with Slack"
                  className="py-2 px-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#E01E5A" d="M5.04 15.15a2.52 2.52 0 1 1-2.52-2.52h2.52v2.52zm1.26 0a2.52 2.52 0 1 1 5.04 0v6.3a2.52 2.52 0 1 1-5.04 0v-6.3z"/>
                    <path fill="#36C5F0" d="M8.85 5.04a2.52 2.52 0 1 1-2.52-2.52v2.52h2.52zm0 1.26a2.52 2.52 0 1 1 0 5.04H2.55a2.52 2.52 0 1 1 0-5.04h6.3z"/>
                    <path fill="#2EB67D" d="M18.96 8.85a2.52 2.52 0 1 1 2.52 2.52h-2.52V8.85zm-1.26 0a2.52 2.52 0 1 1-5.04 0V2.55a2.52 2.52 0 1 1 5.04 0v6.3z"/>
                    <path fill="#ECB22E" d="M15.15 18.96a2.52 2.52 0 1 1 2.52 2.52v-2.52h-2.52zm0-1.26a2.52 2.52 0 1 1 0-5.04h6.3a2.52 2.52 0 1 1 0 5.04h-6.3z"/>
                  </svg>
                  <span>Slack</span>
                </button>
              </div>
            </div>

            {/* Quick Demo Switcher */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  One-Click Demo Roles
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  Active: {selectedDemoRole}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {Object.entries(demoAccounts).map(([roleKey, acc]) => {
                  const isSelected = selectedDemoRole === roleKey;
                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => handleSelectDemo(roleKey)}
                      className={`py-1.5 px-2 rounded-lg border text-center transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs'
                      }`}
                    >
                      <div className="text-[11px] truncate">{acc.roleName}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Navigation Link */}
          <div className="text-center text-xs text-slate-500 mt-5 pt-3 border-t border-slate-100">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-emerald-600 hover:text-emerald-700 font-bold ml-1 hover:underline"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
