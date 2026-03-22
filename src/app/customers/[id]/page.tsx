'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCustomers, useBills } from '@/lib/storage';
import { ArrowLeft, Phone, IndianRupee, FileText, PlusCircle, Edit2, Trash2, Check, X, Banknote } from 'lucide-react';
import { Bill, Collection, CUSTOMER_PREFIXES } from '@/lib/types';
import clsx from 'clsx';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { customers, updateCustomer, deleteCustomer, loaded } = useCustomers();
  const { bills, loaded: billsLoaded } = useBills();
  const [mounted, setMounted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', nickname: '', code: '', phone: '', prefix: 'திரு', pendingBalance: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [collectMode, setCollectMode] = useState(false);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectDone, setCollectDone] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (id) {
      fetch(`/api/collections?customerId=${id}`)
        .then(r => r.json())
        .then(setCollections)
        .catch(() => {});
    }
  }, [id]);

  const customer = customers.find((c) => c.id === id);
  const customerBills = bills.filter((b: Bill) => b.customerId === id)
    .sort((a: Bill, b: Bill) => new Date(b.date).getTime() - new Date(a.date).getTime());

  useEffect(() => {
    if (customer) {
      setEditForm({
        name: customer.name,
        nickname: customer.nickname || '',
        code: customer.code ? String(customer.code) : '',
        phone: customer.phone || '',
        prefix: customer.prefix || 'திரு',
        pendingBalance: customer.pendingBalance.toString(),
      });
    }
  }, [customer]);

  if (!mounted || !loaded || !billsLoaded) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-64">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 lg:p-8 text-center">
        <p className="text-gray-500 mb-4">Customer not found.</p>
        <Link href="/customers" className="text-green-600 hover:underline">Back to Customers</Link>
      </div>
    );
  }

  const handleSave = () => {
    if (!editForm.name.trim()) return;
    updateCustomer(id, {
      name: editForm.name.trim(),
      nickname: editForm.nickname.trim() || undefined,
      code: editForm.code ? parseInt(editForm.code) : undefined,
      phone: editForm.phone.trim() || undefined,
      prefix: editForm.prefix || 'திரு',
      pendingBalance: parseFloat(editForm.pendingBalance) || 0,
    });
    setEditMode(false);
  };

  const handleDelete = () => {
    deleteCustomer(id);
    router.push('/customers');
  };

  const handleCollect = () => {
    const amount = parseFloat(collectAmount);
    if (isNaN(amount) || amount <= 0) return;
    updateCustomer(id, { pendingBalance: customer.pendingBalance - amount });
    const d = new Date();
    const localDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const newCollection: Collection = {
      id: crypto.randomUUID(),
      customerId: id,
      customerName: customer.name,
      amount,
      date: localDate,
      note: '',
      createdAt: new Date().toISOString(),
    };
    fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCollection),
    });
    setCollections(prev => [newCollection, ...prev]);
    setCollectMode(false);
    setCollectAmount('');
    setCollectDone(true);
    setTimeout(() => setCollectDone(false), 2000);
  };

  const totalSpent = customerBills.reduce((s: number, b: Bill) => s + b.subtotal, 0);
  const totalPaid = customerBills.reduce((s: number, b: Bill) => s + b.amountPaid, 0);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-2xl">
      {/* Back */}
      <Link href="/customers" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </Link>

      {/* Customer card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {editMode ? (
          <div className="space-y-4">
            <h2 className="font-bold text-lg text-gray-900">Edit Customer</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prefix & Name</label>
              <div className="flex gap-2">
                <select value={editForm.prefix} onChange={(e) => setEditForm({ ...editForm, prefix: e.target.value })}
                  className="border border-gray-400 rounded-lg px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white w-28 shrink-0 transition-colors">
                  {CUSTOMER_PREFIXES.map(p => <option key={p} value={p}>{p || '(none)'}</option>)}
                </select>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="flex-1 border border-gray-400 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nickname (bill display)</label>
                <input type="text" value={editForm.nickname} onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  placeholder="e.g. CM"
                  className="w-full border border-gray-400 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input type="number" min="1" value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  placeholder="e.g. 1"
                  className="w-full border border-gray-400 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full border border-gray-400 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Balance Owed (₹)</label>
              <input
                type="number"
                step="0.01"
                value={editForm.pendingBalance}
                onChange={(e) => setEditForm({ ...editForm, pendingBalance: e.target.value })}
                className="w-full border border-gray-400 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditMode(false)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors font-medium">
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <span className="text-green-700 font-bold text-2xl">{customer.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {customer.code && <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{customer.code}</span>}
                    <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
                    {customer.nickname && <span className="text-base text-gray-500">({customer.nickname})</span>}
                  </div>
                  {customer.phone && (
                    <a href={`tel:${customer.phone}`} className="flex items-center gap-1 text-gray-500 text-sm mt-1 hover:text-green-600">
                      <Phone className="w-3.5 h-3.5" />
                      {customer.phone}
                    </a>
                  )}
                  <div className="text-gray-400 text-xs mt-1">
                    Since {new Date(customer.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setEditMode(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{customerBills.length}</div>
                <div className="text-xs text-gray-500">Bills</div>
              </div>
              <div className="text-center border-x border-gray-100">
                <div className="text-lg font-bold text-gray-900 flex items-center justify-center gap-0.5">
                  <IndianRupee className="w-4 h-4" />{totalSpent.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">Total Billed</div>
              </div>
              <div className="text-center">
                <div className={clsx('text-lg font-bold flex items-center justify-center gap-0.5', customer.pendingBalance > 0 ? 'text-red-600' : 'text-green-600')}>
                  <IndianRupee className="w-4 h-4" />{Math.abs(customer.pendingBalance).toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">
                  {customer.pendingBalance > 0 ? 'Balance Owed' : customer.pendingBalance < 0 ? 'Credit' : 'Settled'}
                </div>
              </div>
            </div>

            {/* Quick collection */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              {collectMode ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Amount collected from {customer.nickname || customer.name}
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={collectAmount}
                        onChange={(e) => setCollectAmount(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCollect()}
                        placeholder="e.g. 5000"
                        className="w-full border border-gray-400 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                        autoFocus
                      />
                    </div>
                    <button onClick={handleCollect} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
                      Collect
                    </button>
                    <button onClick={() => { setCollectMode(false); setCollectAmount(''); }} className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {customer.pendingBalance > 0 && (
                    <p className="text-xs text-gray-400">
                      Current balance: ₹{customer.pendingBalance.toFixed(2)} → after collection: ₹{Math.max(0, customer.pendingBalance - (parseFloat(collectAmount) || 0)).toFixed(2)}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setCollectMode(true)}
                  className={clsx(
                    'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    collectDone
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  )}
                >
                  {collectDone ? (
                    <><Check className="w-4 h-4" /> Collected</>
                  ) : (
                    <><Banknote className="w-4 h-4" /> வரவு பதிவு — Record Collection</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-2">Delete Customer?</h3>
            <p className="text-gray-500 text-sm mb-5">
              Are you sure you want to delete <strong>{customer.name}</strong>? This will not delete their bills.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg transition-colors font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <Link
        href={`/bills/new?customerId=${customer.id}`}
        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition-colors shadow-sm"
      >
        <PlusCircle className="w-5 h-5" />
        Create New Bill
      </Link>

      {/* Bill history */}
      <div>
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Bill History
        </h2>
        {customerBills.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
            No bills yet for this customer.
          </div>
        ) : (
          <div className="space-y-2">
            {customerBills.map((bill: Bill) => (
              <Link
                key={bill.id}
                href={`/bills/${bill.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 hover:shadow-sm hover:border-green-200 transition-all"
              >
                <div>
                  <div className="font-medium text-gray-900 text-sm">Bill #{bill.billNumber}</div>
                  <div className="text-gray-400 text-xs">
                    {new Date(bill.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    &nbsp;&middot;&nbsp;{bill.items.length} item{bill.items.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 text-sm flex items-center gap-0.5 justify-end">
                    <IndianRupee className="w-3.5 h-3.5" />{bill.subtotal.toFixed(0)}
                  </div>
                  {bill.newBalance > 0 && (
                    <div className="text-red-500 text-xs">Bal: ₹{bill.newBalance.toFixed(0)}</div>
                  )}
                  {bill.newBalance <= 0 && bill.amountPaid > 0 && (
                    <div className="text-green-600 text-xs">Paid</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Collection history */}
      {collections.length > 0 && (
        <div>
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Banknote className="w-4 h-4" />
            Collection History
          </h2>
          <div className="space-y-2">
            {collections.map((c: Collection) => (
              <div key={c.id} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3">
                <div>
                  <div className="font-medium text-gray-900 text-sm">Amount Collected</div>
                  <div className="text-gray-400 text-xs">
                    {new Date(c.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="font-semibold text-green-700 flex items-center gap-0.5">
                  <IndianRupee className="w-3.5 h-3.5" />{c.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary if multiple bills */}
      {customerBills.length > 1 && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Total billed</span>
            <span className="font-medium">₹{totalSpent.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total paid</span>
            <span className="font-medium">₹{totalPaid.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
