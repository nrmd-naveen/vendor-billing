'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useBills } from '@/lib/storage';
import { PlusCircle, Search, X, IndianRupee, FileText, Calendar } from 'lucide-react';
import { Bill } from '@/lib/types';
import clsx from 'clsx';

export default function BillsPage() {
  const { bills, loaded } = useBills();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => setMounted(true), []);

  if (!mounted || !loaded) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-64">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  const filtered = [...bills]
    .filter((b: Bill) => {
      const matchSearch =
        !search ||
        b.customerName.toLowerCase().includes(search.toLowerCase()) ||
        b.billNumber.toString().includes(search);
      const matchDate = !filterDate || b.date === filterDate;
      return matchSearch && matchDate;
    })
    .sort((a: Bill, b: Bill) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredTotal = filtered.reduce((s: number, b: Bill) => s + b.subtotal, 0);

  // Group by date
  const grouped: Record<string, Bill[]> = {};
  filtered.forEach((b: Bill) => {
    if (!grouped[b.date]) grouped[b.date] = [];
    grouped[b.date].push(b);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const today = new Date().toISOString().split('T')[0];

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    if (dateStr === today) return 'Today';
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Bills</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} bill{filtered.length !== 1 ? 's' : ''}
            {filtered.length > 0 && ` · ₹${filteredTotal.toFixed(0)} total`}
          </p>
        </div>
        <Link
          href="/bills/new"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          New Bill
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer or bill number..."
            className="w-full border border-gray-400 rounded-xl pl-10 pr-4 py-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative sm:w-48">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full border border-gray-400 rounded-xl pl-10 pr-8 py-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
          />
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bills list grouped by date */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          {search || filterDate ? (
            <p>No bills match your filters.</p>
          ) : (
            <>
              <p className="text-lg font-medium mb-1">No bills yet</p>
              <Link href="/bills/new" className="text-green-600 hover:underline text-sm">Create first bill</Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const dayBills = grouped[date];
            const dayTotal = dayBills.reduce((s, b) => s + b.subtotal, 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className={clsx('text-sm font-semibold', date === today ? 'text-green-700' : 'text-gray-500')}>
                    {formatDate(date)}
                  </span>
                  <span className="text-sm text-gray-400">
                    {dayBills.length} bill{dayBills.length !== 1 ? 's' : ''} · ₹{dayTotal.toFixed(0)}
                  </span>
                </div>
                <div className="space-y-2">
                  {dayBills.map((bill: Bill) => (
                    <Link
                      key={bill.id}
                      href={`/bills/${bill.id}`}
                      className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3.5 hover:shadow-sm hover:border-green-200 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{bill.customerName}</div>
                          <div className="text-gray-400 text-xs">
                            Bill #{bill.billNumber} · {bill.items.length} item{bill.items.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-gray-900 flex items-center gap-0.5 justify-end">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {bill.subtotal.toFixed(0)}
                        </div>
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
      )}
    </div>
  );
}
