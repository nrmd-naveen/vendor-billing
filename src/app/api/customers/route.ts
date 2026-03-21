import { NextResponse } from 'next/server';
import { getAllCustomers, createCustomer } from '@/lib/db';
import type { Customer } from '@/lib/types';

export function GET() {
  try {
    const customers = getAllCustomers();
    return NextResponse.json(customers);
  } catch (err) {
    console.error('[GET /api/customers]', err);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Customer;
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }
    const customer = createCustomer(body);
    return NextResponse.json(customer, { status: 201 });
  } catch (err) {
    console.error('[POST /api/customers]', err);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
