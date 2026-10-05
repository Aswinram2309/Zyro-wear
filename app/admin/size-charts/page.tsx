'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SizeChartRecord, SizeChartMeasurementRow } from '@/shared/types';
import { formatImageUrl } from '@/shared/constants/stock-config';

const DEFAULT_NORMAL_MEASUREMENTS: SizeChartMeasurementRow[] = [
  { size: 'M', length: '27', chest: '40', shoulder: '10', sleeve: '—' },
  { size: 'L', length: '29', chest: '42', shoulder: '10', sleeve: '—' },
  { size: 'XL', length: '28', chest: '44', shoulder: '10', sleeve: '—' },
  { size: 'XXL', length: '30', chest: '46', shoulder: '10.5', sleeve: '—' },
];

const DEFAULT_OVERSIZED_MEASUREMENTS: SizeChartMeasurementRow[] = [
  { size: 'M', shoulder: '20', chest: '40', length: '27.5', sleeve: '10' },
  { size: 'L', shoulder: '21.5', chest: '42', length: '28', sleeve: '10' },
  { size: 'XL', shoulder: '22.5', chest: '44', length: '30', sleeve: '10.5' },
  { size: 'XXL', shoulder: '23.5', chest: '46', length: '31', sleeve: '11' },
];

export default function AdminSizeChartsPage() {
  const router = useRouter();
  const [charts, setCharts] = useState<SizeChartRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTypeFilter, setActiveTypeFilter] = useState<'ALL' | 'NORMAL' | 'OVERSIZED'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingChart, setEditingChart] = useState<SizeChartRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    type: 'NORMAL' | 'OVERSIZED';
    chart_image_url: string;
    how_to_measure_image_url: string;
    unit: string;
    is_active: boolean;
    measurements: SizeChartMeasurementRow[];
  }>({
    name: '',
    type: 'NORMAL',
    chart_image_url: '',
    how_to_measure_image_url: '',
    unit: 'ALL MEASUREMENTS ARE IN INCHES',
    is_active: true,
    measurements: DEFAULT_NORMAL_MEASUREMENTS,
  });

  // Image Upload States
  const [chartFile, setChartFile] = useState<File | null>(null);
  const [howToMeasureFile, setHowToMeasureFile] = useState<File | null>(null);
  const [chartPreview, setChartPreview] = useState<string>('');
  const [howToMeasurePreview, setHowToMeasurePreview] = useState<string>('');
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Lightbox Modal for previewing images
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Check auth
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('zyro_admin_auth');
    if (!isAuthenticated) {
      router.push('/admin/login');
    } else {
      fetchCharts();
    }
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

  // Open Modal for New Size Chart
  const handleOpenNewModal = (presetType: 'NORMAL' | 'OVERSIZED' = 'NORMAL') => {
    setEditingChart(null);
    setFormData({
      name: `${presetType === 'OVERSIZED' ? 'Oversized' : 'Normal'} T-Shirt Size Chart`,
      type: presetType,
      chart_image_url: presetType === 'OVERSIZED' ? '/images/oversized-size-guide.jpg' : '/images/size-guide.jpg',
      how_to_measure_image_url: presetType === 'OVERSIZED' ? '/images/oversized-size-guide.jpg' : '/images/size-guide.jpg',
      unit: 'ALL MEASUREMENTS ARE IN INCHES',
      is_active: true,
      measurements: presetType === 'OVERSIZED' ? DEFAULT_OVERSIZED_MEASUREMENTS : DEFAULT_NORMAL_MEASUREMENTS,
    });
    setChartFile(null);
    setHowToMeasureFile(null);
    setChartPreview(presetType === 'OVERSIZED' ? '/images/oversized-size-guide.jpg' : '/images/size-guide.jpg');
    setHowToMeasurePreview(presetType === 'OVERSIZED' ? '/images/oversized-size-guide.jpg' : '/images/size-guide.jpg');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit Size Chart
  const handleOpenEditModal = (chart: SizeChartRecord) => {
    setEditingChart(chart);
    setFormData({
      name: chart.name,
      type: chart.type,
      chart_image_url: chart.chart_image_url || '',
      how_to_measure_image_url: chart.how_to_measure_image_url || '',
      unit: chart.unit || 'ALL MEASUREMENTS ARE IN INCHES',
      is_active: chart.is_active,
      measurements: chart.measurements && chart.measurements.length > 0
        ? JSON.parse(JSON.stringify(chart.measurements))
        : chart.type === 'OVERSIZED' ? DEFAULT_OVERSIZED_MEASUREMENTS : DEFAULT_NORMAL_MEASUREMENTS,
    });
    setChartFile(null);
    setHowToMeasureFile(null);
    setChartPreview(chart.chart_image_url ? formatImageUrl(chart.chart_image_url) : '');
    setHowToMeasurePreview(chart.how_to_measure_image_url ? formatImageUrl(chart.how_to_measure_image_url) : '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Image File Selections
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

  const handleHowToMeasureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormError('Invalid file type for How to Measure image. Please select an image.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFormError('How to Measure image file size must be under 10MB.');
        return;
      }
      setFormError(null);
      setHowToMeasureFile(file);
      setHowToMeasurePreview(URL.createObjectURL(file));
    }
  };

  // Upload image helper
  const uploadImageFile = async (file: File, type: 'chart' | 'how_to_measure', tempId: string): Promise<string> => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('type', type);
    uploadData.append('chartId', tempId);

    const res = await fetch('/api/admin/size-charts/upload', {
      method: 'POST',
      body: uploadData,
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      throw new Error(data.error || `Failed to upload ${type} image`);
    }
    return data.url;
  };

  // Measurement Row Actions
  const handleAddMeasurementRow = () => {
    setFormData((prev) => ({
      ...prev,
      measurements: [
        ...prev.measurements,
        { size: '3XL', shoulder: '', chest: '', length: '', sleeve: '' },
      ],
    }));
  };

  const handleRemoveMeasurementRow = (index: number) => {
    if (formData.measurements.length <= 1) {
      alert('Size chart must have at least one size row.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      measurements: prev.measurements.filter((_, i) => i !== index),
    }));
  };

  const handleMeasurementChange = (index: number, field: keyof SizeChartMeasurementRow, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.measurements];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return { ...prev, measurements: updated };
    });
  };

  const handleTypeChange = (newType: 'NORMAL' | 'OVERSIZED') => {
    setFormData((prev) => {
      const isSwitching = prev.type !== newType;
      return {
        ...prev,
        type: newType,
        name: isSwitching && prev.name.includes('Size Chart')
          ? `${newType === 'OVERSIZED' ? 'Oversized' : 'Normal'} T-Shirt Size Chart`
          : prev.name,
      };
    });
  };

  // Handle Submit Size Chart
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Size chart name is required');
      return;
    }

    if (formData.measurements.length === 0) {
      setFormError('At least one size measurement row is required');
      return;
    }

    for (let i = 0; i < formData.measurements.length; i++) {
      const row = formData.measurements[i];
      if (!row.size.trim()) {
        setFormError(`Row #${i + 1} is missing a Size label (e.g. M, L, XL).`);
        return;
      }
    }

    setSubmitting(true);
    setUploadingImages(true);

    try {
      const tempId = editingChart ? editingChart.id : `sc_${Date.now()}`;
      let finalChartUrl = formData.chart_image_url;
      let finalHowToUrl = formData.how_to_measure_image_url;

      if (chartFile) {
        finalChartUrl = await uploadImageFile(chartFile, 'chart', tempId);
      }
      if (howToMeasureFile) {
        finalHowToUrl = await uploadImageFile(howToMeasureFile, 'how_to_measure', tempId);
      }

      setUploadingImages(false);

      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        chart_image_url: finalChartUrl || null,
        how_to_measure_image_url: finalHowToUrl || null,
        unit: formData.unit || 'ALL MEASUREMENTS ARE IN INCHES',
        is_active: formData.is_active,
        measurements: formData.measurements.map((m) => ({
          size: m.size.trim().toUpperCase(),
          shoulder: m.shoulder ? String(m.shoulder).trim() : '—',
          chest: m.chest ? String(m.chest).trim() : '—',
          length: m.length ? String(m.length).trim() : '—',
          sleeve: m.sleeve ? String(m.sleeve).trim() : '—',
        })),
      };

      let res;
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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save size chart');
      }

      setIsModalOpen(false);
      await fetchCharts();

      setSuccessToast(
        editingChart
          ? `Size chart "${payload.name}" updated successfully.`
          : `Size chart "${payload.name}" created successfully.`
      );
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error('Error saving size chart:', err);
      setFormError(err.message || 'An error occurred while saving the size chart');
    } finally {
      setSubmitting(false);
      setUploadingImages(false);
    }
  };

  // Toggle Active
  const handleSetActive = async (chart: SizeChartRecord) => {
    try {
      const res = await fetch(`/api/admin/size-charts/${chart.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      });
      if (res.ok) {
        await fetchCharts();
        setSuccessToast(`"${chart.name}" is now the ACTIVE ${chart.type} size chart.`);
        setTimeout(() => setSuccessToast(null), 4000);
      } else {
        alert('Failed to set chart as active');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating active status');
    }
  };

  // Delete Chart
  const handleDelete = async (chart: SizeChartRecord) => {
    if (charts.length <= 1) {
      alert('Cannot delete the only remaining size chart.');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete "${chart.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/size-charts/${chart.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchCharts();
        setSuccessToast(`Size chart "${chart.name}" deleted successfully.`);
        setTimeout(() => setSuccessToast(null), 4000);
      } else {
        alert('Failed to delete size chart');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting size chart');
    }
  };

  const filteredCharts = charts.filter((c) => {
    if (activeTypeFilter === 'ALL') return true;
    return c.type === activeTypeFilter;
  });

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

      {/* Admin Main Content */}
      <main className="admin-main">
        {successToast && (
          <div className="admin-success-banner">
            <i className="fa-solid fa-circle-check"></i> {successToast}
          </div>
        )}

        <div className="admin-header-row">
          <div>
            <h2>Size Chart Management</h2>
            <p>
              Centralized single source of truth for all sizing. Updates here automatically apply across
              all existing and future products in Stock &amp; Product Details!
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <button className="btn-primary-gold-prominent" onClick={() => handleOpenNewModal('NORMAL')}>
              <i className="fa-solid fa-plus"></i> + ADD SIZE CHART
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="stock-filters-bar" style={{ marginBottom: '2rem' }}>
          <div className="category-tabs-row">
            {[
              { label: 'ALL CHARTS', value: 'ALL' },
              { label: '👕 NORMAL FIT CHARTS', value: 'NORMAL' },
              { label: '⚡ OVERSIZED FIT CHARTS', value: 'OVERSIZED' },
            ].map((t) => (
              <button
                key={t.value}
                className={`category-tab-btn ${activeTypeFilter === t.value ? 'active' : ''}`}
                onClick={() => setActiveTypeFilter(t.value as any)}
              >
                {t.label} (
                {t.value === 'ALL' ? charts.length : charts.filter((c) => c.type === t.value).length})
              </button>
            ))}
          </div>

          <button className="btn-refresh" onClick={fetchCharts}>
            <i className="fa-solid fa-arrows-rotate"></i> Refresh
          </button>
        </div>

        {/* Size Charts List */}
        {loading ? (
          <div className="admin-loading-box">
            <i className="fa-solid fa-spinner fa-spin"></i> Loading size charts database...
          </div>
        ) : filteredCharts.length === 0 ? (
          <div className="admin-empty-box">
            <i className="fa-solid fa-ruler-combined"></i>
            <h3>No size charts found</h3>
            <p>Click &quot;+ ADD SIZE CHART&quot; to create your first dynamic size chart.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {filteredCharts.map((chart) => {
              const isOversized = chart.type === 'OVERSIZED';
              return (
                <div
                  key={chart.id}
                  style={{
                    background: '#121417',
                    border: chart.is_active ? '2px solid #FFC700' : '1px solid #262930',
                    borderRadius: '12px',
                    padding: '1.75rem',
                    boxShadow: chart.is_active
                      ? '0 8px 30px rgba(255, 199, 0, 0.12)'
                      : '0 4px 15px rgba(0,0,0,0.4)',
                    position: 'relative',
                  }}
                >
                  {/* Card Top Row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      borderBottom: '1px solid #262930',
                      paddingBottom: '1.2rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FFF', margin: 0 }}>
                        {chart.name}
                      </h3>

                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '4px',
                          background: isOversized ? 'rgba(255, 199, 0, 0.15)' : '#262930',
                          color: isOversized ? '#FFC700' : '#E5E7EB',
                          border: isOversized ? '1px solid rgba(255, 199, 0, 0.3)' : '1px solid #374151',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {isOversized ? '⚡ TYPE: OVERSIZED' : '👕 TYPE: NORMAL'}
                      </span>

                      {chart.is_active ? (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#10B981',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <i className="fa-solid fa-circle-check"></i> CURRENTLY ACTIVE
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '4px',
                            background: '#1F2228',
                            color: '#9CA3AF',
                          }}
                        >
                          INACTIVE
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      {!chart.is_active && (
                        <button
                          type="button"
                          onClick={() => handleSetActive(chart)}
                          style={{
                            background: '#0A0B0C',
                            color: '#FFC700',
                            border: '1px solid #FFC700',
                            borderRadius: '6px',
                            padding: '0.55rem 1rem',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          <i className="fa-solid fa-bolt"></i> Set As Active
                        </button>
                      )}
                      <button className="btn-action-edit" onClick={() => handleOpenEditModal(chart)}>
                        <i className="fa-solid fa-pen-to-square"></i> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(chart)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          padding: '0.55rem 0.9rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <i className="fa-solid fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>

                  {/* Card Content Grid: Measurements Table + Image Previews */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 1fr',
                      gap: '2rem',
                    }}
                    className="size-chart-card-content-grid"
                  >
                    {/* Measurements Table */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.8rem',
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFC700' }}>
                          <i className="fa-solid fa-table-cells" style={{ marginRight: '6px' }}></i>
                          SIZE MEASUREMENTS ({chart.unit || 'INCHES'})
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                          {chart.measurements?.length || 0} Sizes Defined
                        </span>
                      </div>

                      <div className="size-chart-table-container">
                        <table className="size-chart-table" style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th>SIZE</th>
                              <th>SHOULDER</th>
                              <th>CHEST</th>
                              <th>LENGTH</th>
                              <th>SLEEVE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {chart.measurements?.map((m) => (
                              <tr key={m.size}>
                                <td className="size-col-label" style={{ fontWeight: 900 }}>
                                  {m.size}
                                </td>
                                <td>{m.shoulder || '—'}</td>
                                <td>{m.chest || '—'}</td>
                                <td>{m.length || '—'}</td>
                                <td>{m.sleeve || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {chart.tips && chart.tips.length > 0 && (
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {chart.tips.map((tip, i) => (
                            <p key={i} style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: 0 }}>
                              <i className="fa-solid fa-circle-info" style={{ color: '#FFC700', marginRight: '6px' }}></i>
                              {tip}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Chart Images Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                      {/* Visual Size Chart Image */}
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: '0.4rem' }}>
                          <i className="fa-solid fa-image" style={{ marginRight: '6px', color: '#FFC700' }}></i>
                          VISUAL SIZE CHART IMAGE
                        </span>
                        {chart.chart_image_url ? (
                          <div
                            style={{
                              background: '#0A0B0C',
                              border: '1px solid #262930',
                              borderRadius: '8px',
                              padding: '0.5rem',
                              cursor: 'pointer',
                              textAlign: 'center',
                            }}
                            onClick={() => setLightboxImage(formatImageUrl(chart.chart_image_url!))}
                          >
                            <img
                              src={formatImageUrl(chart.chart_image_url)}
                              alt={`${chart.name} Visual`}
                              style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                            />
                            <span style={{ fontSize: '0.7rem', color: '#FFC700', display: 'block', marginTop: '4px' }}>
                              <i className="fa-solid fa-magnifying-glass-plus"></i> Click to preview
                            </span>
                          </div>
                        ) : (
                          <div style={{ padding: '1rem', background: '#0A0B0C', border: '1px dashed #262930', borderRadius: '8px', textAlign: 'center', color: '#6B7280', fontSize: '0.75rem' }}>
                            No chart image uploaded
                          </div>
                        )}
                      </div>

                      {/* How To Measure Image */}
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: '0.4rem' }}>
                          <i className="fa-solid fa-ruler-horizontal" style={{ marginRight: '6px', color: '#FFC700' }}></i>
                          HOW TO MEASURE IMAGE
                        </span>
                        {chart.how_to_measure_image_url ? (
                          <div
                            style={{
                              background: '#0A0B0C',
                              border: '1px solid #262930',
                              borderRadius: '8px',
                              padding: '0.5rem',
                              cursor: 'pointer',
                              textAlign: 'center',
                            }}
                            onClick={() => setLightboxImage(formatImageUrl(chart.how_to_measure_image_url!))}
                          >
                            <img
                              src={formatImageUrl(chart.how_to_measure_image_url)}
                              alt={`${chart.name} Guide`}
                              style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                            />
                            <span style={{ fontSize: '0.7rem', color: '#FFC700', display: 'block', marginTop: '4px' }}>
                              <i className="fa-solid fa-magnifying-glass-plus"></i> Click to preview
                            </span>
                          </div>
                        ) : (
                          <div style={{ padding: '1rem', background: '#0A0B0C', border: '1px dashed #262930', borderRadius: '8px', textAlign: 'center', color: '#6B7280', fontSize: '0.75rem' }}>
                            No measure image uploaded
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CREATE / EDIT SIZE CHART MODAL */}
      {isModalOpen && (
        <div className="stock-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="stock-modal-card"
            style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="stock-modal-header">
              <h3>
                <i className="fa-solid fa-ruler-combined"></i>{' '}
                {editingChart ? 'Edit Size Chart' : '+ Add New Size Chart'}
              </h3>
              <button className="stock-modal-close" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="stock-modal-form">
              {formError && <div className="admin-error-banner">{formError}</div>}

              {/* 1. Chart Name & Chart Type */}
              <div className="form-row-2">
                <div className="form-group">
                  <label>1. CHART NAME *</label>
                  <input
                    type="text"
                    placeholder="e.g. Normal T-Shirt Size Chart"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>2. CHART TYPE *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleTypeChange(e.target.value as any)}
                  >
                    <option value="NORMAL">NORMAL (Used for Normal, Football, Customized, IPL)</option>
                    <option value="OVERSIZED">OVERSIZED (Used for Oversized T-Shirts)</option>
                  </select>
                </div>
              </div>

              {/* Active Toggle */}
              <div style={{ background: '#0A0B0C', padding: '0.8rem 1rem', borderRadius: '6px', border: '1px solid #262930', marginBottom: '1.2rem' }}>
                <label className="toggle-checkbox-label" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>
                    <strong>Set as ACTIVE {formData.type} size chart</strong> (All {formData.type.toLowerCase()} products will immediately use this chart)
                  </span>
                </label>
              </div>

              {/* 3 & 4. Images Uploads */}
              <div className="form-images-row">
                {/* Visual Size Chart Image */}
                <div className="image-upload-box">
                  <label className="upload-label">3. SIZE CHART IMAGE (VISUAL)</label>
                  <div className="image-preview-area">
                    {chartPreview ? (
                      <img src={chartPreview} alt="Chart Preview" className="uploaded-preview-img" />
                    ) : (
                      <div className="empty-preview">
                        <i className="fa-solid fa-image"></i>
                        <span>Upload Visual Size Chart Image</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleChartImageSelect}
                    className="file-input-hidden"
                    id="chart-img-input"
                  />
                  <label htmlFor="chart-img-input" className="btn-upload-file">
                    <i className="fa-solid fa-cloud-arrow-up"></i> Choose Chart Image File
                  </label>
                  <div className="image-url-input-wrap">
                    <span className="url-input-label">Or Image URL / Path:</span>
                    <input
                      type="text"
                      placeholder="e.g. /images/size-guide.jpg"
                      value={formData.chart_image_url}
                      onChange={(e) => {
                        const url = e.target.value;
                        setFormData((prev) => ({ ...prev, chart_image_url: url }));
                        setChartPreview(formatImageUrl(url));
                      }}
                      className="image-url-text-input"
                    />
                  </div>
                </div>

                {/* How To Measure Image */}
                <div className="image-upload-box">
                  <label className="upload-label">4. HOW TO MEASURE IMAGE</label>
                  <div className="image-preview-area">
                    {howToMeasurePreview ? (
                      <img src={howToMeasurePreview} alt="Measure Preview" className="uploaded-preview-img" />
                    ) : (
                      <div className="empty-preview">
                        <i className="fa-solid fa-ruler-horizontal"></i>
                        <span>Upload How To Measure Guide</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleHowToMeasureSelect}
                    className="file-input-hidden"
                    id="how-to-img-input"
                  />
                  <label htmlFor="how-to-img-input" className="btn-upload-file">
                    <i className="fa-solid fa-cloud-arrow-up"></i> Choose Measure Image File
                  </label>
                  <div className="image-url-input-wrap">
                    <span className="url-input-label">Or Image URL / Path:</span>
                    <input
                      type="text"
                      placeholder="e.g. /images/oversized-size-guide.jpg"
                      value={formData.how_to_measure_image_url}
                      onChange={(e) => {
                        const url = e.target.value;
                        setFormData((prev) => ({ ...prev, how_to_measure_image_url: url }));
                        setHowToMeasurePreview(formatImageUrl(url));
                      }}
                      className="image-url-text-input"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Size Measurements Builder Table */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <label style={{ margin: 0 }}>5. SIZE MEASUREMENTS (INCHES) *</label>
                    <p className="subtext" style={{ margin: '2px 0 0 0' }}>
                      Add, edit, or delete any size measurements (M, L, XL, XXL, 3XL, etc.).
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          measurements:
                            prev.type === 'OVERSIZED'
                              ? DEFAULT_OVERSIZED_MEASUREMENTS
                              : DEFAULT_NORMAL_MEASUREMENTS,
                        }))
                      }
                      style={{
                        background: '#262930',
                        color: '#9CA3AF',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <i className="fa-solid fa-rotate-left"></i> Reset Defaults
                    </button>
                    <button
                      type="button"
                      onClick={handleAddMeasurementRow}
                      className="btn-primary-gold-prominent"
                      style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                    >
                      <i className="fa-solid fa-plus"></i> + ADD SIZE
                    </button>
                  </div>
                </div>

                <div className="size-chart-table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <table className="size-chart-table">
                    <thead>
                      <tr>
                        <th style={{ width: '85px' }}>SIZE</th>
                        <th>SHOULDER</th>
                        <th>CHEST</th>
                        <th>LENGTH</th>
                        <th>SLEEVE</th>
                        <th style={{ width: '50px', textAlign: 'center' }}>DEL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.measurements.map((row, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              type="text"
                              value={row.size}
                              onChange={(e) => handleMeasurementChange(idx, 'size', e.target.value)}
                              placeholder="e.g. M"
                              style={{
                                width: '100%',
                                background: '#0A0B0C',
                                border: '1px solid #FFC700',
                                color: '#FFF',
                                fontWeight: 900,
                                textAlign: 'center',
                                padding: '4px',
                                borderRadius: '4px',
                              }}
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.shoulder || ''}
                              onChange={(e) => handleMeasurementChange(idx, 'shoulder', e.target.value)}
                              placeholder="Shoulder"
                              style={{
                                width: '100%',
                                background: '#0A0B0C',
                                border: '1px solid #262930',
                                color: '#FFF',
                                textAlign: 'center',
                                padding: '4px',
                                borderRadius: '4px',
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.chest || ''}
                              onChange={(e) => handleMeasurementChange(idx, 'chest', e.target.value)}
                              placeholder="Chest"
                              style={{
                                width: '100%',
                                background: '#0A0B0C',
                                border: '1px solid #262930',
                                color: '#FFF',
                                textAlign: 'center',
                                padding: '4px',
                                borderRadius: '4px',
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.length || ''}
                              onChange={(e) => handleMeasurementChange(idx, 'length', e.target.value)}
                              placeholder="Length"
                              style={{
                                width: '100%',
                                background: '#0A0B0C',
                                border: '1px solid #262930',
                                color: '#FFF',
                                textAlign: 'center',
                                padding: '4px',
                                borderRadius: '4px',
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.sleeve || ''}
                              onChange={(e) => handleMeasurementChange(idx, 'sleeve', e.target.value)}
                              placeholder="Sleeve"
                              style={{
                                width: '100%',
                                background: '#0A0B0C',
                                border: '1px solid #262930',
                                color: '#FFF',
                                textAlign: 'center',
                                padding: '4px',
                                borderRadius: '4px',
                              }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveMeasurementRow(idx)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                padding: '4px',
                              }}
                              title="Delete size row"
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submit Controls */}
              <div className="modal-form-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit-stock" disabled={submitting}>
                  {submitting ? (
                    <span>
                      <i className="fa-solid fa-spinner fa-spin"></i>{' '}
                      {uploadingImages ? 'Uploading Images...' : 'Saving Size Chart...'}
                    </span>
                  ) : (
                    <span>
                      <i className="fa-solid fa-check"></i>{' '}
                      {editingChart ? 'Update Size Chart' : 'Create Size Chart'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setLightboxImage(null)}
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
              }}
              onClick={() => setLightboxImage(null)}
            >
              ✕
            </button>
            <img
              src={lightboxImage}
              alt="Size Chart Preview"
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
