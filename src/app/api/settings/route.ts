import { NextResponse } from 'next/server';
import { getCompanySettings, saveCompanySettings } from '@/lib/db';
import type { CompanySettings } from '@/lib/types';

export function GET() {
  try {
    return NextResponse.json(getCompanySettings());
  } catch (err) {
    console.error('[GET /api/settings]', err);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = (await req.json()) as CompanySettings;
    saveCompanySettings(data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/settings]', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
