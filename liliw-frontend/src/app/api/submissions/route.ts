import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import { sendContactNotification } from '@/lib/email';
import { staffNotifyEmails } from '@/lib/staff-emails';

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

    // Notify every admin and officer, not just one address — the officers are
    // the ones who answer these, and previously none of them was told.
    // Fire-and-forget: the message is already stored, so a mail outage must not
    // turn a saved submission into an error for the person who sent it.
    staffNotifyEmails()
      .then(to => sendContactNotification({ name, email, phone, type: type || 'feedback', message, to }))
      .catch(err => logger.error('[Email] contact notification:', err));

    return NextResponse.json({ success: true, message: 'Thank you for your submission! We will be in touch shortly.' });
  } catch (err) {
    logger.error('Submission error:', err);
    return NextResponse.json({ error: 'Failed to process submission' }, { status: 500 });
  }
}
