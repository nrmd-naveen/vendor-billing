'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePurchases, useShops } from '@/lib/storage';
import { ArrowLeft, Store, IndianRupee, Trash2, Package } from 'lucide-react';
import Link from 'next/link';
import { fmtINR } from '@/lib/format';
import clsx from 'clsx';

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

  const totalWeight = purchase.items.reduce((s, i) => s + i.totalWeight, 0);

  const handleDelete = () => {
    if (shop) {
      const currentBalance = shop.pendingBalance;
      const delta = purchase.subtotal - purchase.amountPaid;
      updateShop(purchase.shopId, { pendingBalance: currentBalance - delta });
    }
    deletePurchase(id);
    router.push('/purchases');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/purchases" className="text-gray-400 hover:text-gray-600 p-1"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Purchase #{purchase.purchaseNumber}</h1>
          <p className="text-gray-500 text-sm">
            {new Date(purchase.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => setDeleteConfirm(true)} className="text-gray-400 hover:text-red-500 p-2 rounded-lg transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Shop info */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
          <Store className="w-5 h-5 text-orange-700" />
        </div>
        <div>
          <Link href={`/shops/${purchase.shopId}`} className="font-bold text-orange-900 hover:underline">{purchase.shopName}</Link>
          <div className="text-xs text-orange-600 mt-0.5">{totalWeight.toFixed(2)} kg total · {purchase.items.length} item{purchase.items.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Items table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-800 text-sm">Items Purchased</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-xs">
              <th className="text-left px-4 py-2 font-medium">Vegetable</th>
              <th className="text-right px-4 py-2 font-medium">Rate/kg</th>
              <th className="text-right px-4 py-2 font-medium">Weight</th>
              <th className="text-right px-4 py-2 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {purchase.items.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{item.emoji} {item.vegetableName}</div>
                  {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
                  {item.sacks.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.sacks.map((s, si) => (
                        <span key={s.id} className="inline-flex items-center gap-0.5 text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">
                          <Package className="w-2.5 h-2.5" /> மூடை {si + 1}: {s.weight}kg
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">₹{fmtINR(item.pricePerKg, 2)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{item.totalWeight} kg</td>
                <td className="px-4 py-3 text-right font-semibold text-orange-700">₹{fmtINR(item.amount, 2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td colSpan={2} className="px-4 py-3 font-bold text-gray-700">Total</td>
              <td className="px-4 py-3 text-right font-bold text-gray-700">{totalWeight.toFixed(2)} kg</td>
              <td className="px-4 py-3 text-right font-bold text-orange-700">₹{fmtINR(purchase.subtotal, 2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Payment Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-700">
            <span>Today&apos;s Purchase</span>
            <span className="font-semibold">₹{fmtINR(purchase.subtotal, 2)}</span>
          </div>
          {purchase.previousBalance !== 0 && (
            <div className={clsx('flex justify-between', purchase.previousBalance > 0 ? 'text-red-600' : 'text-green-600')}>
              <span>முன் பாக்கி</span>
              <span className="font-semibold">{purchase.previousBalance > 0 ? '+' : '-'}₹{fmtINR(Math.abs(purchase.previousBalance), 2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
            <span>நிகர பாக்கி (Total Owed)</span>
            <span>₹{fmtINR(purchase.totalDue, 2)}</span>
          </div>
          {purchase.amountPaid > 0 && (
            <div className="flex justify-between text-green-700">
              <span>கட்டிய தொகை (Paid)</span>
              <span className="font-semibold">−₹{fmtINR(purchase.amountPaid, 2)}</span>
            </div>
          )}
        </div>
        <div className={clsx('rounded-xl p-4 flex items-center justify-between mt-2',
          purchase.newBalance > 0 ? 'bg-red-50 border border-red-100' : purchase.newBalance < 0 ? 'bg-blue-50 border border-blue-100' : 'bg-green-50 border border-green-100')}>
          <div>
            <div className="text-sm font-medium text-gray-700">
              {purchase.newBalance > 0 ? 'Still Owed to Shop' : purchase.newBalance < 0 ? 'Shop owes me' : 'Fully Settled'}
            </div>
          </div>
          <div className={clsx('text-2xl font-bold flex items-center gap-0.5',
            purchase.newBalance > 0 ? 'text-red-600' : purchase.newBalance < 0 ? 'text-blue-600' : 'text-green-600')}>
            <IndianRupee className="w-5 h-5" />{fmtINR(Math.abs(purchase.newBalance), 2)}
          </div>
        </div>
      </div>

      {/* Delete confirm */}
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
    </div>
  );
}
