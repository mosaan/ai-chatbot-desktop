import type { NextConfig } from 'next';

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
};

// Add standalone output for next-electron-rsc in production builds
if (process.env.NODE_ENV !== 'development') {
  nextConfig.output = 'standalone';
}

export default nextConfig;
