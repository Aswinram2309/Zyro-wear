import { NextResponse } from 'next/server';
import { createAdminClient } from '@/database/client/admin';
import { verifyAdminRequest } from '@/lib/admin-auth';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const auth = verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = ((formData.get('type') as string) || 'chart').replace(/[^a-zA-Z0-9_-]/g, '_');
    const rawChartId = (formData.get('chartId') as string) || `sc_${Date.now()}`;
    const cleanChartId = rawChartId.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // 1. Validate File MIME Type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!file.type || !allowedMimeTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a valid image (JPEG, PNG, WebP).' },
        { status: 400 }
      );
    }

    // 2. Validate File Extension
    const rawExt = (file.name.split('.').pop() || 'png').toLowerCase();
    const allowedExts = ['jpeg', 'jpg', 'png', 'webp'];
    if (!allowedExts.includes(rawExt)) {
      return NextResponse.json(
        { error: 'Invalid file extension. Allowed extensions: .jpg, .jpeg, .png, .webp' },
        { status: 400 }
      );
    }

    // 3. Validate File Size (Max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Image file size exceeds limit (Max 10MB).' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const safeFilename = `${type}_${timestamp}.${rawExt}`;
    const storagePath = `size-charts/${cleanChartId}/${safeFilename}`;

    const supabase = createAdminClient();

    // 4. Upload to Supabase Storage
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from('products')
          .upload(storagePath, buffer, {
            contentType: file.type,
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
          console.warn('Supabase size chart upload notice:', error);
        }
      } catch (sbErr) {
        console.warn('Supabase size chart upload exception:', sbErr);
      }
    }

    // 5. Local Fallback for offline dev
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'size-charts', cleanChartId);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const localFilePath = path.join(uploadsDir, safeFilename);
      fs.writeFileSync(localFilePath, buffer);

      const publicUrl = `/uploads/size-charts/${cleanChartId}/${safeFilename}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        path: publicUrl,
      });
    } catch (localErr: any) {
      console.error('Local fallback upload failed:', localErr);
      return NextResponse.json(
        { error: 'Storage upload failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error handling size chart image upload:', error);
    return NextResponse.json(
      { error: 'Image upload failed' },
      { status: 500 }
    );
  }
}
