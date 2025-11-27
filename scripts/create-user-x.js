#!/usr/bin/env node

/**
 * Create user with email "x" and password "x123456" in Turso database
 * 
 * Usage:
 *   DATABASE_URL="libsql://..." node scripts/create-user-x.js
 */

const databaseUrl = process.env.DATABASE_URL || '';

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('Usage: DATABASE_URL="libsql://..." node scripts/create-user-x.js');
  process.exit(1);
}

const bcrypt = require('bcryptjs');
const { createClient } = require('@libsql/client');

// Parse the URL
const url = new URL(databaseUrl);
const authToken = url.searchParams.get('authToken');
const dbUrl = `${url.protocol}//${url.host}${url.pathname}`;

async function createUser() {
  const client = createClient({
    url: dbUrl,
    authToken: authToken || undefined,
  });

  try {
    const email = 'x@e.com';
    const password = 'x123456';
    
    console.log('Creating user with email "x@e.com" and password "x123456"...');
    
    // Check if user already exists
    const existingUser = await client.execute({
      sql: 'SELECT id, email FROM "User" WHERE email = ?',
      args: [email],
    });

    if (existingUser.rows.length > 0) {
      console.log('✅ User already exists with email:', email);
      console.log('Updating password...');
      
      // Update password
      const hashedPassword = await bcrypt.hash(password, 10);
      await client.execute({
        sql: 'UPDATE "User" SET password = ? WHERE email = ?',
        args: [hashedPassword, email],
      });
      
      console.log('✅ Password updated successfully!');
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await client.execute({
        sql: 'INSERT INTO "User" (id, email, password, name, "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?)',
        args: [userId, email, hashedPassword, 'User X', new Date().toISOString(), new Date().toISOString()],
      });
      
      console.log('✅ User created successfully!');
      console.log('📧 Email: x@e.com');
      console.log('🔑 Password: x123456');
    }

    await client.close();
  } catch (error) {
    console.error('\n❌ Failed to create user:', error.message);
    console.error(error);
    await client.close();
    process.exit(1);
  }
}

createUser();

