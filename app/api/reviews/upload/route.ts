import { NextResponse } from 'next/server';
import { createAdminClient } from '@/database/client/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const productId = (formData.get('productId') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No photo uploaded' }, { status: 400 });
    }

    const fileNameLower = file.name.toLowerCase();
    const fileExt = (fileNameLower.split('.').pop() || '').toLowerCase();
    const allowedExts = ['jpeg', 'jpg', 'png', 'heic'];

    const isAllowedExt = allowedExts.includes(fileExt);
    const isAllowedType = file.type
      ? file.type.startsWith('image/') || file.type === 'application/octet-stream'
      : true;

    if (!isAllowedExt || !isAllowedType) {
      return NextResponse.json(
        { error: 'Invalid file format. Allowed formats: .jpeg, .jpg, .png, .heic' },
        { status: 400 }
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds limit. Maximum allowed size is 10MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database and storage service unavailable' },
        { status: 500 }
      );
    }

    // Ensure 'review-images' bucket exists
    const BUCKET_NAME = 'review-images';
    const { data: bucket, error: bucketCheckErr } = await supabase.storage.getBucket(BUCKET_NAME);
    if (bucketCheckErr || !bucket) {
      console.log(`Bucket '${BUCKET_NAME}' not found or error, attempting auto-creation...`, bucketCheckErr);
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_SIZE,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'],
      }).catch((cbErr) => {
        console.warn('Auto-create bucket notice:', cbErr?.message || cbErr);
      });
    }

    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const cleanFileName = file.name ? file.name.replace(/[^a-zA-Z0-9.-]/g, '_') : `photo.${fileExt || 'jpg'}`;
    const storagePath = `reviews/${uniqueId}_${cleanFileName}`;

    let contentType = file.type || 'image/jpeg';
    if (fileExt === 'png') contentType = 'image/png';
    else if (fileExt === 'heic') contentType = 'image/heic';
    else if (fileExt === 'jpg' || fileExt === 'jpeg') contentType = 'image/jpeg';

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadErr || !uploadData) {
      console.error('Supabase storage upload error:', uploadErr);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadErr?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to retrieve public URL for uploaded photo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: storagePath,
    });
  } catch (err: any) {
    console.error('Error uploading review photo:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to upload review photo' },
      { status: 500 }
    );
  }
}
