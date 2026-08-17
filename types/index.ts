export interface SizeMeasurement {
  length?: string;
  chest?: string;
  shoulder?: string;
  sleeve?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  mrp: number;
  sale_price?: number | null;
  category: string;
  nation?: string;
  front_img: string;
  back_img: string;
  images?: string[];
  sizes?: string[];
  stock?: number;
  stock_by_size?: Record<string, number>;
  size_chart?: Record<string, SizeMeasurement>;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export interface CustomerDetails {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  size: string;
  quantity: number;
  price: number;
  created_at?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  total_amount: number;
  payment_status: 'PENDING' | 'PAID' | 'FAILED';
  order_status: 'NEW' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface Review {
  id: string;
  product_id: string;
  rating: number;
  customer_name: string;
  comment: string;
  created_at: string;
}
