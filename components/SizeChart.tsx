'use client';

import React, { useState } from 'react';
import { SizeMeasurement } from '@/types';

interface SizeChartProps {
  sizeChart?: Record<string, SizeMeasurement>;
}

export default function SizeChart({ sizeChart }: SizeChartProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dimensions' | 'measure'>('dimensions');
  const [unit, setUnit] = useState<'inch' | 'cm'>('inch');

  const defaultSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  // Helper to convert inches to cm dynamically
  const formatVal = (val?: string, targetUnit: 'inch' | 'cm' = 'inch') => {
    if (!val || val.trim() === '') return '—';
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    if (targetUnit === 'cm') {
      return (num * 2.54).toFixed(1);
    }
    return String(num);
  };

  return (
    <div className="size-chart-wrapper">
      {/* Accordion Trigger Header */}
      <div className="size-chart-header" onClick={() => setIsOpen(!isOpen)}>
        <span>Size Chart</span>
        <i className={`fa-solid fa-chevron-down toggle-arrow ${isOpen ? 'expanded' : ''}`}></i>
      </div>

      {isOpen && (
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
              {/* Unit Selector */}
              <div className="unit-selector-row">
                <span className="unit-selector-label">Select measurement unit:</span>
                <div className="unit-toggle-pills">
                  <button
                    className={`unit-toggle-btn ${unit === 'inch' ? 'active' : ''}`}
                    onClick={() => setUnit('inch')}
                  >
                    inch
                  </button>
                  <button
                    className={`unit-toggle-btn ${unit === 'cm' ? 'active' : ''}`}
                    onClick={() => setUnit('cm')}
                  >
                    cm
                  </button>
                </div>
              </div>

              {/* Measurement Table */}
              <div className="size-chart-table-container">
                <table className="size-chart-table">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Length Size ({unit})</th>
                      <th>Chest Size ({unit})</th>
                      <th>Shoulder Size ({unit})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaultSizes.map((sz) => {
                      const m = sizeChart?.[sz] || {};
                      return (
                        <tr key={sz}>
                          <td className="size-col-label">{sz}</td>
                          <td>{formatVal(m.length, unit)}</td>
                          <td>{formatVal(m.chest, unit)}</td>
                          <td>{formatVal(m.shoulder, unit)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* How to Measure Panel */}
          {activeTab === 'measure' && (
            <div className="measure-guide-panel">
              <div className="guide-item">
                <strong className="guide-title"><i className="fa-solid fa-arrows-up-down text-gold"></i> 1. Length</strong>
                <p className="guide-text">Measure from the highest point of the shoulder straight down to the bottom hem of the jersey.</p>
              </div>
              <div className="guide-item">
                <strong className="guide-title"><i className="fa-solid fa-arrows-left-right text-gold"></i> 2. Chest</strong>
                <p className="guide-text">Measure horizontally across the chest from armpit to armpit (pit-to-pit) and double it if you want full circumference.</p>
              </div>
              <div className="guide-item">
                <strong className="guide-title"><i className="fa-solid fa-ruler-horizontal text-gold"></i> 3. Shoulder</strong>
                <p className="guide-text">Measure across the back of the shirt from one shoulder seam point straight to the other shoulder seam point.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
