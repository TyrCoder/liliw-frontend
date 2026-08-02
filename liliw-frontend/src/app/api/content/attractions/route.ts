import { NextResponse } from 'next/server';
import { getAllAttractions } from '@/lib/content';

// This route used to carry its own copy of the cms_attractions → API mapping,
// duplicating getAllAttractions() in lib/content.ts. Two copies meant a field
// added for one consumer silently missed the other: `features` and the visitor
// info fields were added to lib/content.ts and reached the AI chat and trip
// planner, while the public pages — which read this route — kept serving the
// old shape. The review-derived star rating had the same problem.
//
// It now delegates, so there is one mapping and both paths stay in step.
export async function GET() {
  try {
    const data = await getAllAttractions();
    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
