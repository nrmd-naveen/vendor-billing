'use client';

import { useState, useEffect } from 'react';
import { usePurchases } from '@/lib/storage';
import { Search, Plus, X, ShoppingCart, IndianRupee, FileText } from 'lucide-react';
import { fmtINR } from '@/lib/format';
import Link from 'next/link';
import { Purchase } from '@/lib/types';

export default function PurchasesPage() {
  const { purchases, loaded } = usePurchases();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => setMounted(true), []);

  if (!mounted || !loaded) {
    return <div className="p-6 flex items-center justify-center min-h-64"><div className="text-gray-400 animate-pulse">Loading...</div></div>;
  }

  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const filtered = purchases.filter((p: Purchase) => {
    const matchSearch = !search ||
      p.shopName.toLowerCase().includes(search.toLowerCase()) ||
      String(p.purchaseNumber).includes(search);
    const matchDate = !dateFilter || p.date === dateFilter;
    return matchSearch && matchDate;
  });

  const todaysPurchases = purchases.filter((p: Purchase) => p.date === today);
  const todaysTotal = todaysPurchases.reduce((s, p) => s + p.subtotal, 0);
  const todaysTotalWeight = todaysPurchases.reduce((s, p) => s + p.items.reduce((sw, i) => sw + i.totalWeight, 0), 0);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">கொள்முதல் — Purchases</h1>
          <p className="text-gray-500 text-sm mt-1">Vegetables bought from supplier shops</p>
        </div>
        <Link href="/purchases/new"
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm self-start">
          <Plus className="w-4 h-4" /> New Purchase
        </Link>
      </div>

      {/* Today's summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-orange-500" />
            <span className="text-gray-500 text-xs">Today&apos;s Purchases</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{todaysPurchases.length}</div>
          <div className="text-xs text-gray-400 mt-1">entries today</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-4 h-4 text-orange-500" />
            <span className="text-gray-500 text-xs">Today&apos;s Value</span>
          </div>
          <div className="text-2xl font-bold text-orange-700">₹{fmtINR(todaysTotal)}</div>
          <div className="text-xs text-gray-400 mt-1">total purchased</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-4 h-4 text-orange-500" />
            <span className="text-gray-500 text-xs">Weight Today</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{todaysTotalWeight.toFixed(1)}</div>
          <div className="text-xs text-gray-400 mt-1">kg purchased</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shop or number..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2 py-1 rounded-lg">Clear</button>
          )}
          <button onClick={() => setDateFilter(today)}
            className="text-xs border border-orange-200 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors">
            Today
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
          <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No purchases found</p>
          <Link href="/purchases/new" className="mt-3 text-orange-600 text-sm hover:underline block">Record first purchase</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map((p: Purchase) => (
              <Link key={p.id} href={`/purchases/${p.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <span className="text-orange-700 font-bold text-sm">{p.shopName.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{p.shopName}</div>
                    <div className="text-gray-400 text-xs">
                      #{p.purchaseNumber} &middot; {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      &middot; {p.items.length} item{p.items.length !== 1 ? 's' : ''} · {p.items.reduce((s, i) => s + i.totalWeight, 0).toFixed(1)} kg
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-gray-900 text-sm">₹{fmtINR(p.subtotal)}</div>
                  {p.newBalance > 0 && <div className="text-red-500 text-xs">Owe: ₹{fmtINR(p.newBalance)}</div>}
                  {p.amountPaid > 0 && <div className="text-green-600 text-xs">Paid: ₹{fmtINR(p.amountPaid)}</div>}
                </div>
              </Link>
            ))}
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between text-sm text-gray-500">
            <span>{filtered.length} purchase{filtered.length !== 1 ? 's' : ''}</span>
            <span className="font-medium text-gray-700">Total: ₹{fmtINR(filtered.reduce((s, p) => s + p.subtotal, 0))}</span>
          </div>
        </div>
      )}
    </div>
  );
}
