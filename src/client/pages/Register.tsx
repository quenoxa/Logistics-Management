import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  Hexagon,
  Eye,
  EyeOff,
  Truck,
  BarChart3,
  Users,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'DISPATCHER' | 'VIEWER'>('DISPATCHER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call Admin / Register user API endpoint
      await authApi.login(email, password).catch(async () => {
        // Fallback or self-register via admin user endpoint
        return await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }),
        });
      });

      // Auto-login newly registered account
      await login(email, password);

      success('Account Created', `Welcome to LOGISTIX, ${name}! Your account is now active.`);
      navigate('/');
    } catch (err: any) {
      const raw = err.response?.data?.error || err.response?.data?.message || err.message;
      const msg = typeof raw === 'string' ? raw : (raw?.message || 'Registration failed. Please try again.');
      setError(msg);
      toastError('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Subtle decorative background dot grid in corners */}
      <div className="absolute -top-10 -right-10 w-80 h-80 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-60 pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

      {/* Main Container Card - Matches Reference Design */}
      <div className="w-full max-w-5xl bg-white rounded-[28px] sm:rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[660px] border border-slate-100 relative z-10">
        
        {/* Left Logistics Hero Showcase Panel (Matches Reference Design) */}
        <div className="lg:col-span-6 bg-[#0B1528] p-6 sm:p-10 lg:p-11 flex flex-col justify-between relative overflow-hidden text-white min-h-[480px] lg:min-h-full">
          {/* Real Full Photographic Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
            style={{
              backgroundImage: `url('/assets/logistics-hero-bg.jpg')`,
            }}
          />

          {/* Precision Gradient Overlays: Darker on text, crystal clear on environment */}
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

            {/* Feature Highlights - Single Vertical Stack (Matching reference) */}
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

          {/* Bottom Floating Glass Badge */}
          <div className="relative z-10 mt-6 p-3 rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-md flex items-center space-x-3 max-w-sm">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="text-[11px] text-slate-200 leading-snug font-sans">
              Trusted by <span className="font-bold text-white">500+ logistics companies</span> to deliver excellence every day.
            </p>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white text-slate-900">
          <div>
            {/* Centered Circular Green User Badge */}
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-5">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Create Account
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Fill in your details to join the LOGISTIX operational network
              </p>
            </div>

            {/* Error Banner with String Guard (Prevents React Error #31) */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{typeof error === 'string' ? error : (error as any)?.message || 'Registration failed'}</span>
              </div>
            )}

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition font-sans"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your work email"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition font-sans"
                  />
                </div>
              </div>

              {/* Password & Confirm Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="DISPATCHER">DISPATCHER (Logistics Operations & Dispatch)</option>
                  <option value="VIEWER">VIEWER (Read-only Analytics & Tracking)</option>
                </select>
              </div>

              {/* Primary Emerald Gradient Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md shadow-emerald-600/20 mt-3"
              >
                <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Social Logins Section */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="text-center text-[11px] text-slate-400 mb-2">or continue with</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => alert('Demo Social Auth: Please use the standard registration form to create an account.')}
                  className="py-1.5 px-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
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
                  onClick={() => alert('Demo Social Auth: Please use the standard registration form to create an account.')}
                  className="py-1.5 px-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
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
                  onClick={() => alert('Demo Social Auth: Please use the standard registration form to create an account.')}
                  className="py-1.5 px-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
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
          </div>

          {/* Footer Back to Sign In Link */}
          <div className="text-center text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-emerald-600 hover:text-emerald-700 font-bold ml-1 hover:underline"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Register;
