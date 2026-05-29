import { NextResponse } from 'next/server';
import { getAllFarmerBills, createFarmerBill } from '@/lib/db';
import type { FarmerBill } from '@/lib/types';

export function GET() {
  try { return NextResponse.json(getAllFarmerBills()); }
  catch (err) { console.error('[GET /api/farmer-bills]', err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Omit<FarmerBill, 'billNumber'>;
    if (!body.farmerId || !body.items?.length) {
      return NextResponse.json({ error: 'Farmer and at least one item required' }, { status: 400 });
    }
    return NextResponse.json(createFarmerBill(body), { status: 201 });
  } catch (err) { console.error('[POST /api/farmer-bills]', err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
