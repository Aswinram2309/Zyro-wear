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

const DEFAULT_MEASUREMENTS: Record<string, { length: string; chest: string; shoulder: string }> = {
  M: { length: '27', chest: '40', shoulder: '10' },
  L: { length: '29', chest: '42', shoulder: '10' },
  XL: { length: '28', chest: '44', shoulder: '10' },
  XXL: { length: '30', chest: '46', shoulder: '10.5' },
};

export default function ProductDetailsClient({ initialProduct }: ProductDetailsClientProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product>(initialProduct);
  const [activeImg, setActiveImg] = useState<string>(initialProduct.front_img);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Construct list of all unique images for the gallery
  const allImages: string[] = [];
  if (product.front_img) allImages.push(product.front_img);
  if (product.back_img) allImages.push(product.back_img);
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach((img) => {
      if (img && !allImages.includes(img)) {
        allImages.push(img);
      }
    });
  }

  // Find index of active image
  const activeImgIndex = allImages.indexOf(activeImg) !== -1 ? allImages.indexOf(activeImg) : 0;

  // Handle mobile scroll event
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const index = Math.round(container.scrollLeft / container.clientWidth);
    if (index >= 0 && index < allImages.length) {
      if (activeImg !== allImages[index]) {
        setActiveImg(allImages[index]);
      }
    }
  };

  // Handle thumbnail clicks (scrolling to correct index programmatically)
  const handleThumbClick = (img: string, index: number) => {
    setActiveImg(img);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: index * scrollContainerRef.current.clientWidth,
        behavior: 'smooth'
      });
    }
  };

  // Reviews states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    customerName: '',
    comment: '',
  });
  const [reviewPhoto, setReviewPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [activeReviewLightboxImg, setActiveReviewLightboxImg] = useState<string | null>(null);

  // Touch gesture refs for mobile gallery swipe
  const touchStartX = React.useRef<number | null>(null);
  const touchEndX = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 35;

    if (distance > minSwipeDistance) {
      // Swipe left -> Next image
      const nextIndex = Math.min(activeImgIndex + 1, allImages.length - 1);
      handleThumbClick(allImages[nextIndex], nextIndex);
    } else if (distance < -minSwipeDistance) {
      // Swipe right -> Previous image
      const prevIndex = Math.max(activeImgIndex - 1, 0);
      handleThumbClick(allImages[prevIndex], prevIndex);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Dynamic stock values
  const sizesToMap = (product.sizes && product.sizes.length > 0 ? product.sizes : ['M', 'L', 'XL', 'XXL']).filter(sz => sz !== 'S');
  const totalStock = product.stock_by_size
    ? Object.values(product.stock_by_size).reduce((sum, v) => sum + v, 0)
    : (product.stock ?? 0);

  const [activeSize, setActiveSize] = useState<string>(() => {
    const withStock = sizesToMap.find(sz => (product.stock_by_size?.[sz] ?? 0) > 0);
    if (withStock) return withStock;
    return sizesToMap.includes('L') ? 'L' : sizesToMap[0];
  });

  const [quantity, setQuantity] = useState<number>(1);

  const getMeasurement = (size: string, field: 'length' | 'chest' | 'shoulder') => {
    const dbVal = product.size_chart?.[size]?.[field];
    if (dbVal && dbVal.trim() !== '') return dbVal;
    return DEFAULT_MEASUREMENTS[size]?.[field] || '—';
  };

  const parseDescription = (descText: string) => {
    if (!descText) return [];
    const text = descText.replace(/\r\n/g, '\n').trim();
    const headingRegex = /^(Style|Fabric|Style Brief|Design Brief|Description|Details|Specifications|Care|Features|Fit)(?::|\n|$)/im;
    const hasHeadings = headingRegex.test(text);

    if (!hasHeadings) {
      return [{ content: text.split('\n').map(p => p.trim()).filter(Boolean) }];
    }

    const lines = text.split('\n');
    const sections: { title?: string; content: string[] }[] = [];
    let currentSection: { title?: string; content: string[] } | null = null;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      const match = line.match(/^(Style|Fabric|Style Brief|Design Brief|Description|Details|Specifications|Care|Features|Fit)(?::)?$/i);
      if (match) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: match[1],
          content: []
        };
      } else {
        const inlineMatch = line.match(/^(Style|Fabric|Style Brief|Design Brief|Description|Details|Specifications|Care|Features|Fit):\s*(.*)$/i);
        if (inlineMatch) {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            title: inlineMatch[1],
            content: [inlineMatch[2].trim()]
          };
        } else {
          if (!currentSection) {
            currentSection = { content: [] };
          }
          currentSection.content.push(line);
        }
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

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
        // Sync cart item product details with the latest database values on reload
        setCart((prev) =>
          prev
            .map((item) => {
              const freshItem = data.products.find((p: Product) => p.id === item.product.id);
              if (freshItem) {
                const availableStock = freshItem.stock_by_size?.[item.size] ?? 0;
                const newQty = Math.min(item.quantity, availableStock);
                return newQty > 0 ? { ...item, product: freshItem, quantity: newQty } : null;
              }
              return item;
            })
            .filter(Boolean) as CartItem[]
        );
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
      const availableStock = product.stock_by_size?.[activeSize] ?? 0;
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = Math.min(updated[existingIdx].quantity + quantity, availableStock);
        updated[existingIdx].quantity = newQty;
        return updated;
      } else {
        return [...prev, { product, size: activeSize, quantity: Math.min(quantity, availableStock) }];
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
      const availableStock = product.stock_by_size?.[activeSize] ?? 0;
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity = Math.min(quantity, availableStock);
        return updated;
      } else {
        return [...prev, { product, size: activeSize, quantity: Math.min(quantity, availableStock) }];
      }
    });
    setIsCheckoutOpen(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedExts = ['jpeg', 'jpg', 'png', 'heic'];
      const fileExt = (file.name.split('.').pop() || '').toLowerCase();
      if (!allowedExts.includes(fileExt)) {
        setReviewError('Invalid file format. Allowed formats: .jpeg, .jpg, .png, .heic');
        e.target.value = '';
        setReviewPhoto(null);
        setPhotoPreview(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setReviewError('File size must be under 10MB.');
        e.target.value = '';
        setReviewPhoto(null);
        setPhotoPreview(null);
        return;
      }
      setReviewError(null);
      setReviewPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
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
      let photoUrl: string | null = null;
      let storagePath: string | null = null;

      if (reviewPhoto) {
        const formData = new FormData();
        formData.append('file', reviewPhoto);
        formData.append('productId', product.id);

        const uploadRes = await fetch('/api/reviews/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error || 'Failed to upload photo');
        }
        photoUrl = uploadData.url;
        storagePath = uploadData.path || null;
      }

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewForm.rating,
          customerName: reviewForm.customerName.trim(),
          comment: reviewForm.comment.trim(),
          photoUrl: photoUrl,
          storagePath: storagePath,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setReviewSuccess('Thank you! Your review has been posted.');
      setReviewForm({ rating: 5, customerName: '', comment: '' });
      setReviewPhoto(null);
      setPhotoPreview(null);
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
            const availableStock = item.product.stock_by_size?.[size] ?? 0;
            const newQty = item.quantity + delta;
            if (newQty > availableStock) {
              return item; // Do not allow quantity to exceed stock!
            }
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
              <div 
                className="main-image-slider" 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {allImages.map((img, idx) => (
                  <div key={idx} className="main-image-slide">
                    <img 
                      src={formatImageUrl(img)} 
                      alt={`${product.name} - View ${idx + 1}`} 
                      className="product-main-view-img" 
                      draggable="false"
                    />
                  </div>
                ))}
              </div>
              {allImages.length > 1 && (
                <div className="mobile-gallery-counter">
                  {activeImgIndex + 1} / {allImages.length}
                </div>
              )}
            </div>
            <div className="detail-gallery-thumbs">
              {allImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`detail-thumb-btn ${activeImg === img ? 'active' : ''}`}
                  onClick={() => handleThumbClick(img, idx)}
                >
                  <img src={formatImageUrl(img)} alt={`View ${idx + 1} Thumbnail`} />
                </div>
              ))}
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

            {/* Selected Size Measurement Box */}
            {activeSize && (
              <div className="selected-size-measurement-box">
                <div className="box-header">{activeSize}</div>
                <table className="selected-size-measurement-table">
                  <tbody>
                    <tr>
                      <td className="label-col">Garment Chest</td>
                      <td className="val-col">{getMeasurement(activeSize, 'chest')}</td>
                    </tr>
                    <tr>
                      <td className="label-col">Length T-Shirt</td>
                      <td className="val-col">{getMeasurement(activeSize, 'length')}</td>
                    </tr>
                    <tr>
                      <td className="label-col">Shoulder</td>
                      <td className="val-col">{getMeasurement(activeSize, 'shoulder')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
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

              {/* Row 2: Buy Now */}
              <div className="details-btn-row-2">
                <button
                  className="details-btn-buy-now"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  style={{ gridColumn: 'span 2', width: '100%' }}
                >
                  <strong className="btn-main-text">
                    <i className="fa-solid fa-bolt text-gold-icon"></i> BUY NOW
                  </strong>
                  <span className="btn-subtext">Quick Checkout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Size Chart Section */}
        <section className="product-sizechart-section">
          <SizeChart sizeChart={product.size_chart} selectedSize={activeSize} onSizeSelect={setActiveSize} />
        </section>

        {/* Product Description Section */}
        <section className="product-description-section">
          <h2>Product Description</h2>
          <div className="description-box">
            <div className="description-block">
              <h3 className="description-block-title">Premium Dotnet Jersey</h3>
              <p className="description-block-text">
                Upgrade your jersey collection with our premium Dotnet fabric jersey, designed for a comfortable fit, sporty look, and everyday wear.
              </p>
            </div>
            <div className="description-block">
              <h3 className="description-block-title">Key Features</h3>
              <p className="description-block-text">• Premium Dotnet fabric</p>
              <p className="description-block-text">• Lightweight and comfortable</p>
              <p className="description-block-text">• Breathable feel for better comfort</p>
              <p className="description-block-text">• Smooth and durable finish</p>
              <p className="description-block-text">• Stylish football-inspired design</p>
              <p className="description-block-text">• Suitable for sports, casual wear, and everyday use</p>
              <p className="description-block-text">• Available in multiple sizes</p>
            </div>
            <div className="description-block">
              <h3 className="description-block-title">Specifications</h3>
              <p className="description-block-text"><strong>Fabric:</strong> Premium Dotnet</p>
              <p className="description-block-text"><strong>Fit:</strong> Regular / Comfortable Fit</p>
              <p className="description-block-text"><strong>Care:</strong> Hand wash or gentle machine wash. Do not bleach. Avoid high heat.</p>
            </div>
          </div>
        </section>

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

                <div className="review-form-group">
                  <label htmlFor="reviewer-photo-field">Upload Photo (Optional)</label>
                  <input
                    id="reviewer-photo-field"
                    type="file"
                    accept=".jpeg,.jpg,.png,.heic,image/jpeg,image/png,image/heic"
                    onChange={handlePhotoSelect}
                    style={{ fontSize: '0.85rem', color: '#D1D5DB' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '4px', display: 'block' }}>
                    Allowed formats: .jpeg, .jpg, .png, .heic (Max 10MB)
                  </span>
                  {photoPreview && (
                    <div style={{ marginTop: '8px', position: 'relative', display: 'inline-block' }}>
                      <img
                        src={photoPreview}
                        alt="Photo Preview"
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #FFC700' }}
                      />
                      <button
                        type="button"
                        onClick={() => { setReviewPhoto(null); setPhotoPreview(null); }}
                        style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
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
                    {(r.image_url || r.photo_url) && (
                      <div className="review-card-photo-container">
                        <img
                          src={r.image_url || r.photo_url}
                          alt={`Customer review upload by ${r.customer_name}`}
                          className="review-card-photo"
                          onClick={() => setActiveReviewLightboxImg(r.image_url || r.photo_url || null)}
                        />
                      </div>
                    )}
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

      {/* Review Photo Lightbox Modal */}
      {activeReviewLightboxImg && (
        <div
          className="lightbox active"
          id="reviewImageLightbox"
          onClick={() => setActiveReviewLightboxImg(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
        >
          <button
            className="lightbox-close"
            onClick={() => setActiveReviewLightboxImg(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <img
            src={activeReviewLightboxImg}
            alt="Enlarged Customer Review Photo"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '10px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            }}
          />
        </div>
      )}

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
