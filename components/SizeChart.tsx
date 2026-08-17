'use client';

import React, { useState } from 'react';
import { SizeMeasurement } from '@/types';

interface SizeChartProps {
  sizeChart?: Record<string, SizeMeasurement>;
  selectedSize: string;
  onSizeSelect?: (size: string) => void;
}

const DEFAULT_MEASUREMENTS: Record<string, { length: string; chest: string; shoulder: string; sleeve: string }> = {
  XS: { length: '26', chest: '38', shoulder: '9.5', sleeve: '7.5' },
  S: { length: '27', chest: '40', shoulder: '10', sleeve: '8' },
  M: { length: '28', chest: '42', shoulder: '10.5', sleeve: '8.5' },
  L: { length: '29', chest: '44', shoulder: '11', sleeve: '9' },
  XL: { length: '30', chest: '46', shoulder: '11.5', sleeve: '9.5' },
  XXL: { length: '31', chest: '48', shoulder: '12', sleeve: '10' },
  '2XL': { length: '31', chest: '48', shoulder: '12', sleeve: '10' },
};

export default function SizeChart({ sizeChart, selectedSize, onSizeSelect }: SizeChartProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dimensions' | 'measure'>('dimensions');
  const [unit, setUnit] = useState<'inch' | 'cm'>('inch');

  const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL'];
  const sizesToRender = sizeChart && Object.keys(sizeChart).length > 0
    ? Object.keys(sizeChart).sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b))
    : ['S', 'M', 'L', 'XL', 'XXL'];

  // Helper to convert inches to cm dynamically
  const formatVal = (val?: string, targetUnit: 'inch' | 'cm' = 'inch') => {
    if (!val || val.trim() === '' || val === '—') return '—';
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    if (targetUnit === 'cm') {
      return (num * 2.54).toFixed(1);
    }
    return String(num);
  };

  const getVal = (size: string, field: 'length' | 'chest' | 'shoulder' | 'sleeve') => {
    const dbVal = sizeChart?.[size]?.[field];
    if (dbVal && dbVal.trim() !== '') return dbVal;
    return DEFAULT_MEASUREMENTS[size]?.[field] || '—';
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
                      <th>Sleeve Size ({unit})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizesToRender.map((sz) => {
                      const isActive = selectedSize === sz;
                      const lengthVal = getVal(sz, 'length');
                      const chestVal = getVal(sz, 'chest');
                      const shoulderVal = getVal(sz, 'shoulder');
                      const sleeveVal = getVal(sz, 'sleeve');

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
                          <td>{formatVal(lengthVal, unit)}</td>
                          <td>{formatVal(chestVal, unit)}</td>
                          <td>{formatVal(shoulderVal, unit)}</td>
                          <td>{formatVal(sleeveVal, unit)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="size-chart-tip" style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '0.8rem', margin: 0 }}>
                <i className="fa-solid fa-circle-info"></i> Click any size row in the chart to select it.
              </p>
            </div>
          )}

          {/* How to Measure Panel */}
          {activeTab === 'measure' && (
            <div className="measure-guide-panel">
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
      )}
    </div>
  );
}
