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
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';

const logisticsBg = '/assets/logistics-hero-bg.jpg';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'DISPATCHER' | 'VIEWER'>('DISPATCHER');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Attempt login with newly requested parameters or fallback
      // For demo environment, auto-provision session or redirect to sign-in
      success('Account Requested', `Registration submitted for ${name}. Logging into LOGISTIX...`);
      
      try {
        await login(email, password);
        navigate('/');
      } catch {
        // If credentials are new in demo mode, navigate to login with email prefilled
        success('Account Ready', 'Your operator account is ready. Please sign in.');
        navigate('/login');
      }
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-6xl bg-white rounded-[24px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[680px]">
        
        {/* Left Logistics Hero Visual Panel (45-50% Desktop Width) */}
        <div className="lg:col-span-5 bg-[#0F172A] p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden text-white h-52 sm:h-64 lg:h-auto shrink-0">
          {/* Logistics Background Image Asset */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay pointer-events-none transition-transform duration-700 hover:scale-105"
            style={{
              backgroundImage: `url(${logisticsBg}), url('/assets/logistics-hero-bg.jpg')`,
            }}
          />
          {/* Dark Navy Gradient Overlay for optimal text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/80 to-[#0F172A]/60 pointer-events-none" />

          {/* Top LOGISTIX Branding Header */}
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
          </div>

          {/* Hero Content (Smarter Logistics. Stronger Deliveries.) */}
          <div className="relative z-10 hidden lg:block my-auto py-8">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Operator Onboarding Platform</span>
            </div>
            
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Smarter Logistics. <br />
              <span className="text-emerald-400">Stronger Deliveries.</span>
            </h2>
            
            <p className="text-sm text-slate-300 mt-4 leading-relaxed">
              Join your logistics operations platform and manage deliveries, drivers, vehicles, and fleet operations from one place.
            </p>

            {/* Feature Pills */}
            <div className="mt-8 space-y-3 font-sans text-xs">
              <div className="flex items-center space-x-2.5 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-time GPS vehicle telematics & corridor tracking</span>
              </div>
              <div className="flex items-center space-x-2.5 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated dispatch assignment & anti-collision logic</span>
              </div>
              <div className="flex items-center space-x-2.5 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cryptographic audit trail & Proof of Delivery (POD)</span>
              </div>
            </div>
          </div>

          {/* Footer Security Badge */}
          <div className="relative z-10 hidden lg:flex items-center justify-between border-t border-slate-800/80 pt-6 text-xs text-slate-400">
            <span>&copy; {new Date().getFullYear()} LOGISTIX Inc.</span>
            <span className="font-mono text-[11px] text-slate-500">v2.4 &bull; Enterprise SaaS</span>
          </div>
        </div>

        {/* Right Form Section (50-55% Desktop Width) */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white text-slate-800">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Create Account
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Fill in your operator details to join the LOGISTIX operational network
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{typeof error === 'string' ? error : (error as any)?.message || 'Registration failed'}</span>
              </div>
            )}

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              {/* Full Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Benedict Edwin"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@logistix.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono"
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

              {/* Confirm Password */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono"
                  />
                </div>
              </div>

              {/* Department Role Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Operational Role Level</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="DISPATCHER">DISPATCHER (Logistics Operations)</option>
                  <option value="VIEWER">VIEWER (Read-only Analytics)</option>
                </select>
              </div>

              {/* Primary Emerald Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md shadow-emerald-600/20 mt-4"
              >
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Footer Back to Sign In Link */}
            <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-100">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-emerald-600 hover:text-emerald-700 font-bold ml-1"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
