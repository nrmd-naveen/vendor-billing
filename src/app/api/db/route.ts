import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDbPath, closeDb } from '@/lib/db';

// GET /api/db — download the database file
export function GET() {
  try {
    const dbPath = getDbPath();

    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Database file not found' }, { status: 404 });
    }

    const buffer = fs.readFileSync(dbPath);
    const filename = `backup-${new Date().toISOString().slice(0, 10)}.db`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('[GET /api/db]', err);
    return NextResponse.json({ error: 'Failed to download database' }, { status: 500 });
  }
}

// POST /api/db — upload and restore a database file
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.db')) {
      return NextResponse.json({ error: 'Only .db files are allowed' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate SQLite magic bytes: first 16 bytes should be "SQLite format 3\000"
    const magic = buffer.slice(0, 15).toString('utf8');
    if (magic !== 'SQLite format 3') {
      return NextResponse.json({ error: 'Invalid SQLite database file' }, { status: 400 });
    }

    const dbPath = getDbPath();

    // Back up existing DB before replacing
    const backupPath = dbPath.replace('.db', `.backup-${Date.now()}.db`);
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
    }

    // Close DB connection, replace file, then it will reopen on next request
    closeDb();
    fs.writeFileSync(dbPath, buffer);

    // Clean up old backups (keep only latest 3)
    const dir = path.dirname(dbPath);
    const baseName = path.basename(dbPath, '.db');
    const backups = fs.readdirSync(dir)
      .filter((f) => f.startsWith(baseName + '.backup-'))
      .sort()
      .reverse();
    backups.slice(3).forEach((f) => fs.unlinkSync(path.join(dir, f)));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/db]', err);
    return NextResponse.json({ error: 'Failed to restore database' }, { status: 500 });
  }
}
