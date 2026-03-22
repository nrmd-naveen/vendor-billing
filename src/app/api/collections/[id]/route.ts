import { NextResponse } from 'next/server';
import { updateCollectionAmount } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { amount } = await req.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount required' }, { status: 400 });
    }
    const updated = updateCollectionAmount(id, amount);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/collections/[id]]', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
