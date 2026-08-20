import fs from 'fs';
import path from 'path';
import { createAdminClient } from './supabase/admin';
import { INITIAL_PRODUCTS } from './products-data';
import { Product } from '@/types';
import { formatImageUrl } from './stock-config';

const PRODUCTS_FILE_PATH = path.join(process.cwd(), 'data', 'products.json');

const DEFAULT_SIZE_STOCK: Record<string, number> = {
  S: 10,
  M: 15,
  L: 15,
  XL: 10,
  XXL: 5,
};

function ensureProductsFileExists(): Product[] {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(PRODUCTS_FILE_PATH)) {
    const formattedInitial = INITIAL_PRODUCTS.map((p) => ({
      ...p,
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
        if (p.id === 'por-home-7' && !p.front_img.includes('Ronaldo_7_front')) {
          needsRewrite = true;
          return {
            ...p,
            front_img: '/ZYRO_Wear_Studio_Imgs/Portugal_Home_Ronaldo_7_front.png',
            back_img: '/ZYRO_Wear_Studio_Imgs/Portugal_Home_Ronaldo_7_Back.png',
          };
        }
        if (p.id === 'esp-home-19' && !p.front_img.includes('Lamine_Yamal_19_front')) {
          needsRewrite = true;
          return {
            ...p,
            front_img: '/ZYRO_Wear_Studio_Imgs/Spain_Home_Lamine_Yamal_19_front.png',
            back_img: '/ZYRO_Wear_Studio_Imgs/Spain_Home_Lamine_Yamal_19_Back.png',
          };
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

const KNOWN_IMAGE_FIXES: Record<string, { front_img: string; back_img: string }> = {
  'por-home-7': {
    front_img: '/ZYRO_Wear_Studio_Imgs/Portugal_Home_Ronaldo_7_front.png',
    back_img: '/ZYRO_Wear_Studio_Imgs/Portugal_Home_Ronaldo_7_Back.png',
  },
  'esp-home-19': {
    front_img: '/ZYRO_Wear_Studio_Imgs/Spain_Home_Lamine_Yamal_19_front.png',
    back_img: '/ZYRO_Wear_Studio_Imgs/Spain_Home_Lamine_Yamal_19_Back.png',
  },
};

export async function getAllProductsFromStore(includeInactive: boolean = false): Promise<Product[]> {
  const supabase = createAdminClient();
  const localMap = new Map(ensureProductsFileExists().map((lp) => [lp.id, lp]));

  if (supabase) {
    try {
      const { data: dbProducts, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch products error details:', error);
      }

      if (!error && dbProducts && dbProducts.length > 0) {
        return dbProducts
          .filter((p) => includeInactive || p.is_active !== false)
          .map((p) => {
            const localItem = localMap.get(p.id);
            let stockBySize: Record<string, number> | null = null;

            // 1. Try parsing metadata from images array
            if (Array.isArray(p.images)) {
              const metaStr = p.images.find(
                (img: any) => typeof img === 'string' && img.startsWith('__stock_by_size:')
              );
              if (metaStr) {
                try {
                  stockBySize = JSON.parse(metaStr.replace('__stock_by_size:', ''));
                } catch (e) {}
              }
            }

            // 2. Fallback to localItem if available, but only if its sum matches database stock or if database stock is not explicitly set
            if (!stockBySize && localItem?.stock_by_size) {
              const localSum = Object.values(localItem.stock_by_size).reduce((sum, v) => sum + v, 0);
              if (localSum === p.stock || p.stock === undefined) {
                stockBySize = localItem.stock_by_size;
              }
            }

            // 3. If still not set, distribute database stock (p.stock) across active sizes
            if (!stockBySize) {
              const sizes = (p.sizes && p.sizes.length > 0 ? p.sizes : ['M', 'L', 'XL', 'XXL']).filter((s: string) => s !== 'S');
              stockBySize = {};
              sizes.forEach((s: string) => {
                stockBySize![s] = 0;
              });
              
              const total = p.stock !== undefined ? p.stock : 0;
              if (total > 0) {
                let remaining = total;
                let i = 0;
                while (remaining > 0) {
                  const sz = sizes[i % sizes.length];
                  stockBySize[sz] = (stockBySize[sz] || 0) + 1;
                  remaining--;
                  i++;
                }
              }
            }

            if (stockBySize) {
              delete stockBySize['S'];
            }

            const filteredSizes = (p.sizes || []).filter((s: string) => s !== 'S');
            const sanitizedSizes = filteredSizes.length > 0 ? filteredSizes : ['M', 'L', 'XL', 'XXL'];
            const totalStock = calculateProductTotalStock(stockBySize, p.stock || 0);

          let rawFront = p.front_img;
          let rawBack = p.back_img;

          if (KNOWN_IMAGE_FIXES[p.id]) {
            const fix = KNOWN_IMAGE_FIXES[p.id];
            if (!rawFront || rawFront.includes('Portugal_Home_Front') || rawFront.includes('Spain_Home_Front') || rawFront.includes('\\')) {
              rawFront = fix.front_img;
              rawBack = fix.back_img;
              Promise.resolve(
                supabase.from('products').update({
                  front_img: fix.front_img,
                  back_img: fix.back_img,
                }).eq('id', p.id)
              ).catch(() => {});
            }
          }

          const front_img = formatImageUrl(rawFront);
          const back_img = formatImageUrl(rawBack);

          return {
            ...p,
            sizes: sanitizedSizes,
            front_img,
            back_img,
            images: [front_img, back_img],
            stock_by_size: stockBySize,
            stock: totalStock,
            is_active: p.is_active ?? true,
          };
        });
      }
    } catch (e) {
      console.error('Supabase fetch products error, falling back to JSON file:', e);
    }
  }

  // Fallback to local JSON store
  const localProducts = ensureProductsFileExists();
  return localProducts
    .filter((p) => includeInactive || p.is_active !== false)
    .map((p) => {
      const stockBySize = { ...(p.stock_by_size || DEFAULT_SIZE_STOCK) };
      delete stockBySize['S'];
      const filteredSizes = (p.sizes || []).filter((s: string) => s !== 'S');
      const sanitizedSizes = filteredSizes.length > 0 ? filteredSizes : ['M', 'L', 'XL', 'XXL'];
      const totalStock = calculateProductTotalStock(stockBySize, p.stock || 0);
      const front_img = formatImageUrl(p.front_img);
      const back_img = formatImageUrl(p.back_img);
      return {
        ...p,
        sizes: sanitizedSizes,
        front_img,
        back_img,
        images: [front_img, back_img],
        stock_by_size: stockBySize,
        stock: totalStock,
        is_active: p.is_active ?? true,
      };
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

  const newProduct: Product = {
    id,
    name: productPayload.name || 'Untitled Product',
    slug: productPayload.slug || (productPayload.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: productPayload.description || '',
    price: Number(productPayload.price) || 0,
    mrp: Number(productPayload.mrp) || Number(productPayload.price) || 0,
    sale_price: productPayload.sale_price !== undefined ? (productPayload.sale_price === null ? null : Number(productPayload.sale_price)) : null,
    category: productPayload.category || 'star',
    nation: productPayload.nation || undefined,
    front_img: formatImageUrl(productPayload.front_img),
    back_img: formatImageUrl(productPayload.back_img),
    images: [formatImageUrl(productPayload.front_img), formatImageUrl(productPayload.back_img)].filter(Boolean),
    sizes: availableSizes,
    stock: totalStock,
    stock_by_size: stockBySize,
    is_active: productPayload.is_active !== undefined ? productPayload.is_active : true,
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
        // If error is caused by missing sale_price or stock_by_size column in Supabase schema cache, retry without optional columns
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
    list.unshift(newProduct);
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
  let totalStock: number | undefined;

  const payloadToUpdate: any = {
    ...updates,
    updated_at: now,
  };

  if (stockBySize) {
    totalStock = calculateProductTotalStock(stockBySize);
    const metadata = `__stock_by_size:${JSON.stringify(stockBySize)}`;
    const existingImages = Array.isArray(updates.images) ? updates.images : [];
    const cleanImages = existingImages.filter(
      (img: any) => typeof img === 'string' && !img.startsWith('__stock_by_size:')
    );
    cleanImages.push(metadata);
    payloadToUpdate.images = cleanImages;
  }

  if (payloadToUpdate.front_img) {
    payloadToUpdate.front_img = formatImageUrl(payloadToUpdate.front_img);
  }
  if (payloadToUpdate.back_img) {
    payloadToUpdate.back_img = formatImageUrl(payloadToUpdate.back_img);
  }

  if (totalStock !== undefined) {
    payloadToUpdate.stock = totalStock;
  }

  // 1. Update in Supabase if available
  if (supabase) {
    try {
      const { error } = await supabase.from('products').update(payloadToUpdate).eq('id', id);
      if (error && error.message && (error.message.includes('sale_price') || error.message.includes('stock_by_size') || error.message.includes('schema cache'))) {
        const retryPayload = { ...payloadToUpdate };
        delete retryPayload.sale_price;
        delete retryPayload.stock_by_size;
        await supabase.from('products').update(retryPayload).eq('id', id);
      }
    } catch (e) {
      console.error('Supabase update product error:', e);
    }
  }

  // 2. Update in local JSON file
  let updatedProduct: Product | null = null;
  try {
    const list = ensureProductsFileExists();
    const index = list.findIndex((p) => p.id === id);
    if (index !== -1) {
      list[index] = {
        ...list[index],
        ...payloadToUpdate,
        stock_by_size: stockBySize || list[index].stock_by_size || DEFAULT_SIZE_STOCK,
        stock: totalStock !== undefined ? totalStock : calculateProductTotalStock(list[index].stock_by_size),
      };
      updatedProduct = list[index];
      fs.writeFileSync(PRODUCTS_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error('Local update product error:', e);
  }

  return updatedProduct || (await getProductByIdFromStore(id));
}

export async function toggleProductActiveInStore(id: string, is_active: boolean): Promise<boolean> {
  return !!(await updateProductInStore(id, { is_active }));
}

/**
 * Deducts size-wise stock for a product when order payment is verified.
 * Decrements ONLY the requested size quantity.
 */
export async function deductSizeStock(productId: string, size: string, quantity: number): Promise<{ success: boolean; message?: string }> {
  const product = await getProductByIdFromStore(productId);
  if (!product) {
    return { success: false, message: `Product ${productId} not found` };
  }

  const stockMap = { ...(product.stock_by_size || DEFAULT_SIZE_STOCK) };
  const currentSizeStock = Number(stockMap[size]) || 0;

  if (currentSizeStock < quantity) {
    return {
      success: false,
      message: `Insufficient stock for ${product.name} (Size: ${size}). Requested: ${quantity}, Available: ${currentSizeStock}`,
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

export async function getProductBySlugFromStore(slug: string): Promise<Product | null> {
  const all = await getAllProductsFromStore(true);
  return all.find((p) => p.slug === slug || p.id === slug) || null;
}

