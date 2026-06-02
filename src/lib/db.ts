import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { DEFAULT_VEGETABLES } from './defaults';
import { DEFAULT_COMPANY_SETTINGS } from './types';
import type { Customer, Vegetable, Bill, BillItem, Sack, CompanySettings, Collection, Shop, Purchase, ShopPayment, Farmer, FarmerBill, FarmerPayment } from './types';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'database.db');

let _db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH);
    _db.exec('PRAGMA journal_mode = WAL');
    _db.exec('PRAGMA foreign_keys = ON');
    initDb(_db);
  }
  return _db;
}

export function getDbPath(): string {
  return DB_PATH;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

export function checkpointWal(): void {
  if (_db) {
    try { _db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); } catch { /* ignore */ }
  }
}

export interface DbStats {
  customers: number;
  bills: number;
  vegetables: number;
  collections: number;
  shops: number;
  purchases: number;
  dateRange: { from: string; to: string } | null;
}

export function getDbStats(): DbStats {
  const db = getDb();
  const c = (sql: string) => { try { return (db.prepare(sql).get() as unknown as { c: number }).c; } catch { return 0; } };
  const customers = c('SELECT COUNT(*) as c FROM customers');
  const bills = c('SELECT COUNT(*) as c FROM bills');
  const vegetables = c('SELECT COUNT(*) as c FROM vegetables');
  const collections = c('SELECT COUNT(*) as c FROM collections');
  const shops = c('SELECT COUNT(*) as c FROM shops');
  const purchases = c('SELECT COUNT(*) as c FROM purchases');
  let dateRange: DbStats['dateRange'] = null;
  if (bills > 0) {
    const r = db.prepare('SELECT MIN(date) as f, MAX(date) as t FROM bills').get() as unknown as { f: string; t: string };
    if (r.f) dateRange = { from: r.f, to: r.t };
  }
  return { customers, bills, vegetables, collections, shops, purchases, dateRange };
}

