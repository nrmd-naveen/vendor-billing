'use client';

import { useState, useEffect } from 'react';
import { useCustomers, useBills } from '@/lib/storage';
import CustomerCard from '@/components/CustomerCard';
import { Search, UserPlus, X, IndianRupee, Banknote } from 'lucide-react';
import { Customer, CUSTOMER_PREFIXES } from '@/lib/types';

export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer, loaded } = useCustomers();
  const { bills, loaded: billsLoaded } = useBills();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', nickname: '', code: '', phone: '', prefix: 'திரு', pendingBalance: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [collectTarget, setCollectTarget] = useState<Customer | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectDone, setCollectDone] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted || !loaded || !billsLoaded) {
    return <div className="p-6 lg:p-8 flex items-center justify-center min-h-64"><div className="text-gray-400 animate-pulse">Loading...</div></div>;
  }

  const filtered = customers.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.nickname && c.nickname.toLowerCase().includes(search.toLowerCase())) ||
    (c.code && String(c.code).includes(search))
  );

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
    });
    setForm({ name: '', nickname: '', code: '', phone: '', prefix: 'திரு', pendingBalance: '' });
    setShowForm(false);
    setSaving(false);
  };

  const handleCollect = () => {
    if (!collectTarget) return;
    const amount = parseFloat(collectAmount);
    if (isNaN(amount) || amount <= 0) return;
    updateCustomer(collectTarget.id, { pendingBalance: collectTarget.pendingBalance - amount });
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
            {customers.length} customer{customers.length !== 1 ? 's' : ''} &middot; ₹{totalPending.toFixed(0)} total pending
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm self-start sm:self-auto">
          <UserPlus className="w-4 h-4" /> Add Customer
        </button>
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
                <p className="text-xs text-gray-400 mt-1">Leave 0 if starting fresh</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setError(''); }}
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
                <p className="text-sm text-gray-500">{collectTarget.nickname || collectTarget.name} · Balance ₹{collectTarget.pendingBalance.toFixed(0)}</p>
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
                New balance: ₹{Math.max(0, collectTarget.pendingBalance - parseFloat(collectAmount)).toFixed(2)}
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, nickname, code or phone..."
          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
