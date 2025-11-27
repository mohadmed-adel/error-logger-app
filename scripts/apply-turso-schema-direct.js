#!/usr/bin/env node

/**
 * Apply Prisma schema directly to Turso using libSQL client
 * This bypasses Prisma CLI which doesn't support libsql:// URLs
 * 
 * Usage:
 *   DATABASE_URL="libsql://..." node scripts/apply-turso-schema-direct.js
 */

const databaseUrl = process.env.DATABASE_URL || '';

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('Usage: DATABASE_URL="libsql://..." node scripts/apply-turso-schema-direct.js');
  process.exit(1);
}

if (!databaseUrl.startsWith('libsql://')) {
  console.error('❌ This script is for Turso databases only (libsql:// URLs)');
  console.error('For file-based SQLite, use: npm run db:migrate');
  process.exit(1);
}

console.log('Applying Prisma schema directly to Turso database...');
console.log('Database URL:', databaseUrl.replace(/authToken=[^&]+/, 'authToken=***'));

// Parse the URL
const url = new URL(databaseUrl);
const authToken = url.searchParams.get('authToken');
const dbUrl = `${url.protocol}//${url.host}${url.pathname}`;

const { createClient } = require('@libsql/client');

async function applySchema() {
  const client = createClient({
    url: dbUrl,
    authToken: authToken || undefined,
  });

  try {
    console.log('\n1. Checking existing tables...');
    const tables = await client.execute('SELECT name FROM sqlite_master WHERE type="table"');
    const existingTables = tables.rows.map(row => row.name);
    console.log('Existing tables:', existingTables.length > 0 ? existingTables.join(', ') : 'none');

    console.log('\n2. Applying schema...');

    // Apply the latest migration schema
    // Execute statements in order: tables first, then indexes
    
    // Step 1: Create User table
    console.log('  Creating User table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ User table created');

    // Step 2: Create Error table
    console.log('  Creating Error table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "Error" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "message" TEXT NOT NULL,
        "stack" TEXT,
        "level" TEXT NOT NULL DEFAULT 'error',
        "metadata" TEXT,
        "serverUrl" TEXT,
        "userId" TEXT NOT NULL,
        "userSecretKey" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ Error table created');

    // Step 3: Create indexes (after tables exist)
    console.log('  Creating indexes...');
    try {
      await client.execute('CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")');
      console.log('  ✓ User email index created');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.warn('  ⚠ User email index:', error.message);
      }
    }

    try {
      await client.execute('CREATE INDEX IF NOT EXISTS "Error_userId_idx" ON "Error"("userId")');
      console.log('  ✓ Error userId index created');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.warn('  ⚠ Error userId index:', error.message);
      }
    }

    try {
      await client.execute('CREATE INDEX IF NOT EXISTS "Error_createdAt_idx" ON "Error"("createdAt")');
      console.log('  ✓ Error createdAt index created');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.warn('  ⚠ Error createdAt index:', error.message);
      }
    }

    try {
      await client.execute('CREATE INDEX IF NOT EXISTS "Error_serverUrl_idx" ON "Error"("serverUrl")');
      console.log('  ✓ Error serverUrl index created');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.warn('  ⚠ Error serverUrl index:', error.message);
      }
    }

    // Check if we need to add serverUrl and userSecretKey columns to existing Error table
    if (existingTables.includes('Error')) {
      try {
        // Try to add serverUrl column if it doesn't exist
        await client.execute('ALTER TABLE "Error" ADD COLUMN "serverUrl" TEXT');
        console.log('✓ Added serverUrl column to Error table');
      } catch (error) {
        // Column might already exist, ignore
      }

      try {
        // Try to add userSecretKey column if it doesn't exist
        await client.execute('ALTER TABLE "Error" ADD COLUMN "userSecretKey" TEXT');
        console.log('✓ Added userSecretKey column to Error table');
      } catch (error) {
        // Column might already exist, ignore
      }
    }

    console.log('\n✅ Schema applied successfully to Turso!');
    console.log('\nYou can now test your API endpoints.');

    await client.close();
  } catch (error) {
    console.error('\n❌ Failed to apply schema:', error.message);
    console.error(error);
    await client.close();
    process.exit(1);
  }
}

applySchema();

