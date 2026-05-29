import { NextResponse } from 'next/server';
import { getAllShops, createShop } from '@/lib/db';
import type { Shop } from '@/lib/types';

export function GET() {
  try {
    return NextResponse.json(getAllShops());
  } catch (err) {
    console.error('[GET /api/shops]', err);
    return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Shop;
    if (!body.name?.trim()) return NextResponse.json({ error: 'Shop name is required' }, { status: 400 });
    return NextResponse.json(createShop(body), { status: 201 });
  } catch (err) {
    console.error('[POST /api/shops]', err);
    return NextResponse.json({ error: 'Failed to create shop' }, { status: 500 });
  }
}
