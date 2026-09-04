-- ==============================================================================
-- ZYRO WEAR - STOCK MANAGEMENT MIGRATION SCRIPT
-- Run this in Supabase SQL Editor (https://database.new)
-- ==============================================================================

-- 1. Add sale_price column if it does not exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sale_price NUMERIC;

-- 2. Add stock_by_size JSONB column if it does not exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_by_size JSONB DEFAULT '{"S": 10, "M": 15, "L": 15, "XL": 10, "XXL": 5}'::jsonb;

-- 3. Add is_active column if it does not exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 4. Update existing products without stock_by_size to default values
UPDATE public.products 
SET stock_by_size = '{"S": 10, "M": 15, "L": 15, "XL": 10, "XXL": 5}'::jsonb 
WHERE stock_by_size IS NULL;

-- Fix Portugal and Spain image paths
UPDATE public.products 
SET front_img = 'ZYRO_Wear_Studio_Imgs/Portugal_Home_Ronaldo_7_front.png',
    back_img = 'ZYRO_Wear_Studio_Imgs/Portugal_Home_Ronaldo_7_Back.png'
WHERE id = 'por-home-7';

UPDATE public.products 
SET front_img = 'ZYRO_Wear_Studio_Imgs/Spain_Home_Lamine_Yamal_19_front.png',
    back_img = 'ZYRO_Wear_Studio_Imgs/Spain_Home_Lamine_Yamal_19_Back.png'
WHERE id = 'esp-home-19';

-- 5. Ensure admin policies exist
DROP POLICY IF EXISTS "Admin Full Access Products" ON public.products;
CREATE POLICY "Admin Full Access Products" ON public.products FOR ALL USING (true);

-- 6. Storage Bucket setup instruction (run in Supabase SQL Editor if storage table exists or create 'products' bucket in Supabase Dashboard -> Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access Products Storage" ON storage.objects;
CREATE POLICY "Public Access Products Storage" ON storage.objects FOR ALL USING (bucket_id = 'products');
