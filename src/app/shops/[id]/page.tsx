'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useShops, usePurchases, useShopPayments } from '@/lib/storage';
import { ArrowLeft, IndianRupee, Banknote, Edit2, Check, X, FileText, Plus, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { fmtINR, cleanNote } from '@/lib/format';
import clsx from 'clsx';

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { shops, updateShop, deleteShop, loaded } = useShops();
  const { purchases, loaded: purchasesLoaded } = usePurchases();
  const { payments, addPayment, loaded: paymentsLoaded } = useShopPayments(id);
  const [mounted, setMounted] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', nickname: '', phone: '', code: '' });

  const [payAmount, setPayAmount] = useState('');
  const [payDiscount, setPayDiscount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payDone, setPayDone] = useState(false);
  const [payError, setPayError] = useState('');

  const payAmountRef = useRef<HTMLInputElement>(null);
  const payDiscountRef = useRef<HTMLInputElement>(null);
  const payNoteRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const shop = shops.find((s) => s.id === id);
  const shopPurchases = purchases.filter((p) => p.shopId === id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  useEffect(() => {
    if (shop && !editing) {
      setEditForm({ name: shop.name, nickname: shop.nickname || '', phone: shop.phone || '', code: shop.code ? String(shop.code) : '' });
    }
  }, [shop, editing]);

  if (!mounted || !loaded || !purchasesLoaded || !paymentsLoaded) {
    return <div className="p-6 flex items-center justify-center min-h-64"><div className="text-gray-400 animate-pulse">Loading...</div></div>;
  }

  if (!shop) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Shop not found</p>
        <Link href="/shops" className="text-orange-600 hover:underline text-sm mt-2 block">Back to shops</Link>
      </div>
    );
  }

  const totalPurchased = shopPurchases.reduce((s, p) => s + p.subtotal, 0);

  const handleSaveEdit = () => {
    if (!editForm.name.trim()) return;
    updateShop(id, {
      name: editForm.name.trim(),
      nickname: editForm.nickname.trim() || undefined,
      phone: editForm.phone.trim() || undefined,
      code: editForm.code ? parseInt(editForm.code) : undefined,
    });
    setEditing(false);
  };

  const handlePay = async () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;
    const discount = parseFloat(payDiscount) || 0;
    const total = amount + discount;
    if (total > shop.pendingBalance) {
      setPayError(`Payment + Discount (₹${fmtINR(total, 2)}) cannot exceed the pending balance (₹${fmtINR(shop.pendingBalance, 2)}).`);
      return;
    }
    setPayError('');
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    await addPayment({ shopId: id, shopName: shop.name, amount, discount: discount || undefined, date: today, note: payNote });
    updateShop(id, { pendingBalance: shop.pendingBalance - amount - discount });
    setPayAmount('');
    setPayDiscount('');
    setPayNote('');
    setPayDone(true);
    setTimeout(() => setPayDone(false), 3000);
  };

  const handleDelete = () => {
    deleteShop(id);
    router.push('/shops');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/shops" className="text-gray-400 hover:text-gray-600 p-1"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          {editing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500" autoFocus
                  placeholder="e.g. முருகன் காய்கறி கடை" />
                <input value={editForm.nickname} onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-32"
                  placeholder="e.g. Murugan" />
                <button onClick={handleSaveEdit} className="text-green-600 p-1 hover:bg-green-50 rounded-lg"><Check className="w-5 h-5" /></button>
                <button onClick={() => setEditing(false)} className="text-gray-400 p-1 hover:bg-gray-50 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
              {shop.nickname && <span className="text-gray-500 text-sm italic">{shop.nickname}</span>}
              <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-orange-500 p-1"><Edit2 className="w-4 h-4" /></button>
            </div>
          )}
          {shop.phone && <div className="text-gray-500 text-sm">{shop.phone}</div>}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/shops/${id}/ledger`}
            className="flex items-center gap-1.5 bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            <BookOpen className="w-4 h-4" /> Ledger
          </Link>
          <Link href={`/purchases/new?shopId=${id}`}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Purchase
          </Link>
        </div>
      </div>

      {payDone && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <Banknote className="w-4 h-4" /> Payment recorded successfully
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="text-gray-500 text-xs mb-1">Total Purchased</div>
          <div className="font-bold text-gray-900">₹{fmtINR(totalPurchased)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="text-gray-500 text-xs mb-1">Purchases</div>
          <div className="font-bold text-gray-900">{shopPurchases.length}</div>
        </div>
        <div className={clsx('rounded-xl p-4 shadow-sm border', shop.pendingBalance > 0 ? 'bg-red-50 border-red-100' : shop.pendingBalance < 0 ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200')}>
          <div className={clsx('text-xs mb-1', shop.pendingBalance > 0 ? 'text-red-600' : shop.pendingBalance < 0 ? 'text-green-600' : 'text-gray-400')}>
            {shop.pendingBalance > 0 ? 'I Owe' : shop.pendingBalance < 0 ? 'Cr' : 'Settled'}
          </div>
          <div className={clsx('font-bold', shop.pendingBalance > 0 ? 'text-red-700' : shop.pendingBalance < 0 ? 'text-green-700' : 'text-gray-500')}>₹{fmtINR(Math.abs(shop.pendingBalance))}</div>
        </div>
      </div>

      {/* Quick pay */}
      {shop.pendingBalance > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Banknote className="w-4 h-4 text-green-600" /> Record Payment</h2>
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[140px]">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input ref={payAmountRef} type="number" min="0" step="0.01" value={payAmount}
                onChange={(e) => { setPayAmount(e.target.value); setPayError(''); }}
                placeholder="Amount paid"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); payDiscountRef.current?.focus(); } }}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
            </div>
            <div className="relative flex-1 min-w-[130px]">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input ref={payDiscountRef} type="number" min="0" step="0.01" value={payDiscount}
                onChange={(e) => { setPayDiscount(e.target.value); setPayError(''); }}
                placeholder="Discount"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); payNoteRef.current?.focus(); } }}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" />
              {payDiscount && parseFloat(payDiscount) > 0 && shop.pendingBalance > 0 && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-orange-500 font-medium pointer-events-none">
                  {((parseFloat(payDiscount) / shop.pendingBalance) * 100).toFixed(1)}%
                </span>
              )}
            </div>
            <input ref={payNoteRef} value={payNote} onChange={(e) => setPayNote(e.target.value)}
              placeholder="Note (optional)"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlePay(); } }}
              className="flex-1 min-w-[120px] border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
            <button onClick={handlePay} disabled={!payAmount || parseFloat(payAmount) <= 0}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors">
              Pay
            </button>
          </div>
          {payError && (
            <div className="text-red-500 text-xs font-semibold mt-1">{payError}</div>
          )}
          <div className="flex gap-2">
            <button onClick={() => { setPayAmount(String(shop.pendingBalance)); setPayError(''); }}
              className="text-xs border border-green-200 text-green-700 px-3 py-1 rounded-full hover:bg-green-50 transition-colors">
              Pay full ₹{fmtINR(shop.pendingBalance)}
            </button>
          </div>
        </div>
      )}

      {/* Purchases */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4 text-orange-500" /> Purchases</h2>
          <Link href={`/purchases/new?shopId=${id}`} className="text-orange-600 text-sm hover:underline">+ New</Link>
        </div>
        {shopPurchases.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No purchases yet</p>
            <Link href={`/purchases/new?shopId=${id}`} className="text-orange-600 text-sm hover:underline mt-1 block">Record first purchase</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {shopPurchases.map((p) => (
              <Link key={p.id} href={`/purchases/${p.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div>
                  <div className="text-sm font-medium text-gray-900">#{p.purchaseNumber} · {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div className="text-xs text-gray-400">{p.items.length} item{p.items.length !== 1 ? 's' : ''} · {p.items.reduce((s, i) => s + i.totalWeight, 0).toFixed(1)} kg</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 text-sm">₹{fmtINR(p.subtotal)}</div>
                  {p.newBalance > 0 && <div className="text-red-500 text-xs">Bal: ₹{fmtINR(p.newBalance)}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Banknote className="w-4 h-4 text-green-600" /> Payment History</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {payments.map((pay) => (
              <div key={pay.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">{new Date(pay.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                  {pay.note && <div className="text-xs text-gray-400">{cleanNote(pay.note)}</div>}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-700 text-sm">₹{fmtINR(pay.amount)}</div>
                  {pay.discount && pay.discount > 0 && (
                    <div className="text-xs text-orange-500">-₹{fmtINR(pay.discount)} disc</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2">
        <button onClick={handleDelete}
          className="text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-4 py-2 rounded-lg transition-colors">
          Delete Shop
        </button>
      </div>
    </div>
  );
}
