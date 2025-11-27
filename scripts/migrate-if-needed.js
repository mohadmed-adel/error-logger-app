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
    // Use --accept-data-loss and --skip-generate to avoid prompts in CI/CD
    // --skip-generate because we already generated the client
    execSync('npx prisma db push --accept-data-loss --skip-generate', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl }
    });
    console.log('✓ Schema pushed to Turso successfully');
  } catch (error) {
    console.error('✗ Schema push failed!');
    console.error('Error details:', error.message);
    console.error('');
    console.error('⚠️  IMPORTANT: Your Turso database schema may not be up to date.');
    console.error('Please manually apply the schema by running:');
    console.error('  DATABASE_URL="your-turso-url" npx prisma db push --accept-data-loss');
    console.error('');
    console.error('Or use the Turso CLI to apply the schema from prisma/migrations/');
    // Fail the build so we know the schema wasn't applied
    process.exit(1);
  }
} else {
  // Unknown database type - warn but continue
  console.warn('⚠ Unknown DATABASE_URL format, skipping migrations.');
  console.warn('DATABASE_URL should start with "file:" or "libsql://"');
}

