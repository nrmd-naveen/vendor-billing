import { NextResponse } from 'next/server';
import { getPurchaseById, updatePurchase, deletePurchase } from '@/lib/db';
import type { Purchase } from '@/lib/types';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const purchase = getPurchaseById(id);
    if (!purchase) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(purchase);
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await req.json()) as Omit<Purchase, 'id' | 'purchaseNumber' | 'createdAt'>;
    const updated = updatePurchase(id, body);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    deletePurchase(id);
    return NextResponse.json({ ok: true });
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
