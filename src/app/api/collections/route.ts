import { NextResponse } from 'next/server';
import { createCollection, getCollectionsByCustomer, getAllCollections } from '@/lib/db';
import { Collection } from '@/lib/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    if (customerId) {
      return NextResponse.json(getCollectionsByCustomer(customerId));
    }
    return NextResponse.json(getAllCollections());
  } catch (err) {
    console.error('[GET /api/collections]', err);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as Collection;
    if (!data.customerId || !data.amount || data.amount <= 0) {
      return NextResponse.json({ error: 'Valid customer and amount are required' }, { status: 400 });
    }
    const collection = createCollection(data);
    return NextResponse.json(collection);
  } catch (err) {
    console.error('[POST /api/collections]', err);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
