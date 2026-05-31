'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useFarmers, useVegetables, useFarmerBills } from '@/lib/storage';
import { useSettings } from '@/lib/useSettings';
import { BillItem, Farmer, Sack, Vegetable } from '@/lib/types';
import { ArrowLeft, Trash2, ChevronDown, IndianRupee, Save, AlertCircle, CornerDownLeft, Package, X, Percent } from 'lucide-react';
import { fmtINR } from '@/lib/format';
import clsx from 'clsx';

interface DraftItem extends BillItem { _key: string; }

function NewFarmerBillForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { farmers, updateFarmer, loaded: farmersLoaded } = useFarmers();
  const { vegetables, loaded: vegsLoaded } = useVegetables();
  const { addFarmerBill, loaded: billsLoaded } = useFarmerBills();
  const { settings, loaded: settingsLoaded } = useSettings();

  const [mounted, setMounted] = useState(false);
  const [farmerId, setFarmerId] = useState(searchParams.get('farmerId') || '');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [items, setItems] = useState<DraftItem[]>([]);
  const [commissionRate, setCommissionRate] = useState('10');
  const [coolie, setCoolie] = useState('');
  const [vadakai, setVadakai] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [farmerSearch, setFarmerSearch] = useState('');
  const [showFarmerDropdown, setShowFarmerDropdown] = useState(false);
  const [farmerDropdownIdx, setFarmerDropdownIdx] = useState(0);
  const [entryVegSearch, setEntryVegSearch] = useState('');
  const [entryVeg, setEntryVeg] = useState<Vegetable | null>(null);
  const [entryDescription, setEntryDescription] = useState('');
  const [entryRate, setEntryRate] = useState('');
  const [entrySacks, setEntrySacks] = useState<Sack[]>([]);
  const [entrySackWeight, setEntrySackWeight] = useState('');
  const [showVegDropdown, setShowVegDropdown] = useState(false);
  const [vegDropdownIdx, setVegDropdownIdx] = useState(-1);

  const farmerInputRef = useRef<HTMLInputElement>(null);
  const vegSearchRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);
  const sackWeightRef = useRef<HTMLInputElement>(null);
  const commissionRef = useRef<HTMLInputElement>(null);
  const coolieRef = useRef<HTMLInputElement>(null);
  const vadakaiRef = useRef<HTMLInputElement>(null);
  const amountPaidRef = useRef<HTMLInputElement>(null);
  const vegDropdownRef = useRef<HTMLDivElement>(null);
  const farmerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && farmersLoaded && vegsLoaded && billsLoaded) setTimeout(() => farmerInputRef.current?.focus(), 50);
  }, [mounted, farmersLoaded, vegsLoaded, billsLoaded]);

  const farmer: Farmer | undefined = farmers.find((f) => f.id === farmerId);
  useEffect(() => { if (farmer && !farmerSearch) setFarmerSearch(farmer.name); }, [farmer, farmerSearch]);

  useEffect(() => {
    if (!showVegDropdown || !vegDropdownRef.current) return;
    const el = vegDropdownRef.current.children[vegDropdownIdx] as HTMLElement;
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [vegDropdownIdx, showVegDropdown]);

  useEffect(() => {
    if (!showFarmerDropdown || !farmerDropdownRef.current) return;
    const el = farmerDropdownRef.current.children[farmerDropdownIdx] as HTMLElement;
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [farmerDropdownIdx, showFarmerDropdown]);

  const filteredFarmers = farmers.filter((f) =>
    !farmerSearch ||
    f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
    (f.phone && f.phone.includes(farmerSearch)) ||
    (f.code && String(f.code).includes(farmerSearch))
  );

  const filteredVegs = (() => {
    const s = entryVegSearch.trim();
    if (!s) return vegetables;
    const n = parseInt(s);
    if (!isNaN(n) && String(n) === s) {
      const m = vegetables.filter(v => v.code === n);
      return m.length > 0 ? m : vegetables;
    }
    const sl = s.toLowerCase();
    return vegetables.filter(v =>
      v.name.toLowerCase().includes(sl) ||
      (v.englishName && v.englishName.toLowerCase().includes(sl)) ||
      (v.nicknames && v.nicknames.some(nk => nk.toLowerCase().includes(sl)))
    );
  })();

  const pickFarmer = useCallback((f: Farmer) => {
    setFarmerId(f.id); setFarmerSearch(f.name);
    setShowFarmerDropdown(false); setFarmerDropdownIdx(0);
    setTimeout(() => vegSearchRef.current?.focus(), 50);
  }, []);

  const pickVeg = useCallback((veg: Vegetable) => {
    setEntryVeg(veg); setEntryVegSearch(veg.name); setEntryDescription('');
    setEntryRate(settings.useDefaultRates ? String(veg.defaultPrice) : '');
    setShowVegDropdown(false); setVegDropdownIdx(-1);
    setTimeout(() => sackWeightRef.current?.focus(), 0);
  }, [settings.useDefaultRates]);

  const addSack = useCallback(() => {
    const w = parseFloat(entrySackWeight);
    if (!w || w <= 0) return;
    setEntrySacks((prev) => [...prev, { id: crypto.randomUUID(), weight: w }]);
    setEntrySackWeight('');
    setTimeout(() => sackWeightRef.current?.focus(), 0);
  }, [entrySackWeight]);

  const commitItem = useCallback(() => {
    if (!entryVeg || !entryRate || entrySacks.length === 0) return;
    const rate = parseFloat(entryRate);
    if (!rate) return;
    const totalWeight = entrySacks.reduce((s, sk) => s + sk.weight, 0);
    setItems((prev) => [...prev, {
      _key: crypto.randomUUID(),
      vegetableId: entryVeg.id, vegetableName: entryVeg.name,
      description: entryDescription.trim() || undefined,
      emoji: entryVeg.emoji,
      pricePerKg: rate, sacks: entrySacks, totalWeight, amount: rate * totalWeight,
    }]);
    setEntryVeg(null); setEntryVegSearch(''); setEntryDescription(''); setEntryRate('');
    setEntrySacks([]); setEntrySackWeight(''); setVegDropdownIdx(-1);
    setTimeout(() => vegSearchRef.current?.focus(), 0);
  }, [entryVeg, entryRate, entrySacks, entryDescription]);

  const handleFarmerKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setFarmerDropdownIdx(i => Math.min(i + 1, filteredFarmers.length - 1)); setShowFarmerDropdown(true); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFarmerDropdownIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && showFarmerDropdown && filteredFarmers[farmerDropdownIdx]) { e.preventDefault(); pickFarmer(filteredFarmers[farmerDropdownIdx]); }
    else if (e.key === 'Escape') setShowFarmerDropdown(false);
  };

  const handleVegSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setVegDropdownIdx(i => Math.min(i + 1, filteredVegs.length - 1)); setShowVegDropdown(true); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setVegDropdownIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' || e.key === 'Tab') {
      if (vegDropdownIdx >= 0 && showVegDropdown && filteredVegs[vegDropdownIdx]) { e.preventDefault(); pickVeg(filteredVegs[vegDropdownIdx]); }
      else if (entryVegSearch.trim() === '') { e.preventDefault(); setShowVegDropdown(false); commissionRef.current?.focus(); }
    } else if (e.key === 'Escape') setShowVegDropdown(false);
  };

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const commissionRateVal = parseFloat(commissionRate) || 0;
  const commission = subtotal * (commissionRateVal / 100);
  const coolieVal = parseFloat(coolie) || 0;
  const vadakaiVal = parseFloat(vadakai) || 0;
  const netAmount = subtotal - commission - coolieVal - vadakaiVal;
  const previousBalance = farmer?.pendingBalance ?? 0;
  const totalToPay = netAmount + previousBalance;
  const paid = parseFloat(amountPaid) || 0;
  const newBalance = totalToPay - paid;
  const entrySacksTotal = entrySacks.reduce((s, sk) => s + sk.weight, 0);

  const handleSave = async () => {
    const errs: string[] = [];
    if (!farmerId) errs.push('Please select a farmer.');
    if (items.length === 0) errs.push('Add at least one item.');
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setSaving(true);
    try {
      const bill = await addFarmerBill({
        farmerId, farmerName: farmer!.name, date,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        items: items.map(({ _key, ...rest }) => rest),
        subtotal, commissionRate: commissionRateVal, commission,
        coolie: coolieVal, vadakai: vadakaiVal, netAmount,
        previousBalance, totalToPay, amountPaid: paid, newBalance,
      });
      if (paid > 0) {
        await fetch('/api/farmer-payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: crypto.randomUUID(),
            farmerId,
            farmerName: farmer!.name,
            amount: paid,
            date,
            note: `Bill #${bill.billNumber}`,
            createdAt: new Date().toISOString(),
            updateBalance: false,
          }),
        });
      }
      updateFarmer(farmerId, { pendingBalance: newBalance });
      router.push(`/farmer-bills/${bill.id}`);
    } finally { setSaving(false); }
  };

  if (saving || !mounted || !farmersLoaded || !vegsLoaded || !billsLoaded || !settingsLoaded) {
    return <div className="p-6 flex items-center justify-center min-h-64"><div className="text-gray-400 animate-pulse">Loading...</div></div>;
  }

  return (
    <div className="p-4 lg:p-8 space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/farmer-bills" className="text-gray-400 hover:text-gray-600 p-1"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">சம்சாரி Bill</h1>
          <p className="text-gray-500 text-sm">Farmer bill with commission deduction</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
          {errors.map((e, i) => <div key={i} className="flex items-start gap-2 text-red-700 text-sm"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{e}</div>)}
        </div>
      )}

      {/* Farmer & Date */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">1. சம்சாரி (Farmer)</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Farmer <span className="text-red-500">*</span></label>
            <div className="relative">
              <input ref={farmerInputRef} type="text" value={farmerSearch}
                onChange={(e) => { setFarmerSearch(e.target.value); setFarmerId(''); setShowFarmerDropdown(true); setFarmerDropdownIdx(0); }}
                onFocus={() => setShowFarmerDropdown(true)}
                onBlur={() => setTimeout(() => setShowFarmerDropdown(false), 150)}
                onKeyDown={handleFarmerKey}
                placeholder="Type farmer name or code..."
                className={clsx('w-full border rounded-lg px-3 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-yellow-500',
                  farmer ? 'border-yellow-500 bg-yellow-50' : 'border-gray-400')} />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {showFarmerDropdown && filteredFarmers.length > 0 && (
              <div ref={farmerDropdownRef} className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {filteredFarmers.map((f, idx) => (
                  <button key={f.id} type="button" onMouseDown={() => pickFarmer(f)}
                    className={clsx('w-full text-left px-4 py-2.5 border-b border-gray-50 last:border-0',
                      idx === farmerDropdownIdx ? 'bg-yellow-100 font-medium' : 'hover:bg-yellow-50')}>
                    <div className="flex items-center gap-2">
                      {f.code && <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{f.code}</span>}
                      <span className="font-medium text-gray-900 text-sm">{f.name}</span>
                    </div>
                    {f.phone && <div className="text-gray-400 text-xs">{f.phone}</div>}
                    {f.pendingBalance > 0 && <div className="text-red-500 text-xs">I owe: ₹{fmtINR(f.pendingBalance)}</div>}
                  </button>
                ))}
              </div>
            )}
            {filteredFarmers.length === 0 && farmerSearch && (
              <div className="mt-1 text-xs text-gray-500">Not found. <Link href="/farmers" className="text-yellow-600 hover:underline">Add farmer →</Link></div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-400 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          </div>
        </div>
        {farmer && previousBalance > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-red-700">Previous balance owed to <strong>{farmer.name}</strong></span>
            <span className="font-bold text-red-700 flex items-center gap-0.5"><IndianRupee className="w-3.5 h-3.5" />{fmtINR(previousBalance, 2)}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">2. பொருட்கள் (Vegetables Received)</h2>
        {items.length > 0 && (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs">
                  <th className="text-left px-3 py-2 font-medium">Vegetable</th>
                  <th className="text-right px-3 py-2 font-medium">Rate/kg</th>
                  <th className="text-right px-3 py-2 font-medium">Weight</th>
                  <th className="text-right px-3 py-2 font-medium">Amount</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item._key} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-900">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold">{item.emoji} {item.vegetableName}</span>
                        {item.description && <span className="text-sm text-gray-500">{item.description}</span>}
                      </div>
                      <div className="text-xs text-gray-400">{item.sacks.length} மூடை ({item.sacks.map(s => s.weight).join(', ')})</div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600">₹{fmtINR(item.pricePerKg, 2)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{item.totalWeight} kg</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-yellow-700">₹{fmtINR(item.amount, 2)}</td>
                    <td className="px-2 py-2.5"><button type="button" onClick={() => setItems(prev => prev.filter(i => i._key !== item._key))} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td colSpan={3} className="px-3 py-2 text-right font-semibold text-gray-700 text-sm">மொத்தம்</td>
                  <td className="px-3 py-2 text-right font-bold text-yellow-700">₹{fmtINR(subtotal, 2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="space-y-2">
          <div className="relative">
            <input ref={vegSearchRef} type="text" value={entryVegSearch}
              onChange={(e) => { setEntryVegSearch(e.target.value); setEntryVeg(null); setEntryDescription(''); setEntryRate(''); setEntrySacks([]); setShowVegDropdown(true); setVegDropdownIdx(e.target.value.trim() ? 0 : -1); }}
              onKeyDown={handleVegSearchKey} onFocus={() => setShowVegDropdown(true)} onBlur={() => setTimeout(() => setShowVegDropdown(false), 150)}
              placeholder="🥦 Search vegetable or type code..."
              className={clsx('w-full border rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500',
                entryVeg ? 'border-yellow-500 bg-yellow-50' : 'border-gray-400')}
              autoComplete="off" />
            {entryVeg && (
              <div className="mt-2">
                <label className="block text-[10px] font-medium text-gray-400 mb-0.5 ml-1">Custom Name / Description (Optional)</label>
                <input ref={descriptionRef} type="text" value={entryDescription}
                  onChange={(e) => setEntryDescription(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); sackWeightRef.current?.focus(); } }}
                  placeholder="Override vegetable name..."
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
            )}
            {showVegDropdown && filteredVegs.length > 0 && (
              <div ref={vegDropdownRef} className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                {filteredVegs.map((v, idx) => (
                  <button key={v.id} type="button" onMouseDown={() => pickVeg(v)}
                    className={clsx('w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 last:border-0 flex items-center gap-2',
                      idx === vegDropdownIdx ? 'bg-blue-200 font-bold' : 'hover:bg-gray-50')}>
                    {v.code && <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded shrink-0">{v.code}</span>}
                    <span>{v.emoji} {v.name}</span>
                    {v.englishName && <span className="text-gray-500 text-xs">({v.englishName})</span>}
                    <span className="ml-auto text-xs shrink-0">₹{fmtINR(v.defaultPrice)}/kg</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input ref={sackWeightRef} type="number" min="0" step="0.1" value={entrySackWeight}
                onChange={(e) => setEntrySackWeight(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (entrySackWeight.trim()) addSack(); else rateRef.current?.focus(); } }}
                placeholder="Sack kg"
                className={clsx('w-full border rounded-lg pl-9 pr-2 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500',
                  entrySacks.length > 0 ? 'border-yellow-500 bg-yellow-50' : 'border-gray-400')} />
            </div>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">₹</span>
              <input ref={rateRef} type="number" min="0" step="0.5" value={entryRate}
                onChange={(e) => setEntryRate(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commitItem(); } }}
                placeholder="Rate/kg"
                className="w-full border border-gray-400 rounded-lg pl-7 pr-2 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            </div>
            <button type="button" onClick={commitItem} disabled={!entryVeg || !entryRate || entrySacks.length === 0}
              className="flex items-center gap-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap">
              <CornerDownLeft className="w-4 h-4" /><span className="hidden sm:inline">Add</span>
            </button>
          </div>

          {entrySacks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-1">
              {entrySacks.map((sack, idx) => (
                <span key={sack.id} className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1 rounded-full font-medium">
                  <Package className="w-3 h-3" />மூடை {idx + 1}: {sack.weight} kg
                  <button type="button" onClick={() => setEntrySacks(prev => prev.filter(s => s.id !== sack.id))} className="ml-0.5 hover:text-red-600"><X className="w-3 h-3" /></button>
                </span>
              ))}
              <span className="text-xs text-gray-500 px-1">= {entrySacksTotal} kg</span>
            </div>
          )}
        </div>
      </div>

      {/* Deductions & Payment */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">3. கழிவுகள் & கட்டணம் (Deductions & Payment)</h2>

        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Percent className="w-3.5 h-3.5" /> Commission Rate (%)</label>
            <div className="relative w-36">
              <input ref={commissionRef} type="number" min="0" max="100" step="0.5" value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); coolieRef.current?.focus(); } }}
                className="w-full border border-gray-400 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">கூலி / Labour (₹)</label>
            <div className="relative w-36">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input ref={coolieRef} type="number" min="0" step="1" value={coolie}
                onChange={(e) => setCoolie(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); vadakaiRef.current?.focus(); } }}
                placeholder="0"
                className="w-full border border-gray-400 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">வாடகை / Rent (₹)</label>
            <div className="relative w-36">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input ref={vadakaiRef} type="number" min="0" step="1" value={vadakai}
                onChange={(e) => setVadakai(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); amountPaidRef.current?.focus(); } }}
                placeholder="0"
                className="w-full border border-gray-400 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            </div>
          </div>
        </div>

        {/* Calculation breakdown */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-700"><span>மொத்த மதிப்பு (Subtotal)</span><span className="font-semibold">₹{fmtINR(subtotal, 2)}</span></div>
          {commissionRateVal > 0 && <div className="flex justify-between text-red-600"><span>கமிஷன் {commissionRateVal}% (Commission)</span><span className="font-semibold">−₹{fmtINR(commission, 2)}</span></div>}
          {coolieVal > 0 && <div className="flex justify-between text-red-600"><span>கூலி (Labour)</span><span className="font-semibold">−₹{fmtINR(coolieVal, 2)}</span></div>}
          {vadakaiVal > 0 && <div className="flex justify-between text-red-600"><span>வாடகை (Rent)</span><span className="font-semibold">−₹{fmtINR(vadakaiVal, 2)}</span></div>}
          <div className="flex justify-between font-bold text-gray-900 border-t pt-2 text-base"><span>கிடைக்கும் தொகை (Net to Farmer)</span><span className="text-yellow-700">₹{fmtINR(netAmount, 2)}</span></div>
          {previousBalance > 0 && <div className="flex justify-between text-red-600"><span>முன் பாக்கி</span><span className="font-semibold">+₹{fmtINR(previousBalance, 2)}</span></div>}
          {(previousBalance > 0 || netAmount !== totalToPay) && (
            <div className="flex justify-between font-bold text-gray-900 border-t pt-2"><span>மொத்த கொடுக்கவேண்டியது</span><span>₹{fmtINR(totalToPay, 2)}</span></div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">இப்போது கொடுத்த தொகை — Amount Paid Now (₹)</label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input ref={amountPaidRef} type="number" min="0" step="0.50" value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              placeholder="0.00"
              className="w-full border border-gray-400 rounded-lg pl-9 pr-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          </div>
          {totalToPay > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              <button type="button" onClick={() => setAmountPaid(totalToPay.toFixed(2))} className="text-xs border border-yellow-200 text-yellow-700 px-3 py-1 rounded-full hover:bg-yellow-50">Pay Full ₹{fmtINR(totalToPay, 0)}</button>
              <button type="button" onClick={() => setAmountPaid(netAmount.toFixed(2))} className="text-xs border border-gray-200 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-50">Net only ₹{fmtINR(netAmount, 0)}</button>
              <button type="button" onClick={() => setAmountPaid('0')} className="text-xs border border-gray-200 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-50">No payment</button>
            </div>
          )}
        </div>

        <div className={clsx('rounded-xl p-4 flex items-center justify-between',
          newBalance > 0 ? 'bg-red-50 border border-red-100' : newBalance < 0 ? 'bg-blue-50 border border-blue-100' : 'bg-green-50 border border-green-100')}>
          <div>
            <div className="text-sm font-medium text-gray-700">{newBalance > 0 ? 'பாக்கி — Still Owed to Farmer' : newBalance < 0 ? 'Farmer owes me' : 'Fully Settled'}</div>
            <div className="text-xs text-gray-400 mt-0.5">{newBalance > 0 ? 'You still owe this amount to the farmer' : ''}</div>
          </div>
          <div className={clsx('text-2xl font-bold flex items-center gap-0.5',
            newBalance > 0 ? 'text-red-600' : newBalance < 0 ? 'text-blue-600' : 'text-green-600')}>
            <IndianRupee className="w-5 h-5" />{fmtINR(Math.abs(newBalance), 2)}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pb-4">
        <Link href="/farmer-bills" className="flex-1 sm:flex-none border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 text-center">Cancel</Link>
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm disabled:opacity-60">
          <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Bill'}
        </button>
      </div>
    </div>
  );
}

export default function NewFarmerBillPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center min-h-64"><div className="text-gray-400 animate-pulse">Loading...</div></div>}>
      <NewFarmerBillForm />
    </Suspense>
  );
}
