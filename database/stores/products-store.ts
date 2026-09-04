import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/database/client/admin';
import { INITIAL_PRODUCTS } from '@/database/seed/products-data';
import { Product } from '@/shared/types';
import { formatImageUrl } from '@/shared/constants/stock-config';

const PRODUCTS_FILE_PATH = path.join(process.cwd(), 'data', 'products.json');

const DEFAULT_SIZE_STOCK: Record<string, number> = {
  S: 10,
  M: 15,
  L: 15,
  XL: 10,
  XXL: 5,
};

export function createSlug(name: string, id?: string): string {
  if (!name || typeof name !== 'string') return id ? `product-${id}` : `product-${Date.now()}`;
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug) {
    slug = id ? `product-${id}` : `product-${Date.now()}`;
  }
  return slug;
}

function ensureProductsFileExists(): Product[] {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(PRODUCTS_FILE_PATH)) {
    const formattedInitial = INITIAL_PRODUCTS.map((p) => ({
      ...p,
      slug: createSlug(p.slug || p.name, p.id),
      sale_price: null,
      stock_by_size: DEFAULT_SIZE_STOCK,
      stock: 55,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    fs.writeFileSync(PRODUCTS_FILE_PATH, JSON.stringify(formattedInitial, null, 2), 'utf-8');
    return formattedInitial;
  }

  try {
    const raw = fs.readFileSync(PRODUCTS_FILE_PATH, 'utf-8');
    const parsed: Product[] = JSON.parse(raw || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      let needsRewrite = false;
      const updatedList = parsed.map((p) => {
        const cleanSlug = createSlug(p.slug || p.name, p.id);
        if (cleanSlug !== p.slug) {
          needsRewrite = true;
          return { ...p, slug: cleanSlug };
        }
        return p;
      });

      if (needsRewrite) {
        fs.writeFileSync(PRODUCTS_FILE_PATH, JSON.stringify(updatedList, null, 2), 'utf-8');
      }
      return updatedList;
    }
  } catch (e) {
    console.error('Error reading products.json:', e);
  }

  const fallback = INITIAL_PRODUCTS.map((p) => ({
    ...p,
    slug: createSlug(p.slug || p.name, p.id),
    sale_price: null,
    stock_by_size: DEFAULT_SIZE_STOCK,
    stock: 55,
    is_active: true,
  }));
  return fallback;
}

export function calculateProductTotalStock(stock_by_size?: Record<string, number>, fallbackStock: number = 0): number {
  if (stock_by_size && typeof stock_by_size === 'object') {
    return Object.values(stock_by_size).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }
  return Number(fallbackStock) || 0;
}

export async function getAllProductsFromStore(includeInactive: boolean = false): Promise<Product[]> {
  const supabase = createAdminClient();

  // 1. Fetch live canonical products directly from Supabase DB (Single Source of Truth)
  if (supabase) {
    try {
      const { data: dbProducts, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && dbProducts && Array.isArray(dbProducts)) {
        const canonicalProducts: Product[] = dbProducts.map((dbP) => {
          let stockBySize: Record<string, number> | null = dbP.stock_by_size || null;

          if (!stockBySize && Array.isArray(dbP.images)) {
            const metaStr = dbP.images.find(
              (img: any) => typeof img === 'string' && img.startsWith('__stock_by_size:')
            );
            if (metaStr) {
              try {
                stockBySize = JSON.parse(metaStr.replace('__stock_by_size:', ''));
              } catch (e) {}
            }
          }

          if (!stockBySize) {
            const sizes = (dbP.sizes && dbP.sizes.length > 0 ? dbP.sizes : ['M', 'L', 'XL', 'XXL']).filter((s: string) => s !== 'S');
            stockBySize = {};
            sizes.forEach((s: string) => { stockBySize![s] = 10; });
          }

          if (stockBySize) {
            delete stockBySize['S'];
          }

          const filteredSizes = (dbP.sizes || ['M', 'L', 'XL', 'XXL']).filter((s: string) => s !== 'S');
          const sanitizedSizes = filteredSizes.length > 0 ? filteredSizes : ['M', 'L', 'XL', 'XXL'];
          const totalStock = calculateProductTotalStock(stockBySize, dbP.stock ?? 0);

          const front_img = formatImageUrl(dbP.front_img);
          const back_img = formatImageUrl(dbP.back_img);
          const rawImages = Array.isArray(dbP.images) && dbP.images.length > 0 ? dbP.images : [front_img, back_img];
          const cleanImages = rawImages
            .filter((img: any) => typeof img === 'string' && !img.startsWith('__stock_by_size:'))
            .map((img: string) => formatImageUrl(img));

          const slug = dbP.slug || createSlug(dbP.name, dbP.id);

          return {
            id: dbP.id,
            name: dbP.name || 'Untitled Product',
            slug: slug,
            description: dbP.description || '',
            price: Number(dbP.price ?? 0),
            mrp: Number(dbP.mrp ?? dbP.price ?? 0),
            sale_price: dbP.sale_price !== undefined ? dbP.sale_price : null,
            category: dbP.category || 'Football Jerseys',
            nation: dbP.nation || undefined,
            front_img,
            back_img,
            images: cleanImages.length > 0 ? cleanImages : [front_img, back_img].filter(Boolean),
            sizes: sanitizedSizes,
            stock: totalStock,
            stock_by_size: stockBySize,
            size_chart: dbP.size_chart || undefined,
            is_active: dbP.is_active !== undefined ? Boolean(dbP.is_active) : true,
            created_at: dbP.created_at || new Date().toISOString(),
            updated_at: dbP.updated_at || new Date().toISOString(),
          };
        });

        return canonicalProducts.filter((p) => {
          if (!includeInactive && p.is_active === false) return false;
          return true;
        });
      }
    } catch (e) {
      console.error('Supabase fetch products error:', e);
    }
  }

  // 2. Only if Supabase is completely unreachable (e.g. offline dev), fallback to local JSON
  const localProducts = ensureProductsFileExists();
  return localProducts
    .map((p) => ({
      ...p,
      front_img: formatImageUrl(p.front_img),
      back_img: formatImageUrl(p.back_img),
      slug: p.slug || createSlug(p.name, p.id),
    }))
    .filter((p) => {
      if (!includeInactive && p.is_active === false) return false;
      return true;
    });
}

export async function getProductByIdFromStore(id: string): Promise<Product | null> {
  const all = await getAllProductsFromStore(true);
  return all.find((p) => p.id === id) || null;
}

export async function saveNewProductToStore(productPayload: Partial<Product>): Promise<Product> {

  const supabase = createAdminClient();
  const id = productPayload.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const rawStock = productPayload.stock_by_size || DEFAULT_SIZE_STOCK;
  const stockBySize = { ...rawStock };
  delete stockBySize['S'];
  const totalStock = calculateProductTotalStock(stockBySize, productPayload.stock || 0);
  const rawSizes = productPayload.sizes || Object.keys(stockBySize).filter((s) => (stockBySize[s] || 0) >= 0);
  const availableSizes = rawSizes.filter(s => s !== 'S');
  const slug = createSlug(productPayload.slug || productPayload.name || 'product', id);

  const newProduct: Product = {
    id,
    name: productPayload.name || 'Untitled Product',
    slug,
    description: productPayload.description || '',
    price: Number(productPayload.price) || 0,
    mrp: Number(productPayload.mrp) || Number(productPayload.price) || 0,
    sale_price: productPayload.sale_price !== undefined ? (productPayload.sale_price === null ? null : Number(productPayload.sale_price)) : null,
    category: productPayload.category || 'Football Jerseys',
    nation: productPayload.nation || undefined,
    front_img: formatImageUrl(productPayload.front_img),
    back_img: formatImageUrl(productPayload.back_img),
    images: [formatImageUrl(productPayload.front_img), formatImageUrl(productPayload.back_img)].filter(Boolean),
    sizes: availableSizes.length > 0 ? availableSizes : ['M', 'L', 'XL', 'XXL'],
    stock: totalStock,
    stock_by_size: stockBySize,
    size_chart: productPayload.size_chart || undefined,
    is_active: productPayload.is_active !== undefined ? Boolean(productPayload.is_active) : true,
    created_at: now,
    updated_at: now,
  };

  // 1. Persist to Supabase if available
  if (supabase) {
    try {
      const metadata = `__stock_by_size:${JSON.stringify(stockBySize)}`;
      const dbPayload: any = {
        id: newProduct.id,
        name: newProduct.name,
        slug: newProduct.slug,
        description: newProduct.description,
        price: newProduct.price,
        mrp: newProduct.mrp,
        category: newProduct.category,
        nation: newProduct.nation,
        front_img: newProduct.front_img,
        back_img: newProduct.back_img,
        images: [...(newProduct.images || []), metadata],
        sizes: newProduct.sizes,
        stock: newProduct.stock,
        is_active: newProduct.is_active,
        created_at: newProduct.created_at,
        updated_at: newProduct.updated_at,
      };

      if (newProduct.sale_price !== null && newProduct.sale_price !== undefined) {
        dbPayload.sale_price = newProduct.sale_price;
      }
      if (newProduct.stock_by_size) {
        dbPayload.stock_by_size = newProduct.stock_by_size;
      }

      const { error } = await supabase.from('products').insert(dbPayload).select().single();

      if (error) {
        if (error.message && (error.message.includes('sale_price') || error.message.includes('stock_by_size') || error.message.includes('schema cache'))) {
          console.warn('Supabase schema cache lacks optional columns, retrying baseline insert:', error.message);
          delete dbPayload.sale_price;
          delete dbPayload.stock_by_size;
          const { error: retryErr } = await supabase.from('products').insert(dbPayload).select().single();
          if (retryErr) {
            console.error('Supabase retry insert error:', retryErr);
          }
        } else {
          console.error('Supabase save new product error:', error);
        }
      }
    } catch (e: any) {
      console.warn('Supabase insert exception, proceeding with local persistence:', e?.message || e);
    }
  }

  // 2. Persist to local JSON file
  try {
    const list = ensureProductsFileExists();
    const existingIndex = list.findIndex((p) => p.id === id);
    if (existingIndex !== -1) {
      list[existingIndex] = newProduct;
    } else {
      list.unshift(newProduct);
    }
    fs.writeFileSync(PRODUCTS_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving new product to JSON file:', e);
  }

  return newProduct;
}

export async function updateProductInStore(id: string, updates: Partial<Product>): Promise<Product | null> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  if (updates.sizes) {
    updates.sizes = updates.sizes.filter(sz => sz !== 'S');
  }
  let stockBySize = updates.stock_by_size;
  if (stockBySize) {
    stockBySize = { ...stockBySize };
    delete stockBySize['S'];
  }

  // Construct dbPayload with ONLY valid columns of the Supabase products table
  const dbPayload: any = {
    updated_at: now,
  };

  if (updates.name !== undefined && typeof updates.name === 'string') {
    dbPayload.name = updates.name.trim();
  }

  if (updates.slug !== undefined && typeof updates.slug === 'string' && updates.slug.trim()) {
    dbPayload.slug = createSlug(updates.slug, id);
  } else if (updates.name !== undefined && typeof updates.name === 'string' && updates.name.trim()) {
    dbPayload.slug = createSlug(updates.name, id);
  }

  if (updates.description !== undefined) {
    dbPayload.description = (updates.description || '').trim();
  }

  if (updates.price !== undefined) {
    dbPayload.price = Number(updates.price);
  }

  if (updates.mrp !== undefined) {
    dbPayload.mrp = Number(updates.mrp);
  }

  if (updates.sale_price !== undefined) {
    dbPayload.sale_price = updates.sale_price === null || (updates.sale_price as any) === '' ? null : Number(updates.sale_price);
  }

  if (updates.category !== undefined && typeof updates.category === 'string') {
    dbPayload.category = updates.category.trim();
  }

  if (updates.nation !== undefined) {
    dbPayload.nation = updates.nation ? String(updates.nation).trim() : null;
  }

  if (updates.front_img !== undefined) {
    dbPayload.front_img = formatImageUrl(updates.front_img);
  }

  if (updates.back_img !== undefined) {
    dbPayload.back_img = formatImageUrl(updates.back_img);
  }

  if (updates.sizes !== undefined && Array.isArray(updates.sizes)) {
    dbPayload.sizes = updates.sizes.filter(sz => sz !== 'S');
  }

  if (updates.is_active !== undefined) {
    dbPayload.is_active = Boolean(updates.is_active);
  }

  if (stockBySize) {
    dbPayload.stock_by_size = stockBySize;
    dbPayload.stock = calculateProductTotalStock(stockBySize);
    const metadata = `__stock_by_size:${JSON.stringify(stockBySize)}`;
    const existingImages = Array.isArray(updates.images) ? updates.images : [];
    const cleanImages = existingImages.filter(
      (img: any) => typeof img === 'string' && !img.startsWith('__stock_by_size:')
    );
    cleanImages.push(metadata);
    dbPayload.images = cleanImages;
  } else if (updates.stock !== undefined) {
    dbPayload.stock = Number(updates.stock);
  }

  // 1. Update in Supabase (Single Source of Truth)
  if (supabase) {
    try {
      const { error } = await supabase.from('products').update(dbPayload).eq('id', id);
      if (error) {
        console.error('Supabase update product error:', error);
        if (error.message && (error.message.includes('sale_price') || error.message.includes('stock_by_size') || error.message.includes('schema cache'))) {
          const retryPayload = { ...dbPayload };
          delete retryPayload.sale_price;
          delete retryPayload.stock_by_size;
          await supabase.from('products').update(retryPayload).eq('id', id);
        }
      }
    } catch (e) {
      console.error('Supabase update product exception:', e);
    }
  }

  // 2. Sync to local JSON file fallback
  try {
    const list = ensureProductsFileExists();
    const index = list.findIndex((p) => p.id === id);
    if (index !== -1) {
      list[index] = {
        ...list[index],
        ...dbPayload,
        stock_by_size: stockBySize || list[index].stock_by_size || DEFAULT_SIZE_STOCK,
        stock: dbPayload.stock !== undefined ? dbPayload.stock : calculateProductTotalStock(list[index].stock_by_size),
      };
      fs.writeFileSync(PRODUCTS_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error('Local update product error:', e);
  }

  // 3. Re-query and return the fresh, authoritative product row directly from Supabase DB
  return await getProductByIdFromStore(id);
}

export async function toggleProductActiveInStore(id: string, is_active: boolean): Promise<boolean> {
  return !!(await updateProductInStore(id, { is_active }));
}

export async function deductSizeStock(productId: string, size: string, quantity: number): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('deduct_product_stock_atomic', {
        p_product_id: productId,
        p_size: size,
        p_quantity: quantity,
      });

      if (!error && data) {
        if (data.success) {
          return { success: true };
        }
        return {
          success: false,
          message: data.error === 'Insufficient stock'
            ? `Sorry, Size ${size} is no longer available in the requested quantity (${quantity}).`
            : data.error || 'Failed to update stock',
        };
      }
    } catch (e) {
      console.error('Supabase RPC deduct stock error:', e);
    }
  }

  // Fallback for offline dev mode
  const product = await getProductByIdFromStore(productId);
  if (!product) {
    return { success: false, message: `Product ${productId} not found` };
  }

  const stockMap = { ...(product.stock_by_size || DEFAULT_SIZE_STOCK) };
  const currentSizeStock = Number(stockMap[size]) || 0;

  if (currentSizeStock < quantity) {
    return {
      success: false,
      message: `Sorry, Size ${size} is no longer available for ${product.name}.`,
    };
  }

  const updatedSizeStock = Math.max(0, currentSizeStock - quantity);
  stockMap[size] = updatedSizeStock;
  const newTotalStock = calculateProductTotalStock(stockMap);

  await updateProductInStore(productId, {
    stock_by_size: stockMap,
    stock: newTotalStock,
  });

  return { success: true };
}

export async function restoreSizeStock(productId: string, size: string, quantity: number): Promise<{ success: boolean }> {
  const supabase = createAdminClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('restore_product_stock_atomic', {
        p_product_id: productId,
        p_size: size,
        p_quantity: quantity,
      });
      if (!error && data?.success) {
        return { success: true };
      }
    } catch (e) {
      console.error('Supabase RPC restore stock error:', e);
    }
  }

  const product = await getProductByIdFromStore(productId);
  if (!product) return { success: false };

  const stockMap = { ...(product.stock_by_size || DEFAULT_SIZE_STOCK) };
  const currentSizeStock = Number(stockMap[size]) || 0;
  stockMap[size] = currentSizeStock + quantity;
  const newTotalStock = calculateProductTotalStock(stockMap);

  await updateProductInStore(productId, {
    stock_by_size: stockMap,
    stock: newTotalStock,
  });

  return { success: true };
}

export async function getProductBySlugFromStore(slug: string): Promise<Product | null> {
  const all = await getAllProductsFromStore(true);
  if (!slug) return null;

  const decoded = decodeURIComponent(slug).toLowerCase().trim();
  const rawTarget = slug.toLowerCase().trim();

  // 1. Direct ID or Slug match
  let found = all.find((p) => {
    const pSlug = (p.slug || '').toLowerCase().trim();
    const pId = (p.id || '').toLowerCase().trim();
    return pSlug === decoded || pId === decoded || pSlug === rawTarget || pId === rawTarget;
  });

  // 2. Generated slug match from current name
  if (!found) {
    found = all.find((p) => {
      const generated = createSlug(p.name, p.id);
      return generated === decoded || generated === rawTarget;
    });
  }

  // 3. Product ID partial match fallback (safely handles legacy URL redirects)
  if (!found) {
    found = all.find((p) => {
      const pId = (p.id || '').toLowerCase().trim();
      return pId && (decoded.includes(pId) || rawTarget.includes(pId));
    });
  }

  return found || null;
}
