'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFarmerBills, useFarmers } from '@/lib/storage';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import FarmerBillPreview from '@/components/FarmerBillPreview';

export default function FarmerBillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { farmerBills, deleteFarmerBill, loaded } = useFarmerBills();
  const { farmers, updateFarmer, loaded: farmersLoaded } = useFarmers();
  const [mounted, setMounted] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => setMounted(true), []);

  const bill = farmerBills.find((b) => b.id === id);
  const farmer = farmers.find((f) => f.id === bill?.farmerId);

  if (!mounted || !loaded || !farmersLoaded) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Bill not found</p>
        <Link href="/farmer-bills" className="text-yellow-600 hover:underline text-sm mt-2 block">
          Back to farmer bills
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (farmer) {
      const delta = bill.netAmount - bill.amountPaid;
      updateFarmer(bill.farmerId, { pendingBalance: farmer.pendingBalance - delta });
    }
    deleteFarmerBill(id);
    router.push('/farmer-bills');
  };

  return (
    <>
      <style>{`
        @media print {
          .print-hide { display: none !important; }
          body > * { display: none !important; }
          #farmer-bill-print-area { display: block !important; }
        }
      `}</style>

      <div className="p-4 lg:p-8 space-y-4 max-w-2xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between print-hide">
          <Link href="/farmer-bills" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Farmer Bills
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/farmers/${bill.farmerId}`}
              className="text-yellow-600 hover:text-yellow-800 text-sm border border-yellow-200 hover:border-yellow-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              {bill.farmerName}&apos;s Profile
            </Link>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-sm border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>

        {/* Farmer Bill Preview with PDF download */}
        <FarmerBillPreview bill={bill} farmerPhone={farmer?.phone} showPrintButton={true} />
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Delete bill?</h2>
            <p className="text-sm text-gray-500">
              This reverses the balance impact on {bill.farmerName}.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-medium text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
