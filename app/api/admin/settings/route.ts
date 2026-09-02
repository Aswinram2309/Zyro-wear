import { NextResponse } from 'next/server';
import { updateSiteSettingsInStore } from '@/lib/settings-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { announcementMessage, announcementEnabled } = body;

    if (announcementEnabled && typeof announcementMessage === 'string' && !announcementMessage.trim()) {
      return NextResponse.json({ error: 'Announcement message cannot be empty when enabled' }, { status: 400 });
    }

    const updated = await updateSiteSettingsInStore({
      announcement_message: typeof announcementMessage === 'string' ? announcementMessage.trim() : undefined,
      announcement_enabled: typeof announcementEnabled === 'boolean' ? announcementEnabled : undefined,
    });

    return NextResponse.json({
      success: true,
      settings: updated,
      message: 'Announcement updated successfully',
    });
  } catch (err: any) {
    console.error('Error updating settings:', err);
    return NextResponse.json({ error: err.message || 'Failed to update settings' }, { status: 500 });
  }
}
