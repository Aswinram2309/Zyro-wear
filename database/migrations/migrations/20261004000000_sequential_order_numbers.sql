-- ==============================================================================
-- SEQUENTIAL ORDER NUMBER GENERATOR (#ZW1, #ZW2, #ZW3...)
-- ==============================================================================

-- Create PostgreSQL sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1 INCREMENT BY 1;

-- RPC function to atomically get next sequential order number
CREATE OR REPLACE FUNCTION generate_next_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seq BIGINT;
  v_next_num TEXT;
BEGIN
  -- Advance sequence atomically
  v_seq := nextval('order_number_seq');
  v_next_num := '#ZW' || v_seq;
  RETURN v_next_num;
END;
$$;

-- Align sequence value with highest existing #ZW order number if present
DO $$
DECLARE
  v_max INT := 0;
  v_num INT;
  r RECORD;
BEGIN
  FOR r IN SELECT order_number FROM public.orders WHERE order_number LIKE '#ZW%' LOOP
    v_num := substring(r.order_number FROM '^#ZW([0-9]+)')::INT;
    IF v_num IS NOT NULL AND v_num > v_max THEN
      v_max := v_num;
    END IF;
  END LOOP;

  IF v_max > 0 THEN
    PERFORM setval('order_number_seq', v_max);
  END IF;
END $$;
