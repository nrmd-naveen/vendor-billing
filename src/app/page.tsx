'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCustomers, useBills } from '@/lib/storage';
import { Users, FileText, IndianRupee, TrendingUp, PlusCircle, ArrowRight, Banknote, ChevronLeft, ChevronRight } from 'lucide-react';
import { Bill, Collection, Customer } from '@/lib/types';
import { fmtINR } from '@/lib/format';

export default function DashboardPage() {
  const { customers, loaded: customersLoaded } = useCustomers();
  const { bills, loaded: billsLoaded } = useBills();
  const [mounted, setMounted] = useState(false);
  const [todaysCollections, setTodaysCollections] = useState(0);
  const [billsPage, setBillsPage] = useState(0);
  const [debtorsPage, setDebtorsPage] = useState(0);
  const PAGE_SIZE = 5;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetch('/api/collections')
      .then(r => r.json())
      .then((cols: Collection[]) => {
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const sum = cols.filter(c => c.date === today).reduce((s, c) => s + c.amount, 0);
        setTodaysCollections(sum);
      })
      .catch(() => {});
  }, []);

  if (!mounted || !customersLoaded || !billsLoaded) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-64">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const thisMonth = today.slice(0, 7);
  const todaysBills = bills.filter((b: Bill) => b.date === today);
  const todaysTotal = todaysBills.reduce((sum: number, b: Bill) => sum + b.subtotal, 0);
  const totalPending = customers.reduce((sum: number, c: Customer) => sum + Math.max(0, c.pendingBalance), 0);
  const totalBillsThisMonth = bills.filter((b: Bill) => b.date.startsWith(thisMonth)).length;

  const allRecentBills = [...bills]
    .sort((a: Bill, b: Bill) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const billsTotalPages = Math.ceil(allRecentBills.length / PAGE_SIZE);
  const recentBills = allRecentBills.slice(billsPage * PAGE_SIZE, (billsPage + 1) * PAGE_SIZE);

  const allDebtors = [...customers]
    .filter((c: Customer) => c.pendingBalance > 0)
    .sort((a: Customer, b: Customer) => b.pendingBalance - a.pendingBalance);
  const debtorsTotalPages = Math.ceil(allDebtors.length / PAGE_SIZE);
  const topDebtors = allDebtors.slice(debtorsPage * PAGE_SIZE, (debtorsPage + 1) * PAGE_SIZE);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
        <Link
          href="/bills/new"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          New Bill
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-gray-500 text-sm">Customers</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
          <Link href="/customers" className="text-blue-600 text-xs mt-1 flex items-center gap-0.5 hover:underline">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-gray-500 text-sm">Today&apos;s Bills</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{todaysBills.length}</div>
          <Link href="/bills" className="text-green-600 text-xs mt-1 flex items-center gap-0.5 hover:underline">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-gray-500 text-sm">Today&apos;s Sales</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 flex items-center gap-0.5">
            <IndianRupee className="w-5 h-5" />
            {fmtINR(todaysTotal)}
          </div>
          <div className="text-gray-400 text-xs mt-1">{totalBillsThisMonth} bills this month</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-gray-500 text-sm">To Collect</span>
          </div>
          <div className="text-2xl font-bold text-red-600 flex items-center gap-0.5">
            <IndianRupee className="w-5 h-5" />
            {fmtINR(totalPending)}
          </div>
          <div className="text-gray-400 text-xs mt-1">Pending balances</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Banknote className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-gray-500 text-sm">Collected Today</span>
          </div>
          <div className="text-2xl font-bold text-green-700 flex items-center gap-0.5">
            <IndianRupee className="w-5 h-5" />
            {fmtINR(todaysCollections)}
          </div>
          <div className="text-gray-400 text-xs mt-1">Cash received</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent bills */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h2 className="font-semibold text-gray-900">Recent Bills</h2>
            <Link href="/bills" className="text-green-600 text-sm hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {allRecentBills.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No bills yet</p>
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
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{bill.customerName}</div>
                      <div className="text-gray-400 text-xs">
                        #{bill.billNumber} &middot;{' '}
                        {new Date(bill.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 text-sm flex items-center gap-0.5">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {fmtINR(bill.subtotal)}
                      </div>
                      {bill.newBalance > 0 && (
                        <div className="text-red-500 text-xs">Bal: ₹{fmtINR(bill.newBalance)}</div>
                      )}
                    </div>
                  </Link>
                ))}
                {Array.from({ length: PAGE_SIZE - recentBills.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-[58px] border-b border-gray-50 last:border-0" />
                ))}
              </div>
              <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between shrink-0">
                <span className="text-xs text-gray-400">
                  Page {billsPage + 1} of {billsTotalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBillsPage(p => Math.max(0, p - 1))}
                    disabled={billsPage === 0}
                    className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setBillsPage(p => Math.min(billsTotalPages - 1, p + 1))}
                    disabled={billsPage === billsTotalPages - 1}
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
            <h2 className="font-semibold text-gray-900">Pending Collections</h2>
            <Link href="/customers" className="text-green-600 text-sm hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {allDebtors.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400">
              <IndianRupee className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>All balances cleared!</p>
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
                    <div className="font-bold text-red-600 flex items-center gap-0.5">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {fmtINR(customer.pendingBalance)}
                    </div>
                  </Link>
                ))}
                {Array.from({ length: PAGE_SIZE - topDebtors.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-[58px] border-b border-gray-50 last:border-0" />
                ))}
              </div>
              <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between shrink-0">
                <span className="text-xs text-gray-400">
                  Page {debtorsPage + 1} of {debtorsTotalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDebtorsPage(p => Math.max(0, p - 1))}
                    disabled={debtorsPage === 0}
                    className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setDebtorsPage(p => Math.min(debtorsTotalPages - 1, p + 1))}
                    disabled={debtorsPage === debtorsTotalPages - 1}
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
