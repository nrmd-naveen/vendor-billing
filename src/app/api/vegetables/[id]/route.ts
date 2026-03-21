import { NextResponse } from 'next/server';
import { updateVegetable, deleteVegetable } from '@/lib/db';
import type { Vegetable } from '@/lib/types';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = (await req.json()) as Partial<Vegetable>;
    updateVegetable(id, data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/vegetables/[id]]', err);
    return NextResponse.json({ error: 'Failed to update vegetable' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    deleteVegetable(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/vegetables/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete vegetable' }, { status: 500 });
  }
}
