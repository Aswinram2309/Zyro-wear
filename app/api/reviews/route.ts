import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
      return NextResponse.json({ error: 'Database connection offline' }, { status: 500 });
    }

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      // If table is missing, return empty reviews list rather than failing
      if (error.message && error.message.includes('does not exist')) {
        return NextResponse.json({ success: true, reviews: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reviews });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, rating, customerName, comment } = body;

    if (!productId || !rating || !customerName || !comment) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    if (!customerName.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!comment.trim()) {
      return NextResponse.json({ error: 'Review comment is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection offline' }, { status: 500 });
    }

    // Check if product exists in database
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (prodError || !product) {
      return NextResponse.json({ error: 'Product does not exist' }, { status: 400 });
    }

    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        product_id: productId,
        rating: numRating,
        customer_name: customerName.trim(),
        comment: comment.trim(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, review });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
