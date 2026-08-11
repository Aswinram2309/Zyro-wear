'use client';

import React, { useState } from 'react';

export default function ReviewsSection() {
  const reviewImages = [
    '/Reviews/review 1.png',
    '/Reviews/review 2.png',
    '/Reviews/review 3.png',
    '/Reviews/review 4.png',
  ];

  const doubledReviews = [...reviewImages, ...reviewImages];
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

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
            {doubledReviews.map((imgSrc, idx) => (
              <div
                key={idx}
                className="review-card"
                onClick={() => setActiveLightboxImg(imgSrc)}
                style={{ cursor: 'pointer' }}
              >
                <div className="review-card-frame">
                  <img
                    src={imgSrc}
                    alt={`Verified Customer Review ${idx + 1}`}
                    className="review-img"
                    loading="lazy"
                  />
                </div>
                <div className="review-card-footer">
                  <span>
                    <i className="fa-solid fa-circle-check"></i> VERIFIED CUSTOMER
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
