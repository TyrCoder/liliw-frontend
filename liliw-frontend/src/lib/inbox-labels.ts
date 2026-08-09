/**
 * How each kind of inbox message is written out in prose.
 *
 * Deliberately separate from lib/inbox.ts: that module imports the server
 * Supabase client, so anything the browser needs cannot live there without
 * dragging the service-role client into the client bundle.
 */

export type InboxSource = 'contact' | 'participation' | 'event';

/**
 * The subject was built as `Re: your ${type} to Liliw Tourism`, which reads as
 * "Re: your tourism to Liliw Tourism" — the type is a category name, not a
 * noun that fits that sentence. These are the phrasings that do.
 */
/**
 * Whole subjects, not fragments with a suffix bolted on. A shared
 * " to Liliw Tourism" tail produced "your offer to volunteer to Liliw
 * Tourism" and "your enquiry about tourism to Liliw Tourism" — each phrase
 * has to be read as a finished line, so each one is written as one.
 */
const TYPE_PHRASE: Record<string, string> = {
  feedback:         'your feedback for Liliw Tourism',
  volunteer:        'your offer to volunteer',
  partnership:      'your partnership enquiry',
  tourism:          'your enquiry about tourism in Liliw',
  cultural_mapping: 'your cultural mapping enquiry',
  artisan_listing:  'your artisan listing request',
  general:          'your message to Liliw Tourism',
};

const TYPE_LABEL: Record<string, string> = {
  feedback: 'Feedback', volunteer: 'Volunteering', partnership: 'Partnership',
  tourism: 'Tourism enquiry', cultural_mapping: 'Cultural mapping',
  artisan_listing: 'Artisan listing', general: 'General',
};

/** The default subject for a reply, e.g. "Re: your offer to volunteer". */
export function replySubject(source: InboxSource, type: string): string {
  // An event response's type is the event's own title, so it is quoted rather
  // than looked up — "Re: your sign-up for Gat Tayaw Festival".
  if (source === 'event') return `Re: your sign-up for ${type}`;
  return `Re: ${TYPE_PHRASE[type] || 'your message to Liliw Tourism'}`;
}

/** The same categories written out for display, e.g. in the reading pane. */
export function typeLabel(source: InboxSource, type: string): string {
  if (source === 'event') return type;
  return TYPE_LABEL[type] || type.replace(/_/g, ' ');
}
