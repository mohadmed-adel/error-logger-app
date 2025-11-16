import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow CORS for Flutter app connections
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  // Prevent auto-refresh by excluding database files from file watching
  webpack: (config, { isServer }) => {
    // Configure watchOptions for both client and server
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.next/**',
        '**/prisma/dev.db*',
        '**/prisma/*.db*',
        '**/prisma/*.db-journal',
        '**/prisma/migrations/**',
        '**/prisma/**/*.db',
        '**/prisma/**/*.db-journal',
      ],
    };
    return config;
  },
  // Configure onDemandEntries to reduce file watching
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
};

export default nextConfig;
