'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useShops, useVegetables, usePurchases } from '@/lib/storage';
import { useSettings } from '@/lib/useSettings';
import { BillItem, Shop, Sack, Vegetable } from '@/lib/types';
import {
  ArrowLeft, Trash2, ChevronDown, IndianRupee, Save, AlertCircle, CornerDownLeft, Package, X
} from 'lucide-react';
import { fmtINR } from '@/lib/format';
import clsx from 'clsx';

interface DraftItem extends BillItem { _key: string; }

function NewPurchaseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { shops, updateShop, loaded: shopsLoaded } = useShops();
  const { vegetables, loaded: vegsLoaded } = useVegetables();
  const { addPurchase, loaded: purchasesLoaded } = usePurchases();
  const { settings, loaded: settingsLoaded } = useSettings();

  const [mounted, setMounted] = useState(false);
  const [shopId, setShopId] = useState(searchParams.get('shopId') || '');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [items, setItems] = useState<DraftItem[]>([]);
  const [amountPaid, setAmountPaid] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [shopSearch, setShopSearch] = useState('');
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [shopDropdownIdx, setShopDropdownIdx] = useState(0);

  const [entryVegSearch, setEntryVegSearch] = useState('');
  const [entryVeg, setEntryVeg] = useState<Vegetable | null>(null);
  const [entryDescription, setEntryDescription] = useState('');
  const [entryRate, setEntryRate] = useState('');
  const [entrySacks, setEntrySacks] = useState<Sack[]>([]);
  const [entrySackWeight, setEntrySackWeight] = useState('');
  const [showVegDropdown, setShowVegDropdown] = useState(false);
  const [vegDropdownIdx, setVegDropdownIdx] = useState(-1);

  const shopInputRef = useRef<HTMLInputElement>(null);
  const vegSearchRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);
  const sackWeightRef = useRef<HTMLInputElement>(null);
  const amountPaidRef = useRef<HTMLInputElement>(null);
  const vegDropdownRef = useRef<HTMLDivElement>(null);
  const shopDropdownRef = useRef<HTMLDivElement>(null);
  const itemsSectionRef = useRef<HTMLDivElement>(null);
  const paymentSectionRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  const handleItemsFocus = () => {
    if (!itemsSectionRef.current) return;
    const rect = itemsSectionRef.current.getBoundingClientRect();
    if (rect.top > 10) {
      itemsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePaymentFocus = () => {
    if (!paymentSectionRef.current) return;
    const rect = paymentSectionRef.current.getBoundingClientRect();
    if (rect.top > 10) {
      paymentSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };


  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && shopsLoaded && vegsLoaded && purchasesLoaded) {
      setTimeout(() => shopInputRef.current?.focus(), 50);
    }
  }, [mounted, shopsLoaded, vegsLoaded, purchasesLoaded]);

  const shop: Shop | undefined = shops.find((s) => s.id === shopId);

  useEffect(() => {
    if (shop && !shopSearch) setShopSearch(shop.name);
  }, [shop, shopSearch]);

  useEffect(() => {
    if (!showVegDropdown || !vegDropdownRef.current) return;
    const el = vegDropdownRef.current.children[vegDropdownIdx] as HTMLElement;
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [vegDropdownIdx, showVegDropdown]);

  useEffect(() => {
    if (!showShopDropdown || !shopDropdownRef.current) return;
    const el = shopDropdownRef.current.children[shopDropdownIdx] as HTMLElement;
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [shopDropdownIdx, showShopDropdown]);

  const filteredShops = shops.filter((s) =>
    !shopSearch ||
    s.name.toLowerCase().includes(shopSearch.toLowerCase()) ||
    (s.nickname && s.nickname.toLowerCase().includes(shopSearch.toLowerCase())) ||
    (s.phone && s.phone.includes(shopSearch)) ||
    (s.code && String(s.code).includes(shopSearch))
  );

  const filteredVegs = (() => {
    const s = entryVegSearch.trim();
    if (!s) return vegetables;
    const n = parseInt(s);
    if (!isNaN(n) && String(n) === s) {
      const codeMatch = vegetables.filter(v => v.code === n);
      return codeMatch.length > 0 ? codeMatch : vegetables;
    }
    const sl = s.toLowerCase();
    return vegetables.filter(v =>
      v.name.toLowerCase().includes(sl) ||
      (v.englishName && v.englishName.toLowerCase().includes(sl)) ||
      (v.nicknames && v.nicknames.some(n => n.toLowerCase().includes(sl)))
    );
  })();

  const pickShop = useCallback((s: Shop) => {
    setShopId(s.id);
    setShopSearch(s.name);
    setShowShopDropdown(false);
    setShopDropdownIdx(0);
    setTimeout(() => dateRef.current?.focus(), 50);
  }, []);

  const pickVeg = useCallback((veg: Vegetable) => {
    setEntryVeg(veg);
    setEntryVegSearch(veg.name);
    setEntryDescription('');
    if (!entryRate) {
      setEntryRate(settings.useDefaultRates ? String(veg.defaultPrice) : '');
    }
    setShowVegDropdown(false);
    setVegDropdownIdx(-1);
    setTimeout(() => sackWeightRef.current?.focus(), 0);
  }, [settings.useDefaultRates, entryRate]);

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
      emoji: String(entryVeg.code),
      pricePerKg: rate, sacks: entrySacks, totalWeight, amount: rate * totalWeight,
    }]);
    setEntryVeg(null); setEntryVegSearch(''); setEntryDescription(''); setEntryRate('');
    setEntrySacks([]); setEntrySackWeight(''); setVegDropdownIdx(-1);
    setTimeout(() => rateRef.current?.focus(), 0);
  }, [entryVeg, entryRate, entrySacks, entryDescription]);

  const removeItem = (key: string) => setItems((prev) => prev.filter((i) => i._key !== key));
  const removeSack = (id: string) => setEntrySacks((prev) => prev.filter((s) => s.id !== id));

  const handleShopKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setShopDropdownIdx(i => Math.min(i + 1, filteredShops.length - 1)); setShowShopDropdown(true); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setShopDropdownIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') {
      if (showShopDropdown && filteredShops[shopDropdownIdx]) {
        e.preventDefault();
        pickShop(filteredShops[shopDropdownIdx]);
      } else if (shopId) {
        e.preventDefault();
        dateRef.current?.focus();
      }
    }
    else if (e.key === 'Escape') setShowShopDropdown(false);
  };

  const handleVegSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setVegDropdownIdx((i) => Math.min(i + 1, filteredVegs.length - 1)); setShowVegDropdown(true); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setVegDropdownIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' || e.key === 'Tab') {
      if (vegDropdownIdx >= 0 && showVegDropdown && filteredVegs[vegDropdownIdx]) { e.preventDefault(); pickVeg(filteredVegs[vegDropdownIdx]); }
      else if (entryVegSearch.trim() === '') { e.preventDefault(); setShowVegDropdown(false); amountPaidRef.current?.focus(); }
    } else if (e.key === 'Escape') setShowVegDropdown(false);
  };

  const handleDescriptionKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); sackWeightRef.current?.focus(); }
  };

  const handleRateKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); vegSearchRef.current?.focus(); }
  };

  const handleSackWeightKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (entrySackWeight.trim() !== '') addSack();
      else commitItem();
    }
  };

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const previousBalance = shop?.pendingBalance ?? 0;
  const totalDue = subtotal + previousBalance;
  const paid = parseFloat(amountPaid) || 0;
  const newBalance = totalDue - paid;
  const entrySacksTotal = entrySacks.reduce((s, sk) => s + sk.weight, 0);

  const handleSave = async () => {
    const errs: string[] = [];
    if (!shopId) errs.push('Please select a shop.');
    if (items.length === 0) errs.push('Add at least one item.');
    const maxAllowedPaid = Math.max(0, totalDue);
    if (paid > maxAllowedPaid) {
      errs.push(`Amount paid (₹${fmtINR(paid)}) cannot exceed total due (₹${fmtINR(maxAllowedPaid)}).`);
    }
    if (errs.length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      const purchase = await addPurchase({
        shopId, shopName: shop!.name, date,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        items: items.map(({ _key, ...rest }) => rest),
        subtotal, previousBalance, totalDue, amountPaid: paid, newBalance,
      });
      updateShop(shopId, { pendingBalance: newBalance });
      router.push(`/purchases/${purchase.id}`);
    } finally { setSaving(false); }
  };

  if (saving || !mounted || !shopsLoaded || !vegsLoaded || !purchasesLoaded || !settingsLoaded) {
    return <div className="p-6 flex items-center justify-center min-h-64"><div className="text-gray-400 animate-pulse">Loading...</div></div>;
  }

  return (
    <div className="p-4 lg:p-8 space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/purchases" className="text-gray-400 hover:text-gray-600 p-1"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Purchase</h1>
          <p className="text-gray-500 text-sm">கொள்முதல் — Record what you bought from a shop</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
          {errors.map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{e}
            </div>
          ))}
        </div>
      )}

      {/* Shop & Date */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">1. Shop (கடை)</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                ref={shopInputRef} type="text" value={shopSearch}
                onChange={(e) => { setShopSearch(e.target.value); setShopId(''); setShowShopDropdown(true); setShopDropdownIdx(0); }}
                onFocus={() => setShowShopDropdown(true)}
                onBlur={() => setTimeout(() => setShowShopDropdown(false), 150)}
                onKeyDown={handleShopKey}
                placeholder="Type shop name, nickname or code..."
                className={clsx('w-full border rounded-lg px-3 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors',
                  shop ? 'border-orange-500 bg-orange-50' : 'border-gray-400')}
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {showShopDropdown && filteredShops.length > 0 && (
              <div ref={shopDropdownRef} className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {filteredShops.map((s, idx) => (
                  <button key={s.id} type="button" onMouseDown={() => pickShop(s)}
                    className={clsx('w-full text-left px-4 py-2.5 transition-colors border-b border-gray-50 last:border-0',
                      idx === shopDropdownIdx ? 'bg-orange-100 font-medium' : 'hover:bg-orange-50')}>
                    <div className="flex items-center gap-2">
                      {s.code && <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{s.code}</span>}
                      <span className="font-medium text-gray-900 text-sm">{s.name}</span>
                      {s.nickname && <span className="text-gray-500 text-xs">({s.nickname})</span>}
                    </div>
                    {s.phone && <div className="text-gray-400 text-xs">{s.phone}</div>}
                    {s.pendingBalance > 0 && <div className="text-red-500 text-xs">I owe: ₹{fmtINR(s.pendingBalance)}</div>}
                  </button>
                ))}
              </div>
            )}
            {filteredShops.length === 0 && shopSearch && (
              <div className="mt-1 text-xs text-gray-500">
                Shop not found. <Link href="/shops" className="text-orange-600 hover:underline">Add shop →</Link>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              ref={dateRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  rateRef.current?.focus();
                }
              }}
              className="w-full border border-gray-400 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors" />
          </div>
        </div>
        {shop && (
          <div className={clsx('rounded-lg px-4 py-3 flex items-center justify-between text-sm',
            previousBalance > 0 ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100')}>
            <span className={previousBalance > 0 ? 'text-red-700' : 'text-green-700'}>
              Previous balance owed to <strong>{shop.name}</strong>
            </span>
            <span className={clsx('font-bold flex items-center gap-0.5', previousBalance > 0 ? 'text-red-700' : 'text-green-700')}>
              <IndianRupee className="w-3.5 h-3.5" />
              {fmtINR(Math.abs(previousBalance), 2)}
              {previousBalance < 0 && ' (credit)'}
            </span>
          </div>
        )}
      </div>

      {/* Items */}
      <div
        ref={itemsSectionRef}
        onFocus={handleItemsFocus}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4"
      >
        <h2 className="font-semibold text-gray-900">2. Items (பொருட்கள்)</h2>

        {items.length > 0 && (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs">
                  <th className="text-left px-3 py-2 font-medium">Vegetable</th>
                  <th className="text-right px-3 py-2 font-medium">Rate/kg</th>
                  <th className="text-right px-3 py-2 font-medium">Sacks / Weight</th>
                  <th className="text-right px-3 py-2 font-medium">Amount</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item._key} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-900">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-extrabold text-gray-900 text-base">{item.vegetableName}</span>
                        {item.description && <span className="text-sm text-gray-500">{item.description}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-900 font-extrabold text-base">₹{fmtINR(item.pricePerKg, 2)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-900">
                      <div className="font-extrabold text-base">{item.totalWeight} kg</div>
                      <div className="text-xs text-gray-900 font-semibold">{item.sacks.length} மூடை ({item.sacks.map(s => s.weight).join(', ')})</div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-orange-700">₹{fmtINR(item.amount, 2)}</td>
                    <td className="px-2 py-2.5 text-right">
                      <button type="button" onClick={() => removeItem(item._key)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td colSpan={3} className="px-3 py-2 text-right font-semibold text-gray-700 text-sm">Today&apos;s Total</td>
                  <td className="px-3 py-2 text-right font-bold text-orange-700">₹{fmtINR(subtotal, 2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Entry row */}
        <div className="space-y-2">
          <p className="text-xs text-gray-400 hidden sm:flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" />
            Rate/kg → Search veg → Enter each sack weight → Empty Enter to add item
          </p>

          {/* Rate first */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">₹</span>
            <input ref={rateRef} type="number" min="0" step="0.5" value={entryRate}
              onChange={(e) => setEntryRate(e.target.value)} onKeyDown={handleRateKey}
              placeholder="Rate / kg"
              className="w-full border border-gray-400 rounded-lg pl-7 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors" />
          </div>

          {/* Veg search */}
          <div className="relative">
            <input
              ref={vegSearchRef} type="text" value={entryVegSearch}
              onChange={(e) => {
                setEntryVegSearch(e.target.value); setEntryVeg(null); setEntryDescription('');
                setEntrySacks([]); setShowVegDropdown(true); setVegDropdownIdx(e.target.value.trim() ? 0 : -1);
              }}
              onKeyDown={handleVegSearchKey}
              onFocus={() => setShowVegDropdown(true)}
              onBlur={() => setTimeout(() => setShowVegDropdown(false), 150)}
              placeholder="🥦 Search vegetable or type code number..."
              className={clsx('w-full border rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors',
                entryVeg ? 'border-orange-500 bg-orange-50' : 'border-gray-400')}
              autoComplete="off"
            />
            {entryVeg && (
              <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-[10px] font-medium text-gray-400 mb-0.5 ml-1">Custom Name / Description (Optional)</label>
                <input ref={descriptionRef} type="text" value={entryDescription}
                  onChange={(e) => setEntryDescription(e.target.value)} onKeyDown={handleDescriptionKey}
                  placeholder="Override vegetable name or add detail..."
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors" />
              </div>
            )}
            {showVegDropdown && filteredVegs.length > 0 && (
              <div ref={vegDropdownRef} className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                {filteredVegs.map((v, idx) => (
                  <button key={v.id} type="button" onMouseDown={() => pickVeg(v)}
                    className={clsx('w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 last:border-0 transition-colors flex items-center gap-2',
                      idx === vegDropdownIdx ? 'bg-blue-200 text-green-900 font-bold' : 'hover:bg-gray-50')}>
                    <div className="w-6 h-6 rounded-full bg-green-50 border border-green-200 flex items-center justify-center font-bold text-green-700 shrink-0 text-xs">
                      {v.code ?? '?'}
                    </div>
                    <span className="font-semibold text-gray-900">{v.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sack weight */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input ref={sackWeightRef} type="number" min="0" step="0.1" value={entrySackWeight}
                onChange={(e) => setEntrySackWeight(e.target.value)} onKeyDown={handleSackWeightKey}
                placeholder="Sack kg (Enter to add)"
                className={clsx('w-full border rounded-lg pl-9 pr-2 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors',
                  entrySacks.length > 0 ? 'border-orange-500 bg-orange-50' : 'border-gray-400')} />
            </div>
            <button type="button" onClick={commitItem}
              disabled={!entryVeg || !entryRate || entrySacks.length === 0}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
              <CornerDownLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>

          {entrySacks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-1">
              {entrySacks.map((sack, idx) => (
                <span key={sack.id} className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-2.5 py-1 rounded-full font-medium">
                  <Package className="w-3 h-3" />
                  மூடை {idx + 1}: {sack.weight} kg
                  <button type="button" onClick={() => removeSack(sack.id)} className="ml-0.5 hover:text-red-600 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <span className="inline-flex items-center text-xs text-gray-500 px-1">= {entrySacksTotal} kg</span>
            </div>
          )}

          {entryVeg && entryRate && entrySacks.length > 0 && (
            <div className="text-xs text-gray-500 px-1 flex items-center gap-1.5">
              <span className="text-orange-600 font-medium flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center font-bold text-green-700 text-[10px]">
                  {entryVeg.code}
                </span>
                {entryDescription || entryVeg.name}
              </span>
              — {entrySacks.length} மூடை ({entrySacksTotal} kg) × ₹{fmtINR(parseFloat(entryRate) || 0, 2)} =
              <span className="font-semibold text-gray-800">₹{fmtINR(entrySacksTotal * parseFloat(entryRate), 2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment */}
      <div
        ref={paymentSectionRef}
        onFocus={handlePaymentFocus}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4"
      >
        <h2 className="font-semibold text-gray-900">3. Payment (கட்டணம்)</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-700"><span>Today&apos;s Purchase Total</span><span className="font-semibold">₹{fmtINR(subtotal, 2)}</span></div>
          {previousBalance !== 0 && (
            <div className={clsx('flex justify-between', previousBalance > 0 ? 'text-red-600' : 'text-green-600')}>
              <span>முன் பாக்கி (Previous owed to shop)</span>
              <span className="font-semibold">{previousBalance > 0 ? '+' : '-'}₹{fmtINR(Math.abs(previousBalance), 2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 border-t pt-2 text-base"><span>நிகர பாக்கி (Total I owe)</span><span>₹{fmtINR(totalDue, 2)}</span></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">கட்டிய தொகை — Amount Paid to Shop (₹)</label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input ref={amountPaidRef} type="number" min="0" step="0.50" value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              placeholder="0.00"
              className="w-full border border-gray-400 rounded-lg pl-9 pr-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors" />
          </div>
          {totalDue > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              <button type="button" onClick={() => setAmountPaid(totalDue.toFixed(2))} className="text-xs border border-orange-200 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-50 transition-colors">Pay Full ₹{fmtINR(totalDue, 0)}</button>
              <button type="button" onClick={() => setAmountPaid(subtotal.toFixed(2))} className="text-xs border border-gray-200 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-50 transition-colors">Today only ₹{fmtINR(subtotal, 0)}</button>
              <button type="button" onClick={() => setAmountPaid('0')} className="text-xs border border-gray-200 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-50 transition-colors">No payment</button>
            </div>
          )}
        </div>
        <div className={clsx('rounded-xl p-4 flex items-center justify-between',
          newBalance > 0 ? 'bg-red-50 border border-red-100' : newBalance < 0 ? 'bg-blue-50 border border-blue-100' : 'bg-green-50 border border-green-100')}>
          <div>
            <div className="text-sm font-medium text-gray-700">{newBalance > 0 ? 'பாக்கி — Still Owed to Shop' : newBalance < 0 ? 'Shop owes me (Overpaid)' : 'Fully Settled'}</div>
            <div className="text-xs text-gray-400 mt-0.5">{newBalance > 0 ? 'You still owe this to the shop' : newBalance < 0 ? 'Shop has excess from you' : 'Nothing owed'}</div>
          </div>
          <div className={clsx('text-2xl font-bold flex items-center gap-0.5',
            newBalance > 0 ? 'text-red-600' : newBalance < 0 ? 'text-blue-600' : 'text-green-600')}>
            <IndianRupee className="w-5 h-5" />{fmtINR(Math.abs(newBalance), 2)}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pb-4">
        <Link href="/purchases" className="flex-1 sm:flex-none border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors text-center">Cancel</Link>
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-60">
          <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Purchase'}
        </button>
      </div>
    </div>
  );
}

export default function NewPurchasePage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center min-h-64"><div className="text-gray-400 animate-pulse">Loading...</div></div>}>
      <NewPurchaseForm />
    </Suspense>
  );
}
