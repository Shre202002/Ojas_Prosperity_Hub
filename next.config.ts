import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Image CDN is served from our own domain, so the storage vendor never shows in page URLs.
  async rewrites() {
    return [{ source: '/media/:path*', destination: 'https://ik.imagekit.io/ari07rsa2/:path*' }];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // Product photos uploaded from the admin panel
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
