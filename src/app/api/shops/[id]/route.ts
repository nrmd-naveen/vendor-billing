import { NextResponse } from 'next/server';
import { getShopById, updateShop, deleteShop } from '@/lib/db';
import type { Shop } from '@/lib/types';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const shop = getShopById(id);
    if (!shop) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(shop);
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await req.json()) as Partial<Shop>;
    updateShop(id, body);
    return NextResponse.json(getShopById(id));
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    deleteShop(id);
    return NextResponse.json({ ok: true });
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
