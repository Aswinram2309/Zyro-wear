import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="notfound-page-wrapper">
      <div className="notfound-card">
        <div className="notfound-icon-circle">
          <i className="fa-solid fa-compass-drafting"></i>
        </div>

        <div className="notfound-badge">404 ERROR</div>

        <h1 className="notfound-title">Page Not Found</h1>
        <p className="notfound-description">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>

        <div className="notfound-actions">
          <Link href="/" className="notfound-btn-primary">
            <i className="fa-solid fa-store"></i> Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
