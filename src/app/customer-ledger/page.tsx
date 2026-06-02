'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useCustomers, useBills } from '@/lib/storage';
import { fmtINR } from '@/lib/format';
import { Search, X, Users, BookOpen, Calendar, Filter, ChevronDown } from 'lucide-react';
import { Customer, Collection } from '@/lib/types';
import clsx from 'clsx';
import { LedgerEntry, LedgerItemRow } from '@/components/ShopLedgerPreview';
import CustomerLedgerPreview from '@/components/CustomerLedgerPreview';

// ── Date helpers ──────────────────────────────────────────────────────────────

type RangePreset = 'month' | 'lastmonth' | 'quarter' | 'year' | 'all' | 'custom';

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function getDateRange(preset: RangePreset, customFrom: string, customTo: string) {
  const today = new Date();
  const todayStr = fmt(today);
  if (preset === 'month')     return { from: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`, to: todayStr, label: 'This Month' };
  if (preset === 'lastmonth') {
    const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lme = new Date(today.getFullYear(), today.getMonth(), 0);
    return { from: fmt(lm), to: fmt(lme), label: 'Last Month' };
  }
  if (preset === 'quarter')   { const q = new Date(today); q.setMonth(today.getMonth() - 3); return { from: fmt(q), to: todayStr, label: 'Last 3 Months' }; }
  if (preset === 'year')      return { from: `${today.getFullYear()}-01-01`, to: todayStr, label: 'This Year' };
  if (preset === 'all')       return { from: '2000-01-01', to: '2099-12-31', label: 'All Time' };
  return { from: customFrom || todayStr, to: customTo || todayStr, label: 'Custom' };
}

function inRange(d: string, from: string, to: string) { return d >= from && d <= to; }

function fmtDisp(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

// ── Customer search dropdown ──────────────────────────────────────────────────

function CustomerDropdown({ customers, selected, onSelect }: {
  customers: Customer[];
  selected: Customer | null;
  onSelect: (c: Customer | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() =>
    customers.filter(c =>
      !query ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.phone && c.phone.includes(query)) ||
      (c.code && String(c.code).includes(query)) ||
      (c.nickname && c.nickname.toLowerCase().includes(query.toLowerCase()))
    ).sort((a, b) => (b.pendingBalance || 0) - (a.pendingBalance || 0)),
    [customers, query]
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(o => !o); setQuery(''); }}
        className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 text-left hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors shadow-sm"
      >
        <Users className="w-4 h-4 text-green-500 shrink-0" />
        {selected ? (
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-gray-900 text-sm">{selected.name}</span>
            {selected.phone && <span className="text-gray-400 text-xs ml-2">{selected.phone}</span>}
          </div>
        ) : (
          <span className="flex-1 text-gray-400 text-sm">Select a customer…</span>
        )}
        <div className="flex items-center gap-2 shrink-0">
          {selected && (
            <span className={clsx('text-xs font-semibold', selected.pendingBalance > 0 ? 'text-red-500' : 'text-green-600')}>
              {selected.pendingBalance > 0 ? `Owes ₹${fmtINR(selected.pendingBalance)}` : selected.pendingBalance < 0 ? `Cr ₹${fmtINR(Math.abs(selected.pendingBalance))}` : 'Settled'}
            </span>
          )}
          <ChevronDown className={clsx('w-4 h-4 text-gray-400 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {selected && (
        <button
          onClick={() => onSelect(null)}
          className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-500"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name, phone, code…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-4 text-sm text-gray-400 text-center">No customers found</div>
            ) : (
              filtered.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => { onSelect(customer); setOpen(false); setQuery(''); }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-green-50 transition-colors',
                    selected?.id === customer.id && 'bg-green-50'
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{customer.name}</div>
                    {customer.phone && <div className="text-xs text-gray-400">{customer.phone}</div>}
                  </div>
                  <span className={clsx('text-xs font-semibold shrink-0', customer.pendingBalance > 0 ? 'text-red-500' : customer.pendingBalance < 0 ? 'text-green-600' : 'text-gray-400')}>
                    {customer.pendingBalance > 0 ? `₹${fmtINR(customer.pendingBalance)}` : customer.pendingBalance < 0 ? `Cr ₹${fmtINR(Math.abs(customer.pendingBalance))}` : 'Settled'}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PRESETS: { key: RangePreset; label: string }[] = [
  { key: 'month',     label: 'This Month' },
  { key: 'lastmonth', label: 'Last Month' },
  { key: 'quarter',   label: 'Last 3 Months' },
  { key: 'year',      label: 'This Year' },
  { key: 'all',       label: 'All Time' },
  { key: 'custom',    label: 'Custom' },
];

export default function CustomerLedgerPage() {
  const { customers, loaded: customersLoaded } = useCustomers();
  const { bills, loaded: billsLoaded } = useBills();
  const [mounted, setMounted] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [preset, setPreset] = useState<RangePreset>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    const str = fmt(new Date());
    setCustomFrom(str);
    setCustomTo(str);
  }, []);

  useEffect(() => {
    setShowPreview(false);
    if (!selectedCustomer) { setCollections([]); setCollectionsLoaded(false); return; }
    setCollectionsLoaded(false);
    fetch(`/api/collections?customerId=${selectedCustomer.id}`)
      .then(r => r.json())
      .then(data => { setCollections(data); setCollectionsLoaded(true); })
      .catch(() => setCollectionsLoaded(true));
  }, [selectedCustomer?.id]);

  const { from, to, label } = useMemo(
    () => getDateRange(preset, customFrom, customTo),
    [preset, customFrom, customTo]
  );

  const customerBills = useMemo(
    () => selectedCustomer ? bills.filter(b => b.customerId === selectedCustomer.id) : [],
    [bills, selectedCustomer]
  );

  const openingBalance = useMemo(() => {
    if (!selectedCustomer) return 0;
    const billsOnOrAfter = customerBills.filter(b => b.date >= from);
    const collectionsOnOrAfter = collections.filter(c => c.date >= from);
    return (
      selectedCustomer.pendingBalance
      - billsOnOrAfter.reduce((s, b) => s + b.subtotal + b.coolie + b.vadakai - b.amountPaid, 0)
      + collectionsOnOrAfter.reduce((s, c) => s + c.amount, 0)
    );
  }, [selectedCustomer, customerBills, collections, from]);

  const { entries, totalBills, totalCollections, closingBalance } = useMemo(() => {
    const rangedBills = customerBills
      .filter(b => inRange(b.date, from, to))
      .map(b => ({
        id: b.id,
        date: b.date,
        sortKey: b.date + b.createdAt,
        type: 'purchase' as const,
        ref: `#${b.billNumber}`,
        debit: b.subtotal + b.coolie + b.vadakai,
        credit: b.amountPaid,
        items: b.items.map((i): LedgerItemRow => ({
          name: i.vegetableName + (i.description ? ` (${i.description})` : ''),
          sacks: i.sacks.length,
          totalWeight: i.totalWeight,
          pricePerKg: i.pricePerKg,
          amount: i.amount,
        })),
      }));

    const rangedCollections = collections
      .filter(c => inRange(c.date, from, to))
      .map(c => ({
        id: c.id,
        date: c.date,
        sortKey: c.date + c.createdAt,
        type: 'payment' as const,
        ref: 'COL',
        debit: 0,
        credit: c.amount,
        note: c.note || undefined,
      }));

    const merged = [...rangedBills, ...rangedCollections].sort((a, b) =>
      a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0
    );

    let running = openingBalance;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const withBalance: LedgerEntry[] = merged.map(({ sortKey: _s, ...e }) => {
      running = running + e.debit - e.credit;
      return { ...e, balance: running };
    });

    return {
      entries: withBalance,
      totalBills: rangedBills.reduce((s, e) => s + e.debit, 0),
      totalCollections: rangedCollections.reduce((s, e) => s + e.credit, 0) + rangedBills.reduce((s, e) => s + e.credit, 0),
      closingBalance: running,
    };
  }, [customerBills, collections, from, to, openingBalance]);

  if (!mounted || !customersLoaded || !billsLoaded) {
    return <div className="p-6 flex items-center justify-center min-h-64"><div className="text-gray-400 animate-pulse">Loading…</div></div>;
  }

  return (
    <div className="p-4 lg:p-8 space-y-5 max-w-5xl">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-green-500" /> Customer Ledger
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Customer account statement — bills, collections, running balance</p>
      </div>

      {/* Customer selector */}
      <CustomerDropdown customers={customers} selected={selectedCustomer} onSelect={setSelectedCustomer} />

      {/* Date range */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
          <Filter className="w-3.5 h-3.5 text-green-500" /> Date Range
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => { setPreset(p.key); setShowCustom(p.key === 'custom'); }}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                preset === p.key
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {showCustom && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <span className="text-gray-400 text-xs">to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
        )}
        <div className="text-[11px] text-gray-400">{fmtDisp(from)} — {fmtDisp(to)}</div>
      </div>

      {/* Content — only when customer selected */}
      {!selectedCustomer ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-green-300" />
          </div>
          <p className="text-gray-500 text-sm">Select a customer above to view their ledger</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm">
              <div className="text-[11px] text-gray-400 mb-1">Opening Balance</div>
              <div className={clsx('font-bold text-sm', openingBalance > 0 ? 'text-red-600' : openingBalance < 0 ? 'text-green-600' : 'text-gray-400')}>
                ₹{fmtINR(Math.abs(openingBalance), 2)}{openingBalance < 0 ? ' Cr' : openingBalance > 0 ? ' Dr' : ''}
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-3.5 border border-green-100">
              <div className="text-[11px] text-green-600 mb-1">Bills</div>
              <div className="font-bold text-sm text-green-700">₹{fmtINR(totalBills, 2)}</div>
              <div className="text-[10px] text-green-300 mt-0.5">{entries.filter(e => e.type === 'purchase').length} bills</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-100">
              <div className="text-[11px] text-blue-600 mb-1">Collections</div>
              <div className="font-bold text-sm text-blue-700">₹{fmtINR(totalCollections, 2)}</div>
              <div className="text-[10px] text-blue-300 mt-0.5">{entries.filter(e => e.type === 'payment').length} collections</div>
            </div>
            <div className={clsx('rounded-xl p-3.5 border', closingBalance > 0 ? 'bg-red-50 border-red-100' : closingBalance < 0 ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100')}>
              <div className={clsx('text-[11px] mb-1', closingBalance > 0 ? 'text-red-500' : closingBalance < 0 ? 'text-green-600' : 'text-gray-400')}>Closing Balance</div>
              <div className={clsx('font-bold text-sm', closingBalance > 0 ? 'text-red-700' : closingBalance < 0 ? 'text-green-700' : 'text-gray-400')}>
                ₹{fmtINR(Math.abs(closingBalance), 2)}{closingBalance < 0 ? ' Cr' : closingBalance > 0 ? ' Dr' : ''}
              </div>
            </div>
          </div>

          {/* Ledger table / preview toggle */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 text-sm">
                {selectedCustomer.name} — {label}
                {entries.length > 0 && <span className="ml-2 text-xs text-gray-400 font-normal">({entries.length} entries)</span>}
              </h2>
              <button
                onClick={() => setShowPreview(v => !v)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  showPreview ? 'bg-green-600 text-white border-green-600' : 'text-green-600 border-green-200 hover:bg-green-50'
                )}
              >
                {showPreview ? 'Hide Print View' : 'Print / Download'}
              </button>
            </div>

            {/* Screen ledger table */}
            {!showPreview && (
              <div className="overflow-x-auto">
                {!collectionsLoaded ? (
                  <div className="py-10 text-center text-gray-400 text-sm animate-pulse">Loading…</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Ref</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Details</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-green-600 whitespace-nowrap">Bill (Dr)</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-blue-600 whitespace-nowrap">Collection (Cr)</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-blue-50 border-b border-blue-100">
                        <td className="px-4 py-2 text-xs text-blue-700 font-medium whitespace-nowrap">{fmtDisp(from)}</td>
                        <td className="px-4 py-2 text-xs text-blue-400">—</td>
                        <td className="px-4 py-2 text-xs text-blue-700 font-medium">Opening Balance</td>
                        <td className="px-4 py-2 text-right text-xs">—</td>
                        <td className="px-4 py-2 text-right text-xs">—</td>
                        <td className={clsx('px-4 py-2 text-right text-xs font-semibold', openingBalance > 0 ? 'text-red-600' : openingBalance < 0 ? 'text-green-700' : 'text-gray-400')}>
                          {openingBalance === 0 ? '₹0.00' : `₹${fmtINR(Math.abs(openingBalance), 2)}${openingBalance < 0 ? ' Cr' : ' Dr'}`}
                        </td>
                      </tr>
                      {entries.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">No transactions in this period</td></tr>
                      ) : (
                        entries.map(entry => (
                          <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors align-top">
                            <td className="px-4 py-3 text-sm whitespace-nowrap">{fmtDisp(entry.date)}</td>
                            <td className="px-4 py-3 text-xs text-gray-400 font-mono">{entry.ref}</td>
                            <td className="px-3 py-2">
                              {entry.type === 'purchase' && entry.items && entry.items.length > 0 ? (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-gray-100 text-gray-400">
                                      <th className="text-left pb-1 font-medium">பொருள்</th>
                                      <th className="text-center pb-1 font-medium w-12">மூடை</th>
                                      <th className="text-right pb-1 font-medium w-16">எடை கி</th>
                                      <th className="text-right pb-1 font-medium w-20">தொகை</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {entry.items.map((item, ii) => (
                                      <tr key={ii} className="border-b border-gray-50 last:border-0">
                                        <td className="py-0.5 text-gray-800">{item.name}</td>
                                        <td className="py-0.5 text-center text-gray-500">{item.sacks}</td>
                                        <td className="py-0.5 text-right text-gray-500">{item.totalWeight}</td>
                                        <td className="py-0.5 text-right font-medium text-gray-900">₹{fmtINR(item.amount, 2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : entry.type === 'payment' ? (
                                <div>
                                  <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 mr-1.5">வசூல்</span>
                                  {entry.note && <span className="text-gray-500 text-xs">குறிப்பு: {entry.note}</span>}
                                </div>
                              ) : (
                                <span className="text-xs text-green-700 font-semibold">விற்பனை</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 align-middle">
                              {entry.debit > 0 ? `₹${fmtINR(entry.debit, 2)}` : ''}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-blue-700 align-middle">
                              {entry.credit > 0 ? `₹${fmtINR(entry.credit, 2)}` : ''}
                            </td>
                            <td className={clsx('px-4 py-3 text-right text-sm font-semibold align-middle', entry.balance > 0 ? 'text-red-600' : entry.balance < 0 ? 'text-green-700' : 'text-gray-400')}>
                              ₹{fmtINR(Math.abs(entry.balance), 2)}{entry.balance < 0 ? ' வ' : ''}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {entries.length > 0 && (
                      <tfoot>
                        <tr className="bg-gray-50 border-t-2 border-gray-200">
                          <td className="px-4 py-3" /><td className="px-4 py-3" />
                          <td className="px-4 py-3 text-sm font-bold text-gray-700">Total</td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-green-700">₹{fmtINR(totalBills, 2)}</td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-blue-700">₹{fmtINR(totalCollections, 2)}</td>
                          <td className={clsx('px-4 py-3 text-right text-sm font-bold', closingBalance > 0 ? 'text-red-600' : closingBalance < 0 ? 'text-green-700' : 'text-gray-400')}>
                            ₹{fmtINR(Math.abs(closingBalance), 2)}{closingBalance < 0 ? ' வ' : ''}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                )}
              </div>
            )}

            {showPreview && (
              <CustomerLedgerPreview
                customerName={selectedCustomer.name}
                customerPhone={selectedCustomer.phone}
                dateFrom={from}
                dateTo={to}
                openingBalance={openingBalance}
                entries={entries}
                closingBalance={closingBalance}
                totalBills={totalBills}
                totalCollections={totalCollections}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
