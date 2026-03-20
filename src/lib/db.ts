import Database from 'better-sqlite3';
import path from 'path';
import { DEFAULT_VEGETABLES } from './defaults';
import { DEFAULT_COMPANY_SETTINGS } from './types';
import type { Customer, Vegetable, Bill, BillItem, Sack, CompanySettings, Collection } from './types';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'chark.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initDb(_db);
  }
  return _db;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      nickname TEXT DEFAULT '',
      code INTEGER,
      prefix TEXT DEFAULT 'திரு',
      pending_balance REAL DEFAULT 0,
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
  `);

  runMigrations(db);

  // Seed default company settings
  const settingsKeys = Object.keys(SETTINGS_MAP);
  for (const key of settingsKeys) {
    const val = SETTINGS_DEFAULTS[key];
    if (val !== undefined) {
      db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run(key, val);
    }
  }

  // Seed vegetables if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM vegetables').get() as { c: number };
  if (count.c === 0) {
    const insert = db.prepare(
      'INSERT INTO vegetables (id, name, english_name, nicknames, emoji, default_price) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const veg of DEFAULT_VEGETABLES) {
      insert.run(veg.id, veg.name, veg.englishName, JSON.stringify(veg.nicknames), veg.emoji, veg.defaultPrice);
    }
  }
}

function runMigrations(db: Database.Database) {
  // customers table migrations
  const custCols = (db.prepare('PRAGMA table_info(customers)').all() as { name: string }[]).map(c => c.name);
  if (!custCols.includes('nickname')) db.exec("ALTER TABLE customers ADD COLUMN nickname TEXT DEFAULT ''");
  if (!custCols.includes('code')) db.exec('ALTER TABLE customers ADD COLUMN code INTEGER');
  if (!custCols.includes('prefix')) db.exec("ALTER TABLE customers ADD COLUMN prefix TEXT DEFAULT 'திரு'");

  // vegetables table migrations
  const vegCols = (db.prepare('PRAGMA table_info(vegetables)').all() as { name: string }[]).map(c => c.name);
  if (!vegCols.includes('code')) db.exec('ALTER TABLE vegetables ADD COLUMN code INTEGER');

  // bills table migrations
  const billCols = (db.prepare('PRAGMA table_info(bills)').all() as { name: string }[]).map(c => c.name);
  if (!billCols.includes('customer_nickname')) db.exec("ALTER TABLE bills ADD COLUMN customer_nickname TEXT DEFAULT ''");
  if (!billCols.includes('customer_prefix')) db.exec("ALTER TABLE bills ADD COLUMN customer_prefix TEXT DEFAULT 'திரு'");
  if (!billCols.includes('coolie')) db.exec('ALTER TABLE bills ADD COLUMN coolie REAL DEFAULT 0');
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
};

export function getCompanySettings(): CompanySettings {
  const db = getDb();
  const dbKeys = Object.values(SETTINGS_MAP);
  const rows = db.prepare(`SELECT key, value FROM settings WHERE key IN (${dbKeys.map(() => '?').join(',')})`)
    .all(...dbKeys) as { key: string; value: string }[];

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
  };
}

export function saveCompanySettings(s: CompanySettings): void {
  const db = getDb();
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const tx = db.transaction(() => {
    for (const [field, dbKey] of Object.entries(SETTINGS_MAP)) {
      upsert.run(dbKey, (s as unknown as Record<string, string>)[field] ?? '');
    }
  });
  tx();
}

// ── DB row types ──────────────────────────────────────────────────────────────

interface DBCustomer {
  id: string; name: string; phone: string | null;
  nickname: string | null; code: number | null; prefix: string | null;
  pending_balance: number; created_at: string;
}

interface DBVegetable {
  id: string; name: string; english_name: string; nicknames: string;
  emoji: string; default_price: number; code: number | null;
}

interface DBBill {
  id: string; bill_number: number; customer_id: string; customer_name: string;
  customer_nickname: string | null; customer_prefix: string | null;
  date: string; subtotal: number; coolie: number;
  previous_balance: number; total_due: number; amount_paid: number;
  new_balance: number; created_at: string;
}

interface DBBillItem {
  id: string; bill_id: string; vegetable_id: string; vegetable_name: string;
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
    date: b.date, subtotal: b.subtotal, coolie: b.coolie || 0,
    previousBalance: b.previous_balance, totalDue: b.total_due,
    amountPaid: b.amount_paid, newBalance: b.new_balance,
    createdAt: b.created_at, items: itemsMap.get(b.id) || [],
  }));
}

// ── Customer CRUD ─────────────────────────────────────────────────────────────

export function getAllCustomers(): Customer[] {
  const db = getDb();
  return (db.prepare('SELECT * FROM customers ORDER BY name').all() as DBCustomer[]).map(mapCustomer);
}

export function createCustomer(c: Customer): Customer {
  const db = getDb();
  db.prepare(
    'INSERT INTO customers (id, name, phone, nickname, code, prefix, pending_balance, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(c.id, c.name, c.phone ?? null, c.nickname ?? '', c.code ?? null, c.prefix ?? 'திரு', c.pendingBalance, c.createdAt);
  return c;
}

export function updateCustomer(id: string, data: Partial<Customer>): void {
  const db = getDb();
  const map: Record<string, unknown> = {
    name: data.name, phone: data.phone ?? null, nickname: data.nickname ?? null,
    code: data.code ?? null, prefix: data.prefix ?? null,
    pending_balance: data.pendingBalance,
  };
  for (const [col, val] of Object.entries(map)) {
    if (val !== undefined) db.prepare(`UPDATE customers SET ${col} = ? WHERE id = ?`).run(val, id);
  }
}

export function getCustomerById(id: string): Customer | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as DBCustomer | undefined;
  return row ? mapCustomer(row) : null;
}

export function deleteCustomer(id: string): void {
  getDb().prepare('DELETE FROM customers WHERE id = ?').run(id);
}

// ── Vegetable CRUD ────────────────────────────────────────────────────────────

export function getAllVegetables(): Vegetable[] {
  const db = getDb();
  return (db.prepare('SELECT * FROM vegetables ORDER BY COALESCE(code, 9999), name').all() as DBVegetable[]).map(mapVegetable);
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
  const map: Record<string, unknown> = {
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
  const bills = db.prepare('SELECT * FROM bills ORDER BY created_at DESC').all() as DBBill[];
  const items = db.prepare('SELECT * FROM bill_items').all() as DBBillItem[];
  const sacks = db.prepare('SELECT * FROM bill_sacks').all() as DBSack[];
  return assembleBills(bills, items, sacks);
}

export function getBillById(id: string): Bill | null {
  const db = getDb();
  const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id) as DBBill | undefined;
  if (!bill) return null;
  const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(id) as DBBillItem[];
  const itemIds = items.map((i) => i.id);
  const sacks = itemIds.length
    ? (db.prepare(`SELECT * FROM bill_sacks WHERE bill_item_id IN (${itemIds.map(() => '?').join(',')})`)
        .all(...itemIds) as DBSack[])
    : [];
  return assembleBills([bill], items, sacks)[0];
}

export function createBill(data: Omit<Bill, 'billNumber'> & { billNumber?: number }): Bill {
  const db = getDb();
  const counter = db.prepare('SELECT value FROM settings WHERE key = ?').get('bill_counter') as { value: string };
  const billNumber = parseInt(counter.value) + 1;
  db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(String(billNumber), 'bill_counter');

  const bill: Bill = { ...(data as Bill), billNumber };

  const insertBill = db.prepare(
    `INSERT INTO bills (id, bill_number, customer_id, customer_name, customer_nickname, customer_prefix, date, subtotal, coolie, previous_balance, total_due, amount_paid, new_balance, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertItem = db.prepare(
    `INSERT INTO bill_items (id, bill_id, vegetable_id, vegetable_name, emoji, price_per_kg, total_weight, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertSack = db.prepare('INSERT INTO bill_sacks (id, bill_item_id, weight) VALUES (?, ?, ?)');

  db.transaction(() => {
    insertBill.run(
      bill.id, bill.billNumber, bill.customerId, bill.customerName,
      bill.customerNickname ?? '', bill.customerPrefix ?? 'திரு',
      bill.date, bill.subtotal, bill.coolie, bill.previousBalance,
      bill.totalDue, bill.amountPaid, bill.newBalance, bill.createdAt
    );
    for (const item of bill.items) {
      const itemId = crypto.randomUUID();
      insertItem.run(itemId, bill.id, item.vegetableId, item.vegetableName, item.emoji, item.pricePerKg, item.totalWeight, item.amount);
      for (const sack of item.sacks) insertSack.run(sack.id, itemId, sack.weight);
    }
  })();

  return bill;
}

export function deleteBill(id: string): void {
  getDb().prepare('DELETE FROM bills WHERE id = ?').run(id);
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
  return (db.prepare('SELECT * FROM collections WHERE customer_id = ? ORDER BY created_at DESC').all(customerId) as DBCollection[]).map(mapCollection);
}

export function getAllCollections(): Collection[] {
  const db = getDb();
  return (db.prepare('SELECT * FROM collections ORDER BY created_at DESC').all() as DBCollection[]).map(mapCollection);
}
