'use client';

import React from 'react';
import { CartItem } from '@/types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (productId: string, size: string, delta: number) => void;
  onRemoveItem: (productId: string, size: string) => void;
  onProceedToCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onProceedToCheckout,
}: CartDrawerProps) {
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const freeShippingThreshold = 999;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const amountRemaining = freeShippingThreshold - subtotal;

  return (
    <>
      <div className={`cart-drawer ${isOpen ? 'active' : ''}`} id="cartDrawer">
        <div className="cart-drawer-header">
          <h3 className="cart-drawer-title">
            <i className="fa-solid fa-bag-shopping" style={{ color: '#FFC700', marginRight: '8px' }}></i>
            YOUR SHOPPING BAG ({cart.reduce((sum, i) => sum + i.quantity, 0)})
          </h3>
          <button className="close-cart" onClick={onClose} aria-label="Close Shopping Bag">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Free Shipping Progress */}
        <div className="shipping-bar-container">
          <div className="shipping-bar-text">
            {amountRemaining > 0 ? (
              <>Add <strong className="text-gold-highlight">₹{amountRemaining}</strong> more for <strong className="text-gold-highlight">FREE EXPRESS SHIPPING</strong>!</>
            ) : (
              <>🎉 <strong className="text-gold-highlight">CONGRATS! YOU UNLOCKED FREE SHIPPING!</strong></>
            )}
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        <div className="cart-items-container">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <i className="fa-solid fa-bag-shopping empty-icon"></i>
              <h4>Your bag is currently empty</h4>
              <p>Explore our 2026 International Collection and pick your jersey!</p>
              <button className="btn-cart-empty-action" onClick={onClose}>
                <i className="fa-solid fa-shirt"></i> START SHOPPING
              </button>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.product.id}-${item.size}-${idx}`} className="cart-item">
                <img
                  src={item.product.front_img}
                  alt={item.product.name}
                  className="cart-item-img"
                />
                <div className="cart-item-details">
                  <div className="cart-item-header">
                    <h4 className="cart-item-name">{item.product.name}</h4>
                    <button
                      className="remove-item-btn"
                      onClick={() => onRemoveItem(item.product.id, item.size)}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                  <span className="cart-item-size">SIZE: {item.size}</span>
                  <div className="cart-item-footer">
                    <div className="qty-controls">
                      <button onClick={() => onUpdateQty(item.product.id, item.size, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.product.id, item.size, 1)}>+</button>
                    </div>
                    <span className="cart-item-price">₹{item.product.price * item.quantity}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-summary-line">
              <span>SUBTOTAL</span>
              <strong className="summary-total">₹{subtotal}</strong>
            </div>
            <div className="cart-summary-line subtext">
              <span>SHIPPING</span>
              <span>{subtotal >= freeShippingThreshold ? 'FREE' : '₹49'}</span>
            </div>

            <button className="btn-checkout-primary" onClick={onProceedToCheckout}>
              <i className="fa-solid fa-lock"></i> PROCEED TO CHECKOUT — ₹{subtotal >= freeShippingThreshold ? subtotal : subtotal + 49}
            </button>

            <div className="guarantee-badge">
              <i className="fa-solid fa-shield-check"></i> 100% Safe & Secure Checkout
            </div>
          </div>
        )}
      </div>

      {isOpen && <div className="backdrop active" id="cartBackdrop" onClick={onClose}></div>}
    </>
  );
}
