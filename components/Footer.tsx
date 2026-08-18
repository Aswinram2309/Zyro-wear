'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-container">
        <div className="footer-col brand-col">
          <img src="/Logo/Zyro wears logo.png" alt="ZYRO WEAR Logo" className="footer-logo" />
          <p className="footer-about">
            ZYRO Wear delivers top-quality international football jerseys and sportswear. Wear your passion with pride.
          </p>
          <div className="social-links">
            <a href="https://www.instagram.com/zyro.__.wear?igsh=N3Bvd3BteG9uYzlt" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a href="https://wa.me/917200515977" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <i className="fa-brands fa-whatsapp"></i>
            </a>
            <a href="mailto:zyrowear718@gmail.com" aria-label="Email">
              <i className="fa-solid fa-envelope"></i>
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>QUICK LINKS</h4>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#shop">Shop Collection</a></li>
            <li><a href="#about">About Us</a></li>
            <li><a href="#reviews">Customer Feedback</a></li>
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
          <p><i className="fa-solid fa-phone"></i> WhatsApp Order Line</p>
          <a href="https://wa.me/917200515977" target="_blank" rel="noopener noreferrer" className="footer-wa-btn">
            <i className="fa-brands fa-whatsapp"></i> +91 72005 15977
          </a>
          <p className="sub-text mt-2">
            <i className="fa-solid fa-clock"></i> Available 24/7 for instant order confirmations
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
