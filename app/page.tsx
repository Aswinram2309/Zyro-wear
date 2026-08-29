import { getAllProductsFromStore } from '@/lib/products-store';
import MainStore from '@/components/MainStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const initialProducts = await getAllProductsFromStore(false);
  return <MainStore initialProducts={initialProducts} />;
}
