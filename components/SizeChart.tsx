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
  const [activeTab, setActiveTab] = useState<'dimensions' | 'measure'>('dimensions');

  const defaultSizes = ['M', 'L', 'XL', 'XXL'];

  const getVal = (size: string, field: 'length' | 'chest' | 'shoulder') => {
    const dbVal = sizeChart?.[size]?.[field];
    if (dbVal && dbVal.trim() !== '') return dbVal;
    return DEFAULT_MEASUREMENTS[size]?.[field] || '—';
  };

  return (
    <div className="size-chart-wrapper">
      {/* Static Header Section */}
      <div className="size-chart-header" style={{ cursor: 'default' }}>
        <span>Size Chart</span>
      </div>

      <div className="size-chart-content">
        {/* Inner Navigation Tabs */}
        <div className="size-chart-tabs">
          <button
            className={`chart-tab-btn ${activeTab === 'dimensions' ? 'active' : ''}`}
            onClick={() => setActiveTab('dimensions')}
          >
            Product Dimensions
          </button>
          <button
            className={`chart-tab-btn ${activeTab === 'measure' ? 'active' : ''}`}
            onClick={() => setActiveTab('measure')}
          >
            How to Measure
          </button>
        </div>

        {/* Product Dimensions Panel */}
        {activeTab === 'dimensions' && (
          <div className="dimensions-panel">
            {/* Unit Indicator (Inch Only) */}
            <div className="unit-selector-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="unit-selector-label" style={{ fontWeight: 600, color: '#FFC700' }}>
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
                Select the same size you choose in regular fit for over sized look. XXL customer should choose XL for oversize Fit.
              </p>
              <p className="size-chart-tip" style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0 }}>
                <i className="fa-solid fa-circle-exclamation" style={{ color: '#FFC700', marginRight: '6px' }}></i>
                All Sizes are approximate and may vary up to +/-0.5 inch.
              </p>
            </div>
          </div>
        )}

        {/* How to Measure Panel */}
        {activeTab === 'measure' && (
          <div className="measure-guide-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div className="how-to-measure-image-container" style={{ textAlign: 'center', background: '#0F172A', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,199,0,0.2)' }}>
              <img
                src="/images/size-guide.jpg"
                alt="How to Measure Jersey Size Guide"
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px', margin: '0 auto', display: 'block' }}
              />
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
        )}
      </div>
    </div>
  );
}
