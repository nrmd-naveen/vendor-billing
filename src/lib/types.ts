export interface Customer {
  id: string;
  name: string;
  phone?: string;
  nickname?: string;   // short display name for bill, e.g. "CM"
  code?: number;       // numeric code for quick lookup
  prefix?: string;     // திரு / திருமதி / செல்வி / செல்வன்
  pendingBalance: number;
  createdAt: string;
}

export interface Vegetable {
  id: string;
  name: string;
  englishName: string;
  nicknames: string[];
  emoji: string;
  defaultPrice: number;
  code?: number;       // numeric code for quick entry (e.g. 1, 2, 3...)
}

export interface Sack {
  id: string;
  weight: number; // in kg
}

export interface BillItem {
  vegetableId: string;
  vegetableName: string;
  emoji: string;
  pricePerKg: number;
  sacks: Sack[];
  totalWeight: number;
  amount: number;
}

export interface Bill {
  id: string;
  billNumber: number;
  customerId: string;
  customerName: string;
  customerNickname?: string;
  customerPrefix?: string;
  date: string;
  items: BillItem[];
  subtotal: number;
  coolie: number;
  previousBalance: number;
  totalDue: number;
  amountPaid: number;
  newBalance: number;
  createdAt: string;
}

export interface CompanySettings {
  tagline: string;
  name: string;
  subtitle: string;
  address: string;
  contact1Name: string;
  contact1Phone: string;
  contact2Name: string;
  contact2Phone: string;
  billTitle: string;
  logoLeft: string;  // base64 data URL
  logoRight: string; // base64 data URL
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  tagline: '',
  name: 'Kaikari Kadai',
  subtitle: 'Vegetable Order Supplier',
  address: '',
  contact1Name: '',
  contact1Phone: '',
  contact2Name: '',
  contact2Phone: '',
  billTitle: 'விற்பனை பில்',
  logoLeft: '',
  logoRight: '',
};

export const CUSTOMER_PREFIXES = ['திரு', 'திருமதி', 'செல்வி', 'செல்வன்', ''];

export interface Collection {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
}
