import { NextResponse } from 'next/server';
import { getAllCustomers, createCustomer } from '@/lib/db';
import type { Customer } from '@/lib/types';

export function GET() {
  const customers = getAllCustomers();
  return NextResponse.json(customers);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Customer;
  const customer = createCustomer(body);
  return NextResponse.json(customer, { status: 201 });
}
