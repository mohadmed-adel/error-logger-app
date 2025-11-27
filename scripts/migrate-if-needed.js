#!/usr/bin/env node

/**
 * Conditionally run Prisma migrations
 * - For file-based SQLite (file:./...): Run migrations
 * - For Turso/libSQL (libsql://...): Skip (migrations should be run separately)
 */

const databaseUrl = process.env.DATABASE_URL || '';

if (databaseUrl.startsWith('file:')) {
  // File-based SQLite - run migrations
  console.log('Detected file-based SQLite database, running migrations...');
  const { execSync } = require('child_process');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✓ Migrations completed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
} else if (databaseUrl.startsWith('libsql://')) {
  // Turso/libSQL - Prisma CLI doesn't support libsql:// URLs during build
  // The CLI validation fails before it can use the adapter
  // Schema must be applied manually using the apply-turso-schema.js script
  console.log('Detected Turso/libSQL database.');
  console.log('⚠️  Note: Prisma CLI tools do not support libsql:// URLs during build.');
  console.log('Schema must be applied manually before deployment.');
  console.log('');
  console.log('To apply schema to Turso, run locally:');
  console.log('  DATABASE_URL="your-turso-url" npm run db:push:turso');
  console.log('');
  console.log('Or use:');
  console.log('  DATABASE_URL="your-turso-url" node scripts/apply-turso-schema.js');
  console.log('');
  console.log('Continuing with build (ensure schema is applied separately)...');
  // Don't fail the build - schema application is a manual step for Turso
} else {
  // Unknown database type - warn but continue
  console.warn('⚠ Unknown DATABASE_URL format, skipping migrations.');
  console.warn('DATABASE_URL should start with "file:" or "libsql://"');
}

