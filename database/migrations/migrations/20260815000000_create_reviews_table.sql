-- 1. Create reviews table with proper foreign key matching products.id (TEXT)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow anyone (public) to read reviews
CREATE POLICY "Allow public read access to reviews" ON public.reviews
    FOR SELECT USING (true);

-- Allow anyone (public) to insert new reviews
CREATE POLICY "Allow public insert access to reviews" ON public.reviews
    FOR INSERT WITH CHECK (true);

-- NOTE: Since no UPDATE or DELETE policies are created, public clients are blocked from modifying or deleting reviews.
