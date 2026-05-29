import { NextResponse } from 'next/server';
import { getAllFarmerPayments, getFarmerPaymentsByFarmer, createFarmerPayment } from '@/lib/db';
import type { FarmerPayment } from '@/lib/types';

export function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const farmerId = searchParams.get('farmerId');
    return NextResponse.json(farmerId ? getFarmerPaymentsByFarmer(farmerId) : getAllFarmerPayments());
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FarmerPayment;
    return NextResponse.json(createFarmerPayment(body), { status: 201 });
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
