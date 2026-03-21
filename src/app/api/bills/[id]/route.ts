import { NextResponse } from 'next/server';
import { getBillById, deleteBill, getCustomerById, updateCustomer } from '@/lib/db';

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
