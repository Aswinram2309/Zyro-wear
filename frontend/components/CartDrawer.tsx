'use client';

import React from 'react';
import { CartItem } from '@/shared/types';
import { calculateBuy3For999 } from '@/lib/pricing';

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
  // Use calculateBuy3For999 utility
  const promo = calculateBuy3For999(
    cart.map((item) => ({
      price: item.product.sale_price !== null && item.product.sale_price !== undefined ? Number(item.product.sale_price) : Number(item.product.price),
      quantity: item.quantity,
    }))
  );

  const totalItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const currentInBundle = totalItemCount % 3;
  const progressPercent = currentInBundle === 0 && totalItemCount > 0 ? 100 : (currentInBundle / 3) * 100;

  return (
    <>
      <div className={`cart-drawer ${isOpen ? 'active' : ''}`} id="cartDrawer">
        <div className="cart-drawer-header">
          <h3 className="cart-drawer-title">
            <i className="fa-solid fa-bag-shopping" style={{ color: '#FFC700', marginRight: '8px' }}></i>
            YOUR SHOPPING BAG ({totalItemCount})
          </h3>
          <button
            type="button"
            className="close-cart"
            aria-label="Close shopping cart"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* BUY 3 FOR ₹999 Promotional Offer Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #18191C 0%, #111215 100%)',
            borderBottom: '1px solid #2B2E36',
            padding: '12px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.5px', color: '#FFC700', textTransform: 'uppercase' }}>
              <i className="fa-solid fa-bolt" style={{ marginRight: '6px' }}></i>
              BUY 3 FOR ₹999 OFFER
            </span>
            {promo.isOfferApplied && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  border: '1px solid #10B981',
                  borderRadius: '20px',
                  padding: '2px 8px',
                }}
              >
                Saved ₹{promo.bundleDiscount}
              </span>
            )}
          </div>

          <p style={{ fontSize: '0.8rem', color: '#D1D5DB', margin: '0 0 8px 0', lineHeight: 1.4 }}>
            {promo.qualifyingGroups > 0 ? (
              promo.remainingUnits > 0 ? (
                <>
                  🎉 <strong>{promo.qualifyingGroups} combo{promo.qualifyingGroups > 1 ? 's' : ''} applied!</strong> Add{' '}
                  <strong style={{ color: '#FFC700' }}>
                    {promo.itemsNeededForNextCombo} more item{promo.itemsNeededForNextCombo > 1 ? 's' : ''}
                  </strong>{' '}
                  to grab another 3 for ₹999!
                </>
              ) : (
                <>
                  🎉 <strong>Combo deal unlocked!</strong> Add{' '}
                  <strong style={{ color: '#FFC700' }}>3 more items</strong> to get another bundle for ₹999.
                </>
              )
            ) : promo.itemsNeededForNextCombo === 1 ? (
              <>
                🔥 <strong>Almost there!</strong> Add{' '}
                <strong style={{ color: '#FFC700' }}>1 more item</strong> to get all 3 for ₹999!
              </>
            ) : promo.itemsNeededForNextCombo === 2 ? (
              <>
                🔥 Add <strong style={{ color: '#FFC700' }}>2 more items</strong> to get any 3 for ₹999!
              </>
            ) : (
              <>
                🔥 Add <strong style={{ color: '#FFC700' }}>3 eligible items</strong> to qualify for the ₹999 offer!
              </>
            )}
          </p>

          {/* Offer Progress Indicator */}
          <div
            style={{
              height: '6px',
              width: '100%',
              backgroundColor: '#262930',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #E6B800 0%, #FFC700 100%)',
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        <div className="cart-items-container">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <i className="fa-solid fa-bag-shopping empty-icon"></i>
              <h4>YOUR BAG IS EMPTY</h4>
              <p>Explore our collection and pick your favorite jersey!</p>
              <button className="btn-cart-empty-action" onClick={onClose}>
                <i className="fa-solid fa-shirt"></i> CONTINUE SHOPPING
              </button>
            </div>
          ) : (
            cart.map((item, idx) => {
              const itemPrice = item.product.sale_price !== null && item.product.sale_price !== undefined ? Number(item.product.sale_price) : Number(item.product.price);
              const maxStock = item.product.stock_by_size?.[item.size] ?? item.product.stock ?? 0;
              return (
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
                        aria-label="Remove item"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                    <span className="cart-item-size">SIZE: {item.size}</span>
                    <div className="cart-item-footer">
                      <div className="qty-controls">
                        <button 
                          type="button"
                          className="qty-btn" 
                          onClick={() => onUpdateQty(item.product.id, item.size, -1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="qty-num">{item.quantity}</span>
                        <button 
                          type="button"
                          className="qty-btn" 
                          onClick={() => onUpdateQty(item.product.id, item.size, 1)}
                          aria-label="Increase quantity"
                          disabled={item.quantity >= maxStock}
                        >
                          +
                        </button>
                      </div>
                      <span className="cart-item-price">₹{itemPrice * item.quantity}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-summary-line">
              <span>ORIGINAL TOTAL</span>
              <strong style={{ textDecoration: promo.isOfferApplied ? 'line-through' : 'none', color: promo.isOfferApplied ? '#9CA3AF' : '#FFF' }}>
                ₹{promo.originalSubtotal}
              </strong>
            </div>

            {promo.isOfferApplied && (
              <div className="cart-summary-line" style={{ color: '#10B981' }}>
                <span>
                  <i className="fa-solid fa-tag" style={{ marginRight: '6px' }}></i>
                  BUY 3 FOR ₹999 ({promo.qualifyingGroups} combo{promo.qualifyingGroups > 1 ? 's' : ''})
                </span>
                <strong>-₹{promo.bundleDiscount}</strong>
              </div>
            )}

            {promo.qualifyingGroups > 0 && promo.remainingUnits > 0 && (
              <div className="cart-summary-line subtext" style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                <span>{promo.remainingUnits} item{promo.remainingUnits > 1 ? 's' : ''} at regular price</span>
                <span>₹{promo.remainingSubtotal}</span>
              </div>
            )}

            <div className="cart-summary-line" style={{ borderTop: '1px solid #262930', paddingTop: '8px', marginTop: '4px' }}>
              <span>PRODUCT TOTAL</span>
              <strong className="summary-total" style={{ color: '#FFC700' }}>₹{promo.discountedProductTotal}</strong>
            </div>

            <div className="cart-summary-line subtext">
              <span>SHIPPING</span>
              <span>Calculated at checkout</span>
            </div>

            <button className="btn-checkout-primary" onClick={onProceedToCheckout}>
              <i className="fa-solid fa-lock"></i> PROCEED TO CHECKOUT — ₹{promo.discountedProductTotal}
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
