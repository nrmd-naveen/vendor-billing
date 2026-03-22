import { NextResponse } from 'next/server';
import { getBillById, deleteBill, getCustomerById, updateCustomer, updateBill } from '@/lib/db';
import type { Bill } from '@/lib/types';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bill = getBillById(id);
    if (!bill) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(bill);
  } catch (err) {
    console.error('[GET /api/bills/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const oldBill = getBillById(id);
    if (!oldBill) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = (await req.json()) as Omit<Bill, 'id' | 'billNumber' | 'createdAt'>;
    const updatedBill = updateBill(id, body);
    if (!updatedBill) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

    // Adjust customer balance by the delta between old and new newBalance
    const customer = getCustomerById(oldBill.customerId);
    if (customer) {
      const delta = updatedBill.newBalance - oldBill.newBalance;
      updateCustomer(oldBill.customerId, { pendingBalance: customer.pendingBalance + delta });
    }

    return NextResponse.json(updatedBill);
  } catch (err) {
    console.error('[PUT /api/bills/[id]]', err);
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bill = getBillById(id);
    if (!bill) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const customer = getCustomerById(bill.customerId);
    if (customer) {
      const netEffect = bill.newBalance - bill.previousBalance;
      updateCustomer(bill.customerId, { pendingBalance: customer.pendingBalance - netEffect });
    }

    deleteBill(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/bills/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 });
  }
}
