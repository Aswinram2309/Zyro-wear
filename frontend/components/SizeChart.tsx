'use client';

import React, { useState, useEffect } from 'react';
import { SizeMeasurement, SizeChartRecord, SizeChartMeasurementRow } from '@/shared/types';
import {
  getSizeChartConfig,
  getSizeChartType,
  getProductMeasurement,
  getMeasurementFromRecord,
  SizeChartType,
} from '@/shared/constants/size-chart-config';
import { formatImageUrl } from '@/shared/constants/stock-config';

interface SizeChartProps {
  sizeChart?: Record<string, SizeMeasurement>;
  category?: string;
  productName?: string;
  availableSizes?: string[];
  selectedSize: string;
  onSizeSelect?: (size: string) => void;
  activeChartRecord?: SizeChartRecord | null;
  productSizeChartImg?: string | null;
  productHowToMeasureImg?: string | null;
}

export default function SizeChart({
  sizeChart,
  category,
  productName = '',
  availableSizes,
  selectedSize,
  onSizeSelect,
  activeChartRecord: initialActiveRecord,
  productSizeChartImg,
  productHowToMeasureImg,
}: SizeChartProps) {
  const [isSizeChartOpen, setIsSizeChartOpen] = useState<boolean>(false);
  const [isHowToMeasureOpen, setIsHowToMeasureOpen] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const chartType: SizeChartType = getSizeChartType(category, productName);
  const config = getSizeChartConfig(category, productName);

  // Dynamic active chart from server/API
  const [activeRecord, setActiveRecord] = useState<SizeChartRecord | null>(initialActiveRecord || null);

  useEffect(() => {
    if (initialActiveRecord) {
      setActiveRecord(initialActiveRecord);
      return;
    }

    let isMounted = true;
    const fetchActiveChart = async () => {
      try {
        const res = await fetch(`/api/size-charts?type=${chartType}&t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.chart) {
            setActiveRecord(data.chart);
          }
        }
      } catch (err) {
        // Silently use static configuration fallback
      }
    };

    fetchActiveChart();
    return () => {
      isMounted = false;
    };
  }, [chartType, initialActiveRecord]);

  // Determine sizes to display
  // 1. If availableSizes is provided by product, filter 'S'
  // 2. Else if activeRecord has measurements rows, use them
  // 3. Else fallback to ['M', 'L', 'XL', 'XXL']
  const recordSizes = activeRecord?.measurements?.map((m) => m.size).filter((s) => s !== 'S') || [];
  const sizesToDisplay =
    availableSizes && availableSizes.length > 0
      ? availableSizes.filter((sz) => sz !== 'S')
      : recordSizes.length > 0
      ? recordSizes
      : ['M', 'L', 'XL', 'XXL'];

  // Determine Columns:
  // If OVERSIZED, show SHOULDER, CHEST, LENGTH, SLEEVE
  // If NORMAL, show LENGTH, CHEST, SHOULDER (and SLEEVE if present)
  const isOversized = chartType === 'OVERSIZED';
  const columns: Array<{ key: keyof SizeChartMeasurementRow; label: string }> = isOversized
    ? [
        { key: 'shoulder', label: 'SHOULDER (IN)' },
        { key: 'chest', label: 'CHEST (IN)' },
        { key: 'length', label: 'LENGTH (IN)' },
        { key: 'sleeve', label: 'SLEEVE (IN)' },
      ]
    : [
        { key: 'length', label: 'LENGTH (IN)' },
        { key: 'chest', label: 'CHEST (IN)' },
        { key: 'shoulder', label: 'SHOULDER (IN)' },
      ];

  const chartTitle = activeRecord?.name || (isOversized ? 'OVERSIZED TEE SIZE CHART' : 'PRODUCT DIMENSIONS');
  const chartUnit = activeRecord?.unit || config.unit;
  const chartTips = activeRecord?.tips && activeRecord.tips.length > 0 ? activeRecord.tips : config.tips;
  const howToMeasureImg = productHowToMeasureImg
    ? formatImageUrl(productHowToMeasureImg)
    : activeRecord?.how_to_measure_image_url
    ? formatImageUrl(activeRecord.how_to_measure_image_url)
    : config.howToMeasureImage;
  const sizeChartImg = productSizeChartImg ? formatImageUrl(productSizeChartImg) : null;

  return (
    <div
      className="size-chart-accordions-container"
      style={{
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        width: '100%',
      }}
    >
      {/* 1. MAIN SIZE CHART ACCORDION */}
      <div className="size-chart-wrapper" style={{ margin: 0, width: '100%' }}>
        <button
          type="button"
          className="size-chart-header"
          onClick={() => setIsSizeChartOpen((prev) => !prev)}
          aria-expanded={isSizeChartOpen}
          style={{
            width: '100%',
            textTransform: 'uppercase',
            background: '#181B20',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: '#FFF', fontWeight: 800 }}>
            <i className="fa-solid fa-ruler-combined" style={{ color: '#FFC700' }}></i>
            {isOversized ? 'OVERSIZED TEE SIZE CHART' : 'SIZE CHART'}
          </span>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            {isOversized && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  background: 'rgba(255, 199, 0, 0.15)',
                  color: '#FFC700',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 199, 0, 0.3)',
                  textTransform: 'uppercase',
                }}
              >
                Oversized Fit
              </span>
            )}
            <i
              className={`fa-solid fa-chevron-down toggle-arrow ${isSizeChartOpen ? 'expanded' : ''}`}
              style={{
                transition: 'transform 0.3s ease',
                transform: isSizeChartOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                color: '#9CA3AF',
              }}
            ></i>
          </div>
        </button>

        {isSizeChartOpen && (
          <div className="size-chart-content" style={{ marginTop: '0.5rem' }}>
            <div className="dimensions-panel" style={{ background: '#111317', border: '1px solid #262930', borderRadius: '8px', padding: '1.25rem' }}>
              {/* Header Title & Subtitle */}
              <div style={{ marginBottom: '0.8rem' }}>
                <h3
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#FFC700',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {chartTitle}
                </h3>
                {config.subtitle && (
                  <p
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#9CA3AF',
                      margin: '2px 0 0 0',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {config.subtitle}
                  </p>
                )}
              </div>

              {/* Unit Indicator */}
              <div className="unit-selector-row" style={{ marginBottom: '0.8rem' }}>
                <span className="unit-selector-label" style={{ fontWeight: 600, color: '#9CA3AF', fontSize: '0.82rem' }}>
                  {chartUnit}
                </span>
              </div>
              
              {sizeChartImg && (
                <div style={{ marginBottom: '1rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => setLightboxImage(sizeChartImg)}>
                  <img src={sizeChartImg} alt="Product Size Chart" style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px', border: '1px solid #262930' }} />
                </div>
              )}

              {/* Structured Measurement Table */}
              <div className="size-chart-table-container" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="size-chart-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#181B20', padding: '0.6rem', color: '#FFF', fontSize: '0.8rem', textAlign: 'center' }}>SIZE</th>
                      {columns.map((col) => (
                        <th key={col.key} style={{ background: '#181B20', padding: '0.6rem', color: '#FFF', fontSize: '0.8rem', textAlign: 'center' }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizesToDisplay.map((sz) => {
                      const isActive = selectedSize === sz;
                      return (
                        <tr
                          key={sz}
                          className={isActive ? 'active-row' : ''}
                          onClick={() => onSizeSelect && onSizeSelect(sz)}
                          style={{
                            cursor: onSizeSelect ? 'pointer' : 'default',
                            background: isActive ? 'rgba(255, 199, 0, 0.12)' : 'transparent',
                            borderBottom: '1px solid #262930',
                          }}
                        >
                          <td
                            className="size-col-label"
                            style={{
                              padding: '0.6rem',
                              textAlign: 'center',
                              fontWeight: 800,
                              color: isActive ? '#FFC700' : '#FFF',
                              background: isActive ? '#1F2228' : 'transparent',
                            }}
                          >
                            {sz} {isActive && <span className="active-dot" style={{ color: '#FFC700' }}>●</span>}
                          </td>
                          {columns.map((col) => {
                            const val = getProductMeasurement(
                              sizeChart,
                              category,
                              productName,
                              sz,
                              col.key as keyof SizeMeasurement,
                              activeRecord
                            );
                            return (
                              <td
                                key={col.key}
                                style={{
                                  padding: '0.6rem',
                                  textAlign: 'center',
                                  color: isActive ? '#FFC700' : '#E5E7EB',
                                  fontWeight: isActive ? 700 : 500,
                                }}
                              >
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Oversized Features Badges */}
              {isOversized && config.features && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '0.5rem',
                    marginTop: '1rem',
                    paddingTop: '0.8rem',
                    borderTop: '1px solid #262930',
                  }}
                >
                  {config.features.map((feat, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#0A0B0C',
                        border: '1px solid #262930',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#E5E7EB',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <i className="fa-solid fa-check" style={{ color: '#FFC700', fontSize: '0.7rem' }}></i>
                      {feat}
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Tip & Note Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.8rem' }}>
                {chartTips.map((tip, idx) => (
                  <p key={idx} className="size-chart-tip" style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0 }}>
                    <i
                      className={`fa-solid ${idx === 0 ? 'fa-circle-info' : 'fa-circle-exclamation'}`}
                      style={{ color: '#FFC700', marginRight: '6px' }}
                    ></i>
                    {tip}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. HOW TO MEASURE ACCORDION */}
      <div className="size-chart-wrapper" style={{ margin: 0, width: '100%' }}>
        <button
          type="button"
          className="size-chart-header"
          onClick={() => setIsHowToMeasureOpen((prev) => !prev)}
          aria-expanded={isHowToMeasureOpen}
          style={{
            width: '100%',
            textTransform: 'uppercase',
            background: '#181B20',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: '#FFF', fontWeight: 800 }}>
            <i className="fa-solid fa-ruler-horizontal" style={{ color: '#FFC700' }}></i>
            HOW TO MEASURE
          </span>
          <i
            className={`fa-solid fa-chevron-down toggle-arrow ${isHowToMeasureOpen ? 'expanded' : ''}`}
            style={{
              transition: 'transform 0.3s ease',
              transform: isHowToMeasureOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              color: '#9CA3AF',
            }}
          ></i>
        </button>

        {isHowToMeasureOpen && (
          <div className="size-chart-content" style={{ marginTop: '0.5rem' }}>
            <div
              className="measure-guide-panel"
              style={{
                background: '#111317',
                border: '1px solid #262930',
                borderRadius: '8px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2rem',
              }}
            >
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
                onClick={() => setLightboxImage(howToMeasureImg)}
              >
                <img
                  src={howToMeasureImg}
                  alt={`ZYRO WEAR ${chartTitle} & How to Measure Guide`}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '6px',
                    margin: '0 auto',
                    display: 'block',
                  }}
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

              {config.howToMeasureSteps.map((step, idx) => (
                <div key={idx} className="guide-item" style={{ background: '#1C1E24', border: '1px solid #262930', borderRadius: '8px', padding: '0.9rem' }}>
                  <strong className="guide-title" style={{ color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                    <i className={`${step.icon}`} style={{ color: '#FFC700' }}></i> {step.title}
                  </strong>
                  <p className="guide-text" style={{ fontSize: '0.82rem', color: '#9CA3AF', margin: 0, lineHeight: 1.45 }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal for Full Image View */}
      {lightboxImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setLightboxImage(null)}
        >
          <div
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
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
              onClick={() => setLightboxImage(null)}
            >
              ✕
            </button>
            <img
              src={lightboxImage}
              alt={`ZYRO WEAR Size Chart Full View`}
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '2px solid #FFC700',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
