import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, explainDbError } from '@/lib/supabase-server';
import { getCmsIdentity } from '@/lib/cms-auth';
import { sendSubmissionReply } from '@/lib/email';
import { loadOne, setInboxState, replySubject, INBOX_SOURCES, InboxSource } from '@/lib/inbox';
import { logger } from '@/lib/logger';

type Params = { params: Promise<{ source: string; id: string }> };

const STATUSES = ['new', 'read', 'replied', 'closed'];

/** Answering the public is admin and officer work; editors write content. */
async function staffOnly(req: NextRequest) {
  const { role, email } = await getCmsIdentity(req);
  if (!role) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (role === 'editor') {
    return { error: NextResponse.json({ error: 'Only an admin or officer can manage messages' }, { status: 403 }) };
  }
  return { email };
}

/** Moves a message through the inbox — opened, dealt with, put away. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { source, id } = await params;
  if (!INBOX_SOURCES.includes(source as InboxSource)) {
    return NextResponse.json({ error: 'Unknown message source' }, { status: 400 });
  }

  const gate = await staffOnly(req);
  if (gate.error) return gate.error;

  const { status } = await req.json();
  if (!STATUSES.includes(status)) return NextResponse.json({ error: 'Unknown status' }, { status: 400 });

  const { error } = await setInboxState(
    source as InboxSource, id, status,
    status === 'read' ? null : gate.email!,
  );
  if (error) return NextResponse.json({ error: explainDbError(error) }, { status: 500 });

  return NextResponse.json({ success: true });
}

/**
 * Sends a staff reply to whoever wrote in, and records that it happened.
 *
 * The reply row is written *after* the send is attempted and carries the
 * outcome, so a failed delivery shows in the thread as failed rather than
 * sitting there looking sent.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { source, id } = await params;
  if (!INBOX_SOURCES.includes(source as InboxSource)) {
    return NextResponse.json({ error: 'Unknown message source' }, { status: 400 });
  }

  const gate = await staffOnly(req);
  if (gate.error) return gate.error;

  const { body, subject } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: 'Write a message before sending' }, { status: 400 });

  const message = await loadOne(source as InboxSource, id);
  if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  if (!message.email) {
    return NextResponse.json({ error: 'This message has no email address to reply to' }, { status: 400 });
  }

  // An event response has answers rather than a message, so the quoted block
  // is built from them — replying with an empty quote would read as a mistake.
  const quoted = message.message
    || message.details.map(d => `${d.label}: ${d.value}`).join('\n')
    || '(no message body)';

  let delivered = false;
  let deliveryError: string | null = null;
  try {
    await sendSubmissionReply({
      to:              message.email,
      name:            message.name,
      subject:         subject?.trim() || replySubject(source as InboxSource, message.type),
      body:            body.trim(),
      originalMessage: quoted,
      sentBy:          gate.email!,
    });
    delivered = true;
  } catch (err) {
    deliveryError = err instanceof Error ? err.message : 'Send failed';
    logger.error('[inbox reply]', deliveryError);
  }

  const { data: reply, error } = await supabaseServer
    .from('inbox_replies')
    .insert({
      source, ref_id: id, body: body.trim(), sent_by: gate.email!,
      delivered, delivery_error: deliveryError,
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
  await setInboxState(source as InboxSource, id, delivered ? 'replied' : message.status, gate.email!);

  if (!delivered) {
    return NextResponse.json({ error: `The reply could not be emailed: ${deliveryError}`, reply }, { status: 502 });
  }

  return NextResponse.json({ success: true, reply });
}
