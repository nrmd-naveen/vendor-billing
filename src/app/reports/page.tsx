'use client';

import { useState, useEffect, useMemo } from 'react';
import { useBills, usePurchases, useFarmerBills } from '@/lib/storage';
import {
  TrendingUp, TrendingDown, ShoppingCart, IndianRupee, FileText,
  Download, Printer, Calendar, ChevronDown, Users, Wheat, ArrowRight,
  BarChart2, Filter
} from 'lucide-react';
import { Bill, Purchase, FarmerBill } from '@/lib/types';
import { fmtINR } from '@/lib/format';
import clsx from 'clsx';
import Link from 'next/link';

type RangePreset = 'today' | 'week' | 'month' | 'lastmonth' | 'quarter' | 'all' | 'custom';
type ActiveTab = 'summary' | 'sales' | 'purchases' | 'farmers';

function getDateRange(preset: RangePreset, customFrom: string, customTo: string): { from: string; to: string; label: string } {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayStr = fmt(today);

  if (preset === 'today') return { from: todayStr, to: todayStr, label: "Today" };
  if (preset === 'week') {
    const day = today.getDay();
    const start = new Date(today); start.setDate(today.getDate() - day);
    return { from: fmt(start), to: todayStr, label: 'This Week' };
  }
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
  if (preset === 'all') return { from: '2000-01-01', to: '2099-12-31', label: 'All Time' };
  return { from: customFrom, to: customTo, label: `${customFrom} → ${customTo}` };
}

