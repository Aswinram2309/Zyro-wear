import { NextResponse } from 'next/server';
import { getSiteSettingsFromStore } from '@/database/stores/settings-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getSiteSettingsFromStore();
    return NextResponse.json(
      {
        success: true,
        settings,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err: any) {
    console.error('Error fetching settings:', err);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
