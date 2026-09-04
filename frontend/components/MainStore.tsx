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
import { INITIAL_PRODUCTS } from '@/database/seed/products-data';
import { Product, CartItem } from '@/shared/types';
import { normalizeCategory } from '@/shared/constants/stock-config';

interface MainStoreProps {
  initialProducts?: Product[];
}

export default function MainStore({ initialProducts }: MainStoreProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
          prev
            .map((item) => {
              const fresh = latestProducts.find((p: Product) => p.id === item.product.id);
              if (fresh) {
                const availableStock = fresh.stock_by_size?.[item.size] ?? 0;
                const newQty = Math.min(item.quantity, availableStock);
                return newQty > 0 ? { ...item, product: fresh, quantity: newQty } : null;
              }
              return item;
            })
            .filter(Boolean) as CartItem[]
        );
      }
    } catch (err) {
      console.error('Error loading store products from API:', err);
    }
  };

  useEffect(() => {
    loadProducts();
    const interval = setInterval(loadProducts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load cart from localStorage on mount
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

  // Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('zyro_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  const handleAddToCart = (product: Product, size: string, quantity: number = 1) => {
    const availableStock = product.stock_by_size?.[size] ?? 0;
    if (availableStock <= 0) {
      alert(`Size ${size} for ${product.name} is currently out of stock.`);
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id && item.size === size);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = Math.min(updated[existingIdx].quantity + quantity, availableStock);
        updated[existingIdx] = { ...updated[existingIdx], quantity: newQty };
        return updated;
      }
      return [...prev, { product, size, quantity: Math.min(quantity, availableStock) }];
    });
    setIsCartOpen(true);
  };

  const handleBuyNow = (product: Product, size: string, quantity: number = 1) => {
    handleAddToCart(product, size, quantity);
    setIsCheckoutOpen(true);
  };

  const handleUpdateQty = (productId: string, size: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.size === size) {
            const availableStock = item.product.stock_by_size?.[size] ?? 0;
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return { ...item, quantity: Math.min(newQty, availableStock) };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: string, size: string) => {
    setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.size === size)));
  };

  const uniqueProducts = Array.from(
    products
      .reduce((map, p) => {
        const key = (p.slug || p.id || '').toLowerCase().trim();
        if (!map.has(key)) map.set(key, p);
        return map;
      }, new Map<string, Product>())
      .values()
  );

  const filteredProducts = uniqueProducts.filter((p) => {
    if (p.is_active === false) return false;

    const normalizedCat = normalizeCategory(p.category, p.name);
    const matchesCategory =
      activeFilter === 'all' ||
      (activeFilter === 'football' && normalizedCat === 'Football Jerseys') ||
      (activeFilter === 'ipl' && normalizedCat === 'IPL Jerseys') ||
      (activeFilter === 'customized' && normalizedCat === 'Customized T-Shirts') ||
      (activeFilter === 'oversized' && normalizedCat === 'Oversized T-Shirts') ||
      (p.category && p.category.toLowerCase().includes(activeFilter.toLowerCase()));

    const q = searchQuery.toLowerCase().trim();
    let matchesSearch = !q;
    
    if (q) {
      const name = (p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const nation = (p.nation || '').toLowerCase();
      const slug = (p.slug || '').toLowerCase();

      // 1. Direct contains check
      if (
        name.includes(q) ||
        desc.includes(q) ||
        cat.includes(q) ||
        nation.includes(q) ||
        slug.includes(q)
      ) {
        matchesSearch = true;
      } else {
        // 2. Sliding window initials check
        const combinedText = `${name} ${desc}`.replace(/[^a-z0-9\s]/g, ' ');
        const words = combinedText.split(/\s+/).filter(Boolean);
        if (words.length >= q.length) {
          for (let i = 0; i <= words.length - q.length; i++) {
            const chunkInitials = words.slice(i, i + q.length).map(w => w[0]).join('');
            if (chunkInitials === q) {
              matchesSearch = true;
              break;
            }
          }
        }
      }
    }

    return matchesCategory && matchesSearch;
  });

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="store-page-wrapper">
      <Navbar
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <Hero products={products} />

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
                className={`tab-btn ${activeFilter === 'football' ? 'active' : ''}`}
                onClick={() => setActiveFilter('football')}
              >
                FOOTBALL JERSEYS
              </button>
              <button
                className={`tab-btn ${activeFilter === 'ipl' ? 'active' : ''}`}
                onClick={() => setActiveFilter('ipl')}
              >
                IPL JERSEYS
              </button>
              <button
                className={`tab-btn ${activeFilter === 'customized' ? 'active' : ''}`}
                onClick={() => setActiveFilter('customized')}
              >
                CUSTOMIZED T-SHIRTS
              </button>
              <button
                className={`tab-btn ${activeFilter === 'oversized' ? 'active' : ''}`}
                onClick={() => setActiveFilter('oversized')}
              >
                OVERSIZED T-SHIRTS
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
              ZYRO Wear is all about confidence, comfort and standing out. Every piece is designed with premium materials and bold style for the ones who don&apos;t follow the trend, they set it.
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
