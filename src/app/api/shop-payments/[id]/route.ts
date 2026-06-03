import { NextResponse } from 'next/server';
import { updateShopPayment, deleteShopPayment } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { amount, discount } = await req.json();
    if (amount === undefined || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount required' }, { status: 400 });
    }
    const updated = updateShopPayment(id, amount, discount || 0);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    const error = err as Error;
    console.error('[PATCH /api/shop-payments/[id]]', error);
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    deleteShopPayment(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const error = err as Error;
    console.error('[DELETE /api/shop-payments/[id]]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 });
  }
}
