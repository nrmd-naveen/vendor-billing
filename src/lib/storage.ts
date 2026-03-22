'use client';

import { useState, useEffect, useCallback } from 'react';
import { Customer, Vegetable, Bill } from './types';

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
