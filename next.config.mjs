/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/shop',
        destination: '/#shop',
        permanent: true,
      },
      {
        source: '/about',
        destination: '/#about',
        permanent: true,
      },
      {
        source: '/reviews',
        destination: '/#reviews',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
