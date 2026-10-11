'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SizeMeasurement, SizeChartRecord, SizeChartMeasurementRow } from '@/shared/types';
import {
  NORMAL_SIZE_CHART_CONFIG,
  getProductMeasurement,
  getSizeChartConfig,
} from '@/shared/constants/size-chart-config';
import { formatImageUrl, normalizeCategory } from '@/shared/constants/stock-config';

interface SizeChartProps {
  sizeChart?: Record<string, SizeMeasurement>;
  sizeChartId?: string | null;
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
  sizeChartId,
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

  const normCat = normalizeCategory(category || '', productName);
  const isBrandCategory = normCat === 'Oversized T-Shirts' || normCat === 'Customized T-Shirts';

  const [activeRecord, setActiveRecord] = useState<SizeChartRecord | null>(initialActiveRecord ?? null);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);

  useEffect(() => {
    if (initialActiveRecord !== undefined) {
      setActiveRecord(initialActiveRecord);
      return;
    }

    let isMounted = true;
    if (isBrandCategory) {
      if (sizeChartId) {
        setIsLoadingChart(true);
        fetch(`/api/size-charts?id=${encodeURIComponent(sizeChartId)}&t=${Date.now()}`, { cache: 'no-store' })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (isMounted) {
              setActiveRecord(data?.chart || null);
            }
          })
          .catch(() => {
            if (isMounted) setActiveRecord(null);
          })
          .finally(() => {
            if (isMounted) setIsLoadingChart(false);
          });
      } else {
        setActiveRecord(null);
      }
    } else {
      // Football Jerseys & IPL Jerseys: preserve standard normal size chart
      setIsLoadingChart(true);
      fetch(`/api/size-charts?type=NORMAL&t=${Date.now()}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data?.chart) {
            setActiveRecord(data.chart);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsLoadingChart(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [initialActiveRecord, sizeChartId, isBrandCategory]);

  // Extract dynamic columns for brand size charts
  const brandColumns: string[] = useMemo(() => {
    if (!activeRecord) return [];
    if (Array.isArray(activeRecord.columns) && activeRecord.columns.length > 0) {
      return activeRecord.columns;
    }
    if (Array.isArray(activeRecord.measurements) && activeRecord.measurements.length > 0) {
      const ignored = new Set(['size', 'id', 'created_at', 'updated_at', 'size_chart_id']);
      const cols: string[] = [];
      for (const row of activeRecord.measurements) {
        Object.keys(row).forEach((k) => {
          if (!ignored.has(k.toLowerCase()) && !cols.includes(k)) {
            cols.push(k);
          }
        });
      }
      if (cols.length > 0) return cols;
    }
    return ['Length', 'Chest', 'Shoulder', 'Sleeve'];
  }, [activeRecord]);

  const getBrandRowValue = (row: any, colName: string): string => {
    if (!row) return '-';
    if (row[colName] !== undefined && row[colName] !== null && String(row[colName]).trim() !== '') {
      return String(row[colName]).trim();
    }
    const matchKey = Object.keys(row).find((k) => k.toLowerCase() === colName.toLowerCase());
    if (matchKey && row[matchKey] !== undefined && row[matchKey] !== null && String(row[matchKey]).trim() !== '') {
      return String(row[matchKey]).trim();
    }
    return '-';
  };

  // Football & IPL Jerseys configuration
  const normalConfig = NORMAL_SIZE_CHART_CONFIG;
  const jerseyColumns: Array<{ key: keyof SizeChartMeasurementRow; label: string }> = [
    { key: 'length', label: 'LENGTH (IN)' },
    { key: 'chest', label: 'CHEST (IN)' },
    { key: 'shoulder', label: 'SHOULDER (IN)' },
  ];
  const jerseySizesToDisplay =
    availableSizes && availableSizes.length > 0
      ? availableSizes.filter((sz) => sz !== 'S')
      : ['M', 'L', 'XL', 'XXL'];

  const brandImageRaw = activeRecord?.image_url || activeRecord?.chart_image_url || productSizeChartImg;
  const brandImageClean = brandImageRaw ? formatImageUrl(brandImageRaw) : null;

  const jerseySizeChartImg = productSizeChartImg ? formatImageUrl(productSizeChartImg) : null;
  const jerseyHowToMeasureImg = productHowToMeasureImg
    ? formatImageUrl(productHowToMeasureImg)
    : activeRecord?.how_to_measure_image_url
    ? formatImageUrl(activeRecord.how_to_measure_image_url)
    : normalConfig.howToMeasureImage;

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
            SIZE CHART
          </span>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
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
              {isBrandCategory ? (normCat === 'Oversized T-Shirts' ? 'Oversized Fit' : 'Custom Fit') : 'Standard Fit'}
            </span>
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
            {isBrandCategory ? (
              /* ==============================================================
                 BRAND-BASED SIZE CHART (Oversized & Customized T-Shirts)
                 ============================================================== */
              isLoadingChart ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2rem 1.5rem',
                    background: '#111317',
                    border: '1px solid #262930',
                    borderRadius: '8px',
                    color: '#9CA3AF',
                    fontSize: '0.9rem',
                  }}
                >
                  <i className="fa-solid fa-spinner fa-spin" style={{ color: '#FFC700', marginRight: '8px' }}></i>
                  Loading brand size chart...
                </div>
              ) : !activeRecord ? (
                /* STRICT RULE: If no chart is assigned, show clear "Size chart not available" */
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem 1.5rem',
                    background: '#111317',
                    border: '1px solid #262930',
                    borderRadius: '8px',
                  }}
                >
                  <i className="fa-solid fa-circle-info" style={{ color: '#FFC700', fontSize: '2rem', marginBottom: '0.8rem', display: 'inline-block' }}></i>
                  <h4 style={{ color: '#FFF', fontSize: '1.05rem', fontWeight: 800, margin: '0 0 0.4rem 0', letterSpacing: '0.5px' }}>
                    Size chart not available
                  </h4>
                  <p style={{ color: '#9CA3AF', fontSize: '0.85rem', margin: 0 }}>
                    A size chart has not been assigned for this product.
                  </p>
                </div>
              ) : (
                /* Active Brand Size Chart Display */
                <div
                  className="dimensions-panel"
                  style={{
                    background: '#111317',
                    border: '1px solid #262930',
                    borderRadius: '8px',
                    padding: '1.25rem',
                  }}
                >
                  {/* Unit Info Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      marginBottom: '0.8rem',
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: 600 }}>
                      {activeRecord.unit ? `Unit: ${activeRecord.unit}` : 'All measurements in inches'}
                    </span>
                  </div>

                  {/* Uploaded Brand Size Chart Image (Only shown if provided) */}
                  {brandImageClean && (
                    <div
                      style={{
                        marginBottom: '1.25rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: '#0B0D11',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 199, 0, 0.2)',
                      }}
                      onClick={() => setLightboxImage(brandImageClean)}
                    >
                      <img
                        src={brandImageClean}
                        alt="Product Size Chart"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '400px',
                          borderRadius: '6px',
                          objectFit: 'contain',
                          margin: '0 auto',
                          display: 'block',
                        }}
                      />
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: '0.5rem',
                          fontSize: '0.75rem',
                          color: '#FFC700',
                          fontWeight: 600,
                        }}
                      >
                        <i className="fa-solid fa-expand" style={{ marginRight: '5px' }}></i> Click image to view full size
                      </span>
                    </div>
                  )}

                  {/* Dynamic Brand Measurements Table */}
                  <div
                    className="size-chart-table-container"
                    style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
                  >
                    <table className="size-chart-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th
                            style={{
                              background: '#181B20',
                              padding: '0.7rem 0.8rem',
                              color: '#FFF',
                              fontSize: '0.82rem',
                              textAlign: 'center',
                              fontWeight: 800,
                            }}
                          >
                            SIZE
                          </th>
                          {brandColumns.map((col) => (
                            <th
                              key={col}
                              style={{
                                background: '#181B20',
                                padding: '0.7rem 0.8rem',
                                color: '#FFF',
                                fontSize: '0.82rem',
                                textAlign: 'center',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                              }}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(activeRecord.measurements && activeRecord.measurements.length > 0) ? (
                          activeRecord.measurements.map((row) => {
                            const isActive = selectedSize?.toUpperCase() === row.size?.toUpperCase();
                            return (
                              <tr
                                key={row.size || Math.random()}
                                className={isActive ? 'active-row' : ''}
                                onClick={() => onSizeSelect && row.size && onSizeSelect(row.size)}
                                style={{
                                  cursor: onSizeSelect ? 'pointer' : 'default',
                                  background: isActive ? 'rgba(255, 199, 0, 0.12)' : 'transparent',
                                  borderBottom: '1px solid #262930',
                                  transition: 'background 0.2s ease',
                                }}
                              >
                                <td
                                  className="size-col-label"
                                  style={{
                                    padding: '0.7rem 0.8rem',
                                    textAlign: 'center',
                                    fontWeight: 800,
                                    color: isActive ? '#FFC700' : '#FFF',
                                    background: isActive ? '#1F2228' : 'transparent',
                                  }}
                                >
                                  {row.size} {isActive && <span className="active-dot" style={{ color: '#FFC700' }}>●</span>}
                                </td>
                                {brandColumns.map((col) => {
                                  const displayVal = getBrandRowValue(row, col);
                                  return (
                                    <td
                                      key={col}
                                      style={{
                                        padding: '0.7rem 0.8rem',
                                        textAlign: 'center',
                                        color: isActive ? '#FFC700' : '#E5E7EB',
                                        fontWeight: isActive ? 700 : 500,
                                      }}
                                    >
                                      {displayVal}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={brandColumns.length + 1}
                              style={{
                                padding: '1rem',
                                textAlign: 'center',
                                color: '#9CA3AF',
                                fontSize: '0.85rem',
                              }}
                            >
                              No measurements entered for this brand yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Tips Note */}
                  <div style={{ marginTop: '1rem', borderTop: '1px solid #262930', paddingTop: '0.8rem' }}>
                    <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: 0 }}>
                      <i className="fa-solid fa-circle-info" style={{ color: '#FFC700', marginRight: '6px' }}></i>
                      Measurements are garment dimensions. Tolerance: ±0.5 inches.
                    </p>
                  </div>
                </div>
              )
            ) : (
              /* ==============================================================
                 PRESERVED FOOTBALL & IPL JERSEYS SIZE CHART
                 ============================================================== */
              <div
                className="dimensions-panel"
                style={{
                  background: '#111317',
                  border: '1px solid #262930',
                  borderRadius: '8px',
                  padding: '1.25rem',
                }}
              >
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
                    {normalConfig.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#9CA3AF',
                      margin: '2px 0 0 0',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {normalConfig.subtitle}
                  </p>
                </div>

                <div className="unit-selector-row" style={{ marginBottom: '0.8rem' }}>
                  <span className="unit-selector-label" style={{ fontWeight: 600, color: '#9CA3AF', fontSize: '0.82rem' }}>
                    {normalConfig.unit}
                  </span>
                </div>

                {jerseySizeChartImg && (
                  <div
                    style={{ marginBottom: '1rem', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => setLightboxImage(jerseySizeChartImg)}
                  >
                    <img
                      src={jerseySizeChartImg}
                      alt="Product Size Chart"
                      style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px', border: '1px solid #262930' }}
                    />
                  </div>
                )}

                <div className="size-chart-table-container" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table className="size-chart-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ background: '#181B20', padding: '0.6rem', color: '#FFF', fontSize: '0.8rem', textAlign: 'center' }}>
                          SIZE
                        </th>
                        {jerseyColumns.map((col) => (
                          <th key={col.key} style={{ background: '#181B20', padding: '0.6rem', color: '#FFF', fontSize: '0.8rem', textAlign: 'center' }}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {jerseySizesToDisplay.map((sz) => {
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
                            {jerseyColumns.map((col) => {
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.8rem' }}>
                  {normalConfig.tips.map((tip, idx) => (
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
            )}
          </div>
        )}
      </div>

      {/* 2. HOW TO MEASURE ACCORDION (Preserved for Jerseys & available when guide images exist) */}
      {(!isBrandCategory || productHowToMeasureImg || activeRecord?.how_to_measure_image_url) && (
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
                  onClick={() => setLightboxImage(jerseyHowToMeasureImg)}
                >
                  <img
                    src={jerseyHowToMeasureImg}
                    alt={`ZYRO WEAR Size & How to Measure Guide`}
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
                    <i className="fa-solid fa-expand" style={{ marginRight: '6px' }}></i> Click image to expand guide
                  </span>
                </div>

                {normalConfig.howToMeasureSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="guide-item"
                    style={{ background: '#1C1E24', border: '1px solid #262930', borderRadius: '8px', padding: '0.9rem' }}
                  >
                    <strong
                      className="guide-title"
                      style={{
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.3rem',
                        fontSize: '0.9rem',
                      }}
                    >
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
      )}

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
              alt="Size Chart Full View"
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
