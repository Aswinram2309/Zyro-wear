import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/database/client/admin';
import { SizeChartRecord, SizeChartMeasurementRow } from '@/shared/types';
import { unlinkDeletedSizeChartFromProducts } from './products-store';

const SIZE_CHARTS_FILE_PATH = path.join(process.cwd(), 'data', 'size-charts.json');

export const INITIAL_SIZE_CHARTS: SizeChartRecord[] = [
  {
    id: 'sc_normal_default',
    name: 'Normal T-Shirt Size Chart',
    brand_name: 'Normal T-Shirt Size Chart',
    type: 'NORMAL',
    chart_image_url: '/images/size-guide.jpg',
    image_url: '/images/size-guide.jpg',
    how_to_measure_image_url: '/images/size-guide.jpg',
    columns: ['Length', 'Chest', 'Shoulder', 'Sleeve'],
    measurements: [
      { size: 'M', length: '27', chest: '40', shoulder: '10', sleeve: '—' },
      { size: 'L', length: '28', chest: '42', shoulder: '10', sleeve: '—' },
      { size: 'XL', length: '29', chest: '44', shoulder: '10', sleeve: '—' },
      { size: 'XXL', length: '30', chest: '46', shoulder: '10.5', sleeve: '—' },
    ],
    unit: 'ALL MEASUREMENTS ARE IN INCHES',
    tips: [
      'Select the same size you choose in regular fit for oversized look. XXL customer should choose XL for oversize Fit.',
      'All sizes are approximate and may vary up to +/-0.5 inch.',
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'sc_oversized_default',
    name: 'Oversized T-Shirt Size Chart',
    brand_name: 'Oversized T-Shirt Size Chart',
    type: 'OVERSIZED',
    chart_image_url: '/images/oversized-size-guide.jpg',
    image_url: '/images/oversized-size-guide.jpg',
    how_to_measure_image_url: '/images/oversized-size-guide.jpg',
    columns: ['Shoulder', 'Chest', 'Length', 'Sleeve'],
    measurements: [
      { size: 'M', shoulder: '20', chest: '40', length: '27.5', sleeve: '10' },
      { size: 'L', shoulder: '21.5', chest: '42', length: '28', sleeve: '10' },
      { size: 'XL', shoulder: '22.5', chest: '44', length: '30', sleeve: '10.5' },
      { size: 'XXL', shoulder: '23.5', chest: '46', length: '31', sleeve: '11' },
    ],
    unit: 'ALL MEASUREMENTS ARE IN INCHES',
    tips: [
      'Relaxed drop-shoulder cut designed for maximum comfort and streetwear styling.',
      'All sizes are approximate and may vary up to +/-0.5 inch.',
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

export function extractChartColumns(measurements?: SizeChartMeasurementRow[], customCols?: string[]): string[] {
  if (Array.isArray(customCols) && customCols.length > 0) {
    return customCols.filter(Boolean);
  }
  if (!Array.isArray(measurements) || measurements.length === 0) {
    return ['Length', 'Chest', 'Shoulder', 'Sleeve'];
  }
  const set = new Set<string>();
  measurements.forEach((row) => {
    if (row && typeof row === 'object') {
      Object.keys(row).forEach((k) => {
        if (k !== 'size') set.add(k);
      });
    }
  });
  const res = Array.from(set);
  return res.length > 0 ? res : ['Length', 'Chest', 'Shoulder', 'Sleeve'];
}

function ensureSizeChartsFileExists(): SizeChartRecord[] {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(SIZE_CHARTS_FILE_PATH)) {
    fs.writeFileSync(SIZE_CHARTS_FILE_PATH, JSON.stringify(INITIAL_SIZE_CHARTS, null, 2), 'utf-8');
    return INITIAL_SIZE_CHARTS;
  }

  try {
    const raw = fs.readFileSync(SIZE_CHARTS_FILE_PATH, 'utf-8');
    const parsed: SizeChartRecord[] = JSON.parse(raw || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Error reading size-charts.json:', e);
  }

  fs.writeFileSync(SIZE_CHARTS_FILE_PATH, JSON.stringify(INITIAL_SIZE_CHARTS, null, 2), 'utf-8');
  return INITIAL_SIZE_CHARTS;
}

function writeLocalSizeCharts(charts: SizeChartRecord[]): void {
  try {
    const dir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SIZE_CHARTS_FILE_PATH, JSON.stringify(charts, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing size-charts.json:', e);
  }
}

export async function getAllSizeChartsFromStore(): Promise<SizeChartRecord[]> {
  const supabase = createAdminClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('size_charts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((d) => {
          const rawMeasurements: SizeChartMeasurementRow[] = Array.isArray(d.measurements)
            ? d.measurements
            : typeof d.measurements === 'object' && d.measurements !== null
            ? Object.entries(d.measurements).map(([size, vals]: [string, any]) => ({
                size,
                ...vals,
              }))
            : [];

          const brandName = String(d.brand_name || d.name || 'Untitled Brand').trim();
          const imgUrl = d.image_url || d.chart_image_url || null;

          return {
            id: String(d.id),
            name: brandName,
            brand_name: brandName,
            type: d.type || 'BRAND',
            image_url: imgUrl,
            chart_image_url: imgUrl,
            how_to_measure_image_url: d.how_to_measure_image_url || null,
            columns: extractChartColumns(rawMeasurements, d.columns),
            measurements: rawMeasurements,
            unit: d.unit || 'ALL MEASUREMENTS ARE IN INCHES',
            tips: Array.isArray(d.tips) ? d.tips : [],
            is_active: d.is_active !== undefined ? Boolean(d.is_active) : true,
            created_at: d.created_at || new Date().toISOString(),
            updated_at: d.updated_at || new Date().toISOString(),
          };
        });
      }
    } catch (err) {
      console.warn('Supabase fetch size_charts error, using local fallback:', err);
    }
  }

  return ensureSizeChartsFileExists();
}

export async function getSizeChartByIdFromStore(id: string): Promise<SizeChartRecord | null> {
  const charts = await getAllSizeChartsFromStore();
  return charts.find((c) => c.id === id) || null;
}

export async function getActiveSizeChartByType(type: 'NORMAL' | 'OVERSIZED'): Promise<SizeChartRecord> {
  const charts = await getAllSizeChartsFromStore();
  const active = charts.find((c) => c.type === type && c.is_active);
  if (active) return active;

  const fallbackSameType = charts.find((c) => c.type === type);
  if (fallbackSameType) return fallbackSameType;

  return (
    INITIAL_SIZE_CHARTS.find((c) => c.type === type) || INITIAL_SIZE_CHARTS[0]
  );
}

export async function saveNewSizeChartToStore(
  payload: Partial<SizeChartRecord>
): Promise<SizeChartRecord> {
  const id = payload.id || `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const brandName = (payload.brand_name || payload.name || 'New Brand').trim();
  const type = payload.type || 'BRAND';
  const isActive = payload.is_active !== undefined ? Boolean(payload.is_active) : true;
  const imageUrl = payload.image_url || payload.chart_image_url || null;
  const rawMeasurements = payload.measurements && Array.isArray(payload.measurements) ? payload.measurements : [];
  const columns = extractChartColumns(rawMeasurements, payload.columns);

  const newChart: SizeChartRecord = {
    id,
    name: brandName,
    brand_name: brandName,
    type,
    image_url: imageUrl,
    chart_image_url: imageUrl,
    how_to_measure_image_url: payload.how_to_measure_image_url || null,
    columns,
    measurements: rawMeasurements,
    unit: payload.unit || 'ALL MEASUREMENTS ARE IN INCHES',
    tips: payload.tips || [],
    is_active: isActive,
    created_at: now,
    updated_at: now,
  };

  const supabase = createAdminClient();

  if (supabase) {
    try {
      // In Supabase schema, type has CHECK (type IN ('NORMAL', 'OVERSIZED')).
      // Brand charts correspond to Oversized/Customized fit.
      const dbType = newChart.type === 'NORMAL' ? 'NORMAL' : 'OVERSIZED';

      const dbPayload: any = {
        id: newChart.id,
        name: newChart.name,
        brand_name: newChart.brand_name,
        type: dbType,
        image_url: newChart.image_url,
        chart_image_url: newChart.chart_image_url,
        how_to_measure_image_url: newChart.how_to_measure_image_url,
        columns: newChart.columns,
        measurements: newChart.measurements,
        unit: newChart.unit,
        tips: newChart.tips,
        is_active: newChart.is_active,
        created_at: newChart.created_at,
        updated_at: newChart.updated_at,
      };

      let { error } = await supabase.from('size_charts').insert(dbPayload);

      if (error) {
        // If type check constraint failed, enforce OVERSIZED
        if (error.message && error.message.includes('size_charts_type_check')) {
          dbPayload.type = 'OVERSIZED';
          const retry = await supabase.from('size_charts').insert(dbPayload);
          error = retry.error;
        }

        // If brand_name, image_url, or columns are missing from older Supabase schema cache, retry without them
        if (error && error.message && (error.message.includes('brand_name') || error.message.includes('image_url') || error.message.includes('columns') || error.message.includes('schema cache'))) {
          delete dbPayload.brand_name;
          delete dbPayload.image_url;
          delete dbPayload.columns;
          const retry2 = await supabase.from('size_charts').insert(dbPayload);
          error = retry2.error;
        }

        if (error) {
          console.error('CRITICAL: Supabase insert size_charts error:', error);
          throw new Error(`Failed to save size chart to Supabase: ${error.message}`);
        }
      }

      // Also persist to size_chart_measurements relational table if available
      if (rawMeasurements.length > 0) {
        try {
          const scmRows = rawMeasurements.map((m, idx) => ({
            id: `${newChart.id}_m_${idx}`,
            size_chart_id: newChart.id,
            size_label: m.size,
            measurements: m,
            created_at: now,
            updated_at: now,
          }));
          await supabase.from('size_chart_measurements').insert(scmRows);
        } catch {}
      }
    } catch (err: any) {
      console.error('Supabase insert size_charts exception:', err);
      throw err;
    }
  }

  // Sync to local JSON fallback
  const list = ensureSizeChartsFileExists();
  const updatedList = [newChart, ...list.filter((c) => c.id !== id)];
  writeLocalSizeCharts(updatedList);

  return newChart;
}

export async function updateSizeChartInStore(
  id: string,
  updates: Partial<SizeChartRecord>
): Promise<SizeChartRecord | null> {
  const now = new Date().toISOString();
  const current = await getSizeChartByIdFromStore(id);
  if (!current) return null;

  const brandName = (updates.brand_name || updates.name || current.brand_name || current.name || '').trim();
  const imageUrl = updates.image_url !== undefined ? updates.image_url : (updates.chart_image_url !== undefined ? updates.chart_image_url : current.image_url);
  const rawMeasurements = updates.measurements !== undefined ? updates.measurements : current.measurements;
  const columns = extractChartColumns(rawMeasurements, updates.columns || current.columns);

  const updatedRecord: SizeChartRecord = {
    ...current,
    ...updates,
    id,
    name: brandName,
    brand_name: brandName,
    image_url: imageUrl,
    chart_image_url: imageUrl,
    columns,
    measurements: rawMeasurements,
    updated_at: now,
  };

  const supabase = createAdminClient();

  if (supabase) {
    try {
      const dbPayload: any = {
        updated_at: now,
      };
      if (brandName) {
        dbPayload.name = brandName;
        dbPayload.brand_name = brandName;
      }
      if (updates.type !== undefined) {
        dbPayload.type = updates.type === 'NORMAL' ? 'NORMAL' : 'OVERSIZED';
      }
      dbPayload.image_url = imageUrl;
      dbPayload.chart_image_url = imageUrl;
      if (updates.how_to_measure_image_url !== undefined) {
        dbPayload.how_to_measure_image_url = updates.how_to_measure_image_url;
      }
      dbPayload.columns = columns;
      dbPayload.measurements = rawMeasurements;
      if (updates.unit !== undefined) dbPayload.unit = updates.unit;
      if (updates.tips !== undefined) dbPayload.tips = updates.tips;
      if (updates.is_active !== undefined) dbPayload.is_active = updates.is_active;

      let { error } = await supabase.from('size_charts').update(dbPayload).eq('id', id);
      if (error) {
        if (error.message && error.message.includes('size_charts_type_check')) {
          dbPayload.type = 'OVERSIZED';
          const retry = await supabase.from('size_charts').update(dbPayload).eq('id', id);
          error = retry.error;
        }

        if (error && error.message && (error.message.includes('brand_name') || error.message.includes('image_url') || error.message.includes('columns') || error.message.includes('schema cache'))) {
          delete dbPayload.brand_name;
          delete dbPayload.image_url;
          delete dbPayload.columns;
          const retry2 = await supabase.from('size_charts').update(dbPayload).eq('id', id);
          error = retry2.error;
        }

        if (error) {
          console.error('CRITICAL: Supabase update size_charts error:', error);
          throw new Error(`Failed to update size chart in Supabase: ${error.message}`);
        }
      }

      // Also update size_chart_measurements relational table if available
      if (rawMeasurements && rawMeasurements.length > 0) {
        try {
          await supabase.from('size_chart_measurements').delete().eq('size_chart_id', id);
          const scmRows = rawMeasurements.map((m, idx) => ({
            id: `${id}_m_${idx}`,
            size_chart_id: id,
            size_label: m.size,
            measurements: m,
            created_at: now,
            updated_at: now,
          }));
          await supabase.from('size_chart_measurements').insert(scmRows);
        } catch {}
      }
    } catch (err) {
      console.warn('Supabase update size_charts exception:', err);
    }
  }

  // Update local file
  const list = ensureSizeChartsFileExists();
  const index = list.findIndex((c) => c.id === id);
  let updatedList = [...list];

  if (index !== -1) {
    updatedList[index] = updatedRecord;
  } else {
    updatedList.unshift(updatedRecord);
  }

  writeLocalSizeCharts(updatedList);
  return updatedRecord;
}

export async function deleteSizeChartFromStore(id: string): Promise<boolean> {
  const current = await getSizeChartByIdFromStore(id);
  if (!current) return false;

  const supabase = createAdminClient();

  if (supabase) {
    try {
      await supabase.from('size_chart_measurements').delete().eq('size_chart_id', id);
    } catch {}

    try {
      await supabase.from('size_charts').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete size_charts error:', err);
    }
  }

  // Safely unlink any products referencing this chart so no orphaned/broken references remain
  await unlinkDeletedSizeChartFromProducts(id);

  const list = ensureSizeChartsFileExists();
  const updatedList = list.filter((c) => c.id !== id);
  writeLocalSizeCharts(updatedList);
  return true;
}

export async function setActiveSizeChart(id: string): Promise<SizeChartRecord | null> {
  return await updateSizeChartInStore(id, { is_active: true });
}
