import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyToken } from '@/lib/verifyToken';

export async function POST(req: NextRequest) {
  const authUser = await verifyToken(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { timestamp, folder } = await req.json();

  const ALLOWED_FOLDERS = ['liliw-virtual-tours', 'liliw-attractions', 'liliw-gallery'];
  if (!folder || !ALLOWED_FOLDERS.includes(folder)) {
    return NextResponse.json({ error: 'Invalid upload folder' }, { status: 400 });
  }

  const apiSecret = process.env.CLOUDINARY_SECRET;
  const apiKey = process.env.CLOUDINARY_KEY;
  const cloudName = process.env.CLOUDINARY_NAME;

  if (!apiSecret || !apiKey || !cloudName) {
    return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
  }

  // Parameters must be sorted alphabetically before signing
  const paramsString = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto.createHash('sha1').update(paramsString + apiSecret).digest('hex');

  return NextResponse.json({ signature, timestamp, api_key: apiKey, cloud_name: cloudName });
}
