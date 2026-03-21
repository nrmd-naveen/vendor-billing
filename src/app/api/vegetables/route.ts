import { NextResponse } from 'next/server';
import { getAllVegetables, createVegetable } from '@/lib/db';
import type { Vegetable } from '@/lib/types';

export function GET() {
  try {
    const vegetables = getAllVegetables();
    return NextResponse.json(vegetables);
  } catch (err) {
    console.error('[GET /api/vegetables]', err);
    return NextResponse.json({ error: 'Failed to fetch vegetables' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Vegetable;
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Vegetable name is required' }, { status: 400 });
    }
    const vegetable = createVegetable(body);
    return NextResponse.json(vegetable, { status: 201 });
  } catch (err) {
    console.error('[POST /api/vegetables]', err);
    return NextResponse.json({ error: 'Failed to create vegetable' }, { status: 500 });
  }
}
