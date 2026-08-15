import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'front'; // 'front' or 'back'
    const productId = (formData.get('productId') as string) || `prod_${Date.now()}`;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // 1. Validate File Type
    if (!file.type || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload a valid image (JPEG, PNG, WebP).' }, { status: 400 });
    }

    // 2. Validate File Size (Max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image file size exceeds limit (Max 10MB).' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'png';
    const timestamp = Date.now();
    const filename = `${type}_${timestamp}.${ext}`;
    const storagePath = `product/${productId}/${filename}`;

    const supabase = createAdminClient();

    // 3. Upload to Supabase Storage bucket 'products'
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from('products')
          .upload(storagePath, buffer, {
            contentType: file.type || 'image/png',
            upsert: true,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('products')
            .getPublicUrl(storagePath);

          if (publicUrlData && publicUrlData.publicUrl) {
            return NextResponse.json({
              success: true,
              url: publicUrlData.publicUrl,
              path: storagePath,
            });
          }
        } else {
          console.warn('Supabase storage upload error, using local fallback:', error);
        }
      } catch (sbErr) {
        console.warn('Supabase storage exception, using local fallback:', sbErr);
      }
    }

    // 4. Fallback: Local Storage under public/uploads/products/
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products', productId);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const localFilePath = path.join(uploadsDir, filename);
      fs.writeFileSync(localFilePath, buffer);

      const publicUrl = `/uploads/products/${productId}/${filename}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        path: publicUrl,
      });
    } catch (localErr: any) {
      console.error('Local fallback upload failed:', localErr);
      throw new Error(`Supabase upload failed, and local filesystem fallback is unavailable (Vercel server is read-only). Error: ${localErr.message}`);
    }
  } catch (error: any) {
    console.error('Error handling upload:', error);
    return NextResponse.json({ error: error.message || 'Image upload failed' }, { status: 500 });
  }
}
