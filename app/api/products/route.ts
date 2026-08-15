import { NextResponse } from 'next/server';
import { getAllProductsFromStore } from '@/lib/products-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const products = await getAllProductsFromStore(false);
    return new Response(JSON.stringify({ success: true, products }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error fetching public products:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to fetch products' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  }
}
