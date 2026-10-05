-- ==============================================================================
-- MIGRATION: CREATE SIZE CHARTS TABLE & POLICIES
-- Run in Supabase SQL Editor: https://database.new
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.size_charts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('NORMAL', 'OVERSIZED')),
    chart_image_url TEXT,
    how_to_measure_image_url TEXT,
    measurements JSONB NOT NULL DEFAULT '[]'::jsonb,
    unit TEXT DEFAULT 'ALL MEASUREMENTS ARE IN INCHES',
    tips JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_size_charts_type ON public.size_charts(type);
CREATE INDEX IF NOT EXISTS idx_size_charts_active ON public.size_charts(is_active);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.size_charts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Size Charts" ON public.size_charts;
DROP POLICY IF EXISTS "Admin Full Access Size Charts" ON public.size_charts;

CREATE POLICY "Public Read Size Charts" ON public.size_charts FOR SELECT USING (true);
CREATE POLICY "Admin Full Access Size Charts" ON public.size_charts FOR ALL USING (true);

-- SEED INITIAL SIZE CHARTS
INSERT INTO public.size_charts (id, name, type, chart_image_url, how_to_measure_image_url, measurements, is_active)
VALUES
(
    'sc_normal_default',
    'Normal T-Shirt Size Chart',
    'NORMAL',
    '/images/size-guide.jpg',
    '/images/size-guide.jpg',
    '[
        {"size": "M", "length": "27", "chest": "40", "shoulder": "10", "sleeve": "—"},
        {"size": "L", "length": "29", "chest": "42", "shoulder": "10", "sleeve": "—"},
        {"size": "XL", "length": "28", "chest": "44", "shoulder": "10", "sleeve": "—"},
        {"size": "XXL", "length": "30", "chest": "46", "shoulder": "10.5", "sleeve": "—"}
    ]'::jsonb,
    TRUE
),
(
    'sc_oversized_default',
    'Oversized T-Shirt Size Chart',
    'OVERSIZED',
    '/images/oversized-size-guide.jpg',
    '/images/oversized-size-guide.jpg',
    '[
        {"size": "M", "shoulder": "20", "chest": "40", "length": "27.5", "sleeve": "10"},
        {"size": "L", "shoulder": "21.5", "chest": "42", "length": "28", "sleeve": "10"},
        {"size": "XL", "shoulder": "22.5", "chest": "44", "length": "30", "sleeve": "10.5"},
        {"size": "XXL", "shoulder": "23.5", "chest": "46", "length": "31", "sleeve": "11"}
    ]'::jsonb,
    TRUE
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    chart_image_url = EXCLUDED.chart_image_url,
    how_to_measure_image_url = EXCLUDED.how_to_measure_image_url,
    measurements = EXCLUDED.measurements,
    is_active = EXCLUDED.is_active;
