'use client';

import { useState, useEffect } from 'react';
import { useFarmerBills } from '@/lib/storage';
import { Search, Plus, X, Wheat, IndianRupee } from 'lucide-react';
import { fmtINR } from '@/lib/format';
import Link from 'next/link';
import { FarmerBill } from '@/lib/types';

export default function FarmerBillsPage() {
  const { farmerBills, loaded } = useFarmerBills();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => setMounted(true), []);

  if (!mounted || !loaded) {
    return <div className="p-6 flex items-center justify-center min-h-64"><div className="text-gray-400 animate-pulse">Loading...</div></div>;
  }

  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const filtered = farmerBills.filter((b: FarmerBill) => {
    const matchSearch = !search || b.farmerName.toLowerCase().includes(search.toLowerCase()) || String(b.billNumber).includes(search);
    const matchDate = !dateFilter || b.date === dateFilter;
    return matchSearch && matchDate;
  });

  const todaysBills = farmerBills.filter((b: FarmerBill) => b.date === today);
  const todaysTotal = todaysBills.reduce((s, b) => s + b.subtotal, 0);
  const todaysNet = todaysBills.reduce((s, b) => s + b.netAmount, 0);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">சம்சாரி Bills</h1>
          <p className="text-gray-500 text-sm mt-1">Bills issued to farmers after commission deduction</p>
        </div>
        <Link href="/farmer-bills/new"
          className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm self-start">
          <Plus className="w-4 h-4" /> New Farmer Bill
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2"><Wheat className="w-4 h-4 text-yellow-500" /><span className="text-gray-500 text-xs">Today&apos;s Bills</span></div>
          <div className="text-2xl font-bold text-gray-900">{todaysBills.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2"><IndianRupee className="w-4 h-4 text-yellow-500" /><span className="text-gray-500 text-xs">Received Today</span></div>
          <div className="text-2xl font-bold text-yellow-700">₹{fmtINR(todaysTotal)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2"><IndianRupee className="w-4 h-4 text-green-500" /><span className="text-gray-500 text-xs">Net Paid Today</span></div>
          <div className="text-2xl font-bold text-green-700">₹{fmtINR(todaysNet)}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by farmer or number..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm" />
          {dateFilter && <button onClick={() => setDateFilter('')} className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded-lg">Clear</button>}
          <button onClick={() => setDateFilter(today)} className="text-xs border border-yellow-200 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-50">Today</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
          <Wheat className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No farmer bills found</p>
          <Link href="/farmer-bills/new" className="mt-3 text-yellow-600 text-sm hover:underline block">Create first farmer bill</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map((b: FarmerBill) => (
              <Link key={b.id} href={`/farmer-bills/${b.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                    <span className="text-yellow-700 font-bold text-sm">{b.farmerName.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{b.farmerName}</div>
                    <div className="text-gray-400 text-xs">
                      #{b.billNumber} · {new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      · {b.items.length} item{b.items.length !== 1 ? 's' : ''} · {b.commissionRate}% commission
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-500">Received: ₹{fmtINR(b.subtotal)}</div>
                  <div className="font-semibold text-yellow-700 text-sm">Net: ₹{fmtINR(b.netAmount)}</div>
                  {b.newBalance > 0 && <div className="text-red-500 text-xs">Owe: ₹{fmtINR(b.newBalance)}</div>}
                </div>
              </Link>
            ))}
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between text-sm text-gray-500">
            <span>{filtered.length} bill{filtered.length !== 1 ? 's' : ''}</span>
            <span className="font-medium text-gray-700">Net: ₹{fmtINR(filtered.reduce((s, b) => s + b.netAmount, 0))}</span>
          </div>
        </div>
      )}
    </div>
  );
}
