-- ==============================================================================
-- UPDATE CATEGORIES CATALOG (ADD CUSTOMIZED & OVERSIZED T-SHIRTS, REMOVE CUSTOMIZE JERSEYS)
-- ==============================================================================

-- 1. Ensure categories table exists
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert or update the two new categories
INSERT INTO public.categories (name, slug) VALUES
('Customized T-Shirts', 'customized-t-shirts'),
('Oversized T-Shirts', 'oversized-t-shirts')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 3. Delete old 'customize-jerseys' category entry if it exists
DELETE FROM public.categories 
WHERE slug IN ('customize-jerseys', 'customize_jerseys', 'customize');

-- 4. Reassign existing products from legacy category names to 'Customized T-Shirts'
UPDATE public.products 
SET category = 'Customized T-Shirts'
WHERE LOWER(category) IN ('customize jerseys', 'customize jersey', 'customize-jerseys', 'customize');
