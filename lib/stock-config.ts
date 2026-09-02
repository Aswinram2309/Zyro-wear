export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export type StockStatus = 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK';

/**
 * Calculates total stock count across all sizes from a size-wise stock mapping.
 * Fallback to legacy single stock number if stock_by_size is missing.
 */
export function calculateTotalStock(
  stock_by_size?: Record<string, number>,
  fallbackStock: number = 0
): number {
  if (stock_by_size && typeof stock_by_size === 'object') {
    return Object.values(stock_by_size).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }
  return Number(fallbackStock) || 0;
}

/**
 * Returns stock status based on total stock quantity and configurable threshold.
 * 0 => OUT OF STOCK
 * 1..threshold => LOW STOCK
 * > threshold => IN STOCK
 */
export function calculateStockStatus(
  totalStock: number,
  threshold: number = DEFAULT_LOW_STOCK_THRESHOLD
): StockStatus {
  if (totalStock <= 0) {
    return 'OUT OF STOCK';
  }
  if (totalStock <= threshold) {
    return 'LOW STOCK';
  }
  return 'IN STOCK';
}

/**
 * Ensures image URLs start with '/' or 'http(s)://' or 'data:' so they resolve cleanly
 * on nested routes like /admin/stock.
 */
export function formatImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return '';
  }
  let cleanUrl = url.trim().replace(/\\/g, '/');
  if (
    cleanUrl.startsWith('http://') ||
    cleanUrl.startsWith('https://') ||
    cleanUrl.startsWith('data:')
  ) {
    return cleanUrl;
  }
  if (!cleanUrl.startsWith('/')) {
    cleanUrl = `/${cleanUrl}`;
  }
  return cleanUrl;
}

export type CategoryType =
  | 'Football Jerseys'
  | 'IPL Jerseys'
  | 'Customized T-Shirts'
  | 'Oversized T-Shirts';

export function normalizeCategory(category: string, productName: string = ''): CategoryType {
  const cat = (category || '').trim().toLowerCase();
  
  if (cat === 'football jerseys' || cat === 'football-jerseys') return 'Football Jerseys';
  if (cat === 'ipl jerseys' || cat === 'ipl-jerseys' || cat === 'ipl' || cat === 'club') return 'IPL Jerseys';
  if (cat === 'customized t-shirts' || cat === 'customized-t-shirts' || cat === 'customized tshirts' || cat === 'customized' || cat === 'customize jerseys' || cat === 'customize jersey' || cat === 'customize' || cat === 'custom') return 'Customized T-Shirts';
  if (cat === 'oversized t-shirts' || cat === 'oversized-t-shirts' || cat === 'oversized tshirts' || cat === 'oversized') return 'Oversized T-Shirts';
  if (cat === 'star' || cat === 'national') return 'Football Jerseys';

  // Last-resort fallback ONLY if category is completely blank/unspecified
  const name = (productName || '').toLowerCase();
  if (name.includes('oversize') || name.includes('over sized')) {
    return 'Oversized T-Shirts';
  }
  if (name.includes('custom') || name.includes('personal')) {
    return 'Customized T-Shirts';
  }
  if (name.includes('ipl')) {
    return 'IPL Jerseys';
  }

  return 'Football Jerseys';
}

