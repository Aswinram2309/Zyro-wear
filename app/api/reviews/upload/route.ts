import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const productId = (formData.get('productId') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No photo uploaded' }, { status: 400 });
    }

    const fileExt = (file.name.split('.').pop() || '').toLowerCase();
    const allowedExts = ['jpeg', 'jpg', 'png', 'heic'];
    if (!allowedExts.includes(fileExt)) {
      return NextResponse.json({ error: 'Invalid file format. Allowed: .jpeg, .jpg, .png, .heic' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'reviews');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `review_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/reviews/${filename}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err: any) {
    console.error('Error uploading review photo:', err);
    return NextResponse.json({ error: err.message || 'Failed to upload review photo' }, { status: 500 });
  }
}
