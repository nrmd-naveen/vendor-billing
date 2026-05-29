export interface Customer {
  id: string;
  name: string;
  phone?: string;
  nickname?: string;   // short display name for bill, e.g. "CM"
  code?: number;       // numeric code for quick lookup
  prefix?: string;     // திரு / திருமதி / செல்வி / செல்வன்
  pendingBalance: number;
  photo?: string;      // base64 image
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
  description?: string; // custom name/description for this item
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
  vadakai: number;
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
  useDefaultRates: boolean;
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
  useDefaultRates: true,
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

export interface Shop {
  id: string;
  name: string;
  phone?: string;
  code?: number;
  pendingBalance: number; // amount I owe to the shop
  createdAt: string;
}

export interface Purchase {
  id: string;
  purchaseNumber: number;
  shopId: string;
  shopName: string;
  date: string;
  items: BillItem[];
  subtotal: number;
  previousBalance: number; // what I owed before this purchase
  totalDue: number;        // subtotal + previousBalance
  amountPaid: number;      // amount paid to shop
  newBalance: number;      // what I still owe
  createdAt: string;
}

export interface ShopPayment {
  id: string;
  shopId: string;
  shopName: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
}

export interface Farmer {
  id: string;
  name: string;
  phone?: string;
  code?: number;
  pendingBalance: number; // amount I owe the farmer
  createdAt: string;
}

export interface FarmerBill {
  id: string;
  billNumber: number;
  farmerId: string;
  farmerName: string;
  date: string;
  items: BillItem[];
  subtotal: number;
  commissionRate: number;  // percentage, default 10
  commission: number;      // subtotal * commissionRate / 100
  coolie: number;
  vadakai: number;
  netAmount: number;       // subtotal - commission - coolie - vadakai
  previousBalance: number; // what I owed farmer before
  totalToPay: number;      // netAmount + previousBalance
  amountPaid: number;      // paid now
  newBalance: number;      // totalToPay - amountPaid
  createdAt: string;
}

export interface FarmerPayment {
  id: string;
  farmerId: string;
  farmerName: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
}
