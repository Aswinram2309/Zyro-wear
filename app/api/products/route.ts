import { NextResponse } from 'next/server';
import { getAllProductsFromStore } from '@/lib/products-store';

export async function GET() {
  try {
    const products = await getAllProductsFromStore(false);
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('Error fetching public products:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}
