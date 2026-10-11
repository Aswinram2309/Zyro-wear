-- ==============================================================================
-- MIGRATION: BRAND-BASED SIZE CHART MANAGEMENT & PRODUCTS INTEGRATION
-- Run in Supabase SQL Editor: https://database.new
-- ==============================================================================

-- 1. Ensure size_charts table has all brand-specific columns
CREATE TABLE IF NOT EXISTS public.size_charts (
    id TEXT PRIMARY KEY,
    name TEXT,
    brand_name TEXT,
    type TEXT DEFAULT 'BRAND',
    image_url TEXT,
    chart_image_url TEXT,
    how_to_measure_image_url TEXT,
    columns JSONB DEFAULT '[]'::jsonb,
    measurements JSONB NOT NULL DEFAULT '[]'::jsonb,
    unit TEXT DEFAULT 'ALL MEASUREMENTS ARE IN INCHES',
    tips JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add brand_name, image_url, and columns if size_charts already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='size_charts' AND column_name='brand_name') THEN
        ALTER TABLE public.size_charts ADD COLUMN brand_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='size_charts' AND column_name='image_url') THEN
        ALTER TABLE public.size_charts ADD COLUMN image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='size_charts' AND column_name='columns') THEN
        ALTER TABLE public.size_charts ADD COLUMN columns JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Update type check constraint to allow BRAND alongside legacy NORMAL and OVERSIZED
ALTER TABLE public.size_charts DROP CONSTRAINT IF EXISTS size_charts_type_check;
ALTER TABLE public.size_charts ADD CONSTRAINT size_charts_type_check CHECK (type IN ('NORMAL', 'OVERSIZED', 'BRAND'));

-- Update brand_name from name where null
UPDATE public.size_charts 
SET brand_name = name 
WHERE brand_name IS NULL AND name IS NOT NULL;

-- 2. Create size_chart_measurements table for relational measurement breakdown
CREATE TABLE IF NOT EXISTS public.size_chart_measurements (
    id TEXT PRIMARY KEY,
    size_chart_id TEXT NOT NULL REFERENCES public.size_charts(id) ON DELETE CASCADE,
    size_label TEXT NOT NULL,
    measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for measurement lookups
CREATE INDEX IF NOT EXISTS idx_size_chart_measurements_chart_id ON public.size_chart_measurements(size_chart_id);

-- 3. Add size_chart_id foreign key column to products
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='size_chart_id') THEN
        ALTER TABLE public.products ADD COLUMN size_chart_id TEXT REFERENCES public.size_charts(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Index on products size_chart_id
CREATE INDEX IF NOT EXISTS idx_products_size_chart_id ON public.products(size_chart_id);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.size_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_chart_measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Size Charts" ON public.size_charts;
DROP POLICY IF EXISTS "Admin Full Access Size Charts" ON public.size_charts;
CREATE POLICY "Public Read Size Charts" ON public.size_charts FOR SELECT USING (true);
CREATE POLICY "Admin Full Access Size Charts" ON public.size_charts FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read Measurements" ON public.size_chart_measurements;
DROP POLICY IF EXISTS "Admin Full Access Measurements" ON public.size_chart_measurements;
CREATE POLICY "Public Read Measurements" ON public.size_chart_measurements FOR SELECT USING (true);
CREATE POLICY "Admin Full Access Measurements" ON public.size_chart_measurements FOR ALL USING (true);
