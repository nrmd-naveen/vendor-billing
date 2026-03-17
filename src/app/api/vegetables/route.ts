import { NextResponse } from 'next/server';
import { getAllVegetables, createVegetable } from '@/lib/db';
import type { Vegetable } from '@/lib/types';

export function GET() {
  const vegetables = getAllVegetables();
  return NextResponse.json(vegetables);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Vegetable;
  const vegetable = createVegetable(body);
  return NextResponse.json(vegetable, { status: 201 });
}
