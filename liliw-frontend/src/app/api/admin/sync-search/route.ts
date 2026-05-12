import { NextRequest, NextResponse } from 'next/server';
import { syncAlgolia } from '@/lib/syncAlgolia';

export async function POST(req: NextRequest) {
  try {
    const synced = await syncAlgolia();
    return NextResponse.json({ synced });
  } catch (error: any) {
    console.error('Algolia sync error:', error);
    return NextResponse.json({ error: error?.message ?? 'Sync failed' }, { status: 500 });
  }
}
