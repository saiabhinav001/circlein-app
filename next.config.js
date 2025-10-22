/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  reactStrictMode: true,
  swcMinify: true,
  
  // Suppress all warnings
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // TypeScript and ESLint - ignore errors in production build
  typescript: {
    ignoreBuildErrors: false, // Keep type checking
  },
  eslint: {
    ignoreDuringBuilds: true, // Suppress ESLint warnings
  },
  
  // Experimental features to suppress warnings
  experimental: {
    logging: {
      level: 'error', // Only show errors, not warnings
    },
  },
  
  // Webpack configuration to suppress warnings
  webpack: (config, { isServer }) => {
    config.infrastructureLogging = {
      level: 'error',
    };
    config.stats = 'errors-only';
    return config;
  },
  
  // Security headers
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()'
        }
      ],
    },
  ],
  
  // Image optimization
  images: {
    domains: ['lh3.googleusercontent.com', 'images.pexels.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Build optimizations
  poweredByHeader: false,
  compress: true,
  
  // Only for development - remove in production
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
