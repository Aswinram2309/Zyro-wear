'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Navbar({
  cartCount,
  onOpenCart,
  searchQuery,
  onSearchChange,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);

  return (
    <>
      {/* Announcement Bar */}
      <div className="announcement-bar">
        <span>
          🔥 SPECIAL LAUNCH OFFER: ALL INTERNATIONAL JERSEYS AT FLAT <strong>₹299</strong> ONLY! FREE SHIPPING ON ORDERS OVER ₹999 🔥
        </span>
      </div>

      {/* Header / Navbar */}
      <header className="navbar" id="header">
        <div className="nav-container">
          <Link href="/" className="logo-link">
            <img src="/Logo/Zyro wears logo.png" alt="ZYRO WEAR Logo" className="brand-logo" />
          </Link>

          <nav className="nav-links">
            <a href="#home" className="nav-item active">HOME</a>
            <a href="#shop" className="nav-item">SHOP</a>
            <a href="#collections" className="nav-item">COLLECTIONS</a>
            <a href="#about" className="nav-item">ABOUT</a>
            <a href="#reviews" className="nav-item">REVIEWS</a>
            <a href="#contact" className="nav-item">CONTACT</a>
          </nav>

          <div className="header-actions">
            <button
              className="search-trigger"
              onClick={() => setSearchOverlayOpen(!searchOverlayOpen)}
              aria-label="Toggle Search"
            >
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>

            <button
              className="cart-trigger"
              onClick={onOpenCart}
              aria-label="Shopping Cart"
            >
              <i className="fa-solid fa-bag-shopping"></i>
              <span className="cart-badge">{cartCount}</span>
            </button>

            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Toggle Menu"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
          </div>
        </div>

        {/* Global Search Overlay Bar */}
        <div className={`search-bar-overlay ${searchOverlayOpen ? 'active' : ''}`}>
          <div className="search-inner">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by team (Argentina, France, Spain) or player (Messi, Ronaldo, Mbappe, Haaland)..."
            />
            <button
              className="close-search"
              onClick={() => setSearchOverlayOpen(false)}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-nav-header">
          <img src="/Logo/Zyro wears logo.png" alt="ZYRO WEAR" className="brand-logo-sm" />
          <button
            className="close-drawer"
            onClick={() => setMobileMenuOpen(false)}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <nav className="mobile-nav-links">
          <a href="#home" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Home</a>
          <a href="#shop" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Shop Collection</a>
          <a href="#collections" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Star Players</a>
          <a href="#about" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>About Us</a>
          <a href="#reviews" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Customer Reviews</a>
          <a href="#contact" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Contact & Support</a>
        </nav>
        <div className="mobile-contact-info">
          <a href="https://wa.me/917200515977" target="_blank" rel="noopener noreferrer" className="btn-whatsapp-full">
            <i className="fa-brands fa-whatsapp"></i> Chat on WhatsApp
          </a>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="backdrop active" onClick={() => setMobileMenuOpen(false)}></div>
      )}
    </>
  );
}
