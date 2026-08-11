'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminOrder {
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
  payment_status: string;
  order_status: string;
  created_at: string;
  items?: Array<{
    id: string;
    product_name: string;
    size: string;
    quantity: number;
    price: number;
  }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Check auth
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('zyro_admin_auth');
    if (!isAuthenticated) {
      router.push('/admin/login');
    } else {
      fetchOrders();
    }
  }, [router]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.orders && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus } : o))
        );
      } else {
        alert('Failed to update order status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('zyro_admin_auth');
    router.push('/admin/login');
  };

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'ALL') return true;
    return o.order_status === activeFilter;
  });

  return (
    <div className="admin-dashboard-container">
      {/* Admin Navbar */}
      <header className="admin-nav">
        <div className="admin-nav-inner">
          <div className="admin-brand">
            <img src="/Logo/Zyro wears logo.png" alt="ZYRO Admin" className="admin-brand-logo" />
            <span className="admin-title">ADMIN DASHBOARD</span>
          </div>

          <div className="admin-actions">
            <Link href="/" className="btn-secondary-sm">
              <i className="fa-solid fa-store"></i> View Store
            </Link>
            <button className="btn-logout" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket"></i> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="admin-main">
        <div className="admin-header-row">
          <div>
            <h2>Order Management</h2>
            <p>View, manage and update customer order fulfillment statuses.</p>
          </div>

          <button className="btn-refresh" onClick={fetchOrders}>
            <i className="fa-solid fa-arrows-rotate"></i> Refresh Orders
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="admin-tabs">
          {['ALL', 'NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((status) => (
            <button
              key={status}
              className={`admin-tab ${activeFilter === status ? 'active' : ''}`}
              onClick={() => setActiveFilter(status)}
            >
              {status} ({orders.filter((o) => status === 'ALL' || o.order_status === status).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="admin-loading-box">
            <i className="fa-solid fa-spinner fa-spin"></i> Loading order database...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="admin-empty-box">
            <i className="fa-solid fa-box-open"></i>
            <h3>No orders found for &quot;{activeFilter}&quot; status</h3>
            <p>Customer checkout orders will appear here automatically when placed.</p>
          </div>
        ) : (
          <div className="admin-orders-list">
            {filteredOrders.map((order) => (
              <div key={order.id} className="admin-order-card">
                <div className="order-card-header">
                  <div className="order-header-left">
                    <span className="admin-order-num">ORDER #{order.order_number}</span>
                    <span className="order-date">
                      {new Date(order.created_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>

                  <div className="order-header-right">
                    <span className={`payment-pill ${order.payment_status.toLowerCase()}`}>
                      PAYMENT: {order.payment_status}
                    </span>
                    <span className={`status-pill ${order.order_status.toLowerCase()}`}>
                      STATUS: {order.order_status}
                    </span>
                  </div>
                </div>

                <div className="order-card-body">
                  {/* Customer Information */}
                  <div className="customer-info-box">
                    <h4><i className="fa-solid fa-user"></i> Customer Details</h4>
                    <p className="cust-name"><strong>Name:</strong> {order.customer_name}</p>
                    <p className="cust-phone"><strong>Phone:</strong> {order.phone}</p>
                    <p className="cust-email"><strong>Email:</strong> {order.email}</p>
                    <p className="cust-address">
                      <strong>Delivery Address:</strong> {order.address}, {order.city}, {order.state} - {order.pincode}
                    </p>
                  </div>

                  {/* Products Ordered */}
                  <div className="products-info-box">
                    <h4><i className="fa-solid fa-shirt"></i> Products Ordered</h4>
                    <div className="order-items-table">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <div key={idx} className="admin-item-row">
                            <span className="item-name">{item.product_name}</span>
                            <span className="item-size">Size: <strong>{item.size}</strong></span>
                            <span className="item-qty">Qty: <strong>{item.quantity}</strong></span>
                            <span className="item-price">₹{item.price * item.quantity}</span>
                          </div>
                        ))
                      ) : (
                        <p className="no-items-text">Item data recorded</p>
                      )}
                    </div>

                    <div className="order-total-bar">
                      <span>Total Amount:</span>
                      <strong className="grand-price">₹{order.total_amount}</strong>
                    </div>
                  </div>
                </div>

                {/* Status Controls */}
                <div className="order-card-footer">
                  <span className="update-label">Update Order Status:</span>
                  <div className="status-button-group">
                    {['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((st) => (
                      <button
                        key={st}
                        className={`btn-status-change ${order.order_status === st ? 'current' : ''}`}
                        disabled={updatingId === order.id || order.order_status === st}
                        onClick={() => handleStatusChange(order.id, st)}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
