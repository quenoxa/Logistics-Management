import React, { useState, useEffect } from 'react';
import {
  Save,
  Building,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { settingsApi } from '../api/client';
import { SystemSetting } from '../types';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const data = await settingsApi.getAll();
        setSettings(data);
        const initialMap: Record<string, string> = {};
        data.forEach((s) => {
          initialMap[s.key] = s.value;
        });
        setFormData(initialMap);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-500 text-xs">
        Loading system configuration parameters...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hub location, operating rules, speed limits, and notification policies
          </p>
        </div>

        {saveSuccess && (
          <div className="px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveAll} className="space-y-5">
        {/* Section 1: Organization & Primary Hub Depot */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2.5">
            <Building className="w-4 h-4 text-slate-500" />
            <span>Organization & Primary Hub Depot</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-700 font-medium block mb-1">Company name</label>
              <input
                type="text"
                value={formData['company_name'] || ''}
                onChange={(e) => handleChange('company_name', e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <label className="text-slate-700 font-medium block mb-1">Dispatch operations code</label>
              <input
                type="text"
                value={formData['company_code'] || ''}
                onChange={(e) => handleChange('company_code', e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-slate-700 font-medium block mb-1">Central depot address</label>
              <input
                type="text"
                value={formData['depot_address'] || ''}
                onChange={(e) => handleChange('depot_address', e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">Hub latitude</label>
              <input
                type="text"
                value={formData['depot_lat'] || ''}
                onChange={(e) => handleChange('depot_lat', e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <label className="text-slate-700 font-medium block mb-1">Hub longitude</label>
              <input
                type="text"
                value={formData['depot_lng'] || ''}
                onChange={(e) => handleChange('depot_lng', e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Dispatch & Telematics Policies */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2.5">
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Operating rules & alerts</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-700 font-medium block mb-1">Max driver daily shift (hours)</label>
              <input
                type="number"
                value={formData['max_driver_hours_per_day'] || '11'}
                onChange={(e) => handleChange('max_driver_hours_per_day', e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <label className="text-slate-700 font-medium block mb-1">Speed limit alert (km/h)</label>
              <input
                type="number"
                value={formData['speed_alert_kmh'] || '110'}
                onChange={(e) => handleChange('speed_alert_kmh', e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <label className="text-slate-700 font-medium block mb-1">Delay alert threshold (minutes)</label>
              <input
                type="number"
                value={formData['delay_threshold_minutes'] || '15'}
                onChange={(e) => handleChange('delay_threshold_minutes', e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">Low fuel / Battery alert (%)</label>
              <input
                type="number"
                value={formData['low_fuel_alert_percent'] || '15'}
                onChange={(e) => handleChange('low_fuel_alert_percent', e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <label className="text-slate-700 font-medium block mb-1">Measurement units</label>
              <select
                value={formData['units_system'] || 'METRIC'}
                onChange={(e) => handleChange('units_system', e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-500"
              >
                <option value="METRIC">Metric (km, kg)</option>
                <option value="IMPERIAL">Imperial (miles, lbs)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
