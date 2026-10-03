import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/database/client/admin';
import { SizeChartRecord, SizeChartMeasurementRow } from '@/shared/types';

const SIZE_CHARTS_FILE_PATH = path.join(process.cwd(), 'data', 'size-charts.json');

export const INITIAL_SIZE_CHARTS: SizeChartRecord[] = [
  {
    id: 'sc_normal_default',
    name: 'Normal T-Shirt Size Chart',
    type: 'NORMAL',
    chart_image_url: '/images/size-guide.jpg',
    how_to_measure_image_url: '/images/size-guide.jpg',
    measurements: [
      { size: 'M', length: '27', chest: '40', shoulder: '10', sleeve: '—' },
      { size: 'L', length: '29', chest: '42', shoulder: '10', sleeve: '—' },
      { size: 'XL', length: '28', chest: '44', shoulder: '10', sleeve: '—' },
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
    type: 'OVERSIZED',
    chart_image_url: '/images/oversized-size-guide.jpg',
    how_to_measure_image_url: '/images/oversized-size-guide.jpg',
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
        return data.map((d) => ({
          id: String(d.id),
          name: String(d.name || ''),
          type: d.type === 'OVERSIZED' ? 'OVERSIZED' : 'NORMAL',
          chart_image_url: d.chart_image_url || null,
          how_to_measure_image_url: d.how_to_measure_image_url || null,
          measurements: Array.isArray(d.measurements)
            ? d.measurements
            : typeof d.measurements === 'object' && d.measurements !== null
            ? Object.entries(d.measurements).map(([size, vals]: [string, any]) => ({
                size,
                ...vals,
              }))
            : [],
          unit: d.unit || 'ALL MEASUREMENTS ARE IN INCHES',
          tips: Array.isArray(d.tips) ? d.tips : [],
          is_active: Boolean(d.is_active),
          created_at: d.created_at || new Date().toISOString(),
          updated_at: d.updated_at || new Date().toISOString(),
        }));
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
  const type: 'NORMAL' | 'OVERSIZED' = payload.type === 'OVERSIZED' ? 'OVERSIZED' : 'NORMAL';
  const isActive = payload.is_active !== undefined ? Boolean(payload.is_active) : true;

  const newChart: SizeChartRecord = {
    id,
    name: payload.name?.trim() || `${type === 'OVERSIZED' ? 'Oversized' : 'Normal'} T-Shirt Size Chart`,
    type,
    chart_image_url: payload.chart_image_url || null,
    how_to_measure_image_url: payload.how_to_measure_image_url || null,
    measurements: payload.measurements && Array.isArray(payload.measurements) ? payload.measurements : [],
    unit: payload.unit || 'ALL MEASUREMENTS ARE IN INCHES',
    tips: payload.tips || (type === 'OVERSIZED' ? INITIAL_SIZE_CHARTS[1].tips : INITIAL_SIZE_CHARTS[0].tips),
    is_active: isActive,
    created_at: now,
    updated_at: now,
  };

  const supabase = createAdminClient();

  if (supabase) {
    try {
      // If this chart is active, deactivate other charts of same type first
      if (isActive) {
        await supabase
          .from('size_charts')
          .update({ is_active: false, updated_at: now })
          .eq('type', type);
      }

      const { error } = await supabase.from('size_charts').insert({
        id: newChart.id,
        name: newChart.name,
        type: newChart.type,
        chart_image_url: newChart.chart_image_url,
        how_to_measure_image_url: newChart.how_to_measure_image_url,
        measurements: newChart.measurements,
        unit: newChart.unit,
        tips: newChart.tips,
        is_active: newChart.is_active,
        created_at: newChart.created_at,
        updated_at: newChart.updated_at,
      });

      if (error) {
        console.warn('Supabase insert size_charts error:', error);
      }
    } catch (err) {
      console.warn('Supabase insert size_charts exception:', err);
    }
  }

  // Sync to local JSON fallback
  const list = ensureSizeChartsFileExists();
  let updatedList = list;
  if (isActive) {
    updatedList = updatedList.map((c) => (c.type === type ? { ...c, is_active: false } : c));
  }
  updatedList.unshift(newChart);
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

  const targetType = updates.type || current.type;
  const isNowActive = updates.is_active !== undefined ? Boolean(updates.is_active) : current.is_active;

  const updatedRecord: SizeChartRecord = {
    ...current,
    ...updates,
    id,
    type: targetType,
    is_active: isNowActive,
    updated_at: now,
  };

  const supabase = createAdminClient();

  if (supabase) {
    try {
      if (isNowActive) {
        // Deactivate all other charts of same type
        await supabase
          .from('size_charts')
          .update({ is_active: false, updated_at: now })
          .eq('type', targetType)
          .neq('id', id);
      }

      const dbPayload: any = {
        updated_at: now,
      };
      if (updates.name !== undefined) dbPayload.name = updates.name.trim();
      if (updates.type !== undefined) dbPayload.type = updates.type;
      if (updates.chart_image_url !== undefined) dbPayload.chart_image_url = updates.chart_image_url;
      if (updates.how_to_measure_image_url !== undefined)
        dbPayload.how_to_measure_image_url = updates.how_to_measure_image_url;
      if (updates.measurements !== undefined) dbPayload.measurements = updates.measurements;
      if (updates.unit !== undefined) dbPayload.unit = updates.unit;
      if (updates.tips !== undefined) dbPayload.tips = updates.tips;
      if (updates.is_active !== undefined) dbPayload.is_active = updates.is_active;

      const { error } = await supabase.from('size_charts').update(dbPayload).eq('id', id);
      if (error) {
        console.warn('Supabase update size_charts error:', error);
      }
    } catch (err) {
      console.warn('Supabase update size_charts exception:', err);
    }
  }

  // Update local file
  const list = ensureSizeChartsFileExists();
  const index = list.findIndex((c) => c.id === id);
  let updatedList = [...list];

  if (isNowActive) {
    updatedList = updatedList.map((c) =>
      c.type === targetType && c.id !== id ? { ...c, is_active: false } : c
    );
  }

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
      await supabase.from('size_charts').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete size_charts error:', err);
    }
  }

  const list = ensureSizeChartsFileExists();
  let updatedList = list.filter((c) => c.id !== id);

  // If we just deleted the active chart for a type and other charts exist for that type, activate the newest remaining
  if (current.is_active) {
    const remainingSameType = updatedList.find((c) => c.type === current.type);
    if (remainingSameType) {
      remainingSameType.is_active = true;
    }
  }

  writeLocalSizeCharts(updatedList);
  return true;
}

export async function setActiveSizeChart(id: string): Promise<SizeChartRecord | null> {
  return await updateSizeChartInStore(id, { is_active: true });
}
