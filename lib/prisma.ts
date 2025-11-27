import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure Prisma client
let prismaClient: PrismaClient;

// Determine which database to use:
// - Development: Use local SQLite file (file:./prisma/dev.db)
// - Production: Use Turso (libsql://) from DATABASE_URL
const isDevelopment = process.env.NODE_ENV === 'development';
const isServer = typeof window === 'undefined';
const databaseUrl = process.env.DATABASE_URL || '';
const useTurso = databaseUrl.startsWith('libsql://');

// Only use libSQL adapter on server-side
if (isServer && useTurso) {
  // Use Turso (libSQL adapter) - typically in production
  // Dynamically import the adapter to avoid bundling issues
  const { PrismaLibSql } = require('@prisma/adapter-libsql');
  
  // Use libSQL adapter for Turso
  const url = databaseUrl;
  const authToken = url.includes('authToken=') 
    ? url.split('authToken=')[1]?.split('&')[0] 
    : undefined;
  const dbUrl = url.split('?')[0];
  
  // Pass config directly to PrismaLibSql, not a client
  const adapter = new PrismaLibSql({
    url: dbUrl,
    authToken: authToken,
  });
  
  prismaClient = new PrismaClient({
    adapter,
    log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  });
} else {
  // Use standard Prisma client for file-based SQLite
  // In development, this uses file:./prisma/dev.db (or file:./dev.db)
  // In production, this would use whatever DATABASE_URL points to (if not libsql://)
  prismaClient = new PrismaClient({
    log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma =
  globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

