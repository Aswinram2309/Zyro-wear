import { NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { getAllProductsFromStore } from '@/database/stores/products-store';

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { amount, currency = 'INR', receipt, notes, items, customer } = body;

    let totalAmountPaise = 0;
    let validatedItems: any[] = [];
    let subtotal = 0;
    let shippingFee = 0;

    // Case 1: Direct amount provided (e.g., standard API testing or direct checkout)
    if (typeof amount === 'number' || (typeof amount === 'string' && !isNaN(Number(amount)))) {
      const numAmount = Number(amount);
      // If amount is passed in rupees vs paise: If amount < 100 and it's items, or if direct amount >= 100 paise
      // Per Razorpay standard spec: amount is in paise (minimum 100 paise = 1 INR)
      totalAmountPaise = Math.round(numAmount);
    } 
    // Case 2: Cart items provided (e-commerce flow)
    else if (items && Array.isArray(items) && items.length > 0) {
      const allProducts = await getAllProductsFromStore(false);

      const requestedQuantities: Record<string, number> = {};
      for (const item of items) {
        if (!item.productId || !item.size) {
          return NextResponse.json({ error: 'Missing product ID or size in checkout items' }, { status: 400 });
        }
        const key = `${item.productId}_${item.size}`;
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        requestedQuantities[key] = (requestedQuantities[key] || 0) + qty;
      }

      for (const item of items) {
        const product = allProducts.find((p) => p.id === item.productId);
        if (!product) {
          return NextResponse.json({ error: `Invalid product ID: ${item.productId}` }, { status: 400 });
        }

        const selectedSize = item.size;
        const key = `${item.productId}_${selectedSize}`;
        const totalRequested = requestedQuantities[key];
        const availableStock = product.stock_by_size?.[selectedSize] ?? 0;

        if (totalRequested > availableStock) {
          return NextResponse.json({
            error: `Requested quantity (${totalRequested}) for ${product.name} (Size: ${selectedSize}) exceeds available stock (${availableStock})`
          }, { status: 400 });
        }

        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        const itemPrice = product.sale_price || product.price;
        const itemSubtotal = itemPrice * qty;
        subtotal += itemSubtotal;

        validatedItems.push({
          productId: product.id,
          productName: product.name,
          size: selectedSize,
          quantity: qty,
          price: itemPrice,
        });
      }

      shippingFee = subtotal >= 999 ? 0 : 49;
      const totalAmountRupees = subtotal + shippingFee;
      totalAmountPaise = totalAmountRupees * 100;
    } else {
      return NextResponse.json({ error: 'Missing required field: amount (or valid cart items)' }, { status: 400 });
    }

    // Minimum amount validation: minimum 100 paise (1 INR)
    if (totalAmountPaise < 100) {
      return NextResponse.json(
        { error: 'Amount must be at least 100 paise (₹1.00)' },
        { status: 400 }
      );
    }

    // Initialize Razorpay client
    let razorpay;
    try {
      razorpay = getRazorpayClient();
    } catch (authError: any) {
      console.error('Razorpay Auth/Config Error:', authError.message);
      return NextResponse.json(
        { error: authError.message || 'Razorpay authentication failed' },
        { status: 401 }
      );
    }

    // Generate receipt identifier
    const orderReceipt = receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Create Order with Razorpay
    try {
      const razorpayOrder = await razorpay.orders.create({
        amount: totalAmountPaise,
        currency: currency || 'INR',
        receipt: orderReceipt,
        notes: notes || {
          customerName: customer?.fullName || '',
          customerPhone: customer?.phone || '',
        },
      });

      return NextResponse.json({
        success: true,
        order_id: razorpayOrder.id,
        id: razorpayOrder.id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        subtotal,
        shippingFee,
        validatedItems: validatedItems.length > 0 ? validatedItems : undefined,
      });
    } catch (rzpError: any) {
      console.error('Razorpay API Error:', rzpError);
      const statusCode = rzpError.statusCode || 500;
      return NextResponse.json(
        { error: rzpError.error?.description || rzpError.message || 'Razorpay order creation failed' },
        { status: statusCode === 401 ? 401 : 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in create-order endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
