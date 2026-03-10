'use client';

import Link from 'next/link';
import { Customer } from '@/lib/types';
import { Phone, IndianRupee, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface CustomerCardProps {
  customer: Customer;
  billCount?: number;
}

export default function CustomerCard({ customer, billCount }: CustomerCardProps) {
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
          <div className="font-semibold text-gray-900 text-base truncate">{customer.name}</div>
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
        <div className="flex flex-col items-end gap-1 shrink-0">
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
        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
      </div>
    </Link>
  );
}
