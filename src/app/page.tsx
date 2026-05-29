'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCustomers, useBills, usePurchases, useFarmerBills } from '@/lib/storage';
import {
  Users, FileText, IndianRupee, TrendingUp, PlusCircle, ArrowRight,
  Banknote, ChevronLeft, ChevronRight, ShoppingCart, Wheat, BarChart2,
  AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { Bill, Collection, Customer, FarmerBill, Purchase } from '@/lib/types';
import { fmtINR } from '@/lib/format';
import clsx from 'clsx';

export default function DashboardPage() {
  const { customers, loaded: customersLoaded } = useCustomers();
  const { bills, loaded: billsLoaded } = useBills();
  const { purchases, loaded: purchasesLoaded } = usePurchases();
  const { farmerBills, loaded: farmerBillsLoaded } = useFarmerBills();
  const [mounted, setMounted] = useState(false);
  const [todaysCollections, setTodaysCollections] = useState(0);
  const [billsPage, setBillsPage] = useState(0);
  const [debtorsPage, setDebtorsPage] = useState(0);
  const PAGE_SIZE = 5;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetch('/api/collections')
      .then((r) => r.json())
      .then((cols: Collection[]) => {
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const sum = cols.filter((c) => c.date === today).reduce((s, c) => s + c.amount, 0);
        setTodaysCollections(sum);
      })
      .catch(() => {});
  }, []);

  if (!mounted || !customersLoaded || !billsLoaded || !purchasesLoaded || !farmerBillsLoaded) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-64">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const thisMonth = today.slice(0, 7);
  const todaysBills = bills.filter((b: Bill) => b.date === today);
  const todaysTotal = todaysBills.reduce((sum: number, b: Bill) => sum + b.subtotal, 0);
  const totalPending = customers.reduce((sum: number, c: Customer) => sum + Math.max(0, c.pendingBalance), 0);
  const totalBillsThisMonth = bills.filter((b: Bill) => b.date.startsWith(thisMonth)).length;
  const todaysPurchases = purchases.filter((p: Purchase) => p.date === today);
  const todaysPurchaseTotal = todaysPurchases.reduce((s, p) => s + p.subtotal, 0);
  const todaysFarmerBills = farmerBills.filter((fb: FarmerBill) => fb.date === today);
  const todaysFarmerTotal = todaysFarmerBills.reduce((s, fb) => s + fb.subtotal, 0);

  const allRecentBills = [...bills].sort(
    (a: Bill, b: Bill) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const billsTotalPages = Math.ceil(allRecentBills.length / PAGE_SIZE);
  const recentBills = allRecentBills.slice(billsPage * PAGE_SIZE, (billsPage + 1) * PAGE_SIZE);

  const allDebtors = [...customers]
    .filter((c: Customer) => c.pendingBalance > 0)
    .sort((a: Customer, b: Customer) => b.pendingBalance - a.pendingBalance);
  const debtorsTotalPages = Math.ceil(allDebtors.length / PAGE_SIZE);
  const topDebtors = allDebtors.slice(debtorsPage * PAGE_SIZE, (debtorsPage + 1) * PAGE_SIZE);

  const fullyPaidToday = todaysBills.filter((b) => b.newBalance === 0).length;
  const pendingToday = todaysBills.filter((b) => b.newBalance > 0).length;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', {
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Today's Sales */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-green-200 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-gray-500 text-xs">Today&apos;s Sales</div>
              <div className="text-[10px] text-gray-400">{totalBillsThisMonth} this month</div>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 flex items-center gap-0.5">
            <IndianRupee className="w-5 h-5" />
            {fmtINR(todaysTotal)}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[10px] text-green-600">
              <CheckCircle2 className="w-3 h-3" />{fullyPaidToday} paid
            </span>
            {pendingToday > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-orange-500">
                <Clock className="w-3 h-3" />{pendingToday} pending
              </span>
            )}
          </div>
        </div>

        {/* Today's Bills */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-gray-500 text-xs">Customers</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
          <Link href="/customers" className="text-blue-600 text-xs mt-1 flex items-center gap-0.5 hover:underline">
            {todaysBills.length} bill{todaysBills.length !== 1 ? 's' : ''} today <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* To Collect */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-red-200 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-gray-500 text-xs">Pending Collections</span>
          </div>
          <div className="text-2xl font-bold text-red-600 flex items-center gap-0.5">
            <IndianRupee className="w-5 h-5" />
            {fmtINR(totalPending)}
          </div>
          <div className="text-gray-400 text-xs mt-1">{allDebtors.length} customer{allDebtors.length !== 1 ? 's' : ''} with balance</div>
        </div>

        {/* Collected Today */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-green-200 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Banknote className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-gray-500 text-xs">Collected Today</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 flex items-center gap-0.5">
            <IndianRupee className="w-5 h-5" />
            {fmtINR(todaysCollections)}
          </div>
          <Link href="/collections" className="text-emerald-600 text-xs mt-1 flex items-center gap-0.5 hover:underline">
            View collections <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Purchased Today */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-orange-200 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-gray-500 text-xs">Purchased Today</span>
          </div>
          <div className="text-2xl font-bold text-orange-700 flex items-center gap-0.5">
            <IndianRupee className="w-5 h-5" />
            {fmtINR(todaysPurchaseTotal)}
          </div>
          <Link href="/purchases" className="text-orange-600 text-xs mt-1 flex items-center gap-0.5 hover:underline">
            {todaysPurchases.length} purchase{todaysPurchases.length !== 1 ? 's' : ''} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Farmer Bills Today */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-yellow-200 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Wheat className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-gray-500 text-xs">Farmer Goods Today</span>
          </div>
          <div className="text-2xl font-bold text-yellow-700 flex items-center gap-0.5">
            <IndianRupee className="w-5 h-5" />
            {fmtINR(todaysFarmerTotal)}
          </div>
          <Link href="/farmer-bills" className="text-yellow-600 text-xs mt-1 flex items-center gap-0.5 hover:underline">
            {todaysFarmerBills.length} farmer bill{todaysFarmerBills.length !== 1 ? 's' : ''} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/bills/new" className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-3.5 flex items-center gap-2.5 transition-colors shadow-sm">
          <PlusCircle className="w-5 h-5 shrink-0" />
          <div>
            <div className="font-semibold text-sm leading-tight">New Bill</div>
            <div className="text-green-200 text-[10px]">விற்பனை</div>
          </div>
        </Link>
        <Link href="/purchases/new" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl p-3.5 flex items-center gap-2.5 transition-colors shadow-sm">
          <ShoppingCart className="w-5 h-5 shrink-0" />
          <div>
            <div className="font-semibold text-sm leading-tight">Purchase</div>
            <div className="text-orange-200 text-[10px]">கொள்முதல்</div>
          </div>
        </Link>
        <Link href="/farmer-bills/new" className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl p-3.5 flex items-center gap-2.5 transition-colors shadow-sm">
          <Wheat className="w-5 h-5 shrink-0" />
          <div>
            <div className="font-semibold text-sm leading-tight">Farmer Bill</div>
            <div className="text-yellow-200 text-[10px]">சம்சாரி</div>
          </div>
        </Link>
      </div>

      {/* Reports Banner */}
      <Link href="/reports" className="block bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl p-4 flex items-center justify-between transition-all shadow-sm group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold">Reports & Analysis</div>
            <div className="text-blue-200 text-xs">Sales, purchases, profit — filter by any date range</div>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-blue-300 group-hover:translate-x-1 transition-transform" />
      </Link>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent bills */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" />
              Recent Bills
            </h2>
            <Link href="/bills" className="text-green-600 text-sm hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {allRecentBills.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No bills yet</p>
              <Link href="/bills/new" className="text-green-600 text-sm hover:underline mt-1 block">
                Create first bill
              </Link>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-50 flex-1">
                {recentBills.map((bill: Bill) => (
                  <Link
                    key={bill.id}
                    href={`/bills/${bill.id}`}
                    className="flex items-center justify-between px-5 h-[58px] hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center shrink-0">
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
                      <div className="font-semibold text-gray-900 text-sm flex items-center gap-0.5">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {fmtINR(bill.subtotal)}
                      </div>
                      {bill.newBalance > 0 ? (
                        <div className="text-red-500 text-xs">Bal: ₹{fmtINR(bill.newBalance)}</div>
                      ) : (
                        <div className="text-green-500 text-xs flex items-center justify-end gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
                {Array.from({ length: PAGE_SIZE - recentBills.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-[58px]" />
                ))}
              </div>
              <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between shrink-0">
                <span className="text-xs text-gray-400">
                  {billsPage + 1} / {billsTotalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBillsPage((p) => Math.max(0, p - 1))}
                    disabled={billsPage === 0}
                    className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setBillsPage((p) => Math.min(billsTotalPages - 1, p + 1))}
                    disabled={billsPage >= billsTotalPages - 1}
                    className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pending collections */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Pending Collections
            </h2>
            <Link href="/customers" className="text-green-600 text-sm hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {allDebtors.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-green-500" />
              <p className="text-sm font-medium text-green-700">All balances cleared!</p>
              <p className="text-xs text-gray-400 mt-1">No pending collections</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-50 flex-1">
                {topDebtors.map((customer: Customer) => (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    className="flex items-center justify-between px-5 h-[58px] hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <span className="text-red-600 font-semibold text-sm">
                          {customer.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{customer.name}</div>
                        {customer.phone && (
                          <div className="text-gray-400 text-xs">{customer.phone}</div>
                        )}
                      </div>
                    </div>
                    <div className="font-bold text-red-600 flex items-center gap-0.5 text-sm">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {fmtINR(customer.pendingBalance)}
                    </div>
                  </Link>
                ))}
                {Array.from({ length: PAGE_SIZE - topDebtors.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-[58px]" />
                ))}
              </div>
              <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between shrink-0">
                <span className="text-xs text-gray-400">
                  {debtorsPage + 1} / {debtorsTotalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDebtorsPage((p) => Math.max(0, p - 1))}
                    disabled={debtorsPage === 0}
                    className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setDebtorsPage((p) => Math.min(debtorsTotalPages - 1, p + 1))}
                    disabled={debtorsPage >= debtorsTotalPages - 1}
                    className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
