'use client';

import React, { useState } from 'react';
import { Product } from '@/types';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
  onBuyNow: (product: Product, size: string) => void;
}

export default function ProductModal({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}: ProductModalProps) {
  if (!product) return null;

  const [activeSize, setActiveSize] = useState<string>('L');
  const [activeImg, setActiveImg] = useState<string>(product.front_img);

  const handleAddToCart = () => {
    onAddToCart(product, activeSize, 1);
    onClose();
  };

  const handleBuyNow = () => {
    onBuyNow(product, activeSize);
    onClose();
  };

  const handleWhatsApp = () => {
    const message = `Hi ZYRO Wear! 👋 I want to order:\n- ${product.name}\n- Size: ${activeSize}\n- Quantity: 1\n- Price: ₹${product.price}\n\nPlease confirm availability and payment details!`;
    window.open(`https://wa.me/917200515977?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <>
      <div className="modal active" id="productModal">
        <div className="modal-content">
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>

          <div className="modal-gallery">
            <img src={activeImg} alt={product.name} className="modal-main-img" />
            <div className="gallery-thumbs">
              <div
                className={`thumb-btn ${activeImg === product.front_img ? 'active' : ''}`}
                onClick={() => setActiveImg(product.front_img)}
              >
                <img src={product.front_img} alt="Front View" />
              </div>
              <div
                className={`thumb-btn ${activeImg === product.back_img ? 'active' : ''}`}
                onClick={() => setActiveImg(product.back_img)}
              >
                <img src={product.back_img} alt="Back View" />
              </div>
            </div>
          </div>

          <div className="modal-info">
            <h2 className="modal-title">{product.name}</h2>
            <div className="modal-price-row">
              <span className="modal-price">₹{product.price}</span>
              <span className="modal-mrp">₹{product.mrp}</span>
              <span className="modal-badge">SPECIAL OFFER</span>
            </div>
            <p className="modal-desc">{product.description}</p>

            <div className="modal-size-section">
              <span className="modal-size-title">SELECT SIZE:</span>
              <div className="modal-size-options">
                {['M', 'L', 'XL', 'XXL'].map((sz) => (
                  <span
                    key={sz}
                    className={`modal-size-pill ${activeSize === sz ? 'active' : ''}`}
                    onClick={() => setActiveSize(sz)}
                  >
                    {sz}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Buttons matching Image 1 layout */}
            <div className="modal-actions-container">
              {/* Row 1: Full-Width ADD TO CART */}
              <button className="modal-btn-add-cart" onClick={handleAddToCart}>
                <i className="fa-solid fa-bag-shopping"></i> ADD TO CART
              </button>

              {/* Row 2: 50/50 BUY NOW & ORDER ON WHATSAPP */}
              <div className="modal-btn-row-2">
                <button className="modal-btn-buy-now" onClick={handleBuyNow}>
                  <strong className="btn-main-text">
                    <i className="fa-solid fa-bolt text-gold-icon"></i> BUY NOW
                  </strong>
                  <span className="btn-subtext">Pay Online (₹{product.price})</span>
                </button>

                <button className="modal-btn-whatsapp" onClick={handleWhatsApp}>
                  <strong className="btn-main-text">
                    <i className="fa-brands fa-whatsapp"></i> ORDER ON WHATSAPP
                  </strong>
                  <span className="btn-subtext">Quick Order via WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="backdrop active" id="modalBackdrop" onClick={onClose}></div>
    </>
  );
}
