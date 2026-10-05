import { NextResponse } from 'next/server';
import { getAllOrdersFromStore } from '@/database/stores/orders-store';
import { verifyAdminRequest } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const auth = verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const orders = await getAllOrdersFromStore();
    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Admin orders GET error:', error);
    return NextResponse.json({ error: 'Server error fetching orders', orders: [] }, { status: 500 });
  }
}
