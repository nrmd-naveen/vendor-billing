export interface Customer {
  id: string;
  name: string;
  phone?: string;
  pendingBalance: number;
  createdAt: string;
}

export interface Vegetable {
  id: string;
  name: string;
  emoji: string;
  defaultPrice: number;
}

export interface BillItem {
  vegetableId: string;
  vegetableName: string;
  emoji: string;
  pricePerKg: number;
  weight: number; // in kg
  amount: number;
}

export interface Bill {
  id: string;
  billNumber: number;
  customerId: string;
  customerName: string;
  date: string;
  items: BillItem[];
  subtotal: number;
  previousBalance: number;
  totalDue: number;
  amountPaid: number;
  newBalance: number;
  createdAt: string;
}
