import { SizeMeasurement } from '../types';
import { normalizeCategory } from './stock-config';

export type SizeChartType = 'NORMAL' | 'OVERSIZED';

export interface SizeChartColumn {
  key: keyof SizeMeasurement;
  label: string;
}

export interface HowToMeasureStep {
  title: string;
  description: string;
  icon: string;
}

export interface SizeChartConfig {
  type: SizeChartType;
  title: string;
  subtitle: string;
  tagline?: string;
  unit: string;
  columns: SizeChartColumn[];
  defaultMeasurements: Record<string, SizeMeasurement>;
  features?: string[];
  tips: string[];
  howToMeasureImage: string;
  howToMeasureSteps: HowToMeasureStep[];
}

/**
 * 1. NORMAL T-SHIRT SIZE CHART SPECIFICATION
 * Preserves the exact existing measurements and structure
 */
export const NORMAL_SIZE_CHART_DEFAULTS: Record<string, SizeMeasurement> = {
  M: { length: '27', chest: '40', shoulder: '10' },
  L: { length: '29', chest: '42', shoulder: '10' },
  XL: { length: '28', chest: '44', shoulder: '10' },
  XXL: { length: '30', chest: '46', shoulder: '10.5' },
};

export const NORMAL_SIZE_CHART_CONFIG: SizeChartConfig = {
  type: 'NORMAL',
  title: 'PRODUCT DIMENSIONS',
  subtitle: 'STANDARD / ATHLETIC FIT',
  unit: 'All measurements are in Inches (in)',
  columns: [
    { key: 'length', label: 'LENGTH SIZE (INCH)' },
    { key: 'chest', label: 'CHEST SIZE (INCH)' },
    { key: 'shoulder', label: 'SHOULDER SIZE (INCH)' },
  ],
  defaultMeasurements: NORMAL_SIZE_CHART_DEFAULTS,
  tips: [
    'Select the same size you choose in regular fit for oversized look. XXL customer should choose XL for oversize Fit.',
    'All Sizes are approximate and may vary up to +/-0.5 inch.',
  ],
  howToMeasureImage: '/images/size-guide.jpg',
  howToMeasureSteps: [
    {
      title: '1. Length',
      description: 'Measure from the highest point of the shoulder straight down to the bottom hem of the jersey.',
      icon: 'fa-solid fa-arrows-up-down',
    },
    {
      title: '2. Chest',
      description: 'Measure horizontally across the chest from armpit to armpit (pit-to-pit) and double it if you want full circumference.',
      icon: 'fa-solid fa-arrows-left-right',
    },
    {
      title: '3. Shoulder',
      description: 'Measure across the back of the shirt from one shoulder seam point straight to the other shoulder seam point.',
      icon: 'fa-solid fa-ruler-horizontal',
    },
  ],
};

/**
 * 2. OVERSIZED T-SHIRT SIZE CHART SPECIFICATION
 * Extracted from the official ZYRO Wear Oversized Tee Size Chart Guide:
 * Columns: SHOULDER (in) | CHEST (in) | LENGTH (in) | SLEEVE (in)
 * M:  20   | 40 | 27.5 | 10
 * L:  21.5 | 42 | 28   | 10
 * XL: 22.5 | 44 | 30   | 10.5
 * XXL: 23.5| 46 | 31   | 11
 */
export const OVERSIZED_SIZE_CHART_DEFAULTS: Record<string, SizeMeasurement> = {
  M: { shoulder: '20', chest: '40', length: '27.5', sleeve: '10' },
  L: { shoulder: '21.5', chest: '42', length: '28', sleeve: '10' },
  XL: { shoulder: '22.5', chest: '44', length: '30', sleeve: '10.5' },
  XXL: { shoulder: '23.5', chest: '46', length: '31', sleeve: '11' },
};

