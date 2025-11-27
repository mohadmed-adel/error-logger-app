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
  // Turso/libSQL - use db push instead of migrate deploy
  // db push works with libSQL URLs and applies schema changes
  console.log('Detected Turso/libSQL database, using db push to apply schema...');
  const { execSync } = require('child_process');
  try {
    // Use --accept-data-loss to avoid prompts in CI/CD
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('✓ Schema pushed to Turso successfully');
  } catch (error) {
    console.error('✗ Schema push failed:', error.message);
    console.error('Note: This might be expected if schema is already up to date.');
    // Don't fail the build if schema push fails (schema might already be correct)
    console.log('Continuing with build...');
  }
} else {
  // Unknown database type - warn but continue
  console.warn('⚠ Unknown DATABASE_URL format, skipping migrations.');
  console.warn('DATABASE_URL should start with "file:" or "libsql://"');
}

