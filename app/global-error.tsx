'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>Something Went Wrong — ZYRO WEAR</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@600;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body style={{ backgroundColor: '#0A0B0C', color: '#FFFFFF', margin: 0, fontFamily: "'Inter', sans-serif" }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '480px',
            backgroundColor: '#121417',
            border: '1px solid #262930',
            borderRadius: '16px',
            padding: '2.5rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              width: '70px',
              height: '70px',
              backgroundColor: 'rgba(255, 199, 0, 0.12)',
              color: '#FFC700',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              margin: '0 auto 1.5rem auto'
            }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', marginBottom: '0.75rem', fontWeight: 800 }}>
              Something Went Wrong
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              A critical network or application error occurred. Please try reloading the application.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => reset()}
                style={{
                  backgroundColor: '#FFC700',
                  color: '#0A0B0C',
                  border: 'none',
                  padding: '0.85rem 1.75rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-rotate-right" style={{ marginRight: '0.5rem' }}></i> Reload Page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
