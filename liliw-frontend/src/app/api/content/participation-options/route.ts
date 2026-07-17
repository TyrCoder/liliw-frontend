import { NextResponse } from 'next/server';

// participation-options was Strapi-only. Return empty so pages degrade gracefully.
export async function GET() {
  return NextResponse.json({ data: [] }, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
  });
}
