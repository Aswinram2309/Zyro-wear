import React from 'react';

export default function Loading() {
  return (
    <div className="page-loading-wrapper" role="status" aria-live="polite">
      <div className="page-loading-content">
        <div className="page-loading-spinner">
          <i className="fa-solid fa-circle-notch fa-spin"></i>
        </div>
        <span className="page-loading-text">Loading...</span>
      </div>
    </div>
  );
}
