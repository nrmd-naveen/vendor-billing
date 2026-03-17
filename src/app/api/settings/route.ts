import { NextResponse } from 'next/server';
import { getCompanySettings, saveCompanySettings } from '@/lib/db';
import type { CompanySettings } from '@/lib/types';

export function GET() {
  return NextResponse.json(getCompanySettings());
}

export async function PUT(req: Request) {
  const data = (await req.json()) as CompanySettings;
  saveCompanySettings(data);
  return NextResponse.json({ ok: true });
}