export const OVERSIZED_SIZE_CHART_CONFIG: SizeChartConfig = {
  type: 'OVERSIZED',
  title: 'OVERSIZED TEE SIZE CHART',
  subtitle: 'RELAXED FIT • MORE COMFORT • EVERYDAY STYLE',
  tagline: 'WEAR YOUR ENERGY',
  unit: 'ALL MEASUREMENTS ARE IN INCHES',
  columns: [
    { key: 'shoulder', label: 'SHOULDER (IN)' },
    { key: 'chest', label: 'CHEST (IN)' },
    { key: 'length', label: 'LENGTH (IN)' },
    { key: 'sleeve', label: 'SLEEVE (IN)' },
  ],
  defaultMeasurements: OVERSIZED_SIZE_CHART_DEFAULTS,
  features: [
    'Soft & Breathable',
    'Oversized Fit',
    'Premium Quality',
    'Perfect For Casual Wear',
  ],
  tips: [
    'Relaxed drop-shoulder cut designed for maximum comfort and streetwear styling.',
    'All Sizes are approximate and may vary up to +/-0.5 inch.',
  ],
  howToMeasureImage: '/images/oversized-size-guide.jpg',
  howToMeasureSteps: [
    {
      title: '1. Shoulder',
      description: 'Measure from one shoulder point to the other, straight across the back.',
      icon: 'fa-solid fa-arrows-left-right',
    },
    {
      title: '2. Chest',
      description: 'Measure around the fullest part of your chest, keeping the tape horizontal.',
      icon: 'fa-solid fa-ruler-combined',
    },
    {
      title: '3. Length',
      description: 'Measure from the highest point of the shoulder (near neck) to the bottom hem.',
      icon: 'fa-solid fa-arrows-up-down',
    },
    {
      title: '4. Sleeve',
      description: 'Measure from the shoulder seam to the end of the sleeve.',
      icon: 'fa-solid fa-ruler-horizontal',
    },
  ],
};

/**
 * Helper function to determine the size chart type strictly from category/type.
 * Works automatically for all current and future products.
 */
export function getSizeChartType(category?: string, productName: string = ''): SizeChartType {
  const normCat = normalizeCategory(category || '', productName);
  if (normCat === 'Oversized T-Shirts') {
    return 'OVERSIZED';
  }
  const rawCat = (category || '').trim().toLowerCase();
  if (rawCat.includes('oversize') || rawCat.includes('over sized')) {
    return 'OVERSIZED';
  }
  return 'NORMAL';
}

/**
 * Returns the full size chart configuration based on category and optional product name.
 */
export function getSizeChartConfig(category?: string, productName: string = ''): SizeChartConfig {
  const type = getSizeChartType(category, productName);
  return type === 'OVERSIZED' ? OVERSIZED_SIZE_CHART_CONFIG : NORMAL_SIZE_CHART_CONFIG;
}

/**
 * Returns a specific measurement value from a SizeChartRecord or falls back to defaults.
 */
export function getMeasurementFromRecord(
  record: import('../types').SizeChartRecord | undefined | null,
  size: string,
  field: string,
  fallbackVal: string = '—'
): string {
  if (!record || !record.measurements || !Array.isArray(record.measurements)) {
    return fallbackVal;
  }
  const row = record.measurements.find((m) => m.size.toUpperCase() === size.toUpperCase());
  if (row && (row as any)[field] !== undefined && (row as any)[field] !== null && String((row as any)[field]).trim() !== '') {
    return String((row as any)[field]).trim();
  }
  return fallbackVal;
}

/**
 * Returns a specific measurement value with proper fallback to chart-type defaults.
 */
export function getProductMeasurement(
  sizeChart: Record<string, SizeMeasurement> | undefined,
  category: string | undefined,
  productName: string = '',
  size: string,
  field: keyof SizeMeasurement,
  activeRecord?: import('../types').SizeChartRecord | null
): string {
  // 1. Check direct product size chart override
  const dbVal = sizeChart?.[size]?.[field];
  if (dbVal !== undefined && dbVal !== null && String(dbVal).trim() !== '') {
    return String(dbVal).trim();
  }

  // 2. Check active admin-managed size chart record
  if (activeRecord) {
    const recVal = getMeasurementFromRecord(activeRecord, size, field, '');
    if (recVal && recVal !== '—') {
      return recVal;
    }
  }

  // 3. Fallback to default static configuration
  const config = getSizeChartConfig(category, productName);
  const defVal = config.defaultMeasurements[size]?.[field];
  return defVal !== undefined && defVal !== null && String(defVal).trim() !== '' ? String(defVal).trim() : '—';
}
