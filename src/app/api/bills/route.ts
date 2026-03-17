import { NextResponse } from 'next/server';
import { getAllBills, createBill } from '@/lib/db';
import type { Bill } from '@/lib/types';

export function GET() {
  const bills = getAllBills();
  return NextResponse.json(bills);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Omit<Bill, 'billNumber'>;
  const bill = createBill(body);
  return NextResponse.json(bill, { status: 201 });
}
