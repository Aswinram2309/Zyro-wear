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
  const sizesToMap = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL', 'XXL'];
  
  const totalStock = product.stock_by_size
    ? Object.values(product.stock_by_size).reduce((sum, v) => sum + v, 0)
    : (product.stock ?? 0);

  const [selectedSize, setSelectedSize] = useState<string>(() => {
    const withStock = sizesToMap.find(sz => (product.stock_by_size?.[sz] ?? 0) > 0);
    if (withStock) return withStock;
    return sizesToMap.includes('L') ? 'L' : sizesToMap[0];
  });

  const sizeStock = product.stock_by_size?.[selectedSize] ?? 0;
  const isOutOfStock = sizeStock === 0 || totalStock === 0;

  const handleAddCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onAddToCart(product, selectedSize, 1);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
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
          {totalStock === 0 ? (
            <span className="stock-status out-of-stock" style={{ marginLeft: 'auto' }}>OUT OF STOCK</span>
          ) : totalStock >= 1 && totalStock <= 3 ? (
            <span className="stock-status low-stock" style={{ marginLeft: 'auto' }}>FEW STOCKS AVAILABLE</span>
          ) : null}
        </div>

        {/* Size Selection Pills */}
        <div className="size-selector-row" onClick={(e) => e.stopPropagation()}>
          <div className="size-selector">
            {sizesToMap.map((sz) => {
              const szStock = product.stock_by_size?.[sz] ?? 0;
              const szOutOfStock = szStock === 0 || totalStock === 0;
              return (
                <span
                  key={sz}
                  className={`size-pill ${selectedSize === sz ? 'active' : ''} ${szOutOfStock ? 'out-of-stock' : ''}`}
                  onClick={() => !szOutOfStock && setSelectedSize(sz)}
                >
                  {sz}
                </span>
              );
            })}
          </div>
        </div>

        {/* Product Card Buttons - 2 Rows */}
        <div className="card-buttons-layout" onClick={(e) => e.stopPropagation()}>
          {/* Row 1: Full Width ADD TO CART */}
          <button className="btn-row-add-cart" onClick={handleAddCart} disabled={isOutOfStock}>
            <i className="fa-solid fa-bag-shopping"></i> ADD TO CART
          </button>

          {/* Row 2: 50/50 BUY NOW | ORDER ON WHATSAPP */}
          <div className="btn-row-two-col">
            <button className="btn-row-buy-now" onClick={handleBuyNow} disabled={isOutOfStock}>
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
