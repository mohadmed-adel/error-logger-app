import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE - Clear ALL errors (requires authentication)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete ALL errors (not just the authenticated user's)
    const result = await prisma.error.deleteMany({});

    return NextResponse.json({
      message: 'All errors cleared successfully',
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Error clearing all errors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

