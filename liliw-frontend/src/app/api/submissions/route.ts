import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import { sendContactNotification } from '@/lib/email';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, message, type } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Primary: Supabase
    const { error } = await supabaseServer
      .from('community_submissions')
      .insert({ name, email, phone: phone || '', message, type: type || 'feedback', status: 'new' });

    if (error) {
      logger.error('[submissions POST]', `${error.code}: ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Email notification to admin (fire-and-forget)
    sendContactNotification({ name, email, phone, type: type || 'feedback', message })
      .catch(err => logger.error('[Email] contact notification:', err));

    return NextResponse.json({ success: true, message: 'Thank you for your submission! We will be in touch shortly.' });
  } catch (err) {
    logger.error('Submission error:', err);
    return NextResponse.json({ error: 'Failed to process submission' }, { status: 500 });
  }
}
