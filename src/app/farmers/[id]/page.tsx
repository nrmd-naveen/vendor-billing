'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFarmers, useFarmerBills, useFarmerPayments } from '@/lib/storage';
import { ArrowLeft, IndianRupee, Banknote, Edit2, Check, X, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { fmtINR } from '@/lib/format';
import clsx from 'clsx';

export default function FarmerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { farmers, updateFarmer, deleteFarmer, loaded } = useFarmers();
  const { farmerBills, loaded: billsLoaded } = useFarmerBills();
  const { payments, addPayment, loaded: paymentsLoaded } = useFarmerPayments(id);
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', code: '' });
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payDone, setPayDone] = useState(false);

  const payAmountRef = useRef<HTMLInputElement>(null);
  const payNoteRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const farmer = farmers.find((f) => f.id === id);
  const bills = farmerBills.filter((b) => b.farmerId === id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  useEffect(() => {
    if (farmer && !editing) setEditForm({ name: farmer.name, phone: farmer.phone || '', code: farmer.code ? String(farmer.code) : '' });
  }, [farmer, editing]);

  if (!mounted || !loaded || !billsLoaded || !paymentsLoaded) {
    return <div className="p-6 flex items-center justify-center min-h-64"><div className="text-gray-400 animate-pulse">Loading...</div></div>;
  }

  if (!farmer) {
    return <div className="p-6 text-center"><p className="text-gray-500">Farmer not found</p><Link href="/farmers" className="text-yellow-600 hover:underline text-sm mt-2 block">Back to farmers</Link></div>;
  }

  const totalReceived = bills.reduce((s, b) => s + b.subtotal, 0);

  const handleSaveEdit = () => {
    if (!editForm.name.trim()) return;
    updateFarmer(id, { name: editForm.name.trim(), phone: editForm.phone.trim() || undefined, code: editForm.code ? parseInt(editForm.code) : undefined });
    setEditing(false);
  };

  const handlePay = async () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    await addPayment({ farmerId: id, farmerName: farmer.name, amount, date: today, note: payNote });
    updateFarmer(id, { pendingBalance: farmer.pendingBalance - amount });
    setPayAmount(''); setPayNote(''); setPayDone(true);
    setTimeout(() => setPayDone(false), 3000);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/farmers" className="text-gray-400 hover:text-gray-600 p-1"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500" autoFocus />
              <button onClick={handleSaveEdit} className="text-green-600 p-1"><Check className="w-5 h-5" /></button>
              <button onClick={() => setEditing(false)} className="text-gray-400 p-1"><X className="w-5 h-5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{farmer.name}</h1>
              <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-yellow-500 p-1"><Edit2 className="w-4 h-4" /></button>
            </div>
          )}
          {farmer.phone && <div className="text-gray-500 text-sm">{farmer.phone}</div>}
        </div>
        <Link href={`/farmer-bills/new?farmerId=${id}`}
          className="flex items-center gap-1.5 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Bill
        </Link>
      </div>

      {payDone && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <Banknote className="w-4 h-4" /> Payment recorded
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs mb-1">Total Received</div>
          <div className="font-bold text-gray-900">₹{fmtINR(totalReceived)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs mb-1">Bills</div>
          <div className="font-bold text-gray-900">{bills.length}</div>
        </div>
        <div className={clsx('rounded-xl p-4 shadow-sm border', farmer.pendingBalance > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100')}>
          <div className={clsx('text-xs mb-1', farmer.pendingBalance > 0 ? 'text-red-600' : 'text-green-600')}>I Owe Farmer</div>
          <div className={clsx('font-bold', farmer.pendingBalance > 0 ? 'text-red-700' : 'text-green-700')}>₹{fmtINR(Math.abs(farmer.pendingBalance))}</div>
        </div>
      </div>

      {farmer.pendingBalance > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Banknote className="w-4 h-4 text-green-600" /> Pay Farmer</h2>
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[140px]">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input ref={payAmountRef} type="number" min="0" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); payNoteRef.current?.focus(); } }}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
            </div>
            <input ref={payNoteRef} value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="Note (optional)"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlePay(); } }}
              className="flex-1 min-w-[120px] border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
            <button onClick={handlePay} disabled={!payAmount || parseFloat(payAmount) <= 0}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-medium text-sm">Pay</button>
          </div>
          <button onClick={() => setPayAmount(String(farmer.pendingBalance))}
            className="text-xs border border-green-200 text-green-700 px-3 py-1 rounded-full hover:bg-green-50">
            Pay full ₹{fmtINR(farmer.pendingBalance)}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4 text-yellow-500" /> Bills</h2>
          <Link href={`/farmer-bills/new?farmerId=${id}`} className="text-yellow-600 text-sm hover:underline">+ New</Link>
        </div>
        {bills.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No bills yet</p>
            <Link href={`/farmer-bills/new?farmerId=${id}`} className="text-yellow-600 text-sm hover:underline mt-1 block">Create first bill</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bills.map((b) => (
              <Link key={b.id} href={`/farmer-bills/${b.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div>
                  <div className="text-sm font-medium text-gray-900">#{b.billNumber} · {new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div className="text-xs text-gray-400">{b.items.length} items · {b.commissionRate}% commission</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">₹{fmtINR(b.subtotal)} received</div>
                  <div className="font-semibold text-yellow-700 text-sm">₹{fmtINR(b.netAmount)} net</div>
                  {b.newBalance > 0 && <div className="text-red-500 text-xs">Owe: ₹{fmtINR(b.newBalance)}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {payments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900 flex items-center gap-2"><Banknote className="w-4 h-4 text-green-600" /> Payment History</h2></div>
          <div className="divide-y divide-gray-50">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                  {p.note && <div className="text-xs text-gray-400">{p.note}</div>}
                </div>
                <div className="font-semibold text-green-700 text-sm">₹{fmtINR(p.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2">
        <button onClick={() => { deleteFarmer(id); router.push('/farmers'); }}
          className="text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-4 py-2 rounded-lg transition-colors">
          Delete Farmer
        </button>
      </div>
    </div>
  );
}
