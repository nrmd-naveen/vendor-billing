import { NextResponse } from 'next/server';
import { getFarmerBillById, deleteFarmerBill } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const b = getFarmerBillById(id);
    if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(b);
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    deleteFarmerBill(id);
    return NextResponse.json({ ok: true });
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
