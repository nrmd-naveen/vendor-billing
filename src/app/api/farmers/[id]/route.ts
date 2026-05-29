import { NextResponse } from 'next/server';
import { getFarmerById, updateFarmer, deleteFarmer } from '@/lib/db';
import type { Farmer } from '@/lib/types';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const f = getFarmerById(id);
    if (!f) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(f);
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await req.json()) as Partial<Farmer>;
    updateFarmer(id, body);
    return NextResponse.json(getFarmerById(id));
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    deleteFarmer(id);
    return NextResponse.json({ ok: true });
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
