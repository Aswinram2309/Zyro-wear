'use client';

import React, { useState } from 'react';
import { SizeMeasurement } from '@/types';

interface SizeChartProps {
  sizeChart?: Record<string, SizeMeasurement>;
  selectedSize: string;
  onSizeSelect?: (size: string) => void;
}

const DEFAULT_MEASUREMENTS: Record<string, { length: string; chest: string; shoulder: string }> = {
  M: { length: '27', chest: '40', shoulder: '10' },
  L: { length: '29', chest: '42', shoulder: '10' },
  XL: { length: '28', chest: '44', shoulder: '10' },
  XXL: { length: '30', chest: '46', shoulder: '10.5' },
};

export default function SizeChart({ sizeChart, selectedSize, onSizeSelect }: SizeChartProps) {
  const [isSizeChartOpen, setIsSizeChartOpen] = useState<boolean>(false);
  const [isHowToMeasureOpen, setIsHowToMeasureOpen] = useState<boolean>(false);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

  const defaultSizes = ['M', 'L', 'XL', 'XXL'];

  const getVal = (size: string, field: 'length' | 'chest' | 'shoulder') => {
    const dbVal = sizeChart?.[size]?.[field];
    if (dbVal && dbVal.trim() !== '') return dbVal;
    return DEFAULT_MEASUREMENTS[size]?.[field] || '—';
  };

  return (
    <div className="size-chart-accordions-container" style={{ marginTop: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* 1. MAIN SIZE CHART ACCORDION */}
      <div className="size-chart-wrapper" style={{ margin: 0 }}>
        <button
          type="button"
          className="size-chart-header"
          onClick={() => setIsSizeChartOpen((prev) => !prev)}
          aria-expanded={isSizeChartOpen}
          style={{ width: '100%', textTransform: 'uppercase', background: '#181B20', border: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: '#FFF' }}>
            <i className="fa-solid fa-ruler-combined" style={{ color: '#FFC700' }}></i>
            SIZE CHART
          </span>
          <i
            className={`fa-solid fa-chevron-down toggle-arrow ${isSizeChartOpen ? 'expanded' : ''}`}
            style={{ transition: 'transform 0.3s ease', transform: isSizeChartOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          ></i>
        </button>

        {isSizeChartOpen && (
          <div className="size-chart-content">
            <div className="dimensions-panel">
              {/* Header Title */}
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFC700', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                PRODUCT DIMENSIONS
              </h3>

              {/* Unit Indicator */}
              <div className="unit-selector-row" style={{ marginBottom: '0.8rem' }}>
                <span className="unit-selector-label" style={{ fontWeight: 600, color: '#9CA3AF', fontSize: '0.85rem' }}>
                  All measurements are in Inches (in)
                </span>
              </div>

              {/* Measurement Table */}
              <div className="size-chart-table-container">
                <table className="size-chart-table">
                  <thead>
                    <tr>
                      <th>SIZE</th>
                      <th>LENGTH SIZE (INCH)</th>
                      <th>CHEST SIZE (INCH)</th>
                      <th>SHOULDER SIZE (INCH)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaultSizes.map((sz) => {
                      const isActive = selectedSize === sz;
                      const lengthVal = getVal(sz, 'length');
                      const chestVal = getVal(sz, 'chest');
                      const shoulderVal = getVal(sz, 'shoulder');

                      return (
                        <tr
                          key={sz}
                          className={isActive ? 'active-row' : ''}
                          onClick={() => onSizeSelect && onSizeSelect(sz)}
                          style={{ cursor: onSizeSelect ? 'pointer' : 'default' }}
                        >
                          <td className="size-col-label">
                            {sz} {isActive && <span className="active-dot">●</span>}
                          </td>
                          <td>{lengthVal}</td>
                          <td>{chestVal}</td>
                          <td>{shoulderVal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Tip & Note Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.8rem' }}>
                <p className="size-chart-tip" style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0 }}>
                  <i className="fa-solid fa-circle-info" style={{ color: '#FFC700', marginRight: '6px' }}></i>
                  Select the same size you choose in regular fit for oversized look. XXL customer should choose XL for oversize Fit.
                </p>
                <p className="size-chart-tip" style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0 }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ color: '#FFC700', marginRight: '6px' }}></i>
                  All Sizes are approximate and may vary up to +/-0.5 inch.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. HOW TO MEASURE ACCORDION */}
      <div className="size-chart-wrapper" style={{ margin: 0 }}>
        <button
          type="button"
          className="size-chart-header"
          onClick={() => setIsHowToMeasureOpen((prev) => !prev)}
          aria-expanded={isHowToMeasureOpen}
          style={{ width: '100%', textTransform: 'uppercase', background: '#181B20', border: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: '#FFF' }}>
            <i className="fa-solid fa-ruler-horizontal" style={{ color: '#FFC700' }}></i>
            HOW TO MEASURE
          </span>
          <i
            className={`fa-solid fa-chevron-down toggle-arrow ${isHowToMeasureOpen ? 'expanded' : ''}`}
            style={{ transition: 'transform 0.3s ease', transform: isHowToMeasureOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          ></i>
        </button>

        {isHowToMeasureOpen && (
          <div className="size-chart-content">
            <div className="measure-guide-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div
                className="how-to-measure-image-container"
                style={{
                  textAlign: 'center',
                  background: '#0F172A',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,199,0,0.2)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src="/images/size-guide.jpg"
                  alt="ZYRO WEAR Official Size Chart & Measurement Guide"
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px', margin: '0 auto', display: 'block' }}
                />
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '0.6rem',
                    fontSize: '0.78rem',
                    color: '#FFC700',
                    fontWeight: 600,
                  }}
                >
                  <i className="fa-solid fa-expand" style={{ marginRight: '6px' }}></i> Click image to expand size chart
                </span>
              </div>
              <div className="guide-item">
                <strong className="guide-title">
                  <i className="fa-solid fa-arrows-up-down text-gold"></i> 1. Length
                </strong>
                <p className="guide-text">
                  Measure from the highest point of the shoulder straight down to the bottom hem of the jersey.
                </p>
              </div>
              <div className="guide-item">
                <strong className="guide-title">
                  <i className="fa-solid fa-arrows-left-right text-gold"></i> 2. Chest
                </strong>
                <p className="guide-text">
                  Measure horizontally across the chest from armpit to armpit (pit-to-pit) and double it if you want full circumference.
                </p>
              </div>
              <div className="guide-item">
                <strong className="guide-title">
                  <i className="fa-solid fa-ruler-horizontal text-gold"></i> 3. Shoulder
                </strong>
                <p className="guide-text">
                  Measure across the back of the shirt from one shoulder seam point straight to the other shoulder seam point.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal for Full View */}
      {lightboxOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setLightboxOpen(false)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <button
              style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                background: '#FFC700',
                color: '#0F172A',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
              onClick={() => setLightboxOpen(false)}
            >
              ✕
            </button>
            <img
              src="/images/size-guide.jpg"
              alt="ZYRO WEAR Size Chart Full View"
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', border: '2px solid #FFC700' }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
