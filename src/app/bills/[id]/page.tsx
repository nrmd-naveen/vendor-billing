'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBills } from '@/lib/storage';
import BillPreview from '@/components/BillPreview';
import { ArrowLeft, Trash2, Pencil } from 'lucide-react';

export default function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { bills, deleteBill, loaded } = useBills();
  const [mounted, setMounted] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => setMounted(true), []);

  const bill = bills.find((b) => b.id === id);

  if (!mounted || !loaded) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-64">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="p-6 lg:p-8 text-center">
        <p className="text-gray-500 mb-4">Bill not found.</p>
        <Link href="/bills" className="text-green-600 hover:underline">Back to Bills</Link>
      </div>
    );
  }

  const handleDelete = () => {
    deleteBill(id);
    router.push('/bills');
  };

  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-2xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between print:hidden">
        <Link href="/bills" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Bills
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/bills/${id}/edit`}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Bill
          </Link>
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-sm border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Bill
          </button>
        </div>
      </div>

      {/* Bill preview */}
      <BillPreview bill={bill} showPrintButton={true} />

      {/* Customer link */}
      <div className="print:hidden">
        <Link
          href={`/customers/${bill.customerId}`}
          className="text-green-600 hover:underline text-sm flex items-center gap-1"
        >
          View {bill.customerName}&apos;s profile &rarr;
        </Link>
      </div>

      {/* Delete confirm */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-2">Delete Bill #{bill.billNumber}?</h3>
            <p className="text-gray-500 text-sm mb-5">
              This will permanently delete this bill. The customer&apos;s balance will <strong>not</strong> be automatically reversed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
