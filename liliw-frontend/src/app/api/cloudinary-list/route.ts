import { NextRequest, NextResponse } from 'next/server';
import { requireStaffAuth } from '@/lib/auth';

const ALLOWED_FOLDERS = ['liliw-cms', 'liliw-virtual-tours', 'liliw-attractions', 'liliw-gallery'];

export async function GET(req: NextRequest) {
  if (!await requireStaffAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const folder = searchParams.get('folder') || 'liliw-cms';
  const nextCursor = searchParams.get('next_cursor') || '';

  if (!ALLOWED_FOLDERS.includes(folder)) {
    return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
  }

  const cloudName = process.env.CLOUDINARY_NAME;
  const apiKey    = process.env.CLOUDINARY_KEY;
  const apiSecret = process.env.CLOUDINARY_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
  }

  const auth   = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const params = new URLSearchParams({
    prefix:       `${folder}/`,
    max_results:  '60',
    type:         'upload',
    direction:    '-1',
  });
  if (nextCursor) params.set('next_cursor', nextCursor);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?${params}`,
    { headers: { Authorization: `Basic ${auth}` } },
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Cloudinary error: ${err}` }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({
    resources: (data.resources ?? []).map((r: any) => ({
      public_id:  r.public_id,
      url:        r.secure_url,
      name:       (r.public_id as string).split('/').pop() ?? '',
      width:      r.width,
      height:     r.height,
      created_at: r.created_at,
      format:     r.format,
    })),
    next_cursor: data.next_cursor ?? null,
  });
}
