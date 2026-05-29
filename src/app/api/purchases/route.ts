import { NextResponse } from 'next/server';
import { getAllPurchases, createPurchase } from '@/lib/db';
import type { Purchase } from '@/lib/types';

export function GET() {
  try {
    return NextResponse.json(getAllPurchases());
  } catch (err) {
    console.error('[GET /api/purchases]', err);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Omit<Purchase, 'purchaseNumber'>;
    if (!body.shopId || !body.items?.length) {
      return NextResponse.json({ error: 'Shop and at least one item are required' }, { status: 400 });
    }
    return NextResponse.json(createPurchase(body), { status: 201 });
  } catch (err) {
    console.error('[POST /api/purchases]', err);
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 });
  }
}
