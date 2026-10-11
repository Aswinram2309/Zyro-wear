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

    const brandName = (body.brand_name || body.name || '').trim();
    if (!brandName) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    // Validate brand names to prevent accidental duplicate entries
    const existingCharts = await getAllSizeChartsFromStore();
    const isDuplicate = existingCharts.some(
      (c) => (c.brand_name || c.name || '').trim().toLowerCase() === brandName.toLowerCase()
    );
    if (isDuplicate) {
      return NextResponse.json(
        { error: `A size chart for brand "${brandName}" already exists. Please edit the existing chart or choose a unique brand name.` },
        { status: 400 }
      );
    }

    if (!body.measurements || !Array.isArray(body.measurements) || body.measurements.length === 0) {
      return NextResponse.json({ error: 'At least one size measurement row is required' }, { status: 400 });
    }

    const newChart = await saveNewSizeChartToStore({
      name: brandName,
      brand_name: brandName,
      type: body.type || 'BRAND',
      chart_image_url: body.image_url || body.chart_image_url || null,
      image_url: body.image_url || body.chart_image_url || null,
      how_to_measure_image_url: body.how_to_measure_image_url || null,
      columns: body.columns && Array.isArray(body.columns) ? body.columns : undefined,
      measurements: body.measurements,
      unit: body.unit || 'ALL MEASUREMENTS ARE IN INCHES',
      tips: body.tips || [],
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
