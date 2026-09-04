import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/database/client/admin';

export interface SiteSettings {
  id: string;
  announcement_message: string;
  announcement_enabled: boolean;
  updated_at?: string;
}

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'data', 'site_settings.json');
const DEFAULT_SETTINGS: SiteSettings = {
  id: 'global_settings',
  announcement_message: '🔥 SPECIAL LAUNCH OFFER: ALL INTERNATIONAL JERSEYS AT FLAT ₹299 ONLY! FREE SHIPPING ON ORDERS OVER ₹999 🔥',
  announcement_enabled: true,
};

function ensureDataDirExists() {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function getSiteSettingsFromStore(): Promise<SiteSettings> {
  const supabase = createAdminClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'global_settings')
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.error('Supabase fetch settings error:', e);
    }
  }

  // Fallback to local JSON file
  try {
    ensureDataDirExists();
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const raw = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading local settings file:', e);
  }

  return DEFAULT_SETTINGS;
}

export async function updateSiteSettingsInStore(updates: {
  announcement_message?: string;
  announcement_enabled?: boolean;
}): Promise<SiteSettings> {
  const current = await getSiteSettingsFromStore();
  const updatedRecord: SiteSettings = {
    ...current,
    announcement_message: updates.announcement_message !== undefined ? updates.announcement_message : current.announcement_message,
    announcement_enabled: updates.announcement_enabled !== undefined ? updates.announcement_enabled : current.announcement_enabled,
    updated_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .upsert(updatedRecord, { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) {
        try {
          ensureDataDirExists();
          fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
        } catch (fErr) {}
        return data;
      }
    } catch (e) {
      console.error('Supabase update settings error:', e);
    }
  }

  // Save to local file backup
  try {
    ensureDataDirExists();
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updatedRecord, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving local settings file:', e);
  }

  return updatedRecord;
}
