import fs from 'fs';
import path from 'path';
import { createAdminClient } from './supabase/admin';

const ORDERS_FILE_PATH = path.join(process.cwd(), 'data', 'orders.json');

function ensureDataDirExists() {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(ORDERS_FILE_PATH)) {
    fs.writeFileSync(ORDERS_FILE_PATH, JSON.stringify([]), 'utf-8');
  }
}

export async function saveOrderToStore(orderPayload: {
  orderNumber: string;
  customer: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    product_id: string;
    product_name: string;
    size: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  totalAmount: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}) {
  const supabase = createAdminClient();

  const orderRecord = {
    id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    order_number: orderPayload.orderNumber,
    customer_name: orderPayload.customer.fullName,
    phone: orderPayload.customer.phone,
    email: orderPayload.customer.email,
    address: orderPayload.customer.address,
    city: orderPayload.customer.city || '',
    state: orderPayload.customer.state || '',
    pincode: orderPayload.customer.pincode || '',
    subtotal: orderPayload.subtotal,
    total_amount: orderPayload.totalAmount,
    payment_status: 'PAID',
    order_status: 'NEW',
    razorpay_order_id: orderPayload.razorpayOrderId || `order_test_${Date.now()}`,
    razorpay_payment_id: orderPayload.razorpayPaymentId || `pay_test_${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: orderPayload.items,
  };

  // 1. Try inserting to Supabase if configured
  if (supabase) {
    try {
      const { data: dbOrder, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_number: orderRecord.order_number,
          customer_name: orderRecord.customer_name,
          phone: orderRecord.phone,
          email: orderRecord.email,
          address: orderRecord.address,
          city: orderRecord.city,
          state: orderRecord.state,
          pincode: orderRecord.pincode,
          subtotal: orderRecord.subtotal,
          total_amount: orderRecord.total_amount,
          payment_status: orderRecord.payment_status,
          order_status: orderRecord.order_status,
          razorpay_order_id: orderRecord.razorpay_order_id,
          razorpay_payment_id: orderRecord.razorpay_payment_id,
        })
        .select('id')
        .single();

      if (orderErr) {
        console.error('Supabase order insert error:', orderErr);
      } else if (dbOrder) {
        const dbItems = orderPayload.items.map((item) => ({
          order_id: dbOrder.id,
          product_id: item.product_id,
          product_name: item.product_name,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
        }));
        await supabase.from('order_items').insert(dbItems);
      }
    } catch (e) {
      console.error('Supabase save error:', e);
    }
  }

  // 2. Always persist in local JSON store
  try {
    ensureDataDirExists();
    const raw = fs.readFileSync(ORDERS_FILE_PATH, 'utf-8');
    const ordersList = JSON.parse(raw || '[]');
    ordersList.unshift(orderRecord);
    fs.writeFileSync(ORDERS_FILE_PATH, JSON.stringify(ordersList, null, 2), 'utf-8');
  } catch (e) {
    console.error('Local JSON save error:', e);
  }

  return orderRecord;
}

export async function getAllOrdersFromStore() {
  const supabase = createAdminClient();

  if (supabase) {
    try {
      const { data: dbOrders, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!ordersErr && dbOrders && dbOrders.length > 0) {
        const { data: allItems } = await supabase.from('order_items').select('*');

        const ordersWithItems = dbOrders.map((order) => ({
          ...order,
          items: allItems
            ? allItems.filter((i) => i.order_id === order.id)
            : [],
        }));

        return ordersWithItems;
      }
    } catch (e) {
      console.error('Supabase fetch error, falling back to local file:', e);
    }
  }

  // Read local file fallback
  try {
    ensureDataDirExists();
    const raw = fs.readFileSync(ORDERS_FILE_PATH, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('Error reading local orders:', e);
    return [];
  }
}

export async function updateOrderStatusInStore(orderId: string, newStatus: string) {
  const supabase = createAdminClient();

  if (supabase) {
    try {
      await supabase
        .from('orders')
        .update({ order_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    } catch (e) {
      console.error('Supabase status update error:', e);
    }
  }

  // Also update local file
  try {
    ensureDataDirExists();
    const raw = fs.readFileSync(ORDERS_FILE_PATH, 'utf-8');
    const ordersList = JSON.parse(raw || '[]');
    const updatedList = ordersList.map((o: any) =>
      o.id === orderId || o.order_number === orderId ? { ...o, order_status: newStatus } : o
    );
    fs.writeFileSync(ORDERS_FILE_PATH, JSON.stringify(updatedList, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error updating local order status:', e);
  }
}
