'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePurchases, useShops } from '@/lib/storage';
import { ArrowLeft, Trash2, Pencil } from 'lucide-react';
import Link from 'next/link';
import PurchaseBillPreview from '@/components/PurchaseBillPreview';

export default function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { purchases, deletePurchase, loaded } = usePurchases();
  const { shops, updateShop, loaded: shopsLoaded } = useShops();
  const [mounted, setMounted] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => setMounted(true), []);

  const purchase = purchases.find((p) => p.id === id);
  const shop = shops.find((s) => s.id === purchase?.shopId);

  if (!mounted || !loaded || !shopsLoaded) {
    return <div className="p-6 flex items-center justify-center min-h-64"><div className="text-gray-400 animate-pulse">Loading...</div></div>;
  }

  if (!purchase) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Purchase not found</p>
        <Link href="/purchases" className="text-orange-600 hover:underline text-sm mt-2 block">Back to purchases</Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (shop) {
      const delta = purchase.subtotal - purchase.amountPaid;
      updateShop(purchase.shopId, { pendingBalance: shop.pendingBalance - delta });
    }
    deletePurchase(id);
    router.push('/purchases');
  };

  return (
    <>
      <style>{`
        @media print {
          .print-hide { display: none !important; }
          body > * { display: none !important; }
          #purchase-bill-print-area { display: block !important; }
        }
      `}</style>

      <div className="p-4 lg:p-8 space-y-4 max-w-2xl">
        <div className="flex items-center justify-between print-hide">
          <Link href="/purchases" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Purchases
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/shops/${purchase.shopId}`}
              className="text-orange-600 hover:text-orange-800 text-sm border border-orange-200 hover:border-orange-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              {purchase.shopName}&apos;s Profile
            </Link>
            <Link
              href={`/purchases/${id}/edit`}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
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

        <PurchaseBillPreview purchase={purchase} shopPhone={shop?.phone} showPrintButton={true} />
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Delete purchase?</h2>
            <p className="text-sm text-gray-500">This will also reverse the balance impact on {purchase.shopName}.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-medium transition-colors text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
