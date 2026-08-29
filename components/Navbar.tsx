'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';

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
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [hasError, setHasError] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  const fetchProductsForSearch = async () => {
    if (products.length > 0 || isLoadingProducts) return;
    setIsLoadingProducts(true);
    setHasError(false);
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setHasError(true);
      }
    } catch (err) {
      console.error('Error loading products for search autocomplete:', err);
      setHasError(true);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Trigger loading products as soon as search overlay is opened
  useEffect(() => {
    if (searchOverlayOpen) {
      fetchProductsForSearch();
    }
  }, [searchOverlayOpen]);

  // Click outside to close search overlay
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOverlayOpen(false);
      }
    }
    if (searchOverlayOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchOverlayOpen]);

  // Escape key to close search overlay
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSearchOverlayOpen(false);
      }
    }
    if (searchOverlayOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchOverlayOpen]);

  // Perform dynamic, case-insensitive in-memory filtering
  const query = searchQuery.toLowerCase().trim();
  const matchedProducts = products.filter((p) => {
    if (p.is_active === false) return false;
    if (!query) return true;

    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const cat = (p.category || '').toLowerCase();
    const nation = (p.nation || '').toLowerCase();
    const slug = (p.slug || '').toLowerCase();

    // 1. Direct contains match
    if (
      name.includes(query) ||
      desc.includes(query) ||
      cat.includes(query) ||
      nation.includes(query) ||
      slug.includes(query)
    ) {
      return true;
    }

    // 2. Sliding window initials match (e.g. "Royal Challengers Bengaluru" -> "rcb")
    const combinedText = `${name} ${desc}`.replace(/[^a-z0-9\s]/g, ' ');
    const words = combinedText.split(/\s+/).filter(Boolean);
    if (words.length >= query.length) {
      for (let i = 0; i <= words.length - query.length; i++) {
        const chunkInitials = words.slice(i, i + query.length).map(w => w[0]).join('');
        if (chunkInitials === query) return true;
      }
    }

    return false;
  });

  const handleViewAllResults = () => {
    onSearchChange(searchQuery);
    setSearchOverlayOpen(false);
    if (window.location.pathname !== '/' || window.location.hash !== '#shop') {
      router.push(`/#shop`);
    }
  };

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
            <Link href="/#home" className="nav-item">HOME</Link>
            <Link href="/#shop" className="nav-item">SHOP</Link>
            <Link href="/#collections" className="nav-item">COLLECTIONS</Link>
            <Link href="/#about" className="nav-item">ABOUT</Link>
            <Link href="/#reviews" className="nav-item">REVIEWS</Link>
            <Link href="/#contact" className="nav-item">CONTACT</Link>
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
        <div className={`search-bar-overlay ${searchOverlayOpen ? 'active' : ''}`} ref={searchRef}>
          <div className="search-inner">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={fetchProductsForSearch}
              placeholder="Search by team (Argentina, France, Spain) or player (Messi, Ronaldo, Mbappe, Haaland)..."
            />
            <button
              className="close-search"
              onClick={() => {
                onSearchChange('');
                setSearchOverlayOpen(false);
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Search Autocomplete Suggestions Dropdown */}
          {searchOverlayOpen && searchQuery.trim() !== '' && (
            <div className="search-dropdown">
              {isLoadingProducts ? (
                <div className="search-loading">
                  <i className="fa-solid fa-spinner fa-spin"></i> Loading suggestions...
                </div>
              ) : hasError ? (
                <div className="search-error">
                  <i className="fa-solid fa-circle-exclamation"></i> Unable to load products
                </div>
              ) : matchedProducts.length === 0 ? (
                <div className="search-no-results">No products found</div>
              ) : (
                <>
                  <div className="search-results-list">
                    {matchedProducts.slice(0, 6).map((prod) => {
                      const prodTotalStock = prod.stock_by_size
                        ? Object.values(prod.stock_by_size).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0)
                        : (prod.stock ?? 0);
                      const prodOutOfStock = prodTotalStock === 0;

                      return (
                        <div
                          key={prod.id}
                          className={`search-suggestion-item ${prodOutOfStock ? 'suggestion-out-stock' : ''}`}
                          onClick={() => {
                            setSearchOverlayOpen(false);
                            onSearchChange('');
                            router.push(`/product/${prod.slug}`);
                          }}
                        >
                          <div className="suggestion-img-wrapper">
                            <img
                              src={prod.front_img || '/Logo/Zyro wears logo.png'}
                              alt={prod.name}
                              className="suggestion-thumbnail"
                            />
                          </div>
                          <div className="suggestion-details">
                            <span className="suggestion-name">{prod.name}</span>
                            <div className="suggestion-meta">
                              <span className="suggestion-price">₹{prod.price}</span>
                              {prod.mrp && prod.mrp > prod.price && (
                                <span className="suggestion-mrp">₹{prod.mrp}</span>
                              )}
                              {prod.nation && (
                                <span className="suggestion-tag">{prod.nation}</span>
                              )}
                              {prodOutOfStock && (
                                <span className="suggestion-out-badge">OUT OF STOCK</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {matchedProducts.length > 6 && (
                    <button className="search-view-all-btn" onClick={handleViewAllResults}>
                      View all {matchedProducts.length} results <i className="fa-solid fa-arrow-right-long"></i>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
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
          <Link href="/#home" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link href="/#shop" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Shop Collection</Link>
          <Link href="/#about" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
          <Link href="/#reviews" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Customer Reviews</Link>
          <Link href="/#contact" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Contact & Support</Link>
        </nav>
      </div>
      {mobileMenuOpen && (
        <div className="backdrop active" onClick={() => setMobileMenuOpen(false)}></div>
      )}
    </>
  );
}
