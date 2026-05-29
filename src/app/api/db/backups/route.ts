import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDbPath } from '@/lib/db';

// GET /api/db/backups — list automatic backups
export function GET() {
  try {
    const dbPath = getDbPath();
    const dir = path.dirname(dbPath);
    const baseName = path.basename(dbPath, '.db');

    const backups = fs.readdirSync(dir)
      .filter(f => f.startsWith(baseName + '.backup-') && f.endsWith('.db'))
      .map(f => {
        const fullPath = path.join(dir, f);
        const stat = fs.statSync(fullPath);
        const tsStr = f.replace(baseName + '.backup-', '').replace('.db', '');
        const timestamp = parseInt(tsStr) || stat.mtimeMs;
        return {
          filename: f,
          timestamp,
          size: stat.size,
          createdAt: new Date(timestamp).toISOString(),
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({ backups });
  } catch (err) {
    console.error('[GET /api/db/backups]', err);
    return NextResponse.json({ error: 'Failed to list backups' }, { status: 500 });
  }
}
