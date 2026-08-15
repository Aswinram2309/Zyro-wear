'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product, CartItem, Review } from '@/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import SizeChart from '@/components/SizeChart';
import { formatImageUrl } from '@/lib/stock-config';

interface ProductDetailsClientProps {
  initialProduct: Product;
}

export default function ProductDetailsClient({ initialProduct }: ProductDetailsClientProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product>(initialProduct);
  const [activeImg, setActiveImg] = useState<string>(initialProduct.front_img);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Reviews states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    customerName: '',
    comment: '',
  });
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  // Dynamic stock values
  const sizesToMap = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL', 'XXL'];
  const totalStock = product.stock_by_size
    ? Object.values(product.stock_by_size).reduce((sum, v) => sum + v, 0)
    : (product.stock ?? 0);

  const [activeSize, setActiveSize] = useState<string>(() => {
    const withStock = sizesToMap.find(sz => (product.stock_by_size?.[sz] ?? 0) > 0);
    if (withStock) return withStock;
    return sizesToMap.includes('L') ? 'L' : sizesToMap[0];
  });

  const [quantity, setQuantity] = useState<number>(1);

  const sizeStock = product.stock_by_size?.[activeSize] ?? 0;
  const isOutOfStock = sizeStock === 0 || totalStock === 0;

  // Poll product details to ensure latest database stock is used
  const loadProductDetails = async () => {
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.products && Array.isArray(data.products)) {
        const fresh = data.products.find((p: Product) => p.id === product.id);
        if (fresh) {
          setProduct(fresh);
        }
      }
    } catch (err) {
      console.error('Error refreshing product details:', err);
    }
  };

  // Load reviews for the product
  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/reviews?productId=${product.id}&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

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
    loadReviews();
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('zyro_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Focus revalidation and polling
  useEffect(() => {
    loadProductDetails();

    const handleFocus = () => {
      loadProductDetails();
      loadReviews();
    };
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(loadProductDetails, 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [product.id]);

  // Adjust quantity selector boundary if size changes
  useEffect(() => {
    setQuantity(1);
  }, [activeSize]);

  // Cart operations
  const handleAddToCart = () => {
    if (isOutOfStock) return;
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.size === activeSize
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      } else {
        return [...prev, { product, size: activeSize, quantity }];
      }
    });
    setIsCartOpen(true);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.size === activeSize
      );
      if (existingIdx > -1) {
        // If already exists, update its quantity
        const updated = [...prev];
        updated[existingIdx].quantity = quantity;
        return updated;
      } else {
        return [...prev, { product, size: activeSize, quantity }];
      }
    });
    setIsCheckoutOpen(true);
  };

  const handleWhatsApp = () => {
    const message = `Hi ZYRO Wear! 👋 I want to order:\n- ${product.name}\n- Size: ${activeSize}\n- Quantity: ${quantity}\n- Price: ₹${product.price * quantity}\n\nPlease confirm availability and payment details!`;
    window.open(`https://wa.me/917200515977?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Review submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccess(null);

    if (!reviewForm.customerName.trim()) {
      setReviewError('Name is required');
      return;
    }
    if (!reviewForm.comment.trim()) {
      setReviewError('Review comment cannot be empty');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewForm.rating,
          customerName: reviewForm.customerName.trim(),
          comment: reviewForm.comment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setReviewSuccess('Thank you! Your review has been posted.');
      setReviewForm({ rating: 5, customerName: '', comment: '' });
      await loadReviews();
    } catch (err: any) {
      console.error(err);
      setReviewError(err.message || 'Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Cart Drawer operations
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

  // Reviews aggregates
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const starsBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { star, count, percentage };
  });

  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <div className="store-page-wrapper">
      <Navbar
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          router.push(`/#shop`);
        }}
      />

      <main className="product-details-main">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb-nav">
          <Link href="/">Home</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        {/* Product Grid Layout */}
        <div className="product-detail-layout">
          {/* Left Column: Product Gallery */}
          <div className="product-detail-images">
            <div className="main-image-container">
              <img src={activeImg} alt={product.name} className="product-main-view-img" />
            </div>
            <div className="detail-gallery-thumbs">
              <div
                className={`detail-thumb-btn ${activeImg === product.front_img ? 'active' : ''}`}
                onClick={() => setActiveImg(product.front_img)}
              >
                <img src={product.front_img} alt="Front View Thumbnail" />
              </div>
              {product.back_img && (
                <div
                  className={`detail-thumb-btn ${activeImg === product.back_img ? 'active' : ''}`}
                  onClick={() => setActiveImg(product.back_img)}
                >
                  <img src={product.back_img} alt="Back View Thumbnail" />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Info & Purchase Controls */}
          <div className="product-detail-info">
            <h1 className="product-page-title">{product.name}</h1>

            {/* Quick Ratings Row */}
            <div className="details-ratings-summary">
              <div className="stars-row">
                {[1, 2, 3, 4, 5].map((s) => (
                  <i
                    key={s}
                    className={`fa-solid fa-star ${s <= Math.round(Number(avgRating)) ? 'active-star' : 'inactive-star'}`}
                  ></i>
                ))}
              </div>
              <span className="summary-count-text">
                {avgRating} ({reviews.length} Customer Reviews)
              </span>
            </div>

            {/* Pricing Section */}
            <div className="details-price-section">
              <span className="details-price-tag">₹{product.price}</span>
              {product.mrp && product.mrp > product.price && (
                <>
                  <span className="details-mrp-tag">₹{product.mrp}</span>
                  <span className="details-discount-badge">
                    {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {product.nation && (
              <div className="details-meta-item">
                <span className="meta-label">Team / Nation:</span>
                <span className="meta-val">{product.nation}</span>
              </div>
            )}

            <div className="details-description">
              <h3>Product Description</h3>
              <p>{product.description || 'No description available for this premium jersey.'}</p>
            </div>

            {/* Sizes Selection */}
            <div className="details-sizes-section">
              <div className="sizes-header-row">
                <span className="sizes-title">Select Size:</span>
                {totalStock === 0 ? (
                  <span className="stock-status out-of-stock">OUT OF STOCK</span>
                ) : totalStock >= 1 && totalStock <= 3 ? (
                  <span className="stock-status low-stock">FEW STOCKS AVAILABLE</span>
                ) : null}
              </div>
              <div className="sizes-selector-grid">
                {sizesToMap.map((sz) => {
                  const szStock = product.stock_by_size?.[sz] ?? 0;
                  const szOutOfStock = szStock === 0 || totalStock === 0;
                  return (
                    <button
                      key={sz}
                      disabled={szOutOfStock}
                      className={`details-size-btn ${activeSize === sz ? 'active' : ''} ${szOutOfStock ? 'disabled' : ''}`}
                      onClick={() => !szOutOfStock && setActiveSize(sz)}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            <SizeChart sizeChart={product.size_chart} />

            {/* Quantity Selector */}
            <div className="details-qty-section">
              <span className="qty-title">Quantity:</span>
              <div className="qty-picker">
                <button
                  type="button"
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                >
                  -
                </button>
                <span className="qty-num">{quantity}</span>
                <button
                  type="button"
                  disabled={quantity >= sizeStock || isOutOfStock}
                  onClick={() => setQuantity((prev) => Math.min(sizeStock, prev + 1))}
                >
                  +
                </button>
              </div>
              {sizeStock > 0 && sizeStock <= 3 && (
                <span className="size-qty-low-hint">Only {sizeStock} left in this size!</span>
              )}
            </div>

            {/* Action Buttons Container */}
            <div className="details-actions-container">
              {/* Row 1: Full-Width Add To Cart */}
              <button
                className="details-btn-add-cart"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                <i className="fa-solid fa-bag-shopping"></i> ADD TO CART
              </button>

              {/* Row 2: Buy Now & WhatsApp */}
              <div className="details-btn-row-2">
                <button
                  className="details-btn-buy-now"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                >
                  <strong className="btn-main-text">
                    <i className="fa-solid fa-bolt text-gold-icon"></i> BUY NOW
                  </strong>
                  <span className="btn-subtext">Quick Checkout</span>
                </button>

                <button
                  className="details-btn-whatsapp"
                  onClick={handleWhatsApp}
                >
                  <strong className="btn-main-text">
                    <i className="fa-brands fa-whatsapp"></i> ORDER ON WHATSAPP
                  </strong>
                  <span className="btn-subtext">Order via Chat</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <section className="product-reviews-section">
          <h2>Customer Reviews</h2>
          <div className="reviews-layout-grid">
            {/* Reviews Summary Summary Column */}
            <div className="reviews-aggregates-box">
              <div className="agg-rating-huge">{avgRating}</div>
              <div className="stars-row-lg">
                {[1, 2, 3, 4, 5].map((s) => (
                  <i
                    key={s}
                    className={`fa-solid fa-star ${s <= Math.round(Number(avgRating)) ? 'active-star' : 'inactive-star'}`}
                  ></i>
                ))}
              </div>
              <p className="agg-count-text">Based on {reviews.length} reviews</p>

              {/* Rating breakdown bars */}
              <div className="rating-breakdown-list">
                {starsBreakdown.map((item) => (
                  <div key={item.star} className="breakdown-row">
                    <span className="star-num">{item.star} star</span>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                    <span className="row-count-num">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Write a Review Submission Form */}
            <div className="write-review-box">
              <h3>Write a Customer Review</h3>
              <form onSubmit={handleSubmitReview} className="review-submit-form">
                {reviewError && <div className="review-alert error">{reviewError}</div>}
                {reviewSuccess && <div className="review-alert success">{reviewSuccess}</div>}

                <div className="review-form-group">
                  <label>Rating *</label>
                  <div className="star-input-selector">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setReviewForm({ ...reviewForm, rating: num })}
                        className={`star-select-btn ${num <= reviewForm.rating ? 'active' : ''}`}
                      >
                        <i className="fa-solid fa-star"></i>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="review-form-group">
                  <label htmlFor="reviewer-name-field">Your Name *</label>
                  <input
                    id="reviewer-name-field"
                    type="text"
                    placeholder="e.g. John Doe"
                    value={reviewForm.customerName}
                    onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                    required
                  />
                </div>

                <div className="review-form-group">
                  <label htmlFor="reviewer-comment-field">Review Comments *</label>
                  <textarea
                    id="reviewer-comment-field"
                    rows={4}
                    placeholder="Tell us what you think about the fabric quality, sizing, and details..."
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn-submit-review"
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Posting Review...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>

          {/* List of Posted Reviews */}
          <div className="reviews-cards-list">
            <h3>Recent Reviews ({reviews.length})</h3>
            {loadingReviews ? (
              <div className="reviews-loading">
                <i className="fa-solid fa-spinner fa-spin"></i> Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="reviews-empty">
                No reviews yet. Be the first to share your thoughts on this jersey!
              </div>
            ) : (
              <div className="reviews-list-grid">
                {reviews.map((r) => (
                  <div key={r.id} className="review-card">
                    <div className="review-card-header">
                      <strong className="reviewer-name">{r.customer_name}</strong>
                      <span className="review-date">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }) : ''}
                      </span>
                    </div>
                    <div className="review-card-stars">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <i
                          key={s}
                          className={`fa-solid fa-star ${s <= r.rating ? 'active-star' : 'inactive-star'}`}
                        ></i>
                      ))}
                    </div>
                    <p className="review-card-comment">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

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
        onClearCart={() => {
          setCart([]);
          localStorage.removeItem('zyro_cart');
          setIsCheckoutOpen(false);
          alert('Order placed successfully! We will contact you on WhatsApp.');
          loadProductDetails();
        }}
      />
      {/* Mobile Sticky Bottom Bar */}
      <div className="sticky-bottom-action-bar">
        <button
          className="sticky-btn-add"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          <i className="fa-solid fa-bag-shopping"></i> ADD TO CART
        </button>
        <button
          className="sticky-btn-buy"
          onClick={handleBuyNow}
          disabled={isOutOfStock}
        >
          <i className="fa-solid fa-bolt"></i> BUY NOW
        </button>
      </div>
    </div>
  );
}
