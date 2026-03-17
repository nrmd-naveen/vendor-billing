'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useBills, useCustomers } from '@/lib/storage';
import { Bill } from '@/lib/types';
import { BarChart2, IndianRupee, FileText, Calendar, Printer } from 'lucide-react';
import clsx from 'clsx';

function getWeekRange() {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 6);
  return {
    from: from.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  };
}

function fmt(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ReportsPage() {
  const { bills, loaded: billsLoaded } = useBills();
  const { customers, loaded: customersLoaded } = useCustomers();
  const [mounted, setMounted] = useState(false);
  const initial = getWeekRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  useEffect(() => setMounted(true), []);

  if (!mounted || !billsLoaded || !customersLoaded) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-64">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  const filtered = bills
    .filter((b: Bill) => b.date >= from && b.date <= to)
    .sort((a: Bill, b: Bill) => b.date.localeCompare(a.date));

  const totalBilled = filtered.reduce((s, b) => s + b.subtotal, 0);
  const totalCoolie = filtered.reduce((s, b) => s + (b.coolie || 0), 0);
  const totalCollected = filtered.reduce((s, b) => s + b.amountPaid, 0);
  const totalPending = filtered.reduce((s, b) => s + Math.max(0, b.newBalance), 0);

  // Per-customer summary
  const custMap: Record<string, { name: string; billed: number; collected: number; bills: number }> = {};
  for (const b of filtered) {
    if (!custMap[b.customerId]) custMap[b.customerId] = { name: b.customerName, billed: 0, collected: 0, bills: 0 };
    custMap[b.customerId].billed += b.subtotal;
    custMap[b.customerId].collected += b.amountPaid;
    custMap[b.customerId].bills += 1;
  }
  const custSummary = Object.values(custMap).sort((a, b) => b.billed - a.billed);

  // Group by date
  const byDate: Record<string, Bill[]> = {};
  for (const b of filtered) {
    if (!byDate[b.date]) byDate[b.date] = [];
    byDate[b.date].push(b);
  }
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  const today = new Date().toISOString().split('T')[0];
  function formatDate(d: string) {
    if (d === today) return 'Today';
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart2 className="w-6 h-6 text-gray-500" />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-500 text-sm">{filtered.length} bills in selected period</p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm print:hidden self-start"
        >
          <Printer className="w-4 h-4" /> Print Report
        </button>
      </div>

      {/* Date range */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 print:hidden">
        <div className="flex items-center gap-3 flex-wrap">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Today', fn: () => { const t = new Date().toISOString().split('T')[0]; setFrom(t); setTo(t); } },
              { label: 'This Week', fn: () => { const r = getWeekRange(); setFrom(r.from); setTo(r.to); } },
              { label: 'This Month', fn: () => { const t = new Date(); setFrom(`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-01`); setTo(t.toISOString().split('T')[0]); } },
            ].map(({ label, fn }) => (
              <button key={label} onClick={fn} type="button"
                className="text-xs border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full hover:bg-gray-50 transition-colors">
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Bills', value: filtered.length, prefix: '', color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Total Billed', value: fmt(totalBilled + totalCoolie), prefix: '₹', color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Collected', value: fmt(totalCollected), prefix: '₹', color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Pending', value: fmt(totalPending), prefix: '₹', color: 'text-red-700', bg: 'bg-red-50' },
        ].map(({ label, value, prefix, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4 border border-white`}>
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className={`text-xl font-bold ${color} flex items-center gap-0.5`}>
              {prefix && <IndianRupee className="w-4 h-4" />}{value}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No bills in this date range.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Day-by-day bills — 2/3 width */}
          <div className="lg:col-span-2 space-y-5">
            {dates.map((date) => {
              const dayBills = byDate[date];
              const dayTotal = dayBills.reduce((s, b) => s + b.subtotal, 0);
              return (
                <div key={date}>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className={clsx('text-sm font-semibold', date === today ? 'text-green-700' : 'text-gray-600')}>
                      {formatDate(date)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {dayBills.length} bill{dayBills.length !== 1 ? 's' : ''} · ₹{dayTotal.toFixed(0)}
                    </span>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                    {dayBills.map((bill) => (
                      <Link key={bill.id} href={`/bills/${bill.id}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors print:hover:bg-white">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {bill.customerNickname ? `${bill.customerPrefix || ''} ${bill.customerNickname}`.trim() : bill.customerName}
                          </div>
                          <div className="text-gray-400 text-xs">#{bill.billNumber} · {bill.items.length} item{bill.items.length !== 1 ? 's' : ''}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 text-sm">₹{bill.subtotal.toFixed(0)}</div>
                          {bill.newBalance > 0 ? (
                            <div className="text-red-500 text-xs">Bal: ₹{bill.newBalance.toFixed(0)}</div>
                          ) : (
                            <div className="text-green-600 text-xs">Settled</div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Customer summary — 1/3 width */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 px-1">Customer Summary</h2>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {custSummary.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-400 text-sm">No data</div>
              ) : custSummary.map((c) => {
                const cust = customers.find(cu => cu.name === c.name);
                return (
                  <div key={c.name} className="px-4 py-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                        <div className="text-xs text-gray-400">{c.bills} bill{c.bills !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">₹{c.billed.toFixed(0)}</div>
                        <div className="text-xs text-green-600">paid ₹{c.collected.toFixed(0)}</div>
                      </div>
                    </div>
                    {cust && cust.pendingBalance > 0 && (
                      <div className="mt-1 text-xs text-red-500">
                        Total pending: ₹{cust.pendingBalance.toFixed(0)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
