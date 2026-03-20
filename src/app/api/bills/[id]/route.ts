import { NextResponse } from 'next/server';
import { getBillById, deleteBill, getCustomerById, updateCustomer } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bill = getBillById(id);
  if (!bill) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(bill);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bill = getBillById(id);
  if (bill) {
    const customer = getCustomerById(bill.customerId);
    if (customer) {
      const netEffect = bill.newBalance - bill.previousBalance; // subtotal + coolie - amountPaid
      updateCustomer(bill.customerId, { pendingBalance: customer.pendingBalance - netEffect });
    }
  }
  deleteBill(id);
  return NextResponse.json({ ok: true });
}
