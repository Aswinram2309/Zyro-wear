import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createAdminClient } from '@/database/client/admin';
import { getAllOrdersFromStore } from '@/database/stores/orders-store';
import { getAllProductsFromStore } from '@/database/stores/products-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const exportType = (searchParams.get('type') || 'orders').toLowerCase();
    const currentDate = new Date().toISOString().split('T')[0];

    let rows: any[] = [];
    let sheetName = 'Export';
    let filename = `ZYRO_Export_${currentDate}.xlsx`;

    const supabase = createAdminClient();

    if (exportType === 'orders') {
      sheetName = 'Orders';
      filename = `ZYRO_Orders_${currentDate}.xlsx`;
      const orders = await getAllOrdersFromStore();

      rows = orders.map((o: any) => {
        const itemsSummary = (o.items || [])
          .map((item: any) => `${item.product_name || item.product_id} [Size: ${item.size}, Qty: ${item.quantity}, ₹${item.price}]`)
          .join('; ');

        const orderNum = o.order_number
          ? (o.order_number.startsWith('#') ? o.order_number : `#${o.order_number}`)
          : o.id;

        const subtotal = Number(o.subtotal) || 0;
        const grandTotal = Number(o.total_amount) || 0;
        const shippingFee = grandTotal - subtotal;

        return {
          'Order Number': orderNum,
          'Order Date': o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : '',
          'Customer Name': o.customer_name || '',
          'Phone': o.phone || '',
          'Alt Phone': o.alt_phone || '',
          'Email': o.email || '',
          'Address': o.address || '',
          'City': o.city || '',
          'State': o.state || '',
          'Pincode': o.pincode || '',
          'Items Purchased': itemsSummary || 'No item details',
          'Subtotal (₹)': subtotal,
          'Shipping Charges (₹)': Math.max(0, shippingFee),
          'Grand Total (₹)': grandTotal,
          'Payment Status': o.payment_status || 'PAID',
          'Order Status': o.order_status || 'NEW',
          'Razorpay Order ID': o.razorpay_order_id || '',
          'Razorpay Payment ID': o.razorpay_payment_id || '',
        };
      });

    } else if (exportType === 'products' || exportType === 'stock') {
      sheetName = 'Products & Stock';
      filename = `ZYRO_Products_${currentDate}.xlsx`;
      const products = await getAllProductsFromStore(true);

      rows = products.map((p: any) => {
        const stockMap = p.stock_by_size || {};
        const mrp = Number(p.mrp) || 699;
        const offerPrice = p.sale_price !== null && p.sale_price !== undefined ? Number(p.sale_price) : null;
        const activeSellingPrice = offerPrice !== null ? offerPrice : (Number(p.price) || 299);
        const totalStock = Object.values(stockMap).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) || Number(p.stock) || 0;

        return {
          'Product ID': p.id || '',
          'Product Name': p.name || '',
          'Category': p.category || '',
          'Nation / Tag': p.nation || 'N/A',
          'Original Price (MRP ₹)': mrp,
          'Special Offer Price (₹)': offerPrice !== null ? offerPrice : 'N/A',
          'Actual Selling Price (₹)': activeSellingPrice,
          'Stock S': stockMap['S'] ?? 0,
          'Stock M': stockMap['M'] ?? 0,
          'Stock L': stockMap['L'] ?? 0,
          'Stock XL': stockMap['XL'] ?? 0,
          'Stock XXL': stockMap['XXL'] ?? 0,
          'Total Stock': totalStock,
          'Active Status': p.is_active !== false ? 'Active' : 'Deactivated',
          'Created Date': p.created_at ? new Date(p.created_at).toLocaleString('en-IN') : '',
        };
      });

    } else if (exportType === 'customers') {
      sheetName = 'Customers';
      filename = `ZYRO_Customers_${currentDate}.xlsx`;
      const orders = await getAllOrdersFromStore();

      const customerMap = new Map<string, any>();

      for (const o of orders) {
        const key = (o.phone || o.customer_name || '').trim().toLowerCase();
        if (!key) continue;

        const spend = Number(o.total_amount) || 0;
        const orderDate = o.created_at || '';

        if (!customerMap.has(key)) {
          customerMap.set(key, {
            'Customer Name': o.customer_name || '',
            'Primary Phone': o.phone || '',
            'Alt Phone': o.alt_phone || '',
            'Email': o.email || '',
            'Delivery Address': o.address || '',
            'City': o.city || '',
            'State': o.state || '',
            'Pincode': o.pincode || '',
            'Total Orders Placed': 1,
            'Total Spend (₹)': spend,
            'Last Order Date': orderDate ? new Date(orderDate).toLocaleString('en-IN') : '',
          });
        } else {
          const existing = customerMap.get(key);
          existing['Total Orders Placed'] += 1;
          existing['Total Spend (₹)'] += spend;
          if (orderDate && new Date(orderDate) > new Date(existing['Last Order Date'])) {
            existing['Last Order Date'] = new Date(orderDate).toLocaleString('en-IN');
          }
        }
      }

      rows = Array.from(customerMap.values());

    } else if (exportType === 'reviews') {
      sheetName = 'Reviews';
      filename = `ZYRO_Reviews_${currentDate}.xlsx`;

      let dbReviews: any[] = [];
      if (supabase) {
        const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          dbReviews = data;
        }
      }

      const allProducts = await getAllProductsFromStore(true);
      const prodMap = new Map(allProducts.map((p) => [p.id, p.name]));

      rows = dbReviews.map((r: any) => ({
        'Review ID': r.id || '',
        'Product ID': r.product_id || '',
        'Product Name': prodMap.get(r.product_id) || r.product_id || 'Unknown',
        'Customer Name': r.customer_name || '',
        'Rating': `${r.rating || 5} Stars`,
        'Review Comment': r.comment || '',
        'Has Photo': r.image_url ? 'Yes' : 'No',
        'Photo URL': r.image_url || 'N/A',
        'Review Date': r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : '',
      }));

    } else {
      return NextResponse.json({ error: 'Invalid export type. Allowed: orders, products, customers, reviews' }, { status: 400 });
    }

    if (rows.length === 0) {
      // Return empty worksheet with standard headers
      rows = [{ 'Notice': `No records found for ${sheetName}` }];
    }

    // Generate Excel worksheet using SheetJS
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-fit column widths
    const columnKeys = Object.keys(rows[0] || {});
    const columnWidths = columnKeys.map((key) => {
      const maxLen = Math.max(
        key.length,
        ...rows.map((row) => (row[key] !== null && row[key] !== undefined ? String(row[key]).length : 0))
      );
      return { wch: Math.min(Math.max(maxLen + 3, 12), 65) };
    });
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error: any) {
    console.error('Export Excel API Error:', error);
    return NextResponse.json({ error: error.message || 'Error generating Excel export' }, { status: 500 });
  }
}
