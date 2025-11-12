import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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
  } catch (error) {
    console.error('Error fetching errors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new error log (Public endpoint - no authentication required)
// userSecretKey is optional - stored directly on the error
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, stack, level = 'error', metadata, serverUrl, userSecretKey } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (level && !['error', 'warning', 'info'].includes(level)) {
      return NextResponse.json(
        { error: 'Level must be error, warning, or info' },
        { status: 400 }
      );
    }

    // Find or create an anonymous system user for userId
    let anonymousUser = await prisma.user.findFirst({
      where: { email: 'anonymous@system.local' },
      select: { id: true },
    });

    if (!anonymousUser) {
      // Create anonymous user if it doesn't exist
      anonymousUser = await prisma.user.create({
        data: {
          email: 'anonymous@system.local',
          password: await bcrypt.hash('system-user-' + Date.now(), 10),
          name: 'Anonymous System User',
        },
        select: { id: true },
      });
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
        userId: anonymousUser.id,
      },
    });

    return NextResponse.json(error, { status: 201 });
  } catch (error) {
    console.error('Error creating error log:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
