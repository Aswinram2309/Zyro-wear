import { NextResponse } from 'next/server';
import { getSiteSettingsFromStore } from '@/lib/settings-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getSiteSettingsFromStore();
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (err: any) {
    console.error('Error fetching settings:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch settings' }, { status: 500 });
  }
}
