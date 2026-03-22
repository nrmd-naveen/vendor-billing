'use client';

import { useState, useEffect, useRef } from 'react';
import { useSettings } from '@/lib/useSettings';
import { CompanySettings } from '@/lib/types';
import { Save, Upload, X, Settings as SettingsIcon, Building2, Download, DatabaseBackup, AlertTriangle } from 'lucide-react';

function ImageUpload({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
          {value ? (
            <img src={value} alt="logo" className="w-full h-full object-contain" />
          ) : (
            <Upload className="w-6 h-6 text-gray-300" />
          )}
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            {value ? 'Change Image' : 'Upload Image'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center gap-1.5 text-red-500 text-xs hover:text-red-700 transition-colors"
            >
              <X className="w-3 h-3" /> Remove
            </button>
          )}
          <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, saveSettings, loaded } = useSettings();
  const [form, setForm] = useState<CompanySettings>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [dbError, setDbError] = useState('');
  const dbInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadDb = () => {
    window.location.href = '/api/db';
  };

  const handleUploadDb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDbStatus('uploading');
    setDbError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/db', { method: 'POST', body: formData });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Upload failed');
      }
      setDbStatus('success');
      setTimeout(() => { setDbStatus('idle'); window.location.reload(); }, 1500);
    } catch (err) {
      setDbError(err instanceof Error ? err.message : 'Upload failed');
      setDbStatus('error');
    } finally {
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (loaded) setForm(settings);
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: keyof CompanySettings, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggle = (key: keyof CompanySettings) =>
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    setSaving(true);
    await saveSettings(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!loaded) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-64">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  const field = (label: string, key: keyof CompanySettings, placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={(form[key] as string) || ''}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  );

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-6 h-6 text-gray-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm">Customize your company details and bill layout</p>
        </div>
      </div>

      {/* Company info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Company Details
        </h2>
        {field('Company Tagline (top of bill)', 'tagline', 'மேல்மாந்தை ஸ்ரீ பெத்தனாட்சி பெரியாண்டவர் தணை')}
        {field('Company Name (large text)', 'name', 'RNR')}
        {field('Subtitle', 'subtitle', 'Vegetable Order Supplier')}
        {field('Address', 'address', 'சின்னமனூர் - 625 515, தேனி Dt.')}
        {field('Bill Title', 'billTitle', 'விற்பனை பில்')}
      </div>

      {/* Contacts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Contact Persons</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {field('Contact 1 Name', 'contact1Name', 'P.ரவிச்சந்திரன்')}
          {field('Contact 1 Phone', 'contact1Phone', '99437 16561')}
          {field('Contact 2 Name', 'contact2Name', 'R.நாகராஜன்')}
          {field('Contact 2 Phone', 'contact2Phone', '63810 59515')}
        </div>
      </div>

      {/* Logos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
        <h2 className="font-semibold text-gray-900">Bill Logo Images</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <ImageUpload label="Logo Left (deity / symbol)" value={form.logoLeft} onChange={(v) => set('logoLeft', v)} />
          <ImageUpload label="Logo Right (product / basket)" value={form.logoRight} onChange={(v) => set('logoRight', v)} />
        </div>
      </div>

      {/* Bill preview snippet */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
        <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Bill Header Preview</p>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center" style={{ fontFamily: "'Noto Sans Tamil', Arial, sans-serif" }}>
          {form.tagline && <div className="text-[11px] text-gray-500 mb-1">{form.tagline}</div>}
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 flex items-center justify-center">
              {form.logoLeft ? <img src={form.logoLeft} alt="" className="w-12 h-12 object-contain" /> : <div className="w-12 h-12 bg-gray-100 rounded" />}
            </div>
            <div>
              <div className="text-xl font-extrabold text-green-700">{form.name || 'Company Name'}</div>
              {form.subtitle && <div className="text-xs text-gray-600">{form.subtitle}</div>}
              {form.address && <div className="text-[11px] text-gray-500">{form.address}</div>}
            </div>
            <div className="w-12 h-12 flex items-center justify-center">
              {form.logoRight ? <img src={form.logoRight} alt="" className="w-12 h-12 object-contain" /> : <div className="w-12 h-12 bg-gray-100 rounded" />}
            </div>
          </div>
        </div>
      </div>

      {/* Billing Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="w-4 h-4" /> Billing Preferences
        </h2>
        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={!!form.useDefaultRates}
            onChange={() => toggle('useDefaultRates')}
            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
          />
          <div>
            <div className="font-medium text-gray-900">Use Default Rates</div>
            <div className="text-sm text-gray-500">Auto-fill price per kg from vegetable settings while billing</div>
          </div>
        </label>
      </div>

      {/* Database Backup */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <DatabaseBackup className="w-4 h-4" /> Database Backup
        </h2>
        <p className="text-sm text-gray-500">
          Download a copy of your entire database or restore from a previous backup.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownloadDb}
            className="flex items-center gap-2 border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Database
          </button>
          <button
            type="button"
            onClick={() => dbInputRef.current?.click()}
            disabled={dbStatus === 'uploading'}
            className="flex items-center gap-2 border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            {dbStatus === 'uploading' ? 'Restoring...' : dbStatus === 'success' ? '✓ Restored!' : 'Restore from Backup'}
          </button>
          <input ref={dbInputRef} type="file" accept=".db" className="hidden" onChange={handleUploadDb} />
        </div>
        {dbStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {dbError}
          </div>
        )}
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Restoring will replace all current data. A backup is saved automatically before restore.
        </p>
      </div>

      {/* Save */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
