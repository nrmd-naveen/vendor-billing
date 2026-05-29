import { NextResponse } from 'next/server';
import { getAllShopPayments, getShopPaymentsByShop, createShopPayment, updateShop } from '@/lib/db';
import type { ShopPayment } from '@/lib/types';

export function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    const payments = shopId ? getShopPaymentsByShop(shopId) : getAllShopPayments();
    return NextResponse.json(payments);
  } catch (err) {
    console.error('[GET /api/shop-payments]', err);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ShopPayment & { updateBalance?: boolean };
    const payment = createShopPayment(body);
    if (body.updateBalance !== false) {
      // Reduce what I owe to the shop
      updateShop(body.shopId, {});
    }
    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    console.error('[POST /api/shop-payments]', err);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
