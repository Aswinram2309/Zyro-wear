import { NextResponse } from 'next/server';
import { createAdminClient } from '@/database/client/admin';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: true, reviews: [] });
    }

    let query = supabase.from('reviews').select('*');
    if (productId !== 'all') {
      query = query.eq('product_id', productId.trim());
    }
    const { data: reviews, error } = await query.order('created_at', { ascending: false }).limit(100);

    if (error) {
      if (error.message && error.message.includes('does not exist')) {
        return NextResponse.json({ success: true, reviews: [] });
      }
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    return NextResponse.json({ success: true, reviews: reviews || [] });
  } catch (err: any) {
    console.error('Error fetching reviews:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`review_post:${clientIp}`, 15, 600); // 15 reviews per 10 min

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many reviews submitted. Please try again later.' },
        { status: 429 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { productId, rating, customerName, comment, photoUrl, imageUrl, storagePath } = body;
    const finalPhoto = photoUrl || imageUrl || null;

    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      return NextResponse.json({ error: 'Valid Product ID is required' }, { status: 400 });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
      return NextResponse.json({ error: 'Your name is required' }, { status: 400 });
    }

    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      return NextResponse.json({ error: 'Review comment is required' }, { status: 400 });
    }

    const sanitizedName = customerName.trim().slice(0, 60);
    const sanitizedComment = comment.trim().slice(0, 1000);

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    // Verify product exists in database
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId.trim())
      .maybeSingle();

    if (prodError || !product) {
      if (storagePath) {
        await supabase.storage.from('review-images').remove([storagePath]).catch(() => {});
      }
      return NextResponse.json({ error: 'Referenced product does not exist' }, { status: 400 });
    }

    const payload: any = {
      product_id: productId.trim(),
      rating: Math.round(numRating),
      customer_name: sanitizedName,
      comment: sanitizedComment,
    };
    if (finalPhoto && typeof finalPhoto === 'string') {
      payload.image_url = finalPhoto.trim();
    }

    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      if (storagePath) {
        await supabase.storage.from('review-images').remove([storagePath]).catch(() => {});
      }
      console.error('Error inserting review:', insertError);
      return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
    }

    return NextResponse.json({ success: true, review });
  } catch (err: any) {
    console.error('Reviews POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
