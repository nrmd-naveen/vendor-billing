import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDbPath, closeDb, checkpointWal } from '@/lib/db';

// POST /api/db/backups/restore — revert to an automatic backup
export async function POST(req: Request) {
  try {
    const body = await req.json() as { filename?: string };
    const { filename } = body;

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'filename is required' }, { status: 400 });
    }

    const dbPath = getDbPath();
    const dir = path.dirname(dbPath);
    const baseName = path.basename(dbPath, '.db');

    // Reject path traversal and unexpected patterns
    if (
      filename.includes('/') || filename.includes('\\') || filename.includes('..') ||
      !filename.startsWith(baseName + '.backup-') || !filename.endsWith('.db')
    ) {
      return NextResponse.json({ error: 'Invalid backup filename' }, { status: 400 });
    }

    const backupPath = path.join(dir, filename);
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
    }

    // Save current state before reverting so the user can undo this revert too
    const timestamp = Date.now();
    const currentBackupName = `${baseName}.backup-${timestamp}.db`;
    const currentBackupPath = path.join(dir, currentBackupName);

    checkpointWal();
    closeDb();

    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, currentBackupPath);
    }

    // Clear stale WAL files
    const walPath = dbPath + '-wal';
    const shmPath = dbPath + '-shm';
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    // Restore the chosen backup
    fs.copyFileSync(backupPath, dbPath);

    // Keep only the 5 most recent backups
    const allBackups = fs.readdirSync(dir)
      .filter(f => f.startsWith(baseName + '.backup-') && f.endsWith('.db'))
      .sort()
      .reverse();
    allBackups.slice(5).forEach(f => { try { fs.unlinkSync(path.join(dir, f)); } catch { /* ignore */ } });

    return NextResponse.json({ ok: true, backupFile: currentBackupName, timestamp });
  } catch (err) {
    console.error('[POST /api/db/backups/restore]', err);
    return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 });
  }
}
