'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Banknote, Search, X, IndianRupee, Calendar, TrendingUp, Users, Check, Pencil } from 'lucide-react';
import { Collection } from '@/lib/types';
import clsx from 'clsx';
import { fmtINR } from '@/lib/format';

function getLocalDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDate(dateStr: string, today: string) {
  if (dateStr === today) return 'Today';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function EditableAmount({ collection, onSave }: { collection: Collection; onSave: (id: string, amount: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(collection.amount));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const n = parseFloat(value);
    if (n > 0 && n !== collection.amount) onSave(collection.id, n);
    else setValue(String(collection.amount));
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1" onClick={e => e.preventDefault()}>
        <span className="text-green-700"><IndianRupee className="w-4 h-4" /></span>
        <input
          ref={inputRef}
          type="number"
          min="1"
          step="1"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setValue(String(collection.amount)); setEditing(false); } }}
          onBlur={commit}
          className="w-24 border border-green-400 rounded-lg px-2 py-0.5 text-sm font-bold text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button type="button" onMouseDown={e => { e.preventDefault(); commit(); }} className="text-green-600 hover:text-green-800">
          <Check className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 group">
      <span className="font-bold text-green-700 flex items-center gap-0.5 text-base">
        <IndianRupee className="w-4 h-4" />{fmtINR(collection.amount)}
      </span>
      <button
        type="button"
        onClick={e => { e.preventDefault(); setEditing(true); }}
        className="p-3 ml-4 bg-green-200 rounded-lg text-gray-400 hover:text-green-600 transition-opacity"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [view, setView] = useState<'list' | 'report'>('list');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetch('/api/collections')
      .then(r => r.json())
      .then((data: Collection[]) => { setCollections(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const handleAmountSave = async (id: string, amount: number) => {
    const res = await fetch(`/api/collections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (res.ok) {
      const updated: Collection = await res.json();
      setCollections(prev => prev.map(c => c.id === id ? updated : c));
    }
  };

  if (!mounted || !loaded) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-64">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  const today = getLocalDate();
  const thisMonth = today.slice(0, 7);

  const filtered = collections.filter(c => {
    const matchSearch = !search || c.customerName.toLowerCase().includes(search.toLowerCase());
    const matchDate = !filterDate || c.date === filterDate;
    return matchSearch && matchDate;
  });

  // Stats
  const totalAll = collections.reduce((s, c) => s + c.amount, 0);
  const totalToday = collections.filter(c => c.date === today).reduce((s, c) => s + c.amount, 0);
  const totalMonth = collections.filter(c => c.date.startsWith(thisMonth)).reduce((s, c) => s + c.amount, 0);

  // Group filtered by date
  const grouped: Record<string, Collection[]> = {};
  filtered.forEach(c => {
    if (!grouped[c.date]) grouped[c.date] = [];
    grouped[c.date].push(c);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Per-customer report
  const customerTotals: Record<string, { name: string; id: string; total: number; count: number }> = {};
  filtered.forEach(c => {
    if (!customerTotals[c.customerId]) {
      customerTotals[c.customerId] = { name: c.customerName, id: c.customerId, total: 0, count: 0 };
    }
    customerTotals[c.customerId].total += c.amount;
    customerTotals[c.customerId].count += 1;
  });
  const customerRows = Object.values(customerTotals).sort((a, b) => b.total - a.total);

  // Daily report
  const allDates = [...new Set(filtered.map(c => c.date))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Collections</h1>
        <p className="text-gray-500 text-sm mt-1">
          {collections.length} record{collections.length !== 1 ? 's' : ''} · ₹{fmtINR(totalAll)} total collected
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Banknote className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-gray-500 text-xs">Today</span>
          </div>
          <div className="text-xl font-bold text-green-700 flex items-center gap-0.5">
            <IndianRupee className="w-4 h-4" />{fmtINR(totalToday)}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-gray-500 text-xs">This Month</span>
          </div>
          <div className="text-xl font-bold text-blue-700 flex items-center gap-0.5">
            <IndianRupee className="w-4 h-4" />{fmtINR(totalMonth)}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-gray-500 text-xs">All Time</span>
          </div>
          <div className="text-xl font-bold text-purple-700 flex items-center gap-0.5">
            <IndianRupee className="w-4 h-4" />{fmtINR(totalAll)}
          </div>
        </div>
      </div>

      {/* View toggle + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex bg-gray-100 rounded-lg p-1 shrink-0">
          <button
            onClick={() => setView('list')}
            className={clsx('px-4 py-1.5 rounded-md text-sm font-medium transition-colors', view === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700')}
          >
            List
          </button>
          <button
            onClick={() => setView('report')}
            className={clsx('px-4 py-1.5 rounded-md text-sm font-medium transition-colors', view === 'report' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700')}
          >
            Report
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer..."
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
            onChange={e => setFilterDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-10 pr-8 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Banknote className="w-10 h-10 mx-auto mb-3 opacity-30" />
          {search || filterDate ? (
            <p>No collections match your filters.</p>
          ) : (
            <p className="text-lg font-medium">No collections recorded yet.</p>
          )}
        </div>
      ) : view === 'list' ? (
        /* ── LIST VIEW ── */
        <div className="space-y-6">
          {sortedDates.map(date => {
            const dayEntries = grouped[date];
            const dayTotal = dayEntries.reduce((s, c) => s + c.amount, 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className={clsx('text-sm font-semibold', date === today ? 'text-green-700' : 'text-gray-500')}>
                    {formatDate(date, today)}
                  </span>
                  <span className="text-sm text-gray-400">
                    {dayEntries.length} collection{dayEntries.length !== 1 ? 's' : ''} · ₹{fmtINR(dayTotal)}
                  </span>
                </div>
                <div className="space-y-2">
                  {dayEntries.map(c => (
                    <Link
                      key={c.id}
                      href={`/customers/${c.customerId}`}
                      className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3.5 hover:shadow-sm hover:border-green-200 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <span className="text-green-700 font-bold text-base">{c.customerName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{c.customerName}</div>
                          <div className="text-gray-400 text-xs">
                            {new Date(c.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <EditableAmount collection={c} onSave={handleAmountSave} />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── REPORT VIEW ── */
        <div className="space-y-6">
          {/* By Customer */}
          <div>
            <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              By Customer
              {(search || filterDate) && <span className="text-xs text-gray-400 font-normal">(filtered)</span>}
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Times</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customerRows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/customers/${row.id}`} className="font-medium text-gray-900 hover:text-green-700 hover:underline">
                          {row.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">{row.count}×</td>
                      <td className="px-4 py-3 text-right font-bold text-green-700 flex items-center justify-end gap-0.5">
                        <IndianRupee className="w-3.5 h-3.5" />{fmtINR(row.total, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 font-bold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-center text-gray-500">{filtered.length}×</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700 flex items-center justify-end gap-0.5">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {fmtINR(filtered.reduce((s, c) => s + c.amount, 0), 2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* By Date */}
          <div>
            <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              By Date
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Collections</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allDates.map(date => {
                    const dayEntries = filtered.filter(c => c.date === date);
                    const dayTotal = dayEntries.reduce((s, c) => s + c.amount, 0);
                    return (
                      <tr key={date} className={clsx('hover:bg-gray-50 transition-colors', date === today && 'bg-green-50/40')}>
                        <td className="px-4 py-3">
                          <span className={clsx('font-medium', date === today ? 'text-green-700' : 'text-gray-900')}>
                            {formatDate(date, today)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500">{dayEntries.length}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-700 flex items-center justify-end gap-0.5">
                          <IndianRupee className="w-3.5 h-3.5" />{fmtINR(dayTotal, 2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
