import { NextResponse } from 'next/server';
import { getAllBills, createBill } from '@/lib/db';
import type { Bill } from '@/lib/types';

export function GET() {
  try {
    const bills = getAllBills();
    return NextResponse.json(bills);
  } catch (err) {
    console.error('[GET /api/bills]', err);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Omit<Bill, 'billNumber'>;
    if (!body.customerId || !body.items?.length) {
      return NextResponse.json({ error: 'Customer and at least one item are required' }, { status: 400 });
    }
    const bill = createBill(body);
    return NextResponse.json(bill, { status: 201 });
  } catch (err) {
    console.error('[POST /api/bills]', err);
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}
