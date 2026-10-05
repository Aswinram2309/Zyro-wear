import { NextResponse } from 'next/server';
import { getAllProductsFromStore } from '@/database/stores/products-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const products = await getAllProductsFromStore(false);
    return new Response(JSON.stringify({ success: true, products }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    console.error('Error fetching public products:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch products' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
