import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, explainDbError } from '@/lib/supabase-server';
import { getCmsIdentity } from '@/lib/cms-auth';
import { sendSubmissionReply } from '@/lib/email';
import { logger } from '@/lib/logger';

type Params = { params: Promise<{ id: string }> };

/**
 * Sends a staff reply to whoever wrote in, and records that it happened.
 *
 * Answering the public is an admin and officer job — editors work on content
 * and are kept out of correspondence entirely.
 *
 * The reply row is written *after* the send is attempted and carries the
 * outcome, so a failed delivery shows in the thread as failed rather than
 * sitting there looking sent. Getting that backwards is how a visitor ends up
 * waiting on an answer nobody realises never left.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { role, email } = await getCmsIdentity(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role === 'editor') {
    return NextResponse.json({ error: 'Only an admin or officer can reply to messages' }, { status: 403 });
  }

  const { body, subject } = await req.json();
  if (!body?.trim()) {
    return NextResponse.json({ error: 'Write a message before sending' }, { status: 400 });
  }

  const { data: submission } = await supabaseServer
    .from('community_submissions')
    .select('*')
    .eq('id', id)
    .single();
  if (!submission) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

  const finalSubject = subject?.trim()
    || `Re: your ${submission.type || 'message'} to Liliw Tourism`;

  let delivered = false;
  let deliveryError: string | null = null;
  try {
    await sendSubmissionReply({
      to:              submission.email,
      name:            submission.name,
      subject:         finalSubject,
      body:            body.trim(),
      originalMessage: submission.message,
      sentBy:          email,
    });
    delivered = true;
  } catch (err) {
    deliveryError = err instanceof Error ? err.message : 'Send failed';
    logger.error('[submissions reply]', deliveryError);
  }

  const { data: reply, error } = await supabaseServer
    .from('submission_replies')
    .insert({
      submission_id:  id,
      body:           body.trim(),
      sent_by:        email,
      delivered,
      delivery_error: deliveryError,
    })
    .select()
    .single();

  if (error) {
    // The mail may well have gone out; say so rather than reporting a clean
    // failure that would invite someone to send the same reply twice.
    return NextResponse.json(
      { error: `${delivered ? 'The reply was sent but ' : ''}could not be recorded: ${explainDbError(error)}` },
      { status: 500 },
    );
  }

  // Only a delivered reply marks the thread answered.
  await supabaseServer
    .from('community_submissions')
    .update({
      status:     delivered ? 'replied' : submission.status,
      handled_by: email,
      handled_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (!delivered) {
    return NextResponse.json(
      { error: `The reply could not be emailed: ${deliveryError}`, reply },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true, reply });
}
