import { NextResponse } from 'next/server';
import {
  getSizeChartByIdFromStore,
  updateSizeChartInStore,
  deleteSizeChartFromStore,
} from '@/database/stores/size-charts-store';
import { verifyAdminRequest } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    if (body.brand_name || body.name) {
      const newBrandName = (body.brand_name || body.name || '').trim();
      if (!newBrandName) {
        return NextResponse.json({ error: 'Brand name cannot be empty' }, { status: 400 });
      }
      const { getAllSizeChartsFromStore } = await import('@/database/stores/size-charts-store');
      const existingCharts = await getAllSizeChartsFromStore();
      const isDuplicate = existingCharts.some(
        (c) => c.id !== id && (c.brand_name || c.name || '').trim().toLowerCase() === newBrandName.toLowerCase()
      );
      if (isDuplicate) {
        return NextResponse.json(
          { error: `Another size chart already exists with brand name "${newBrandName}". Please use a unique brand name.` },
          { status: 400 }
        );
      }
      body.brand_name = newBrandName;
      body.name = newBrandName;
    }

    if (body.image_url || body.chart_image_url) {
      const img = body.image_url || body.chart_image_url;
      body.image_url = img;
      body.chart_image_url = img;
    }

    if (body.measurements && (!Array.isArray(body.measurements) || body.measurements.length === 0)) {
      return NextResponse.json({ error: 'Measurements must contain at least one size row' }, { status: 400 });
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
