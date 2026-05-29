import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDbPath, closeDb, checkpointWal } from '@/lib/db';

// GET /api/db — download the database file
export function GET() {
  try {
    const dbPath = getDbPath();
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Database file not found' }, { status: 404 });
    }
    // Flush WAL into the main file so the download includes all committed data
    checkpointWal();

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

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!file.name.endsWith('.db')) return NextResponse.json({ error: 'Only .db files are allowed' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate SQLite magic bytes
    if (buffer.slice(0, 15).toString('utf8') !== 'SQLite format 3') {
      return NextResponse.json({ error: 'Invalid SQLite database file' }, { status: 400 });
    }

    const dbPath = getDbPath();
    const dir = path.dirname(dbPath);
    const baseName = path.basename(dbPath, '.db');
    const timestamp = Date.now();
    const backupFileName = `${baseName}.backup-${timestamp}.db`;
    const backupPath = path.join(dir, backupFileName);

    // Checkpoint WAL (merges journal into main file) then close DB connection
    checkpointWal();
    closeDb();

    // Backup current DB (post-checkpoint, so backup is complete)
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
    }

    // Remove stale WAL/SHM files — they belong to the old DB and would corrupt the new one
    const walPath = dbPath + '-wal';
    const shmPath = dbPath + '-shm';
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    // Write the new database
    fs.writeFileSync(dbPath, buffer);

    // Keep only the 5 most recent backups
    const allBackups = fs.readdirSync(dir)
      .filter(f => f.startsWith(baseName + '.backup-') && f.endsWith('.db'))
      .sort()
      .reverse();
    allBackups.slice(5).forEach(f => { try { fs.unlinkSync(path.join(dir, f)); } catch { /* ignore */ } });

    return NextResponse.json({ ok: true, backupFile: backupFileName, timestamp });
  } catch (err) {
    console.error('[POST /api/db]', err);
    return NextResponse.json({ error: 'Failed to restore database' }, { status: 500 });
  }
}
