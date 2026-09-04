-- 1. Ensure public.reviews table has image_url column
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Create storage bucket 'review-images' if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Storage Security RLS Policies for 'review-images'
-- Enable RLS on storage.objects if not already enabled (managed by Supabase)

-- Allow public read access to review images
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Read Access for Review Images'
    ) THEN
        CREATE POLICY "Public Read Access for Review Images"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'review-images');
    END IF;
END $$;

-- Allow public / anonymous insert access to review images
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Upload Access for Review Images'
    ) THEN
        CREATE POLICY "Public Upload Access for Review Images"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'review-images');
    END IF;
END $$;
