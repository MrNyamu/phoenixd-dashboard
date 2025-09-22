import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Enable server-side rendering optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },

  // Turbopack configuration
  turbopack: {
    resolveAlias: {
      '@vercel/turbopack-next/internal/font/google/font': 'next/dist/compiled/@next/font/dist/google/index.js',
    },
  },

  // Environment variable configuration
  env: {
    NEXT_PUBLIC_PHOENIXD_URL: process.env.NEXT_PUBLIC_PHOENIXD_URL,
    NEXT_PUBLIC_PHOENIXD_PASSWORD: process.env.NEXT_PUBLIC_PHOENIXD_PASSWORD,
    NEXT_PUBLIC_PHOENIX_NETWORK: process.env.NEXT_PUBLIC_PHOENIX_NETWORK,
  },

  // Image optimization
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Webpack configuration for better bundle optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
