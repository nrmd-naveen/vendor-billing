'use client';

import { useState, useEffect } from 'react';
import { useCustomers, useBills } from '@/lib/storage';
import CustomerCard from '@/components/CustomerCard';
import { Search, UserPlus, X, IndianRupee, Banknote, Camera, Download, CheckSquare, Square } from 'lucide-react';
import { Collection, Customer, CUSTOMER_PREFIXES } from '@/lib/types';
import { toPng } from 'html-to-image';
import { useRef } from 'react';
import { useSettings } from '@/lib/useSettings';
import clsx from 'clsx';
import { fmtINR } from '@/lib/format';

export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer, loaded } = useCustomers();
  const { bills, loaded: billsLoaded } = useBills();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', nickname: '', code: '', phone: '', prefix: 'திரு', pendingBalance: '', photo: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [collectTarget, setCollectTarget] = useState<Customer | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectDone, setCollectDone] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const { settings } = useSettings();
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted || !loaded || !billsLoaded) {
    return <div className="p-6 lg:p-8 flex items-center justify-center min-h-64"><div className="text-gray-400 animate-pulse">Loading...</div></div>;
  }

  const filtered = customers
    .filter((c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.nickname && c.nickname.toLowerCase().includes(search.toLowerCase())) ||
      (c.code && String(c.code).includes(search))
    )
    .sort((a, b) => (b.pendingBalance || 0) - (a.pendingBalance || 0));

  const billCountMap: Record<string, number> = {};
  bills.forEach((b) => { billCountMap[b.customerId] = (billCountMap[b.customerId] || 0) + 1; });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Customer name is required.'); return; }
    setSaving(true);
    addCustomer({
      name: form.name.trim(),
      nickname: form.nickname.trim() || undefined,
      code: form.code ? parseInt(form.code) : undefined,
      phone: form.phone.trim() || undefined,
      prefix: form.prefix || 'திரு',
      pendingBalance: parseFloat(form.pendingBalance) || 0,
      photo: form.photo || undefined,
    });
    setForm({ name: '', nickname: '', code: '', phone: '', prefix: 'திரு', pendingBalance: '', photo: '' });
    setShowForm(false);
    setSaving(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, photo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)));
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedIds.size === 0) return;
    setDownloading(true);
    
    // We'll generate a single PNG containing all selected customers
    const el = reportRef.current;
    if (!el) {
      setDownloading(false);
      return;
    }

    try {
      // Temporarily show the report container
      el.style.display = 'block';
      const dataUrl = await toPng(el, { cacheBust: true, backgroundColor: '#ffffff', quality: 1 });
      el.style.display = 'none';

      const a = document.createElement('a');
      a.download = `customer-balances-${new Date().toISOString().split('T')[0]}.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    } finally {
      setDownloading(false);
      setSelectionMode(false);
      setSelectedIds(new Set());
    }
  };

  const handleCollect = () => {
    if (!collectTarget) return;
    const amount = parseFloat(collectAmount);
    if (isNaN(amount) || amount <= 0) return;
    updateCustomer(collectTarget.id, { pendingBalance: collectTarget.pendingBalance - amount });
    const d = new Date();
    const localDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const newCollection: Collection = {
      id: crypto.randomUUID(),
      customerId: collectTarget.id,
      customerName: collectTarget.name,
      amount,
      date: localDate,
      note: '',
      createdAt: new Date().toISOString(),
    };
    fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCollection),
    });
    setCollectDone(collectTarget.id);
    setCollectTarget(null);
    setCollectAmount('');
    setTimeout(() => setCollectDone(null), 2000);
  };

  const totalPending = customers.reduce((s, c) => s + Math.max(0, c.pendingBalance), 0);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">
            {customers.length} customer{customers.length !== 1 ? 's' : ''} &middot; ₹{fmtINR(totalPending)} total pending
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {selectionMode ? (
            <>
              <button
                onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }}
                className="text-gray-600 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                disabled={downloading}
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadSelected}
                disabled={selectedIds.size === 0 || downloading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Generating...' : `Download (${selectedIds.size})`}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectionMode(true)}
                className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                <CheckSquare className="w-4 h-4" /> Select
              </button>
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                <UserPlus className="w-4 h-4" /> Add Customer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-lg text-gray-900">Add New Customer</h2>
              <button onClick={() => { setShowForm(false); setError(''); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>}

              {/* Prefix + Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prefix & Name <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <select value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                    className="border border-gray-200 rounded-lg px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white w-28 shrink-0">
                    {CUSTOMER_PREFIXES.map(p => <option key={p} value={p}>{p || '(none)'}</option>)}
                  </select>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name" autoFocus
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              {/* Nickname + Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nickname (for bill)</label>
                  <input type="text" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                    placeholder="e.g. CM"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code (number)</label>
                  <input type="number" min="1" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. 1"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="optional"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance Owed (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" min="0" step="0.01" value={form.pendingBalance}
                    onChange={(e) => setForm({ ...form, pendingBalance: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Photo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-dashed border-gray-300 overflow-hidden">
                    {form.photo ? (
                      <img src={form.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input type="file" id="customer-photo" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    <label htmlFor="customer-photo" className="inline-block bg-white border border-gray-200 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                      {form.photo ? 'Change Photo' : 'Upload Photo'}
                    </label>
                    {form.photo && (
                      <button type="button" onClick={() => setForm({ ...form, photo: '' })} className="ml-2 text-red-500 text-sm hover:underline">Remove</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setError(''); setForm({ ...form, photo: '' }); }}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60">
                  {saving ? 'Saving...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Collect Modal */}
      {collectTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">வரவு பதிவு</h3>
                <p className="text-sm text-gray-500">{collectTarget.nickname || collectTarget.name} · Balance ₹{fmtINR(collectTarget.pendingBalance)}</p>
              </div>
            </div>
            <div className="relative mb-3">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={collectAmount}
                onChange={(e) => setCollectAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCollect()}
                placeholder="Amount collected"
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
            </div>
            {collectAmount && parseFloat(collectAmount) > 0 && (
              <p className="text-xs text-gray-400 mb-3">
                New balance: ₹{fmtINR(Math.max(0, collectTarget.pendingBalance - parseFloat(collectAmount)), 2)}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setCollectTarget(null); setCollectAmount(''); }}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCollect}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium transition-colors"
              >
                Collect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Selection */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, nickname, code or phone..."
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
        </div>
        {selectionMode && (
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 font-medium transition-colors"
          >
            {selectedIds.size === filtered.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            All
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {search ? <p>No customers found for &ldquo;{search}&rdquo;</p> : (
            <><p className="text-lg font-medium mb-1">No customers yet</p><p className="text-sm">Add your first customer to get started.</p></>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              billCount={billCountMap[customer.id] || 0}
              onCollect={setCollectTarget}
              collected={collectDone === customer.id}
              selectionMode={selectionMode}
              selected={selectedIds.has(customer.id)}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* Hidden container for Balance Report PNG generation */}
      <div className="fixed -left-[2000px] top-0 print:hidden overflow-hidden">
        <div 
          ref={reportRef} 
          className="bg-white p-8 w-[800px]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <div className="flex items-center justify-between mb-8 border-b-2 border-green-700 pb-4">
            <div>
              <h1 className="text-3xl font-extrabold text-green-700">{settings.name}</h1>
              <p className="text-gray-500 font-medium mt-1">நிலுவைத் தொகை அறிக்கை</p>
            </div>
            <div className="text-right text-sm text-gray-400 font-medium">
              தேதி: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {Array.from(selectedIds).map(id => {
              const cust = customers.find(c => c.id === id);
              if (!cust) return null;
              return (
                <div key={id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-green-100 flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                    {cust.photo ? (
                      <img src={cust.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-green-700 font-bold text-2xl">{cust.name[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-lg truncate">
                      {cust.prefix && <span className="text-gray-500 text-sm mr-1 font-medium">{cust.prefix}</span>}
                      {cust.name}
                    </div>
                    {cust.nickname && <div className="text-sm text-gray-500 font-medium">({cust.nickname})</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className={clsx("text-xl font-black", cust.pendingBalance > 0 ? "text-red-600" : "text-green-600")}>
                      ₹{fmtINR(Math.abs(cust.pendingBalance))}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                      {cust.pendingBalance > 0 ? "Balance" : "Credit"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-12 text-center text-[11px] text-gray-300 font-medium border-t border-gray-100 pt-4">
            This balance statement is generated by {settings.name} Billing App
          </div>
        </div>
      </div>
    </div>
  );
}
