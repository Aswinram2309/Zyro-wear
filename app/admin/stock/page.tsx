'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product } from '@/types';
import { calculateStockStatus, DEFAULT_LOW_STOCK_THRESHOLD, formatImageUrl, normalizeCategory } from '@/lib/stock-config';

const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const CATEGORY_OPTIONS = [
  { label: 'Football Jerseys', value: 'Football Jerseys' },
  { label: 'IPL Jerseys', value: 'IPL Jerseys' },
  { label: 'Customize Jerseys', value: 'Customize Jerseys' },
];

export default function StockManagementPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(DEFAULT_LOW_STOCK_THRESHOLD);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    category: string;
    nation: string;
    price: string;
    mrp: string;
    sale_price: string;
    sizes: string[];
    stock_by_size: Record<string, number>;
    size_chart: Record<string, { length: string; chest: string; shoulder: string; sleeve: string }>;
    front_img: string;
    back_img: string;
    is_active: boolean;
  }>({
    name: '',
    description: '',
    category: 'Football Jerseys',
    nation: '',
    price: '',
    mrp: '',
    sale_price: '',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock_by_size: { S: 10, M: 15, L: 15, XL: 10, XXL: 5 },
    size_chart: {
      S: { length: '', chest: '', shoulder: '', sleeve: '' },
      M: { length: '', chest: '', shoulder: '', sleeve: '' },
      L: { length: '', chest: '', shoulder: '', sleeve: '' },
      XL: { length: '', chest: '', shoulder: '', sleeve: '' },
      XXL: { length: '', chest: '', shoulder: '', sleeve: '' },
    },
    front_img: '',
    back_img: '',
    is_active: true,
  });

  // Image File States & Uploading status
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>('');
  const [backPreview, setBackPreview] = useState<string>('');
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Quick Manage Stock Modal State
  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null);
  const [quickStockData, setQuickStockData] = useState<Record<string, number>>({});
  const [savingQuickStock, setSavingQuickStock] = useState<boolean>(false);

  // Check Auth
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('zyro_admin_auth');
    if (!isAuthenticated) {
      router.push('/admin/login');
    } else {
      fetchProducts();
    }
  }, [router]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('zyro_admin_auth');
    router.push('/admin/login');
  };

  // Top Summary Statistics
  const stats = useMemo(() => {
    const totalProducts = products.length;
    let totalStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const pStock = Number(p.stock) || 0;
      totalStock += pStock;
      const status = calculateStockStatus(pStock, lowStockThreshold);
      if (status === 'OUT OF STOCK') {
        outOfStockCount++;
      } else if (status === 'LOW STOCK') {
        lowStockCount++;
      }
    });

    return { totalProducts, totalStock, lowStockCount, outOfStockCount };
  }, [products, lowStockThreshold]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = categoryFilter === 'ALL' || normalizeCategory(p.category, p.name) === categoryFilter;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        normalizeCategory(p.category, p.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.nation && p.nation.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, categoryFilter, searchQuery]);

  // Open Modal for New Product
  const handleOpenNewModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      category: 'Football Jerseys',
      nation: '',
      price: '299',
      mrp: '699',
      sale_price: '',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      stock_by_size: { S: 10, M: 15, L: 15, XL: 10, XXL: 5 },
      size_chart: {
        S: { length: '', chest: '', shoulder: '', sleeve: '' },
        M: { length: '', chest: '', shoulder: '', sleeve: '' },
        L: { length: '', chest: '', shoulder: '', sleeve: '' },
        XL: { length: '', chest: '', shoulder: '', sleeve: '' },
        XXL: { length: '', chest: '', shoulder: '', sleeve: '' },
      },
      front_img: '',
      back_img: '',
      is_active: true,
    });
    setFrontFile(null);
    setBackFile(null);
    setFrontPreview('');
    setBackPreview('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit Product
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    const stockMap: Record<string, number> = product.stock_by_size || { S: 10, M: 15, L: 15, XL: 10, XXL: 5 };
    const availSizes = product.sizes && product.sizes.length > 0 ? product.sizes : Object.keys(stockMap);

    const sizeChartMap: Record<string, { length: string; chest: string; shoulder: string; sleeve: string }> = {};
    const defaultSizes = ['S', 'M', 'L', 'XL', 'XXL'];
    defaultSizes.forEach((sz) => {
      const dbMeas = product.size_chart?.[sz] || {};
      sizeChartMap[sz] = {
        length: dbMeas.length !== undefined ? String(dbMeas.length) : '',
        chest: dbMeas.chest !== undefined ? String(dbMeas.chest) : '',
        shoulder: dbMeas.shoulder !== undefined ? String(dbMeas.shoulder) : '',
        sleeve: (dbMeas as any).sleeve !== undefined ? String((dbMeas as any).sleeve) : '',
      };
    });

    setFormData({
      name: product.name,
      description: product.description || '',
      category: normalizeCategory(product.category, product.name),
      nation: product.nation || '',
      price: String(product.price),
      mrp: String(product.mrp || product.price),
      sale_price: product.sale_price !== null && product.sale_price !== undefined ? String(product.sale_price) : '',
      sizes: availSizes,
      stock_by_size: stockMap,
      size_chart: sizeChartMap,
      front_img: product.front_img,
      back_img: product.back_img,
      is_active: product.is_active !== false,
    });
    setFrontFile(null);
    setBackFile(null);
    setFrontPreview(formatImageUrl(product.front_img));
    setBackPreview(formatImageUrl(product.back_img));
    setFormError(null);
    setIsModalOpen(true);
  };

  // Success Notification Toast
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Handle Image File Selections
  const handleFrontImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormError('Invalid file type for front image. Please choose an image file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFormError('Front image file size must be under 10MB.');
        return;
      }
      setFormError(null);
      setFrontFile(file);
      setFrontPreview(URL.createObjectURL(file));
    }
  };

  const handleBackImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormError('Invalid file type for back image. Please choose an image file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFormError('Back image file size must be under 10MB.');
        return;
      }
      setFormError(null);
      setBackFile(file);
      setBackPreview(URL.createObjectURL(file));
    }
  };

  // Upload image file to API
  const uploadImageFile = async (file: File, type: 'front' | 'back', tempId: string): Promise<string> => {
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('type', type);
      uploadData.append('productId', tempId);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || `Failed to upload ${type} image`);
      }
      return data.url;
    } catch (err: any) {
      console.error(`Error uploading ${type} image:`, err);
      throw new Error(`Image upload failed for ${type} view: ${err.message || 'Network error'}`);
    }
  };

  // Toggle Size Selection
  const handleToggleSize = (sz: string) => {
    setFormData((prev) => {
      const exists = prev.sizes.includes(sz);
      const newSizes = exists ? prev.sizes.filter((s) => s !== sz) : [...prev.sizes, sz];
      const newStockMap = { ...prev.stock_by_size };
      if (!exists && newStockMap[sz] === undefined) {
        newStockMap[sz] = 10;
      }
      return { ...prev, sizes: newSizes, stock_by_size: newStockMap };
    });
  };

  // Handle Size Stock Input
  const handleSizeStockChange = (sz: string, val: string) => {
    const num = parseInt(val, 10);
    setFormData((prev) => ({
      ...prev,
      stock_by_size: {
        ...prev.stock_by_size,
        [sz]: isNaN(num) ? 0 : Math.max(0, num),
      },
    }));
  };

  // Submit Product Form
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validations
    if (!formData.name.trim()) {
      setFormError('Product name is required');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Description is required');
      return;
    }
    if (!formData.category.trim()) {
      setFormError('Category is required');
      return;
    }
    const p = parseFloat(formData.price);
    if (isNaN(p) || p <= 0) {
      setFormError('Price must be a valid positive number');
      return;
    }

    const mrpNum = formData.mrp ? parseFloat(formData.mrp) : p;
    if (isNaN(mrpNum) || mrpNum < p) {
      setFormError('Original Price (MRP) cannot be less than selling price');
      return;
    }

    let salePriceNum: number | null = null;
    if (formData.sale_price && formData.sale_price.trim() !== '') {
      salePriceNum = parseFloat(formData.sale_price);
      if (isNaN(salePriceNum) || salePriceNum <= 0) {
        setFormError('Special offer price must be a valid positive number');
        return;
      }
      if (salePriceNum > p) {
        setFormError('Special offer price cannot be greater than original price');
        return;
      }
    }

    if (formData.sizes.length === 0) {
      setFormError('At least one size must be selected');
      return;
    }

    for (const sz of formData.sizes) {
      const qty = formData.stock_by_size[sz];
      if (qty === undefined || qty < 0) {
        setFormError(`Stock for size ${sz} cannot be negative`);
        return;
      }
    }

    if (!editingProduct && !frontFile && !formData.front_img) {
      setFormError('Front product image is required');
      return;
    }
    if (!editingProduct && !backFile && !formData.back_img) {
      setFormError('Back product image is required');
      return;
    }

    setSubmitting(true);
    setUploadingImages(true);

    try {
      const tempId = editingProduct ? editingProduct.id : `prod_${Date.now()}`;
      let finalFrontUrl = formData.front_img;
      let finalBackUrl = formData.back_img;

      if (frontFile) {
        finalFrontUrl = await uploadImageFile(frontFile, 'front', tempId);
      }
      if (backFile) {
        finalBackUrl = await uploadImageFile(backFile, 'back', tempId);
      }

      setUploadingImages(false);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        nation: formData.nation.trim() || undefined,
        price: salePriceNum !== null ? salePriceNum : p,
        mrp: mrpNum,
        sale_price: salePriceNum,
        sizes: formData.sizes,
        stock_by_size: formData.stock_by_size,
        size_chart: formData.size_chart,
        front_img: finalFrontUrl,
        back_img: finalBackUrl,
        images: [finalFrontUrl, finalBackUrl],
        is_active: formData.is_active,
      };

      let res;
      if (editingProduct) {
        res = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setIsModalOpen(false);
      const isNew = !editingProduct;
      await fetchProducts();

      if (isNew) {
        setSuccessToast('Product added successfully.');
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } catch (err: any) {
      console.error('Error saving stock product:', err);
      let errMsg = err.message || 'An error occurred while saving product';
      if (errMsg === 'Failed to fetch') {
        errMsg = 'Failed to connect to the server. If this is development, the server may have restarted due to local file changes, or you have a connection timeout. Please try submitting again.';
      }
      setFormError(errMsg);
    } finally {
      setSubmitting(false);
      setUploadingImages(false);
    }
  };

  // Toggle Active/Deactivate Product
  const handleToggleDeactivate = async (product: Product) => {
    const newActive = !product.is_active;
    const confirmMsg = newActive
      ? `Reactivate product "${product.name}"?`
      : `Deactivate product "${product.name}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActive }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_active: newActive } : p))
        );
      } else {
        alert('Failed to update product active status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating product status');
    }
  };

  // Open Quick Stock Modal
  const handleOpenQuickStock = (product: Product) => {
    setQuickStockProduct(product);
    setQuickStockData({ ...(product.stock_by_size || { S: 10, M: 15, L: 15, XL: 10, XXL: 5 }) });
  };

  // Save Quick Stock Updates
  const handleSaveQuickStock = async () => {
    if (!quickStockProduct) return;
    setSavingQuickStock(true);
    try {
      const res = await fetch(`/api/admin/products/${quickStockProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_by_size: quickStockData }),
      });
      if (res.ok) {
        setQuickStockProduct(null);
        fetchProducts();
      } else {
        alert('Failed to update stock');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving stock');
    } finally {
      setSavingQuickStock(false);
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
            <Link href="/admin/stock" className="admin-nav-link active">
              <i className="fa-solid fa-boxes-stacked"></i> Stock Management
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

      {/* Main Stock Content */}
      <main className="admin-main">
        {successToast && (
          <div className="admin-success-banner">
            <i className="fa-solid fa-circle-check"></i> {successToast}
          </div>
        )}
        {/* Header Title Row + Prominent NEW STOCK button */}
        <div className="admin-header-row">
          <div>
            <h2>Stock Management Dashboard</h2>
            <p>Monitor inventory, track size-wise stock, add new stock &amp; manage pricing.</p>
          </div>

          <div className="stock-top-controls">
            <div className="threshold-setting-box">
              <label htmlFor="low-stock-threshold-input">Low Stock Threshold:</label>
              <input
                id="low-stock-threshold-input"
                type="number"
                min="1"
                max="50"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="threshold-input"
              />
            </div>

            <button className="btn-primary-gold-prominent" onClick={handleOpenNewModal}>
              <i className="fa-solid fa-plus"></i> + NEW STOCK
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="stock-summary-grid">
          <div className="stock-summary-card">
            <div className="card-icon total">
              <i className="fa-solid fa-shirt"></i>
            </div>
            <div className="card-info">
              <span className="card-label">Total Products</span>
              <strong className="card-value">{stats.totalProducts}</strong>
            </div>
          </div>

          <div className="stock-summary-card">
            <div className="card-icon stock">
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <div className="card-info">
              <span className="card-label">Total Stock Units</span>
              <strong className="card-value">{stats.totalStock}</strong>
            </div>
          </div>

          <div className="stock-summary-card warning">
            <div className="card-icon low">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div className="card-info">
              <span className="card-label">Low Stock Products</span>
              <strong className="card-value text-amber">{stats.lowStockCount}</strong>
            </div>
          </div>

          <div className="stock-summary-card danger">
            <div className="card-icon out">
              <i className="fa-solid fa-circle-xmark"></i>
            </div>
            <div className="card-info">
              <span className="card-label">Out of Stock</span>
              <strong className="card-value text-red">{stats.outOfStockCount}</strong>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="stock-filters-bar">
          <div className="search-box-wrap">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search product name, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="category-tabs-row">
            {[{ label: 'ALL', value: 'ALL' }, ...CATEGORY_OPTIONS].map((cat) => (
              <button
                key={cat.value}
                className={`category-tab-btn ${categoryFilter === cat.value ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button className="btn-refresh" onClick={fetchProducts}>
            <i className="fa-solid fa-arrows-rotate"></i> Refresh
          </button>
        </div>

        {/* Existing Stock Table / Grid */}
        {loading ? (
          <div className="admin-loading-box">
            <i className="fa-solid fa-spinner fa-spin"></i> Loading stock inventory...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="admin-empty-box">
            <i className="fa-solid fa-boxes-stacked"></i>
            <h3>No products found</h3>
            <p>Click &quot;+ NEW STOCK&quot; to add your first product to inventory.</p>
          </div>
        ) : (
          <div className="stock-products-grid">
            {filteredProducts.map((product) => {
              const totalStock = Number(product.stock) || 0;
              const status = calculateStockStatus(totalStock, lowStockThreshold);
              const isDeactivated = product.is_active === false;
              const stockMap = product.stock_by_size || {};
              const displayPrice = product.sale_price || product.price;
              const hasOffer = product.sale_price && product.mrp && product.sale_price < product.mrp;

              return (
                <div key={product.id} className={`stock-card ${isDeactivated ? 'deactivated' : ''}`}>
                  {/* Card Header & Status Badge */}
                  <div className="stock-card-top">
                    <span className={`stock-status-pill ${status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {isDeactivated ? 'DEACTIVATED' : status}
                    </span>
                    <span className="stock-id-tag">ID: {product.id}</span>
                  </div>

                  {/* Product Images & Info */}
                  <div className="stock-card-main">
                    <div className="stock-card-img-wrap">
                      <img
                        src={formatImageUrl(product.front_img)}
                        alt={product.name}
                        className="stock-product-img front"
                      />
                      {product.back_img && (
                        <img
                          src={formatImageUrl(product.back_img)}
                          alt={`${product.name} Back`}
                          className="stock-product-img back"
                        />
                      )}
                    </div>

                    <div className="stock-card-details">
                      <h3 className="stock-product-title">{product.name}</h3>
                      <span className="stock-category-badge">{product.category.toUpperCase()}</span>

                      <div className="stock-price-row">
                        <span className="current-price-tag">₹{displayPrice}</span>
                        {product.mrp && product.mrp > displayPrice && (
                          <span className="original-mrp-crossed">₹{product.mrp}</span>
                        )}
                        {hasOffer && <span className="special-offer-pill">SPECIAL OFFER</span>}
                      </div>

                      {/* Size-wise Stock Breakdown */}
                      <div className="size-stock-section">
                        <span className="size-stock-title">Available Sizes &amp; Stock:</span>
                        <div className="size-stock-list">
                          {ALL_SIZES.map((sz) => {
                            const isAvailable = product.sizes ? product.sizes.includes(sz) : true;
                            const szQty = stockMap[sz] !== undefined ? stockMap[sz] : 0;
                            return (
                              <div
                                key={sz}
                                className={`size-stock-badge ${!isAvailable ? 'disabled' : szQty === 0 ? 'out' : szQty <= lowStockThreshold ? 'low' : ''}`}
                              >
                                <span className="sz-name">{sz}</span>
                                <span className="sz-count">{isAvailable ? szQty : '-'}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="total-stock-bar">
                        <span>Total Available Stock:</span>
                        <strong className="total-stock-num">{totalStock} Units</strong>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="stock-card-actions">
                    <button className="btn-action-edit" onClick={() => handleOpenEditModal(product)}>
                      <i className="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button className="btn-action-manage" onClick={() => handleOpenQuickStock(product)}>
                      <i className="fa-solid fa-boxes-packing"></i> Manage Stock
                    </button>
                    <button
                      className={`btn-action-toggle ${isDeactivated ? 'activate' : 'deactivate'}`}
                      onClick={() => handleToggleDeactivate(product)}
                    >
                      <i className={`fa-solid ${isDeactivated ? 'fa-circle-check' : 'fa-ban'}`}></i>{' '}
                      {isDeactivated ? 'Activate' : 'Deactivate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* NEW / EDIT PRODUCT MODAL FORM */}
      {isModalOpen && (
        <div className="stock-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="stock-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="stock-modal-header">
              <h3>
                <i className="fa-solid fa-box"></i> {editingProduct ? 'Edit Product Stock' : '+ Add New Stock'}
              </h3>
              <button className="stock-modal-close" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="stock-modal-form">
              {formError && <div className="admin-error-banner">{formError}</div>}

              {/* Step 1 & 2: Image Uploads */}
              <div className="form-images-row">
                {/* Front Image Dropzone & URL Input */}
                <div className="image-upload-box">
                  <label className="upload-label">1. FRONT PRODUCT IMAGE *</label>
                  <div className="image-preview-area">
                    {frontPreview ? (
                      <img src={frontPreview} alt="Front Preview" className="uploaded-preview-img" />
                    ) : (
                      <div className="empty-preview">
                        <i className="fa-solid fa-image"></i>
                        <span>Upload Front T-Shirt / Jersey Image</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFrontImageSelect}
                    className="file-input-hidden"
                    id="front-img-input"
                  />
                  <label htmlFor="front-img-input" className="btn-upload-file">
                    <i className="fa-solid fa-cloud-arrow-up"></i> Choose New Front File
                  </label>
                  <div className="image-url-input-wrap">
                    <span className="url-input-label">Or Image Path / URL:</span>
                    <input
                      type="text"
                      placeholder="e.g. /ZYRO_Wear_Studio_Imgs/..."
                      value={formData.front_img}
                      onChange={(e) => {
                        const url = e.target.value;
                        setFormData((prev) => ({ ...prev, front_img: url }));
                        setFrontPreview(formatImageUrl(url));
                      }}
                      className="image-url-text-input"
                    />
                  </div>
                </div>

                {/* Back Image Dropzone & URL Input */}
                <div className="image-upload-box">
                  <label className="upload-label">2. BACK PRODUCT IMAGE *</label>
                  <div className="image-preview-area">
                    {backPreview ? (
                      <img src={backPreview} alt="Back Preview" className="uploaded-preview-img" />
                    ) : (
                      <div className="empty-preview">
                        <i className="fa-solid fa-image"></i>
                        <span>Upload Back T-Shirt / Jersey Image</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackImageSelect}
                    className="file-input-hidden"
                    id="back-img-input"
                  />
                  <label htmlFor="back-img-input" className="btn-upload-file">
                    <i className="fa-solid fa-cloud-arrow-up"></i> Choose New Back File
                  </label>
                  <div className="image-url-input-wrap">
                    <span className="url-input-label">Or Image Path / URL:</span>
                    <input
                      type="text"
                      placeholder="e.g. /ZYRO_Wear_Studio_Imgs/..."
                      value={formData.back_img}
                      onChange={(e) => {
                        const url = e.target.value;
                        setFormData((prev) => ({ ...prev, back_img: url }));
                        setBackPreview(formatImageUrl(url));
                      }}
                      className="image-url-text-input"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Product Name */}
              <div className="form-group">
                <label>3. PRODUCT NAME *</label>
                <input
                  type="text"
                  placeholder="e.g. Brazil Home Kit (Vini Jr #7)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Step 4: Description */}
              <div className="form-group">
                <label>4. DESCRIPTION *</label>
                <textarea
                  rows={3}
                  placeholder="Official 2026 kit featuring premium breathable fabric..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                ></textarea>
              </div>

              {/* Step 5: Category & Nation */}
              <div className="form-row-2">
                <div className="form-group">
                  <label>5. CATEGORY *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>NATION / TEAM (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Brazil"
                    value={formData.nation}
                    onChange={(e) => setFormData({ ...formData, nation: e.target.value })}
                  />
                </div>
              </div>

              {/* Step 6 & 7: Pricing */}
              <div className="form-row-2">
                <div className="form-group">
                  <label>6. ORIGINAL PRICE (MRP ₹) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="699"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>7. SPECIAL OFFER PRICE (₹ Optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Leave empty to use normal price (299)"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  />
                  <small className="form-help-text">
                    Crosses out original price when special offer price is set.
                  </small>
                </div>
              </div>

              {/* Step 8: Available Sizes Selection */}
              <div className="form-group">
                <label>8. AVAILABLE SIZES (Select all available for this product) *</label>
                <div className="sizes-checkbox-row">
                  {ALL_SIZES.map((sz) => (
                    <label key={sz} className={`size-checkbox-pill ${formData.sizes.includes(sz) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={formData.sizes.includes(sz)}
                        onChange={() => handleToggleSize(sz)}
                      />
                      <span>{sz}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step 9: Size-wise Stock Input */}
              <div className="form-group size-stock-inputs-box">
                <label>9. SIZE-WISE STOCK QUANTITY *</label>
                <p className="subtext">Set independent stock units for each selected size.</p>
                <div className="size-stock-grid">
                  {ALL_SIZES.map((sz) => {
                    const isSelected = formData.sizes.includes(sz);
                    return (
                      <div key={sz} className={`size-stock-input-item ${!isSelected ? 'disabled' : ''}`}>
                        <span className="sz-label">{sz}</span>
                        <input
                          type="number"
                          min="0"
                          disabled={!isSelected}
                          value={formData.stock_by_size[sz] !== undefined ? formData.stock_by_size[sz] : 0}
                          onChange={(e) => handleSizeStockChange(sz, e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 10: Size Chart Measurements (inch) */}
              <div className="form-group size-stock-inputs-box">
                <label>10. SIZE CHART MEASUREMENTS (Inches)</label>
                <p className="subtext">Set Length, Chest, Shoulder, and Sleeve dimensions for each size to populate the Size Chart.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
                  {ALL_SIZES.map((sz) => {
                    const isSelected = formData.sizes.includes(sz);
                    return (
                      <div key={sz} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr 1fr', gap: '0.8rem', alignItems: 'center', opacity: isSelected ? 1 : 0.5 }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#FFC700' }}>{sz} Size:</span>
                        <input
                          type="text"
                          placeholder="Length (in)"
                          disabled={!isSelected}
                          value={formData.size_chart?.[sz]?.length || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              size_chart: {
                                ...prev.size_chart,
                                [sz]: {
                                  ...(prev.size_chart?.[sz] || {}),
                                  length: val,
                                },
                              },
                            }));
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Chest (in)"
                          disabled={!isSelected}
                          value={formData.size_chart?.[sz]?.chest || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              size_chart: {
                                ...prev.size_chart,
                                [sz]: {
                                  ...(prev.size_chart?.[sz] || {}),
                                  chest: val,
                                },
                              },
                            }));
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Shoulder (in)"
                          disabled={!isSelected}
                          value={formData.size_chart?.[sz]?.shoulder || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              size_chart: {
                                ...prev.size_chart,
                                [sz]: {
                                  ...(prev.size_chart?.[sz] || {}),
                                  shoulder: val,
                                },
                              },
                            }));
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Sleeve (in)"
                          disabled={!isSelected}
                          value={(formData.size_chart?.[sz] as any)?.sleeve || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              size_chart: {
                                ...prev.size_chart,
                                [sz]: {
                                  ...(prev.size_chart?.[sz] || {}),
                                  sleeve: val,
                                },
                              },
                            }));
                          }}
                        />
                      </div>
                    );
                  })}
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
                      {uploadingImages ? 'Uploading Images...' : 'Saving Product...'}
                    </span>
                  ) : (
                    <span>
                      <i className="fa-solid fa-check"></i> {editingProduct ? 'Update Stock' : 'Add Stock Product'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK MANAGE STOCK MODAL */}
      {quickStockProduct && (
        <div className="stock-modal-backdrop" onClick={() => setQuickStockProduct(null)}>
          <div className="stock-modal-card mini" onClick={(e) => e.stopPropagation()}>
            <div className="stock-modal-header">
              <h3>
                <i className="fa-solid fa-boxes-packing"></i> Quick Stock Update
              </h3>
              <button className="stock-modal-close" onClick={() => setQuickStockProduct(null)}>
                &times;
              </button>
            </div>

            <div className="quick-stock-body">
              <p className="quick-stock-prod-name">{quickStockProduct.name}</p>

              <div className="size-stock-grid">
                {ALL_SIZES.map((sz) => (
                  <div key={sz} className="size-stock-input-item">
                    <span className="sz-label">{sz}</span>
                    <input
                      type="number"
                      min="0"
                      value={quickStockData[sz] !== undefined ? quickStockData[sz] : 0}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        setQuickStockData({
                          ...quickStockData,
                          [sz]: isNaN(v) ? 0 : Math.max(0, v),
                        });
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="modal-form-actions">
                <button type="button" className="btn-cancel" onClick={() => setQuickStockProduct(null)}>
                  Cancel
                </button>
                <button type="button" className="btn-submit-stock" onClick={handleSaveQuickStock} disabled={savingQuickStock}>
                  {savingQuickStock ? (
                    <span>
                      <i className="fa-solid fa-spinner fa-spin"></i> Saving...
                    </span>
                  ) : (
                    <span>
                      <i className="fa-solid fa-check"></i> Save Quantities
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
