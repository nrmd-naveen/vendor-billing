import { NextResponse } from 'next/server';
import { updateVegetable, deleteVegetable } from '@/lib/db';
import type { Vegetable } from '@/lib/types';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = (await req.json()) as Partial<Vegetable>;
  updateVegetable(id, data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteVegetable(id);
  return NextResponse.json({ ok: true });
}
