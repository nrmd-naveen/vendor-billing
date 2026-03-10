'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCustomers, useVegetables, useBills } from '@/lib/storage';
import { BillItem, Customer, Vegetable } from '@/lib/types';
import {
  ArrowLeft, Trash2, ChevronDown, IndianRupee, Save, AlertCircle, CornerDownLeft
} from 'lucide-react';
import clsx from 'clsx';

interface DraftItem extends BillItem {
  _key: string;
}

function NewBillForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customers, updateCustomer, loaded: customersLoaded } = useCustomers();
  const { vegetables, loaded: vegsLoaded } = useVegetables();
  const { addBill, loaded: billsLoaded } = useBills();

  const [mounted, setMounted] = useState(false);
  const [customerId, setCustomerId] = useState(searchParams.get('customerId') || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [amountPaid, setAmountPaid] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Entry row state — the "quick add" inputs at the bottom of the items list
  const [entryVegSearch, setEntryVegSearch] = useState('');
  const [entryVeg, setEntryVeg] = useState<Vegetable | null>(null);
  const [entryRate, setEntryRate] = useState('');
  const [entryWeight, setEntryWeight] = useState('');
  const [showVegDropdown, setShowVegDropdown] = useState(false);
  const [vegDropdownIdx, setVegDropdownIdx] = useState(0);

  const vegSearchRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const customer: Customer | undefined = customers.find((c) => c.id === customerId);

  useEffect(() => {
    if (customer && !customerSearch) setCustomerSearch(customer.name);
  }, [customer, customerSearch]);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone && c.phone.includes(customerSearch))
  );

  const filteredVegs = vegetables.filter((v) =>
    v.name.toLowerCase().includes(entryVegSearch.toLowerCase())
  );

  // When a veg is picked, fill rate and move focus to rate input
  const pickVeg = useCallback((veg: Vegetable) => {
    setEntryVeg(veg);
    setEntryVegSearch(veg.name);
    setEntryRate(String(veg.defaultPrice));
    setShowVegDropdown(false);
    setVegDropdownIdx(0);
    setTimeout(() => rateRef.current?.focus(), 0);
  }, []);

  // Commit the entry row as an item
  const commitItem = useCallback(() => {
    if (!entryVeg) return;
    const rate = parseFloat(entryRate);
    const weight = parseFloat(entryWeight);
    if (!rate || !weight) return;

    setItems((prev) => [
      ...prev,
      {
        _key: crypto.randomUUID(),
        vegetableId: entryVeg.id,
        vegetableName: entryVeg.name,
        emoji: entryVeg.emoji,
        pricePerKg: rate,
        weight,
        amount: rate * weight,
      },
    ]);

    // Reset entry row and focus back on veg search
    setEntryVeg(null);
    setEntryVegSearch('');
    setEntryRate('');
    setEntryWeight('');
    setTimeout(() => vegSearchRef.current?.focus(), 0);
  }, [entryVeg, entryRate, entryWeight]);

  const removeItem = (key: string) =>
    setItems((prev) => prev.filter((i) => i._key !== key));

  // Keyboard nav for veg dropdown
  const handleVegSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setVegDropdownIdx((i) => Math.min(i + 1, filteredVegs.length - 1));
      setShowVegDropdown(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setVegDropdownIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (showVegDropdown && filteredVegs[vegDropdownIdx]) {
        e.preventDefault();
        pickVeg(filteredVegs[vegDropdownIdx]);
      }
    } else if (e.key === 'Escape') {
      setShowVegDropdown(false);
    }
  };

  const handleRateKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      weightRef.current?.focus();
    }
  };

  const handleWeightKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitItem();
    }
  };

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const previousBalance = customer?.pendingBalance ?? 0;
  const totalDue = subtotal + previousBalance;
  const paid = parseFloat(amountPaid) || 0;
  const newBalance = totalDue - paid;

  const validate = () => {
    const errs: string[] = [];
    if (!customerId) errs.push('Please select a customer.');
    if (items.length === 0) errs.push('Add at least one vegetable item.');
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setSaving(true);
    try {
      const bill = addBill({
        customerId,
        customerName: customer!.name,
        date,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        items: items.map(({ _key, ...rest }) => rest),
        subtotal,
        previousBalance,
        totalDue,
        amountPaid: paid,
        newBalance,
      });
      updateCustomer(customerId, { pendingBalance: newBalance });
      router.push(`/bills/${bill.id}`);
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !customersLoaded || !vegsLoaded || !billsLoaded) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-64">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/bills" className="text-gray-400 hover:text-gray-600 p-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Bill</h1>
          <p className="text-gray-500 text-sm">Fill in details to create a bill</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
          {errors.map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {e}
            </div>
          ))}
        </div>
      )}

      {/* Customer & Date */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">1. Customer</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setCustomerId(''); setShowCustomerDropdown(true); }}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder="Type to search..."
                className={clsx(
                  'w-full border rounded-lg px-3 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-green-500',
                  customer ? 'border-green-300 bg-green-50' : 'border-gray-200'
                )}
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {showCustomerDropdown && customerSearch && filteredCustomers.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {filteredCustomers.map((c) => (
                  <button key={c.id} type="button"
                    className="w-full text-left px-4 py-2.5 hover:bg-green-50 transition-colors border-b border-gray-50 last:border-0"
                    onMouseDown={() => { setCustomerId(c.id); setCustomerSearch(c.name); setShowCustomerDropdown(false); }}
                  >
                    <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                    {c.phone && <div className="text-gray-400 text-xs">{c.phone}</div>}
                    {c.pendingBalance > 0 && <div className="text-red-500 text-xs">Balance: ₹{c.pendingBalance.toFixed(0)}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date" value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        {customer && (
          <div className={clsx(
            'rounded-lg px-4 py-3 flex items-center justify-between text-sm',
            previousBalance > 0 ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'
          )}>
            <span className={previousBalance > 0 ? 'text-red-700' : 'text-green-700'}>
              Previous balance for <strong>{customer.name}</strong>
            </span>
            <span className={clsx('font-bold flex items-center gap-0.5', previousBalance > 0 ? 'text-red-700' : 'text-green-700')}>
              <IndianRupee className="w-3.5 h-3.5" />
              {Math.abs(previousBalance).toFixed(2)}
              {previousBalance < 0 && ' (credit)'}
            </span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">2. Items</h2>

        {/* Added items table */}
        {items.length > 0 && (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs">
                  <th className="text-left px-3 py-2 font-medium">Vegetable</th>
                  <th className="text-right px-3 py-2 font-medium">Rate/kg</th>
                  <th className="text-right px-3 py-2 font-medium">Weight</th>
                  <th className="text-right px-3 py-2 font-medium">Amount</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item._key} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-gray-900">
                      {item.emoji} {item.vegetableName}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600">₹{item.pricePerKg}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{item.weight} kg</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-green-700">₹{item.amount.toFixed(2)}</td>
                    <td className="px-2 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(item._key)}
                        className="text-gray-300 hover:text-red-500 active:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td colSpan={3} className="px-3 py-2 text-right font-semibold text-gray-700 text-sm">Today&apos;s Total</td>
                  <td className="px-3 py-2 text-right font-bold text-green-700">₹{subtotal.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Quick-entry row */}
        <div className="space-y-2">
          <p className="text-xs text-gray-400 hidden sm:flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" />
            Type vegetable → Tab to rate → Tab to weight → <kbd className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-mono">Enter</kbd> to add
          </p>

          {/* Veg search — full width on all sizes */}
          <div className="relative">
            <input
              ref={vegSearchRef}
              type="text"
              value={entryVegSearch}
              onChange={(e) => {
                setEntryVegSearch(e.target.value);
                setEntryVeg(null);
                setEntryRate('');
                setShowVegDropdown(true);
                setVegDropdownIdx(0);
              }}
              onKeyDown={handleVegSearchKey}
              onFocus={() => { if (entryVegSearch) setShowVegDropdown(true); }}
              onBlur={() => setTimeout(() => setShowVegDropdown(false), 150)}
              placeholder="🥦 Search vegetable..."
              className={clsx(
                'w-full border rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
                entryVeg ? 'border-green-400 bg-green-50' : 'border-gray-200'
              )}
              autoComplete="off"
            />
            {showVegDropdown && filteredVegs.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                {filteredVegs.map((v, idx) => (
                  <button
                    key={v.id}
                    type="button"
                    onMouseDown={() => pickVeg(v)}
                    className={clsx(
                      'w-full text-left px-4 py-3 text-sm border-b border-gray-50 last:border-0 transition-colors',
                      idx === vegDropdownIdx ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50'
                    )}
                  >
                    {v.emoji} {v.name}
                    <span className="ml-2 text-gray-400 text-xs">₹{v.defaultPrice}/kg</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rate + Weight + Add — second row */}
          <div className="flex gap-2">
            {/* Rate */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">₹</span>
              <input
                ref={rateRef}
                type="number"
                min="0"
                step="0.5"
                value={entryRate}
                onChange={(e) => setEntryRate(e.target.value)}
                onKeyDown={handleRateKey}
                placeholder="Rate/kg"
                className="w-full border border-gray-200 rounded-lg pl-7 pr-2 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Weight */}
            <div className="relative flex-1">
              <input
                ref={weightRef}
                type="number"
                min="0"
                step="0.1"
                value={entryWeight}
                onChange={(e) => setEntryWeight(e.target.value)}
                onKeyDown={handleWeightKey}
                placeholder="Weight (kg)"
                className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Add button */}
            <button
              type="button"
              onClick={commitItem}
              disabled={!entryVeg || !entryRate || !entryWeight}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <CornerDownLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Add</span>
            </button>
          </div>

          {/* Live preview of current entry */}
          {entryVeg && entryRate && entryWeight && (
            <div className="text-xs text-gray-500 px-1 flex items-center gap-1">
              <span className="text-green-600 font-medium">
                {entryVeg.emoji} {entryVeg.name}
              </span>
              — {entryWeight} kg × ₹{entryRate} =
              <span className="font-semibold text-gray-800">
                ₹{(parseFloat(entryWeight) * parseFloat(entryRate)).toFixed(2)}
              </span>
              <span className="text-gray-400 ml-1">↵ Enter to add</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">3. Payment</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-700">
            <span>Today&apos;s Total</span>
            <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
          </div>
          {previousBalance !== 0 && (
            <div className={clsx('flex justify-between', previousBalance > 0 ? 'text-red-600' : 'text-green-600')}>
              <span>Previous Balance</span>
              <span className="font-semibold">
                {previousBalance > 0 ? '+' : '-'}₹{Math.abs(previousBalance).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 border-t pt-2 text-base">
            <span>Total Due</span>
            <span>₹{totalDue.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid Now (₹)</label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number" min="0" step="0.50"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              placeholder="0.00"
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {totalDue > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              <button type="button" onClick={() => setAmountPaid(totalDue.toFixed(2))}
                className="text-xs border border-green-200 text-green-700 px-3 py-1 rounded-full hover:bg-green-50 transition-colors">
                Pay Full ₹{totalDue.toFixed(0)}
              </button>
              <button type="button" onClick={() => setAmountPaid(subtotal.toFixed(2))}
                className="text-xs border border-gray-200 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-50 transition-colors">
                Today only ₹{subtotal.toFixed(0)}
              </button>
              <button type="button" onClick={() => setAmountPaid('0')}
                className="text-xs border border-gray-200 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-50 transition-colors">
                No payment
              </button>
            </div>
          )}
        </div>

        <div className={clsx(
          'rounded-xl p-4 flex items-center justify-between',
          newBalance > 0 ? 'bg-red-50 border border-red-100' : newBalance < 0 ? 'bg-blue-50 border border-blue-100' : 'bg-green-50 border border-green-100'
        )}>
          <div>
            <div className="text-sm font-medium text-gray-700">
              {newBalance > 0 ? 'New Balance Owed' : newBalance < 0 ? 'Credit to Customer' : 'Fully Settled'}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {newBalance > 0 ? 'Customer owes this amount' : newBalance < 0 ? 'Overpaid — carry forward' : 'Nothing owed'}
            </div>
          </div>
          <div className={clsx(
            'text-2xl font-bold flex items-center gap-0.5',
            newBalance > 0 ? 'text-red-600' : newBalance < 0 ? 'text-blue-600' : 'text-green-600'
          )}>
            <IndianRupee className="w-5 h-5" />
            {Math.abs(newBalance).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-4">
        <Link href="/bills"
          className="flex-1 sm:flex-none border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors text-center">
          Cancel
        </Link>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Bill'}
        </button>
      </div>
    </div>
  );
}

export default function NewBillPage() {
  return (
    <Suspense fallback={
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-64">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    }>
      <NewBillForm />
    </Suspense>
  );
}
