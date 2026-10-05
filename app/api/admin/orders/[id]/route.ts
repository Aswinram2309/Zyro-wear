import { NextResponse } from 'next/server';
import { updateOrderStatusInStore } from '@/database/stores/orders-store';
import { verifyAdminRequest } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { orderStatus } = body;

    const allowedStatuses = ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    if (!orderStatus || !allowedStatuses.includes(orderStatus)) {
      return NextResponse.json({ error: 'Invalid order status. Allowed: ' + allowedStatuses.join(', ') }, { status: 400 });
    }

    await updateOrderStatusInStore(id, orderStatus);

    return NextResponse.json({ success: true, orderStatus });
  } catch (error: any) {
    console.error('Admin order status update error:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
