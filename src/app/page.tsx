'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBills, usePurchases, useFarmerBills } from '@/lib/storage';
import {
  IndianRupee, TrendingUp, TrendingDown, PlusCircle, BarChart2,
  ShoppingCart, Wheat, ArrowRight, FileText, CheckCircle2, Clock,
  AlertTriangle, Download,
} from 'lucide-react';
import { Bill, FarmerBill, Purchase } from '@/lib/types';
import { fmtINR } from '@/lib/format';

export default function DashboardPage() {
  const { bills, loaded: billsLoaded } = useBills();
  const { purchases, loaded: purchasesLoaded } = usePurchases();
  const { farmerBills, loaded: farmerBillsLoaded } = useFarmerBills();
  const [mounted, setMounted] = useState(false);
  const [showBackupReminder, setShowBackupReminder] = useState(false);

  useEffect(() => {
    setMounted(true);
    const lastBackup = localStorage.getItem('lastDbBackupTime');
    if (!lastBackup) {
      setShowBackupReminder(true);
    } else {
      const diff = Date.now() - parseInt(lastBackup, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (diff > sevenDays) {
        setShowBackupReminder(true);
      }
    }
  }, []);

  const handleDownloadBackup = () => {
    localStorage.setItem('lastDbBackupTime', Date.now().toString());
    setShowBackupReminder(false);
    window.location.href = '/api/db';
  };

  if (!mounted || !billsLoaded || !purchasesLoaded || !farmerBillsLoaded) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-64">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const todaysSales = bills
    .filter((b: Bill) => b.date === today)
    .reduce((sum: number, b: Bill) => sum + b.subtotal, 0);

  const todaysPurchase =
    purchases.filter((p: Purchase) => p.date === today).reduce((s, p) => s + p.subtotal, 0) +
    farmerBills.filter((fb: FarmerBill) => fb.date === today).reduce((s, fb) => s + fb.subtotal, 0);

  const todaysProfit = todaysSales - todaysPurchase;

  const recentBills = [...bills]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  type PurchaseRow =
    | { kind: 'shop'; id: string; name: string; amount: number; createdAt: string }
    | { kind: 'farmer'; id: string; name: string; amount: number; createdAt: string };

  const recentPurchases: PurchaseRow[] = [
    ...purchases.map((p: Purchase) => ({
      kind: 'shop' as const,
      id: p.id,
      name: p.shopName,
      amount: p.subtotal,
      createdAt: p.createdAt,
    })),
    ...farmerBills.map((fb: FarmerBill) => ({
      kind: 'farmer' as const,
      id: fb.id,
      name: fb.farmerName,
      amount: fb.subtotal,
      createdAt: fb.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {d.toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap self-start">
          <Link
            href="/reports"
            className="flex items-center gap-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            Reports
          </Link>
          <Link
            href="/bills/new"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            New Bill
          </Link>
        </div>
      </div>

      {/* Backup Reminder Banner */}
      {showBackupReminder && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 text-sm md:text-base">Database Backup Reminder</h3>
              <p className="text-amber-700 text-xs md:text-sm mt-0.5">
                You haven&apos;t downloaded a database backup recently. Download a copy to safeguard your billing and customer records.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">

            <button
              onClick={handleDownloadBackup}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download Now
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-green-200 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-gray-500 text-sm font-medium">Today&apos;s Sales</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 flex items-center gap-0.5">
            <IndianRupee className="w-6 h-6" />
            {fmtINR(todaysSales)}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-orange-200 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-gray-500 text-sm font-medium">Today&apos;s Purchase</span>
          </div>
          <div className="text-3xl font-bold text-orange-700 flex items-center gap-0.5">
            <IndianRupee className="w-6 h-6" />
            {fmtINR(todaysPurchase)}
          </div>
        </div>

        <div className={`bg-white rounded-xl p-5 shadow-sm border transition-colors ${todaysProfit >= 0 ? 'border-gray-200 hover:border-blue-200' : 'border-gray-200 hover:border-red-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${todaysProfit >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
              <TrendingDown className={`w-5 h-5 ${todaysProfit >= 0 ? 'text-blue-600' : 'text-red-500'}`} />
            </div>
            <span className="text-gray-500 text-sm font-medium">Today&apos;s Profit</span>
          </div>
          <div className={`text-3xl font-bold flex items-center gap-0.5 ${todaysProfit >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
            <IndianRupee className="w-6 h-6" />
            {fmtINR(Math.abs(todaysProfit))}
            {todaysProfit < 0 && <span className="text-base font-medium ml-1">loss</span>}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/bills/new"
          className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-colors shadow-sm"
        >
          <PlusCircle className="w-6 h-6" />
          <div className="text-center">
            <div className="font-semibold text-sm">New Bill</div>
            <div className="text-green-200 text-[11px]">Sales</div>
          </div>
        </Link>
        <Link
          href="/purchases/new"
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-colors shadow-sm"
        >
          <ShoppingCart className="w-6 h-6" />
          <div className="text-center">
            <div className="font-semibold text-sm">Purchase</div>
            <div className="text-orange-200 text-[11px]">Shop</div>
          </div>
        </Link>
        <Link
          href="/farmer-bills/new"
          className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-colors shadow-sm"
        >
          <Wheat className="w-6 h-6" />
          <div className="text-center">
            <div className="font-semibold text-sm">Farmer Bill</div>
            <div className="text-yellow-200 text-[11px]">Purchase</div>
          </div>
        </Link>
      </div>

      {/* Recent lists */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Sales Bills */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" />
              Recent Sales
            </h2>
            <Link href="/bills" className="text-green-600 text-sm hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentBills.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No bills yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentBills.map((bill: Bill) => (
                <Link
                  key={bill.id}
                  href={`/bills/${bill.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <span className="text-green-700 font-bold text-xs">{bill.customerName.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{bill.customerName}</div>
                      <div className="text-gray-400 text-xs">
                        #{bill.billNumber} &middot;{' '}
                        {new Date(bill.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 text-sm flex items-center gap-0.5 justify-end">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {fmtINR(bill.subtotal)}
                    </div>
                    {bill.newBalance > 0 ? (
                      <div className="flex items-center gap-1 text-orange-500 text-xs justify-end">
                        <Clock className="w-3 h-3" /> Pending
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-green-500 text-xs justify-end">
                        <CheckCircle2 className="w-3 h-3" /> Paid
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-orange-500" />
              Recent Purchases
            </h2>
            <div className="flex items-center gap-3">
              <Link href="/purchases" className="text-orange-500 text-sm hover:underline flex items-center gap-1">
                Shop <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/farmer-bills" className="text-yellow-600 text-sm hover:underline flex items-center gap-1">
                Farmer <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          {recentPurchases.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No purchases yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentPurchases.map((row) => (
                <Link
                  key={`${row.kind}-${row.id}`}
                  href={row.kind === 'shop' ? `/purchases/${row.id}` : `/farmer-bills/${row.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${row.kind === 'shop' ? 'bg-orange-50' : 'bg-yellow-50'}`}>
                      {row.kind === 'shop'
                        ? <ShoppingCart className="w-4 h-4 text-orange-500" />
                        : <Wheat className="w-4 h-4 text-yellow-600" />}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{row.name}</div>
                      <div className="text-gray-400 text-xs">
                        {row.kind === 'shop' ? 'Shop' : 'Farmer'} &middot;{' '}
                        {new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold text-gray-900 text-sm flex items-center gap-0.5">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {fmtINR(row.amount)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
