import { NextResponse } from 'next/server';
import {
  getAllSizeChartsFromStore,
  saveNewSizeChartToStore,
} from '@/database/stores/size-charts-store';
import { verifyAdminRequest } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const charts = await getAllSizeChartsFromStore();
    return NextResponse.json(
      {
        success: true,
        charts,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching admin size charts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch size charts' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Size chart name is required' }, { status: 400 });
    }

    if (!body.type || (body.type !== 'NORMAL' && body.type !== 'OVERSIZED')) {
      return NextResponse.json({ error: 'Size chart type must be NORMAL or OVERSIZED' }, { status: 400 });
    }

    if (!body.measurements || !Array.isArray(body.measurements) || body.measurements.length === 0) {
      return NextResponse.json({ error: 'At least one size measurement row is required' }, { status: 400 });
    }

    const newChart = await saveNewSizeChartToStore({
      name: body.name.trim(),
      type: body.type,
      chart_image_url: body.chart_image_url || null,
      how_to_measure_image_url: body.how_to_measure_image_url || null,
      measurements: body.measurements,
      unit: body.unit || 'ALL MEASUREMENTS ARE IN INCHES',
      tips: body.tips,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
    });

    return NextResponse.json({
      success: true,
      chart: newChart,
    });
  } catch (error: any) {
    console.error('Error creating size chart:', error);
    return NextResponse.json(
      { error: 'Failed to create size chart' },
      { status: 500 }
    );
  }
}
