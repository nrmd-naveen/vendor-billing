'use client';

import { useState, useEffect, useRef } from 'react';
import { useSettings } from '@/lib/useSettings';
import { CompanySettings } from '@/lib/types';
import {
  Save, Upload, X, Settings as SettingsIcon, Building2,
  Download, DatabaseBackup, AlertTriangle, RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import type { DbStats } from '@/lib/db';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AnalyzeResult {
  uploaded: DbStats;
  current: DbStats;
  fileSize: number;
  fileName: string;
}



// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtBytes(b: number): string {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / (1024 * 1024)).toFixed(1) + ' MB';
}



// ── Sub-components ────────────────────────────────────────────────────────────

function ImageUpload({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
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
          {value ? <img src={value} alt="logo" className="w-full h-full object-contain" /> : <Upload className="w-6 h-6 text-gray-300" />}
        </div>
        <div className="space-y-2">
          <button type="button" onClick={() => inputRef.current?.click()} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4" />
            {value ? 'Change Image' : 'Upload Image'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} className="flex items-center gap-1.5 text-red-500 text-xs hover:text-red-700 transition-colors">
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

function StatRow({ label, cur, next }: { label: string; cur: number; next: number }) {
  const diff = next - cur;
  return (
    <div className="flex items-center gap-2 text-sm py-1">
      <span className="text-gray-500 w-24 shrink-0">{label}</span>
      <span className="font-medium text-gray-900 w-10 text-right">{cur}</span>
      <span className="text-gray-300 mx-1">→</span>
      <span className={`font-medium w-10 text-left ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-orange-600' : 'text-gray-900'}`}>{next}</span>
      {diff !== 0 && (
        <span className={`text-xs ${diff > 0 ? 'text-green-500' : 'text-orange-500'}`}>
          ({diff > 0 ? '+' : ''}{diff})
        </span>
      )}
    </div>
  );
}

function RestoreConfirmModal({
  result, onConfirm, onCancel, loading,
}: {
  result: AnalyzeResult;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">Restore Database?</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {result.fileName} &bull; {fmtBytes(result.fileSize)}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 pb-1 border-b border-gray-200">
            <span>Data</span>
            <div className="flex gap-6">
              <span>Current</span>
              <span>After restore</span>
            </div>
          </div>
          <StatRow label="Customers" cur={result.current.customers} next={result.uploaded.customers} />
          <StatRow label="Bills" cur={result.current.bills} next={result.uploaded.bills} />
          <StatRow label="Vegetables" cur={result.current.vegetables} next={result.uploaded.vegetables} />
          <StatRow label="Collections" cur={result.current.collections} next={result.uploaded.collections} />
          {result.uploaded.dateRange && (
            <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">
              Bills from <strong>{result.uploaded.dateRange.from}</strong> to <strong>{result.uploaded.dateRange.to}</strong>
            </p>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>All current data will be <strong>permanently replaced</strong>. A backup of the current state is saved automatically so you can undo this.</span>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {loading ? 'Restoring…' : 'Replace & Restore'}
          </button>
        </div>
      </div>
    </div>
  );
}



// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { settings, saveSettings, loaded } = useSettings();
  const [form, setForm] = useState<CompanySettings>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // DB restore state
  const dbFileRef = useRef<HTMLInputElement>(null);
  const [dbStatus, setDbStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle');
  const [dbError, setDbError] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [undoBackupFile, setUndoBackupFile] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);



  const [lastDbBackupTime, setLastDbBackupTime] = useState<number | null>(null);

  useEffect(() => {
    const val = localStorage.getItem('lastDbBackupTime');
    if (val) {
      setLastDbBackupTime(parseInt(val, 10));
    }
  }, []);

  const getBackupStatusText = () => {
    if (lastDbBackupTime === null) {
      return {
        type: 'danger',
        text: 'Database backup is overdue (never backed up)',
      };
    }
    const diffMs = Date.now() - lastDbBackupTime;
    const daysSinceBackup = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const daysLeft = 7 - daysSinceBackup;
    if (daysLeft > 0) {
      return {
        type: 'success',
        text: `Backup up to date. Next backup due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`,
      };
    } else if (daysLeft === 0) {
      return {
        type: 'warning',
        text: 'Backup is due today!',
      };
    } else {
      const overdueDays = Math.abs(daysLeft);
      return {
        type: 'danger',
        text: `Backup is overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}!`,
      };
    }
  };

  useEffect(() => { if (loaded) setForm(settings); }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: keyof CompanySettings, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const toggle = (key: keyof CompanySettings) => setForm(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    setSaving(true);
    await saveSettings(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Step 1: file selected → analyze
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setPendingFile(file);
    setDbStatus('analyzing');
    setDbError('');

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/db/analyze', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Analysis failed');
      setAnalyzeResult(await res.json());
      setDbStatus('idle');
      setShowRestoreConfirm(true);
    } catch (err) {
      setDbError(err instanceof Error ? err.message : 'Failed to read the file');
      setDbStatus('error');
      setPendingFile(null);
    }
  };

  // Step 2: user confirmed → restore
  const handleConfirmRestore = async () => {
    if (!pendingFile) return;
    setConfirming(true);
    try {
      const fd = new FormData();
      fd.append('file', pendingFile);
      const res = await fetch('/api/db', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Restore failed');
      const data = await res.json();
      setUndoBackupFile(data.backupFile ?? null);
      setDbStatus('success');
      setShowRestoreConfirm(false);
      setPendingFile(null);
      setAnalyzeResult(null);
      setTimeout(() => { window.location.reload(); }, 2500);
    } catch (err) {
      setDbError(err instanceof Error ? err.message : 'Restore failed');
      setDbStatus('error');
    } finally {
      setConfirming(false);
    }
  };

  const cancelRestore = () => {
    setShowRestoreConfirm(false);
    setPendingFile(null);
    setAnalyzeResult(null);
  };

  // Undo last restore
  const handleUndo = async () => {
    if (!undoBackupFile) return;
    setUndoing(true);
    try {
      const res = await fetch('/api/db/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: undoBackupFile }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Undo failed');
      const data = await res.json();
      setUndoBackupFile(data.backupFile ?? null);
      setDbStatus('idle');
      window.location.reload();
    } catch (err) {
      setDbError(err instanceof Error ? err.message : 'Undo failed');
      setDbStatus('error');
    } finally {
      setUndoing(false);
    }
  };



  if (!loaded) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-64">
        <div className="text-gray-400 animate-pulse">Loading…</div>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Contact Persons</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {field('Contact 1 Name', 'contact1Name', 'P.ரவிச்சந்திரன்')}
          {field('Contact 1 Phone', 'contact1Phone', '99437 16561')}
          {field('Contact 2 Name', 'contact2Name', 'R.நாகராஜன்')}
          {field('Contact 2 Phone', 'contact2Phone', '63810 59515')}
        </div>
      </div>

      {/* Logos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-5">
        <h2 className="font-semibold text-gray-900">Bill Logo Images</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <ImageUpload label="Logo Left (deity / symbol)" value={form.logoLeft} onChange={(v) => set('logoLeft', v)} />
          <ImageUpload label="Logo Right (product / basket)" value={form.logoRight} onChange={(v) => set('logoRight', v)} />
        </div>
      </div>

      {/* Bill preview */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
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

      {/* ── Database Backup ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <DatabaseBackup className="w-4 h-4" /> Database Backup &amp; Restore
        </h2>
        <p className="text-sm text-gray-500">
          Download your database for safekeeping, or upload a previous backup to restore it.
        </p>

        {/* Backup Status Badge */}
        <div className="pt-1">
          {(() => {
            const status = getBackupStatusText();
            if (status.type === 'success') {
              return (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-xs md:text-sm font-medium inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{status.text}</span>
                </div>
              );
            }
            if (status.type === 'warning') {
              return (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg text-xs md:text-sm font-medium inline-flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                  <span>{status.text}</span>
                </div>
              );
            }
            return (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs md:text-sm font-medium inline-flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 animate-pulse" />
                <span>{status.text}</span>
              </div>
            );
          })()}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              const now = Date.now();
              localStorage.setItem('lastDbBackupTime', now.toString());
              setLastDbBackupTime(now);
              window.location.href = '/api/db';
            }}
            className="flex items-center gap-2 border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Database
          </button>

          <button
            type="button"
            onClick={() => dbFileRef.current?.click()}
            disabled={dbStatus === 'analyzing'}
            className="flex items-center gap-2 border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            {dbStatus === 'analyzing' ? 'Analyzing…' : 'Restore from File'}
          </button>

          <input
            ref={dbFileRef}
            type="file"
            accept=".db"
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>

        {/* Success banner with Undo */}
        {dbStatus === 'success' && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
            <span className="text-green-700 text-sm font-medium flex-1">Database restored successfully. Reloading…</span>
            {undoBackupFile && (
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoing}
                className="flex items-center gap-1.5 text-xs font-medium text-green-700 border border-green-300 bg-white hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60 shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                {undoing ? 'Undoing…' : 'Undo Restore'}
              </button>
            )}
          </div>
        )}

        {/* Error banner */}
        {dbStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{dbError}</span>
            <button type="button" onClick={() => setDbStatus('idle')} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}



        <p className="text-xs text-gray-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          A backup is saved automatically before every restore, so you can always undo.
        </p>
      </div>

      {/* Save settings button */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* Modals */}
      {showRestoreConfirm && analyzeResult && (
        <RestoreConfirmModal
          result={analyzeResult}
          onConfirm={handleConfirmRestore}
          onCancel={cancelRestore}
          loading={confirming}
        />
      )}


    </div>
  );
}
