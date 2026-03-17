import { NextResponse } from 'next/server';
import { getBillById, deleteBill } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bill = getBillById(id);
  if (!bill) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(bill);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteBill(id);
  return NextResponse.json({ ok: true });
}
