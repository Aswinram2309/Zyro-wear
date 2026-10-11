'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SizeChartRecord, SizeChartMeasurementRow } from '@/shared/types';
import { formatImageUrl } from '@/shared/constants/stock-config';

export default function AdminSizeChartsPage() {
  const router = useRouter();
  const [charts, setCharts] = useState<SizeChartRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingChart, setEditingChart] = useState<SizeChartRecord | null>(null);
  const [deleteConfirmChart, setDeleteConfirmChart] = useState<SizeChartRecord | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Form State
  const [brandName, setBrandName] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [columns, setColumns] = useState<string[]>(['Length', 'Chest', 'Shoulder', 'Sleeve']);
  const [measurements, setMeasurements] = useState<SizeChartMeasurementRow[]>([]);
  const [newColumnName, setNewColumnName] = useState<string>('');
  const [newSizeLabel, setNewSizeLabel] = useState<string>('');

  // Image Upload State
  const [chartFile, setChartFile] = useState<File | null>(null);
  const [chartPreview, setChartPreview] = useState<string>('');
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Lightbox Modal for previewing images
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Check auth
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      let isAuthed = sessionStorage.getItem('zyro_admin_auth') === 'true';
      if (!isAuthed) {
        try {
          const res = await fetch('/api/admin/auth');
          const data = await res.json();
          if (data.authenticated) {
            sessionStorage.setItem('zyro_admin_auth', 'true');
            isAuthed = true;
          }
        } catch (e) {}
      }

      if (!isAuthed) {
        window.location.href = '/admin/login';
      } else {
        fetchCharts();
      }
    };
    checkAuthAndLoad();
  }, [router]);

  const fetchCharts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/size-charts?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.charts && Array.isArray(data.charts)) {
        setCharts(data.charts);
      }
    } catch (err) {
      console.error('Error fetching size charts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch {}
    sessionStorage.removeItem('zyro_admin_auth');
    router.push('/admin/login');
  };

  // Open Modal for New Brand Size Chart
  const handleOpenNewModal = () => {
    setEditingChart(null);
    setBrandName('');
    setImageUrl('');
    setColumns(['Length', 'Chest', 'Shoulder', 'Sleeve']);
    setMeasurements([]);
    setChartFile(null);
    setChartPreview('');
    setFormError(null);
    setNewColumnName('');
    setNewSizeLabel('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit Brand Size Chart
  const handleOpenEditModal = (chart: SizeChartRecord) => {
    setEditingChart(chart);
    setBrandName(chart.brand_name || chart.name || '');
    const img = chart.image_url || chart.chart_image_url || '';
    setImageUrl(img);
    setChartPreview(img ? formatImageUrl(img) : '');
    setChartFile(null);

    // Load dynamic columns
    const chartCols = Array.isArray(chart.columns) && chart.columns.length > 0
      ? [...chart.columns]
      : ['Length', 'Chest', 'Shoulder', 'Sleeve'];
    setColumns(chartCols);

    // Deep copy measurement rows
    const rows = Array.isArray(chart.measurements)
      ? JSON.parse(JSON.stringify(chart.measurements))
      : [];
    setMeasurements(rows);

    setFormError(null);
    setNewColumnName('');
    setNewSizeLabel('');
    setIsModalOpen(true);
  };

  // Handle Image File Selection
  const handleChartImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormError('Invalid file type for size chart image. Please select an image.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFormError('Size chart image file size must be under 10MB.');
        return;
      }
      setFormError(null);
      setChartFile(file);
      setChartPreview(URL.createObjectURL(file));
    }
  };

  // Upload image helper
  const uploadImageFile = async (file: File, tempId: string): Promise<string> => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('type', 'brand_chart');
    uploadData.append('chartId', tempId);

    const res = await fetch('/api/admin/size-charts/upload', {
      method: 'POST',
      body: uploadData,
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      throw new Error(data.error || 'Failed to upload chart image');
    }
    return data.url;
  };

  // --- Dynamic Column Management ---
  const handleAddColumn = (colToAdd?: string) => {
    const colName = (colToAdd || newColumnName).trim();
    if (!colName) return;

    // Check duplicate column name (case-insensitive)
    const exists = columns.some((c) => c.toLowerCase() === colName.toLowerCase());
    if (exists) {
      alert(`Column "${colName}" already exists.`);
      return;
    }

    setColumns((prev) => [...prev, colName]);
    setNewColumnName('');
  };

  const handleRemoveColumn = (colToRemove: string) => {
    if (columns.length <= 1) {
      alert('The chart must have at least one measurement column.');
      return;
    }
    setColumns((prev) => prev.filter((c) => c !== colToRemove));
    // Clean up key from measurement rows
    setMeasurements((prev) =>
      prev.map((row) => {
        const copy = { ...row };
        delete copy[colToRemove];
        delete copy[colToRemove.toLowerCase()];
        return copy;
      })
    );
  };

  // --- Dynamic Size Row Management ---
  const handleAddSizeRow = (sizeLabelToAdd?: string) => {
    const label = (sizeLabelToAdd || newSizeLabel).trim().toUpperCase();
    if (!label) {
      alert('Please enter a size label (e.g. S, M, L, XL, XXL).');
      return;
    }

    // Check duplicate size label
    const exists = measurements.some((m) => m.size.toUpperCase() === label);
    if (exists) {
      alert(`Size "${label}" row is already added.`);
      return;
    }

    const newRow: SizeChartMeasurementRow = { size: label };
    columns.forEach((col) => {
      newRow[col] = '';
    });

    setMeasurements((prev) => [...prev, newRow]);
    setNewSizeLabel('');
  };

  const handleRemoveSizeRow = (index: number) => {
    setMeasurements((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCellChange = (rowIndex: number, colKey: string, val: string) => {
    setMeasurements((prev) => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        [colKey]: val,
      };
      return updated;
    });
  };

  const handleSizeLabelChange = (rowIndex: number, newLabel: string) => {
    setMeasurements((prev) => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        size: newLabel.trim().toUpperCase(),
      };
      return updated;
    });
  };

  // --- Submit Brand Size Chart ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedBrand = brandName.trim();
    if (!trimmedBrand) {
      setFormError('Brand name is required (e.g. Brand A, Brand B, Brand C).');
      return;
    }

    // Client-side duplicate check
    const isDuplicate = charts.some(
      (c) =>
        (!editingChart || c.id !== editingChart.id) &&
        (c.brand_name || c.name || '').trim().toLowerCase() === trimmedBrand.toLowerCase()
    );
    if (isDuplicate) {
      setFormError(`A size chart for brand "${trimmedBrand}" already exists. Please enter a unique brand name.`);
      return;
    }

    if (columns.length === 0) {
      setFormError('At least one measurement column is required.');
      return;
    }

    if (measurements.length === 0) {
      setFormError('At least one size row is required. Click "+ Add Size Row" below.');
      return;
    }

    // Check all rows have a size label
    for (const row of measurements) {
      if (!row.size || !row.size.trim()) {
        setFormError('All size rows must have a valid size label (e.g. S, M, L).');
        return;
      }
    }

    setSubmitting(true);
    setUploadingImages(true);

    try {
      const tempId = editingChart ? editingChart.id : `sc_${Date.now()}`;
      let finalImageUrl = imageUrl;

      // Upload image to Supabase Storage if a new file was chosen
      if (chartFile) {
        finalImageUrl = await uploadImageFile(chartFile, tempId);
      }

      setUploadingImages(false);

      const payload = {
        brand_name: trimmedBrand,
        name: trimmedBrand,
        type: 'BRAND',
        image_url: finalImageUrl || null,
        chart_image_url: finalImageUrl || null,
        columns: columns,
        measurements: measurements,
        unit: 'ALL MEASUREMENTS ARE IN INCHES',
        is_active: true,
      };

      let res: Response;
      if (editingChart) {
        res = await fetch(`/api/admin/size-charts/${editingChart.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/size-charts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to save brand size chart');
      }

      if (resData.chart) {
        setCharts((prev) => [resData.chart, ...prev.filter((c) => c.id !== resData.chart.id)]);
      }

      setSuccessToast(`Size chart for "${trimmedBrand}" saved successfully!`);
      setTimeout(() => setSuccessToast(null), 4000);

      setIsModalOpen(false);
      setEditingChart(null);
      await fetchCharts();
    } catch (err: any) {
      console.error('Error saving brand size chart:', err);
      setFormError(err.message || 'Error saving size chart');
    } finally {
      setSubmitting(false);
      setUploadingImages(false);
    }
  };

  // --- Delete Brand Size Chart ---
  const handleConfirmDelete = async () => {
    if (!deleteConfirmChart) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/size-charts/${deleteConfirmChart.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete size chart');
      }

      setCharts((prev) => prev.filter((c) => c.id !== deleteConfirmChart.id));
      setSuccessToast(`Size chart for "${deleteConfirmChart.brand_name || deleteConfirmChart.name}" deleted.`);
      setTimeout(() => setSuccessToast(null), 4000);
      setDeleteConfirmChart(null);
      await fetchCharts();
    } catch (err: any) {
      console.error('Delete chart error:', err);
      alert('Error deleting size chart: ' + (err.message || 'Network error'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-dashboard-container">
      {/* Admin Navbar */}
      <header className="admin-nav">
        <div className="admin-nav-inner">
          <div className="admin-brand">
            <img src="/Logo/Zyro wears logo.png" alt="ZYRO Admin" className="admin-brand-logo" />
            <span className="admin-title">ADMIN DASHBOARD</span>
          </div>

          <div className="admin-nav-tabs-center">
            <Link href="/admin/dashboard" className="admin-nav-link">
              <i className="fa-solid fa-list-check"></i> Orders
            </Link>
            <Link href="/admin/stock" className="admin-nav-link">
              <i className="fa-solid fa-boxes-stacked"></i> Stock Management
            </Link>
            <Link href="/admin/size-charts" className="admin-nav-link active">
              <i className="fa-solid fa-ruler-combined"></i> Size Chart Management
            </Link>
          </div>

          <div className="admin-actions">
            <Link href="/" className="btn-secondary-sm">
              <i className="fa-solid fa-store"></i> View Store
            </Link>
            <button className="btn-logout" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket"></i> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        {successToast && (
          <div className="admin-success-banner" style={{ marginBottom: '1.5rem' }}>
            <i className="fa-solid fa-circle-check"></i> {successToast}
          </div>
        )}

        {/* Header Title Row */}
        <div className="admin-header-row" style={{ alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <i className="fa-solid fa-ruler-combined" style={{ color: '#FFC700' }}></i>
              Brand-Based Size Chart Management
            </h2>
            <p style={{ maxWidth: '780px', color: '#9CA3AF', fontSize: '0.9rem', marginTop: '0.3rem' }}>
              Create and manage brand-specific size charts for <strong>Oversized T-Shirts</strong> and <strong>Customized T-Shirts</strong>.
              Measurements, columns, and brand images defined here are linked to products in Stock Management.
            </p>
          </div>

          <div className="admin-header-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn-primary-gold-prominent"
              onClick={handleOpenNewModal}
              id="btn-add-brand-size-chart"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.95rem',
                padding: '0.65rem 1.25rem',
                boxShadow: '0 4px 14px rgba(255, 199, 0, 0.25)',
              }}
            >
              <i className="fa-solid fa-plus"></i> Add Brand Size Chart
            </button>
            <button className="btn-refresh" onClick={fetchCharts} title="Refresh size charts list">
              <i className="fa-solid fa-arrows-rotate"></i> Refresh
            </button>
          </div>
        </div>

        {/* Information Banner */}
        <div
          style={{
            background: 'rgba(255, 199, 0, 0.05)',
            border: '1px solid rgba(255, 199, 0, 0.2)',
            borderRadius: '8px',
            padding: '0.9rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <i className="fa-solid fa-circle-info" style={{ color: '#FFC700', fontSize: '1.25rem' }}></i>
            <span style={{ fontSize: '0.86rem', color: '#E5E7EB' }}>
              <strong>Category Routing:</strong> Oversized T-Shirts &amp; Customized T-Shirts load charts from this list. Football Jerseys and IPL Jerseys preserve their existing standard specifications automatically.
            </span>
          </div>
          <Link
            href="/admin/stock"
            style={{
              fontSize: '0.8rem',
              color: '#FFC700',
              textDecoration: 'underline',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            Go to Stock Management <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>

        {/* Saved Brand Size Charts Grid */}
        {loading ? (
          <div className="admin-loading-state" style={{ padding: '4rem 1rem' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#FFC700' }}></i>
            <p style={{ marginTop: '1rem', color: '#9CA3AF' }}>Loading brand size charts...</p>
          </div>
        ) : charts.length === 0 ? (
          <div
            style={{
              background: '#181B20',
              border: '1px dashed #374151',
              borderRadius: '12px',
              padding: '4rem 2rem',
              textAlign: 'center',
            }}
          >
            <i className="fa-solid fa-ruler-combined" style={{ fontSize: '3rem', color: '#4B5563', marginBottom: '1rem' }}></i>
            <h3 style={{ color: '#F3F4F6', fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Brand Size Charts Found</h3>
            <p style={{ color: '#9CA3AF', maxWidth: '480px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
              No custom brand size charts have been created yet. Click below to add your first brand size chart (e.g. Brand A, Brand B).
            </p>
            <button className="btn-primary-gold-prominent" onClick={handleOpenNewModal}>
              <i className="fa-solid fa-plus"></i> Add Brand Size Chart
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {charts.map((chart) => {
              const brand = chart.brand_name || chart.name || 'Untitled Brand';
              const img = chart.image_url || chart.chart_image_url;
              const cols = chart.columns && chart.columns.length > 0
                ? chart.columns
                : ['Length', 'Chest', 'Shoulder', 'Sleeve'];
              const rows = Array.isArray(chart.measurements) ? chart.measurements : [];

              return (
                <div
                  key={chart.id}
                  style={{
                    background: '#181B20',
                    border: '1px solid #262930',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  <div>
                    {/* Header Row */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        borderBottom: '1px solid #262930',
                        paddingBottom: '0.85rem',
                        marginBottom: '1rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              background: 'rgba(255, 199, 0, 0.15)',
                              color: '#FFC700',
                              border: '1px solid rgba(255, 199, 0, 0.3)',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              letterSpacing: '0.5px',
                            }}
                          >
                            BRAND CHART
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>ID: {chart.id}</span>
                        </div>
                        <h3
                          style={{
                            color: '#FFF',
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            marginTop: '0.4rem',
                            letterSpacing: '0.3px',
                          }}
                        >
                          {brand}
                        </h3>
                      </div>

                      {/* Image Thumbnail */}
                      {img ? (
                        <div
                          style={{
                            width: '54px',
                            height: '54px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid #374151',
                            cursor: 'pointer',
                            flexShrink: 0,
                            background: '#0D0E12',
                          }}
                          onClick={() => setLightboxImage(formatImageUrl(img))}
                          title="Click to zoom image"
                        >
                          <img
                            src={formatImageUrl(img)}
                            alt={brand}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '54px',
                            height: '54px',
                            borderRadius: '8px',
                            background: '#262930',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#6B7280',
                            fontSize: '0.7rem',
                            textAlign: 'center',
                            flexShrink: 0,
                          }}
                        >
                          No img
                        </div>
                      )}
                    </div>

                    {/* Table Preview */}
                    <div
                      style={{
                        background: '#0F1115',
                        border: '1px solid #262930',
                        borderRadius: '8px',
                        overflowX: 'auto',
                        marginBottom: '1rem',
                        maxHeight: '220px',
                      }}
                    >
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ background: '#16191F', borderBottom: '1px solid #262930', color: '#9CA3AF' }}>
                            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, width: '60px' }}>
                              SIZE
                            </th>
                            {cols.map((c) => (
                              <th key={c} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>
                                {c.toUpperCase()}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.length === 0 ? (
                            <tr>
                              <td colSpan={cols.length + 1} style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }}>
                                No measurements entered
                              </td>
                            </tr>
                          ) : (
                            rows.map((r, i) => (
                              <tr
                                key={i}
                                style={{
                                  borderBottom: i < rows.length - 1 ? '1px solid #1F2228' : 'none',
                                  color: '#E5E7EB',
                                }}
                              >
                                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#FFC700' }}>
                                  {r.size}
                                </td>
                                {cols.map((c) => {
                                  const val = r[c] ?? r[c.toLowerCase()] ?? '-';
                                  return (
                                    <td key={c} style={{ padding: '8px 10px', color: val && val !== '-' ? '#FFF' : '#6B7280' }}>
                                      {val && String(val).trim() ? val : '-'}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      justifyContent: 'flex-end',
                      borderTop: '1px solid #262930',
                      paddingTop: '0.85rem',
                    }}
                  >
                    <button
                      className="btn-secondary-sm"
                      onClick={() => handleOpenEditModal(chart)}
                      style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                    >
                      <i className="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button
                      className="btn-delete-sm"
                      onClick={() => setDeleteConfirmChart(chart)}
                      style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                    >
                      <i className="fa-solid fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* =========================================================================
          ADD / EDIT BRAND SIZE CHART MODAL
          ========================================================================= */}
      {isModalOpen && (
        <div
          className="admin-modal-overlay"
          onClick={() => !submitting && setIsModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
            overflowY: 'auto',
          }}
        >
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#16191F',
              border: '1px solid #2E333D',
              borderRadius: '12px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #262930',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#1A1E24',
              }}
            >
              <div>
                <h3 style={{ margin: 0, color: '#FFF', fontSize: '1.25rem', fontWeight: 800 }}>
                  <i className="fa-solid fa-ruler-combined" style={{ color: '#FFC700', marginRight: '0.5rem' }}></i>
                  {editingChart ? 'Edit Brand Size Chart' : 'Add Brand Size Chart'}
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#9CA3AF', fontSize: '0.8rem' }}>
                  Define custom brand measurements, dynamic columns, and upload the size guide image.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9CA3AF',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSubmit}
              style={{
                padding: '1.5rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              {formError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#EF4444',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {formError}
                </div>
              )}

              {/* 1. Brand Name Input */}
              <div>
                <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  1. BRAND NAME *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Brand A, Brand B, Brand C, Heavyweight Co."
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: '#0F1115',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#FFF',
                    fontSize: '0.95rem',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                  This name will appear in Stock Management dropdown when assigning charts to Oversized &amp; Customized tees.
                </span>
              </div>

              {/* 2. Chart Image Upload */}
              <div>
                <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  2. BRAND SIZE CHART IMAGE (OPTIONAL)
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr',
                    gap: '1rem',
                    alignItems: 'center',
                    background: '#0F1115',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #262930',
                  }}
                >
                  <div
                    style={{
                      width: '120px',
                      height: '100px',
                      background: '#1A1E24',
                      borderRadius: '8px',
                      border: '1px dashed #374151',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: chartPreview ? 'pointer' : 'default',
                    }}
                    onClick={() => chartPreview && setLightboxImage(chartPreview)}
                  >
                    {chartPreview ? (
                      <img src={chartPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: '#6B7280', textAlign: 'center', padding: '4px' }}>
                        No Image Selected
                      </span>
                    )}
                  </div>

                  <div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleChartImageSelect}
                      id="brand-chart-file-input"
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="brand-chart-file-input"
                      className="btn-upload-file"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        background: '#262930',
                        color: '#FFF',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                      }}
                    >
                      <i className="fa-solid fa-cloud-arrow-up"></i> Upload Image File
                    </label>

                    <div style={{ marginTop: '0.6rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#9CA3AF', display: 'block', marginBottom: '2px' }}>
                        Or Enter Direct URL / Storage Path:
                      </span>
                      <input
                        type="text"
                        placeholder="https://... or /images/..."
                        value={imageUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setImageUrl(val);
                          setChartPreview(val ? formatImageUrl(val) : '');
                        }}
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.75rem',
                          background: '#16191F',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          color: '#FFF',
                          fontSize: '0.82rem',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Measurement Columns (Dynamic) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label style={{ margin: 0, color: '#E5E7EB', fontSize: '0.85rem', fontWeight: 700 }}>
                    3. MEASUREMENT COLUMNS (DYNAMIC) *
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Add column name (e.g. Chest)"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddColumn();
                        }
                      }}
                      style={{
                        padding: '4px 8px',
                        background: '#0F1115',
                        border: '1px solid #374151',
                        borderRadius: '4px',
                        color: '#FFF',
                        fontSize: '0.78rem',
                        width: '160px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddColumn()}
                      style={{
                        background: '#262930',
                        color: '#FFC700',
                        border: '1px solid rgba(255, 199, 0, 0.3)',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      + Add Column
                    </button>
                  </div>
                </div>

                {/* Column Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {columns.map((col) => (
                    <span
                      key={col}
                      style={{
                        background: '#1A1E24',
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.78rem',
                        color: '#FFF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 600,
                      }}
                    >
                      {col}
                      <button
                        type="button"
                        onClick={() => handleRemoveColumn(col)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '0 2px',
                          fontSize: '0.75rem',
                        }}
                        title={`Remove column ${col}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                {/* Quick Add Suggestions */}
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.72rem', color: '#9CA3AF' }}>
                  <span>Quick Add:</span>
                  {['Length', 'Chest', 'Shoulder', 'Sleeve', 'Bust', 'Waist'].map((suggestion) => {
                    const alreadyHas = columns.some((c) => c.toLowerCase() === suggestion.toLowerCase());
                    if (alreadyHas) return null;
                    return (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleAddColumn(suggestion)}
                        style={{
                          background: 'transparent',
                          border: '1px dashed #4B5563',
                          color: '#D1D5DB',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                        }}
                      >
                        + {suggestion}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Size Rows Builder (Dynamic) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <label style={{ margin: 0, color: '#E5E7EB', fontSize: '0.85rem', fontWeight: 700 }}>
                      4. SIZE MEASUREMENTS *
                    </label>
                    <p style={{ margin: '2px 0 0 0', color: '#9CA3AF', fontSize: '0.75rem' }}>
                      Add or delete size rows. If left blank, a measurement will display as &quot;-&quot;.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Size label (e.g. S, M)"
                      value={newSizeLabel}
                      onChange={(e) => setNewSizeLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSizeRow();
                        }
                      }}
                      style={{
                        padding: '4px 8px',
                        background: '#0F1115',
                        border: '1px solid #374151',
                        borderRadius: '4px',
                        color: '#FFF',
                        fontSize: '0.78rem',
                        width: '130px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSizeRow()}
                      style={{
                        background: '#262930',
                        color: '#FFC700',
                        border: '1px solid rgba(255, 199, 0, 0.3)',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      + Add Size Row
                    </button>
                  </div>
                </div>

                {/* Quick Add Size Chips */}
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.72rem', color: '#9CA3AF', marginBottom: '0.75rem' }}>
                  <span>Quick Add Sizes:</span>
                  {['S', 'M', 'L', 'XL', 'XXL', '3XL'].map((sz) => {
                    const alreadyHas = measurements.some((m) => m.size.toUpperCase() === sz);
                    if (alreadyHas) return null;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleAddSizeRow(sz)}
                        style={{
                          background: 'transparent',
                          border: '1px dashed #4B5563',
                          color: '#FFC700',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                        }}
                      >
                        + {sz}
                      </button>
                    );
                  })}
                </div>

                {/* Measurements Table */}
                <div
                  style={{
                    background: '#0F1115',
                    border: '1px solid #262930',
                    borderRadius: '8px',
                    overflowX: 'auto',
                    maxHeight: '260px',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#1A1E24', borderBottom: '1px solid #2E333D', color: '#9CA3AF' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', width: '90px', fontWeight: 700 }}>SIZE</th>
                        {columns.map((col) => (
                          <th key={col} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>
                            {col.toUpperCase()} (IN)
                          </th>
                        ))}
                        <th style={{ padding: '8px 10px', textAlign: 'center', width: '50px' }}>DEL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.length === 0 ? (
                        <tr>
                          <td colSpan={columns.length + 2} style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
                            No sizes added yet. Use the input or click quick-add buttons above (e.g. + M, + L) to add sizes.
                          </td>
                        </tr>
                      ) : (
                        measurements.map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #1F2228' }}>
                            <td style={{ padding: '6px 10px' }}>
                              <input
                                type="text"
                                value={row.size}
                                onChange={(e) => handleSizeLabelChange(idx, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '4px 6px',
                                  background: '#16191F',
                                  border: '1px solid #374151',
                                  borderRadius: '4px',
                                  color: '#FFC700',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                  textAlign: 'center',
                                }}
                              />
                            </td>
                            {columns.map((col) => {
                              const cellVal = row[col] ?? row[col.toLowerCase()] ?? '';
                              return (
                                <td key={col} style={{ padding: '6px 10px' }}>
                                  <input
                                    type="text"
                                    placeholder="-"
                                    value={cellVal}
                                    onChange={(e) => handleCellChange(idx, col, e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '4px 8px',
                                      background: '#16191F',
                                      border: '1px solid #374151',
                                      borderRadius: '4px',
                                      color: '#FFF',
                                      fontSize: '0.85rem',
                                    }}
                                  />
                                </td>
                              );
                            })}
                            <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveSizeRow(idx)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#EF4444',
                                  cursor: 'pointer',
                                  padding: '4px',
                                }}
                                title="Remove size row"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  borderTop: '1px solid #262930',
                  paddingTop: '1rem',
                  marginTop: '0.5rem',
                }}
              >
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  style={{ padding: '8px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-gold-prominent"
                  disabled={submitting}
                  style={{ padding: '8px 22px' }}
                >
                  {submitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> {uploadingImages ? 'Uploading Image...' : 'Saving...'}
                    </>
                  ) : editingChart ? (
                    <>
                      <i className="fa-solid fa-check"></i> Save Changes
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-plus"></i> Create Brand Size Chart
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONFIRM DELETE MODAL
          ========================================================================= */}
      {deleteConfirmChart && (
        <div
          className="admin-modal-overlay"
          onClick={() => !deleting && setDeleteConfirmChart(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#16191F',
              border: '1px solid #EF4444',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#EF4444', marginBottom: '1rem' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '1.75rem' }}></i>
              <h3 style={{ margin: 0, color: '#FFF', fontSize: '1.2rem', fontWeight: 800 }}>Confirm Deletion</h3>
            </div>
            <p style={{ color: '#E5E7EB', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1rem' }}>
              Are you sure you want to delete the size chart for{' '}
              <strong>&quot;{deleteConfirmChart.brand_name || deleteConfirmChart.name}&quot;</strong>?
            </p>
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '6px',
                padding: '0.75rem',
                fontSize: '0.8rem',
                color: '#FCA5A5',
                marginBottom: '1.5rem',
              }}
            >
              <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '0.4rem' }}></i>
              Any Oversized or Customized T-shirts currently linked to this chart will display <em>&quot;Size chart not available&quot;</em> until another brand chart is assigned.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={() => setDeleteConfirmChart(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-delete-sm"
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{ padding: '8px 18px', background: '#DC2626', color: '#FFF' }}
              >
                {deleting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Deleting...
                  </>
                ) : (
                  'Yes, Delete Chart'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LIGHTBOX MODAL
          ========================================================================= */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '2rem',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={lightboxImage}
            alt="Zoomed preview"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }}
          />
        </div>
      )}
    </div>
  );
}
