'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-container">
        <div className="footer-col brand-col">
          <img src="/Logo/Zyro wears logo.png" alt="ZYRO WEAR Logo" className="footer-logo" />
          <p className="footer-about">
            ZYRO Wear is all about confidence, comfort and standing out. Every piece is designed with premium materials and bold style for the ones who don't follow the trend, they set it.
          </p>
          <div className="social-links">
            <a href="https://www.instagram.com/zyro.__.wear?igsh=N3Bvd3BteG9uYzlt" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a href="mailto:zyrowear718@gmail.com" aria-label="Email">
              <i className="fa-solid fa-envelope"></i>
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>QUICK LINKS</h4>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/#shop">Shop Collection</Link></li>
            <li><Link href="/#about">About Us</Link></li>
            <li><Link href="/#reviews">Customer Feedback</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>HELP & POLICIES</h4>
          <ul>
            <li>
              <a
                href="/ZYRO_Wear_Shipping_and_Delivery_Policy.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Shipping & Delivery
              </a>
            </li>
            <li>
              <a
                href="/ZYRO_Wear_Returns_Exchanges_Policy.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Returns & Exchanges
              </a>
            </li>
            <li>
              <a
                href="/ZYRO_Wear_Size_Guide.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Size Guide
              </a>
            </li>
            <li>
              <a
                href="/ZYRO_Wear_FAQ.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                FAQ
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-col contact-col">
          <h4>CONNECT WITH US</h4>
          <p><i className="fa-solid fa-envelope"></i> Customer Support</p>
          <a href="mailto:zyrowear718@gmail.com" className="footer-wa-btn" style={{ background: '#FFC700', color: '#0F172A' }}>
            <i className="fa-solid fa-envelope"></i> zyrowear718@gmail.com
          </a>
          <p className="sub-text mt-2">
            <i className="fa-solid fa-clock"></i> Available for instant order updates & support
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>&copy; 2026 ZYRO Wear. All Rights Reserved.</p>
          <p className="tagline">Built Different. Made for You.</p>
        </div>
      </div>
    </footer>
  );
}
