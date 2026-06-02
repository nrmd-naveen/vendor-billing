'use client';

import { useState, useEffect, useCallback } from 'react';
import { Customer, Vegetable, Bill, Shop, Purchase, ShopPayment, Farmer, FarmerBill, FarmerPayment } from './types';

// ── Customers ────────────────────────────────────────────────────────────────

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/customers')
      .then((r) => r.json())
      .then((data) => { setCustomers(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const addCustomer = useCallback((data: Omit<Customer, 'id' | 'createdAt'>) => {
    const customer: Customer = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [...prev, customer]);
    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });
    return customer;
  }, []);

  const updateCustomer = useCallback((id: string, data: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    fetch(`/api/customers/${id}`, { method: 'DELETE' });
  }, []);

  const getCustomer = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers]
  );

  return { customers, addCustomer, updateCustomer, deleteCustomer, getCustomer, loaded };
}

// ── Vegetables ───────────────────────────────────────────────────────────────

export function useVegetables() {
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/vegetables')
      .then((r) => r.json())
      .then((data) => { setVegetables(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const addVegetable = useCallback((data: Omit<Vegetable, 'id'>) => {
    const vegetable: Vegetable = { ...data, id: crypto.randomUUID() };
    setVegetables((prev) => [...prev, vegetable]);
    fetch('/api/vegetables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vegetable),
    });
    return vegetable;
  }, []);

  const updateVegetable = useCallback((id: string, data: Partial<Vegetable>) => {
    setVegetables((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)));
    fetch(`/api/vegetables/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }, []);

  const deleteVegetable = useCallback((id: string) => {
    setVegetables((prev) => prev.filter((v) => v.id !== id));
    fetch(`/api/vegetables/${id}`, { method: 'DELETE' });
  }, []);

  return { vegetables, addVegetable, updateVegetable, deleteVegetable, loaded };
}

// ── Bills ────────────────────────────────────────────────────────────────────

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/bills')
      .then((r) => r.json())
      .then((data) => { setBills(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const addBill = useCallback(async (data: Omit<Bill, 'id' | 'billNumber' | 'createdAt'>) => {
    const payload = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const res = await fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const bill: Bill = await res.json();
    setBills((prev) => [bill, ...prev]);
    return bill;
  }, []);

  const deleteBill = useCallback((id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
    fetch(`/api/bills/${id}`, { method: 'DELETE' });
  }, []);

  const getBill = useCallback(
    (id: string) => bills.find((b) => b.id === id),
    [bills]
  );

  const getBillsByCustomer = useCallback(
    (customerId: string) => bills.filter((b) => b.customerId === customerId),
    [bills]
  );

  const updateBillFn = useCallback(async (id: string, data: Omit<Bill, 'id' | 'billNumber' | 'createdAt'>) => {
    const res = await fetch(`/api/bills/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated: Bill = await res.json();
    setBills((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  }, []);

  return { bills, addBill, updateBill: updateBillFn, deleteBill, getBill, getBillsByCustomer, loaded };
}

// ── Shops ─────────────────────────────────────────────────────────────────────

export function useShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/shops')
      .then((r) => r.json())
      .then((data) => { setShops(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const addShop = useCallback((data: Omit<Shop, 'id' | 'createdAt'>) => {
    const shop: Shop = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setShops((prev) => [...prev, shop]);
    fetch('/api/shops', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(shop) });
    return shop;
  }, []);

  const updateShop = useCallback((id: string, data: Partial<Shop>) => {
    setShops((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    fetch(`/api/shops/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  }, []);

  const deleteShop = useCallback((id: string) => {
    setShops((prev) => prev.filter((s) => s.id !== id));
    fetch(`/api/shops/${id}`, { method: 'DELETE' });
  }, []);

  const getShop = useCallback((id: string) => shops.find((s) => s.id === id), [shops]);

  return { shops, addShop, updateShop, deleteShop, getShop, loaded };
}

// ── Purchases ─────────────────────────────────────────────────────────────────

export function usePurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/purchases')
      .then((r) => r.json())
      .then((data) => { setPurchases(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const addPurchase = useCallback(async (data: Omit<Purchase, 'id' | 'purchaseNumber' | 'createdAt'>) => {
    const payload = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const res = await fetch('/api/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const purchase: Purchase = await res.json();
    setPurchases((prev) => [purchase, ...prev]);
    return purchase;
  }, []);

  const deletePurchase = useCallback((id: string) => {
    setPurchases((prev) => prev.filter((p) => p.id !== id));
    fetch(`/api/purchases/${id}`, { method: 'DELETE' });
  }, []);

  const getPurchase = useCallback((id: string) => purchases.find((p) => p.id === id), [purchases]);
  const getPurchasesByShop = useCallback((shopId: string) => purchases.filter((p) => p.shopId === shopId), [purchases]);

  const updatePurchaseFn = useCallback(async (id: string, data: Omit<Purchase, 'id' | 'purchaseNumber' | 'createdAt'>) => {
    const res = await fetch(`/api/purchases/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const updated: Purchase = await res.json();
    setPurchases((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, []);

  return { purchases, addPurchase, updatePurchase: updatePurchaseFn, deletePurchase, getPurchase, getPurchasesByShop, loaded };
}

// ── Shop Payments ─────────────────────────────────────────────────────────────

export function useShopPayments(shopId?: string) {
  const [payments, setPayments] = useState<ShopPayment[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const url = shopId ? `/api/shop-payments?shopId=${shopId}` : '/api/shop-payments';
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setPayments(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [shopId]);

  const addPayment = useCallback(async (data: Omit<ShopPayment, 'id' | 'createdAt'>) => {
    const payload: ShopPayment = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const res = await fetch('/api/shop-payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const payment: ShopPayment = await res.json();
    setPayments((prev) => [payment, ...prev]);
    return payment;
  }, []);

  return { payments, addPayment, loaded };
}

// ── Farmers ───────────────────────────────────────────────────────────────────

export function useFarmers() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/farmers')
      .then((r) => r.json())
      .then((data) => { setFarmers(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const addFarmer = useCallback((data: Omit<Farmer, 'id' | 'createdAt'>) => {
    const farmer: Farmer = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setFarmers((prev) => [...prev, farmer]);
    fetch('/api/farmers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(farmer) });
    return farmer;
  }, []);

  const updateFarmer = useCallback((id: string, data: Partial<Farmer>) => {
    setFarmers((prev) => prev.map((f) => (f.id === id ? { ...f, ...data } : f)));
    fetch(`/api/farmers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  }, []);

  const deleteFarmer = useCallback((id: string) => {
    setFarmers((prev) => prev.filter((f) => f.id !== id));
    fetch(`/api/farmers/${id}`, { method: 'DELETE' });
  }, []);

  const getFarmer = useCallback((id: string) => farmers.find((f) => f.id === id), [farmers]);

  return { farmers, addFarmer, updateFarmer, deleteFarmer, getFarmer, loaded };
}

// ── Farmer Bills ──────────────────────────────────────────────────────────────

export function useFarmerBills() {
  const [farmerBills, setFarmerBills] = useState<FarmerBill[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/farmer-bills')
      .then((r) => r.json())
      .then((data) => { setFarmerBills(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const addFarmerBill = useCallback(async (data: Omit<FarmerBill, 'id' | 'billNumber' | 'createdAt'>) => {
    const payload = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const res = await fetch('/api/farmer-bills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const bill: FarmerBill = await res.json();
    setFarmerBills((prev) => [bill, ...prev]);
    return bill;
  }, []);

  const deleteFarmerBill = useCallback((id: string) => {
    setFarmerBills((prev) => prev.filter((b) => b.id !== id));
    fetch(`/api/farmer-bills/${id}`, { method: 'DELETE' });
  }, []);

  const getFarmerBill = useCallback((id: string) => farmerBills.find((b) => b.id === id), [farmerBills]);
  const getFarmerBillsByFarmer = useCallback((farmerId: string) => farmerBills.filter((b) => b.farmerId === farmerId), [farmerBills]);

  const updateFarmerBillFn = useCallback(async (id: string, data: Omit<FarmerBill, 'id' | 'billNumber' | 'createdAt'>) => {
    const res = await fetch(`/api/farmer-bills/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const updated: FarmerBill = await res.json();
    setFarmerBills((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  }, []);

  return { farmerBills, addFarmerBill, updateFarmerBill: updateFarmerBillFn, deleteFarmerBill, getFarmerBill, getFarmerBillsByFarmer, loaded };
}

// ── Farmer Payments ───────────────────────────────────────────────────────────

export function useFarmerPayments(farmerId?: string) {
  const [payments, setPayments] = useState<FarmerPayment[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const url = farmerId ? `/api/farmer-payments?farmerId=${farmerId}` : '/api/farmer-payments';
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setPayments(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [farmerId]);

  const addPayment = useCallback(async (data: Omit<FarmerPayment, 'id' | 'createdAt'>) => {
    const payload: FarmerPayment = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const res = await fetch('/api/farmer-payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const payment: FarmerPayment = await res.json();
    setPayments((prev) => [payment, ...prev]);
    return payment;
  }, []);

  return { payments, addPayment, loaded };
}

// ── Composite ────────────────────────────────────────────────────────────────

export function useStore() {
  const customerStore = useCustomers();
  const vegetableStore = useVegetables();
  const billStore = useBills();

  return {
    ...customerStore,
    ...vegetableStore,
    ...billStore,
    loaded: customerStore.loaded && vegetableStore.loaded && billStore.loaded,
  };
}
