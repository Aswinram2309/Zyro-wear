import { NextResponse } from 'next/server';
import {
  getSizeChartByIdFromStore,
  updateSizeChartInStore,
  deleteSizeChartFromStore,
} from '@/database/stores/size-charts-store';
import { verifyAdminRequest } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    const chart = await getSizeChartByIdFromStore(id);
    if (!chart) {
      return NextResponse.json({ error: 'Size chart not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, chart });
  } catch (error: any) {
    console.error('Error fetching size chart by id:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const chart = await getSizeChartByIdFromStore(id);
    if (!chart) {
      return NextResponse.json({ error: 'Size chart not found' }, { status: 404 });
    }

    if (body.type && body.type !== 'NORMAL' && body.type !== 'OVERSIZED') {
      return NextResponse.json({ error: 'Type must be NORMAL or OVERSIZED' }, { status: 400 });
    }

    if (body.measurements && (!Array.isArray(body.measurements) || body.measurements.length === 0)) {
      return NextResponse.json({ error: 'Measurements must contain at least one size' }, { status: 400 });
    }

    const updated = await updateSizeChartInStore(id, body);

    return NextResponse.json({
      success: true,
      chart: updated,
    });
  } catch (error: any) {
    console.error('Error updating size chart:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    const success = await deleteSizeChartFromStore(id);
    if (!success) {
      return NextResponse.json({ error: 'Size chart not found or could not be deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Size chart deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting size chart:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
