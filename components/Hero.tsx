'use client';

import React, { useState, useEffect } from 'react';
import { INITIAL_PRODUCTS } from '@/lib/products-data';
import { Product } from '@/types';

interface HeroProps {
  onSelectProduct: (product: Product) => void;
}

export default function Hero({ onSelectProduct }: HeroProps) {
  const [heroIndex, setHeroIndex] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(true);
      setTimeout(() => {
        setHeroIndex((prev) => (prev + 1) % INITIAL_PRODUCTS.length);
        setFade(false);
      }, 400);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const currentHeroProduct = INITIAL_PRODUCTS[heroIndex] || INITIAL_PRODUCTS[0];

  return (
    <section className="hero-section" id="home">
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-badge">OFFICIAL 2026 EDITION</div>
          <h1 className="hero-title">WEAR YOUR <span className="text-gold">ENERGY.</span></h1>
          <p className="hero-description">
            Premium Quality. Bold Designs. Built for Comfort. Made for You.
            Discover top-tier international football jerseys crafted for champions.
          </p>

          <div className="hero-actions">
            <a href="#shop" className="btn-gold">
              EXPLORE COLLECTION <i className="fa-solid fa-arrow-right"></i>
            </a>
            <a href="#reviews" className="btn-outline">
              SEE CUSTOMER REVIEWS
            </a>
          </div>

          {/* Trust Badges */}
          <div className="hero-trust-badges">
            <div className="trust-item">
              <i className="fa-solid fa-shield-halved"></i>
              <span>PREMIUM QUALITY</span>
            </div>
            <div className="trust-item">
              <i className="fa-solid fa-shirt"></i>
              <span>COMFORT FIT</span>
            </div>
            <div className="trust-item">
              <i className="fa-solid fa-truck-fast"></i>
              <span>FAST DELIVERY</span>
            </div>
          </div>
        </div>

        {/* Featured Hero Product Visual Showcase */}
        <div className="hero-visual">
          <div className="neon-z-glow"></div>
          <div
            className="featured-jersey-wrapper"
            onClick={() => onSelectProduct(currentHeroProduct)}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={currentHeroProduct.front_img}
              alt={currentHeroProduct.name}
              className={`featured-jersey-img ${fade ? 'fade-out' : ''}`}
            />
            <div className={`hero-product-tag ${fade ? 'fade-out' : ''}`}>
              <span className="tag-title">{currentHeroProduct.name}</span>
              <span className="tag-price">
                ₹{currentHeroProduct.price} <s className="old-price">₹{currentHeroProduct.mrp}</s>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
