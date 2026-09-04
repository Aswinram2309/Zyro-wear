import { Metadata } from 'next';
import { getProductBySlugFromStore } from '@/database/stores/products-store';
import { notFound } from 'next/navigation';
import ProductDetailsClient from '@/frontend/components/ProductDetailsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlugFromStore(params.slug);
  if (!product) {
    return {
      title: 'Product Not Found — ZYRO WEAR',
    };
  }
  return {
    title: `${product.name} — ZYRO WEAR`,
    description: product.description || `Buy ${product.name} football jersey at ZYRO WEAR. Premium quality, best price.`,
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlugFromStore(params.slug);
  
  if (!product || product.is_active === false) {
    notFound();
  }

  return <ProductDetailsClient initialProduct={product} />;
}
