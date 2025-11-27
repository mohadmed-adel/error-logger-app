#!/usr/bin/env node

/**
 * Manually apply Prisma schema to Turso database
 * Run this script locally with your Turso DATABASE_URL to apply the schema
 * 
 * Usage:
 *   DATABASE_URL="libsql://..." node scripts/apply-turso-schema.js
 */

const databaseUrl = process.env.DATABASE_URL || '';

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('Usage: DATABASE_URL="libsql://..." node scripts/apply-turso-schema.js');
  process.exit(1);
}

if (!databaseUrl.startsWith('libsql://')) {
  console.error('❌ This script is for Turso databases only (libsql:// URLs)');
  console.error('For file-based SQLite, use: npm run db:migrate');
  process.exit(1);
}

console.log('Applying Prisma schema to Turso database...');
console.log('Database URL:', databaseUrl.replace(/authToken=[^&]+/, 'authToken=***'));

const { execSync } = require('child_process');

try {
  // First generate the Prisma client
  console.log('\n1. Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Then push the schema
  console.log('\n2. Pushing schema to Turso...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  
  console.log('\n✅ Schema applied successfully to Turso!');
  console.log('\nYou can now test your API endpoints.');
} catch (error) {
  console.error('\n❌ Failed to apply schema:', error.message);
  process.exit(1);
}

