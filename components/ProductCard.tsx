'use client';

import React, { useState } from 'react';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
  onBuyNow: (product: Product, size: string) => void;
}

export default function ProductCard({
  product,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
}: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<string>('L');

  const handleAddCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, selectedSize, 1);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBuyNow(product, selectedSize);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = `Hi ZYRO Wear! 👋 I want to order:\n- ${product.name}\n- Size: ${selectedSize}\n- Quantity: 1\n- Price: ₹${product.price}\n\nPlease confirm availability and payment details!`;
    window.open(`https://wa.me/917200515977?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="product-card" data-id={product.id}>
      <div className="card-badge-container">
        <span className="offer-badge">57% OFF</span>
      </div>

      <div className="card-image-wrapper" onClick={() => onSelectProduct(product)}>
        <img
          src={product.front_img}
          alt={`${product.name} Front`}
          className="card-img-front"
          loading="lazy"
        />
        <img
          src={product.back_img}
          alt={`${product.name} Back`}
          className="card-img-back"
          loading="lazy"
        />
        <button className="quick-view-btn" aria-label="Quick View">
          <i className="fa-solid fa-eye"></i>
        </button>
      </div>

      <div className="card-info">
        <h3 className="product-title" onClick={() => onSelectProduct(product)} style={{ cursor: 'pointer' }}>
          {product.name}
        </h3>
        <div className="product-price-row">
          <span className="current-price">₹{product.price}</span>
          <span className="mrp-price">₹{product.mrp}</span>
        </div>

        {/* Size Selection Pills */}
        <div className="size-selector-row" onClick={(e) => e.stopPropagation()}>
          <div className="size-selector">
            {['M', 'L', 'XL', 'XXL'].map((sz) => (
              <span
                key={sz}
                className={`size-pill ${selectedSize === sz ? 'active' : ''}`}
                onClick={() => setSelectedSize(sz)}
              >
                {sz}
              </span>
            ))}
          </div>
        </div>

        {/* Product Card Buttons - 2 Rows */}
        <div className="card-buttons-layout" onClick={(e) => e.stopPropagation()}>
          {/* Row 1: Full Width ADD TO CART */}
          <button className="btn-row-add-cart" onClick={handleAddCart}>
            <i className="fa-solid fa-bag-shopping"></i> ADD TO CART
          </button>

          {/* Row 2: 50/50 BUY NOW | ORDER ON WHATSAPP */}
          <div className="btn-row-two-col">
            <button className="btn-row-buy-now" onClick={handleBuyNow}>
              <i className="fa-solid fa-bolt"></i> BUY NOW
            </button>
            <button className="btn-row-whatsapp" onClick={handleWhatsApp}>
              <i className="fa-brands fa-whatsapp"></i> ORDER ON WHATSAPP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
