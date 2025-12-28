import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// GET - Get all errors (Public - no authentication required)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get('level');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const serverUrl = searchParams.get('serverUrl');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (level && ['error', 'warning', 'info'].includes(level)) {
      where.level = level;
    }

    if (serverUrl) {
      where.serverUrl = serverUrl;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the entire end date
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    const [errors, total] = await Promise.all([
      prisma.error.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.error.count({ where }),
    ]);

    return NextResponse.json({
      errors,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching errors:', error);
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = error?.message || 'Unknown error';
    const errorName = error?.name || 'Error';
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: isDevelopment ? errorMessage : 'An error occurred while fetching errors',
        type: errorName,
        ...(isDevelopment && error?.stack && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}

// POST - Create a new error log (Public endpoint - no authentication required)
// userId is required - accepts any string value
// userSecretKey is optional - stored directly on the error
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const { message, stack, level = 'error', metadata, serverUrl, userSecretKey, userId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (level && !['error', 'warning', 'info'].includes(level)) {
      return NextResponse.json(
        { error: 'Level must be error, warning, or info' },
        { status: 400 }
      );
    }

    // Create error log with userSecretKey stored directly on the error
    // @ts-ignore - Prisma client types may be stale
    const error = await prisma.error.create({
      data: {
        message,
        stack: stack || null,
        level,
        metadata: metadata ? JSON.stringify(metadata) : null,
        // @ts-ignore - serverUrl field exists in schema
        serverUrl: serverUrl || null,
        userSecretKey: userSecretKey || null,
        userId: String(userId), // Ensure userId is a string
      },
    });

    return NextResponse.json(error, { status: 201 });
  } catch (error: any) {
    console.error('Error creating error log:', error);
    
    // Return detailed error information for debugging
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Extract error information
    const errorMessage = error?.message || 'Unknown error';
    const errorName = error?.name || 'Error';
    const errorCode = error?.code || error?.errorCode;
    
    // For Prisma errors, provide more context
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { 
          error: 'Database constraint violation',
          details: isDevelopment ? errorMessage : 'A record with this value already exists',
          code: errorCode
        },
        { status: 409 }
      );
    }
    
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { 
          error: 'Record not found',
          details: isDevelopment ? errorMessage : 'The requested record does not exist',
          code: errorCode
        },
        { status: 404 }
      );
    }
    
    // Handle Prisma connection errors
    if (error?.name === 'PrismaClientInitializationError' || error?.code === 'P1001') {
      return NextResponse.json(
        { 
          error: 'Database connection error',
          message: isDevelopment ? errorMessage : 'Unable to connect to the database. Please check your database configuration.',
          type: errorName,
          code: errorCode
        },
        { status: 503 }
      );
    }
    
    // Handle Prisma validation errors and unknown errors
    if (error?.code?.startsWith('P1') || error?.name?.includes('Prisma') || errorName === 'PrismaClientUnknownRequestError') {
      // For PrismaClientUnknownRequestError, try to extract more details
      const cause = error?.cause || error?.meta || error?.clientVersion;
      const fullError = error?.message || errorMessage;
      
      // Check if it's a schema/table issue
      if (fullError?.includes('no such table') || fullError?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database schema error',
            message: 'Database tables are missing. Please run migrations: npm run db:migrate:deploy',
            type: errorName,
            code: errorCode,
            details: isDevelopment ? fullError : undefined
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Database error',
          message: isDevelopment ? fullError : 'A database error occurred. Check database connection and schema.',
          type: errorName,
          code: errorCode,
          cause: isDevelopment ? cause : undefined,
          // Include the full error message in production for debugging
          fullMessage: fullError
        },
        { status: 500 }
      );
    }
    
    // Return detailed error in development, sanitized in production
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: isDevelopment ? errorMessage : 'An error occurred while creating the error log',
        type: errorName,
        code: isDevelopment ? errorCode : undefined,
        // Include stack trace only in development
        ...(isDevelopment && error?.stack && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific error by ID (Public endpoint - no authentication required)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Error ID is required' },
        { status: 400 }
      );
    }

    // Check if error exists
    const error = await prisma.error.findUnique({
      where: { id },
    });

    if (!error) {
      return NextResponse.json(
        { error: 'Error not found' },
        { status: 404 }
      );
    }

    // Delete the error
    await prisma.error.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: 'Error deleted successfully',
      deletedId: id 
    });
  } catch (error: any) {
    console.error('Error deleting error:', error);
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = error?.message || 'Unknown error';
    const errorName = error?.name || 'Error';
    
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { 
          error: 'Error not found',
          message: 'The error you are trying to delete does not exist'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: isDevelopment ? errorMessage : 'An error occurred while deleting the error',
        type: errorName,
        ...(isDevelopment && error?.stack && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}
