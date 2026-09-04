import { MetadataRoute } from 'next';
import { INITIAL_PRODUCTS } from '@/database/seed/products-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://zyrowearonline.in';

  const productRoutes = INITIAL_PRODUCTS.map((product) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    ...productRoutes,
  ];
}