function inRange(dateStr: string, from: string, to: string) {
  return dateStr >= from && dateStr <= to;
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function ReportsPage() {
  const { bills, loaded: billsLoaded } = useBills();
  const { purchases, loaded: purchasesLoaded } = usePurchases();
  const { farmerBills, loaded: farmerBillsLoaded } = useFarmerBills();
  const [mounted, setMounted] = useState(false);

  const [preset, setPreset] = useState<RangePreset>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    setMounted(true);
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    setCustomFrom(todayStr);
    setCustomTo(todayStr);
  }, []);

  const { from, to, label } = useMemo(() => getDateRange(preset, customFrom, customTo), [preset, customFrom, customTo]);

  const filteredBills = useMemo(() => bills.filter((b: Bill) => inRange(b.date, from, to)), [bills, from, to]);
  const filteredPurchases = useMemo(() => purchases.filter((p: Purchase) => inRange(p.date, from, to)), [purchases, from, to]);
  const filteredFarmerBills = useMemo(() => farmerBills.filter((fb: FarmerBill) => inRange(fb.date, from, to)), [farmerBills, from, to]);

  const totalSales = useMemo(() => filteredBills.reduce((s, b) => s + b.subtotal, 0), [filteredBills]);
  const totalPurchases = useMemo(() => filteredPurchases.reduce((s, p) => s + p.subtotal, 0), [filteredPurchases]);
  const totalCommission = useMemo(() => filteredFarmerBills.reduce((s, fb) => s + fb.commission, 0), [filteredFarmerBills]);
  const totalFarmerPurchases = useMemo(() => filteredFarmerBills.reduce((s, fb) => s + fb.subtotal, 0), [filteredFarmerBills]);
  const netProfit = totalSales - totalPurchases + totalCommission;
  const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  const totalBillsPaid = useMemo(() => filteredBills.reduce((s, b) => s + b.amountPaid, 0), [filteredBills]);
  const totalBillsBalance = useMemo(() => filteredBills.reduce((s, b) => s + Math.max(0, b.newBalance), 0), [filteredBills]);
  const totalPurchasesPaid = useMemo(() => filteredPurchases.reduce((s, p) => s + p.amountPaid, 0), [filteredPurchases]);
  const totalFarmerPaid = useMemo(() => filteredFarmerBills.reduce((s, fb) => s + fb.amountPaid, 0), [filteredFarmerBills]);

  const handlePrint = () => window.print();

  const handleExportPDF = async () => {
    const el = document.getElementById('report-content');
    if (!el) return;
    const { toPng } = await import('html-to-image');
    const { jsPDF } = await import('jspdf');
    const dataUrl = await toPng(el, { cacheBust: true, backgroundColor: '#f9fafb', pixelRatio: 1.5 });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 40;
    const imgHeight = (el.offsetHeight / el.offsetWidth) * imgWidth;
    pdf.addImage(dataUrl, 'PNG', 20, 20, imgWidth, imgHeight);
    pdf.save(`report-${label.replace(/\s/g, '-')}-${from}.pdf`);
  };

  if (!mounted || !billsLoaded || !purchasesLoaded || !farmerBillsLoaded) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-64">
        <div className="text-gray-400 animate-pulse">Loading reports...</div>
      </div>
    );
  }

  const presets: { key: RangePreset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'lastmonth', label: 'Last Month' },
    { key: 'quarter', label: '3 Months' },
    { key: 'all', label: 'All Time' },
    { key: 'custom', label: 'Custom' },
  ];

  const tabs: { key: ActiveTab; label: string; icon: React.ElementType }[] = [
    { key: 'summary', label: 'Summary', icon: BarChart2 },
    { key: 'sales', label: `Sales (${filteredBills.length})`, icon: FileText },
    { key: 'purchases', label: `Purchases (${filteredPurchases.length})`, icon: ShoppingCart },
    { key: 'farmers', label: `Farmer Bills (${filteredFarmerBills.length})`, icon: Wheat },
  ];

  return (
    <>
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-7 h-7 text-blue-600" />
              Reports & Analysis
            </h1>
            <p className="text-gray-500 text-sm mt-1">Comprehensive business insights — {label}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 print:hidden">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Date Range</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => { setPreset(p.key); setShowCustom(p.key === 'custom'); }}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  preset === p.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {p.key === 'custom' ? (
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{p.label}</span>
                ) : p.label}
              </button>
            ))}
          </div>
          {showCustom && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
          <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Showing data: {formatDate(from)} — {formatDate(to)}
          </div>
        </div>

        <div id="report-content">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-500 text-xs">Total Sales</span>
              </div>
              <div className="text-xl font-bold text-gray-900 flex items-center gap-0.5">
                <IndianRupee className="w-4 h-4" />{fmtINR(totalSales)}
              </div>
              <div className="text-xs text-gray-400 mt-1">{filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''}</div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-gray-500 text-xs">Total Purchases</span>
              </div>
              <div className="text-xl font-bold text-gray-900 flex items-center gap-0.5">
                <IndianRupee className="w-4 h-4" />{fmtINR(totalPurchases)}
              </div>
              <div className="text-xs text-gray-400 mt-1">{filteredPurchases.length} purchase{filteredPurchases.length !== 1 ? 's' : ''}</div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Wheat className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="text-gray-500 text-xs">Commission Earned</span>
              </div>
              <div className="text-xl font-bold text-yellow-700 flex items-center gap-0.5">
                <IndianRupee className="w-4 h-4" />{fmtINR(totalCommission)}
              </div>
              <div className="text-xs text-gray-400 mt-1">{filteredFarmerBills.length} farmer bill{filteredFarmerBills.length !== 1 ? 's' : ''}</div>
            </div>

            <div className={clsx('rounded-xl p-4 shadow-sm border', netProfit >= 0 ? 'bg-white border-gray-100' : 'bg-red-50 border-red-100')}>
              <div className="flex items-center gap-2 mb-2">
                <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', netProfit >= 0 ? 'bg-blue-50' : 'bg-red-100')}>
                  {netProfit >= 0
                    ? <TrendingUp className="w-4 h-4 text-blue-600" />
                    : <TrendingDown className="w-4 h-4 text-red-600" />}
                </div>
                <span className="text-gray-500 text-xs">Net Profit</span>
              </div>
              <div className={clsx('text-xl font-bold flex items-center gap-0.5', netProfit >= 0 ? 'text-blue-700' : 'text-red-600')}>
                {netProfit < 0 && '−'}<IndianRupee className="w-4 h-4" />{fmtINR(Math.abs(netProfit))}
              </div>
              <div className={clsx('text-xs mt-1', netProfit >= 0 ? 'text-blue-500' : 'text-red-400')}>
                {profitMargin.toFixed(1)}% margin
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 print:hidden">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={clsx(
                        'flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                        activeTab === tab.key
                          ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="p-5 space-y-6">
                {/* Profit Breakdown */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-blue-600" />
                    Profit & Loss — {label}
                  </h3>
                  <div className="space-y-3 max-w-md">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                        Sales Revenue (விற்பனை)
                      </span>
                      <span className="font-semibold text-green-700">+ ₹{fmtINR(totalSales)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
                        Purchase Cost (கொள்முதல்)
                      </span>
                      <span className="font-semibold text-orange-700">− ₹{fmtINR(totalPurchases)}</span>
                    </div>
                    {totalCommission > 0 && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600 text-sm flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
                          Commission Earned (கமிஷன்)
                        </span>
                        <span className="font-semibold text-yellow-700">+ ₹{fmtINR(totalCommission)}</span>
                      </div>
                    )}
                    <div className={clsx('flex items-center justify-between py-3 px-4 rounded-xl mt-2',
                      netProfit >= 0 ? 'bg-blue-50' : 'bg-red-50')}>
                      <span className={clsx('font-bold text-sm', netProfit >= 0 ? 'text-blue-800' : 'text-red-800')}>
                        {netProfit >= 0 ? 'Net Profit (லாபம்)' : 'Net Loss (நஷ்டம்)'}
                      </span>
                      <span className={clsx('font-bold text-base', netProfit >= 0 ? 'text-blue-700' : 'text-red-700')}>
                        {netProfit >= 0 ? '+' : '−'} ₹{fmtINR(Math.abs(netProfit))}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 text-right">
                      Profit margin: {profitMargin.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-xs text-green-600 font-medium mb-1 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Cash Collected
                    </div>
                    <div className="text-lg font-bold text-green-700">₹{fmtINR(totalBillsPaid)}</div>
                    <div className="text-xs text-green-600 mt-1">from {filteredBills.length} bills</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4">
                    <div className="text-xs text-red-600 font-medium mb-1 flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5" /> Pending from Customers
                    </div>
                    <div className="text-lg font-bold text-red-700">₹{fmtINR(totalBillsBalance)}</div>
                    <div className="text-xs text-red-500 mt-1">outstanding balance</div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4">
                    <div className="text-xs text-orange-600 font-medium mb-1 flex items-center gap-1">
                      <ShoppingCart className="w-3.5 h-3.5" /> Paid to Shops
                    </div>
                    <div className="text-lg font-bold text-orange-700">₹{fmtINR(totalPurchasesPaid)}</div>
                    <div className="text-xs text-orange-600 mt-1">from {filteredPurchases.length} purchases</div>
                  </div>
                </div>

                {/* Farmer summary */}
                {filteredFarmerBills.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Wheat className="w-4 h-4 text-yellow-600" />
                      Farmer Transactions
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="bg-yellow-50 rounded-xl p-4">
                        <div className="text-xs text-yellow-700 font-medium mb-1">Total Goods Received</div>
                        <div className="text-lg font-bold text-yellow-800">₹{fmtINR(totalFarmerPurchases)}</div>
                      </div>
                      <div className="bg-yellow-50 rounded-xl p-4">
                        <div className="text-xs text-yellow-700 font-medium mb-1">Paid to Farmers</div>
                        <div className="text-lg font-bold text-yellow-800">₹{fmtINR(totalFarmerPaid)}</div>
                      </div>
                      <div className="bg-yellow-50 rounded-xl p-4">
                        <div className="text-xs text-yellow-700 font-medium mb-1">Commission Earned</div>
                        <div className="text-lg font-bold text-yellow-800">₹{fmtINR(totalCommission)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sales Tab */}
            {activeTab === 'sales' && (
              <div>
                {filteredBills.length === 0 ? (
                  <div className="p-10 text-center">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400">No sales in this period</p>
                    <Link href="/bills/new" className="text-green-600 text-sm hover:underline mt-2 block">
                      Create a bill →
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs">
                            <th className="text-left px-4 py-3 font-medium">Date</th>
                            <th className="text-left px-4 py-3 font-medium">Bill #</th>
                            <th className="text-left px-4 py-3 font-medium">Customer</th>
                            <th className="text-right px-4 py-3 font-medium">Amount</th>
                            <th className="text-right px-4 py-3 font-medium">Paid</th>
                            <th className="text-right px-4 py-3 font-medium">Balance</th>
                            <th className="w-8" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {[...filteredBills].sort((a, b) => b.date.localeCompare(a.date)).map((bill) => (
                            <tr key={bill.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(bill.date)}</td>
                              <td className="px-4 py-3 font-mono text-gray-600">#{bill.billNumber}</td>
                              <td className="px-4 py-3 font-medium text-gray-900">{bill.customerName}</td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{fmtINR(bill.subtotal)}</td>
                              <td className="px-4 py-3 text-right text-green-600">₹{fmtINR(bill.amountPaid)}</td>
                              <td className={clsx('px-4 py-3 text-right font-medium', bill.newBalance > 0 ? 'text-red-500' : 'text-gray-400')}>
                                {bill.newBalance > 0 ? `₹${fmtINR(bill.newBalance)}` : '—'}
                              </td>
                              <td className="px-3 py-3">
                                <Link href={`/bills/${bill.id}`} className="text-gray-300 hover:text-blue-500">
                                  <ArrowRight className="w-4 h-4" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                            <td colSpan={3} className="px-4 py-3 text-sm text-gray-700">Total ({filteredBills.length} bills)</td>
                            <td className="px-4 py-3 text-right text-gray-900">₹{fmtINR(totalSales)}</td>
                            <td className="px-4 py-3 text-right text-green-600">₹{fmtINR(totalBillsPaid)}</td>
                            <td className="px-4 py-3 text-right text-red-500">₹{fmtINR(totalBillsBalance)}</td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Purchases Tab */}
            {activeTab === 'purchases' && (
              <div>
                {filteredPurchases.length === 0 ? (
                  <div className="p-10 text-center">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400">No purchases in this period</p>
                    <Link href="/purchases/new" className="text-orange-600 text-sm hover:underline mt-2 block">
                      Record a purchase →
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs">
                          <th className="text-left px-4 py-3 font-medium">Date</th>
                          <th className="text-left px-4 py-3 font-medium">Purchase #</th>
                          <th className="text-left px-4 py-3 font-medium">Shop</th>
                          <th className="text-right px-4 py-3 font-medium">Amount</th>
                          <th className="text-right px-4 py-3 font-medium">Paid</th>
                          <th className="text-right px-4 py-3 font-medium">Balance</th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {[...filteredPurchases].sort((a, b) => b.date.localeCompare(a.date)).map((purchase) => (
                          <tr key={purchase.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(purchase.date)}</td>
                            <td className="px-4 py-3 font-mono text-gray-600">#{purchase.purchaseNumber}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{purchase.shopName}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{fmtINR(purchase.subtotal)}</td>
                            <td className="px-4 py-3 text-right text-green-600">₹{fmtINR(purchase.amountPaid)}</td>
                            <td className={clsx('px-4 py-3 text-right font-medium', purchase.newBalance > 0 ? 'text-red-500' : 'text-gray-400')}>
                              {purchase.newBalance > 0 ? `₹${fmtINR(purchase.newBalance)}` : '—'}
                            </td>
                            <td className="px-3 py-3">
                              <Link href={`/purchases/${purchase.id}`} className="text-gray-300 hover:text-blue-500">
                                <ArrowRight className="w-4 h-4" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                          <td colSpan={3} className="px-4 py-3 text-sm text-gray-700">Total ({filteredPurchases.length} purchases)</td>
                          <td className="px-4 py-3 text-right text-gray-900">₹{fmtINR(totalPurchases)}</td>
                          <td className="px-4 py-3 text-right text-green-600">₹{fmtINR(totalPurchasesPaid)}</td>
                          <td className="px-4 py-3 text-right text-red-500">₹{fmtINR(filteredPurchases.reduce((s, p) => s + Math.max(0, p.newBalance), 0))}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Farmer Bills Tab */}
            {activeTab === 'farmers' && (
              <div>
                {filteredFarmerBills.length === 0 ? (
                  <div className="p-10 text-center">
                    <Wheat className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400">No farmer bills in this period</p>
                    <Link href="/farmer-bills/new" className="text-yellow-600 text-sm hover:underline mt-2 block">
                      Create a farmer bill →
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs">
                          <th className="text-left px-4 py-3 font-medium">Date</th>
                          <th className="text-left px-4 py-3 font-medium">Bill #</th>
                          <th className="text-left px-4 py-3 font-medium">Farmer</th>
                          <th className="text-right px-4 py-3 font-medium">Total Value</th>
                          <th className="text-right px-4 py-3 font-medium">Commission</th>
                          <th className="text-right px-4 py-3 font-medium">Net to Farmer</th>
                          <th className="text-right px-4 py-3 font-medium">Paid</th>
                          <th className="text-right px-4 py-3 font-medium">Balance</th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {[...filteredFarmerBills].sort((a, b) => b.date.localeCompare(a.date)).map((fb) => (
                          <tr key={fb.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(fb.date)}</td>
                            <td className="px-4 py-3 font-mono text-gray-600">#{fb.billNumber}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{fb.farmerName}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{fmtINR(fb.subtotal)}</td>
                            <td className="px-4 py-3 text-right text-yellow-600">₹{fmtINR(fb.commission)}</td>
                            <td className="px-4 py-3 text-right text-green-600">₹{fmtINR(fb.netAmount)}</td>
                            <td className="px-4 py-3 text-right text-blue-600">₹{fmtINR(fb.amountPaid)}</td>
                            <td className={clsx('px-4 py-3 text-right font-medium', fb.newBalance > 0 ? 'text-red-500' : 'text-gray-400')}>
                              {fb.newBalance > 0 ? `₹${fmtINR(fb.newBalance)}` : '—'}
                            </td>
                            <td className="px-3 py-3">
                              <Link href={`/farmer-bills/${fb.id}`} className="text-gray-300 hover:text-blue-500">
                                <ArrowRight className="w-4 h-4" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                          <td colSpan={3} className="px-4 py-3 text-sm text-gray-700">Total ({filteredFarmerBills.length} bills)</td>
                          <td className="px-4 py-3 text-right text-gray-900">₹{fmtINR(totalFarmerPurchases)}</td>
                          <td className="px-4 py-3 text-right text-yellow-600">₹{fmtINR(totalCommission)}</td>
                          <td className="px-4 py-3 text-right text-green-600">₹{fmtINR(filteredFarmerBills.reduce((s, fb) => s + fb.netAmount, 0))}</td>
                          <td className="px-4 py-3 text-right text-blue-600">₹{fmtINR(totalFarmerPaid)}</td>
                          <td className="px-4 py-3 text-right text-red-500">₹{fmtINR(filteredFarmerBills.reduce((s, fb) => s + Math.max(0, fb.newBalance), 0))}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-3 gap-4 print:hidden">
          <Link href="/bills" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all group flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100">
                <FileText className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">All Bills</div>
                <div className="text-xs text-gray-400">View & manage</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-green-500" />
          </Link>
          <Link href="/purchases" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center group-hover:bg-orange-100">
                <ShoppingCart className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">All Purchases</div>
                <div className="text-xs text-gray-400">View & manage</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500" />
          </Link>
          <Link href="/farmer-bills" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-yellow-200 hover:shadow-md transition-all group flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-yellow-50 rounded-lg flex items-center justify-center group-hover:bg-yellow-100">
                <Wheat className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Farmer Bills</div>
                <div className="text-xs text-gray-400">View & manage</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-yellow-500" />
          </Link>
        </div>
      </div>
    </>
  );
}
