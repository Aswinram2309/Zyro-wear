'use client';

import React, { useState } from 'react';
import { calculateBuy3For999 } from '@/lib/pricing';
import { CartItem } from '@/shared/types';

interface PromoOfferPopupProps {
  cart: CartItem[];
  onOpenCart?: () => void;
}

export default function PromoOfferPopup({ cart, onOpenCart }: PromoOfferPopupProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const promo = calculateBuy3For999(
    cart.map((item) => ({
      price: item.product.sale_price !== null && item.product.sale_price !== undefined ? Number(item.product.sale_price) : Number(item.product.price),
      quantity: item.quantity,
    }))
  );

  const totalUnits = promo.totalUnits;
  const currentInBundle = totalUnits % 3;
  const progressPercent = currentInBundle === 0 && totalUnits > 0 ? 100 : (currentInBundle / 3) * 100;
  const itemsNeeded = promo.itemsNeededForNextCombo;

  if (isDismissed) {
    return (
      <button
        onClick={() => setIsDismissed(false)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 998,
          background: 'linear-gradient(135deg, #1A1C20 0%, #0F1012 100%)',
          border: '1px solid #FFC700',
          borderRadius: '50px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#FFC700',
          fontSize: '0.78rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          transition: 'all 0.2s ease',
        }}
        title="View Buy 3 for ₹999 Offer"
        aria-label="View Buy 3 for ₹999 promotional offer"
      >
        <i className="fa-solid fa-tag"></i>
        <span>3 FOR ₹999</span>
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 998,
        maxWidth: '340px',
        width: 'calc(100vw - 40px)',
        background: 'rgba(18, 20, 24, 0.96)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 199, 0, 0.4)',
        borderRadius: '12px',
        padding: '12px 14px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
        animation: 'fadeInUp 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              background: '#FFC700',
              color: '#000',
              fontSize: '0.68rem',
              fontWeight: 900,
              padding: '2px 6px',
              borderRadius: '4px',
              letterSpacing: '0.5px',
            }}
          >
            OFFER
          </span>
          <strong style={{ fontSize: '0.82rem', color: '#FFF', letterSpacing: '0.3px' }}>
            BUY 3 FOR ₹999
          </strong>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#9CA3AF',
            fontSize: '1rem',
            cursor: 'pointer',
            padding: '0 4px',
            lineHeight: 1,
          }}
          aria-label="Dismiss promotional offer banner"
        >
          &times;
        </button>
      </div>

      <p style={{ margin: '0 0 8px 0', fontSize: '0.78rem', color: '#D1D5DB', lineHeight: 1.4 }}>
        {promo.qualifyingGroups > 0 ? (
          promo.remainingUnits > 0 ? (
            <>
              🎉 <strong style={{ color: '#10B981' }}>Combo Applied!</strong> Add{' '}
              <strong style={{ color: '#FFC700' }}>
                {itemsNeeded} more product{itemsNeeded > 1 ? 's' : ''}
              </strong>{' '}
              to get another bundle for ₹999!
            </>
          ) : (
            <>
              🎉 <strong style={{ color: '#10B981' }}>{promo.qualifyingGroups} Combo Bundle{promo.qualifyingGroups > 1 ? 's' : ''} Active!</strong> Add 3 more for another ₹999 bundle.
            </>
          )
        ) : itemsNeeded === 1 ? (
          <>
            ⚡ <strong>Almost there!</strong> Add <strong style={{ color: '#FFC700' }}>1 more product</strong> to qualify for 3 for ₹999!
          </>
        ) : itemsNeeded === 2 ? (
          <>
            🔥 Add <strong style={{ color: '#FFC700' }}>2 more products</strong> to qualify for 3 for ₹999!
          </>
        ) : (
          <>
            🔥 Add <strong style={{ color: '#FFC700' }}>3 eligible products</strong> to get all 3 for ₹999!
          </>
        )}
      </p>

      {/* Progress Bar */}
      <div
        style={{
          height: '5px',
          width: '100%',
          backgroundColor: '#262930',
          borderRadius: '3px',
          overflow: 'hidden',
          marginBottom: '8px',
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
        <span style={{ color: '#9CA3AF' }}>
          {totalUnits} item{totalUnits !== 1 ? 's' : ''} in cart
        </span>
        {onOpenCart && (
          <button
            onClick={onOpenCart}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFC700',
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            View Bag ({totalUnits}) →
          </button>
        )}
      </div>
    </div>
  );
}