function txn(db: DatabaseSync, fn: () => void): void {
  db.exec('BEGIN');
  try {
    fn();
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

function initDb(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      nickname TEXT DEFAULT '',
      code INTEGER,
      prefix TEXT DEFAULT 'திரு',
      pending_balance REAL DEFAULT 0,
      photo TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vegetables (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      english_name TEXT DEFAULT '',
      nicknames TEXT DEFAULT '[]',
      emoji TEXT DEFAULT '',
      default_price REAL DEFAULT 0,
      code INTEGER
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      bill_number INTEGER NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_nickname TEXT DEFAULT '',
      customer_prefix TEXT DEFAULT 'திரு',
      date TEXT NOT NULL,
      subtotal REAL DEFAULT 0,
      coolie REAL DEFAULT 0,
      previous_balance REAL DEFAULT 0,
      total_due REAL DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      new_balance REAL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bill_items (
      id TEXT PRIMARY KEY,
      bill_id TEXT NOT NULL,
      vegetable_id TEXT NOT NULL,
      vegetable_name TEXT NOT NULL,
      description TEXT,
      emoji TEXT DEFAULT '',
      price_per_kg REAL NOT NULL,
      total_weight REAL NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bill_sacks (
      id TEXT PRIMARY KEY,
      bill_item_id TEXT NOT NULL,
      weight REAL NOT NULL,
      FOREIGN KEY (bill_item_id) REFERENCES bill_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES ('bill_counter', '1000');

    CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      code INTEGER,
      pending_balance REAL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      purchase_number INTEGER NOT NULL,
      shop_id TEXT NOT NULL,
      shop_name TEXT NOT NULL,
      date TEXT NOT NULL,
      subtotal REAL DEFAULT 0,
      previous_balance REAL DEFAULT 0,
      total_due REAL DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      new_balance REAL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      purchase_id TEXT NOT NULL,
      vegetable_id TEXT NOT NULL,
      vegetable_name TEXT NOT NULL,
      description TEXT,
      emoji TEXT DEFAULT '',
      price_per_kg REAL NOT NULL,
      total_weight REAL NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS purchase_sacks (
      id TEXT PRIMARY KEY,
      purchase_item_id TEXT NOT NULL,
      weight REAL NOT NULL,
      FOREIGN KEY (purchase_item_id) REFERENCES purchase_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shop_payments (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL,
      shop_name TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES ('purchase_counter', '1000');

    CREATE TABLE IF NOT EXISTS farmers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      code INTEGER,
      pending_balance REAL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS farmer_bills (
      id TEXT PRIMARY KEY,
      bill_number INTEGER NOT NULL,
      farmer_id TEXT NOT NULL,
      farmer_name TEXT NOT NULL,
      date TEXT NOT NULL,
      subtotal REAL DEFAULT 0,
      commission_rate REAL DEFAULT 10,
      commission REAL DEFAULT 0,
      coolie REAL DEFAULT 0,
      vadakai REAL DEFAULT 0,
      net_amount REAL DEFAULT 0,
      previous_balance REAL DEFAULT 0,
      total_to_pay REAL DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      new_balance REAL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS farmer_bill_items (
      id TEXT PRIMARY KEY,
      farmer_bill_id TEXT NOT NULL,
      vegetable_id TEXT NOT NULL,
      vegetable_name TEXT NOT NULL,
      description TEXT,
      emoji TEXT DEFAULT '',
      price_per_kg REAL NOT NULL,
      total_weight REAL NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (farmer_bill_id) REFERENCES farmer_bills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS farmer_bill_sacks (
      id TEXT PRIMARY KEY,
      farmer_bill_item_id TEXT NOT NULL,
      weight REAL NOT NULL,
      FOREIGN KEY (farmer_bill_item_id) REFERENCES farmer_bill_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS farmer_payments (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL,
      farmer_name TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES ('farmer_bill_counter', '2000');
  `);

  runMigrations(db);

  const settingsKeys = Object.keys(SETTINGS_MAP);
  for (const key of settingsKeys) {
    const val = SETTINGS_DEFAULTS[key];
    if (val !== undefined) {
      db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run(key, val);
    }
  }

  const count = db.prepare('SELECT COUNT(*) as c FROM vegetables').get() as unknown as { c: number };
  if (count.c === 0) {
    const insert = db.prepare(
      'INSERT INTO vegetables (id, name, english_name, nicknames, emoji, default_price) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const veg of DEFAULT_VEGETABLES) {
      insert.run(veg.id, veg.name, veg.englishName, JSON.stringify(veg.nicknames), veg.emoji, veg.defaultPrice);
    }
  }
}

function runMigrations(db: DatabaseSync) {
  const custCols = (db.prepare('PRAGMA table_info(customers)').all() as unknown as { name: string }[]).map(c => c.name);
  if (!custCols.includes('nickname')) db.exec("ALTER TABLE customers ADD COLUMN nickname TEXT DEFAULT ''");
  if (!custCols.includes('code')) db.exec('ALTER TABLE customers ADD COLUMN code INTEGER');
  if (!custCols.includes('prefix')) db.exec("ALTER TABLE customers ADD COLUMN prefix TEXT DEFAULT 'திரு'");
  if (!custCols.includes('photo')) db.exec('ALTER TABLE customers ADD COLUMN photo TEXT');

  const vegCols = (db.prepare('PRAGMA table_info(vegetables)').all() as unknown as { name: string }[]).map(c => c.name);
  if (!vegCols.includes('code')) db.exec('ALTER TABLE vegetables ADD COLUMN code INTEGER');

  const billCols = (db.prepare('PRAGMA table_info(bills)').all() as unknown as { name: string }[]).map(c => c.name);
  if (!billCols.includes('customer_nickname')) db.exec("ALTER TABLE bills ADD COLUMN customer_nickname TEXT DEFAULT ''");
  if (!billCols.includes('customer_prefix')) db.exec("ALTER TABLE bills ADD COLUMN customer_prefix TEXT DEFAULT 'திரு'");
  if (!billCols.includes('coolie')) db.exec('ALTER TABLE bills ADD COLUMN coolie REAL DEFAULT 0');
  if (!billCols.includes('vadakai')) db.exec('ALTER TABLE bills ADD COLUMN vadakai REAL DEFAULT 0');

  const billItemCols = (db.prepare('PRAGMA table_info(bill_items)').all() as unknown as { name: string }[]).map(c => c.name);
  if (!billItemCols.includes('description')) db.exec('ALTER TABLE bill_items ADD COLUMN description TEXT');

  const shopPayCols = (db.prepare('PRAGMA table_info(shop_payments)').all() as unknown as { name: string }[]).map(c => c.name);
  if (!shopPayCols.includes('discount')) db.exec('ALTER TABLE shop_payments ADD COLUMN discount REAL');

  const shopCols = (db.prepare('PRAGMA table_info(shops)').all() as unknown as { name: string }[]).map(c => c.name);
  if (!shopCols.includes('nickname')) db.exec('ALTER TABLE shops ADD COLUMN nickname TEXT');
}

// ── Company settings ─────────────────────────────────────────────────────────

const SETTINGS_MAP: Record<keyof CompanySettings, string> = {
  tagline: 'company_tagline',
  name: 'company_name',
  subtitle: 'company_subtitle',
  address: 'company_address',
  contact1Name: 'contact1_name',
  contact1Phone: 'contact1_phone',
  contact2Name: 'contact2_name',
  contact2Phone: 'contact2_phone',
  billTitle: 'bill_title',
  logoLeft: 'logo_left',
  logoRight: 'logo_right',
  useDefaultRates: 'use_default_rates',
};

const SETTINGS_DEFAULTS: Record<string, string> = {
  company_tagline: DEFAULT_COMPANY_SETTINGS.tagline,
  company_name: DEFAULT_COMPANY_SETTINGS.name,
  company_subtitle: DEFAULT_COMPANY_SETTINGS.subtitle,
  company_address: DEFAULT_COMPANY_SETTINGS.address,
  contact1_name: DEFAULT_COMPANY_SETTINGS.contact1Name,
  contact1_phone: DEFAULT_COMPANY_SETTINGS.contact1Phone,
  contact2_name: DEFAULT_COMPANY_SETTINGS.contact2Name,
  contact2_phone: DEFAULT_COMPANY_SETTINGS.contact2Phone,
  bill_title: DEFAULT_COMPANY_SETTINGS.billTitle,
  logo_left: DEFAULT_COMPANY_SETTINGS.logoLeft,
  logo_right: DEFAULT_COMPANY_SETTINGS.logoRight,
  use_default_rates: String(DEFAULT_COMPANY_SETTINGS.useDefaultRates),
};

export function getCompanySettings(): CompanySettings {
  const db = getDb();
  const dbKeys = Object.values(SETTINGS_MAP);
  const rows = db.prepare(`SELECT key, value FROM settings WHERE key IN (${dbKeys.map(() => '?').join(',')})`)
    .all(...dbKeys) as unknown as { key: string; value: string }[];

  const map: Record<string, string> = { ...SETTINGS_DEFAULTS };
  for (const row of rows) map[row.key] = row.value;

  return {
    tagline: map.company_tagline,
    name: map.company_name,
    subtitle: map.company_subtitle,
    address: map.company_address,
    contact1Name: map.contact1_name,
    contact1Phone: map.contact1_phone,
    contact2Name: map.contact2_name,
    contact2Phone: map.contact2_phone,
    billTitle: map.bill_title,
    logoLeft: map.logo_left,
    logoRight: map.logo_right,
    useDefaultRates: map.use_default_rates !== 'false',
  };
}

export function saveCompanySettings(s: CompanySettings): void {
  const db = getDb();
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  txn(db, () => {
    for (const [field, dbKey] of Object.entries(SETTINGS_MAP)) {
      upsert.run(dbKey, String((s as unknown as Record<string, unknown>)[field] ?? ''));
    }
  });
}

// ── DB row types ──────────────────────────────────────────────────────────────

interface DBCustomer {
  id: string; name: string; phone: string | null;
  nickname: string | null; code: number | null; prefix: string | null;
  pending_balance: number; photo: string | null; created_at: string;
}

interface DBVegetable {
  id: string; name: string; english_name: string; nicknames: string;
  emoji: string; default_price: number; code: number | null;
}

interface DBBill {
  id: string; bill_number: number; customer_id: string; customer_name: string;
  customer_nickname: string | null; customer_prefix: string | null;
  date: string; subtotal: number; coolie: number; vadakai: number;
  previous_balance: number; total_due: number; amount_paid: number;
  new_balance: number; created_at: string;
}

interface DBBillItem {
  id: string; bill_id: string; vegetable_id: string; vegetable_name: string;
  description: string | null;
  emoji: string; price_per_kg: number; total_weight: number; amount: number;
}

interface DBSack { id: string; bill_item_id: string; weight: number; }

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapCustomer(row: DBCustomer): Customer {
  return {
    id: row.id, name: row.name,
    phone: row.phone ?? undefined,
    nickname: row.nickname || undefined,
    code: row.code ?? undefined,
    prefix: row.prefix || 'திரு',
    pendingBalance: row.pending_balance,
    photo: row.photo || undefined,
    createdAt: row.created_at,
  };
}

function mapVegetable(row: DBVegetable): Vegetable {
  return {
    id: row.id, name: row.name, englishName: row.english_name,
    nicknames: JSON.parse(row.nicknames || '[]'),
    emoji: row.emoji, defaultPrice: row.default_price,
    code: row.code ?? undefined,
  };
}

function assembleBills(bills: DBBill[], items: DBBillItem[], sacks: DBSack[]): Bill[] {
  const sacksMap = new Map<string, Sack[]>();
  for (const s of sacks) {
    if (!sacksMap.has(s.bill_item_id)) sacksMap.set(s.bill_item_id, []);
    sacksMap.get(s.bill_item_id)!.push({ id: s.id, weight: s.weight });
  }
  const itemsMap = new Map<string, BillItem[]>();
  for (const item of items) {
    if (!itemsMap.has(item.bill_id)) itemsMap.set(item.bill_id, []);
    itemsMap.get(item.bill_id)!.push({
      vegetableId: item.vegetable_id, vegetableName: item.vegetable_name,
      description: item.description || undefined,
      emoji: item.emoji, pricePerKg: item.price_per_kg,
      totalWeight: item.total_weight, amount: item.amount,
      sacks: sacksMap.get(item.id) || [],
    });
  }
  return bills.map((b) => ({
    id: b.id, billNumber: b.bill_number,
    customerId: b.customer_id, customerName: b.customer_name,
    customerNickname: b.customer_nickname || undefined,
    customerPrefix: b.customer_prefix || 'திரு',
    date: b.date, subtotal: b.subtotal, coolie: b.coolie || 0, vadakai: b.vadakai || 0,
    previousBalance: b.previous_balance, totalDue: b.total_due,
    amountPaid: b.amount_paid, newBalance: b.new_balance,
    createdAt: b.created_at, items: itemsMap.get(b.id) || [],
  }));
}

// ── Customer CRUD ─────────────────────────────────────────────────────────────

export function getAllCustomers(): Customer[] {
  const db = getDb();
  return (db.prepare('SELECT * FROM customers ORDER BY name').all() as unknown as DBCustomer[]).map(mapCustomer);
}

export function createCustomer(c: Customer): Customer {
  const db = getDb();
  db.prepare(
    'INSERT INTO customers (id, name, phone, nickname, code, prefix, pending_balance, photo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(c.id, c.name, c.phone ?? null, c.nickname ?? '', c.code ?? null, c.prefix ?? 'திரு', c.pendingBalance, c.photo ?? null, c.createdAt);
  return c;
}

export function updateCustomer(id: string, data: Partial<Customer>): void {
  const db = getDb();
  const map: Record<string, string | number | null | undefined> = {};

  if (data.name !== undefined) map.name = data.name;
  if ('phone' in data) map.phone = data.phone ?? null;
  if ('nickname' in data) map.nickname = data.nickname ?? null;
  if ('code' in data) map.code = data.code ?? null;
  if ('prefix' in data) map.prefix = data.prefix ?? null;
  if (data.pendingBalance !== undefined) map.pending_balance = data.pendingBalance;
  if ('photo' in data) map.photo = data.photo ?? null;

  for (const [col, val] of Object.entries(map)) {
    if (val !== undefined) db.prepare(`UPDATE customers SET ${col} = ? WHERE id = ?`).run(val, id);
  }
}

export function getCustomerById(id: string): Customer | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as unknown as DBCustomer | undefined;
  return row ? mapCustomer(row) : null;
}

export function deleteCustomer(id: string): void {
  getDb().prepare('DELETE FROM customers WHERE id = ?').run(id);
}

// ── Vegetable CRUD ────────────────────────────────────────────────────────────

export function getAllVegetables(): Vegetable[] {
  const db = getDb();
  return (db.prepare('SELECT * FROM vegetables ORDER BY COALESCE(code, 9999), name').all() as unknown as DBVegetable[]).map(mapVegetable);
}

export function createVegetable(veg: Vegetable): Vegetable {
  const db = getDb();
  db.prepare(
    'INSERT INTO vegetables (id, name, english_name, nicknames, emoji, default_price, code) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(veg.id, veg.name, veg.englishName, JSON.stringify(veg.nicknames), veg.emoji, veg.defaultPrice, veg.code ?? null);
  return veg;
}

export function updateVegetable(id: string, data: Partial<Vegetable>): void {
  const db = getDb();
  const map: Record<string, string | number | null | undefined> = {
    name: data.name, english_name: data.englishName,
    nicknames: data.nicknames !== undefined ? JSON.stringify(data.nicknames) : undefined,
    emoji: data.emoji, default_price: data.defaultPrice, code: data.code ?? null,
  };
  for (const [col, val] of Object.entries(map)) {
    if (val !== undefined) db.prepare(`UPDATE vegetables SET ${col} = ? WHERE id = ?`).run(val, id);
  }
}

export function deleteVegetable(id: string): void {
  getDb().prepare('DELETE FROM vegetables WHERE id = ?').run(id);
}

// ── Bill CRUD ─────────────────────────────────────────────────────────────────

export function getAllBills(): Bill[] {
  const db = getDb();
  const bills = db.prepare('SELECT * FROM bills ORDER BY created_at DESC').all() as unknown as DBBill[];
  const items = db.prepare('SELECT * FROM bill_items').all() as unknown as DBBillItem[];
  const sacks = db.prepare('SELECT * FROM bill_sacks').all() as unknown as DBSack[];
  return assembleBills(bills, items, sacks);
}

export function getBillById(id: string): Bill | null {
  const db = getDb();
  const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id) as unknown as DBBill | undefined;
  if (!bill) return null;
  const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(id) as unknown as DBBillItem[];
  const itemIds = items.map((i) => i.id);
  const sacks = itemIds.length
    ? (db.prepare(`SELECT * FROM bill_sacks WHERE bill_item_id IN (${itemIds.map(() => '?').join(',')})`)
        .all(...itemIds) as unknown as DBSack[])
    : [];
  return assembleBills([bill], items, sacks)[0];
}

export function createBill(data: Omit<Bill, 'billNumber'> & { billNumber?: number }): Bill {
  const db = getDb();
  const counter = db.prepare('SELECT value FROM settings WHERE key = ?').get('bill_counter') as unknown as { value: string };
  const billNumber = parseInt(counter.value) + 1;
  db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(String(billNumber), 'bill_counter');

  const bill: Bill = { ...(data as Bill), billNumber };

  const insertBill = db.prepare(
    `INSERT INTO bills (id, bill_number, customer_id, customer_name, customer_nickname, customer_prefix, date, subtotal, coolie, vadakai, previous_balance, total_due, amount_paid, new_balance, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertItem = db.prepare(
    `INSERT INTO bill_items (id, bill_id, vegetable_id, vegetable_name, description, emoji, price_per_kg, total_weight, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertSack = db.prepare('INSERT INTO bill_sacks (id, bill_item_id, weight) VALUES (?, ?, ?)');

  txn(db, () => {
    insertBill.run(
      bill.id, bill.billNumber, bill.customerId, bill.customerName,
      bill.customerNickname ?? '', bill.customerPrefix ?? 'திரு',
      bill.date, bill.subtotal, bill.coolie, bill.vadakai ?? 0, bill.previousBalance,
      bill.totalDue, bill.amountPaid, bill.newBalance, bill.createdAt
    );
    for (const item of bill.items) {
      const itemId = crypto.randomUUID();
      insertItem.run(itemId, bill.id, item.vegetableId, item.vegetableName, item.description ?? null, item.emoji, item.pricePerKg, item.totalWeight, item.amount);
      for (const sack of item.sacks) insertSack.run(sack.id, itemId, sack.weight);
    }
  });

  return bill;
}

export function deleteBill(id: string): void {
  getDb().prepare('DELETE FROM bills WHERE id = ?').run(id);
}

export function updateBill(id: string, data: Omit<Bill, 'id' | 'billNumber' | 'createdAt'>): Bill | null {
  const db = getDb();
  const existing = getBillById(id);
  if (!existing) return null;

  const updated: Bill = { ...existing, ...data };

  const insertItem = db.prepare(
    `INSERT INTO bill_items (id, bill_id, vegetable_id, vegetable_name, description, emoji, price_per_kg, total_weight, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertSack = db.prepare('INSERT INTO bill_sacks (id, bill_item_id, weight) VALUES (?, ?, ?)');

  txn(db, () => {
    db.prepare('DELETE FROM bill_items WHERE bill_id = ?').run(id);

    db.prepare(`
      UPDATE bills SET
        customer_id = ?, customer_name = ?, customer_nickname = ?, customer_prefix = ?,
        date = ?, subtotal = ?, coolie = ?, vadakai = ?,
        previous_balance = ?, total_due = ?, amount_paid = ?, new_balance = ?
      WHERE id = ?
    `).run(
      updated.customerId, updated.customerName, updated.customerNickname ?? '',
      updated.customerPrefix ?? 'திரு', updated.date,
      updated.subtotal, updated.coolie, updated.vadakai ?? 0,
      updated.previousBalance, updated.totalDue, updated.amountPaid, updated.newBalance,
      id
    );

    for (const item of updated.items) {
      const itemId = crypto.randomUUID();
      insertItem.run(itemId, id, item.vegetableId, item.vegetableName, item.description ?? null, item.emoji, item.pricePerKg, item.totalWeight, item.amount);
      for (const sack of item.sacks) insertSack.run(sack.id, itemId, sack.weight);
    }
  });

  return getBillById(id);
}


// ── Collections CRUD ──────────────────────────────────────────────────────────

interface DBCollection {
  id: string; customer_id: string; customer_name: string;
  amount: number; date: string; note: string; created_at: string;
}

function mapCollection(row: DBCollection): Collection {
  return {
    id: row.id, customerId: row.customer_id, customerName: row.customer_name,
    amount: row.amount, date: row.date, note: row.note || '', createdAt: row.created_at,
  };
}

export function createCollection(c: Collection): Collection {
  const db = getDb();
  db.prepare(
    'INSERT INTO collections (id, customer_id, customer_name, amount, date, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(c.id, c.customerId, c.customerName, c.amount, c.date, c.note || '', c.createdAt);
  return c;
}

export function getCollectionsByCustomer(customerId: string): Collection[] {
  const db = getDb();
  return (db.prepare('SELECT * FROM collections WHERE customer_id = ? ORDER BY created_at DESC').all(customerId) as unknown as DBCollection[]).map(mapCollection);
}

export function getAllCollections(): Collection[] {
  const db = getDb();
  return (db.prepare('SELECT * FROM collections ORDER BY created_at DESC').all() as unknown as DBCollection[]).map(mapCollection);
}

export function updateCollectionAmount(id: string, newAmount: number): Collection | null {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM collections WHERE id = ?').get(id) as unknown as DBCollection | undefined;
  if (!existing) return null;
  const diff = newAmount - existing.amount;
  txn(db, () => {
    db.prepare('UPDATE collections SET amount = ? WHERE id = ?').run(newAmount, id);
    if (diff !== 0) {
      db.prepare('UPDATE customers SET pending_balance = pending_balance - ? WHERE id = ?').run(diff, existing.customer_id);
    }
  });
  const updated = db.prepare('SELECT * FROM collections WHERE id = ?').get(id) as unknown as DBCollection;
  return mapCollection(updated);
}

// ── Shop CRUD ─────────────────────────────────────────────────────────────────

interface DBShop {
  id: string; name: string; nickname: string | null; phone: string | null;
  code: number | null; pending_balance: number; created_at: string;
}

function mapShop(row: DBShop): Shop {
  return {
    id: row.id, name: row.name,
    nickname: row.nickname ?? undefined,
    phone: row.phone ?? undefined,
    code: row.code ?? undefined,
    pendingBalance: row.pending_balance,
    createdAt: row.created_at,
  };
}

export function getAllShops(): Shop[] {
  const db = getDb();
  return (db.prepare('SELECT * FROM shops ORDER BY name').all() as unknown as DBShop[]).map(mapShop);
}

export function getShopById(id: string): Shop | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM shops WHERE id = ?').get(id) as unknown as DBShop | undefined;
  return row ? mapShop(row) : null;
}

export function createShop(s: Shop): Shop {
  const db = getDb();
  db.prepare(
    'INSERT INTO shops (id, name, nickname, phone, code, pending_balance, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(s.id, s.name, s.nickname ?? null, s.phone ?? null, s.code ?? null, s.pendingBalance, s.createdAt);
  return s;
}

export function updateShop(id: string, data: Partial<Shop>): void {
  const db = getDb();
  const map: Record<string, string | number | null | undefined> = {};
  if (data.name !== undefined) map.name = data.name;
  if ('nickname' in data) map.nickname = data.nickname ?? null;
  if ('phone' in data) map.phone = data.phone ?? null;
  if ('code' in data) map.code = data.code ?? null;
  if (data.pendingBalance !== undefined) map.pending_balance = data.pendingBalance;
  for (const [col, val] of Object.entries(map)) {
    if (val !== undefined) db.prepare(`UPDATE shops SET ${col} = ? WHERE id = ?`).run(val, id);
  }
}

export function deleteShop(id: string): void {
  getDb().prepare('DELETE FROM shops WHERE id = ?').run(id);
}

// ── Purchase CRUD ─────────────────────────────────────────────────────────────

interface DBPurchase {
  id: string; purchase_number: number; shop_id: string; shop_name: string;
  date: string; subtotal: number; previous_balance: number;
  total_due: number; amount_paid: number; new_balance: number; created_at: string;
}

interface DBPurchaseItem {
  id: string; purchase_id: string; vegetable_id: string; vegetable_name: string;
  description: string | null; emoji: string; price_per_kg: number;
  total_weight: number; amount: number;
}

interface DBPurchaseSack { id: string; purchase_item_id: string; weight: number; }

function assemblePurchases(purchases: DBPurchase[], items: DBPurchaseItem[], sacks: DBPurchaseSack[]): Purchase[] {
  const sacksMap = new Map<string, Sack[]>();
  for (const s of sacks) {
    if (!sacksMap.has(s.purchase_item_id)) sacksMap.set(s.purchase_item_id, []);
    sacksMap.get(s.purchase_item_id)!.push({ id: s.id, weight: s.weight });
  }
  const itemsMap = new Map<string, BillItem[]>();
  for (const item of items) {
    if (!itemsMap.has(item.purchase_id)) itemsMap.set(item.purchase_id, []);
    itemsMap.get(item.purchase_id)!.push({
      vegetableId: item.vegetable_id, vegetableName: item.vegetable_name,
      description: item.description || undefined,
      emoji: item.emoji, pricePerKg: item.price_per_kg,
      totalWeight: item.total_weight, amount: item.amount,
      sacks: sacksMap.get(item.id) || [],
    });
  }
  return purchases.map((p) => ({
    id: p.id, purchaseNumber: p.purchase_number,
    shopId: p.shop_id, shopName: p.shop_name,
    date: p.date, subtotal: p.subtotal,
    previousBalance: p.previous_balance, totalDue: p.total_due,
    amountPaid: p.amount_paid, newBalance: p.new_balance,
    createdAt: p.created_at, items: itemsMap.get(p.id) || [],
  }));
}

export function getAllPurchases(): Purchase[] {
  const db = getDb();
  const purchases = db.prepare('SELECT * FROM purchases ORDER BY created_at DESC').all() as unknown as DBPurchase[];
  const items = db.prepare('SELECT * FROM purchase_items').all() as unknown as DBPurchaseItem[];
  const sacks = db.prepare('SELECT * FROM purchase_sacks').all() as unknown as DBPurchaseSack[];
  return assemblePurchases(purchases, items, sacks);
}

export function getPurchaseById(id: string): Purchase | null {
  const db = getDb();
  const purchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(id) as unknown as DBPurchase | undefined;
  if (!purchase) return null;
  const items = db.prepare('SELECT * FROM purchase_items WHERE purchase_id = ?').all(id) as unknown as DBPurchaseItem[];
  const itemIds = items.map((i) => i.id);
  const sacks = itemIds.length
    ? (db.prepare(`SELECT * FROM purchase_sacks WHERE purchase_item_id IN (${itemIds.map(() => '?').join(',')})`)
        .all(...itemIds) as unknown as DBPurchaseSack[])
    : [];
  return assemblePurchases([purchase], items, sacks)[0];
}

export function createPurchase(data: Omit<Purchase, 'purchaseNumber'> & { purchaseNumber?: number }): Purchase {
  const db = getDb();
  const counter = db.prepare('SELECT value FROM settings WHERE key = ?').get('purchase_counter') as unknown as { value: string };
  const purchaseNumber = parseInt(counter.value) + 1;
  db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(String(purchaseNumber), 'purchase_counter');

  const purchase: Purchase = { ...(data as Purchase), purchaseNumber };

  const insertPurchase = db.prepare(
    `INSERT INTO purchases (id, purchase_number, shop_id, shop_name, date, subtotal, previous_balance, total_due, amount_paid, new_balance, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertItem = db.prepare(
    `INSERT INTO purchase_items (id, purchase_id, vegetable_id, vegetable_name, description, emoji, price_per_kg, total_weight, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertSack = db.prepare('INSERT INTO purchase_sacks (id, purchase_item_id, weight) VALUES (?, ?, ?)');

  txn(db, () => {
    insertPurchase.run(
      purchase.id, purchase.purchaseNumber, purchase.shopId, purchase.shopName,
      purchase.date, purchase.subtotal, purchase.previousBalance,
      purchase.totalDue, purchase.amountPaid, purchase.newBalance, purchase.createdAt
    );
    for (const item of purchase.items) {
      const itemId = crypto.randomUUID();
      insertItem.run(itemId, purchase.id, item.vegetableId, item.vegetableName, item.description ?? null, item.emoji, item.pricePerKg, item.totalWeight, item.amount);
      for (const sack of item.sacks) insertSack.run(sack.id, itemId, sack.weight);
    }
  });

  return purchase;
}

export function deletePurchase(id: string): void {
  getDb().prepare('DELETE FROM purchases WHERE id = ?').run(id);
}

export function updatePurchase(id: string, data: Omit<Purchase, 'id' | 'purchaseNumber' | 'createdAt'>): Purchase | null {
  const db = getDb();
  const existing = getPurchaseById(id);
  if (!existing) return null;

  const updated: Purchase = { ...existing, ...data };

  const insertItem = db.prepare(
    `INSERT INTO purchase_items (id, purchase_id, vegetable_id, vegetable_name, description, emoji, price_per_kg, total_weight, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertSack = db.prepare('INSERT INTO purchase_sacks (id, purchase_item_id, weight) VALUES (?, ?, ?)');

  txn(db, () => {
    db.prepare('DELETE FROM purchase_items WHERE purchase_id = ?').run(id);
    db.prepare(`
      UPDATE purchases SET
        shop_id = ?, shop_name = ?, date = ?, subtotal = ?,
        previous_balance = ?, total_due = ?, amount_paid = ?, new_balance = ?
      WHERE id = ?
    `).run(
      updated.shopId, updated.shopName, updated.date, updated.subtotal,
      updated.previousBalance, updated.totalDue, updated.amountPaid, updated.newBalance,
      id
    );
    for (const item of updated.items) {
      const itemId = crypto.randomUUID();
      insertItem.run(itemId, id, item.vegetableId, item.vegetableName, item.description ?? null, item.emoji, item.pricePerKg, item.totalWeight, item.amount);
      for (const sack of item.sacks) insertSack.run(sack.id, itemId, sack.weight);
    }
  });

  return getPurchaseById(id);
}

// ── Shop Payments CRUD ────────────────────────────────────────────────────────

interface DBShopPayment {
  id: string; shop_id: string; shop_name: string;
  amount: number; discount: number | null; date: string; note: string; created_at: string;
}

function mapShopPayment(row: DBShopPayment): ShopPayment {
  return {
    id: row.id, shopId: row.shop_id, shopName: row.shop_name,
    amount: row.amount, discount: row.discount ?? undefined,
    date: row.date, note: row.note || '', createdAt: row.created_at,
  };
}

export function createShopPayment(p: ShopPayment): ShopPayment {
  const db = getDb();
  db.prepare(
    'INSERT INTO shop_payments (id, shop_id, shop_name, amount, discount, date, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(p.id, p.shopId, p.shopName, p.amount, p.discount ?? null, p.date, p.note || '', p.createdAt);
  return p;
}

export function getShopPaymentsByShop(shopId: string): ShopPayment[] {
  const db = getDb();
  return (db.prepare('SELECT * FROM shop_payments WHERE shop_id = ? ORDER BY created_at DESC').all(shopId) as unknown as DBShopPayment[]).map(mapShopPayment);
}

export function getAllShopPayments(): ShopPayment[] {
  const db = getDb();
  return (db.prepare('SELECT * FROM shop_payments ORDER BY created_at DESC').all() as unknown as DBShopPayment[]).map(mapShopPayment);
}

// ── Farmer CRUD ───────────────────────────────────────────────────────────────

interface DBFarmer {
  id: string; name: string; phone: string | null;
  code: number | null; pending_balance: number; created_at: string;
}

function mapFarmer(row: DBFarmer): Farmer {
  return {
    id: row.id, name: row.name,
    phone: row.phone ?? undefined,
    code: row.code ?? undefined,
    pendingBalance: row.pending_balance,
    createdAt: row.created_at,
  };
}

export function getAllFarmers(): Farmer[] {
  const db = getDb();
  return (db.prepare('SELECT * FROM farmers ORDER BY name').all() as unknown as DBFarmer[]).map(mapFarmer);
}

export function getFarmerById(id: string): Farmer | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM farmers WHERE id = ?').get(id) as unknown as DBFarmer | undefined;
  return row ? mapFarmer(row) : null;
}

export function createFarmer(f: Farmer): Farmer {
  const db = getDb();
  db.prepare(
    'INSERT INTO farmers (id, name, phone, code, pending_balance, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(f.id, f.name, f.phone ?? null, f.code ?? null, f.pendingBalance, f.createdAt);
  return f;
}

export function updateFarmer(id: string, data: Partial<Farmer>): void {
  const db = getDb();
  const map: Record<string, string | number | null | undefined> = {};
  if (data.name !== undefined) map.name = data.name;
  if ('phone' in data) map.phone = data.phone ?? null;
  if ('code' in data) map.code = data.code ?? null;
  if (data.pendingBalance !== undefined) map.pending_balance = data.pendingBalance;
  for (const [col, val] of Object.entries(map)) {
    if (val !== undefined) db.prepare(`UPDATE farmers SET ${col} = ? WHERE id = ?`).run(val, id);
  }
}

export function deleteFarmer(id: string): void {
  getDb().prepare('DELETE FROM farmers WHERE id = ?').run(id);
}

// ── Farmer Bill CRUD ──────────────────────────────────────────────────────────

interface DBFarmerBill {
  id: string; bill_number: number; farmer_id: string; farmer_name: string;
  date: string; subtotal: number; commission_rate: number; commission: number;
  coolie: number; vadakai: number; net_amount: number;
  previous_balance: number; total_to_pay: number; amount_paid: number;
  new_balance: number; created_at: string;
}

interface DBFarmerBillItem {
  id: string; farmer_bill_id: string; vegetable_id: string; vegetable_name: string;
  description: string | null; emoji: string; price_per_kg: number;
  total_weight: number; amount: number;
}

interface DBFarmerBillSack { id: string; farmer_bill_item_id: string; weight: number; }

function assembleFarmerBills(bills: DBFarmerBill[], items: DBFarmerBillItem[], sacks: DBFarmerBillSack[]): FarmerBill[] {
  const sacksMap = new Map<string, Sack[]>();
  for (const s of sacks) {
    if (!sacksMap.has(s.farmer_bill_item_id)) sacksMap.set(s.farmer_bill_item_id, []);
    sacksMap.get(s.farmer_bill_item_id)!.push({ id: s.id, weight: s.weight });
  }
  const itemsMap = new Map<string, BillItem[]>();
  for (const item of items) {
    if (!itemsMap.has(item.farmer_bill_id)) itemsMap.set(item.farmer_bill_id, []);
    itemsMap.get(item.farmer_bill_id)!.push({
      vegetableId: item.vegetable_id, vegetableName: item.vegetable_name,
      description: item.description || undefined,
      emoji: item.emoji, pricePerKg: item.price_per_kg,
      totalWeight: item.total_weight, amount: item.amount,
      sacks: sacksMap.get(item.id) || [],
    });
  }
  return bills.map((b) => ({
    id: b.id, billNumber: b.bill_number,
    farmerId: b.farmer_id, farmerName: b.farmer_name,
    date: b.date, subtotal: b.subtotal,
    commissionRate: b.commission_rate, commission: b.commission,
    coolie: b.coolie, vadakai: b.vadakai, netAmount: b.net_amount,
    previousBalance: b.previous_balance, totalToPay: b.total_to_pay,
    amountPaid: b.amount_paid, newBalance: b.new_balance,
    createdAt: b.created_at, items: itemsMap.get(b.id) || [],
  }));
}

export function getAllFarmerBills(): FarmerBill[] {
  const db = getDb();
  const bills = db.prepare('SELECT * FROM farmer_bills ORDER BY created_at DESC').all() as unknown as DBFarmerBill[];
  const items = db.prepare('SELECT * FROM farmer_bill_items').all() as unknown as DBFarmerBillItem[];
  const sacks = db.prepare('SELECT * FROM farmer_bill_sacks').all() as unknown as DBFarmerBillSack[];
  return assembleFarmerBills(bills, items, sacks);
}

export function getFarmerBillById(id: string): FarmerBill | null {
  const db = getDb();
  const bill = db.prepare('SELECT * FROM farmer_bills WHERE id = ?').get(id) as unknown as DBFarmerBill | undefined;
  if (!bill) return null;
  const items = db.prepare('SELECT * FROM farmer_bill_items WHERE farmer_bill_id = ?').all(id) as unknown as DBFarmerBillItem[];
  const itemIds = items.map((i) => i.id);
  const sacks = itemIds.length
    ? (db.prepare(`SELECT * FROM farmer_bill_sacks WHERE farmer_bill_item_id IN (${itemIds.map(() => '?').join(',')})`)
        .all(...itemIds) as unknown as DBFarmerBillSack[])
    : [];
  return assembleFarmerBills([bill], items, sacks)[0];
}

export function createFarmerBill(data: Omit<FarmerBill, 'billNumber'> & { billNumber?: number }): FarmerBill {
  const db = getDb();
  const counter = db.prepare('SELECT value FROM settings WHERE key = ?').get('farmer_bill_counter') as unknown as { value: string };
  const billNumber = parseInt(counter.value) + 1;
  db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(String(billNumber), 'farmer_bill_counter');

  const bill: FarmerBill = { ...(data as FarmerBill), billNumber };

  const insertBill = db.prepare(
    `INSERT INTO farmer_bills (id, bill_number, farmer_id, farmer_name, date, subtotal, commission_rate, commission, coolie, vadakai, net_amount, previous_balance, total_to_pay, amount_paid, new_balance, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertItem = db.prepare(
    `INSERT INTO farmer_bill_items (id, farmer_bill_id, vegetable_id, vegetable_name, description, emoji, price_per_kg, total_weight, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertSack = db.prepare('INSERT INTO farmer_bill_sacks (id, farmer_bill_item_id, weight) VALUES (?, ?, ?)');

  txn(db, () => {
    insertBill.run(
      bill.id, bill.billNumber, bill.farmerId, bill.farmerName,
      bill.date, bill.subtotal, bill.commissionRate, bill.commission,
      bill.coolie, bill.vadakai, bill.netAmount,
      bill.previousBalance, bill.totalToPay, bill.amountPaid, bill.newBalance,
      bill.createdAt
    );
    for (const item of bill.items) {
      const itemId = crypto.randomUUID();
      insertItem.run(itemId, bill.id, item.vegetableId, item.vegetableName, item.description ?? null, item.emoji, item.pricePerKg, item.totalWeight, item.amount);
      for (const sack of item.sacks) insertSack.run(sack.id, itemId, sack.weight);
    }
  });

  return bill;
}

export function deleteFarmerBill(id: string): void {
  getDb().prepare('DELETE FROM farmer_bills WHERE id = ?').run(id);
}

export function updateFarmerBill(id: string, data: Omit<FarmerBill, 'id' | 'billNumber' | 'createdAt'>): FarmerBill | null {
  const db = getDb();
  const existing = getFarmerBillById(id);
  if (!existing) return null;

  const updated: FarmerBill = { ...existing, ...data };

  const insertItem = db.prepare(
    `INSERT INTO farmer_bill_items (id, farmer_bill_id, vegetable_id, vegetable_name, description, emoji, price_per_kg, total_weight, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertSack = db.prepare('INSERT INTO farmer_bill_sacks (id, farmer_bill_item_id, weight) VALUES (?, ?, ?)');

  txn(db, () => {
    db.prepare('DELETE FROM farmer_bill_items WHERE farmer_bill_id = ?').run(id);
    db.prepare(`
      UPDATE farmer_bills SET
        farmer_id = ?, farmer_name = ?, date = ?, subtotal = ?,
        commission_rate = ?, commission = ?, coolie = ?, vadakai = ?,
        net_amount = ?, previous_balance = ?, total_to_pay = ?,
        amount_paid = ?, new_balance = ?
      WHERE id = ?
    `).run(
      updated.farmerId, updated.farmerName, updated.date, updated.subtotal,
      updated.commissionRate, updated.commission, updated.coolie, updated.vadakai,
      updated.netAmount, updated.previousBalance, updated.totalToPay,
      updated.amountPaid, updated.newBalance,
      id
    );
    for (const item of updated.items) {
      const itemId = crypto.randomUUID();
      insertItem.run(itemId, id, item.vegetableId, item.vegetableName, item.description ?? null, item.emoji, item.pricePerKg, item.totalWeight, item.amount);
      for (const sack of item.sacks) insertSack.run(sack.id, itemId, sack.weight);
    }
  });

  return getFarmerBillById(id);
}

// ── Farmer Payments CRUD ──────────────────────────────────────────────────────

interface DBFarmerPayment {
  id: string; farmer_id: string; farmer_name: string;
  amount: number; date: string; note: string; created_at: string;
}

function mapFarmerPayment(row: DBFarmerPayment): FarmerPayment {
  return {
    id: row.id, farmerId: row.farmer_id, farmerName: row.farmer_name,
    amount: row.amount, date: row.date, note: row.note || '', createdAt: row.created_at,
  };
}

export function createFarmerPayment(p: FarmerPayment): FarmerPayment {
  const db = getDb();
  db.prepare(
    'INSERT INTO farmer_payments (id, farmer_id, farmer_name, amount, date, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(p.id, p.farmerId, p.farmerName, p.amount, p.date, p.note || '', p.createdAt);
  return p;
}

export function getFarmerPaymentsByFarmer(farmerId: string): FarmerPayment[] {
  const db = getDb();
  return (db.prepare('SELECT * FROM farmer_payments WHERE farmer_id = ? ORDER BY created_at DESC').all(farmerId) as unknown as DBFarmerPayment[]).map(mapFarmerPayment);
}

export function getAllFarmerPayments(): FarmerPayment[] {
  const db = getDb();
  return (db.prepare('SELECT * FROM farmer_payments ORDER BY created_at DESC').all() as unknown as DBFarmerPayment[]).map(mapFarmerPayment);
}
