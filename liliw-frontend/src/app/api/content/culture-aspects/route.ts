import { NextResponse } from 'next/server';

// culture-aspects was a Strapi-only collection with no Supabase equivalent.
// Return empty so pages degrade gracefully.
export async function GET() {
  return NextResponse.json({ data: [] }, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
  });
}
