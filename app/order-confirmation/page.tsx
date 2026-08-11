'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || '#ZY1001';
  const customerName = searchParams.get('name') || 'Valued Customer';
  const totalAmount = searchParams.get('total') || '299';

  return (
    <div className="confirmation-page-container">
      <div className="confirmation-card">
        <div className="success-icon-badge">
          <i className="fa-solid fa-circle-check"></i>
        </div>

        <span className="confirmation-tag">ORDER SUCCESSFUL</span>
        <h1 className="confirmation-title">THANK YOU, {customerName.toUpperCase()}!</h1>
        <p className="confirmation-subtitle">
          Your order has been confirmed and placed into our processing queue.
        </p>

        <div className="order-details-box">
          <div className="detail-row">
            <span>Order Reference:</span>
            <strong className="order-num">#{orderNumber}</strong>
          </div>
          <div className="detail-row">
            <span>Payment Status:</span>
            <span className="status-badge paid"><i className="fa-solid fa-check"></i> PAID (Test Mode)</span>
          </div>
          <div className="detail-row">
            <span>Total Paid:</span>
            <strong className="order-amount">₹{totalAmount}</strong>
          </div>
          <div className="detail-row">
            <span>Estimated Delivery:</span>
            <span>3 - 5 Business Days</span>
          </div>
        </div>

        <div className="confirmation-instructions">
          <h4><i className="fa-solid fa-truck-fast"></i> What happens next?</h4>
          <ul>
            <li>We have logged your order details and items into the database.</li>
            <li>Our dispatch team will inspect and package your jerseys.</li>
            <li>Tracking links will be generated when your order status updates to SHIPPED.</li>
          </ul>
        </div>

        <div className="confirmation-actions">
          <Link href="/" className="btn-primary">
            <i className="fa-solid fa-bag-shopping"></i> CONTINUE SHOPPING
          </Link>
          <a
            href={`https://wa.me/917200515977?text=${encodeURIComponent(
              `Hi ZYRO Wear, I just placed order #${orderNumber} for ₹${totalAmount}. Please update me on shipping!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp-full"
            style={{ width: 'auto', padding: '12px 24px' }}
          >
            <i className="fa-brands fa-whatsapp"></i> TRACK ORDER ON WHATSAPP
          </a>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="confirmation-page-container"><p>Loading order details...</p></div>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
