import { NextResponse } from 'next/server';
import { getAllOrdersFromStore } from '@/lib/orders-store';

export async function GET() {
  try {
    const orders = await getAllOrdersFromStore();
    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Admin orders GET error:', error);
    return NextResponse.json({ error: error.message || 'Server error', orders: [] }, { status: 500 });
  }
}
