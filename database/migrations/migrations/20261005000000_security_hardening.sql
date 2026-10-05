-- ==============================================================================
-- ZYRO WEAR PRODUCTION SECURITY HARDENING & ROW LEVEL SECURITY (RLS) MIGRATION
-- Run in Supabase SQL Editor: https://database.new
-- ==============================================================================

-- 1. SECURE ORDERS TABLE
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop insecure public access policies on orders
DROP POLICY IF EXISTS "Public Read Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Update Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Insert Orders" ON public.orders;
DROP POLICY IF EXISTS "Admin Full Access Orders" ON public.orders;

-- Orders are managed strictly server-side by authenticated APIs via service_role key.
-- Anonymous browser clients cannot read, modify, or delete any customer orders.

-- 2. SECURE ORDER ITEMS TABLE
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop insecure public access policies on order items
DROP POLICY IF EXISTS "Public Read Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Public Insert Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Admin Full Access Order Items" ON public.order_items;

-- 3. SECURE PRODUCTS TABLE
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Products" ON public.products;
DROP POLICY IF EXISTS "Admin Full Access Products" ON public.products;

-- Allow public read access to active products for storefront catalog
CREATE POLICY "Public Read Products" ON public.products
    FOR SELECT USING (true);

-- 4. SECURE SIZE CHARTS TABLE
ALTER TABLE public.size_charts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Size Charts" ON public.size_charts;
DROP POLICY IF EXISTS "Admin Full Access Size Charts" ON public.size_charts;

-- Allow public read access to size charts
CREATE POLICY "Public Read Size Charts" ON public.size_charts
    FOR SELECT USING (true);

-- 5. SECURE SITE SETTINGS TABLE
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow service role write site_settings" ON public.site_settings;

CREATE POLICY "Allow public read site_settings" ON public.site_settings
    FOR SELECT USING (true);

-- 6. SECURE REVIEWS TABLE
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public insert access to reviews" ON public.reviews;

CREATE POLICY "Allow public read access to reviews" ON public.reviews
    FOR SELECT USING (true);

-- 7. PERFORMANCE & LOOKUP INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_payment_lookup ON public.orders(razorpay_payment_id, razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_lookup ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_slug_lookup ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_reviews_product_created ON public.reviews(product_id, created_at DESC);
