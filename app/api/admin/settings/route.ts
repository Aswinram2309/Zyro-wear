import { NextResponse } from 'next/server';
import { updateSiteSettingsInStore } from '@/database/stores/settings-store';
import { verifyAdminRequest } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
