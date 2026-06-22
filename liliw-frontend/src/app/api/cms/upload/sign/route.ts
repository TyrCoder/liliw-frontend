import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCmsRole } from '@/lib/cms-auth';

const ALLOWED_FOLDERS = ['liliw-cms'];

export async function POST(req: NextRequest) {
  const role = await getCmsRole(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role === 'officer') return NextResponse.json({ error: 'Officers cannot upload media' }, { status: 403 });

  const { timestamp, folder = 'liliw-cms' } = await req.json();
  if (!ALLOWED_FOLDERS.includes(folder)) {
    return NextResponse.json({ error: 'Invalid upload folder' }, { status: 400 });
  }
  if (!timestamp || typeof timestamp !== 'number') {
    return NextResponse.json({ error: 'timestamp is required' }, { status: 400 });
  }

  const apiSecret = process.env.CLOUDINARY_SECRET;
  const apiKey    = process.env.CLOUDINARY_KEY;
  const cloudName = process.env.CLOUDINARY_NAME;

  if (!apiSecret || !apiKey || !cloudName) {
    return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
  }

  const paramsString = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto.createHash('sha1').update(paramsString + apiSecret).digest('hex');

  return NextResponse.json({ signature, timestamp, api_key: apiKey, cloud_name: cloudName, folder });
}
