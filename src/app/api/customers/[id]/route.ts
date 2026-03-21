import { NextResponse } from 'next/server';
import { updateCustomer, deleteCustomer } from '@/lib/db';
import type { Customer } from '@/lib/types';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = (await req.json()) as Partial<Customer>;
    updateCustomer(id, data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/customers/[id]]', err);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    deleteCustomer(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/customers/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
