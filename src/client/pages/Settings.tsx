import React, { useState, useEffect } from 'react';
import {
  Save,
  Building,
  Sliders,
  CheckCircle2,
  Bell,
  RotateCw,
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
      success('CONFIG COMMITTED', 'System parameters updated across operational hub.');
    } catch (err: any) {
      error('Save Failed', err.response?.data?.error || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-16">
        <Skeleton className="h-10 w-64 bg-ops-panel" />
        <Skeleton className="h-64 w-full rounded-lg bg-ops-panel" />
        <Skeleton className="h-64 w-full rounded-lg bg-ops-panel" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ops-border pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold font-mono tracking-tight text-white uppercase flex items-center gap-2">
              <span className="w-2 h-4 bg-cyan-400 rounded-xs"></span>
              System & Operations Governance
            </h1>
          </div>
          <p className="text-xs text-ops-muted mt-1 font-sans">
            Depot location, freight operating rules, telematics speed limits, and notification parameters
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-glow-cyan transition-all disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'SAVING...' : 'SAVE CONFIGURATION'}</span>
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-5">
        {/* Section 1: Organization & Primary Hub Depot */}
        <div className="bg-ops-surface border border-ops-border rounded-xl p-5 shadow-panel space-y-4">
          <h3 className="text-xs font-mono font-bold text-ops-text uppercase tracking-wider flex items-center gap-2 border-b border-ops-border pb-2">
            <span className="w-1.5 h-3 bg-cyan-400 rounded-xs"></span>
            Organization & Primary Hub Depot
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <label className="text-ops-dim font-mono text-[11px] font-bold uppercase block mb-1">Company Entity Name</label>
              <input
                type="text"
                value={formData['company_name'] || ''}
                onChange={(e) => handleChange('company_name', e.target.value)}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="text-ops-dim font-mono text-[11px] font-bold uppercase block mb-1">Support Contact Email</label>
              <input
                type="email"
                value={formData['support_email'] || ''}
                onChange={(e) => handleChange('support_email', e.target.value)}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs font-mono text-ops-text focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <label className="text-ops-dim font-mono text-[11px] font-bold uppercase block mb-1">Primary Central Hub Facility</label>
              <input
                type="text"
                value={formData['hub_name'] || ''}
                onChange={(e) => handleChange('hub_name', e.target.value)}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="text-ops-dim font-mono text-[11px] font-bold uppercase block mb-1">Facility Physical Address</label>
              <input
                type="text"
                value={formData['hub_address'] || ''}
                onChange={(e) => handleChange('hub_address', e.target.value)}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs text-ops-text focus:border-cyan-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Fleet Operating Thresholds */}
        <div className="bg-ops-surface border border-ops-border rounded-xl p-5 shadow-panel space-y-4">
          <h3 className="text-xs font-mono font-bold text-ops-text uppercase tracking-wider flex items-center gap-2 border-b border-ops-border pb-2">
            <span className="w-1.5 h-3 bg-cyan-400 rounded-xs"></span>
            Operating Parameters & Telematics Thresholds
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <label className="text-ops-dim text-[11px] font-bold uppercase block mb-1">Highway Speed Limit (km/h)</label>
              <input
                type="number"
                value={formData['speed_limit_kmh'] || '80'}
                onChange={(e) => handleChange('speed_limit_kmh', e.target.value)}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs text-cyan-400 font-bold focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-ops-dim text-[11px] font-bold uppercase block mb-1">Max Driver Shift (Hours)</label>
              <input
                type="number"
                value={formData['max_driver_hours'] || '10'}
                onChange={(e) => handleChange('max_driver_hours', e.target.value)}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs text-cyan-400 font-bold focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-ops-dim text-[11px] font-bold uppercase block mb-1">Default Base Currency</label>
              <input
                type="text"
                value={formData['currency'] || 'INR'}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-xs text-white font-bold focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
