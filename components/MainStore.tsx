'use client';

import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';
import ReviewsSection from './ReviewsSection';
import Footer from './Footer';
import { INITIAL_PRODUCTS } from '@/lib/products-data';
import { Product, CartItem } from '@/types';

export default function MainStore() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  const loadProducts = async () => {
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.products && Array.isArray(data.products) && data.products.length > 0) {
        const latestProducts = data.products;
        setProducts(latestProducts);
        // Sync cart item product details with the latest database values on reload
        setCart((prev) =>
          prev.map((item) => {
            const fresh = latestProducts.find((p: Product) => p.id === item.product.id);
            return fresh ? { ...item, product: fresh } : item;
          })
        );
      }
    } catch (err) {
      console.error('Error loading store products from API:', err);
    }
  };

  // Fetch dynamic products from Supabase / API endpoint
  useEffect(() => {
    loadProducts();

    // Revalidate when user switches back to the store tab / window gains focus
    const handleFocus = () => {
      loadProducts();
    };
    window.addEventListener('focus', handleFocus);

    // Periodic poll every 10 seconds to keep stock synchronized
    const interval = setInterval(loadProducts, 10000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Sync cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('zyro_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('zyro_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  const handleAddToCart = (product: Product, size: string, quantity: number) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.size === size
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      } else {
        return [...prev, { product, size, quantity }];
      }
    });
    setIsCartOpen(true);
  };

  const handleBuyNow = (product: Product, size: string) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.size === size
      );
      if (existingIdx > -1) {
        return prev;
      } else {
        return [...prev, { product, size, quantity: 1 }];
      }
    });
    setIsCheckoutOpen(true);
  };

  const handleUpdateQty = (productId: string, size: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.size === size) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: string, size: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.size === size))
    );
  };

  const filteredProducts = products.filter((p) => {
    // Hide out-of-stock items (totalStock === 0) from the listing
    if (p.stock === 0) return false;

    const matchesCategory =
      activeFilter === 'all' ||
      (activeFilter === 'star' && p.category === 'star') ||
      (activeFilter === 'national' && p.category !== 'club');

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.nation && p.nation.toLowerCase().includes(q)) ||
      p.description.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const activeSelectedProduct = selectedProduct
    ? (products.find((p) => p.id === selectedProduct.id) || selectedProduct)
    : null;

  return (
    <div className="store-page-wrapper">
      <Navbar
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <Hero onSelectProduct={(p) => setSelectedProduct(p)} />

      {/* Product Catalog Section / Trending Now */}
      <section className="catalog-section" id="shop">
        <div className="section-container">
          <div className="section-header">
            <span className="sub-heading">SHOP OUR COLLECTION</span>
            <h2 className="main-heading">TRENDING NOW</h2>
            <div className="heading-line"></div>
          </div>

          {/* Category Filter Tabs & Live Search */}
          <div className="catalog-toolbar">
            <div className="filter-tabs" id="filterTabs">
              <button
                className={`tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                ALL JERSEYS
              </button>
              <button
                className={`tab-btn ${activeFilter === 'star' ? 'active' : ''}`}
                onClick={() => setActiveFilter('star')}
              >
                STAR PLAYER EDITION
              </button>
              <button
                className={`tab-btn ${activeFilter === 'national' ? 'active' : ''}`}
                onClick={() => setActiveFilter('national')}
              >
                NATIONAL TEAMS
              </button>
            </div>
            <div className="search-box">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Filter by player or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Products Grid Container */}
          <div className="products-grid" id="productsGrid">
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 1rem' }}>
              <i className="fa-solid fa-shirt" style={{ fontSize: '3rem', color: '#4B5563', marginBottom: '1rem' }}></i>
              <h3 style={{ color: '#FFF', fontSize: '1.3rem' }}>No jerseys found matching &quot;{searchQuery}&quot;</h3>
              <p style={{ color: '#9CA3AF' }}>Try searching for a different country or player name (e.g. Messi, Ronaldo, Mbappé).</p>
            </div>
          )}
        </div>
      </section>

      {/* Brand / Ethos Banner */}
      <section className="ethos-section" id="about">
        <div className="ethos-container">
          <div className="ethos-content">
            <span className="sub-heading-gold">ABOUT ZYRO WEAR</span>
            <h2 className="ethos-heading">BUILT DIFFERENT.<br />MADE FOR YOU.</h2>
            <p className="ethos-desc">
              ZYRO Wear is all about confidence, comfort, and standing out. Every jersey in our collection is
              crafted with premium lightweight breathable fabrics and bold, authentic designs for sports
              enthusiasts who don&apos;t follow trends—they set them.
            </p>
            <div className="ethos-highlights">
              <div className="ethos-pill"><i className="fa-solid fa-bolt"></i> BOLD DESIGNS</div>
              <div className="ethos-pill"><i className="fa-solid fa-feather"></i> PREMIUM FABRIC</div>
              <div className="ethos-pill"><i className="fa-solid fa-award"></i> MADE TO LAST</div>
            </div>
            <a href="#shop" className="btn-gold mt-4">SHOP NOW</a>
          </div>
          <div className="ethos-visual">
            <div className="ethos-card-preview">
              <img src="/Logo/Zyro wears logo.png" alt="ZYRO Brand" className="ethos-logo-watermark" />
              <h3>AUTHENTIC JERSEY STORE</h3>
              <p>Designed for performance, durability & everyday streetwear style.</p>
            </div>
          </div>
        </div>
      </section>

      <ReviewsSection />

      {/* Value Proposition Grid */}
      <section className="value-props-section">
        <div className="section-container">
          <div className="props-grid">
            <div className="prop-card">
              <div className="prop-icon"><i className="fa-solid fa-shirt"></i></div>
              <h3>PREMIUM QUALITY</h3>
              <p>Top notch fabric for all day comfort, sweat wicking and high durability.</p>
            </div>
            <div className="prop-card">
              <div className="prop-icon"><i className="fa-solid fa-ruler-combined"></i></div>
              <h3>PERFECT FIT</h3>
              <p>Designed to fit you right. Regular or athletic fit options available across sizes.</p>
            </div>
            <div className="prop-card">
              <div className="prop-icon"><i className="fa-solid fa-palette"></i></div>
              <h3>BOLD STYLES</h3>
              <p>Authentic colors, precise player prints, and high-definition crests.</p>
            </div>
            <div className="prop-card">
              <div className="prop-icon"><i className="fa-solid fa-truck-ramp-box"></i></div>
              <h3>FAST DELIVERY</h3>
              <p>Quick and reliable dispatch to your doorstep with WhatsApp tracking updates.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Product Detail Modal */}
      {activeSelectedProduct && (
        <ProductModal
          product={activeSelectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Guest Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onClearCart={() => setCart([])}
      />
    </div>
  );
}
