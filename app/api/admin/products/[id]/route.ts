import { NextResponse } from 'next/server';
import { updateProductInStore, toggleProductActiveInStore } from '@/database/stores/products-store';
import { revalidatePath } from 'next/cache';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

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

    // Invalidate server-side page cache so storefront and product details update instantly
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/admin/stock');
      revalidatePath('/product/[slug]', 'page');
    } catch (e) {}

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const ok = await toggleProductActiveInStore(id, false);

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/admin/stock');
    } catch (e) {}

    return NextResponse.json({ success: ok, message: 'Product deactivated successfully' });
  } catch (error: any) {
    console.error('Error deactivating product:', error);
    return NextResponse.json({ error: 'Failed to deactivate product' }, { status: 500 });
  }
}
