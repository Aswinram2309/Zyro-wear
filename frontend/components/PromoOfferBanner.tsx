'use client';

import React from 'react';
import { calculateBuy3For999 } from '@/lib/pricing';
import { CartItem } from '@/shared/types';

interface PromoOfferBannerProps {
  cart: CartItem[];
  variant?: 'store' | 'product';
  onOpenCart?: () => void;
}

export default function PromoOfferBanner({ cart, variant = 'store', onOpenCart }: PromoOfferBannerProps) {
  const promo = calculateBuy3For999(
    cart.map((item) => ({
      price: item.product.sale_price !== null && item.product.sale_price !== undefined ? Number(item.product.sale_price) : Number(item.product.price),
      quantity: item.quantity,
    }))
  );

  const itemsNeeded = promo.itemsNeededForNextCombo;
  const currentInBundle = promo.totalUnits % 3;
  const progressPercent = currentInBundle === 0 && promo.totalUnits > 0 ? 100 : (currentInBundle / 3) * 100;

  if (variant === 'product') {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(255, 199, 0, 0.08) 0%, rgba(255, 199, 0, 0.02) 100%)',
          border: '1px solid rgba(255, 199, 0, 0.3)',
          borderRadius: '10px',
          padding: '12px 14px',
          margin: '12px 0 16px 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: '#FFC700',
                color: '#000',
                fontWeight: 900,
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: '4px',
                letterSpacing: '0.5px',
              }}
            >
              SPECIAL OFFER
            </span>
            <strong style={{ fontSize: '0.85rem', color: '#FFF' }}>
              BUY 3 PRODUCTS FOR ₹999
            </strong>
          </div>
          {promo.isOfferApplied && (
            <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>
              ✓ Offer active ({promo.qualifyingGroups}x)
            </span>
          )}
        </div>

        <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#D1D5DB', lineHeight: 1.4 }}>
          {promo.qualifyingGroups > 0 ? (
            promo.remainingUnits > 0 ? (
              <>
                Add <strong style={{ color: '#FFC700' }}>{itemsNeeded} more product{itemsNeeded > 1 ? 's' : ''}</strong> to unlock another 3 for ₹999 bundle!
              </>
            ) : (
              <>
                🎉 You have unlocked 3 for ₹999! Add 3 more for another bundle.
              </>
            )
          ) : itemsNeeded === 1 ? (
            <>
              ⚡ <strong>Almost there!</strong> Add <strong style={{ color: '#FFC700' }}>1 more product</strong> to qualify for the ₹999 combo!
            </>
          ) : itemsNeeded === 2 ? (
            <>
              🔥 Add <strong style={{ color: '#FFC700' }}>2 more products</strong> to qualify for the ₹999 combo!
            </>
          ) : (
            <>
              🔥 Mix & match any 3 eligible products (Jerseys & Oversized T-Shirts) for just <strong style={{ color: '#FFC700' }}>₹999</strong>!
            </>
          )}
        </p>

        {/* Mini progress */}
        <div
          style={{
            height: '4px',
            width: '100%',
            backgroundColor: '#262930',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: '#FFC700',
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>
    );
  }

  // Store variant
  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #16181C 0%, #1D1F24 50%, #16181C 100%)',
        border: '1px solid rgba(255, 199, 0, 0.3)',
        borderRadius: '12px',
        padding: '14px 20px',
        margin: '0 auto 24px auto',
        maxWidth: '1200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'rgba(255, 199, 0, 0.15)',
            color: '#FFC700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            flexShrink: 0,
          }}
        >
          <i className="fa-solid fa-fire"></i>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ color: '#FFC700', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
              BUY 3 PRODUCTS FOR ₹999
            </strong>
            <span
              style={{
                fontSize: '0.7rem',
                background: '#FFC700',
                color: '#000',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              LIMITED TIME
            </span>
          </div>
          <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#D1D5DB' }}>
            {promo.qualifyingGroups > 0 ? (
              promo.remainingUnits > 0 ? (
                <>
                  🎉 <strong style={{ color: '#10B981' }}>{promo.qualifyingGroups} Bundle{promo.qualifyingGroups > 1 ? 's' : ''} Applied!</strong> Add{' '}
                  <strong style={{ color: '#FFC700' }}>{itemsNeeded} more product{itemsNeeded > 1 ? 's' : ''}</strong> to qualify for another bundle!
                </>
              ) : (
                <>
                  🎉 <strong style={{ color: '#10B981' }}>Offer unlocked!</strong> Add 3 more products for another ₹999 bundle!
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
                Mix & match any 3 eligible products (Oversized T-Shirts & Jerseys) for only ₹999!
              </>
            )}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ textAlign: 'right', display: 'none' }}>
          {/* spacer */}
        </div>
        {onOpenCart && (
          <button
            onClick={onOpenCart}
            style={{
              background: '#FFC700',
              color: '#000',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
            }}
          >
            VIEW BAG ({promo.totalUnits})
          </button>
        )}
      </div>
    </div>
  );
}
