import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  outputFileTracingIncludes: {
    '*': ['public/**/*', '.next/static/**/*', '.env'],
  },
  serverExternalPackages: ['electron'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config: Configuration, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      // Exclude test utilities from client-side bundles
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        './models.test': false,
        './models.test.js': false,
      };
    }
    return config;
  },
};

// Add standalone output for next-electron-rsc in production builds
if (process.env.NODE_ENV !== 'development') {
  nextConfig.output = 'standalone';
}

export default nextConfig;
