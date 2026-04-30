import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const { timestamp, folder } = await req.json();

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
