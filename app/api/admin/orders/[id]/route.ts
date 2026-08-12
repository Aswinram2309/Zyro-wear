import { NextResponse } from 'next/server';
import { updateOrderStatusInStore } from '@/lib/orders-store';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { orderStatus } = body;

    const allowedStatuses = ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    if (!allowedStatuses.includes(orderStatus)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }

    await updateOrderStatusInStore(id, orderStatus);

    return NextResponse.json({ success: true, orderStatus });
  } catch (error: any) {
    console.error('Admin order status update error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
