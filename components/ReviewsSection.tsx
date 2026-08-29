'use client';

import React, { useState, useEffect } from 'react';

interface ReviewItem {
  src: string;
  name: string;
  comment?: string;
  isVerified?: boolean;
}

export default function ReviewsSection() {
  const defaultReviewImages: ReviewItem[] = [
    { src: '/Reviews/review 1.png', name: 'Verified Customer', isVerified: true },
    { src: '/Reviews/review 2.png', name: 'Verified Customer', isVerified: true },
    { src: '/Reviews/review 3.png', name: 'Verified Customer', isVerified: true },
    { src: '/Reviews/review 4.png', name: 'Verified Customer', isVerified: true },
  ];

  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(defaultReviewImages);
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomerReviewPhotos = async () => {
      try {
        const res = await fetch('/api/reviews?productId=all');
        if (res.ok) {
          const data = await res.json();
          if (data.reviews && Array.isArray(data.reviews)) {
            const uploadedItems: ReviewItem[] = data.reviews
              .filter((r: any) => r.image_url || r.photo_url)
              .map((r: any) => ({
                src: r.image_url || r.photo_url,
                name: r.customer_name || 'Verified Buyer',
                comment: r.comment,
                isVerified: true,
              }));
            if (uploadedItems.length > 0) {
              setReviewsList([...uploadedItems, ...defaultReviewImages]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching review section photos:', err);
      }
    };
    fetchCustomerReviewPhotos();
  }, []);

  const displayList = reviewsList.length < 6 ? [...reviewsList, ...reviewsList] : reviewsList;

  return (
    <section className="reviews-section" id="reviews">
      <div className="section-container">
        <div className="section-header text-center">
          <span className="sub-heading">HAPPY CUSTOMERS</span>
          <h2 className="main-heading">CUSTOMER FEEDBACK</h2>
          <p className="section-intro">
            Authentic product feedback & quality reviews from verified ZYRO Wear customers!
          </p>
        </div>

        {/* Auto-Scrolling Cleaned Reviews Slider */}
        <div className="reviews-slider-wrapper">
          <div className="reviews-track" id="reviewsTrack">
            {displayList.map((item, idx) => (
              <div
                key={idx}
                className="review-card"
                onClick={() => setActiveLightboxImg(item.src)}
                style={{ cursor: 'pointer' }}
              >
                <div className="review-card-frame">
                  <img
                    src={item.src}
                    alt={`Customer Review by ${item.name}`}
                    className="review-img"
                    loading="lazy"
                  />
                </div>
                <div className="review-card-footer">
                  <span>
                    <i className="fa-solid fa-circle-check"></i> {item.name.toUpperCase()}
                  </span>
                  <i className="fa-solid fa-magnifying-glass-plus"></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {activeLightboxImg && (
        <div className="lightbox active" id="imageLightbox" onClick={() => setActiveLightboxImg(null)}>
          <button className="lightbox-close" onClick={() => setActiveLightboxImg(null)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
          <img src={activeLightboxImg} alt="Customer Review Screenshot" className="lightbox-img" />
        </div>
      )}
    </section>
  );
}
