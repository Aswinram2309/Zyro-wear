import { NextResponse } from 'next/server';
import { getAllProductsFromStore, saveNewProductToStore } from '@/lib/products-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const products = await getAllProductsFromStore(true);
    return new Response(JSON.stringify({ success: true, products }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin products:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to fetch products' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      slug,
      description,
      category,
      price,
      mrp,
      sale_price,
      front_img,
      back_img,
      sizes,
      stock_by_size,
      is_active,
    } = body;

    // Client & Server Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Product description is required' }, { status: 400 });
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json({ error: 'Product category is required' }, { status: 400 });
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json({ error: 'Valid price greater than 0 is required' }, { status: 400 });
    }

    const numMrp = mrp ? Number(mrp) : numPrice;
    if (isNaN(numMrp) || numMrp < numPrice) {
      return NextResponse.json({ error: 'Original Price (MRP) cannot be less than current price' }, { status: 400 });
    }

    let numSalePrice: number | null = null;
    if (sale_price !== undefined && sale_price !== null && sale_price !== '') {
      numSalePrice = Number(sale_price);
      if (isNaN(numSalePrice) || numSalePrice <= 0) {
        return NextResponse.json({ error: 'Special offer price must be a valid positive number' }, { status: 400 });
      }
      if (numSalePrice > numPrice) {
        return NextResponse.json({ error: 'Special offer price cannot be greater than original price' }, { status: 400 });
      }
    }

    if (!Array.isArray(sizes) || sizes.length === 0) {
      return NextResponse.json({ error: 'At least one size must be selected' }, { status: 400 });
    }

    if (!stock_by_size || typeof stock_by_size !== 'object') {
      return NextResponse.json({ error: 'Size-wise stock numbers are required' }, { status: 400 });
    }

    for (const sz of sizes) {
      const szQty = Number(stock_by_size[sz]);
      if (isNaN(szQty) || szQty < 0) {
        return NextResponse.json({ error: `Stock quantity for size ${sz} cannot be negative` }, { status: 400 });
      }
    }

    if (!front_img || typeof front_img !== 'string' || !front_img.trim()) {
      return NextResponse.json({ error: 'Front product image is required' }, { status: 400 });
    }
    if (!back_img || typeof back_img !== 'string' || !back_img.trim()) {
      return NextResponse.json({ error: 'Back product image is required' }, { status: 400 });
    }

    const createdProduct = await saveNewProductToStore({
      name: name.trim(),
      slug: slug || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description.trim(),
      category: category.trim(),
      price: numSalePrice ? numSalePrice : numPrice,
      mrp: numMrp,
      sale_price: numSalePrice,
      front_img,
      back_img,
      images: [front_img, back_img],
      sizes,
      stock_by_size,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    });

    return NextResponse.json({ success: true, product: createdProduct }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
