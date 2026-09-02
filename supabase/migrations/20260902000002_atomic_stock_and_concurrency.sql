-- ==============================================================================
-- ATOMIC STOCK DEDUCTION, RESTORATION & CONCURRENCY CONSTRAINTS MIGRATION
-- ==============================================================================

-- 1. UNIQUE CONSTRAINTS FOR IDEMPOTENCY AND DUPLICATE PREVENTION
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_orders_order_number'
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT unique_orders_order_number UNIQUE (order_number);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_orders_razorpay_order_id'
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT unique_orders_razorpay_order_id UNIQUE (razorpay_order_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_orders_razorpay_payment_id'
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT unique_orders_razorpay_payment_id UNIQUE (razorpay_payment_id);
    END IF;
END $$;

-- 2. PERFORMANCE INDEXES FOR CONCURRENT TRAFFIC
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON public.orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);

-- 3. ATOMIC STOCK DEDUCTION RPC (PREVENTS RACE CONDITIONS & OVERSELLING)
CREATE OR REPLACE FUNCTION deduct_product_stock_atomic(
  p_product_id TEXT,
  p_size TEXT,
  p_quantity INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product RECORD;
  v_stock_by_size JSONB;
  v_current_stock INT;
  v_new_size_stock INT;
  v_total_stock INT := 0;
  v_key TEXT;
  v_val TEXT;
BEGIN
  -- Lock product row exclusively to prevent concurrent race conditions
  SELECT * INTO v_product
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  v_stock_by_size := COALESCE(v_product.stock_by_size, '{}'::jsonb);
  v_current_stock := COALESCE((v_stock_by_size ->> p_size)::INT, 0);

  IF v_current_stock < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient stock',
      'available', v_current_stock,
      'requested', p_quantity
    );
  END IF;

  v_new_size_stock := v_current_stock - p_quantity;
  v_stock_by_size := jsonb_set(v_stock_by_size, ARRAY[p_size], to_jsonb(v_new_size_stock));

  -- Calculate total stock across non-S sizes
  FOR v_key, v_val IN SELECT * FROM jsonb_each_text(v_stock_by_size)
  LOOP
    IF v_key <> 'S' AND v_val ~ '^[0-9]+$' THEN
      v_total_stock := v_total_stock + v_val::INT;
    END IF;
  END LOOP;

  UPDATE public.products
  SET 
    stock_by_size = v_stock_by_size,
    stock = v_total_stock,
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_size_stock', v_new_size_stock,
    'total_stock', v_total_stock
  );
END;
$$;

-- 4. ATOMIC STOCK RESTORATION RPC (FOR CANCELLED/FAILED PAYMENTS)
CREATE OR REPLACE FUNCTION restore_product_stock_atomic(
  p_product_id TEXT,
  p_size TEXT,
  p_quantity INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product RECORD;
  v_stock_by_size JSONB;
  v_current_stock INT;
  v_new_size_stock INT;
  v_total_stock INT := 0;
  v_key TEXT;
  v_val TEXT;
BEGIN
  SELECT * INTO v_product
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  v_stock_by_size := COALESCE(v_product.stock_by_size, '{}'::jsonb);
  v_current_stock := COALESCE((v_stock_by_size ->> p_size)::INT, 0);

  v_new_size_stock := v_current_stock + p_quantity;
  v_stock_by_size := jsonb_set(v_stock_by_size, ARRAY[p_size], to_jsonb(v_new_size_stock));

  FOR v_key, v_val IN SELECT * FROM jsonb_each_text(v_stock_by_size)
  LOOP
    IF v_key <> 'S' AND v_val ~ '^[0-9]+$' THEN
      v_total_stock := v_total_stock + v_val::INT;
    END IF;
  END LOOP;

  UPDATE public.products
  SET 
    stock_by_size = v_stock_by_size,
    stock = v_total_stock,
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_size_stock', v_new_size_stock,
    'total_stock', v_total_stock
  );
END;
$$;
