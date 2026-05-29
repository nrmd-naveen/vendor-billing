import { NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { getDbStats, type DbStats } from '@/lib/db';

function readStatsFromFile(dbPath: string): DbStats {
  const db = new DatabaseSync(dbPath);
  try {
    const tables = (
      db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as unknown as { name: string }[]
    ).map(r => r.name);

    const count = (table: string) => {
      if (!tables.includes(table)) return 0;
      return (db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as unknown as { c: number }).c;
    };

    const customers = count('customers');
    const bills = count('bills');
    const vegetables = count('vegetables');
    const collections = count('collections');

    let dateRange: DbStats['dateRange'] = null;
    if (bills > 0 && tables.includes('bills')) {
      const r = db.prepare('SELECT MIN(date) as f, MAX(date) as t FROM bills').get() as unknown as { f: string; t: string };
      if (r.f) dateRange = { from: r.f, to: r.t };
    }

    const shops = count('shops');
    const purchases = count('purchases');
    return { customers, bills, vegetables, collections, shops, purchases, dateRange };
  } finally {
    db.close();
  }
}

// POST /api/db/analyze — analyze an uploaded DB file and return stats without writing it
export async function POST(req: Request) {
  let tempPath = '';
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.slice(0, 15).toString('utf8') !== 'SQLite format 3') {
      return NextResponse.json({ error: 'Invalid SQLite database file' }, { status: 400 });
    }

    tempPath = path.join(os.tmpdir(), `vb-preview-${Date.now()}.db`);
    fs.writeFileSync(tempPath, buffer);

    const uploaded = readStatsFromFile(tempPath);
    const current = getDbStats();

    return NextResponse.json({
      uploaded,
      current,
      fileSize: buffer.length,
      fileName: file.name,
    });
  } catch (err) {
    console.error('[POST /api/db/analyze]', err);
    return NextResponse.json({ error: 'Failed to analyze database file' }, { status: 500 });
  } finally {
    if (tempPath) { try { fs.unlinkSync(tempPath); } catch { /* ignore */ } }
  }
}
