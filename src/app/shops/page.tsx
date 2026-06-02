'use client';

import { useState, useEffect, useRef } from 'react';
import { useShops, usePurchases } from '@/lib/storage';
import { Search, Plus, X, Store, IndianRupee, Banknote, Trash2, ChevronRight } from 'lucide-react';
import { Shop } from '@/lib/types';
import { fmtINR } from '@/lib/format';
import Link from 'next/link';
import clsx from 'clsx';

export default function ShopsPage() {
  const { shops, addShop, updateShop, deleteShop, loaded } = useShops();
  const { purchases, loaded: purchasesLoaded } = usePurchases();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', nickname: '', phone: '', code: '', pendingBalance: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [payTarget, setPayTarget] = useState<Shop | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDiscount, setPayDiscount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payDone, setPayDone] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const payAmountRef = useRef<HTMLInputElement>(null);
  const payDiscountRef = useRef<HTMLInputElement>(null);
  const payNoteRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (payTarget) setTimeout(() => payAmountRef.current?.focus(), 50);
  }, [payTarget]);

  if (!mounted || !loaded || !purchasesLoaded) {
    return <div className="p-6 flex items-center justify-center min-h-64"><div className="text-gray-400 animate-pulse">Loading...</div></div>;
  }

  const filtered = shops
    .filter((s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.nickname && s.nickname.toLowerCase().includes(search.toLowerCase())) ||
      (s.phone && s.phone.includes(search)) ||
      (s.code && String(s.code).includes(search))
    )
    .sort((a, b) => (b.pendingBalance || 0) - (a.pendingBalance || 0));

  const purchaseCountMap: Record<string, number> = {};
  purchases.forEach((p) => { purchaseCountMap[p.shopId] = (purchaseCountMap[p.shopId] || 0) + 1; });

  const totalOwed = shops.reduce((s, shop) => s + Math.max(0, shop.pendingBalance), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Shop name is required.'); return; }
    setSaving(true);
    addShop({
      name: form.name.trim(),
      nickname: form.nickname.trim() || undefined,
      phone: form.phone.trim() || undefined,
      code: form.code ? parseInt(form.code) : undefined,
      pendingBalance: parseFloat(form.pendingBalance) || 0,
    });
    setForm({ name: '', nickname: '', phone: '', code: '', pendingBalance: '' });
    setShowForm(false);
    setSaving(false);
  };

  const handlePay = async () => {
    if (!payTarget) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;
    const discount = parseFloat(payDiscount) || 0;
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    await fetch('/api/shop-payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: crypto.randomUUID(), shopId: payTarget.id, shopName: payTarget.name,
        amount, discount: discount || undefined, date: today, note: payNote, createdAt: new Date().toISOString(),
      }),
    });
    updateShop(payTarget.id, { pendingBalance: payTarget.pendingBalance - amount - discount });
    setPayDone(payTarget.name);
    setPayTarget(null);
    setPayAmount('');
    setPayDiscount('');
    setPayNote('');
    setTimeout(() => setPayDone(null), 3000);
  };

  const handleDelete = (id: string) => {
    deleteShop(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">கடைகள் — Shops</h1>
          <p className="text-gray-500 text-sm mt-1">Supplier shops you buy from</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm self-start"
        >
          <Plus className="w-4 h-4" /> Add Shop
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-5 h-5 text-orange-500" />
            <span className="text-gray-500 text-sm">Total Shops</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{shops.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-5 h-5 text-red-500" />
            <span className="text-gray-500 text-sm">Total I Owe</span>
          </div>
          <div className="text-2xl font-bold text-red-600">₹{fmtINR(totalOwed)}</div>
          <div className="text-xs text-gray-400 mt-1">Pending to pay shops</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, code..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
        />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
      </div>

      {payDone && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <Banknote className="w-4 h-4" /> Payment recorded for {payDone}
        </div>
      )}

      {/* Shop list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
          <Store className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No shops found</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-orange-600 text-sm hover:underline">Add first shop</button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((shop) => (
            <div key={shop.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between gap-3">
              <Link href={`/shops/${shop.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <span className="text-orange-700 font-bold">{shop.name.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    {shop.name}
                    {shop.code && <span className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{shop.code}</span>}
                  </div>
                  {shop.nickname && <div className="text-gray-500 text-xs italic">{shop.nickname}</div>}
                  {shop.phone && <div className="text-gray-400 text-xs">{shop.phone}</div>}
                  <div className="text-xs text-gray-400">{purchaseCountMap[shop.id] || 0} purchases</div>
                </div>
              </Link>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className={clsx('font-bold text-sm flex items-center gap-0.5', shop.pendingBalance > 0 ? 'text-red-600' : 'text-green-600')}>
                    <IndianRupee className="w-3.5 h-3.5" />{fmtINR(Math.abs(shop.pendingBalance))}
                  </div>
                  <div className="text-xs text-gray-400">{shop.pendingBalance > 0 ? 'I owe' : shop.pendingBalance < 0 ? 'They owe' : 'Settled'}</div>
                </div>
                {shop.pendingBalance > 0 && (
                  <button
                    onClick={() => { setPayTarget(shop); setPayAmount(''); setPayNote(''); }}
                    className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                  >
                    <Banknote className="w-3.5 h-3.5" /> Pay
                  </button>
                )}
                <Link href={`/shops/${shop.id}`} className="text-gray-300 hover:text-orange-500 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setDeleteConfirm(shop.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Shop Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-bold text-gray-900">Add Shop</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name <span className="text-red-500">*</span></label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Murugan Vegetables"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                  <input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                    placeholder="e.g. முருகன்"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input type="number" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. 1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance (₹)</label>
                <p className="text-xs text-gray-400 mb-1">Amount already owed to this shop before first entry</p>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" min="0" step="0.01" value={form.pendingBalance}
                    onChange={(e) => setForm({ ...form, pendingBalance: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-medium transition-colors text-sm disabled:opacity-60">
                  {saving ? 'Adding...' : 'Add Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {payTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-bold text-gray-900">Pay to {payTarget.name}</h2>
              <button onClick={() => { setPayTarget(null); setPayAmount(''); setPayDiscount(''); setPayNote(''); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-700">
                Current balance owed: <strong>₹{fmtINR(payTarget.pendingBalance)}</strong>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input ref={payAmountRef} type="number" min="0" step="0.01" value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); payDiscountRef.current?.focus(); } }}
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>
                {payTarget.pendingBalance > 0 && (
                  <button onClick={() => setPayAmount(String(payTarget.pendingBalance))}
                    className="mt-1.5 text-xs text-green-700 border border-green-200 px-3 py-1 rounded-full hover:bg-green-50 transition-colors">
                    Pay full ₹{fmtINR(payTarget.pendingBalance)}
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input ref={payDiscountRef} type="number" min="0" step="0.01" value={payDiscount}
                    onChange={(e) => setPayDiscount(e.target.value)}
                    placeholder="0.00"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); payNoteRef.current?.focus(); } }}
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" />
                  {payDiscount && parseFloat(payDiscount) > 0 && payTarget.pendingBalance > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-orange-500 font-medium pointer-events-none">
                      {((parseFloat(payDiscount) / payTarget.pendingBalance) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                <input ref={payNoteRef} value={payNote} onChange={(e) => setPayNote(e.target.value)}
                  placeholder="e.g. Cash payment"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlePay(); } }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setPayTarget(null); setPayAmount(''); setPayDiscount(''); setPayNote(''); }} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">Cancel</button>
                <button onClick={handlePay} disabled={!payAmount || parseFloat(payAmount) <= 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2">
                  <Banknote className="w-4 h-4" /> Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Delete shop?</h2>
            <p className="text-sm text-gray-500">This will delete the shop and all purchase records linked to it.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-medium transition-colors text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
