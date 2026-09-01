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
      success('Settings Saved', 'System configuration parameters updated.');
    } catch (err: any) {
      error('Save Failed', err.response?.data?.error || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-16">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            System & Operations Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Depot location, freight operating rules, telematics speed limits, and notification parameters
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-5">
        {/* Section 1: Organization & Primary Hub Depot */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Building className="w-4 h-4 text-slate-500" />
            <span>Organization & Primary Hub Depot</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-700 font-medium block mb-1">Company Entity Name</label>
              <input
                type="text"
                value={formData['company_name'] || ''}
                onChange={(e) => handleChange('company_name', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
              />
            </div>
            <div>
              <label className="text-slate-700 font-medium block mb-1">Support Contact Email</label>
              <input
                type="email"
                value={formData['support_email'] || ''}
                onChange={(e) => handleChange('support_email', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-700 font-medium block mb-1">Primary Central Hub Facility</label>
              <input
                type="text"
                value={formData['hub_name'] || ''}
                onChange={(e) => handleChange('hub_name', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
              />
            </div>
            <div>
              <label className="text-slate-700 font-medium block mb-1">Facility Address</label>
              <input
                type="text"
                value={formData['hub_address'] || ''}
                onChange={(e) => handleChange('hub_address', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Fleet Operating Thresholds */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Operating Parameters & Thresholds</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-700 font-medium block mb-1">Highway Speed Limit (km/h)</label>
              <input
                type="number"
                value={formData['speed_limit_kmh'] || '80'}
                onChange={(e) => handleChange('speed_limit_kmh', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-slate-700 font-medium block mb-1">Maximum Driver Shift (Hours)</label>
              <input
                type="number"
                value={formData['max_driver_hours'] || '10'}
                onChange={(e) => handleChange('max_driver_hours', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-slate-700 font-medium block mb-1">Default Base Currency</label>
              <input
                type="text"
                value={formData['currency'] || 'INR'}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
