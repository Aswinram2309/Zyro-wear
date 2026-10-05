import { NextResponse } from 'next/server';
import { createAdminClient } from '@/database/client/admin';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`review_upload:${clientIp}`, 10, 600); // 10 uploads per 10 min

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Upload limit reached. Please wait a few minutes before uploading another photo.' },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawProductId = (formData.get('productId') as string) || 'general';
    const productId = rawProductId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);

    if (!file) {
      return NextResponse.json({ error: 'No photo file provided' }, { status: 400 });
    }

    const fileNameLower = file.name.toLowerCase();
    const fileExt = (fileNameLower.split('.').pop() || '').toLowerCase();
    const allowedExts = ['jpeg', 'jpg', 'png', 'webp', 'heic'];

    const isAllowedExt = allowedExts.includes(fileExt);
    const isAllowedType = file.type
      ? file.type.startsWith('image/') || file.type === 'application/octet-stream'
      : true;

    if (!isAllowedExt || !isAllowedType) {
      return NextResponse.json(
        { error: 'Invalid file format. Allowed formats: .jpg, .jpeg, .png, .webp, .heic' },
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
        { error: 'Database and storage service currently unavailable' },
        { status: 500 }
      );
    }

    const BUCKET_NAME = 'review-images';
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(fileExt) ? fileExt : 'jpg';
    const storagePath = `reviews/${productId}/${uniqueId}.${safeExt}`;

    let contentType = file.type || 'image/jpeg';
    if (fileExt === 'png') contentType = 'image/png';
    else if (fileExt === 'webp') contentType = 'image/webp';
    else if (fileExt === 'heic') contentType = 'image/heic';
    else if (fileExt === 'jpg' || fileExt === 'jpeg') contentType = 'image/jpeg';

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadErr || !uploadData) {
      console.error('Supabase review storage upload error:', uploadErr);
      return NextResponse.json(
        { error: 'Failed to upload photo to storage bucket' },
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
      { error: 'Failed to upload review photo' },
      { status: 500 }
    );
  }
}
