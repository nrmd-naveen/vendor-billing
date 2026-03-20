import { NextResponse } from 'next/server';
import { createCollection, getCollectionsByCustomer, getAllCollections } from '@/lib/db';
import { Collection } from '@/lib/types';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');
  if (customerId) {
    return NextResponse.json(getCollectionsByCustomer(customerId));
  }
  return NextResponse.json(getAllCollections());
}

export async function POST(req: Request) {
  const data = (await req.json()) as Collection;
  const collection = createCollection(data);
  return NextResponse.json(collection);
}
