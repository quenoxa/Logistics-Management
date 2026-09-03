import React, { useState, useEffect } from 'react';
import {
  Save,
  Building,
  Sliders,
  CheckCircle2,
  Bell,
  RotateCw,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { settingsApi } from '../services/api';
import { SystemSetting } from '../../shared/types';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';

export const Settings: React.FC = () => {
  const { success, error } = useToast();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const data = await settingsApi.getAll();
      setSettings(data);
      const initialMap: Record<string, string> = {};
      data.forEach((s) => {
        initialMap[s.key] = s.value;
      });
      setFormData(initialMap);
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      error('Error', 'Failed to load system settings.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings(true);
  }, []);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updates = Object.entries(formData).map(([key, value]) => ({ key, value }));
      await settingsApi.bulkUpdate(updates);
      success('Configuration Committed', 'System parameters updated across operational hub.');
    } catch (err: any) {
      error('Save Failed', err.response?.data?.error || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-16 font-sans text-slate-800">
        <Skeleton className="h-10 w-64 bg-white" />
        <Skeleton className="h-64 w-full rounded-2xl bg-white" />
        <Skeleton className="h-64 w-full rounded-2xl bg-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            System & Operations Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organization details, hub depot locations, operational thresholds, and security parameters
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Organization Card */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
            <Building className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Organization & Hub Parameters
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hub Name</label>
              <input
                type="text"
                value={formData['hub_name'] || 'LOGISTIX Central Hub'}
                onChange={(e) => handleChange('hub_name', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Depot Address</label>
              <input
                type="text"
                value={formData['depot_address'] || 'Central Distribution Hub, Sector 18'}
                onChange={(e) => handleChange('depot_address', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Depot Latitude</label>
              <input
                type="text"
                value={formData['depot_lat'] || '19.0760'}
                onChange={(e) => handleChange('depot_lat', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Depot Longitude</label>
              <input
                type="text"
                value={formData['depot_lng'] || '72.8777'}
                onChange={(e) => handleChange('depot_lng', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Operations Card */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Operational Thresholds
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Speed Limit Alert (km/h)</label>
              <input
                type="number"
                value={formData['speed_alert_threshold'] || '80'}
                onChange={(e) => handleChange('speed_alert_threshold', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Daily Driver Hours</label>
              <input
                type="number"
                value={formData['max_driver_hours'] || '10'}
                onChange={(e) => handleChange('max_driver_hours', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Security & Authentication
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">JWT Token Expiry (Hours)</label>
              <input
                type="number"
                value={formData['jwt_expiry_hours'] || '24'}
                onChange={(e) => handleChange('jwt_expiry_hours', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password Hashing Salt Rounds</label>
              <input
                type="number"
                disabled
                value="10 (Bcrypt Verified)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-mono"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
