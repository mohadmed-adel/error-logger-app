import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Exclude packages from server-side bundling (they use native modules)
  serverExternalPackages: [
    '@prisma/adapter-libsql',
    '@libsql/client',
  ],
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
    
    // Ignore markdown files and other non-code files that webpack tries to parse
    const webpack = require('webpack');
    config.plugins = config.plugins || [];
    
    // Ignore README.md and other markdown files in node_modules
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.md$/,
        contextRegExp: /node_modules/,
      })
    );
    
    // Ignore native .node files (native addons) - these are loaded at runtime by Node.js
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.node$/,
      })
    );
    
    // Prevent webpack from trying to resolve .node files
    config.resolve = config.resolve || {};
    config.resolve.extensions = config.resolve.extensions || ['.js', '.jsx', '.ts', '.tsx'];
    // Don't add .node to extensions - let Node.js handle it at runtime
    
    // Prevent webpack from parsing markdown files
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/resource',
      generator: {
        emit: false,
      },
    });
    
    // Ignore .node files (native addons) - they should not be bundled
    // These are loaded at runtime by Node.js, not by webpack
    
    // Use module.noParse to prevent webpack from parsing certain files
    config.module.noParse = config.module.noParse || [];
    if (Array.isArray(config.module.noParse)) {
      config.module.noParse.push(/\.md$/, /\.node$/);
    } else if (config.module.noParse instanceof RegExp) {
      config.module.noParse = [config.module.noParse, /\.md$/, /\.node$/];
    } else {
      config.module.noParse = /\.md$|\.node$/;
    }
    
    // Externals for server-side only modules (client-side builds)
    if (!isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push({
          '@prisma/adapter-libsql': 'commonjs @prisma/adapter-libsql',
          '@libsql/client': 'commonjs @libsql/client',
        });
      } else if (typeof config.externals === 'object') {
        config.externals['@prisma/adapter-libsql'] = 'commonjs @prisma/adapter-libsql';
        config.externals['@libsql/client'] = 'commonjs @libsql/client';
      }
      
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@prisma/adapter-libsql': false,
        '@libsql/client': false,
      };
    }
    
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
