import { NextResponse } from 'next/server';
import {
  getAllSizeChartsFromStore,
  getActiveSizeChartByType,
} from '@/database/stores/size-charts-store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'NORMAL' || type === 'OVERSIZED') {
      const activeChart = await getActiveSizeChartByType(type);
      return NextResponse.json(
        {
          success: true,
          chart: activeChart,
        },
        {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        }
      );
    }

    const allCharts = await getAllSizeChartsFromStore();
    const activeNormal = await getActiveSizeChartByType('NORMAL');
    const activeOversized = await getActiveSizeChartByType('OVERSIZED');

    return NextResponse.json(
      {
        success: true,
        normal: activeNormal,
        oversized: activeOversized,
        charts: allCharts,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in /api/size-charts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch size charts' },
      { status: 500 }
    );
  }
}
