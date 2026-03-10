'use client';

import { Bill } from '@/lib/types';
import { IndianRupee, Printer } from 'lucide-react';

interface BillPreviewProps {
  bill: Bill;
  showPrintButton?: boolean;
}

export default function BillPreview({ bill, showPrintButton = true }: BillPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Print button - hidden during print */}
      {showPrintButton && (
        <div className="flex justify-end p-4 border-b border-gray-100 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Bill
          </button>
        </div>
      )}

      {/* Bill content */}
      <div className="p-6 print:p-4" id="bill-print-area">
        {/* Header */}
        <div className="text-center mb-6 pb-4 border-b-2 border-gray-300">
          <h1 className="text-2xl font-bold text-green-800">🌿 Kaikari Kadai</h1>
          <p className="text-gray-500 text-sm mt-1">Fresh Vegetables • Daily Delivery</p>
        </div>

        {/* Bill info */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-sm text-gray-500">Customer</div>
            <div className="font-bold text-lg text-gray-900">{bill.customerName}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Bill No.</div>
            <div className="font-bold text-lg text-gray-900">#{bill.billNumber}</div>
            <div className="text-sm text-gray-500 mt-1">{new Date(bill.date).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}</div>
          </div>
        </div>

        {/* Items table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-50 border-b border-green-200">
                <th className="text-left py-2 px-3 font-semibold text-green-800">Item</th>
                <th className="text-right py-2 px-3 font-semibold text-green-800">Rate/kg</th>
                <th className="text-right py-2 px-3 font-semibold text-green-800">Weight (kg)</th>
                <th className="text-right py-2 px-3 font-semibold text-green-800">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bill.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3">
                    <span className="mr-1">{item.emoji}</span>
                    <span className="font-medium">{item.vegetableName}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="flex items-center justify-end gap-0.5">
                      <IndianRupee className="w-3 h-3" />
                      {item.pricePerKg.toFixed(0)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium">{item.weight.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-semibold">
                    <span className="flex items-center justify-end gap-0.5">
                      <IndianRupee className="w-3 h-3" />
                      {item.amount.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="border-t-2 border-gray-300 pt-4">
          <div className="sm:ml-auto sm:max-w-xs space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Today&apos;s Total</span>
              <span className="flex items-center gap-0.5 font-medium">
                <IndianRupee className="w-3.5 h-3.5" />
                {bill.subtotal.toFixed(2)}
              </span>
            </div>
            {bill.previousBalance > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Previous Balance</span>
                <span className="flex items-center gap-0.5 font-medium">
                  + <IndianRupee className="w-3.5 h-3.5" />
                  {bill.previousBalance.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
              <span>Total Due</span>
              <span className="flex items-center gap-0.5">
                <IndianRupee className="w-3.5 h-3.5" />
                {bill.totalDue.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-green-700">
              <span>Amount Paid</span>
              <span className="flex items-center gap-0.5 font-medium">
                - <IndianRupee className="w-3.5 h-3.5" />
                {bill.amountPaid.toFixed(2)}
              </span>
            </div>
            <div
              className={`flex justify-between font-bold text-lg border-t pt-2 ${
                bill.newBalance > 0 ? 'text-red-600' : 'text-green-700'
              }`}
            >
              <span>{bill.newBalance > 0 ? 'Balance Owed' : 'Credit'}</span>
              <span className="flex items-center gap-0.5">
                <IndianRupee className="w-4 h-4" />
                {Math.abs(bill.newBalance).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center text-gray-400 text-xs print:block">
          Thank you for your business!
        </div>
      </div>
    </div>
  );
}
