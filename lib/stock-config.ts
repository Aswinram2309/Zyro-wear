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

export function normalizeCategory(category: string, productName: string = ''): 'Football Jerseys' | 'IPL Jerseys' | 'Customize Jerseys' {
  const cat = (category || '').trim().toLowerCase();
  
  if (cat === 'football jerseys') return 'Football Jerseys';
  if (cat === 'ipl jerseys') return 'IPL Jerseys';
  if (cat === 'customize jerseys') return 'Customize Jerseys';

  if (cat === 'star' || cat === 'national') return 'Football Jerseys';
  if (cat === 'ipl' || cat === 'club') return 'IPL Jerseys';
  if (cat === 'customize' || cat === 'custom') return 'Customize Jerseys';

  const name = productName.toLowerCase();
  if (name.includes('ipl') || name.includes('rcb') || name.includes('csk') || name.includes('mi') || name.includes('kkr') || name.includes('srh') || name.includes('delhi') || name.includes('punjab') || name.includes('rajasthan')) {
    return 'IPL Jerseys';
  }
  if (name.includes('custom') || name.includes('personal')) {
    return 'Customize Jerseys';
  }

  return 'Football Jerseys';
}

