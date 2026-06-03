'use client';

import { useState, useEffect, useRef } from 'react';
import { usePurchases, useFarmerBills } from '@/lib/storage';
import { Search, Plus, X, ShoppingCart, IndianRupee, FileText, Store, Wheat, ChevronDown } from 'lucide-react';
import { fmtINR } from '@/lib/format';
import Link from 'next/link';
import { Purchase, FarmerBill } from '@/lib/types';

type CombinedEntry =
  | { type: 'shop'; data: Purchase; date: string; sortKey: string }
  | { type: 'farmer'; data: FarmerBill; date: string; sortKey: string };

export default function PurchasesPage() {
  const { purchases, loaded: purchasesLoaded } = usePurchases();
  const { farmerBills, loaded: farmerLoaded } = useFarmerBills();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [tab, setTab] = useState<'all' | 'shop' | 'farmer'>('all');
  const [showNewMenu, setShowNewMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowNewMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!mounted || !purchasesLoaded || !farmerLoaded) {
    return <div className="p-6 flex items-center justify-center min-h-64"><div className="text-gray-400 animate-pulse">Loading...</div></div>;
  }

  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const combined: CombinedEntry[] = [
    ...purchases.map((p: Purchase) => ({
      type: 'shop' as const,
      data: p,
      date: p.date,
      sortKey: p.createdAt,
    })),
    ...farmerBills.map((b: FarmerBill) => ({
      type: 'farmer' as const,
      data: b,
      date: b.date,
      sortKey: b.createdAt,
    })),
  ].sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  const filtered = combined.filter((entry) => {
    if (tab === 'shop' && entry.type !== 'shop') return false;
    if (tab === 'farmer' && entry.type !== 'farmer') return false;
    if (dateFilter && entry.date !== dateFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    if (entry.type === 'shop') {
      const p = entry.data as Purchase;
      return p.shopName.toLowerCase().includes(q) || String(p.purchaseNumber).includes(q);
    } else {
      const b = entry.data as FarmerBill;
      return b.farmerName.toLowerCase().includes(q) || String(b.billNumber).includes(q);
    }
  });

  const todayShop = purchases.filter((p: Purchase) => p.date === today);
  const todayFarmer = farmerBills.filter((b: FarmerBill) => b.date === today);
  const todaysCount = todayShop.length + todayFarmer.length;
  const todaysTotal = todayShop.reduce((s, p) => s + p.subtotal, 0) + todayFarmer.reduce((s, b) => s + b.subtotal, 0);
  const todaysTotalWeight = [
    ...todayShop.flatMap((p) => p.items),
    ...todayFarmer.flatMap((b) => b.items),
  ].reduce((s, i) => s + i.totalWeight, 0);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">கொள்முதல் — Purchases</h1>
          <p className="text-gray-500 text-sm mt-1">Vegetables bought from shops &amp; farmers</p>
        </div>
        <div ref={menuRef} className="relative self-start">
          <button
            onClick={() => setShowNewMenu((v) => !v)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Purchase <ChevronDown className="w-4 h-4" />
          </button>
          {showNewMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 z-10 overflow-hidden">
              <Link
                href="/purchases/new"
                onClick={() => setShowNewMenu(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">From Shop</div>
                  <div className="text-xs text-gray-400">Supplier purchase</div>
                </div>
              </Link>
              <Link
                href="/farmer-bills/new"
                onClick={() => setShowNewMenu(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-yellow-50 transition-colors border-t border-gray-50"
              >
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                  <Wheat className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">From Farmer</div>
                  <div className="text-xs text-gray-400">Farmer commission bill</div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Today's summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-orange-500" />
            <span className="text-gray-500 text-xs">Today&apos;s Purchases</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{todaysCount}</div>
          <div className="text-xs text-gray-400 mt-1">{todayShop.length} shop · {todayFarmer.length} farmer</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-4 h-4 text-orange-500" />
            <span className="text-gray-500 text-xs">Today&apos;s Value</span>
          </div>
          <div className="text-2xl font-bold text-orange-700">₹{fmtINR(todaysTotal)}</div>
          <div className="text-xs text-gray-400 mt-1">total purchased</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-4 h-4 text-orange-500" />
            <span className="text-gray-500 text-xs">Weight Today</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{todaysTotalWeight.toFixed(1)}</div>
          <div className="text-xs text-gray-400 mt-1">kg purchased</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {([
          { key: 'all' as const, label: 'All', Icon: null },
          { key: 'shop' as const, label: 'Shops', Icon: Store },
          { key: 'farmer' as const, label: 'Farmers', Icon: Wheat },
        ]).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or number..."
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
        <div className="bg-white rounded-xl p-10 text-center border border-gray-200 shadow-sm">
          <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No purchases found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map((entry) => {
              if (entry.type === 'shop') {
                const p = entry.data as Purchase;
                return (
                  <Link key={`shop-${p.id}`} href={`/purchases/${p.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900 text-sm">{p.shopName}</div>
                          <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">Shop</span>
                        </div>
                        <div className="text-gray-400 text-xs">
                          #{p.purchaseNumber} · {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          · {p.items.length} item{p.items.length !== 1 ? 's' : ''} · {p.items.reduce((s, i) => s + i.totalWeight, 0).toFixed(1)} kg
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-gray-900 text-sm">₹{fmtINR(p.subtotal)}</div>
                      {p.newBalance > 0 && <div className="text-red-500 text-xs">I Owe: ₹{fmtINR(p.newBalance)}</div>}
                      {p.amountPaid > 0 && <div className="text-green-600 text-xs">Paid: ₹{fmtINR(p.amountPaid)}</div>}
                    </div>
                  </Link>
                );
              } else {
                const b = entry.data as FarmerBill;
                return (
                  <Link key={`farmer-${b.id}`} href={`/farmer-bills/${b.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                        <Wheat className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900 text-sm">{b.farmerName}</div>
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">Farmer</span>
                        </div>
                        <div className="text-gray-400 text-xs">
                          #{b.billNumber} · {new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          · {b.items.length} item{b.items.length !== 1 ? 's' : ''} · {b.items.reduce((s, i) => s + i.totalWeight, 0).toFixed(1)} kg
                          · {b.commissionRate}% comm
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-gray-500">Received: ₹{fmtINR(b.subtotal)}</div>
                      <div className="font-semibold text-yellow-700 text-sm">Net: ₹{fmtINR(b.netAmount)}</div>
                      {b.newBalance > 0 && <div className="text-red-500 text-xs">I Owe: ₹{fmtINR(b.newBalance)}</div>}
                    </div>
                  </Link>
                );
              }
            })}
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-between text-sm text-gray-500">
            <span>{filtered.length} purchase{filtered.length !== 1 ? 's' : ''}</span>
            <span className="font-medium text-gray-700">
              Total: ₹{fmtINR(filtered.reduce((s, e) => {
                if (e.type === 'shop') return s + (e.data as Purchase).subtotal;
                return s + (e.data as FarmerBill).subtotal;
              }, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
