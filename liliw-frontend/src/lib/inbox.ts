import { supabaseServer } from './supabase-server';
export { replySubject, typeLabel } from './inbox-labels';

/**
 * The three doors the public writes to the office through, behind one shape.
 *
 * They were three dashboard tabs backed by three tables with three different
 * column namings — a message meant something different depending on which tab
 * you were looking at, and none of them could be answered. The inbox treats
 * them as one queue, so this is where the differences stop.
 */
export type InboxSource = 'contact' | 'participation' | 'event';

export const INBOX_SOURCES: InboxSource[] = ['contact', 'participation', 'event'];

export interface InboxMessage {
  id: string;                 // composite: `${source}:${refId}`
  source: InboxSource;
  refId: string;
  name: string;
  email: string;
  phone: string;
  type: string;               // feedback / volunteer / the event's title …
  message: string;
  /** Event form answers, which have no single message body. */
  details: { label: string; value: string }[];
  createdAt: string;
  status: string;
  handledBy: string | null;
  handledAt: string | null;
  replies: {
    id: string; body: string; sentBy: string; sentAt: string;
    delivered: boolean; error: string | null;
  }[];
}

/** A source table that has not been created yet is empty, not an error. */
async function safeSelect<T>(run: () => Promise<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  try {
    const { data } = await run();
    return data || [];
  } catch {
    return [];
  }
}

export async function loadInbox(): Promise<InboxMessage[]> {
  const [contact, participation, eventResponses] = await Promise.all([
    safeSelect<Record<string, unknown>>(() => supabaseServer
      .from('community_submissions').select('*')
      .order('created_at', { ascending: false }).limit(200) as never),
    safeSelect<Record<string, unknown>>(() => supabaseServer
      .from('participation_requests').select('*')
      .order('created_at', { ascending: false }).limit(200) as never),
    safeSelect<Record<string, unknown>>(() => supabaseServer
      .from('event_form_responses').select('*, event_forms(event_title, fields)')
      .order('submitted_at', { ascending: false }).limit(200) as never),
  ]);

  const messages: InboxMessage[] = [];

  for (const r of contact) {
    messages.push(blank({
      source: 'contact', refId: String(r.id),
      name: String(r.name || 'Someone'), email: String(r.email || ''),
      phone: String(r.phone || ''), type: String(r.type || 'feedback'),
      message: String(r.message || ''), createdAt: String(r.created_at || ''),
    }));
  }

  for (const r of participation) {
    messages.push(blank({
      source: 'participation', refId: String(r.id),
      name: String(r.full_name || 'Someone'), email: String(r.email || ''),
      phone: String(r.phone || ''), type: String(r.type || 'feedback'),
      message: String(r.message || ''), createdAt: String(r.created_at || ''),
    }));
  }

  for (const r of eventResponses) {
    const form = (r.event_forms || {}) as { event_title?: string; fields?: { id: string; label: string }[] };
    const answers = (r.answers || {}) as Record<string, unknown>;
    // An event response is a set of answers, not a paragraph. They are carried
    // as labelled fields so the reading pane can show the form as filled in
    // rather than a blob of JSON.
    const details = (form.fields || []).map(f => ({
      label: f.label,
      value: Array.isArray(answers[f.id]) ? (answers[f.id] as unknown[]).join(', ') : String(answers[f.id] ?? '—'),
    }));
    messages.push({
      ...blank({
        source: 'event', refId: String(r.id),
        name: String(r.respondent_name || 'Someone'), email: String(r.respondent_email || ''),
        phone: '', type: form.event_title || 'Event sign-up',
        message: '', createdAt: String(r.submitted_at || ''),
      }),
      details,
    });
  }

  // One queue, newest first — the whole point of merging them.
  messages.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  await attachState(messages);
  return messages;
}

function blank(m: Omit<InboxMessage, 'id' | 'details' | 'status' | 'handledBy' | 'handledAt' | 'replies'>): InboxMessage {
  return {
    ...m,
    id: `${m.source}:${m.refId}`,
    details: [],
    status: 'new',
    handledBy: null,
    handledAt: null,
    replies: [],
  };
}

/**
 * State and replies come back in two queries rather than two per message —
 * drawing a 200-row list must not cost 400 round trips.
 */
async function attachState(messages: InboxMessage[]) {
  if (!messages.length) return;
  const ids = messages.map(m => m.refId);

  const [state, replies] = await Promise.all([
    safeSelect<Record<string, unknown>>(() => supabaseServer
      .from('inbox_state').select('*').in('ref_id', ids) as never),
    safeSelect<Record<string, unknown>>(() => supabaseServer
      .from('inbox_replies').select('*').in('ref_id', ids)
      .order('sent_at', { ascending: true }) as never),
  ]);

  // ref_ids are only unique within a source — an event response and a contact
  // message can both be row 3 — so everything is keyed by the pair.
  const stateBy = new Map(state.map(s => [`${s.source}:${s.ref_id}`, s]));
  const repliesBy = new Map<string, InboxMessage['replies']>();
  for (const r of replies) {
    const key = `${r.source}:${r.ref_id}`;
    const list = repliesBy.get(key) || [];
    list.push({
      id: String(r.id), body: String(r.body), sentBy: String(r.sent_by),
      sentAt: String(r.sent_at), delivered: !!r.delivered,
      error: (r.delivery_error as string) ?? null,
    });
    repliesBy.set(key, list);
  }

  for (const m of messages) {
    const s = stateBy.get(m.id);
    if (s) {
      m.status = String(s.status || 'new');
      m.handledBy = (s.handled_by as string) ?? null;
      m.handledAt = (s.handled_at as string) ?? null;
    }
    m.replies = repliesBy.get(m.id) || [];
  }
}

/** Reads one message back — used by the reply route to quote the original. */
export async function loadOne(source: InboxSource, refId: string): Promise<InboxMessage | null> {
  const all = await loadInbox();
  return all.find(m => m.source === source && m.refId === refId) ?? null;
}

export async function setInboxState(
  source: InboxSource, refId: string, status: string, handledBy: string | null,
) {
  const patch: Record<string, unknown> = { source, ref_id: refId, status, updated_at: new Date().toISOString() };
  // Opening a message is not the same as taking responsibility for it, so only
  // a deliberate action claims it.
  if (handledBy) {
    patch.handled_by = handledBy;
    patch.handled_at = new Date().toISOString();
  }
  return supabaseServer.from('inbox_state').upsert(patch, { onConflict: 'source,ref_id' });
}
