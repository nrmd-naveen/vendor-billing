'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useShops, usePurchases, useShopPayments } from '@/lib/storage';
import { fmtINR } from '@/lib/format';
import { ArrowLeft, Calendar, Filter, BookOpen } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import ShopLedgerPreview, { LedgerEntry, LedgerItemRow } from '@/components/ShopLedgerPreview';

type RangePreset = 'month' | 'lastmonth' | 'quarter' | 'year' | 'all' | 'custom';

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function getDateRange(preset: RangePreset, customFrom: string, customTo: string) {
  const today = new Date();
  const todayStr = fmt(today);

  if (preset === 'month') {
    return { from: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`, to: todayStr, label: 'This Month' };
  }
  if (preset === 'lastmonth') {
    const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lme = new Date(today.getFullYear(), today.getMonth(), 0);
    return { from: fmt(lm), to: fmt(lme), label: 'Last Month' };
  }
  if (preset === 'quarter') {
    const q = new Date(today); q.setMonth(today.getMonth() - 3);
    return { from: fmt(q), to: todayStr, label: 'Last 3 Months' };
  }
  if (preset === 'year') {
    return { from: `${today.getFullYear()}-01-01`, to: todayStr, label: 'This Year' };
  }
  if (preset === 'all') {
    return { from: '2000-01-01', to: '2099-12-31', label: 'All Time' };
  }
  return { from: customFrom || todayStr, to: customTo || todayStr, label: `${customFrom} to ${customTo}` };
}

function inRange(dateStr: string, from: string, to: string) {
  return dateStr >= from && dateStr <= to;
}

function fmtDisplay(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

export default function ShopLedgerPage() {
  const { id } = useParams<{ id: string }>();
  const { shops, loaded: shopsLoaded } = useShops();
  const { purchases, loaded: purchasesLoaded } = usePurchases();
  const { payments, loaded: paymentsLoaded } = useShopPayments(id);
  const [mounted, setMounted] = useState(false);

  const [preset, setPreset] = useState<RangePreset>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setMounted(true);
    const today = new Date();
    const str = fmt(today);
    setCustomFrom(str);
    setCustomTo(str);
  }, []);

  const shop = shops.find((s) => s.id === id);
  const shopPurchases = useMemo(() => purchases.filter((p) => p.shopId === id), [purchases, id]);

  const { from, to, label } = useMemo(
    () => getDateRange(preset, customFrom, customTo),
    [preset, customFrom, customTo]
  );

  // Opening balance = current pendingBalance minus all transactions from 'from' date onwards
  const openingBalance = useMemo(() => {
    if (!shop) return 0;
    const purchasesOnOrAfter = shopPurchases.filter((p) => p.date >= from);
    const paymentsOnOrAfter = payments.filter((p) => p.date >= from);
    return (
      shop.pendingBalance
      - purchasesOnOrAfter.reduce((s, p) => s + p.subtotal, 0)
      + paymentsOnOrAfter.reduce((s, p) => s + p.amount + (p.discount || 0), 0)
    );
  }, [shop, shopPurchases, payments, from]);

  // Build chronological ledger entries within the date range
  const { entries, totalPurchases, totalPayments, closingBalance } = useMemo(() => {
    const rangedPurchases = shopPurchases
      .filter((p) => inRange(p.date, from, to))
      .map((p) => ({
        id: p.id,
        date: p.date,
        sortKey: p.date + p.createdAt,
        type: 'purchase' as const,
        ref: `#${p.purchaseNumber}`,
        debit: p.subtotal,
        credit: 0,
        items: p.items.map((i): LedgerItemRow => ({
          name: i.vegetableName + (i.description ? ` (${i.description})` : ''),
          sacks: i.sacks.length,
          totalWeight: i.totalWeight,
          pricePerKg: i.pricePerKg,
          amount: i.amount,
        })),
      }));

    const rangedPayments = payments
      .filter((p) => inRange(p.date, from, to))
      .map((p) => ({
        id: p.id,
        date: p.date,
        sortKey: p.date + p.createdAt,
        type: 'payment' as const,
        ref: 'PAY',
        debit: 0,
        credit: p.amount + (p.discount || 0),
        note: p.note || undefined,
        discount: p.discount || undefined,
      }));

    const merged = [...rangedPurchases, ...rangedPayments].sort((a, b) =>
      a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0
    );

    let running = openingBalance;
    const withBalance: LedgerEntry[] = merged.map(({ sortKey: _s, ...e }) => {
      running = running + e.debit - e.credit;
      return { ...e, balance: running };
    });

    const tPurchases = rangedPurchases.reduce((s, e) => s + e.debit, 0);
    const tPayments = rangedPayments.reduce((s, e) => s + e.credit, 0);

    return {
      entries: withBalance,
      totalPurchases: tPurchases,
      totalPayments: tPayments,
      closingBalance: running,
    };
  }, [shopPurchases, payments, from, to, openingBalance]);

  if (!mounted || !shopsLoaded || !purchasesLoaded || !paymentsLoaded) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Shop not found</p>
        <Link href="/shops" className="text-orange-600 hover:underline text-sm mt-2 block">Back to shops</Link>
      </div>
    );
  }

  const presets: { key: RangePreset; label: string }[] = [
    { key: 'month', label: 'This Month' },
    { key: 'lastmonth', label: 'Last Month' },
    { key: 'quarter', label: 'Last 3 Months' },
    { key: 'year', label: 'This Year' },
    { key: 'all', label: 'All Time' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/shops/${id}`} className="text-gray-400 hover:text-gray-600 p-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-orange-500" /> Ledger — {shop.name}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Account statement with purchases and payments</p>
        </div>
      </div>

      {/* Date range filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter className="w-4 h-4 text-orange-500" /> Date Range
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setPreset(p.key);
                setShowCustom(p.key === 'custom');
              }}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                preset === p.key
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {showCustom && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date" value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <span className="text-gray-400">to</span>
            <input
              type="date" value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        )}
        <div className="text-xs text-gray-400">
          Showing: <span className="font-medium text-gray-600">{fmtDisplay(from)}</span> — <span className="font-medium text-gray-600">{fmtDisplay(to)}</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-xs text-gray-400 mb-1">Opening Balance</div>
          <div className={clsx('font-bold text-sm', openingBalance > 0 ? 'text-red-600' : openingBalance < 0 ? 'text-green-600' : 'text-gray-500')}>
            ₹{fmtINR(Math.abs(openingBalance), 2)}
            {openingBalance < 0 ? ' Cr' : openingBalance > 0 ? ' Dr' : ''}
          </div>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
          <div className="text-xs text-orange-600 mb-1">Total Purchases</div>
          <div className="font-bold text-sm text-orange-700">₹{fmtINR(totalPurchases, 2)}</div>
          <div className="text-[11px] text-orange-400 mt-0.5">
            {entries.filter(e => e.type === 'purchase').length} transactions
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="text-xs text-green-600 mb-1">Total Payments</div>
          <div className="font-bold text-sm text-green-700">₹{fmtINR(totalPayments, 2)}</div>
          <div className="text-[11px] text-green-400 mt-0.5">
            {entries.filter(e => e.type === 'payment').length} payments
          </div>
        </div>
        <div className={clsx('rounded-xl p-4 border', closingBalance > 0 ? 'bg-red-50 border-red-100' : closingBalance < 0 ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100')}>
          <div className={clsx('text-xs mb-1', closingBalance > 0 ? 'text-red-500' : closingBalance < 0 ? 'text-green-600' : 'text-gray-400')}>
            Closing Balance
          </div>
          <div className={clsx('font-bold text-sm', closingBalance > 0 ? 'text-red-700' : closingBalance < 0 ? 'text-green-700' : 'text-gray-500')}>
            ₹{fmtINR(Math.abs(closingBalance), 2)}
            {closingBalance < 0 ? ' Cr' : closingBalance > 0 ? ' Dr' : ' (Settled)'}
          </div>
        </div>
      </div>

      {/* Ledger table preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">
            Transaction Ledger — {label}
          </h2>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
              showPreview ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50'
            )}
          >
            {showPreview ? 'Hide Print View' : 'Show Print / Download'}
          </button>
        </div>

        {/* Screen ledger table */}
        {!showPreview && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Ref</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-orange-500 whitespace-nowrap">Purchase (Dr)</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-green-600 whitespace-nowrap">Payment (Cr)</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Balance</th>
                </tr>
              </thead>
              <tbody>
                {/* Opening balance row */}
                <tr className="bg-blue-50 border-b border-blue-100">
                  <td className="px-4 py-2 text-xs text-blue-700 font-medium whitespace-nowrap">{fmtDisplay(from)}</td>
                  <td className="px-4 py-2 text-xs text-blue-500">—</td>
                  <td className="px-4 py-2 text-xs text-blue-700 font-medium">Opening Balance</td>
                  <td className="px-4 py-2 text-right text-xs">—</td>
                  <td className="px-4 py-2 text-right text-xs">—</td>
                  <td className={clsx('px-4 py-2 text-right text-xs font-semibold', openingBalance > 0 ? 'text-red-600' : openingBalance < 0 ? 'text-green-700' : 'text-gray-400')}>
                    {openingBalance === 0 ? '₹0.00' : `₹${fmtINR(Math.abs(openingBalance), 2)}${openingBalance < 0 ? ' Cr' : ' Dr'}`}
                  </td>
                </tr>

                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No transactions in this period</td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors align-top">
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{fmtDisplay(entry.date)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{entry.ref}</td>
                      <td className="px-3 py-2">
                        {entry.type === 'purchase' && entry.items && entry.items.length > 0 ? (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-gray-100 text-gray-400">
                                <th className="text-left pb-1 font-medium">பொருள்</th>
                                <th className="text-center pb-1 font-medium">மூடை</th>
                                <th className="text-right pb-1 font-medium">எடை கி</th>
                                <th className="text-right pb-1 font-medium">தொகை</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.items.map((item, ii) => (
                                <tr key={ii} className="border-b border-gray-50 last:border-0">
                                  <td className="py-0.5 text-gray-800">{item.name}</td>
                                  <td className="py-0.5 text-center text-gray-600">{item.sacks}</td>
                                  <td className="py-0.5 text-right text-gray-600">{item.totalWeight}</td>
                                  <td className="py-0.5 text-right font-medium text-gray-900">₹{fmtINR(item.amount, 2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : entry.type === 'payment' ? (
                          <div>
                            <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 mr-1.5">கட்டணம்</span>
                            {entry.note && <span className="text-gray-500 text-xs">குறிப்பு: {entry.note}</span>}
                            {entry.discount && entry.discount > 0 ? (
                              <div className="text-orange-600 text-xs mt-0.5">தள்ளுபடி: ₹{fmtINR(entry.discount, 2)}</div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-orange-700 font-semibold">கொள்முதல்</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 align-middle">
                        {entry.debit > 0 ? `₹${fmtINR(entry.debit, 2)}` : ''}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-green-700 align-middle">
                        {entry.credit > 0 ? `₹${fmtINR(entry.credit, 2)}` : ''}
                      </td>
                      <td className={clsx('px-4 py-3 text-right text-sm font-semibold align-middle', entry.balance > 0 ? 'text-red-600' : entry.balance < 0 ? 'text-green-700' : 'text-gray-400')}>
                        ₹{fmtINR(Math.abs(entry.balance), 2)}
                        {entry.balance < 0 ? ' வ' : ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {/* Totals */}
              {entries.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-sm font-bold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-orange-700">
                      ₹{fmtINR(totalPurchases, 2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-green-700">
                      ₹{fmtINR(totalPayments, 2)}
                    </td>
                    <td className={clsx('px-4 py-3 text-right text-sm font-bold', closingBalance > 0 ? 'text-red-600' : closingBalance < 0 ? 'text-green-700' : 'text-gray-400')}>
                      ₹{fmtINR(Math.abs(closingBalance), 2)}
                      {closingBalance < 0 ? ' Cr' : closingBalance > 0 ? ' Dr' : ''}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Print / Download preview */}
        {showPreview && (
          <ShopLedgerPreview
            shopName={shop.name}
            shopPhone={shop.phone}
            dateFrom={from}
            dateTo={to}
            openingBalance={openingBalance}
            entries={entries}
            closingBalance={closingBalance}
            totalPurchases={totalPurchases}
            totalPayments={totalPayments}
          />
        )}
      </div>
    </div>
  );
}
