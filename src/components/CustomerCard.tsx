'use client';

import Link from 'next/link';
import { Customer } from '@/lib/types';
import { Phone, IndianRupee, ChevronRight, Banknote, Check } from 'lucide-react';
import clsx from 'clsx';

interface CustomerCardProps {
  customer: Customer;
  billCount?: number;
  onCollect?: (customer: Customer) => void;
  collected?: boolean;
}

export default function CustomerCard({ customer, billCount, onCollect, collected }: CustomerCardProps) {
  return (
    <Link
      href={`/customers/${customer.id}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all"
    >
      <div className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <span className="text-green-700 font-bold text-lg">
            {customer.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {customer.code && (
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded shrink-0">{customer.code}</span>
            )}
            <span className="font-semibold text-gray-900 text-base truncate">{customer.name}</span>
            {customer.nickname && (
              <span className="text-gray-500 text-sm shrink-0">({customer.nickname})</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {customer.phone && (
              <span className="flex items-center gap-1 text-gray-500 text-sm">
                <Phone className="w-3.5 h-3.5" />
                {customer.phone}
              </span>
            )}
            {billCount !== undefined && (
              <span className="text-gray-400 text-sm">{billCount} bill{billCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-end gap-1">
            <div
              className={clsx(
                'flex items-center gap-1 font-bold text-base',
                customer.pendingBalance > 0 ? 'text-red-600' : 'text-green-600'
              )}
            >
              <IndianRupee className="w-4 h-4" />
              {Math.abs(customer.pendingBalance).toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">
              {customer.pendingBalance > 0 ? 'Balance owed' : customer.pendingBalance < 0 ? 'Credit' : 'Settled'}
            </div>
          </div>
          {onCollect && customer.pendingBalance > 0 && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCollect(customer); }}
              className={clsx(
                'p-3 rounded-lg transition-colors',
                collected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-green-50 hover:bg-green-100 text-green-700'
              )}
              title="Record collection"
            >
              {collected ? <Check className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
            </button>
          )}
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </Link>
  );
}
