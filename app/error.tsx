'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for diagnostics
    console.error('Unhandled App Error:', error);
  }, [error]);

  return (
    <div className="error-page-wrapper">
      <div className="error-card">
        <div className="error-icon-circle">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>

        <div className="error-badge">ERROR DETECTED</div>

        <h1 className="error-title">Something Went Wrong</h1>
        <p className="error-description">
          We encountered an unexpected network or application issue. Don&apos;t worry, your cart and session data are safe.
        </p>

        {error?.message && (
          <div className="error-details-box">
            <code>{error.message}</code>
          </div>
        )}

        <div className="error-actions">
          <button onClick={() => reset()} className="error-btn-primary">
            <i className="fa-solid fa-rotate-right"></i> Try Again
          </button>

          <Link href="/" className="error-btn-secondary">
            <i className="fa-solid fa-house"></i> Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
