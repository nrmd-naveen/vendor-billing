import { NextResponse } from 'next/server';
import { getAllFarmers, createFarmer } from '@/lib/db';
import type { Farmer } from '@/lib/types';

export function GET() {
  try { return NextResponse.json(getAllFarmers()); }
  catch (err) { console.error('[GET /api/farmers]', err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Farmer;
    if (!body.name?.trim()) return NextResponse.json({ error: 'Farmer name is required' }, { status: 400 });
    return NextResponse.json(createFarmer(body), { status: 201 });
  } catch (err) { console.error('[POST /api/farmers]', err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
