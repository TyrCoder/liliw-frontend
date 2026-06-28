import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    const { full_name, email, phone, type, message } = await req.json();

    if (!full_name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Primary: save to Supabase (always reliable)
    const { error: sbError } = await supabaseServer
      .from('participation_requests')
      .insert({
        full_name,
        email,
        phone: phone || '',
        type: type || 'feedback',
        message: message || '',
      });

    if (sbError) {
      console.error('[participation-request] Supabase error:', sbError.code, sbError.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('participation-request route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
