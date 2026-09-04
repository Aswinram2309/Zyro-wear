'use client';

import React, { useState, useEffect } from 'react';

export default function OfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showRestoredToast, setShowRestoredToast] = useState(false);
  const [lastCheckedText, setLastCheckedText] = useState<string | null>(null);

  useEffect(() => {
    // Initial check on mount
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    const handleOffline = () => {
      setIsOffline(true);
      setShowRestoredToast(false);
    };

    const handleOnline = () => {
      // Test actual connectivity before marking online
      verifyConnection();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const verifyConnection = async () => {
    setIsChecking(true);
    setLastCheckedText('Checking connection...');

    try {
      // Fetch with cache busting and short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`/favicon.ico?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok || res.status < 500) {
        setIsOffline(false);
        setShowRestoredToast(true);
        setLastCheckedText(null);

        // Hide restored toast after 4 seconds
        setTimeout(() => {
          setShowRestoredToast(false);
        }, 4000);
      } else {
        setIsOffline(true);
        setLastCheckedText('Server unreachable. Please try again.');
      }
    } catch {
      setIsOffline(true);
      setLastCheckedText('Still offline. Please check your network.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      {/* Offline Modal Overlay */}
      {isOffline && (
        <div className="offline-overlay" role="dialog" aria-modal="true">
          <div className="offline-card">
            <div className="offline-icon-wrapper">
              <div className="offline-pulse-ring"></div>
              <div className="offline-icon-circle">
                <i className="fa-solid fa-wifi-slash"></i>
              </div>
            </div>

            <div className="offline-badge">
              <span className="offline-dot"></span>
              NO NETWORK CONNECTION
            </div>

            <h2 className="offline-title">Something Went Wrong</h2>
            <p className="offline-description">
              You are currently offline. Please check your internet connection or mobile data to continue browsing ZYRO WEAR.
            </p>

            {lastCheckedText && (
              <p className="offline-status-msg">
                <i className="fa-solid fa-circle-info"></i> {lastCheckedText}
              </p>
            )}

            <div className="offline-actions">
              <button
                className="offline-retry-btn"
                onClick={verifyConnection}
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Checking Network...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-rotate-right"></i> Try Again
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Online Restored Toast Notification */}
      {showRestoredToast && !isOffline && (
        <div className="offline-toast-restored" role="status">
          <i className="fa-solid fa-circle-check"></i>
          <span>Back Online! Connection restored.</span>
        </div>
      )}
    </>
  );
}
