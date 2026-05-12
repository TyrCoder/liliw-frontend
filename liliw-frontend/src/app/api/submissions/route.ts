import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

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

    const { error } = await supabase
      .from('community_submissions')
      .insert({ name, email, phone: phone || '', message, type: type || 'feedback' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your submission! We will be in touch shortly.',
    });
  } catch (error) {
    logger.error('Submission error:', error);
    return NextResponse.json({ error: 'Failed to process submission' }, { status: 500 });
  }
}
