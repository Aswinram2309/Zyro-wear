-- Add shipping_fee, discount_amount, and offer_applied to public.orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS offer_applied TEXT DEFAULT NULL;
