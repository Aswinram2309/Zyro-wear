-- Create site_settings table for global website configurations (announcement bar, site settings)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global_settings',
  announcement_message TEXT NOT NULL DEFAULT '🔥 SPECIAL LAUNCH OFFER: ALL INTERNATIONAL JERSEYS AT FLAT ₹299 ONLY! FREE SHIPPING ON ORDERS OVER ₹999 🔥',
  announcement_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default single global settings record if not exists
INSERT INTO public.site_settings (id, announcement_message, announcement_enabled)
VALUES ('global_settings', '🔥 SPECIAL LAUNCH OFFER: ALL INTERNATIONAL JERSEYS AT FLAT ₹299 ONLY! FREE SHIPPING ON ORDERS OVER ₹999 🔥', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to site_settings
DROP POLICY IF EXISTS "Allow public read site_settings" ON public.site_settings;
CREATE POLICY "Allow public read site_settings" ON public.site_settings
  FOR SELECT USING (true);

-- Allow service role / admin write access to site_settings
DROP POLICY IF EXISTS "Allow service role write site_settings" ON public.site_settings;
CREATE POLICY "Allow service role write site_settings" ON public.site_settings
  FOR ALL USING (true);
