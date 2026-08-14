import { NextResponse } from 'next/server';
import { updateProductInStore, toggleProductActiveInStore } from '@/lib/products-store';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const body = await req.json();

    if (body.price !== undefined) {
      const p = Number(body.price);
      if (isNaN(p) || p <= 0) {
        return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 });
      }
    }

    if (body.sale_price !== undefined && body.sale_price !== null && body.sale_price !== '') {
      const sp = Number(body.sale_price);
      const basePrice = body.price ? Number(body.price) : undefined;
      if (isNaN(sp) || sp <= 0) {
        return NextResponse.json({ error: 'Sale price must be valid positive number' }, { status: 400 });
      }
      if (basePrice && sp > basePrice) {
        return NextResponse.json({ error: 'Sale price cannot be greater than original price' }, { status: 400 });
      }
    }

    if (body.stock_by_size && typeof body.stock_by_size === 'object') {
      for (const [sz, qty] of Object.entries(body.stock_by_size)) {
        if (Number(qty) < 0) {
          return NextResponse.json({ error: `Stock for size ${sz} cannot be negative` }, { status: 400 });
        }
      }
    }

    const updated = await updateProductInStore(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Product not found or failed to update' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const ok = await toggleProductActiveInStore(id, false);
    return NextResponse.json({ success: ok, message: 'Product deactivated successfully' });
  } catch (error: any) {
    console.error('Error deactivating product:', error);
    return NextResponse.json({ error: error.message || 'Failed to deactivate product' }, { status: 500 });
  }
}
