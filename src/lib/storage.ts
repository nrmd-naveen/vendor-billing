'use client';

import { useState, useEffect, useCallback } from 'react';
import { Customer, Vegetable, Bill } from './types';
import { DEFAULT_VEGETABLES } from './defaults';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setValue(JSON.parse(stored));
      }
    } catch (e) {
      console.error(`Error reading localStorage key "${key}":`, e);
    }
    setLoaded(true);
  }, [key]);

  const set = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof newValue === 'function' ? (newValue as (p: T) => T)(prev) : newValue;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch (e) {
          console.error(`Error writing localStorage key "${key}":`, e);
        }
        return next;
      });
    },
    [key]
  );

  return [value, set, loaded] as const;
}

export function useCustomers() {
  const [customers, setCustomers, loaded] = useLocalStorage<Customer[]>('chark_customers', []);

  const addCustomer = useCallback(
    (data: Omit<Customer, 'id' | 'createdAt'>) => {
      const customer: Customer = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setCustomers((prev) => [...prev, customer]);
      return customer;
    },
    [setCustomers]
  );

  const updateCustomer = useCallback(
    (id: string, data: Partial<Customer>) => {
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      );
    },
    [setCustomers]
  );

  const deleteCustomer = useCallback(
    (id: string) => {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    },
    [setCustomers]
  );

  const getCustomer = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers]
  );

  return { customers, addCustomer, updateCustomer, deleteCustomer, getCustomer, loaded };
}

export function useVegetables() {
  const [vegetables, setVegetables, loaded] = useLocalStorage<Vegetable[]>(
    'chark_vegetables',
    DEFAULT_VEGETABLES
  );

  useEffect(() => {
    if (loaded) {
      const stored = localStorage.getItem('chark_vegetables');
      if (!stored) {
        localStorage.setItem('chark_vegetables', JSON.stringify(DEFAULT_VEGETABLES));
      }
    }
  }, [loaded]);

  const addVegetable = useCallback(
    (data: Omit<Vegetable, 'id'>) => {
      const vegetable: Vegetable = {
        ...data,
        id: crypto.randomUUID(),
      };
      setVegetables((prev) => [...prev, vegetable]);
      return vegetable;
    },
    [setVegetables]
  );

  const updateVegetable = useCallback(
    (id: string, data: Partial<Vegetable>) => {
      setVegetables((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...data } : v))
      );
    },
    [setVegetables]
  );

  const deleteVegetable = useCallback(
    (id: string) => {
      setVegetables((prev) => prev.filter((v) => v.id !== id));
    },
    [setVegetables]
  );

  return { vegetables, addVegetable, updateVegetable, deleteVegetable, loaded };
}

export function useBills() {
  const [bills, setBills, loaded] = useLocalStorage<Bill[]>('chark_bills', []);
  const [billCounter, setBillCounter, counterLoaded] = useLocalStorage<number>('chark_bill_counter', 1000);

  const addBill = useCallback(
    (data: Omit<Bill, 'id' | 'billNumber' | 'createdAt'>) => {
      const billNumber = billCounter + 1;
      setBillCounter(billNumber);
      const bill: Bill = {
        ...data,
        id: crypto.randomUUID(),
        billNumber,
        createdAt: new Date().toISOString(),
      };
      setBills((prev) => [...prev, bill]);
      return bill;
    },
    [billCounter, setBillCounter, setBills]
  );

  const deleteBill = useCallback(
    (id: string) => {
      setBills((prev) => prev.filter((b) => b.id !== id));
    },
    [setBills]
  );

  const getBill = useCallback(
    (id: string) => bills.find((b) => b.id === id),
    [bills]
  );

  const getBillsByCustomer = useCallback(
    (customerId: string) => bills.filter((b) => b.customerId === customerId),
    [bills]
  );

  return { bills, addBill, deleteBill, getBill, getBillsByCustomer, loaded: loaded && counterLoaded };
}

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
