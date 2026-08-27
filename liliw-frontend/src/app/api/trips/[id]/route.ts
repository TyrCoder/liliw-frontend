import { NextRequest, NextResponse } from 'next/server';
import { getSharedTrip } from '@/lib/shared-trip';

type Params = { params: Promise<{ id: string }> };

/**
 * Public, read-only JSON view of a shared saved trip. No auth: anyone with the
 * link can open it. Access is gated in getSharedTrip on is_public, so an
 * unshared or unknown trip is a plain 404 that reveals nothing.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const trip = await getSharedTrip(id);
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ trip });
}
