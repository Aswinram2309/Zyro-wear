-- ==============================================================================
-- ZYRO WEAR E-COMMERCE DATABASE SCHEMA & SEED DATA
-- Run this entire script in your Supabase SQL Editor (https://database.new)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 299,
    mrp NUMERIC NOT NULL DEFAULT 699,
    category TEXT NOT NULL DEFAULT 'star',
    nation TEXT,
    front_img TEXT NOT NULL,
    back_img TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    sizes TEXT[] DEFAULT '{"S", "M", "L", "XL", "XXL"}',
    stock INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    subtotal NUMERIC NOT NULL,
    total_amount NUMERIC NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'PAID', -- PENDING / PAID / FAILED
    order_status TEXT NOT NULL DEFAULT 'NEW',   -- NEW / CONFIRMED / PROCESSING / SHIPPED / DELIVERED
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    size TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Orders: Public insert for guest checkout & server/service-role read/update
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public Update Orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Public Insert Order Items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Order Items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Admin Full Access Orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Admin Full Access Order Items" ON public.order_items FOR ALL USING (true);

-- SEED DATA: CATEGORIES
INSERT INTO public.categories (name, slug) VALUES
('Star Players', 'star'),
('National Teams', 'national'),
('Clubs', 'club')
ON CONFLICT (slug) DO NOTHING;

-- SEED DATA: PRODUCTS (12 OFFICIAL ZYRO WEAR JERSEYS)
INSERT INTO public.products (id, name, slug, description, price, mrp, category, nation, front_img, back_img) VALUES
(
    'arg-home-10',
    'Argentina Home Kit (Messi #10)',
    'argentina-home-kit-messi-10',
    'Official 2026 Argentina Home Jersey featuring legend Lionel Messi #10. Crafted with ultra-light breathable fabric for peak performance and style.',
    299, 699, 'star', 'Argentina',
    'ZYRO_Wear_Studio_Imgs/Argentina_Home_Front.png',
    'ZYRO_Wear_Studio_Imgs/Argentina_Home_Messi_10_Back.png'
),
(
    'bel-home-7',
    'Belgium Home Kit (De Bruyne #7)',
    'belgium-home-kit-de-bruyne-7',
    'Official Belgium Red Devils Home Kit featuring playmaker Kevin De Bruyne #7. Bold geometric graphics and sweat-wicking comfort.',
    299, 699, 'star', 'Belgium',
    'ZYRO_Wear_Studio_Imgs/Belgium_Home_Front (2).png',
    'ZYRO_Wear_Studio_Imgs/Belgium_Home_De_Bruyne_7_Back.png'
),
(
    'bra-home-7',
    'Brazil Home Kit (Vini Jr #7)',
    'brazil-home-kit-vini-jr-7',
    'Iconic Seleção Canary Yellow Home Jersey with Vinícius Jr #7. Represents Samba football energy, built for comfort.',
    299, 699, 'star', 'Brazil',
    'ZYRO_Wear_Studio_Imgs/Brazil_Home_Front.png',
    'ZYRO_Wear_Studio_Imgs/Brazil_Home_Vini_Jr_7_Back.png'
),
(
    'eng-home-10',
    'England Home Kit (Bellingham #10)',
    'england-home-kit-bellingham-10',
    'Classic Three Lions Pure White Home Jersey featuring Jude Bellingham #10. Premium tailored fit and high-definition badge.',
    299, 699, 'star', 'England',
    'ZYRO_Wear_Studio_Imgs/England_Home_Front.png',
    'ZYRO_Wear_Studio_Imgs/England_Home_Bellingham_10_Back.png'
),
(
    'fra-home-10',
    'France Home Kit (Mbappé #10)',
    'france-home-kit-mbappe-10',
    'Elegant Royal Blue Les Bleus Home Kit with speedster Kylian Mbappé #10. Gold rooster crest detail and modern athletic cut.',
    299, 699, 'star', 'France',
    'ZYRO_Wear_Studio_Imgs/France_Home_Front.png',
    'ZYRO_Wear_Studio_Imgs/France_Home_Mbappe_10_Back.png'
),
(
    'ger-home-10',
    'Germany Home Kit (Musiala #10)',
    'germany-home-kit-musiala-10',
    'Modern DFB White & Flame Graphic Home Kit featuring Jamal Musiala #10. Precision engineering and breathable texture.',
    299, 699, 'star', 'Germany',
    'ZYRO_Wear_Studio_Imgs/Germany_Home_Front.png',
    'ZYRO_Wear_Studio_Imgs/Germany_Home_Musiala_10_Back.png'
),
(
    'nor-home-9',
    'Norway Home Kit (Haaland #9)',
    'norway-home-kit-haaland-9',
    'Striking Red & Blue Nordic Cross Home Jersey with goal machine Erling Haaland #9. Maximum ventilation & durability.',
    299, 699, 'star', 'Norway',
    'ZYRO_Wear_Studio_Imgs/Norway_Home_Front.png',
    'ZYRO_Wear_Studio_Imgs/Norway_Home_Haaland_9_Back.png'
),
(
    'por-home-7',
    'Portugal Home Kit (Ronaldo #7)',
    'portugal-home-kit-ronaldo-7',
    'Legendary Crimson & Green Portugal Home Kit featuring Cristiano Ronaldo #7. Wear the legacy of greatness.',
    299, 699, 'star', 'Portugal',
    'ZYRO_Wear_Studio_Imgs/Portugal_Home_Front.png',
    'ZYRO_Wear_Studio_Imgs/Portugal_Home_Ronaldo_7_Back.png'
),
(
    'esp-home-19',
    'Spain Home Kit (Yamal #19)',
    'spain-home-kit-yamal-19',
    'Dynamic La Roja Crimson Home Kit featuring wunderkind Lamine Yamal #19. Designed for agility, passion and style.',
    299, 699, 'star', 'Spain',
    'ZYRO_Wear_Studio_Imgs/Spain_Home_Front.png',
    'ZYRO_Wear_Studio_Imgs/Spain_Home_Yamal_19_Back.png'
),
(
    'aln-away-7',
    'Al-Nassr Yellow Away Kit (Ronaldo #7)',
    'al-nassr-yellow-away-kit-ronaldo-7',
    'Exclusive Al-Nassr Vibrant Yellow Away Jersey featuring CR7 #7. Premium Saudi Pro League edition jersey.',
    299, 699, 'club', 'Saudi Arabia',
    'ZYRO_Wear_Studio_Imgs/Al-Nassr_Yellow_Away_Front.png',
    'ZYRO_Wear_Studio_Imgs/Al-Nassr_Yellow_Away_Ronaldo_7_Back.png'
),
(
    'mia-home-10',
    'Inter Miami Pink Home Kit (Messi #10)',
    'inter-miami-pink-home-kit-messi-10',
    'Vibrant Flamingo Pink Inter Miami Home Jersey featuring Lionel Messi #10. The hottest lifestyle jersey in global football.',
    299, 699, 'club', 'USA',
    'ZYRO_Wear_Studio_Imgs/Inter_Miami_Pink_Home_Front.png',
    'ZYRO_Wear_Studio_Imgs/Inter_Miami_Pink_Home_Messi_10_Back.png'
),
(
    'rma-home-5',
    'Real Madrid White Home Kit (Bellingham #5)',
    'real-madrid-white-home-kit-bellingham-5',
    'Royal Pure White Los Blancos Home Jersey featuring Jude Bellingham #5. Gold houndstooth details & iconic crest.',
    299, 699, 'club', 'Spain',
    'ZYRO_Wear_Studio_Imgs/Real_Madrid_White_Home_Front.png',
    'ZYRO_Wear_Studio_Imgs/Real_Madrid_White_Home_Bellingham_5_Back.png'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    mrp = EXCLUDED.mrp,
    front_img = EXCLUDED.front_img,
    back_img = EXCLUDED.back_img;
