import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { syncAlgolia } from '@/lib/syncAlgolia';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const isAdmin = await requireAdminAuth(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const synced = await syncAlgolia();
    return NextResponse.json({ synced });
  } catch (error: any) {
    logger.error('Algolia sync error:', error);
    return NextResponse.json({ error: error?.message ?? 'Sync failed' }, { status: 500 });
  }
}
